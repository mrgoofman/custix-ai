"use client";

import { useEffect, useRef } from "react";

/**
 * Startet, sobald das Video im Sichtfeld ist, und pausiert beim Verlassen.
 * Deckt damit auch den „So funktioniert's"-Button ab: der springt zum
 * Abschnitt, das Video kommt ins Bild, der Rest passiert von selbst.
 *
 * Ton bleibt aus – ohne `muted` verweigert jeder Browser den Autostart.
 * Die Videos haben ohnehin keine Tonspur.
 */
export function AutoplayVideo({
  src,
  poster,
  className,
  preload = "none",
}: {
  src: string;
  poster: string;
  className?: string;
  /** Im Hero "auto": das Video steht sofort im Bild und soll ohne Warten starten. */
  preload?: "none" | "metadata" | "auto";
}) {
  const ref = useRef<HTMLVideoElement>(null);
  /** Hat der Nutzer selbst pausiert? Dann nicht wieder ungefragt starten. */
  const pausedByUser = useRef(false);
  /** Unterscheidet unser eigenes pause() vom Klick auf die Pausetaste. */
  const pausingOurselves = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.preload = preload;

    // Wer reduzierte Bewegung eingestellt hat, bekommt keinen Autostart.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const onPause = () => {
      if (pausingOurselves.current) {
        pausingOurselves.current = false;
        return;
      }
      if (!el.ended) pausedByUser.current = true;
    };
    const onPlay = () => {
      pausedByUser.current = false;
    };
    el.addEventListener("pause", onPause);
    el.addEventListener("play", onPlay);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!pausedByUser.current && el.paused && !el.ended) {
            el.play().catch(() => {
              /* Autostart abgelehnt – dann bleibt das Vorschaubild stehen. */
            });
          }
        } else if (!el.paused) {
          pausingOurselves.current = true;
          el.pause();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      el.removeEventListener("pause", onPause);
      el.removeEventListener("play", onPlay);
    };
  }, [preload]);

  return (
    <video
      ref={ref}
      className={className}
      controls
      muted
      playsInline
      preload="none"
      poster={poster}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
