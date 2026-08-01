# Security

## Revenue intelligence controls

Every ingested call records consent status, source, processing purpose, region/policy reference, and retention before extraction. Calls with unknown or disallowed status are quarantined. Source recordings are not retained by default when a transcript is sufficient.

Normalized calls, assets, graph nodes, graph edges, signals, connector state, and deletion requests all carry `organization_id`. The hosted preview derives a single authorized organization server-side; production derives it from the authenticated membership and enforces the same scope with RLS. Neither API accepts a tenant identifier as authorization.

Customer data remains customer-owned. Product terms and the DPA should prohibit training shared models on customer content by default, list subprocessors and regions, define return/deletion duties, and preserve customer export rights. Provider credentials must be encrypted separately from application data, rotated, and unavailable to browser bundles.

Deletion is lineage-aware: deleting a source call removes the Suadence-controlled transcript, generated assets and reviews, graph nodes and edges, canonical-entity evidence, synthetic-run linkage, and computed signals. The request records actor, scope, target, cooling-off deadline, system tasks, and completion status; audit records never duplicate deleted content. Externally owned provider copies are marked `customer_confirmation_required` rather than falsely reported as deleted.

Role grants for raw transcripts, derived intelligence, cross-department summaries, exports, integration administration, retention changes, and organization deletion are distinct. Sensitive export, source connection, and tenant deletion operations require owner authority, step-up authentication, and append-only audit records.

Manager and evaluation actions append actor, entity, action, timestamp, and non-secret metadata to the audit log. Uploaded documents are treated as untrusted evidence; extraction explicitly ignores instructions inside them. Voice device identifiers remain browser-local, while organization limits store only allowed minutes, spend, and session duration.

Supabase sessions are refreshed at the application proxy and identity is revalidated with `auth.getUser()` before organization context is resolved. Organization creation is atomic, browser-supplied organization IDs are never trusted as authorization, and RLS restricts write operations by owner, manager, rep, and session ownership.

Tenant access is resolved from authenticated membership, never a browser-supplied organization ID. Every tenant table has `organization_id`, RLS is enabled, and server routes must repeat authorization checks. Reps may read only their own sessions; manager/owner review access is scoped to their organization.

OpenAI and Supabase service keys remain server-only. Practice clients receive only `repVisible`. Do not log full transcripts or hidden scenario partitions. Documents are untrusted, storage downloads use signed URLs, and upload adapters must validate type and size. Raw voice audio will not be retained by default.

Transcript deletion will soft-delete immediately and queue hard deletion. Organization deletion requires owner reauthentication, a cooling-off period, and cascaded tenant-data removal with an audit record containing no transcript content.

## Revenue workflow controls

AI-generated assets remain `review_required` until an authorized human records a decision. Change requests and rejections require a rationale. Original generation content and every review event are preserved, and only approved assets contribute to readiness or closed-loop Revenue DNA metrics.

Connector APIs return catalog metadata, health state, permitted scopes, and whether server credentials are configured; they never return OAuth tokens or secrets. A manual pilot check records `importedCalls: 0` and cannot be represented as a production backfill. The normalized ingestion gateway verifies HMAC-SHA256 signatures over timestamp plus raw body, rejects events outside a five-minute replay window, hashes payloads, validates consent, and deduplicates provider event IDs. Provider OAuth authorization, encrypted token rotation, marketplace approval, historical backfills, and step-up authorization remain required before general availability.

Advisor actions are proposals, not autonomous commands. V1 records the requested action, actor, owner department, review status, and bounded internal steps but performs no CRM write, message send, or content publication. Call deletion requests use a 72-hour cooling-off state, can be cancelled while queued, and are executed only when due or through a separately authorized processor. User and organization deletion require manual identity, retention, and legal-hold review.

Synthetic demonstrations are a separate data scope. Demo calls are visibly marked, excluded from live calls, graph entities, computed live signals, and Revenue DNA, and can be purged as one dataset. Synthetic evidence never serves as a basis for live executive reporting.
