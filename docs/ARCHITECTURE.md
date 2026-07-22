# Architecture

SalesSim is a modular monolith. App Router owns UI and HTTP boundaries; `lib/domain` owns versioned contracts and deterministic scoring; `lib/ai` owns provider interfaces; Supabase owns auth, persistence, and tenant enforcement.

`ScenarioSpec` partitions data into `repVisible`, `buyerHidden`, and `evaluatorOnly`. Practice responses are constructed with `toPracticeBrief`; private partitions are loaded only in server code. Published versions are immutable and sessions always reference their exact version.

The primary flow is onboarding → structured scenario → immutable publication → session/turns → formal completion → one post-call evaluation → deterministic weighted score → evidence-first results.
