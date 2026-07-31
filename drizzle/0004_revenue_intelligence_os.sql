CREATE TABLE IF NOT EXISTS revenue_calls (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  title TEXT NOT NULL,
  account_name TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  consent_status TEXT NOT NULL,
  status TEXT NOT NULL,
  transcript_text TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS revenue_assets (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  call_id TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL,
  content_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  call_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  label TEXT NOT NULL,
  confidence REAL NOT NULL,
  evidence TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_edges (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  call_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS intelligence_signals (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  owner_department TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deletion_requests (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  scope TEXT NOT NULL,
  target_id TEXT NOT NULL,
  status TEXT NOT NULL,
  delete_after TEXT NOT NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS revenue_calls_idempotency_idx ON revenue_calls(organization_id, idempotency_key);
CREATE INDEX IF NOT EXISTS revenue_calls_org_idx ON revenue_calls(organization_id, created_at);
CREATE INDEX IF NOT EXISTS revenue_assets_call_idx ON revenue_assets(organization_id, call_id, created_at);
CREATE INDEX IF NOT EXISTS knowledge_nodes_call_idx ON knowledge_nodes(organization_id, call_id, node_type);
CREATE INDEX IF NOT EXISTS knowledge_edges_call_idx ON knowledge_edges(organization_id, call_id, created_at);
CREATE INDEX IF NOT EXISTS intelligence_signals_status_idx ON intelligence_signals(organization_id, status, created_at);
CREATE INDEX IF NOT EXISTS deletion_requests_status_idx ON deletion_requests(organization_id, status, created_at);
