# Suadence Revenue OS

Suadence is a revenue intelligence operating system built around one promise: **one call in, 20 revenue assets out**.

It converts consented calls and transcripts into an organization-scoped knowledge graph, then activates that evidence as customer personas, digital-twin AI buyers, roleplays, playbooks, talk tracks, battle cards, follow-ups, coaching, product and marketing signals, customer-success actions, and executive intelligence.

The product retains the original sales-practice vertical slice while expanding it into a cross-department operating system for Sales, Enablement, Marketing, Product, Customer Success, Revenue Operations, and Leadership.

## Deployments

- Public product preview: [GitHub Pages](https://williamjblodgett.github.io/SalesTrainerPOC/)
- Secure Revenue OS and Synthetic Demo Lab: [hosted application](https://salessim-training-demo.williamjblodgett.chatgpt.site)

GitHub Pages serves the static public narrative. Calls-to-action open the hosted application because authentication, persistence, consent controls, and AI operations require a server runtime.

## Stack

Next.js App Router, strict TypeScript, React, Tailwind CSS, Supabase Auth/Postgres/RLS, Zod, OpenAI JavaScript SDK/Responses API, OpenAI Realtime over WebRTC, Vitest, Playwright, and a D1-backed hosted preview.

## Prerequisites

- Node.js 20+
- pnpm 10+
- A Supabase project for the canonical multi-tenant application
- An OpenAI API key only for provider-backed AI and Realtime voice; mock mode works without credentials

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill the Supabase public values and server-only service role key.
3. Keep `AI_PROVIDER=mock` for deterministic credential-free behavior, or set `OPENAI_API_KEY`.
4. Apply the SQL migrations with `supabase db reset` or in a disposable Supabase project.
5. Run `pnpm install` and `pnpm dev`.
6. Open `http://localhost:3000/app`.

The hosted worker in `dist/server/index.js` serves the category landing page, the interactive Revenue OS workspace, a synthetic Demo Lab at `/demo`, and D1-backed APIs. The previous sales-training workspace remains available at `/legacy` during migration.

## Environment variables

See `.env.example`. OpenAI model IDs are separately configurable for evidence/scenario work, buyer simulation, evaluation, and Realtime voice. Provider and service keys stay server-side.

## Commands

- `pnpm dev` — local application
- `pnpm typecheck` — strict TypeScript
- `pnpm lint` — ESLint
- `pnpm test` — unit and contract tests
- `pnpm test:e2e` — Playwright flows
- `pnpm build` — production build
- `pnpm build:pages` — build the static GitHub Pages preview into `pages-dist`
- `pnpm validate:hosted` — hosted-page logo, pricing, synthetic-label, fallback, and inline-script release checks

## Revenue OS data flow

`connector → consent gate → normalized call → evidence graph → 20-asset factory → approval and routing → outcome feedback`

Every Revenue OS table includes `organization_id`. Organization access is resolved server-side, never from a browser-supplied tenant identifier. Every generated object keeps source lineage and an approval lifecycle. Synthetic Demo Lab records use a separate scope and are excluded from live calls, graph counts, intelligence signals, and Revenue DNA.

## Synthetic Demo Lab

Open `/demo` to generate one fictional transcript or a three-to-six-call synthetic cohort. Each call produces six evidence nodes and exactly 20 review-required revenue assets. Repeated demo patterns generate their own content-gap and product signals without contaminating live intelligence. The whole synthetic dataset can be reset in one governed operation.

## Current limitations

- The hosted private pilot accepts consent-confirmed pasted/TXT evidence and a replay-protected, HMAC-signed normalized connector envelope. Provider-specific OAuth authorization screens, historical backfills, token rotation, and marketplace approval still require customer credentials and external provider configuration.
- The 20 hosted asset outputs and graph extraction use deterministic contracts. Provider-backed structured generation will use the same validated boundaries when credentials are configured.
- Revenue DNA, Knowledge Drift, and Content Gap use deterministic calculations and minimum cross-call evidence thresholds. Outcome calibration still requires representative customer data and approved success metrics.
- The hosted preview derives a single authorized organization server-side. The canonical Next.js/Supabase application owns production authentication, membership resolution, and RLS.
- Security architecture is designed for enterprise review, but SOC 2, SSO/SCIM, regional data residency, a signed DPA, and jurisdiction-specific legal review are roadmap items, not current certifications.
- Pricing is intentionally **TBD**; the public site makes no commercial commitment.

## Documentation

- [Revenue OS strategy](docs/REVENUE-OS-STRATEGY.md)
- [Architecture](docs/ARCHITECTURE.md)
- [AI system](docs/AI-SYSTEM.md)
- [Security](docs/SECURITY.md)
- [Local development](docs/LOCAL-DEVELOPMENT.md)
- [Testing](docs/TESTING.md)
- [Tasks and roadmap](docs/TASKS.md)
- [Sales-leader research](docs/SALES-LEADER-RESEARCH.md)
- [Connector implementation](docs/CONNECTORS.md)
- [Production readiness](docs/PRODUCTION-READINESS.md)
