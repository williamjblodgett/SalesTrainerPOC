create or replace function public.create_organization(
  organization_name text,
  organization_slug text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if length(trim(organization_name)) < 2 then raise exception 'invalid name'; end if;
  if organization_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'invalid slug'; end if;
  insert into public.organizations(name, slug)
  values (trim(organization_name), lower(organization_slug))
  returning id into new_organization_id;
  insert into public.memberships(organization_id, user_id, role)
  values (new_organization_id, auth.uid(), 'owner');
  return new_organization_id;
end;
$$;

revoke all on function public.create_organization(text, text) from public;
grant execute on function public.create_organization(text, text) to authenticated;

create or replace function public.create_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_user();

create policy owner_update_organization on public.organizations
for update using (public.has_org_role(id, array['owner']::public.organization_role[]))
with check (public.has_org_role(id, array['owner']::public.organization_role[]));
create policy owner_delete_organization on public.organizations
for delete using (public.has_org_role(id, array['owner']::public.organization_role[]));

create policy owner_manage_memberships on public.memberships
for all using (public.has_org_role(organization_id, array['owner']::public.organization_role[]))
with check (public.has_org_role(organization_id, array['owner']::public.organization_role[]));

do $$
declare t text;
begin
  foreach t in array array[
    'products','personas','knowledge_sources','playbooks','scenarios',
    'scenario_versions','assignments','assignment_targets','prompt_versions'
  ] loop
    execute format(
      'create policy manager_insert on public.%I for insert with check (public.has_org_role(organization_id, array[''owner'',''manager'']::public.organization_role[]))',
      t
    );
    execute format(
      'create policy manager_update on public.%I for update using (public.has_org_role(organization_id, array[''owner'',''manager'']::public.organization_role[])) with check (public.has_org_role(organization_id, array[''owner'',''manager'']::public.organization_role[]))',
      t
    );
    execute format(
      'create policy manager_delete on public.%I for delete using (public.has_org_role(organization_id, array[''owner'',''manager'']::public.organization_role[]))',
      t
    );
  end loop;
end;
$$;

create policy session_insert_self on public.sessions
for insert with check (
  auth.uid() = user_id and public.is_org_member(organization_id)
);
create policy session_update_self_or_manager on public.sessions
for update using (
  auth.uid() = user_id or
  public.has_org_role(organization_id, array['owner','manager']::public.organization_role[])
);

create policy turn_insert_session_owner on public.session_turns
for insert with check (
  exists (
    select 1 from public.sessions s
    where s.id = session_id and s.organization_id = organization_id
      and (s.user_id = auth.uid() or public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]))
  )
);
create policy event_insert_session_access on public.session_events
for insert with check (
  exists (
    select 1 from public.sessions s
    where s.id = session_id and s.organization_id = organization_id
      and (s.user_id = auth.uid() or public.has_org_role(organization_id, array['owner','manager']::public.organization_role[]))
  )
);

create policy evaluation_manager_insert on public.evaluations
for insert with check (
  public.has_org_role(organization_id, array['owner','manager']::public.organization_role[])
);
create policy usage_insert_member on public.usage_events
for insert with check (public.is_org_member(organization_id));
create policy override_manager_insert on public.manager_score_overrides
for insert with check (
  manager_id = auth.uid() and
  public.has_org_role(organization_id, array['owner','manager']::public.organization_role[])
);
