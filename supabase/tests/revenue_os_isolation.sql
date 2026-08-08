begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

select has_table('public', 'revenue_calls', 'revenue calls exist');
select has_table('public', 'evidence_observations', 'evidence observations exist');
select has_table('public', 'knowledge_entities', 'knowledge graph entities exist');
select has_table('public', 'revenue_assets', 'revenue assets exist');
select has_table('public', 'connector_connections', 'connectors exist');
select has_table('public', 'connector_sync_jobs', 'connector sync jobs exist');
select is((select relrowsecurity from pg_class where oid = 'public.revenue_calls'::regclass), true, 'call RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.revenue_assets'::regclass), true, 'asset RLS enabled');

insert into auth.users (id, email) values
  ('71000000-0000-0000-0000-000000000001', 'revenue-owner-a@example.test'),
  ('71000000-0000-0000-0000-000000000002', 'revenue-owner-b@example.test');
insert into public.organizations (id, name, slug) values
  ('72000000-0000-0000-0000-000000000001', 'Revenue Tenant A', 'revenue-pgtap-a'),
  ('72000000-0000-0000-0000-000000000002', 'Revenue Tenant B', 'revenue-pgtap-b');
insert into public.memberships (organization_id, user_id, role) values
  ('72000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', 'owner'),
  ('72000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', 'owner');
insert into public.revenue_calls (id, organization_id, provider, title, consent_status, idempotency_key, created_by) values
  ('73000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000001', 'upload', 'Tenant A call', 'synthetic', 'call-a', '71000000-0000-0000-0000-000000000001'),
  ('73000000-0000-0000-0000-000000000002', '72000000-0000-0000-0000-000000000002', 'upload', 'Tenant B call', 'synthetic', 'call-b', '71000000-0000-0000-0000-000000000002');
insert into public.revenue_assets (organization_id, call_id, asset_type, title, department, created_by) values
  ('72000000-0000-0000-0000-000000000001', '73000000-0000-0000-0000-000000000001', 'customer_persona', 'Tenant A asset', 'Sales', '71000000-0000-0000-0000-000000000001'),
  ('72000000-0000-0000-0000-000000000002', '73000000-0000-0000-0000-000000000002', 'customer_persona', 'Tenant B asset', 'Sales', '71000000-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"71000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((select count(*)::integer from public.revenue_calls), 1, 'owner sees one tenant call');
select is((select count(*)::integer from public.revenue_assets), 1, 'owner sees one tenant asset');
select is((select title from public.revenue_calls limit 1), 'Tenant A call', 'owner sees own call');
select throws_ok($$ insert into public.revenue_calls (organization_id, provider, title, consent_status, idempotency_key) values ('72000000-0000-0000-0000-000000000002', 'upload', 'Cross tenant', 'synthetic', 'cross') $$, '42501', 'new row violates row-level security policy for table "revenue_calls"', 'cross-tenant call insert blocked');
select throws_ok($$ insert into public.connector_connections (organization_id, provider) values ('72000000-0000-0000-0000-000000000002', 'gong') $$, '42501', 'new row violates row-level security policy for table "connector_connections"', 'cross-tenant connector insert blocked');
select is((select count(*)::integer from public.connector_connections), 0, 'owner sees no foreign connectors');
select is((select count(*)::integer from public.enterprise_identity_configs), 0, 'owner sees no foreign identity configs');

select * from finish();
rollback;
