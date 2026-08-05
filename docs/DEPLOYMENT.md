# Canonical deployment

The canonical application is the Next.js server build deployed to Vercel with Supabase Auth, Postgres, RLS, and private Storage. GitHub Pages remains a fixture-only public demonstration, and the Sites/D1 deployment remains a private compatibility preview.

## GitHub environments

The repository has `preview`, `production`, and `supabase-staging` environments. The canonical deployment workflow is manually dispatched so production promotion is intentional. Configure these environment secrets:

- `preview` and `production`: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `supabase-staging`: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`

Configure the runtime values in Vercel rather than GitHub. Required production values are checked by `pnpm check:production-env`:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_SCENARIO_MODEL`, `OPENAI_PERSONA_MODEL`, `OPENAI_BUYER_MODEL`, `OPENAI_EVALUATOR_MODEL`, `OPENAI_REALTIME_MODEL`
- `AI_PROVIDER=openai`
- `DOCUMENT_SCANNER_MODE=cloudmersive`
- `CLOUDMERSIVE_API_KEY`
- `ENABLE_REALTIME_VOICE=false` until the text benchmark passes
- `TEXT_REALISM_BENCHMARK_STATUS=pending` until the approved calibration report passes

The Supabase workflow first links the explicitly supplied staging project and performs a migration dry run. It applies migrations and runs `supabase test db --linked` only when `apply_migrations` is deliberately selected. Never point that validation workflow at a customer production database.

After a hosted calibration pass and sales-leader naturalness sign-off, set `TEXT_REALISM_BENCHMARK_STATUS=passed`, then enable voice in a separate release with `ENABLE_REALTIME_VOICE=true`. The standard OpenAI key remains server-side.
