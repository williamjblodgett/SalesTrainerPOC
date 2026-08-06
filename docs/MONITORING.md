# Production monitoring and alerting

## Signals

- Poll `GET /api/health` every minute from outside the hosting provider. Page when two consecutive checks return non-200.
- Alert on elevated `ai_provider_error`, scanner unavailability, authentication failures, database timeouts, rate limiting, and deletion-task failures.
- Track p50, p95, and p99 latency and failure rate separately for persona extraction, buyer turns, evaluation, transcript parsing, and connector ingestion.
- Track model, token usage, estimated cost, organization, operation, and prompt version without recording transcript or hidden-scenario content.
- Alert when monthly AI cost or session limits approach 80% and 100%.

## Logging rules

Operational events are structured JSON. Keys resembling transcript content, prompts, secrets, tokens, passwords, or API keys are removed by the logger. Production logs must never contain raw documents, transcripts, buyer-hidden data, evaluator-only data, access tokens, or scanner payloads.

## Required external configuration

1. Select a monitoring provider and document its region, retention, subprocessor status, and access controls.
2. Connect Vercel runtime logs and the external health check.
3. Configure paging routes for engineering, security, privacy, and executive ownership.
4. Run a synthetic outage, scanner failure, Supabase outage, and OpenAI timeout exercise.
5. Record recovery-time and recovery-point objectives and verify a Supabase restore.

The repository provides safe health output and structured operational events; external alert delivery requires the selected provider account.
