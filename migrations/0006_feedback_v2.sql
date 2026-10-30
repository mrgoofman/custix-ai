-- Feedback v2 (mrgoofman/custix-ai#16, znerol74/custix#65, ADR-0014):
-- Beschreibung statt Sterne, optionaler geschwärzter Screenshot (privater
-- R2-Bucket `custix-feedback`, Binding FEEDBACK), Kontext der App.
--
-- SQLite kann NOT NULL / CHECK nicht per ALTER lösen, deshalb wird die Tabelle
-- neu aufgebaut. Alte Zeilen bleiben: `comment` wandert nach `description`,
-- `rating` bleibt erhalten (ältere Desktop-Versionen senden es weiter).
-- user_id wird aus der E-Mail nachgetragen, damit /api/feedback/mine auch die
-- alten Einträge eines Kontos findet.
CREATE TABLE feedback_v2 (
  id             TEXT PRIMARY KEY,
  user_id        TEXT,                    -- Better Auth user.id aus der Sitzung; NULL nach DSGVO-Anonymisierung
  user_email     TEXT,                    -- aus der Sitzung (Anzeige im Admin); NULL nach Anonymisierung
  rating         INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5), -- nur alte Desktop-Clients
  description    TEXT,                    -- „Was ist das Problem oder die Idee?“ (≤ 4000 Zeichen)
  screenshot_key TEXT,                    -- R2-Schlüssel im Bucket FEEDBACK; NULL = kein Bild oder gelöscht (90 Tage / DSGVO)
  context_json   TEXT,                    -- {"platform","screen","viewport":{"w","h"},"appVersion"}, serverseitig bereinigt, keine PII
  app_version    TEXT,                    -- z. B. "0.8.0"
  anonymized_at  INTEGER,                 -- gesetzt von anonymizePerson (ADR-0008, ADR-0014)
  created_at     INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO feedback_v2 (id, user_id, user_email, rating, description, screenshot_key, context_json, app_version, anonymized_at, created_at)
SELECT f.id,
       (SELECT u.id FROM "user" u WHERE u.email = f.user_email COLLATE NOCASE LIMIT 1),
       f.user_email,
       f.rating,
       f.comment,
       NULL,
       NULL,
       f.app_version,
       NULL,
       f.created_at
  FROM feedback f;

DROP TABLE feedback;
ALTER TABLE feedback_v2 RENAME TO feedback;

CREATE INDEX ix_feedback_created ON feedback (created_at DESC);
CREATE INDEX ix_feedback_user ON feedback (user_id, created_at DESC) WHERE user_id IS NOT NULL;
-- Für die 90-Tage-Löschung (Cron) nur die Zeilen, die noch ein Bild haben.
CREATE INDEX ix_feedback_screenshot ON feedback (created_at) WHERE screenshot_key IS NOT NULL;
