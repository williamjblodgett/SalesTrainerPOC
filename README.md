# SalesSim

SalesSim is an AI-powered B2B sales-training SaaS. Managers configure structured sales concepts, publish immutable scenarios, and review evidence-backed evaluations. Reps practice discovery calls with an AI buyer.

## Stack

Next.js App Router, strict TypeScript, React, Tailwind CSS, Supabase Auth/Postgres/RLS, Zod, OpenAI JavaScript SDK/Responses API, Vitest, and Playwright.

## Local setup

1. Install Node 20+ and pnpm 10+.
2. Copy `.env.example` to `.env.local` and fill Supabase values, or retain `AI_PROVIDER=mock` for credential-free AI behavior.
3. Run the SQL migration with `supabase db reset` or in a local Supabase project.
4. Run `pnpm install` and `pnpm dev`.
5. Open `http://localhost:3000/app` for the seeded demo.

## Commands

- `pnpm dev` — local app
- `pnpm typecheck` — strict TypeScript
- `pnpm lint` — ESLint
- `pnpm test` — unit/contract tests
- `pnpm test:e2e` — Playwright tests
- `pnpm build` — production build

## Environment

See `.env.example`. OpenAI model IDs are independently configurable for compiler, buyer, evaluator, and later Realtime voice. API keys are server-only.

## Current limitations

The first repository slice supplies the complete deterministic UI/domain demonstration and production-oriented schema. Supabase-backed authentication and persistence adapters, real OpenAI calls, manager score override UI, deletion workflows, and voice are tracked in `docs/TASKS.md`.
