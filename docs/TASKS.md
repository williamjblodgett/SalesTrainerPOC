# Tasks

## 2026-08-05 realism and evidence remediation

- [x] Make GitHub Pages fixture-only and label local scoring/practice as synthetic.
- [x] Add exact evidence spans, semantic deterministic classification, and insufficient-evidence negative controls.
- [x] Require exact accept/edit/reject review sets and publish accepted projections only.
- [x] Add manager-only transcript RLS, private retained originals, authoritative evidence claims, and lineage deletion.
- [x] Add immutable persona references to scenario versions and practice sessions.
- [x] Add stateful text BuyerActor contracts, guarded disclosure, objection state, repetition, patience, and ending behavior.
- [x] Add authenticated session start/turn/complete/evaluate/read APIs with idempotent atomic turn persistence.
- [x] Add evaluator evidence validation, fail-closed mock scoring, and append-only manager overrides.
- [x] Add adversarial realism and transcript-file tests.
- [x] Apply migration `202608050002_realism_remediation.sql` to the hosted Supabase project and run pgTAP isolation tests (22/22 passed on 2026-08-06).
- [x] Add a fail-closed Cloudmersive Advanced commercial scanner adapter and production configuration contract.
- [x] Add the live persona/buyer/evaluator calibration harness and two-reviewer release thresholds.
- [ ] Supply the Cloudmersive key and verify a real clean/quarantine scan in the canonical environment.
- [ ] Run the live calibration harness on the licensed human-scored corpus.
- [ ] Add Realtime/WebRTC voice after the text realism gate passes.
- [x] Fail closed when canonical production is missing Supabase authentication.
- [x] Add a no-secret health endpoint, redacted operational events, and a deployment health gate.
- [x] Add public draft legal disclosures plus incident, retention, monitoring, and DPA runbooks.
- [x] Add an authenticated Playwright release workflow using a pre-provisioned Supabase user.
- [ ] Configure external monitoring, paging, backup restoration, and named incident owners.
- [ ] Obtain counsel approval for privacy, DPA, consent, retention, and subprocessor materials.

## 2026-08-04 interactive demo and persona engine

- [x] Replace the single-page GitHub Pages preview with a hash-routed interactive demo.
- [x] Make all ten product tabs navigable without private-site redirects.
- [x] Add seven industry packs and 35 synthetic simulations.
- [x] Add local synthetic persona extraction, browser voice input, evidence scoring, export, and reset.
- [x] Add PersonaDraft and transcript-ingestion boundary schemas.
- [x] Add Responses API persona synthesis with deterministic mock mode and evidence verification.
- [x] Add tenant-scoped transcript/persona tables, RLS, indexes, and immutable persona versions.
- [x] Connect the secure Transcript Lab and industry library.
- [x] Apply the new Supabase migrations to the hosted project and pass the pgTAP suite.
- [x] Configure and deploy the canonical Vercel project at `https://salessim-five.vercel.app`.
- [x] Add server-side TXT/DOCX/PDF parsing, signature verification, safety scanning, PII redaction, and 20 MB enforcement.
- [ ] Add durable asynchronous ingestion jobs and provider OAuth.
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
- [x] Run pgTAP cross-tenant suite against the hosted Supabase project (22/22 passed)
- [x] Add a canonical atomic Supabase RPC for transcript sources, normalized turns, persona draft, lineage, consent evidence, and usage.
- [ ] Responses API structured-output providers
- [ ] Complete idempotent API surface and rate limiting
- [x] Add a tenant-scoped transcript deletion RPC and cascade contract.
- [ ] Complete the organization deletion approval/export workflow.
- [x] PDF/DOCX persona extraction through server-side OpenAI file inputs, with deterministic TXT/paste mode
- [x] Persisted coaching priority inbox and automatic follow-up drills
- [x] Role certification paths and manager rubric calibration
- [x] Rep score appeals with manager-response API and original-score preservation
- [x] Manual outcome overlays for stage conversion, win rate, and ramp time
- [x] Database-derived leader metrics and append-only action audit history
- [x] Voice device selection, reconnection controls, and organization usage limits
- [x] Playwright authenticated workflow
- [ ] Run the authenticated Playwright workflow against the canonical production deployment.

## Persona QA

- [x] Add a seven-industry persona QA matrix.
- [x] Reject seller-only transcripts and duplicate source IDs.
- [x] Quarantine prompt-injection-like transcript turns.
- [x] Detect conflicting budget evidence across sources.
- [x] Require consent or synthetic-data attestation.
- [x] Add evidence-quality preflight metrics to the Transcript Lab.
- [x] Persist complete transcript-to-claim lineage in one transaction.
- [x] Add evidence mapping to every persona field and block unsupported observed fields.
- [x] Add multi-transcript source collection, per-source status/removal/dedup, and evidence preflight.
- [x] Add individual claim accept/reject review before persona approval.
- [x] Add conflict detection for budget, timing, priorities, and current-solution state.
- [x] Replace invented mock identity, stakeholder, KPI, and buying-process values with explicit unknowns.
- [x] Add persisted persona-library states and immutable version comparison.
- [x] Add manager-labeled deterministic calibration checks across all seven industry packs.
- [x] Add Supabase pgTAP persona RLS/immutability contract suite.
- [ ] Run provider-backed calibration and pgTAP isolation suites against a disposable hosted Supabase project.

## Later

- [ ] Live Realtime token/minute metering and provider spend reconciliation
- [ ] Customer-authorized CRM OAuth adapters and automated outcome sync
- [ ] Billing and advanced analytics
