"""
Synthetisiert die UI-Tonebene der Feed-Cuts nach public/sfx/.

Warum synthetisiert und nicht gesampelt: die Tonebene ist bewusst minimal
(Ticks, Klicks, kurze Bestätigungstöne). Das lässt sich exakt erzeugen, klingt
konsistent, weil alles aus derselben Tonleiter kommt, und ist lizenzfrei.

Alle Töne liegen auf einer Pentatonik um C5 – dadurch wirken sie wie eine
Familie und nicht wie zusammengesuchte Effekte.

    python3 scripts/make-sfx.py
"""
import numpy as np
import wave
import pathlib

SR = 48_000
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "sfx"
OUT.mkdir(parents=True, exist_ok=True)

# Pentatonik um C5 – hell genug für "digital", ohne schrill zu werden
C5, D5, E5, G5, A5, C6 = 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5


def t(dur):
    return np.linspace(0, dur, int(SR * dur), endpoint=False)


def env(n, attack=0.004, decay=0.12, curve=4.0):
    """Weicher Anschlag, exponentieller Abfall. Kein harter Transient."""
    a = int(SR * attack)
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a) ** 0.6
    tail = np.linspace(0, 1, max(n - a, 1))
    e[a:] = np.exp(-curve * tail / max(decay, 1e-6) * decay * 3)
    return e


def sine(freq, dur, **kw):
    x = t(dur)
    return np.sin(2 * np.pi * freq * x) * env(len(x), **kw)


def noise(dur, lo=None, hi=None):
    n = int(SR * dur)
    x = np.random.default_rng(7).standard_normal(n)
    if lo or hi:
        spec = np.fft.rfft(x)
        f = np.fft.rfftfreq(n, 1 / SR)
        mask = np.ones_like(f)
        if lo:
            mask *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
        if hi:
            mask *= 1 / (1 + (np.maximum(f, 1) / hi) ** 4)
        x = np.fft.irfft(spec * mask, n)
    return x / (np.abs(x).max() + 1e-9)


def tail(sig, delay=0.055, feedback=0.34, taps=4):
    """Billiger Nachhall: ein paar abklingende Kopien. Gibt Raum, keine Halle."""
    out = sig.copy()
    d = int(SR * delay)
    for i in range(1, taps + 1):
        shifted = np.zeros_like(out)
        if d * i < len(out):
            shifted[d * i:] = sig[: len(sig) - d * i]
        out += shifted * (feedback ** i)
    return out


def mix(base, sig, offset=0.0):
    """Signal an Position addieren, ohne dass Längen exakt passen müssen."""
    out = base.copy()
    off = int(SR * offset)
    end = min(off + len(sig), len(out))
    if end > off:
        out[off:end] += sig[: end - off]
    return out


def save(name, sig, peak=0.72):
    sig = np.asarray(sig, dtype=np.float64)
    m = np.abs(sig).max()
    if m > 0:
        sig = sig / m * peak
    # 3 ms Aus-Fade gegen Knackser am Dateiende
    f = min(int(SR * 0.003), len(sig))
    if f:
        sig[-f:] *= np.linspace(1, 0, f)
    data = (np.clip(sig, -1, 1) * 32767).astype("<i2")
    with wave.open(str(OUT / name), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f"  {name:22s} {len(sig)/SR:5.2f}s")


# --- Klick: kurzer Rauschimpuls plus tiefer Körper ------------------------
click = noise(0.035, lo=900, hi=6500) * env(int(SR * 0.035), 0.0008, 0.02, 9)
click = mix(click, sine(240, 0.035, attack=0.0008, decay=0.02, curve=9) * 0.5)
save("click.wav", click)

# --- Kopiert: zwei weiche Blips, aufwärts --------------------------------
copied = np.zeros(int(SR * 0.42))
for i, fr in enumerate((G5, C6)):
    s = tail(sine(fr, 0.20, attack=0.005, decay=0.10, curve=5), 0.045, 0.25, 3)
    off = int(SR * 0.10 * i)
    copied[off:off + len(s)] += s * (1.0 - 0.15 * i)
save("copied.wav", copied)

# --- Tick beim Ersetzen: trocken, digital --------------------------------
swap = sine(1180, 0.10, attack=0.001, decay=0.035, curve=8)
swap = mix(swap, noise(0.10, lo=2000, hi=9000) * env(int(SR * 0.10), 0.001, 0.015, 12) * 0.35)
save("tick-swap.wav", swap)

# --- Tick beim Zurücksetzen: wärmer, tiefer ------------------------------
restore = tail(sine(E5, 0.16, attack=0.003, decay=0.08, curve=5), 0.04, 0.22, 3)
save("tick-restore.wav", restore)

# --- Scan: leiser Ticker über 4,4 s, dazu ein steigendes Rauschband -------
dur = 4.4
n = int(SR * dur)
scan = noise(dur, lo=300, hi=2600) * 0.10
scan *= np.linspace(0.5, 1.0, n) ** 2
for i in range(int(dur / 0.30)):
    tk = sine(A5 if i % 4 == 3 else E5, 0.05, attack=0.001, decay=0.02, curve=9)
    off = int(SR * 0.30 * i)
    scan[off:off + len(tk)] += tk * 0.30
scan[: int(SR * 0.12)] *= np.linspace(0, 1, int(SR * 0.12))
scan[-int(SR * 0.25):] *= np.linspace(1, 0, int(SR * 0.25))
save("scan.wav", scan, peak=0.55)

# --- Einfügen: kurzes Absetzen, Tonhöhe fällt ----------------------------
x = t(0.14)
paste = np.sin(2 * np.pi * np.cumsum(np.linspace(900, 480, len(x))) / SR)
paste *= env(len(x), 0.002, 0.06, 6)
save("paste.wav", tail(paste, 0.05, 0.2, 2))

# --- Senden: knapper Whoosh ----------------------------------------------
dur = 0.26
x = t(dur)
send = noise(dur, lo=500, hi=4000) * (np.linspace(0.2, 1, len(x)) ** 2)
send *= env(len(x), 0.03, 0.12, 3)
send = mix(send, sine(G5, dur, attack=0.02, decay=0.10, curve=4) * 0.25)
save("send.wav", send, peak=0.5)

# --- PDF landet: weicher Aufsetzer ---------------------------------------
drop = sine(165, 0.22, attack=0.002, decay=0.09, curve=5)
drop = mix(drop, sine(330, 0.14, attack=0.002, decay=0.05, curve=7) * 0.35)
drop = mix(drop, noise(0.05, lo=600, hi=3000) * env(int(SR * 0.05), 0.001, 0.02, 10) * 0.25)
save("file-drop.wav", drop)

# --- Gespeichert: zwei Töne, ruhige Auflösung ----------------------------
saved = np.zeros(int(SR * 0.75))
for i, fr in enumerate((E5, A5)):
    s = tail(sine(fr, 0.42, attack=0.006, decay=0.22, curve=4), 0.06, 0.3, 4)
    off = int(SR * 0.13 * i)
    saved[off:off + len(s)] += s * (1.0 - 0.2 * i)
save("saved.wav", saved, peak=0.6)

# --- Warnung im Hook: tief, kein Alarm -----------------------------------
dur = 0.55
warn = sine(138, dur, attack=0.02, decay=0.28, curve=3)
warn = mix(warn, sine(139.6, dur, attack=0.02, decay=0.28, curve=3) * 0.7)  # Schwebung
warn = mix(warn, sine(276, dur, attack=0.03, decay=0.16, curve=4) * 0.18)
save("flash.wav", warn, peak=0.55)

# --- Tippen: sparsame Anschläge, unregelmäßig ----------------------------
def typing(dur, gap=0.115, jitter=0.05, seed=3, level=0.7):
    rng = np.random.default_rng(seed)
    out = np.zeros(int(SR * dur))
    pos = 0.05
    while pos < dur - 0.06:
        k = noise(0.03, lo=1200, hi=7000) * env(int(SR * 0.03), 0.0006, 0.012, 12)
        k = mix(k, sine(rng.uniform(190, 260), 0.03, attack=0.0006, decay=0.012, curve=12) * 0.4)
        off = int(SR * pos)
        out[off:off + len(k)] += k * rng.uniform(0.6, 1.0) * level
        pos += gap + rng.uniform(-jitter, jitter)
    return out

save("typing-hook.wav", typing(3.15), peak=0.45)
save("typing-ai.wav", typing(2.7, gap=0.075, jitter=0.03, seed=11, level=0.5), peak=0.32)

# --- Musikbett: tiefe Fläche, langsamer Puls, geht nirgendwo hin ----------
dur = 37.0
x = t(dur)
bed = np.zeros(len(x))
for fr, amp in ((65.41, 1.0), (98.0, 0.55), (130.81, 0.30), (196.0, 0.13)):
    drift = 1 + 0.0012 * np.sin(2 * np.pi * 0.05 * x + fr)
    bed += np.sin(2 * np.pi * fr * x * drift) * amp
lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.045 * x - np.pi / 2)
bed *= 0.55 + 0.45 * lfo
for i in range(int(dur / 2.4)):
    p = tail(sine(C5, 0.7, attack=0.05, decay=0.34, curve=3), 0.09, 0.3, 4)
    off = int(SR * 2.4 * i)
    end = min(off + len(p), len(bed))
    bed[off:end] += p[: end - off] * 0.11
bed[: int(SR * 1.5)] *= np.linspace(0, 1, int(SR * 1.5))
bed[-int(SR * 2.0):] *= np.linspace(1, 0, int(SR * 2.0))
save("music-bed.wav", bed, peak=0.5)

print(f"\nGeschrieben nach {OUT}")
