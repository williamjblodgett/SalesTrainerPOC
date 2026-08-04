# Tasks

## 2026-08-04 interactive demo and persona engine

- [x] Replace the single-page GitHub Pages preview with a hash-routed interactive demo.
- [x] Make all ten product tabs navigable without private-site redirects.
- [x] Add seven industry packs and 35 synthetic simulations.
- [x] Add local synthetic persona extraction, browser voice input, evidence scoring, export, and reset.
- [x] Add PersonaDraft and transcript-ingestion boundary schemas.
- [x] Add Responses API persona synthesis with deterministic mock mode and evidence verification.
- [x] Add tenant-scoped transcript/persona tables, RLS, indexes, and immutable persona versions.
- [x] Connect the secure Transcript Lab and industry library.
- [ ] Apply the new Supabase migration to the production project.
- [ ] Configure the canonical Vercel project, runtime values, and domain.
- [ ] Add DOCX/PDF server parsing, durable ingestion jobs, and provider OAuth.
- [ ] Complete production voice persistence, monitoring, and launch compliance review.

## Revenue OS V1

- [x] Category landing page built around “one call in, 20 revenue assets out”
- [x] Premium operating-system shell with command center and cross-department views
- [x] Consent-gated call ingestion for Gong, Chorus, Zoom, Teams, Salesforce, and upload source types
- [x] Exactly 20 governed revenue asset blueprints per ingested call
- [x] Organization-scoped normalized call, asset, graph, signal, and deletion-request tables
- [x] Living knowledge graph with evidence, confidence, six node types, and eight relationships
- [x] Revenue DNA, Knowledge Drift, Content Gap, digital-twin, and proactive-advisor product surfaces
- [x] Idempotent ingestion keys and organization-bound queries in the hosted V1
- [x] Cross-department activation for Sales, Enablement, Marketing, Product, CS, and Leadership
- [x] Evidence-lineage asset inspection with persistent approve, change-request, and reject decisions
- [x] Approval-aware Revenue DNA calculation that excludes unreviewed AI drafts from activation readiness
- [x] Connector health registry with honest native, OAuth, and manual-pilot connection modes
- [x] Human-gated proactive-advisor action queue with no automatic external side effects
- [x] Governed deletion request UI and append-only revenue action audit trail
- [x] Replay-protected HMAC connector gateway with normalized event validation and idempotency
- [x] Multi-call signal computation with distinct-call thresholds and evidence lineage
- [x] Canonical graph entities, duplicate detection, and human-reviewed merge API
- [x] Lineage-aware local call deletion execution, cooling-off cancellation, and protected due-request processor
- [x] Isolated Synthetic Demo Lab with one-call and cohort generation, 20 assets per call, and one-action reset
- [x] Production-readiness control surface that distinguishes configuration from customer authorization
- [x] Landing-page pricing reduced to an explicit TBD with no commercial figures
- [x] Desktop browser walkthrough covering logo rendering, live/demo isolation, ingestion defaults, graph/advisor/executive empty states, and client console errors
- [x] Hosted HTML validation for logo paths, client-script syntax, synthetic labeling, outage fallbacks, and TBD pricing
- [x] Public GitHub Pages preview with a governed handoff to the secure product runtime
- [x] Enterprise security, legal operating model, and V1–V3 strategy documented
- [x] Deploy the validated commit and run the persistent D1 synthetic-cohort smoke flow in production
- [x] Verify owner-only access, desktop and 375px mobile layouts, live/demo isolation, synthetic reset, browser console, and production worker logs
- [ ] Provider-specific OAuth screens, customer authorization, backfills, token rotation, and marketplace approval
- [ ] Provider-side source retention confirmation for externally owned copies
- [ ] DPA, privacy notice, subprocessor page, and jurisdiction-specific counsel review
- [ ] SSO/SAML, SCIM, step-up authentication, legal holds, and regional data residency

## Milestone 1

- [x] Next.js/TypeScript/Tailwind foundation
- [x] Scenario and evaluation Zod contracts
- [x] Seeded discovery scenario
- [x] Scenario Studio, text practice, and evidence-first results UI
- [x] Deterministic buyer/evaluator and weighted scoring
- [x] Core database schema, tenant columns, indexes, and RLS baseline
- [x] Unit tests for schema, score, authorization, and hidden filtering
- [x] Suadence visual identity and responsive product navigation
- [x] Guided persona builder with buyer behavior and rep-level controls
- [x] Transcript evidence workspace with review-before-approval
- [x] Editable scorecards with weight validation and behavioral anchors
- [x] Persistent hosted persona/transcript storage using D1 and optional R2 retention
- [x] Browser voice practice fallback and server-mediated Realtime session endpoint
- [x] Persistent persona approval and publication workflows
- [x] Persistent scorecard publication with deterministic weight validation
- [x] Idempotent text-practice turns, completion, and evidence-backed evaluation
- [x] Sales-leader coaching queue and readiness recommendations
- [x] One-page branded capabilities brief
- [x] Supabase SSR auth, session refresh, validated signup/sign-in, and organization bootstrap
- [x] Role-aware owner/manager/rep application shell and manager action dashboard
- [x] Complete initial RLS write-policy baseline and unit-level policy contract tests
- [ ] Run pgTAP cross-tenant suite against a disposable hosted Supabase project
- [ ] Port hosted D1 workflow repositories into canonical Supabase transactions
- [ ] Responses API structured-output providers
- [ ] Complete idempotent API surface and rate limiting
- [ ] Production manager override and transcript/organization deletion workflows
- [x] PDF/DOCX persona extraction through server-side OpenAI file inputs, with deterministic TXT/paste mode
- [x] Persisted coaching priority inbox and automatic follow-up drills
- [x] Role certification paths and manager rubric calibration
- [x] Rep score appeals with manager-response API and original-score preservation
- [x] Manual outcome overlays for stage conversion, win rate, and ramp time
- [x] Database-derived leader metrics and append-only action audit history
- [x] Voice device selection, reconnection controls, and organization usage limits
- [ ] Playwright authenticated workflow

## Persona QA

- [x] Add a seven-industry persona QA matrix.
- [x] Reject seller-only transcripts and duplicate source IDs.
- [x] Quarantine prompt-injection-like transcript turns.
- [x] Detect conflicting budget evidence across sources.
- [x] Require consent or synthetic-data attestation.
- [x] Add evidence-quality preflight metrics to the Transcript Lab.
- [ ] Persist complete transcript-to-claim lineage in one transaction.
- [ ] Add provider-backed, manager-labeled persona calibration tests.

## Later

- [ ] Live Realtime token/minute metering and provider spend reconciliation
- [ ] Customer-authorized CRM OAuth adapters and automated outcome sync
- [ ] Billing and advanced analytics
