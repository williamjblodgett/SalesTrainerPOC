-- Evidence integrity, persona/session lineage, and server-private buyer state.

alter table public.transcript_sources drop constraint if exists transcript_sources_retention_mode_check;
alter table public.transcript_sources add constraint transcript_sources_retention_mode_check
  check (retention_mode in ('redact_then_delete','retain_for_audit','retain_until_deleted'));
alter table public.transcript_sources
  add column if not exists processing_purpose text not null default 'sales_training',
  add column if not exists original_filename text,
  add column if not exists original_mime_type text,
  add column if not exists original_size_bytes bigint,
  add column if not exists scan_completed_at timestamptz;
create unique index if not exists idx_transcript_sources_content_dedup
  on public.transcript_sources (organization_id, content_hash) where deleted_at is null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('transcript-originals', 'transcript-originals', false, 20971520, array['text/plain','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy transcript_originals_manager_select on storage.objects for select to authenticated
  using (bucket_id = 'transcript-originals' and public.has_org_role((storage.foldername(name))[1]::uuid, array['owner','manager']::public.organization_role[]));
create policy transcript_originals_manager_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'transcript-originals' and public.has_org_role((storage.foldername(name))[1]::uuid, array['owner','manager']::public.organization_role[]));
create policy transcript_originals_manager_delete on storage.objects for delete to authenticated
  using (bucket_id = 'transcript-originals' and public.has_org_role((storage.foldername(name))[1]::uuid, array['owner','manager']::public.organization_role[]));

drop policy if exists transcript_sources_select on public.transcript_sources;
drop policy if exists transcript_segments_select on public.transcript_segments;
drop policy if exists persona_drafts_select on public.persona_drafts;
drop policy if exists persona_source_links_select on public.persona_source_links;
drop policy if exists persona_versions_select on public.persona_versions;
create policy transcript_sources_manager_select on public.transcript_sources for select
  using (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]));
create policy transcript_segments_manager_select on public.transcript_segments for select
  using (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]));
create policy persona_drafts_manager_select on public.persona_drafts for select
  using (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]));
create policy persona_source_links_manager_select on public.persona_source_links for select
  using (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]));
create policy persona_versions_manager_select on public.persona_versions for select
  using (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]));

alter table public.persona_claim_reviews drop constraint if exists persona_claim_reviews_disposition_check;
alter table public.persona_claim_reviews add constraint persona_claim_reviews_disposition_check
  check (disposition in ('accepted','edited','rejected'));
alter table public.persona_claim_reviews add column if not exists replacement_claim text;

create table public.persona_evidence_claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  persona_draft_id uuid not null references public.persona_drafts(id) on delete cascade,
  claim_id text not null,
  transcript_source_id uuid not null references public.transcript_sources(id) on delete cascade,
  turn_id text not null,
  claim_type text not null,
  claim text not null,
  excerpt text not null,
  char_start integer not null check (char_start >= 0),
  char_end integer not null check (char_end > char_start),
  origin text not null check (origin in ('observed','inferred','manager_authored','industry_template')),
  confidence numeric not null check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (persona_draft_id, claim_id)
);
create index idx_persona_evidence_claims_source on public.persona_evidence_claims(transcript_source_id, turn_id);
alter table public.persona_evidence_claims enable row level security;
create policy persona_evidence_claims_manager_select on public.persona_evidence_claims for select
  using (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]));
create policy persona_evidence_claims_manage on public.persona_evidence_claims for all
  using (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]));

create or replace function public.create_persona_draft_with_lineage(
  p_organization_id uuid, p_industry_id text, p_retention_mode text, p_draft jsonb, p_sources jsonb,
  p_idempotency_key text, p_model text, p_input_tokens integer, p_output_tokens integer, p_latency_ms integer
) returns uuid language plpgsql security invoker set search_path = public as $$
declare
  new_draft_id uuid; source_record jsonb; turn_record jsonb; claim_record jsonb; new_source_id uuid; claim_source_id uuid;
begin
  if not public.has_org_role(p_organization_id, array['owner','manager']::public.organization_role[]) then raise exception 'manager access required'; end if;
  if jsonb_array_length(p_sources) < 1 then raise exception 'at least one source required'; end if;
  select id into new_draft_id from public.persona_drafts where organization_id = p_organization_id and idempotency_key = p_idempotency_key;
  if new_draft_id is not null then return new_draft_id; end if;
  insert into public.persona_drafts (organization_id, created_by, industry_id, status, structured_data, evidence_coverage, source_count, idempotency_key)
  values (p_organization_id, auth.uid(), p_industry_id, 'ai_generated', p_draft, (p_draft->>'evidenceCoverage')::numeric, jsonb_array_length(p_sources), p_idempotency_key)
  returning id into new_draft_id;
  for source_record in select value from jsonb_array_elements(p_sources) loop
    insert into public.transcript_sources (
      organization_id, created_by, external_source_id, title, provider, consent_status, retention_mode, storage_path,
      content_hash, status, consent_attested_at, consent_attested_by, pii_findings, scanner_status,
      original_filename, original_mime_type, original_size_bytes, scan_completed_at
    ) values (
      p_organization_id, auth.uid(), source_record->>'sourceId', source_record->>'title', coalesce(source_record->>'provider','paste'),
      source_record->>'consentStatus', p_retention_mode, source_record->>'storagePath', source_record->>'contentHash', 'complete', now(), auth.uid(),
      coalesce(source_record->'piiFindings','[]'::jsonb), coalesce(source_record->>'scannerStatus','not_applicable'),
      source_record->>'originalFilename', source_record->>'originalMimeType', nullif(source_record->>'originalSizeBytes','')::bigint,
      case when source_record->>'scannerStatus' = 'passed' then now() else null end
    ) returning id into new_source_id;
    for turn_record in select value from jsonb_array_elements(source_record->'turns') loop
      insert into public.transcript_segments (organization_id, transcript_source_id, turn_id, sequence, speaker, content)
      values (p_organization_id, new_source_id, turn_record->>'turnId', (turn_record->>'sequence')::integer, turn_record->>'speaker', turn_record->>'content');
    end loop;
    insert into public.persona_source_links (organization_id, persona_draft_id, transcript_source_id) values (p_organization_id, new_draft_id, new_source_id);
  end loop;
  for claim_record in select value from jsonb_array_elements(p_draft->'evidenceClaims') loop
    select s.id into claim_source_id from public.transcript_sources s join public.persona_source_links l on l.transcript_source_id = s.id
    where l.persona_draft_id = new_draft_id and s.external_source_id = claim_record->>'sourceId';
    if claim_source_id is null then raise exception 'claim source is not part of persona draft'; end if;
    insert into public.persona_evidence_claims (organization_id, persona_draft_id, claim_id, transcript_source_id, turn_id, claim_type, claim, excerpt, char_start, char_end, origin, confidence)
    values (p_organization_id, new_draft_id, claim_record->>'id', claim_source_id, claim_record->>'turnId', claim_record->>'claimType', claim_record->>'claim', claim_record->>'excerpt', (claim_record->>'charStart')::integer, (claim_record->>'charEnd')::integer, claim_record->>'origin', (claim_record->>'confidence')::numeric);
  end loop;
  insert into public.usage_events (organization_id, user_id, operation_type, model, input_tokens, output_tokens, latency_ms)
  values (p_organization_id, auth.uid(), 'persona_synthesis', p_model, p_input_tokens, p_output_tokens, p_latency_ms);
  return new_draft_id;
end;
$$;

alter table public.persona_versions
  add column if not exists evidence_manifest jsonb not null default '[]'::jsonb,
  add column if not exists content_hash text,
  add column if not exists model_version text,
  add column if not exists prompt_version text;
alter table public.persona_drafts add column if not exists persona_id uuid references public.personas(id) on delete set null;
alter table public.scenario_versions add column if not exists persona_version_id uuid references public.persona_versions(id);
alter table public.sessions
  add column if not exists persona_version_id uuid references public.persona_versions(id),
  add column if not exists seller_level text not null default 'new_rep'
    check (seller_level in ('new_rep','experienced_rep','manager','vp'));
update public.sessions s set persona_version_id = sv.persona_version_id
from public.scenario_versions sv where sv.id = s.scenario_version_id and s.persona_version_id is null;

create table public.buyer_session_states (
  session_id uuid primary key references public.sessions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  state_version integer not null default 1,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.buyer_session_states enable row level security;
-- No browser-facing policies: state is accessed only through server-controlled RPCs.

create table public.data_deletion_audits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  target_type text not null,
  target_hash text not null,
  deleted_by uuid not null references auth.users(id),
  deleted_at timestamptz not null default now()
);
alter table public.data_deletion_audits enable row level security;
create policy data_deletion_audits_manager_select on public.data_deletion_audits for select
  using (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]));

alter table public.manager_score_overrides
  add column if not exists supersedes_override_id uuid references public.manager_score_overrides(id),
  add column if not exists effective_weighted_score integer check (effective_weighted_score between 0 and 100);

create or replace function public.prevent_session_lineage_mutation()
returns trigger language plpgsql as $$
begin
  if old.scenario_version_id is distinct from new.scenario_version_id
     or old.persona_version_id is distinct from new.persona_version_id
     or old.user_id is distinct from new.user_id then
    raise exception 'session lineage is immutable';
  end if;
  return new;
end;
$$;
drop trigger if exists immutable_session_lineage on public.sessions;
create trigger immutable_session_lineage before update on public.sessions
for each row execute function public.prevent_session_lineage_mutation();

create or replace function public.publish_persona_draft(draft_id uuid)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  draft public.persona_drafts; target_persona_id uuid; next_version integer; manifest jsonb; snapshot_hash text;
begin
  select * into draft from public.persona_drafts where id = draft_id for update;
  if draft.id is null or draft.status <> 'approved' then raise exception 'approved persona draft required'; end if;
  if not public.has_org_role(draft.organization_id, array['owner','manager']::public.organization_role[]) then raise exception 'manager access required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('claimId', c.claim_id, 'sourceId', c.transcript_source_id, 'turnId', c.turn_id, 'excerpt', c.excerpt, 'charStart', c.char_start, 'charEnd', c.char_end, 'origin', c.origin, 'disposition', r.disposition, 'replacementClaim', r.replacement_claim) order by c.claim_id), '[]'::jsonb)
  into manifest from public.persona_evidence_claims c join public.persona_claim_reviews r on r.persona_draft_id = c.persona_draft_id and r.claim_id = c.claim_id
  where c.persona_draft_id = draft.id and r.disposition in ('accepted','edited');
  if jsonb_array_length(manifest) = 0 then raise exception 'at least one accepted claim is required'; end if;
  target_persona_id := draft.persona_id;
  if target_persona_id is null then
    insert into public.personas (organization_id, name, structured_data) values (draft.organization_id, draft.structured_data->'identity'->>'name', draft.structured_data) returning id into target_persona_id;
    next_version := 1;
  else
    if not exists (select 1 from public.personas where id = target_persona_id and organization_id = draft.organization_id) then raise exception 'persona not found'; end if;
    select coalesce(max(version),0) + 1 into next_version from public.persona_versions where persona_id = target_persona_id;
    update public.personas set name = draft.structured_data->'identity'->>'name', structured_data = draft.structured_data where id = target_persona_id;
  end if;
  snapshot_hash := encode(digest(draft.structured_data::text || manifest::text, 'sha256'), 'hex');
  insert into public.persona_versions (organization_id, persona_id, version, structured_data, source_draft_id, published_by, evidence_manifest, content_hash, prompt_version)
  values (draft.organization_id, target_persona_id, next_version, draft.structured_data, draft.id, auth.uid(), manifest, snapshot_hash, 'persona-v2');
  update public.persona_drafts set status = 'published', persona_id = target_persona_id, updated_at = now() where id = draft.id;
  return target_persona_id;
end;
$$;

create or replace function public.persist_buyer_turn(
  p_session_id uuid, p_organization_id uuid, p_expected_state_version integer, p_idempotency_key text,
  p_seller_content text, p_buyer_content text, p_next_state jsonb, p_event jsonb,
  p_model text, p_input_tokens integer, p_output_tokens integer, p_latency_ms integer
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  practice_session public.sessions; current_state public.buyer_session_states; seller_turn public.session_turns; buyer_turn public.session_turns; next_sequence integer;
begin
  select * into practice_session from public.sessions where id = p_session_id and organization_id = p_organization_id for update;
  if practice_session.id is null then raise exception 'session not found'; end if;
  if practice_session.user_id <> auth.uid() and not public.has_org_role(p_organization_id, array['owner','manager']::public.organization_role[]) then raise exception 'session access denied'; end if;
  select * into seller_turn from public.session_turns where session_id = p_session_id and idempotency_key = p_idempotency_key;
  if seller_turn.id is not null then
    select * into buyer_turn from public.session_turns where session_id = p_session_id and sequence = seller_turn.sequence + 1;
    return jsonb_build_object('turnId', buyer_turn.id, 'message', buyer_turn.content, 'duplicate', true);
  end if;
  if practice_session.status <> 'active' then raise exception 'session is not active'; end if;
  select * into current_state from public.buyer_session_states where session_id = p_session_id for update;
  if current_state.state_version <> p_expected_state_version then raise exception 'session state conflict'; end if;
  select coalesce(max(sequence), 0) + 1 into next_sequence from public.session_turns where session_id = p_session_id;
  insert into public.session_turns (organization_id, session_id, sequence, role, content, idempotency_key)
  values (p_organization_id, p_session_id, next_sequence, 'seller', p_seller_content, p_idempotency_key) returning * into seller_turn;
  insert into public.session_turns (organization_id, session_id, sequence, role, content)
  values (p_organization_id, p_session_id, next_sequence + 1, 'buyer', p_buyer_content) returning * into buyer_turn;
  update public.buyer_session_states set state = p_next_state, state_version = state_version + 1, updated_at = now() where session_id = p_session_id;
  insert into public.session_events (organization_id, session_id, type, data) values (p_organization_id, p_session_id, 'buyer_state_transition', p_event);
  insert into public.usage_events (organization_id, user_id, session_id, scenario_version_id, operation_type, model, input_tokens, output_tokens, latency_ms)
  values (p_organization_id, practice_session.user_id, p_session_id, practice_session.scenario_version_id, 'buyer_turn', p_model, p_input_tokens, p_output_tokens, p_latency_ms);
  return jsonb_build_object('turnId', buyer_turn.id, 'message', buyer_turn.content, 'duplicate', false, 'stateVersion', current_state.state_version + 1);
end;
$$;
revoke all on function public.persist_buyer_turn(uuid,uuid,integer,text,text,text,jsonb,jsonb,text,integer,integer,integer) from public;
grant execute on function public.persist_buyer_turn(uuid,uuid,integer,text,text,text,jsonb,jsonb,text,integer,integer,integer) to authenticated;

-- Existing AI-generated records were created before the evidence contract and must be reviewed again.
update public.persona_drafts set status = 'in_review', updated_at = now()
where status in ('ai_generated','approved') and created_at < now();

create or replace function public.prevent_persona_version_mutation()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' and current_setting('app.allow_governed_persona_delete', true) = 'on' then return old; end if;
  raise exception 'published persona versions are immutable';
end;
$$;

create or replace function public.delete_transcript_source_with_lineage(p_source_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  source_org uuid; draft_ids uuid[]; version_ids uuid[]; scenario_ids uuid[]; target_hash text;
begin
  select organization_id, content_hash into source_org, target_hash from public.transcript_sources where id = p_source_id for update;
  if source_org is null then raise exception 'source not found'; end if;
  if not public.has_org_role(source_org, array['owner','manager']::public.organization_role[]) then raise exception 'manager access required'; end if;
  select coalesce(array_agg(persona_draft_id), '{}') into draft_ids from public.persona_source_links where transcript_source_id = p_source_id;
  select coalesce(array_agg(id), '{}') into version_ids from public.persona_versions where source_draft_id = any(draft_ids);
  select coalesce(array_agg(distinct scenario_id), '{}') into scenario_ids from public.scenario_versions where persona_version_id = any(version_ids);
  delete from public.sessions where persona_version_id = any(version_ids);
  delete from public.assignments where scenario_version_id in (select id from public.scenario_versions where persona_version_id = any(version_ids));
  delete from public.scenario_versions where persona_version_id = any(version_ids);
  delete from public.scenarios s where s.id = any(scenario_ids) and not exists (select 1 from public.scenario_versions v where v.scenario_id = s.id);
  perform set_config('app.allow_governed_persona_delete', 'on', true);
  delete from public.persona_versions where id = any(version_ids);
  delete from public.personas p where not exists (select 1 from public.persona_versions v where v.persona_id = p.id);
  delete from public.persona_drafts where id = any(draft_ids);
  delete from public.transcript_sources where id = p_source_id;
  insert into public.data_deletion_audits (organization_id, target_type, target_hash, deleted_by)
  values (source_org, 'transcript_source', target_hash, auth.uid());
end;
$$;
revoke all on function public.delete_transcript_source_with_lineage(uuid) from public;
grant execute on function public.delete_transcript_source_with_lineage(uuid) to authenticated;
