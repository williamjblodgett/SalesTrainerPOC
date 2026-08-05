alter table public.transcript_sources
  add column if not exists external_source_id text,
  add column if not exists consent_attested_at timestamptz,
  add column if not exists consent_attested_by uuid references auth.users(id),
  add column if not exists pii_findings jsonb not null default '[]'::jsonb,
  add column if not exists scanner_status text not null default 'not_applicable';

alter table public.persona_drafts add column if not exists idempotency_key text;
create unique index if not exists idx_persona_drafts_idempotency
  on public.persona_drafts (organization_id, idempotency_key)
  where idempotency_key is not null;

create unique index if not exists idx_transcript_sources_external
  on public.transcript_sources (organization_id, external_source_id)
  where external_source_id is not null and deleted_at is null;

create table public.persona_claim_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  persona_draft_id uuid not null references public.persona_drafts(id) on delete cascade,
  claim_id text not null,
  disposition text not null check (disposition in ('accepted','rejected')),
  rationale text,
  reviewed_by uuid not null references auth.users(id),
  reviewed_at timestamptz not null default now(),
  unique (persona_draft_id, claim_id)
);

alter table public.persona_claim_reviews enable row level security;
create policy persona_claim_reviews_select on public.persona_claim_reviews for select using (public.is_org_member(organization_id));
create policy persona_claim_reviews_manage on public.persona_claim_reviews for all
  using (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]));

create or replace function public.create_persona_draft_with_lineage(
  p_organization_id uuid,
  p_industry_id text,
  p_retention_mode text,
  p_draft jsonb,
  p_sources jsonb,
  p_idempotency_key text,
  p_model text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_latency_ms integer
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  new_draft_id uuid;
  source_record jsonb;
  turn_record jsonb;
  new_source_id uuid;
begin
  if not public.has_org_role(p_organization_id, array['owner','manager']::public.organization_role[]) then
    raise exception 'manager access required';
  end if;
  if jsonb_array_length(p_sources) < 1 then raise exception 'at least one source required'; end if;

  select id into new_draft_id from public.persona_drafts
  where organization_id = p_organization_id and idempotency_key = p_idempotency_key;
  if new_draft_id is not null then return new_draft_id; end if;

  insert into public.persona_drafts (organization_id, created_by, industry_id, status, structured_data, evidence_coverage, source_count, idempotency_key)
  values (p_organization_id, auth.uid(), p_industry_id, 'ai_generated', p_draft, (p_draft->>'evidenceCoverage')::numeric, jsonb_array_length(p_sources), p_idempotency_key)
  returning id into new_draft_id;

  for source_record in select value from jsonb_array_elements(p_sources) loop
    insert into public.transcript_sources (
      organization_id, created_by, external_source_id, title, provider, consent_status, retention_mode,
      content_hash, status, consent_attested_at, consent_attested_by, pii_findings, scanner_status
    ) values (
      p_organization_id, auth.uid(), source_record->>'sourceId', source_record->>'title', coalesce(source_record->>'provider','paste'),
      source_record->>'consentStatus', p_retention_mode, source_record->>'contentHash', 'complete', now(), auth.uid(),
      coalesce(source_record->'piiFindings','[]'::jsonb), coalesce(source_record->>'scannerStatus','not_applicable')
    ) returning id into new_source_id;

    for turn_record in select value from jsonb_array_elements(source_record->'turns') loop
      insert into public.transcript_segments (organization_id, transcript_source_id, turn_id, sequence, speaker, content)
      values (p_organization_id, new_source_id, turn_record->>'turnId', (turn_record->>'sequence')::integer, turn_record->>'speaker', turn_record->>'content');
    end loop;
    insert into public.persona_source_links (organization_id, persona_draft_id, transcript_source_id)
    values (p_organization_id, new_draft_id, new_source_id);
  end loop;

  insert into public.usage_events (organization_id, user_id, operation_type, model, input_tokens, output_tokens, latency_ms)
  values (p_organization_id, auth.uid(), 'persona_synthesis', p_model, p_input_tokens, p_output_tokens, p_latency_ms);
  return new_draft_id;
end;
$$;

revoke all on function public.create_persona_draft_with_lineage(uuid,text,text,jsonb,jsonb,text,text,integer,integer,integer) from public;
grant execute on function public.create_persona_draft_with_lineage(uuid,text,text,jsonb,jsonb,text,text,integer,integer,integer) to authenticated;

create or replace function public.delete_transcript_source_with_lineage(p_source_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare source_org uuid;
begin
  select organization_id into source_org from public.transcript_sources where id = p_source_id for update;
  if source_org is null then raise exception 'source not found'; end if;
  if not public.has_org_role(source_org, array['owner','manager']::public.organization_role[]) then raise exception 'manager access required'; end if;
  delete from public.transcript_sources where id = p_source_id;
  update public.persona_drafts d set status = 'in_review', updated_at = now()
  where d.organization_id = source_org and d.status <> 'published'
    and not exists (select 1 from public.persona_source_links l where l.persona_draft_id = d.id);
end;
$$;

revoke all on function public.delete_transcript_source_with_lineage(uuid) from public;
grant execute on function public.delete_transcript_source_with_lineage(uuid) to authenticated;
