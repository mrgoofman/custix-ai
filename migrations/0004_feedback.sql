-- In-app feedback (star rating + free text), submitted from the desktop app and
-- shown in the admin panel. user_email is captured server-side from the Better
-- Auth session, not trusted from the client. No FK to user (a user row may be
-- anonymized later); email is kept as a plain attribution string.
CREATE TABLE feedback (
  id          TEXT PRIMARY KEY,
  user_email  TEXT,                       -- from session; NULL if somehow unauthenticated
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,                       -- optional free text
  app_version TEXT,                       -- e.g. "0.3.1"
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX ix_feedback_created ON feedback (created_at DESC);
