# Security

Manager and evaluation actions append actor, entity, action, timestamp, and non-secret metadata to the audit log. Uploaded documents are treated as untrusted evidence; extraction explicitly ignores instructions inside them. Voice device identifiers remain browser-local, while organization limits store only allowed minutes, spend, and session duration.

Supabase sessions are refreshed at the application proxy and identity is revalidated with `auth.getUser()` before organization context is resolved. Organization creation is atomic, browser-supplied organization IDs are never trusted as authorization, and RLS restricts write operations by owner, manager, rep, and session ownership.

Tenant access is resolved from authenticated membership, never a browser-supplied organization ID. Every tenant table has `organization_id`, RLS is enabled, and server routes must repeat authorization checks. Reps may read only their own sessions; manager/owner review access is scoped to their organization.

OpenAI and Supabase service keys remain server-only. Practice clients receive only `repVisible`. Do not log full transcripts or hidden scenario partitions. Documents are untrusted, storage downloads use signed URLs, and upload adapters must validate type and size. Raw voice audio will not be retained by default.

Transcript deletion will soft-delete immediately and queue hard deletion. Organization deletion requires owner reauthentication, a cooling-off period, and cascaded tenant-data removal with an audit record containing no transcript content.
