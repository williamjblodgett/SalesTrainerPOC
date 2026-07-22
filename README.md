# Suadence

Suadence is an AI-powered B2B sales-training workspace: “Practice the conversation before it counts.” Sales leaders can build realistic buyer personas from structured metrics or transcript evidence, tune difficulty from new-hire through VP-level conversations, run text or voice practice, and review evidence-backed evaluations.

The internal product name remains isolated so the brand can be changed without rewriting domain logic.

## Stack

Next.js App Router, strict TypeScript, React, Tailwind CSS, Supabase Auth/Postgres/RLS, Zod, OpenAI JavaScript SDK/Responses API, Vitest, and Playwright.

## Local setup

1. Install Node 20+ and pnpm 10+.
2. Copy `.env.example` to `.env.local` and fill Supabase values, or retain `AI_PROVIDER=mock` for credential-free AI behavior.
3. Run the SQL migration with `supabase db reset` or in a local Supabase project.
4. Run `pnpm install` and `pnpm dev`.
5. Open `http://localhost:3000/app` for the seeded demo.

The deployable Sites worker in `dist/server/index.js` includes a persistent D1-backed persona lab and transcript workspace. It can store retained source files in R2 when the manager explicitly selects that option.

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

The hosted demo uses deterministic transcript extraction and buyer behavior unless OpenAI credentials are configured. TXT and pasted transcript text can be analyzed directly; PDF and DOCX files are accepted for the review workflow but require a production document-text extraction adapter. Browser speech recognition/synthesis provides a credential-free voice fallback, while the server-mediated OpenAI Realtime path requires `OPENAI_API_KEY`. Supabase authentication, full tenant persistence, deletion workflows, and production score overrides remain tracked in `docs/TASKS.md`.

See `docs/SALES-LEADER-RESEARCH.md` for the current product research synthesis and `output/pdf/suadence-capabilities.pdf` for the one-page capability brief.
