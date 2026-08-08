create or replace function public.publish_scenario_draft(
  p_organization_id uuid,
  p_scenario_id uuid,
  p_idempotency_key text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  latest_version public.scenario_versions;
  existing_id uuid;
  published_id uuid;
begin
  if auth.uid() is null or not public.has_org_role(p_organization_id, array['owner','manager']::public.organization_role[]) then
    raise exception 'manager access required';
  end if;
  if nullif(trim(p_idempotency_key), '') is null or length(p_idempotency_key) > 200 then
    raise exception 'valid idempotency key required';
  end if;
  select id into existing_id from public.scenario_versions
  where organization_id = p_organization_id and idempotency_key = p_idempotency_key;
  if existing_id is not null then return existing_id; end if;
  select * into latest_version from public.scenario_versions
  where organization_id = p_organization_id and scenario_id = p_scenario_id
  order by version desc limit 1 for update;
  if latest_version.id is null then raise exception 'scenario draft not found'; end if;
  if latest_version.published_at is not null then return latest_version.id; end if;
  if latest_version.persona_version_id is null or not exists (
    select 1 from public.persona_versions where id = latest_version.persona_version_id and organization_id = p_organization_id
  ) then raise exception 'governed persona version required'; end if;
  insert into public.scenario_versions (
    organization_id, scenario_id, version, scenario_spec, source,
    approved_by, published_at, idempotency_key, persona_version_id
  ) values (
    p_organization_id, p_scenario_id, latest_version.version + 1,
    latest_version.scenario_spec, latest_version.source, auth.uid(), now(),
    p_idempotency_key, latest_version.persona_version_id
  ) returning id into published_id;
  update public.scenarios set status = 'published'
  where id = p_scenario_id and organization_id = p_organization_id;
  return published_id;
end;
$$;

revoke all on function public.publish_scenario_draft(uuid, uuid, text) from public;
grant execute on function public.publish_scenario_draft(uuid, uuid, text) to authenticated;
