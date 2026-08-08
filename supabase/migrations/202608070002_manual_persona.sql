create or replace function public.create_manual_persona(
  p_organization_id uuid,
  p_structured_data jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_persona_id uuid;
  persona_name text;
begin
  if not public.has_org_role(p_organization_id, array['owner','manager']::public.organization_role[]) then
    raise exception 'manager access required';
  end if;
  persona_name := nullif(trim(p_structured_data->'identity'->>'name'), '');
  if persona_name is null then raise exception 'persona name required'; end if;
  insert into public.personas (organization_id, name, structured_data)
  values (p_organization_id, persona_name, p_structured_data)
  returning id into new_persona_id;
  insert into public.persona_versions (
    organization_id, persona_id, version, structured_data, published_by,
    evidence_manifest, content_hash, prompt_version
  ) values (
    p_organization_id, new_persona_id, 1, p_structured_data, auth.uid(),
    jsonb_build_object('source', 'manager_authored', 'reviewedBy', auth.uid()),
    encode(extensions.digest(convert_to(p_structured_data::text, 'UTF8'), 'sha256'), 'hex'),
    'manual-persona-v1'
  );
  return new_persona_id;
end;
$$;

revoke all on function public.create_manual_persona(uuid, jsonb) from public;
grant execute on function public.create_manual_persona(uuid, jsonb) to authenticated;
