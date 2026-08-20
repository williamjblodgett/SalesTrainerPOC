create or replace function public.create_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set display_name = coalesce(public.profiles.display_name, excluded.display_name);
  return new;
end;
$$;

insert into public.profiles(id, display_name)
select
  users.id,
  coalesce(nullif(trim(users.raw_user_meta_data->>'display_name'), ''), split_part(users.email, '@', 1))
from auth.users as users
on conflict (id) do nothing;

create policy profiles_shared_organization_select
on public.profiles
for select
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.memberships as viewer
    join public.memberships as subject
      on subject.organization_id = viewer.organization_id
    where viewer.user_id = (select auth.uid())
      and subject.user_id = profiles.id
  )
);

create or replace function public.create_assignment_for_member(
  p_organization_id uuid,
  p_scenario_version_id uuid,
  p_user_id uuid,
  p_due_at timestamptz default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_assignment_id uuid;
begin
  if auth.uid() is null or not public.has_org_role(
    p_organization_id,
    array['owner','manager']::public.organization_role[]
  ) then
    raise exception 'manager access required';
  end if;

  if not exists (
    select 1 from public.scenario_versions
    where id = p_scenario_version_id
      and organization_id = p_organization_id
      and published_at is not null
  ) or not exists (
    select 1 from public.memberships
    where organization_id = p_organization_id
      and user_id = p_user_id
  ) then
    raise exception 'invalid assignment target';
  end if;

  insert into public.assignments(
    organization_id, scenario_version_id, created_by, due_at, status
  ) values (
    p_organization_id, p_scenario_version_id, auth.uid(), p_due_at, 'active'
  ) returning id into new_assignment_id;

  insert into public.assignment_targets(organization_id, assignment_id, user_id)
  values (p_organization_id, new_assignment_id, p_user_id);

  return new_assignment_id;
end;
$$;

revoke all on function public.create_assignment_for_member(uuid, uuid, uuid, timestamptz) from public;
grant execute on function public.create_assignment_for_member(uuid, uuid, uuid, timestamptz) to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'products','personas','knowledge_sources','playbooks','scenario_versions',
    'assignments','assignment_targets','sessions','session_turns','session_events',
    'prompt_versions','evaluations','usage_events','manager_score_overrides'
  ] loop
    execute format('drop policy if exists tenant_select on public.%I', table_name);
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'products','personas','knowledge_sources','playbooks','scenario_versions',
    'prompt_versions','usage_events'
  ] loop
    execute format(
      'create policy manager_tenant_select on public.%I for select using (public.has_org_role(organization_id, array[''owner'',''manager'']::public.organization_role[]))',
      table_name
    );
  end loop;
end;
$$;

create policy assignment_manager_or_target_select
on public.assignments
for select
using (
  public.has_org_role(organization_id, array['owner','manager']::public.organization_role[])
  or exists (
    select 1 from public.assignment_targets as target
    where target.assignment_id = assignments.id
      and target.user_id = (select auth.uid())
  )
);

create policy assignment_target_manager_or_self_select
on public.assignment_targets
for select
using (
  user_id = (select auth.uid())
  or public.has_org_role(organization_id, array['owner','manager']::public.organization_role[])
);

create or replace function public.can_access_session(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sessions as session
    where session.id = target_session_id
      and (
        session.user_id = (select auth.uid())
        or public.has_org_role(session.organization_id, array['owner','manager']::public.organization_role[])
      )
  )
$$;

revoke all on function public.can_access_session(uuid) from public;
grant execute on function public.can_access_session(uuid) to authenticated;

create policy session_owner_or_manager_select
on public.sessions
for select
using (
  user_id = (select auth.uid())
  or public.has_org_role(organization_id, array['owner','manager']::public.organization_role[])
);

create policy session_turn_owner_or_manager_select
on public.session_turns
for select using (public.can_access_session(session_id));

create policy session_event_owner_or_manager_select
on public.session_events
for select using (public.can_access_session(session_id));

create policy evaluation_owner_or_manager_select
on public.evaluations
for select using (public.can_access_session(session_id));

create policy override_owner_or_manager_select
on public.manager_score_overrides
for select
using (
  exists (
    select 1 from public.evaluations as evaluation
    where evaluation.id = manager_score_overrides.evaluation_id
      and public.can_access_session(evaluation.session_id)
  )
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'revenue_calls','evidence_observations','knowledge_entities','knowledge_assertions',
    'assertion_evidence','revenue_assets','revenue_asset_versions',
    'revenue_asset_evidence','revenue_asset_reviews','connector_connections',
    'connector_events','connector_sync_jobs','enterprise_identity_configs'
  ] loop
    execute format('drop policy if exists tenant_select on public.%I', table_name);
    execute format(
      'create policy manager_tenant_select on public.%I for select using (public.has_org_role(organization_id, array[''owner'',''manager'']::public.organization_role[]))',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.record_knowledge_entity_observation(
  p_organization_id uuid,
  p_entity_type text,
  p_canonical_label text,
  p_normalized_label text,
  p_confidence numeric
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  entity_id uuid;
begin
  if auth.uid() is null or not public.has_org_role(
    p_organization_id,
    array['owner','manager']::public.organization_role[]
  ) then
    raise exception 'manager access required';
  end if;
  if p_entity_type not in ('pain','objection','priority','stakeholder','competitor','outcome')
    or nullif(trim(p_normalized_label), '') is null
    or p_confidence < 0 or p_confidence > 1 then
    raise exception 'invalid knowledge observation';
  end if;

  insert into public.knowledge_entities(
    organization_id, entity_type, canonical_label, normalized_label,
    evidence_count, distinct_call_count, confidence, last_seen_at
  ) values (
    p_organization_id, p_entity_type, left(p_canonical_label, 240), left(p_normalized_label, 180),
    1, 1, p_confidence, now()
  )
  on conflict (organization_id, entity_type, normalized_label) do update
  set evidence_count = public.knowledge_entities.evidence_count + 1,
      distinct_call_count = public.knowledge_entities.distinct_call_count + 1,
      confidence = greatest(public.knowledge_entities.confidence, excluded.confidence),
      canonical_label = case
        when excluded.confidence >= public.knowledge_entities.confidence then excluded.canonical_label
        else public.knowledge_entities.canonical_label
      end,
      last_seen_at = now(),
      updated_at = now()
  returning id into entity_id;
  return entity_id;
end;
$$;

revoke all on function public.record_knowledge_entity_observation(uuid, text, text, text, numeric) from public;
grant execute on function public.record_knowledge_entity_observation(uuid, text, text, text, numeric) to authenticated;

alter table public.revenue_calls
  add column if not exists extraction_model text,
  add column if not exists extraction_metadata jsonb not null default '{}'::jsonb;

create or replace function public.review_revenue_asset(
  p_organization_id uuid,
  p_asset_id uuid,
  p_decision text,
  p_rationale text default ''
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  review_id uuid;
begin
  if auth.uid() is null or not public.has_org_role(
    p_organization_id,
    array['owner','manager']::public.organization_role[]
  ) then raise exception 'manager access required'; end if;
  if p_decision not in ('approved','changes_requested','rejected') then
    raise exception 'invalid review decision';
  end if;
  if p_decision <> 'approved' and length(trim(p_rationale)) < 8 then
    raise exception 'review rationale required';
  end if;
  if not exists (
    select 1 from public.revenue_assets
    where id = p_asset_id and organization_id = p_organization_id
  ) then raise exception 'asset not found'; end if;

  insert into public.revenue_asset_reviews(
    organization_id, asset_id, decision, rationale, reviewer_id
  ) values (
    p_organization_id, p_asset_id, p_decision, trim(p_rationale), auth.uid()
  ) returning id into review_id;
  update public.revenue_assets
  set status = p_decision, updated_at = now()
  where id = p_asset_id and organization_id = p_organization_id;
  return review_id;
end;
$$;

revoke all on function public.review_revenue_asset(uuid, uuid, text, text) from public;
grant execute on function public.review_revenue_asset(uuid, uuid, text, text) to authenticated;
