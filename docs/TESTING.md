# Testing

`pnpm test` covers schemas, rubric totals, hidden-data filtering, authorization invariants, mock contracts, deterministic scoring, the 20-asset invariant, Revenue DNA, asset governance, synthetic transcript labeling, graph normalization, normalized connector validation, HMAC tamper detection, and webhook replay rejection.

Release gates are:

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`
4. `pnpm build`
5. `pnpm validate:hosted`
6. Hosted API smoke test
7. Browser walkthrough at desktop and mobile widths

The hosted HTML validator compiles every inline client script, verifies the optimized logo path, requires the synthetic-data banner and safe storage fallback, and rejects published dollar pricing.

The 2026-08-01 local desktop browser pass verified the landing page, Synthetic Demo Lab, and Revenue OS at 1280×720. It confirmed clean logo dimensions, no horizontal overflow, empty live-data inputs, consent unchecked by default, demo/live isolation messages, safe unavailable-storage states, TBD pricing, and no new console exceptions after exercising graph, persona, coaching, advisor, and executive views. Persistent demo generation still requires the hosted D1 smoke test after deployment.

The hosted smoke flow resets synthetic data, generates a four-call cohort, verifies 80 assets and 24 nodes, confirms at least one threshold-based demo signal, inspects one run, confirms live dashboard counts are unchanged, and resets the demo dataset again.

Signed-ingestion tests use a test-only secret. Never put a production connector secret in fixtures or command output. Live provider and live-model tests remain behind explicit environment flags and require disposable customer/provider tenants.

Database/RLS tests must run against disposable local or hosted Supabase projects before multi-tenant release. Required cases include two-organization isolation, role restrictions, graph evidence scope, demo/live isolation, event idempotency, deletion cascade, cancellation during cooling-off, and processor authorization.
