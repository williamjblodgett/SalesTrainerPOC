# Testing

`pnpm test` covers schemas, rubric totals, hidden-data filtering, authorization invariants, mock contracts, and deterministic scoring. `pnpm typecheck`, `pnpm lint`, and `pnpm build` are release gates. Database/RLS tests should run against disposable local Supabase projects. Live-model tests remain behind `RUN_LIVE_AI_TESTS=true`.
