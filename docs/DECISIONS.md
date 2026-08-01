# Decisions

- The Next.js/Supabase application is the canonical production architecture. The existing Sites/D1 worker is a compatibility surface during migration, not a second long-term product.
- Authentication is implemented with Supabase SSR cookies and server-verified users. Missing Supabase configuration enables an explicitly labeled demonstration context so the repository remains credential-free and testable.
- Organization creation is a security-definer database transaction that creates the organization and first owner membership atomically.
- Navigation and home-page priorities are role-specific. Manager home emphasizes actions requiring judgment; completion metrics remain secondary.

- The repository is a modular monolith to minimize operational cost.
- JSONB stores early `ScenarioSpec` and `EvaluationResult` objects; high-value query dimensions can be normalized after usage evidence.
- Mock AI is the default so onboarding and evaluation can run without credentials.
- Voice and billing remain architectural seams, not milestone blockers.
- The seeded UI is explicitly labeled demonstration data; no fake customers or metrics are presented as production facts.
- Synthetic Demo Lab records use the same deterministic extraction and 20-asset contracts as live evidence, but are linked through `demo_runs` and excluded from live calls, canonical graph entities, signals, and Revenue DNA.
- A provider client ID/secret means `configuration_verified`, never `connected`. Customer tenant authorization and a successful provider reconciliation are separate states.
- Provider adapters terminate at one normalized, signed event boundary. This keeps provider OAuth and payload changes outside revenue domain logic.
- Cross-call signals require distinct-call thresholds. One call may create drafts but cannot become a live trend.
- Approximate graph matches create human-reviewed merge candidates. Source nodes remain immutable evidence even when canonical entities merge.
- Call deletion is automated after a 72-hour cooling-off period. User and organization deletion require manual identity, export, retention, and legal-hold review.
- Source-system copies are not controlled by Suadence. Deletion records explicitly require customer confirmation instead of asserting that a provider copy was erased.
- Pricing is TBD until design-partner evidence supports a commercial model; no number is shown in the hosted experience.
