import { Building2, Check, ShieldCheck, Sparkles } from "lucide-react";

import { createOrganization } from "@/app/auth/actions";

export default async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="onboarding-shell">
      <div className="onboarding-progress">
        <span className="active">1</span>
        <i />
        <span>2</span>
        <i />
        <span>3</span>
        <p>Workspace</p>
        <p>Product and buyer</p>
        <p>Starter scenarios</p>
      </div>
      <div className="onboarding-grid">
        <section>
          <span className="eyebrow">Set up your team</span>
          <h1>Create your sales-readiness workspace.</h1>
          <p className="page-lead">
            Start with the company your reps represent. Suadence will use this
            context to ground personas, buyer behavior, and evaluation.
          </p>
          <div className="trust-list">
            <div>
              <ShieldCheck />
              <span>
                <strong>Tenant-isolated by default</strong>
                Your company data and transcripts remain in your organization.
              </span>
            </div>
            <div>
              <Sparkles />
              <span>
                <strong>Structured, not prompt-driven</strong>
                Managers configure business concepts using guided fields.
              </span>
            </div>
          </div>
        </section>
        <form action={createOrganization} className="panel onboarding-form">
          <div className="icon-tile">
            <Building2 />
          </div>
          <h2>Workspace details</h2>
          <p>This is visible only to invited members.</p>
          {error && <div className="form-alert">{error}</div>}
          <label>
            Company or team name
            <input
              name="name"
              placeholder="Northstar Revenue Team"
              minLength={2}
              required
            />
          </label>
          <label>
            Workspace URL
            <div className="slug-field">
              <span>suadence.com/</span>
              <input
                name="slug"
                placeholder="northstar"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
              />
            </div>
          </label>
          <button className="button button-block" type="submit">
            Continue to product setup
          </button>
          <p className="privacy-note">
            <Check size={15} /> You can change the display name later.
          </p>
        </form>
      </div>
    </div>
  );
}
