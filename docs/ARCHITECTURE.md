# Architecture

## Deployment surfaces

- `demo/` is the public GitHub Pages application. It uses bundled synthetic fixtures, device-local state, and hash routes so every tab works under the repository subpath.
- `src/app/` is the canonical Next.js application for a server-capable host. Supabase provides authentication, Postgres, RLS, and private storage.
- `public/data/industry-packs.json` is the launch catalog shared by both surfaces.

The Pages bundle never receives OpenAI keys, Supabase service credentials, private scenario partitions, or real customer transcripts.

## Revenue intelligence operating system

The expanded product uses a second vertical pipeline:

`source connector → consent gate → normalized call → evidence extraction → knowledge graph → asset factory → approval/routing → outcome feedback`

Provider adapters normalize Gong, Chorus, Zoom, Teams, Salesforce, and file/API sources into a stable call envelope. Webhook delivery and ingestion are idempotent. The browser never chooses the authorization tenant; server identity and membership resolve `organization_id` before every repository operation.

The knowledge graph is organization-scoped and evidence-first. Nodes model buyer roles, pains, impacts, objections, risks, claims, product capabilities, outcomes, and skills. Edges model relationships such as `causes`, `masks`, `supports`, `contradicts`, and `evidenced_by`. Every inferred object keeps source turn IDs, confidence, freshness, extraction version, and approval state.

The asset factory materializes 20 governed outputs from a compact graph projection. Draft generation never publishes directly. An asset stores lineage, approval state, model/prompt version, intended department, and processing purpose. Outcome events can later update confidence and recommendations without mutating the historical source call.

AI responsibilities remain separated:

1. Evidence Extractor structures calls into candidate graph updates.
2. Asset Generator creates department-specific drafts from approved evidence views.
3. Buyer Actor performs digital-twin simulations without access to evaluation logic.
4. Evaluator scores only completed practice transcripts against immutable rubrics.
5. Advisor ranks proposed actions but cannot publish, message, delete, or change CRM state without a permission-aware command boundary.

The current hosted private pilot uses D1-backed normalized calls, graph records, canonical entities, asset records, computed signals, connector events/jobs, rate buckets, and deletion requests/tasks. The canonical multi-tenant production target remains Next.js with Supabase Postgres/RLS, encrypted connector credentials, an object store for explicitly retained source files, and a durable job queue for ingestion and deletion cascades.

The hosted connector boundary accepts a signed, normalized event rather than embedding provider-specific logic in domain code. Signature verification, replay protection, event idempotency, consent quarantine, call idempotency, extraction, asset generation, graph synchronization, and audit persistence remain separate steps. Configuration checks never claim that a customer has completed provider authorization.

Cross-call intelligence is recomputed from distinct call IDs. A pattern must meet a configurable evidence threshold before it becomes a content-gap, product, or drift signal. Graph labels are normalized into canonical entities; approximate duplicates become merge candidates and require an explicit reviewer decision.

The Synthetic Demo Lab creates fictional calls in a dedicated `demo_runs` scope. Demo calls use the same extraction and 20-asset contracts, but demo records are excluded from live calls, live graph entities, live signals, and Revenue DNA. Reset uses the same lineage-aware deletion function as governed call deletion.

Completed evaluations create a prioritized coaching item and a focused retest drill from the lowest-scoring criterion. Leader dashboards aggregate D1 records at request time. Certification, calibration, appeals, outcome snapshots, usage limits, and audit events remain separate business records.

PDF/DOCX ingestion uses OpenAI Responses API file inputs only when a server-side key is present. Text and pasted transcripts retain deterministic extraction. The API returns a typed error instead of implying a binary document was parsed when the provider is unavailable.

SalesSim is a modular monolith. App Router owns UI and HTTP boundaries; `lib/domain` owns versioned contracts and deterministic scoring; `lib/ai` owns provider interfaces; Supabase owns auth, persistence, and tenant enforcement.

The canonical application now uses Supabase SSR sessions, a proxy-based cookie refresh boundary, server-side organization context, and an atomic `create_organization` database function. The hosted D1 worker remains available during migration, but new production workflows should be implemented in the Next.js/Supabase surface and ported behind typed repositories before the worker UI is retired.

Role authorization is duplicated intentionally at two boundaries: server code controls route and action behavior, while Postgres RLS provides the final tenant and role enforcement. Owners manage members and billing; managers own content and coaching workflows; reps can practice and read their own evidence.

`ScenarioSpec` partitions data into `repVisible`, `buyerHidden`, and `evaluatorOnly`. Practice responses are constructed with `toPracticeBrief`; private partitions are loaded only in server code. Published versions are immutable and sessions always reference their exact version.

The primary flow is onboarding → structured scenario → immutable publication → session/turns → formal completion → one post-call evaluation → deterministic weighted score → evidence-first results.

## Governed revenue workflows

Generated revenue assets begin in `review_required`; generation is not activation. Reviewers inspect source-call metadata and organization-scoped knowledge-node evidence before recording `approved`, `changes_requested`, or `rejected`. Every decision is durable in `asset_reviews`, while current status supports fast dashboard queries. Revenue DNA behavior-readiness and closed-loop-activation components count approved assets only.

`connector_connections` is a provider-neutral health registry. The UI merges that state with a server-defined connector catalog and reports `native`, `oauth_ready`, `manual_pilot`, or `not_configured` honestly. A pilot check does not claim that calls were imported, and credentials are represented only as a boolean capability signal; secrets never enter API responses.

`connector_events` and `ingestion_jobs` form the durable ingestion seam. `graph_entities`, `graph_entity_evidence`, and `graph_merge_candidates` support cross-call memory without destroying source nodes. `computed_intelligence_signals` and `computed_signal_evidence` preserve the threshold, scope, and calls supporting each active pattern. `deletion_tasks` expose which Suadence-controlled systems were erased and which external source confirmations still belong to the customer.

The proactive advisor creates bounded `advisor_actions` with explicit steps, an owning department, and `humanApprovalRequired: true`. V1 advisor actions have no external side effects. Asset decisions, connector checks, advisor commands, and deletion requests append actor-scoped records to `revenue_audit_events` without copying transcripts into the audit stream.
