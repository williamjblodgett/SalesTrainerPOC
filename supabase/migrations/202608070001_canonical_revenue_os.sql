-- Canonical Revenue OS evidence, graph, asset, connector, and enterprise identity foundation.

create table public.revenue_calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  transcript_source_id uuid references public.transcript_sources(id) on delete set null,
  provider text not null check (provider in ('upload','gong','chorus','zoom','teams','salesforce','api')),
  external_id text,
  title text not null,
  account_name text not null default '',
  consent_status text not null check (consent_status in ('confirmed','synthetic')),
  status text not null default 'processing' check (status in ('processing','ready','failed','retracted')),
  occurred_at timestamptz,
  idempotency_key text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  unique (organization_id, provider, external_id)
);

create table public.evidence_observations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  call_id uuid not null references public.revenue_calls(id) on delete cascade,
  turn_id text not null,
  speaker text not null,
  observation_type text not null check (observation_type in ('pain','symptom','impact','objection','priority','stakeholder','decision_process','competitor','language','outcome')),
  claim text not null,
  excerpt text not null,
  confidence numeric not null check (confidence between 0 and 1),
  status text not null default 'candidate' check (status in ('candidate','approved','rejected','retracted')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.knowledge_entities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('contact','account','role','pain','objection','priority','product','competitor','stakeholder','outcome')),
  canonical_label text not null,
  normalized_label text not null,
  status text not null default 'candidate' check (status in ('candidate','approved','merged','retracted')),
  evidence_count integer not null default 0,
  distinct_call_count integer not null default 0,
  confidence numeric not null default 0 check (confidence between 0 and 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, entity_type, normalized_label)
);

create table public.knowledge_assertions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subject_entity_id uuid not null references public.knowledge_entities(id) on delete cascade,
  predicate text not null,
  object_entity_id uuid references public.knowledge_entities(id) on delete cascade,
  value jsonb,
  confidence numeric not null check (confidence between 0 and 1),
  status text not null default 'candidate' check (status in ('candidate','approved','conflicted','expired','retracted')),
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (object_entity_id is not null or value is not null)
);

create table public.assertion_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assertion_id uuid not null references public.knowledge_assertions(id) on delete cascade,
  observation_id uuid not null references public.evidence_observations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (assertion_id, observation_id)
);

create table public.revenue_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  call_id uuid references public.revenue_calls(id) on delete set null,
  asset_type text not null,
  title text not null,
  department text not null,
  status text not null default 'planned' check (status in ('planned','insufficient_evidence','review_required','approved','published','changes_requested','rejected','retracted')),
  evidence_coverage numeric not null default 0 check (evidence_coverage between 0 and 1),
  current_version integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.revenue_asset_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.revenue_assets(id) on delete cascade,
  version integer not null,
  content jsonb not null,
  model text not null,
  prompt_version text not null,
  generated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (asset_id, version)
);

create table public.revenue_asset_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_version_id uuid not null references public.revenue_asset_versions(id) on delete cascade,
  observation_id uuid references public.evidence_observations(id) on delete cascade,
  assertion_id uuid references public.knowledge_assertions(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (observation_id is not null or assertion_id is not null)
);

create table public.revenue_asset_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.revenue_assets(id) on delete cascade,
  decision text not null check (decision in ('approved','changes_requested','rejected')),
  rationale text not null default '',
  reviewer_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (decision = 'approved' or length(trim(rationale)) >= 8)
);

create table public.connector_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('gong','chorus','zoom','teams','salesforce')),
  status text not null default 'not_configured' check (status in ('not_configured','authorization_required','connected','degraded','revoked')),
  scopes jsonb not null default '[]'::jsonb,
  external_account_id text,
  token_secret_reference text,
  last_synced_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table public.connector_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connector_id uuid not null references public.connector_connections(id) on delete cascade,
  external_event_id text not null,
  event_type text not null,
  payload_hash text not null,
  status text not null default 'pending' check (status in ('pending','processed','failed','quarantined')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (connector_id, external_event_id)
);

create table public.connector_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connector_id uuid not null references public.connector_connections(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','running','complete','failed','cancelled')),
  cursor jsonb not null default '{}'::jsonb,
  attempts integer not null default 0 check (attempts between 0 and 20),
  idempotency_key text not null,
  next_attempt_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_code text,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table public.enterprise_identity_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  protocol text not null check (protocol in ('saml','oidc','scim')),
  provider_name text not null,
  status text not null default 'draft' check (status in ('draft','verification_required','active','disabled')),
  public_metadata jsonb not null default '{}'::jsonb,
  secret_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, protocol)
);

create index revenue_calls_org_created_idx on public.revenue_calls(organization_id, created_at desc);
create index evidence_observations_call_idx on public.evidence_observations(organization_id, call_id, observation_type);
create index knowledge_entities_org_type_idx on public.knowledge_entities(organization_id, entity_type, updated_at desc);
create index knowledge_assertions_subject_idx on public.knowledge_assertions(organization_id, subject_entity_id, predicate);
create index revenue_assets_org_status_idx on public.revenue_assets(organization_id, status, updated_at desc);
create index revenue_assets_call_idx on public.revenue_assets(organization_id, call_id, asset_type);
create index connector_events_status_idx on public.connector_events(organization_id, status, received_at);
create index connector_sync_jobs_queue_idx on public.connector_sync_jobs(status, next_attempt_at, created_at);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'revenue_calls','evidence_observations','knowledge_entities','knowledge_assertions','assertion_evidence',
    'revenue_assets','revenue_asset_versions','revenue_asset_evidence','revenue_asset_reviews',
    'connector_connections','connector_events','connector_sync_jobs','enterprise_identity_configs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy tenant_select on public.%I for select using (public.is_org_member(organization_id))', table_name);
    execute format('create policy manager_insert on public.%I for insert with check (public.has_org_role(organization_id, array[''owner'',''manager'']::public.organization_role[]))', table_name);
    execute format('create policy manager_update on public.%I for update using (public.has_org_role(organization_id, array[''owner'',''manager'']::public.organization_role[])) with check (public.has_org_role(organization_id, array[''owner'',''manager'']::public.organization_role[]))', table_name);
    execute format('create policy manager_delete on public.%I for delete using (public.has_org_role(organization_id, array[''owner'',''manager'']::public.organization_role[]))', table_name);
  end loop;
end;
$$;

create or replace function public.prevent_revenue_asset_version_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'revenue asset versions are immutable';
end;
$$;
create trigger immutable_revenue_asset_versions before update or delete on public.revenue_asset_versions
for each row execute function public.prevent_revenue_asset_version_mutation();
