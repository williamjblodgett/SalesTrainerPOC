# Decisions

- The repository is a modular monolith to minimize operational cost.
- JSONB stores early `ScenarioSpec` and `EvaluationResult` objects; high-value query dimensions can be normalized after usage evidence.
- Mock AI is the default so onboarding and evaluation can run without credentials.
- Voice and billing remain architectural seams, not milestone blockers.
- The seeded UI is explicitly labeled demonstration data; no fake customers or metrics are presented as production facts.
