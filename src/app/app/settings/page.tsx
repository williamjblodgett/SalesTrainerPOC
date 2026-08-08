import { KeyRound, ShieldCheck } from "lucide-react";

import { changePassword } from "@/app/auth/actions";
import { requireAppContext } from "@/lib/auth/context";
import { connectorCatalog } from "@/lib/revenue-os/contracts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const context = await requireAppContext();
  const { error, message } = await searchParams;
  const admin = createSupabaseAdminClient();
  const [{ data: connections }, { data: identityConfigs }] = admin ? await Promise.all([
    admin.from("connector_connections").select("provider,status,last_synced_at,last_error_code").eq("organization_id", context.organization.id),
    admin.from("enterprise_identity_configs").select("protocol,status,provider_name").eq("organization_id", context.organization.id),
  ]) : [{ data: [] }, { data: [] }];
  const connectionMap = new Map((connections ?? []).map((item) => [item.provider, item]));
  const launchChecks = [
    ["OpenAI production provider", process.env.AI_PROVIDER === "openai" && Boolean(process.env.OPENAI_API_KEY)],
    ["Commercial document scanner", process.env.DOCUMENT_SCANNER_MODE === "cloudmersive" && Boolean(process.env.CLOUDMERSIVE_API_KEY)],
    ["Text realism benchmark", process.env.TEXT_REALISM_BENCHMARK_STATUS === "passed"],
    ["Realtime voice release gate", process.env.ENABLE_REALTIME_VOICE === "true" && process.env.TEXT_REALISM_BENCHMARK_STATUS === "passed"],
    ["Custom authentication SMTP", process.env.AUTH_SMTP_CONFIGURED === "true"],
    ["Production monitoring", process.env.MONITORING_CONFIGURED === "true"],
    ["Legal approval", process.env.LEGAL_APPROVAL_STATUS === "approved"],
  ] as const;

  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">Account and organization</span>
          <h1>Settings</h1>
          <p className="page-lead">
            Manage your Suadence account security and workspace preferences.
          </p>
        </div>
      </header>

      <div className="dashboard-grid">
        <section className="panel space-y">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Account security</span>
              <h2>Change password</h2>
            </div>
            <div className="priority-icon teal"><KeyRound size={20} /></div>
          </div>
          <p className="page-lead">
            Signed in as {context.user.email}. Use a unique password with at
            least 12 characters.
          </p>
          {error && <div className="form-alert">{error}</div>}
          {message && <div className="form-alert">{message}</div>}
          <form action={changePassword} className="auth-form">
            <label>
              New password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
              />
            </label>
            <button className="button" type="submit">Update password</button>
          </form>
        </section>

        <aside className="panel space-y">
          <div className="priority-icon green"><ShieldCheck size={20} /></div>
          <div>
            <span className="eyebrow">Workspace access</span>
            <h2>{context.organization.name}</h2>
          </div>
          <p className="page-lead">
            Your role is {context.role}. Enterprise identity is fail-closed and
            activates only after provider verification.
          </p>
          <div className="grid gap-2">{(identityConfigs ?? []).length ? identityConfigs!.map((config) => <div className="rounded-xl border border-slate-200 p-3 text-sm" key={config.protocol}><strong>{config.protocol.toUpperCase()}</strong> · {config.provider_name} · {config.status}</div>) : <p className="text-sm text-slate-500">SSO and SCIM are not configured for this workspace.</p>}</div>
        </aside>
      </div>
      <section className="card mt-6"><span className="eyebrow">Integrations</span><h2 className="mt-2 font-semibold">Call and CRM connectors</h2><p className="mt-2 text-sm text-slate-500">Connections remain unavailable until an administrator supplies provider OAuth credentials. Tokens are referenced through a secret store and are never returned to this page.</p><div className="mt-5 grid gap-3 md:grid-cols-2">{connectorCatalog.map((connector) => { const state = connectionMap.get(connector.provider); return <article className="rounded-xl border border-slate-200 p-4" key={connector.provider}><div className="flex items-center justify-between"><strong>{connector.name}</strong><span className="badge">{state?.status ?? "not configured"}</span></div><p className="mt-2 text-xs text-slate-500">Required scopes: {connector.scopes.join(", ")}</p>{state?.last_synced_at && <p className="mt-2 text-xs">Last sync {new Date(state.last_synced_at).toLocaleString()}</p>}</article>; })}</div></section>
      <section className="card mt-6"><span className="eyebrow">Production readiness</span><h2 className="mt-2 font-semibold">Release gates</h2><p className="mt-2 text-sm text-slate-500">A missing external dependency is shown explicitly and cannot silently fall back in production.</p><div className="mt-5 grid gap-2">{launchChecks.map(([label, ready]) => <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3" key={label}><span>{label}</span><span className={`badge ${ready ? "" : "warning"}`}>{ready ? "Ready" : "Required"}</span></div>)}</div></section>
    </>
  );
}
