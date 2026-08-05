begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

select has_table('public', 'transcript_sources', 'transcript sources exist');
select has_table('public', 'transcript_segments', 'normalized segments exist');
select has_table('public', 'persona_drafts', 'persona drafts exist');
select has_table('public', 'persona_source_links', 'source links exist');
select has_table('public', 'persona_claim_reviews', 'claim reviews exist');
select has_table('public', 'persona_evidence_claims', 'authoritative evidence claims exist');
select has_table('public', 'buyer_session_states', 'private buyer state exists');
select is((select relrowsecurity from pg_class where oid = 'public.transcript_sources'::regclass), true, 'transcript source RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.persona_drafts'::regclass), true, 'persona draft RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.buyer_session_states'::regclass), true, 'buyer state RLS enabled');

insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-000000000001', 'owner-a@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'owner-b@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'rep-a@example.test');
insert into public.organizations (id, name, slug) values
  ('20000000-0000-0000-0000-000000000001', 'Tenant A', 'pgtap-tenant-a'),
  ('20000000-0000-0000-0000-000000000002', 'Tenant B', 'pgtap-tenant-b');
insert into public.memberships (organization_id, user_id, role) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'owner'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'rep');
insert into public.personas (id, organization_id, name) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Persona A'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Persona B');
insert into public.transcript_sources (id, organization_id, created_by, title, provider, consent_status, retention_mode, content_hash, status) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Call A', 'upload', 'synthetic', 'retain_until_deleted', 'hash-a', 'complete'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Call B', 'upload', 'synthetic', 'retain_until_deleted', 'hash-b', 'complete');
insert into public.persona_drafts (id, organization_id, created_by, industry_id, status, structured_data, evidence_coverage, source_count) values
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'test', 'approved', '{}', 1, 1),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'test', 'approved', '{}', 1, 1);
insert into public.persona_versions (id, organization_id, persona_id, version, structured_data, source_draft_id, published_by) values
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 1, '{}', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 1, '{}', '50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002');

select throws_ok(
  $$ update public.persona_versions set structured_data = '{"changed":true}' where id = '60000000-0000-0000-0000-000000000001' $$,
  'P0001',
  'published persona versions are immutable',
  'published versions reject mutation'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((select count(*)::integer from public.organizations), 1, 'owner sees only their organization');
select is((select count(*)::integer from public.personas), 1, 'owner sees only their personas');
select is((select count(*)::integer from public.transcript_sources), 1, 'owner sees only their transcript sources');
select is((select count(*)::integer from public.persona_drafts), 1, 'owner sees only their persona drafts');
select is((select count(*)::integer from public.persona_versions), 1, 'owner sees only their persona versions');
select is((select count(*)::integer from public.buyer_session_states), 0, 'browser roles cannot read private buyer state');
select throws_ok(
  $$ insert into public.personas (organization_id, name) values ('20000000-0000-0000-0000-000000000002', 'Cross tenant') $$,
  '42501',
  'new row violates row-level security policy for table "personas"',
  'owner cannot insert into another tenant'
);

select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select is((select count(*)::integer from public.transcript_sources), 0, 'rep cannot read transcript sources');
select is((select count(*)::integer from public.transcript_segments), 0, 'rep cannot read transcript segments');
select is((select count(*)::integer from public.persona_drafts), 0, 'rep cannot read private persona drafts');
select is((select count(*)::integer from public.persona_versions), 0, 'rep cannot read private persona versions');

select * from finish();
rollback;
