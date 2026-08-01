CREATE TABLE IF NOT EXISTS connector_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  call_id TEXT,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  error_code TEXT
);

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  source_event_id TEXT,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  cursor TEXT,
  result_json TEXT NOT NULL,
  next_attempt_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS graph_entities (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  canonical_label TEXT NOT NULL,
  normalized_label TEXT NOT NULL,
  evidence_count INTEGER NOT NULL,
  call_count INTEGER NOT NULL,
  avg_confidence REAL NOT NULL,
  status TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS graph_entity_evidence (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  call_id TEXT NOT NULL,
  confidence REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS graph_merge_candidates (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  canonical_entity_id TEXT NOT NULL,
  candidate_entity_id TEXT NOT NULL,
  similarity REAL NOT NULL,
  status TEXT NOT NULL,
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS computed_intelligence_signals (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  data_scope TEXT NOT NULL,
  signal_key TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  owner_department TEXT NOT NULL,
  status TEXT NOT NULL,
  evidence_count INTEGER NOT NULL,
  confidence REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS computed_signal_evidence (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  signal_id TEXT NOT NULL,
  entity_id TEXT,
  call_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS demo_runs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  call_id TEXT NOT NULL,
  template_key TEXT NOT NULL,
  label TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deletion_tasks (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  system_name TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  last_error TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  operation TEXT NOT NULL,
  window_start TEXT NOT NULL,
  request_count INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS connector_events_external_idx ON connector_events(organization_id, provider, external_event_id);
CREATE INDEX IF NOT EXISTS connector_events_status_idx ON connector_events(organization_id, status, received_at);
CREATE INDEX IF NOT EXISTS ingestion_jobs_status_idx ON ingestion_jobs(organization_id, status, next_attempt_at);
CREATE UNIQUE INDEX IF NOT EXISTS graph_entities_key_idx ON graph_entities(organization_id, entity_type, normalized_label);
CREATE UNIQUE INDEX IF NOT EXISTS graph_entity_evidence_node_idx ON graph_entity_evidence(organization_id, node_id);
CREATE UNIQUE INDEX IF NOT EXISTS graph_merge_pair_idx ON graph_merge_candidates(organization_id, canonical_entity_id, candidate_entity_id);
CREATE UNIQUE INDEX IF NOT EXISTS computed_signal_key_idx ON computed_intelligence_signals(organization_id, data_scope, signal_key);
CREATE INDEX IF NOT EXISTS computed_signal_status_idx ON computed_intelligence_signals(organization_id, data_scope, status, updated_at);
CREATE UNIQUE INDEX IF NOT EXISTS demo_runs_call_idx ON demo_runs(organization_id, call_id);
CREATE INDEX IF NOT EXISTS deletion_tasks_request_idx ON deletion_tasks(organization_id, request_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS rate_limit_bucket_idx ON rate_limit_buckets(organization_id, actor, operation, window_start);
