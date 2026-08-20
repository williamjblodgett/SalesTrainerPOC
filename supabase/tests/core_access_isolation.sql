begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('81000000-0000-0000-0000-000000000001', 'core-owner@example.test'),
  ('81000000-0000-0000-0000-000000000002', 'core-rep@example.test'),
  ('81000000-0000-0000-0000-000000000003', 'other-rep@example.test');
insert into public.organizations (id, name, slug) values
  ('82000000-0000-0000-0000-000000000001', 'Core Tenant', 'core-pgtap');
insert into public.memberships (organization_id, user_id, role) values
  ('82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', 'owner'),
  ('82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000002', 'rep'),
  ('82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000003', 'rep');
insert into public.scenarios (id, organization_id, title, created_by) values
  ('83000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', 'Hidden scenario', '81000000-0000-0000-0000-000000000001');
insert into public.scenario_versions (id, organization_id, scenario_id, version, scenario_spec, published_at) values
  ('84000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000001', 1, '{"buyerHidden":{"secret":"never expose"}}', now());
insert into public.sessions (id, organization_id, scenario_version_id, user_id, status) values
  ('85000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', '84000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000002', 'active'),
  ('85000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000001', '84000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000003', 'active');
insert into public.session_turns (organization_id, session_id, sequence, role, content) values
  ('82000000-0000-0000-0000-000000000001', '85000000-0000-0000-0000-000000000001', 1, 'seller', 'My turn'),
  ('82000000-0000-0000-0000-000000000001', '85000000-0000-0000-0000-000000000002', 1, 'seller', 'Someone else turn');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"81000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select count(*)::integer from public.scenario_versions), 0, 'rep cannot read hidden scenario specs');
select is((select count(*)::integer from public.sessions), 1, 'rep sees only own session');
select is((select count(*)::integer from public.session_turns), 1, 'rep sees only own transcript');
select is((select content from public.session_turns), 'My turn', 'rep transcript belongs to rep');
select is((select count(*)::integer from public.revenue_calls), 0, 'rep cannot read organization revenue calls');
select is((select count(*)::integer from public.evidence_observations), 0, 'rep cannot read organization call evidence');

select set_config('request.jwt.claims', '{"sub":"81000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((select count(*)::integer from public.scenario_versions), 1, 'owner can read governed scenario specs');
select is((select count(*)::integer from public.sessions), 2, 'owner can review team sessions');
select is((select count(*)::integer from public.session_turns), 2, 'owner can review team transcripts');
select is((select count(*)::integer from public.profiles), 3, 'owner can read team display profiles');

select * from finish();
rollback;
