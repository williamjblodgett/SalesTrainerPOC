# Local development

Use Node 20+, pnpm, and the Supabase CLI. Copy `.env.example`, run the initial migration, then `pnpm dev`. Keep `AI_PROVIDER=mock` for deterministic behavior. Real-provider work requires a server-only `OPENAI_API_KEY` and configured model variables.
