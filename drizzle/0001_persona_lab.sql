CREATE TABLE IF NOT EXISTS personas (id TEXT PRIMARY KEY, name TEXT NOT NULL, title TEXT NOT NULL, seniority TEXT NOT NULL, industry TEXT NOT NULL, difficulty TEXT NOT NULL, source TEXT NOT NULL, status TEXT NOT NULL, data_json TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS transcript_sources (id TEXT PRIMARY KEY, file_name TEXT NOT NULL, content_type TEXT NOT NULL, retention TEXT NOT NULL, status TEXT NOT NULL, evidence_json TEXT NOT NULL, persona_id TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rubrics (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL, data_json TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS personas_created_idx ON personas(created_at);
CREATE INDEX IF NOT EXISTS transcripts_persona_idx ON transcript_sources(persona_id, created_at);
