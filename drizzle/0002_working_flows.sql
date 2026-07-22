CREATE TABLE IF NOT EXISTS practice_sessions (
  id TEXT PRIMARY KEY,
  persona_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  next_sequence INTEGER NOT NULL DEFAULT 1,
  turns_json TEXT NOT NULL,
  evaluation_json TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS practice_sessions_id_idx ON practice_sessions(id);
