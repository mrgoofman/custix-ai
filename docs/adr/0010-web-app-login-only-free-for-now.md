# Web-App vorerst ohne Lizenzprüfung: Login genügt, Nutzung kostenlos

**Status:** Accepted (Entscheidung Lorenz, 27.09.2026) · **Betrifft:** Web-App unter custix.ai/app,
Website (Ärzte-Landingpage, Konto) · **Umsetzung:** znerol74/custix#39, mrgoofman/custix-ai#9

Die Web-App verlangt vorerst nur den Login (Better-Auth-Konto). Lizenzschlüssel, Lizenzprüfung
und Bezahlung entfallen dort; die Nutzung ist kostenlos. Die Desktop-App bleibt beim bisherigen
Modell (Lizenz, monatliche Validierung, Sperre nach Ablauf).

## Why / context

- Die Ärzte-Landingpage soll an Testärztinnen und -ärzte gegeben werden, bevor Bezahlung und
  Preisgestaltung für die Web-App feststehen. Ein Konto pro Nutzer bleibt sinnvoll (Ansprache,
  spätere Umstellung auf Bezahlung, Missbrauchsgrenze), eine Lizenz nicht.
- Das widerspricht bewusst der Aussage in CONTEXT.md, dass eine License beide Clients abdeckt
  („no separate web plan"), und dem Spec-Punkt „gleiche Lizenz, gleicher Preis" in
  mrgoofman/custix-ai#5. Beides gilt für die Desktop-App weiter; für die Web-App ist es bis zur
  Bezahl-Phase ausgesetzt.

## Consequences

- Web-App (custix-Repo): nach dem Login startet die App ohne Schlüsselphase und ohne Aufrufe von
  `/api/license/*`; kein „gesperrt"-Zustand. Nur im Web-Build, Desktop unverändert.
- Website: Die Ärzte-Seite führt direkt in die Web-App und nennt keinen Preis („derzeit
  kostenlos"). `/konto` legt weiterhin die 14-Tage-Testlizenz für die Desktop-App an und zeigt
  Testphase und Abo; ein Hinweis, dass die Web-App unabhängig davon nutzbar ist, steht noch aus.
- Die Lizenz-Endpunkte bleiben bestehen, damit die Prüfung im Web mit der Bezahl-Phase wieder
  eingeschaltet werden kann. Dann ist dieses ADR zu ersetzen.
