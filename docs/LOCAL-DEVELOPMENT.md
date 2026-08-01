# Local development

Use Node 20+, pnpm, and the Supabase CLI. Copy `.env.example`, run the initial migration, then `pnpm dev`. Keep `AI_PROVIDER=mock` for deterministic behavior. Real-provider work requires a server-only `OPENAI_API_KEY` and configured model variables.

The Next.js application is the canonical local surface. The Sites worker entry is `dist/server/index.js`; it requires a D1 binding named `DB` and an optional R2 binding named `UPLOADS`. Its visible routes are `/`, `/app`, `/demo`, and `/legacy`.

For a controlled connector test, set test-only `CONNECTOR_WEBHOOK_SECRET` and sign `{timestamp}.{raw JSON body}` with HMAC-SHA256. Do not reuse production secrets. `DELETION_PROCESSOR_SECRET` authorizes only the due-request processor and must be different from connector and OpenAI secrets.

Synthetic Demo Lab data does not require OpenAI or provider credentials. Use `/api/revenue-os/demo/reset` to remove it; do not manually delete individual D1 rows because the reset also rebuilds graph state and intelligence signals.
