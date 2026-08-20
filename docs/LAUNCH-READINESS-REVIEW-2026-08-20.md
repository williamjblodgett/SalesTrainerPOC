# Launch-readiness review — 2026-08-20

## Executive assessment

Suadence has a credible private-pilot product loop, but it is not yet a generally available enterprise service. The strongest architecture is the canonical Next.js/Supabase application: transcript evidence becomes governed persona and Revenue OS objects; immutable scenarios drive private-state buyers; completed transcripts feed a separate evaluator; application code computes scores. The retired static/Sites copies created navigation and authentication confusion and are no longer product surfaces.

This release fixes the most immediate trust blockers: cross-device recovery, invite-only onboarding, one canonical origin, hidden-scenario RLS, peer-session isolation, active workspace validation, differentiated revenue assets, evidence citations, and manager review. External configuration and human calibration remain launch gates, not code-complete claims.

## What is functional in code

- Supabase email/password login with SSR cookies and return-to routing.
- Single-use recovery and invite verification through server-side token hashes.
- Owner-driven rep/manager invitations and multi-organization workspace switching.
- Tenant-scoped products, personas, scenario versions, assignments, text sessions, transcripts, evaluations, overrides, usage, Revenue OS calls, evidence, assets, graph entities, and connector registries.
- Transcript-to-persona drafts with exact turn/excerpt/character evidence, conflicts, assumptions, missing information, approval, and immutable publication.
- Structured scenario compilation, immutable publication, private buyer state, idempotent text turns, formal completion, post-call evaluation, deterministic weighted scoring, and evidence-first results.
- Separated Revenue Evidence Extractor and Asset Generator, exactly 20 unique asset types, persisted evidence UUIDs, provider/prompt lineage, review-required status, and manager decisions.
- Seven industry packs and 35 starter simulations.
- Commercial document-scanner adapter and production fail-closed gate.
- Realtime server mediation exists but remains intentionally disabled until text realism passes.

## What still depends on external configuration or validation

- Apply the latest migration and pass all hosted pgTAP suites against the target Supabase project.
- Apply the versioned production Auth configuration and test a fresh owner recovery email end to end.
- Configure custom SMTP and sender-domain authentication; default Supabase email is suitable only for setup/testing.
- Supply the OpenAI key and run provider-backed contract/calibration suites on licensed human-reviewed transcripts.
- Supply the commercial scanner key and verify known-clean and known-malicious files in production.
- Configure external error monitoring, uptime checks, alert routing, backup-restore exercises, and incident owners.
- Obtain counsel approval for privacy, DPA, consent, retention, subprocessors, and customer data ownership terms.
- Complete provider OAuth, encrypted refresh-token storage, backfills, rotation, webhook validation, and marketplace approval.
- Complete SSO/SCIM, step-up authentication, legal holds, regional residency, and enterprise audit exports before enterprise GA.

## Persona and buyer-realism strategy

The right unit is not a free-form persona paragraph. It is a versioned evidence model with observed claims, inferred hypotheses, unknowns, contradictions, freshness, confidence, and exact source spans. A persona should be published only after a manager reviews claim-level evidence. Scenario compilation should project a compact, immutable subset from the approved persona rather than retrieving full playbooks on every turn.

Buyer realism should be measured as behavior, not prose quality. The calibration set should score disclosure discipline, objection timing, conversational naturalness, consistency, resistance to leading questions and prompt injection, recovery after strong discovery, patience decay, and realistic next-step commitment. Each benchmark needs at least two independent sales-leader reviewers, adjudication, inter-rater agreement, failure slices by industry/seniority/difficulty, and regression thresholds. Voice should reuse the same private state machine only after text passes.

## Scoring strategy

Rubrics should measure observable seller behavior with anchors at 0–4. Positive scores require exact seller-turn evidence. The evaluator proposes criterion scores; deterministic application code calculates the 0–100 total. Confidence should describe evidence sufficiency, not inflate scores. Calibration needs human labels for discovery depth, business impact, listening/follow-up, objection diagnosis, positioning relevance, and mutual next-step control. Track evaluator-human mean absolute error, adjacent agreement, severe disagreement rate, citation precision, and unsupported-positive rate by criterion.

## Revenue asset strategy

“One call in, 20 assets out” should mean one governed evidence ledger feeding 20 purpose-specific drafts—not 20 copies of a summary. Single-call outputs remain account-level and review-required. Market-level persona, playbook, battle-card, product, and executive claims should require corroboration across distinct calls, recency weighting, contradiction detection, and minimum evidence thresholds. Approved assets can update the living graph; candidate or rejected output must not influence executive metrics.

## Recommended release sequence

1. Pilot foundation: hosted migration/Auth configuration, owner recovery, SMTP, monitoring, scanner smoke tests, and authenticated release E2E.
2. Realism calibration: licensed corpus, two sales-leader reviewers, buyer/evaluator regression dashboards, and failure-slice remediation.
3. Design-partner launch: invite-only teams, manual transcript ingestion, governed personas, text practice, evaluations, and reviewed assets.
4. Connector pilot: one provider at a time with OAuth, backfill, deletion propagation, reconciliation, and operational runbooks.
5. Voice pilot: gated Realtime/WebRTC after text thresholds pass, with captions, interruption, reconnect, duration limits, and no raw-audio retention by default.
6. Enterprise GA: counsel-approved contracts, SSO/SCIM, step-up auth, audit export, regional controls, support/SLA operations, and recovery exercises.
