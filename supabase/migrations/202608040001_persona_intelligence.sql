create table public.transcript_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  provider text not null default 'upload',
  consent_status text not null check (consent_status in ('confirmed','synthetic','quarantined')),
  retention_mode text not null check (retention_mode in ('redact_then_delete','retain_for_audit')),
  storage_path text,
  content_hash text not null,
  status text not null default 'pending' check (status in ('pending','processing','needs_review','complete','failed','deleted')),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  transcript_source_id uuid not null references public.transcript_sources(id) on delete cascade,
  turn_id text not null,
  sequence integer not null,
  speaker text not null check (speaker in ('seller','buyer','unknown')),
  content text not null,
  started_at_ms integer,
  created_at timestamptz not null default now(),
  unique (transcript_source_id, turn_id),
  unique (transcript_source_id, sequence)
);

create table public.persona_drafts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  industry_id text not null,
  status text not null default 'ai_generated' check (status in ('ai_generated','in_review','approved','published')),
  structured_data jsonb not null,
  evidence_coverage numeric not null check (evidence_coverage between 0 and 1),
  source_count integer not null check (source_count > 0),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.persona_source_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  persona_draft_id uuid not null references public.persona_drafts(id) on delete cascade,
  transcript_source_id uuid not null references public.transcript_sources(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (persona_draft_id, transcript_source_id)
);

create table public.persona_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete cascade,
  version integer not null,
  structured_data jsonb not null,
  source_draft_id uuid references public.persona_drafts(id),
  published_by uuid not null references auth.users(id),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (persona_id, version)
);

create index idx_transcript_sources_org_created on public.transcript_sources (organization_id, created_at desc);
create index idx_transcript_segments_source_sequence on public.transcript_segments (transcript_source_id, sequence);
create index idx_persona_drafts_org_status on public.persona_drafts (organization_id, status, created_at desc);
create index idx_persona_source_links_source on public.persona_source_links (transcript_source_id);
create index idx_persona_versions_persona on public.persona_versions (persona_id, version desc);

alter table public.transcript_sources enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.persona_drafts enable row level security;
alter table public.persona_source_links enable row level security;
alter table public.persona_versions enable row level security;

create policy transcript_sources_select on public.transcript_sources for select using (public.is_org_member(organization_id));
create policy transcript_sources_manage on public.transcript_sources for all
  using (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]));
create policy transcript_segments_select on public.transcript_segments for select using (public.is_org_member(organization_id));
create policy transcript_segments_manage on public.transcript_segments for all
  using (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]));
create policy persona_drafts_select on public.persona_drafts for select using (public.is_org_member(organization_id));
create policy persona_drafts_manage on public.persona_drafts for all
  using (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]));
create policy persona_source_links_select on public.persona_source_links for select using (public.is_org_member(organization_id));
create policy persona_source_links_manage on public.persona_source_links for all
  using (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]));
create policy persona_versions_select on public.persona_versions for select using (public.is_org_member(organization_id));
create policy persona_versions_insert on public.persona_versions for insert
  with check (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]));

create or replace function public.prevent_persona_version_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'published persona versions are immutable';
end;
$$;

create trigger immutable_persona_version
before update or delete on public.persona_versions
for each row execute function public.prevent_persona_version_mutation();

create or replace function public.publish_persona_draft(draft_id uuid)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  draft public.persona_drafts;
  new_persona_id uuid;
begin
  select * into draft from public.persona_drafts where id = draft_id for update;
  if draft.id is null or draft.status <> 'approved' then raise exception 'approved persona draft required'; end if;
  if not public.has_org_role(draft.organization_id, array['owner','manager']::public.organization_role[]) then raise exception 'manager access required'; end if;
  insert into public.personas (organization_id, name, structured_data)
  values (draft.organization_id, draft.structured_data->'identity'->>'name', draft.structured_data)
  returning id into new_persona_id;
  insert into public.persona_versions (organization_id, persona_id, version, structured_data, source_draft_id, published_by)
  values (draft.organization_id, new_persona_id, 1, draft.structured_data, draft.id, auth.uid());
  update public.persona_drafts set status = 'published', updated_at = now() where id = draft.id;
  return new_persona_id;
end;
$$;

revoke all on function public.publish_persona_draft(uuid) from public;
grant execute on function public.publish_persona_draft(uuid) to authenticated;
