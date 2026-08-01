# Testing

`pnpm test` covers schemas, rubric totals, hidden-data filtering, authorization invariants, mock contracts, deterministic scoring, the 20-asset invariant, Revenue DNA, asset governance, synthetic transcript labeling, graph normalization, normalized connector validation, HMAC tamper detection, and webhook replay rejection.

Release gates are:

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`
4. `pnpm build`
5. Hosted API smoke test
6. Browser walkthrough at desktop and mobile widths

The hosted smoke flow resets synthetic data, generates a four-call cohort, verifies 80 assets and 24 nodes, confirms at least one threshold-based demo signal, inspects one run, confirms live dashboard counts are unchanged, and resets the demo dataset again.

Signed-ingestion tests use a test-only secret. Never put a production connector secret in fixtures or command output. Live provider and live-model tests remain behind explicit environment flags and require disposable customer/provider tenants.

Database/RLS tests must run against disposable local or hosted Supabase projects before multi-tenant release. Required cases include two-organization isolation, role restrictions, graph evidence scope, demo/live isolation, event idempotency, deletion cascade, cancellation during cooling-off, and processor authorization.
