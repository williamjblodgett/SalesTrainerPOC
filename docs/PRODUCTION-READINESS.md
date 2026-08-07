# Production readiness

## Release posture

The deployed Sites build is suitable as a private, authenticated product demonstration and controlled design-partner pilot. It is not represented as generally available enterprise SaaS until the external controls below are completed.

The canonical Next.js application is deployed to Vercel and connected to the hosted Supabase project. All five migrations were applied and the hosted pgTAP suite passed 22/22 checks on 2026-08-06. The application remains a controlled pilot rather than generally available enterprise SaaS because the production AI provider, commercial scanner, reliable SMTP, live calibration, connector OAuth, monitoring, and legal approvals are not complete.

The runtime exposes `GET /api/revenue-os/readiness`. That response reports configuration state; it does not convert missing legal, identity, or provider authorization into a green status.

## Implemented controls

- Canonical production fails closed without Supabase authentication; no ChatGPT identity dependency exists
- No-secret `/api/health` readiness contract and redacted structured operational events
- Authenticated Playwright deployment gate with a dedicated Supabase release-test identity
- Draft public legal disclosures and incident, retention, monitoring, and DPA operating runbooks
- Private hosted access policy
- Organization-bound database records and server-resolved organization context
- Consent-confirmed live paste/TXT ingestion and consent quarantine in the connector gateway
- HMAC-SHA256 signature verification, five-minute replay window, payload hashing, and provider-event idempotency
- Per-actor, per-organization ingestion and demo-generation rate limits
- Synthetic/live data separation in calls, graph views, signals, and Revenue DNA
- Evidence-backed 20-asset generation with `review_required` default state
- Human approval, change-request, and rejection records
- Cross-call intelligence thresholds using distinct call IDs
- Graph canonicalization with review-required duplicate merges
- 72-hour deletion cooling-off period, cancellation, protected due-request processing, and local lineage cascade
- Audit events that omit transcript content
- Raw-audio storage disabled by default
- Server-only provider and AI secrets

## Required before live design-partner data

- Set a unique `AUTHORIZED_ORGANIZATION_ID` and verified actor/identity mapping
- Set a high-entropy `CONNECTOR_WEBHOOK_SECRET`
- Set a separate high-entropy `DELETION_PROCESSOR_SECRET`
- Complete a DPA, privacy notice, subprocessor disclosure, retention schedule, and consent mapping with counsel
- Confirm the customer owns or is authorized to process every imported call
- Complete a threat model and penetration test for the chosen deployment
- Configure monitoring, alerting, backups, recovery objectives, and incident response ownership
- Obtain counsel approval for the draft legal disclosures and execute the DPA/customer terms

## Required before multi-tenant general availability

- Port the separate Sites/D1 Revenue OS repositories and domain logic to the canonical Supabase/Postgres transaction and RLS layer
- Expand the passing hosted cross-tenant suite as Revenue OS tables are added
- Add SSO/SAML, SCIM, MFA/step-up authentication, support-access controls, and access-review workflows
- Encrypt OAuth refresh tokens with a managed key service and implement rotation/revocation
- Complete provider-specific OAuth, webhook, backfill, and marketplace review
- Add durable queues with dead-letter handling and operational dashboards
- Implement legal holds, user/organization deletion approval, backup-expiry reporting, export, and data-subject workflows
- Complete accessibility audit, security review, load test, failure injection, and privacy impact assessment
- Obtain any certifications claimed in commercial materials; the UI currently describes control design and does not claim certification

## Deletion semantics

Call deletion removes Suadence-controlled call text, assets, asset reviews, graph nodes, graph edges, graph evidence, synthetic-run metadata, and live/demo signals derived from the removed call. It then rebuilds live canonical entities and recomputes cross-call signals.

For Gong, Chorus, Zoom, Teams, or Salesforce calls, the source copy remains controlled by the customer and provider. The task is marked `customer_confirmation_required` rather than falsely claiming provider-side deletion. Contractual responsibility and a customer runbook must cover that source retention.

User and organization deletion requests move to `manual_review` because identity verification, legal hold, contract termination, export, and backup-retention decisions cannot safely be automated from a target ID alone.

## Pricing

Pricing is **TBD**. No price, package, discount, or commercial commitment is represented by the hosted site.
