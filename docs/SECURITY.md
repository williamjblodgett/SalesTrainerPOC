# Security

## Revenue intelligence controls

Every ingested call records consent status, source, processing purpose, region/policy reference, and retention before extraction. Calls with unknown or disallowed status are quarantined. Source recordings are not retained by default when a transcript is sufficient.

Normalized calls, assets, graph nodes, graph edges, signals, connector state, and deletion requests all carry `organization_id`. The hosted preview derives a single authorized organization server-side; production derives it from the authenticated membership and enforces the same scope with RLS. Neither API accepts a tenant identifier as authorization.

Customer data remains customer-owned. Product terms and the DPA should prohibit training shared models on customer content by default, list subprocessors and regions, define return/deletion duties, and preserve customer export rights. Provider credentials must be encrypted separately from application data, rotated, and unavailable to browser bundles.

Deletion is lineage-aware: restricting or deleting a source call also targets retained files, transcript segments, generated assets, graph evidence, search indexes, caches, exports, and provider copies controlled by Suadence. The request is queued with actor, scope, target, cooling-off deadline, and completion status; audit records never duplicate the deleted content.

Role grants for raw transcripts, derived intelligence, cross-department summaries, exports, integration administration, retention changes, and organization deletion are distinct. Sensitive export, source connection, and tenant deletion operations require owner authority, step-up authentication, and append-only audit records.

Manager and evaluation actions append actor, entity, action, timestamp, and non-secret metadata to the audit log. Uploaded documents are treated as untrusted evidence; extraction explicitly ignores instructions inside them. Voice device identifiers remain browser-local, while organization limits store only allowed minutes, spend, and session duration.

Supabase sessions are refreshed at the application proxy and identity is revalidated with `auth.getUser()` before organization context is resolved. Organization creation is atomic, browser-supplied organization IDs are never trusted as authorization, and RLS restricts write operations by owner, manager, rep, and session ownership.

Tenant access is resolved from authenticated membership, never a browser-supplied organization ID. Every tenant table has `organization_id`, RLS is enabled, and server routes must repeat authorization checks. Reps may read only their own sessions; manager/owner review access is scoped to their organization.

OpenAI and Supabase service keys remain server-only. Practice clients receive only `repVisible`. Do not log full transcripts or hidden scenario partitions. Documents are untrusted, storage downloads use signed URLs, and upload adapters must validate type and size. Raw voice audio will not be retained by default.

Transcript deletion will soft-delete immediately and queue hard deletion. Organization deletion requires owner reauthentication, a cooling-off period, and cascaded tenant-data removal with an audit record containing no transcript content.
