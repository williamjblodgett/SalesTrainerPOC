import { KeyRound, ShieldCheck } from "lucide-react";

import { changePassword } from "@/app/auth/actions";
import { requireAppContext } from "@/lib/auth/context";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const context = await requireAppContext();
  const { error, message } = await searchParams;

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
            Your role is {context.role}. Organization deletion, member
            administration, and SSO controls remain planned production work.
          </p>
        </aside>
      </div>
    </>
  );
}
