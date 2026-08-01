CREATE TABLE IF NOT EXISTS connector_connections (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  mode TEXT NOT NULL,
  scopes_json TEXT NOT NULL,
  last_synced_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS asset_reviews (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  reviewer TEXT NOT NULL,
  decision TEXT NOT NULL,
  rationale TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS advisor_actions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  signal_id TEXT,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  owner_department TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  result_json TEXT NOT NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS revenue_audit_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS connector_connections_provider_idx ON connector_connections(organization_id, provider);
CREATE INDEX IF NOT EXISTS asset_reviews_asset_idx ON asset_reviews(organization_id, asset_id, created_at);
CREATE INDEX IF NOT EXISTS advisor_actions_status_idx ON advisor_actions(organization_id, status, created_at);
CREATE INDEX IF NOT EXISTS revenue_audit_events_entity_idx ON revenue_audit_events(organization_id, entity_type, entity_id, created_at);
