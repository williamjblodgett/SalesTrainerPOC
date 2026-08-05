begin;
select plan(8);

select has_table('public', 'transcript_sources', 'transcript sources exist');
select has_table('public', 'transcript_segments', 'normalized segments exist');
select has_table('public', 'persona_drafts', 'persona drafts exist');
select has_table('public', 'persona_source_links', 'source links exist');
select has_table('public', 'persona_claim_reviews', 'claim reviews exist');
select is((select relrowsecurity from pg_class where oid = 'public.transcript_sources'::regclass), true, 'transcript source RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.persona_drafts'::regclass), true, 'persona draft RLS enabled');
select throws_ok(
  $$ update public.persona_versions set version = version + 1 where true $$,
  'published persona versions are immutable',
  'published versions reject mutation'
);

select * from finish();
rollback;
