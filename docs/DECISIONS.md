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
