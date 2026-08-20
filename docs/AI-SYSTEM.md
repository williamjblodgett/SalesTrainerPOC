# AI system

## Transcript-to-persona engine

The persona engine is an upstream intelligence boundary. It normalizes consent-confirmed transcripts into stable turns, quarantines seller instructions and unknown speakers, and produces atomic claims with exact source, turn, excerpt, and character spans. Unsupported calls return insufficient evidence. Managers accept, edit, or reject the exact claim set; only accepted projections enter immutable persona versions or scenarios.

Transcript contents are untrusted reference data, never model instructions. Deterministic mode uses the same contracts and validators, but it is limited to local tests and explicitly synthetic demonstrations. Live production data fails closed unless provider-backed AI is configured.

Revenue OS adds two bounded responsibilities ahead of the existing simulation loop:

1. Evidence Extractor converts consented, normalized transcript segments into grounded observations with exact source turn IDs, excerpts, confidence, and explicit assumptions/missing information. Its output is revalidated against the transcript.
2. Asset Generator creates exactly one differentiated, department-specific draft for each of the 20 required asset types. Every asset cites persisted evidence UUIDs; invented or out-of-scope citations fail the operation. It cannot publish an asset or treat transcript instructions as system instructions.

The Proactive Revenue Advisor ranks deterministic action candidates produced from graph change, gaps, drift, coaching need, and commercial context. It may explain and draft, but all side effects pass through server-side permission and confirmation boundaries.

Evidence extraction, asset generation, buyer acting, and evaluation use separate provider interfaces, prompts, contracts, usage events, model/prompt lineage, and configuration. No operation receives more private data than its job requires. Generated assets stay `review_required` until an atomic manager decision is recorded.

Three responsibilities remain intentionally separate:

1. Scenario Compiler converts structured manager inputs and untrusted reference material into a validated `ScenarioSpec`.
2. Buyer Actor receives the immutable scenario/persona version, prior turns, and server-private state. It returns one visible message plus validated private state transitions, disclosures, objection events, and end action.
3. Post-Call Evaluator runs only after completion and returns evidence linked to stable turn IDs. Application code calculates the weighted score.

All text providers use the Responses API and structured outputs validated with Zod. Application code rejects unearned disclosures and evaluator citations that do not exactly match seller turns. The buyer never sees the rubric, the evaluator never joins the conversation, and model identifiers come only from environment configuration.

## Realtime voice

Browser voice uses WebRTC. The browser sends its SDP offer to a SalesSim server endpoint; that endpoint combines the offer with server-owned buyer instructions and opens the OpenAI Realtime call using the standard API key. The browser receives only the SDP answer. `OPENAI_REALTIME_MODEL` controls the model, and credential-free deployments fall back to a clearly bounded browser voice demonstration. Audio is not stored by default; transcript events feed the same post-call evaluator used by text sessions.

Production Realtime remains release-gated. `ENABLE_REALTIME_VOICE=true` is ignored unless `TEXT_REALISM_BENCHMARK_STATUS=passed`; the benchmark requires a licensed, two-reviewer corpus and the thresholds in `calibration/README.md`. The current official unified WebRTC flow uses the server-owned standard key at `/v1/realtime/calls`; that key is never returned to the browser.
