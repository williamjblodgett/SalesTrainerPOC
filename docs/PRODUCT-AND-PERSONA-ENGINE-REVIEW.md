# Product and persona-engine review

Date: 2026-08-07  
Reviewed target: canonical Next.js/Vercel application, Supabase schema, GitHub Pages demo, and the separate Sites/D1 Revenue OS implementation committed in `dist/server`.

## Executive verdict

Suadence is directionally right on the hardest product principles: evidence before inference, exact transcript citations, human approval, immutable persona and scenario versions, private buyer state, a separate evaluator, deterministic weighted scoring, tenant-scoped data, and a clear separation between live and synthetic data.

It is not yet one production product. It is currently three related experiences:

1. The canonical Next.js application on Vercel, authenticated with Supabase. This contains the governed persona pipeline and the sales-simulation foundation.
2. The public GitHub Pages demonstration. This is a synthetic, browser-only product tour.
3. A separate Sites/D1 Revenue OS implementation in compiled `dist/server` files. This contains the 20-asset, graph, connector, advisor, and cross-department concepts, but those capabilities are not part of the canonical Supabase application.

The immediate strategy should be to make the Next.js/Supabase application the only product runtime and port the useful Revenue OS concepts into it behind typed domain services. Do not continue building parallel backends.

The most important product recommendation is equally clear: **do not ask an AI model to create 20 independent assets directly from a raw transcript.** Extract a canonical evidence ledger once, resolve it into approved, time-aware knowledge, then compile each asset from the same governed view. This lowers cost, reduces contradictions, makes deletion and corrections reliable, and gives every output defensible lineage.

## What is genuinely working

### Production and security foundation

- Supabase authentication is independent of ChatGPT.
- The owner account can use email/password authentication, and the authenticated Settings page now supports a secure password change.
- The production Vercel deployment builds, type-checks, lints, tests, and passes its health check.
- All five Supabase migrations were applied to the hosted project on 2026-08-06.
- The hosted pgTAP tenant-isolation suite passed 22 of 22 tests.
- Tenant-owned records include organization boundaries and RLS policies.
- Retained transcript originals use a private, organization-prefixed storage path.
- File processing validates size, extension/signature agreement, and extracted text limits.
- PII is redacted before persona-model processing.
- Published personas and scenarios have immutable version concepts.
- Practice turns and evaluation creation have idempotency controls.

### Persona workflow

- Managers can provide multiple TXT, DOCX, PDF, or pasted sources.
- The UI requires an explicit processing-authority or synthetic-data attestation.
- Sources receive stable IDs; normalized turns receive stable turn IDs.
- Seller instructions and prompt-injection-like content are quarantined from persona evidence.
- Persona output is a strict Zod contract, not unstructured prose.
- Claims include source, turn, exact excerpt, character offsets, origin, and confidence.
- Server validation proves cited excerpts exist in the supplied source turn.
- Fields distinguish observed, inferred, and unknown information.
- Managers must accept, edit, or reject every extracted claim before approval.
- Approved personas publish as immutable versions with evidence manifests.
- Scenario and session records can reference the exact persona version used.

### Buyer and scoring foundations

- Buyer Actor and Evaluator are separate services and prompts.
- Hidden buyer data remains server-side.
- Buyer state tracks trust, openness, patience, relevance, willingness, disclosed facts, and active objections.
- The actor performs a disclosure-policy check and rejects obvious hidden-data leakage.
- The evaluator cites stable seller turn IDs and exact transcript excerpts.
- Application code—not the model—calculates the weighted 0–100 score.
- Manager overrides preserve the original AI score.

## Capability truth table

| Capability | Current state | Production interpretation |
| --- | --- | --- |
| Email/password authentication | Live | Supabase-backed and independent of ChatGPT |
| Hosted tenant isolation | Live and tested | 22 hosted pgTAP checks passed |
| Transcript upload and parsing | Live | TXT, DOCX, PDF; synchronous up to 20 MB |
| Consent attestation and PII redaction | Live foundation | Legal wording and broader detection still need review |
| Persona claim extraction | Implemented, deployed in mock mode | OpenAI provider exists but production environment uses `AI_PROVIDER=mock` |
| Persona claim review/versioning | Live foundation | Strongest end-to-end capability |
| Scenario studio | UI prototype | Current page renders the seeded scenario; save/publish controls are not wired there |
| Text buyer simulation | Functional foundation | Production uses a deterministic buyer, not a calibrated live model |
| Evaluation and score calculation | Functional foundation | Production mock evaluator intentionally scores all criteria zero |
| Results page | Prototype | It renders seeded/demo data rather than the requested live session |
| Assignments | Placeholder | No complete manager-to-rep workflow in the canonical UI |
| Team dashboard | Placeholder | Not production-functional |
| Analytics | Placeholder | Not production-functional |
| Playbooks | Placeholder | Not production-functional |
| Manual persona builder | UI-only | Form has no persistence action |
| Seven industry packs | Synthetic demo content | Useful starter fixtures, not validated market benchmarks |
| Gong/Chorus/Zoom/Teams/Salesforce | Catalog/contract only | OAuth, backfill, webhook operations, and marketplace approval are absent |
| 20 revenue assets | Separate D1 implementation | Not integrated into the canonical Next.js/Supabase product |
| Living knowledge graph | Separate D1 implementation | Supabase currently stores persona lineage, not the Revenue OS graph |
| Revenue DNA / drift / content gaps | Separate heuristic implementation | Not calibrated business metrics in the canonical product |
| Commercial malware scanner | Adapter implemented | Production deploy currently selects the built-in scanner; live provider validation is outstanding |
| Realtime voice | Release-gated | Correctly disabled until text realism passes human calibration |
| Monitoring/legal/SSO/SCIM | Partial documentation | Not enterprise-GA ready |

## Persona-engine assessment

### What the model gets right

The engine treats a persona as a reviewable set of evidence-backed claims rather than an AI biography. That is the correct foundation. It also prevents a common category failure: silently filling missing titles, KPIs, stakeholders, budgets, or buying processes with plausible-sounding fiction.

The multi-source design, exact evidence spans, source diversity, conflict tracking, manager dispositions, immutable publication, and downstream lineage are all worth preserving.

### Where the current model is too coarse

The current pipeline combines all selected buyer turns into one persona draft. That can confuse four distinct objects:

- a real contact observed on one call;
- an account's current buying context;
- a segment-level archetype learned across many accounts;
- a fictional scenario persona used for training.

Those objects should never be interchangeable. A statement such as “legal must approve” may be true for one deal, not a durable trait of CFOs. A speaker's frustration may be situational, not a behavioral archetype. The product should preserve this distinction before aggregation.

The deterministic mock extractor is useful for CI but is not a realistic persona engine. It uses keyword classification, derives a small number of claims, often maps a full utterance into one claim, defaults behavior axes toward neutral, and collapses multiple pains into a single structure. It should continue as a contract fixture, never as a customer-facing intelligence substitute.

The OpenAI prompt and schema are stronger, but model confidence alone is not reliable enough. Confidence should be computed from observable factors: extraction certainty, source diversity, recency, independent-call count, agreement/conflict, speaker attribution quality, and manager review state.

### Recommended persona object model

1. **Conversation observation** — an atomic, verbatim-supported claim tied to a call, turn, speaker, timestamp, and consent/retention envelope.
2. **Contact profile** — approved observations about one identifiable buyer. Never silently generalized.
3. **Account buying context** — stakeholders, initiatives, constraints, timeline, alternatives, and deal state that may expire.
4. **Segment archetype** — statistically supported patterns across distinct accounts, with sample size and inclusion criteria.
5. **Scenario persona** — a deliberately constructed training character that combines approved evidence, manager-authored configuration, and clearly labeled synthetic assumptions.

This hierarchy makes personas more accurate and makes the digital twin safer. It also lets a manager choose whether a roleplay should represent a specific account, a validated market archetype, or a synthetic industry starter.

### Better confidence and freshness rules

- A claim from one call remains an observation, not a market pattern.
- Cross-call patterns require a configurable minimum number of distinct calls and accounts.
- Repeated excerpts from the same syndicated transcript do not increase confidence.
- Contradictory claims remain visible and unresolved until reviewed.
- Time-sensitive claims such as budget, timeline, tool stack, and approval process expire or require reconfirmation.
- Behavioral traits require repeated interaction evidence or explicit manager configuration.
- Industry-pack priors must be labeled `synthetic_prior` and can never masquerade as customer evidence.
- Every downstream asset exposes evidence coverage, freshness, and review state.

## Buyer-realism assessment

The server-private state machine and disclosure allowlist are the right architecture. The live model should be treated as a natural-language actor constrained by a deterministic policy layer—not as the policy engine itself.

The current deterministic buyer is too narrow for realism. Its response policy is primarily regex-based, focuses on the first pain and first objection, and lacks durable memory for commitments, inconsistencies, stakeholder politics, commercial boundaries, and discovered-versus-assumed facts.

The next buyer policy should track:

- fact state: unknown to seller, partially disclosed, fully disclosed, contradicted;
- relationship state: trust, relevance, patience, psychological safety;
- commercial state: urgency, value clarity, risk, status-quo preference, change cost;
- stakeholder state: influence, authority, alignment, private concerns, required next participant;
- conversation state: agenda, topics covered, unanswered buyer questions, seller commitments, repeated questions;
- objection state: trigger, surface statement, investigated concern, resolution evidence, unresolved residue;
- ending state: reason to continue, realistic next step, failure conditions.

Each buyer turn should be generated in two stages: a deterministic/private `BuyerMove` decision followed by a constrained language realization. The policy chooses disclose/withhold/challenge/ask/objection/end; the language model expresses it naturally. A post-generation validator then checks forbidden disclosures, coaching language, rubric leakage, unsupported facts, verbosity, and state consistency.

Text realism should be calibrated before voice because voice can make an unrealistic policy feel superficially impressive while preserving the underlying failure.

## Scoring assessment

The deterministic score formula is correct. The weakness is evidence calibration, not arithmetic.

The production mock evaluator returns zero for every criterion by design. This is safe but not a usable product result. The live evaluator must not be enabled merely because an API key exists. It should pass the committed human-review gate first.

Recommended scoring changes:

- Permit `not_scorable` per criterion when transcript evidence is insufficient; do not turn missing audio or a truncated call into seller failure.
- Separate behavior score, evaluator confidence, and evidence coverage.
- Require exact anchor mapping, not keyword presence.
- Weight critical errors through explicit deterministic rules, not an opaque model adjustment.
- Compare model scores with at least two trained human raters using criterion-level mean absolute error and weighted kappa.
- Track systematic leniency/severity by criterion, call length, accent/transcription quality, industry, and rep level.
- Keep outcomes outside skill scoring except where the rubric explicitly measures next-step behavior.
- Show managers the original result, override, rationale, rater, and calibration version.

## The correct revenue-asset architecture

### Current issue

The separate D1 implementation creates exactly 20 records from a fixed blueprint and deterministic node extraction. That is a useful product demonstration, but most asset content is a short descriptor rather than a department-ready deliverable. Generating a fixed 20 assets for every call also creates noise; a support call should not automatically produce every sales and marketing asset.

### Recommended pipeline

```text
Authorized source
  -> ingestion envelope
  -> normalized conversation + speakers
  -> atomic evidence ledger
  -> entity resolution + temporal claim graph
  -> approved knowledge view
  -> opportunity-ranked asset plan
  -> typed asset compilers
  -> human review + publication
  -> usage/outcome feedback
```

The asset planner should determine which outputs are valuable for that call. “One call in, up to 20 governed assets available” is operationally more honest than producing 20 thin artifacts every time. The marketing promise can remain “20 revenue assets out” only when the product actually generates complete, useful drafts and clearly marks irrelevant or insufficient-evidence outputs.

Each asset type needs its own Zod schema, compiler prompt, audience permissions, evidence requirements, freshness rules, review workflow, version history, and export/publish adapter. The first five should be:

1. customer/account brief;
2. evidence-backed persona update;
3. call recap and follow-up email;
4. objection/pain map update;
5. roleplay scenario plus rubric.

Only after these are accepted by users should the factory expand to battle cards, talk tracks, playbook changes, marketing voice-of-customer, product signals, CS risks, and executive reports.

## Knowledge graph recommendation

Supabase/Postgres is sufficient for V1; a dedicated graph database is unnecessary. Use relational tables for canonical entities, atomic assertions, relationships, evidence links, validity windows, and merge candidates. JSONB may hold type-specific payloads, but provenance and lifecycle fields should be relational and indexed.

Minimum records:

- `sources` and `conversations`;
- `speakers` and identity-resolution candidates;
- `observations` with exact evidence spans;
- `entities` for contact, account, role, pain, objection, priority, product, competitor, stakeholder, and outcome;
- `assertions` with subject, predicate, object/value, confidence factors, first/last seen, status, and reviewer;
- `relationships` with temporal validity;
- `assets`, `asset_versions`, `asset_evidence`, and `asset_reviews`;
- `calibration_cases`, human ratings, and model/prompt versions.

Deletion should remove or tombstone source evidence and recompute every derived assertion and asset. The current Supabase deletion RPC directly deletes sessions, assignments, scenario versions, and persona versions derived from the source. That is internally consistent, but too destructive for an enterprise audit trail. Prefer a governed tombstone and retraction model, then rebuild affected derivatives while preserving minimal, non-content audit records.

## Priority plan

### P0 — one honest product runtime

- Port the Revenue OS domain logic from the separate Sites/D1 implementation into `src/lib` and Supabase migrations.
- Remove compiled `dist/server` as an authoritative product source.
- Add a capability-status page driven by real configuration and database checks.
- Replace placeholder navigation with disabled/preview labels or working vertical slices.
- Configure custom SMTP so password recovery is reliable and branded.
- Replace the built-in production scanner with the configured commercial scanner and run clean/quarantine smoke tests.
- Change transcript deletion from destructive cascade to retraction/rebuild semantics.

### P1 — evidence ledger and calibrated persona V1

- Introduce observation, contact, account-context, archetype, and scenario-persona boundaries.
- Add speaker identity and multi-call/account grouping controls.
- Compute confidence from evidence factors rather than model self-report.
- Add temporal validity and drift review.
- Run the live persona calibration suite on licensed, human-reviewed transcripts.
- Enable OpenAI only in staging until citation, invention, and conflict thresholds pass.

### P2 — useful asset factory

- Implement the first five complete, typed asset compilers.
- Add asset planning so irrelevant outputs are skipped with an explanation.
- Add evidence coverage, freshness, review, versioning, and export.
- Measure acceptance rate, edit distance, time saved, and downstream usage.

### P3 — realistic practice and reliable scoring

- Add the two-stage buyer policy/language architecture.
- Expand private state and adversarial realism paths.
- Calibrate evaluator agreement against two human raters.
- Wire live session results, manager review, assignments, team, and analytics.
- Enable Realtime voice only after text realism and scoring gates pass.

### P4 — connectors and enterprise scale

- Implement one connector end to end before advertising six: OAuth, backfill, webhooks, retries, token encryption/rotation, deletion, and health.
- Add queues, dead-letter handling, observability, backup/restore exercises, and cost controls.
- Complete counsel-approved privacy/DPA/subprocessor/consent materials.
- Add MFA, SSO/SAML, SCIM, support-access controls, legal holds, exports, and regional retention.

## Product success measures

- Persona claim precision and unsupported-claim rate.
- Exact citation validity and evidence coverage.
- Cross-rater agreement and criterion-level scoring error.
- Buyer realism rating, forbidden-disclosure rate, and state-consistency rate.
- Asset acceptance rate, edit distance, publication rate, and time-to-value.
- Percentage of assets used downstream, not merely generated.
- Knowledge freshness, unresolved conflict age, and retraction propagation time.
- Cost and latency per accepted asset, persona, practice turn, and evaluation.
- Manager weekly active use and rep retry/improvement behavior.

## Final recommendation

Keep the evidence governance, private buyer state, immutable versions, provider interfaces, deterministic scoring, and Supabase tenant boundary. Replace the current split runtime and fixed-output generation with one canonical evidence-led architecture.

The category-defining advantage will not be “we can generate 20 things.” Many AI products can generate documents. The defensible product is: **every customer conversation becomes governed, correctable organizational memory, and every persona, simulation, score, and revenue asset stays consistent with that memory.**
