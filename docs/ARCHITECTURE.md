# Architecture

Completed evaluations create a prioritized coaching item and a focused retest drill from the lowest-scoring criterion. Leader dashboards aggregate D1 records at request time. Certification, calibration, appeals, outcome snapshots, usage limits, and audit events remain separate business records.

PDF/DOCX ingestion uses OpenAI Responses API file inputs only when a server-side key is present. Text and pasted transcripts retain deterministic extraction. The API returns a typed error instead of implying a binary document was parsed when the provider is unavailable.

SalesSim is a modular monolith. App Router owns UI and HTTP boundaries; `lib/domain` owns versioned contracts and deterministic scoring; `lib/ai` owns provider interfaces; Supabase owns auth, persistence, and tenant enforcement.

The canonical application now uses Supabase SSR sessions, a proxy-based cookie refresh boundary, server-side organization context, and an atomic `create_organization` database function. The hosted D1 worker remains available during migration, but new production workflows should be implemented in the Next.js/Supabase surface and ported behind typed repositories before the worker UI is retired.

Role authorization is duplicated intentionally at two boundaries: server code controls route and action behavior, while Postgres RLS provides the final tenant and role enforcement. Owners manage members and billing; managers own content and coaching workflows; reps can practice and read their own evidence.

`ScenarioSpec` partitions data into `repVisible`, `buyerHidden`, and `evaluatorOnly`. Practice responses are constructed with `toPracticeBrief`; private partitions are loaded only in server code. Published versions are immutable and sessions always reference their exact version.

The primary flow is onboarding → structured scenario → immutable publication → session/turns → formal completion → one post-call evaluation → deterministic weighted score → evidence-first results.
