import fs from "node:fs";

import { describe, expect, it } from "vitest";

describe("authentication hardening", () => {
  const actions = fs.readFileSync("src/app/auth/actions.ts", "utf8");
  const confirmationRoute = fs.readFileSync("src/app/auth/confirm/route.ts", "utf8");
  const signup = fs.readFileSync("src/app/signup/page.tsx", "utf8");
  const productionAuth = JSON.parse(
    fs.readFileSync("supabase/auth-production-config.json", "utf8"),
  ) as Record<string, unknown>;

  it("uses a server-side non-enumerating password reset request", () => {
    expect(actions).toContain("resetPasswordForEmail");
    expect(actions).toContain("If that account exists");
    expect(actions).not.toContain("/auth/v1/user");
  });

  it("verifies token hashes into an SSR session before changing a password", () => {
    expect(confirmationRoute).toContain("verifyOtp");
    expect(confirmationRoute).toContain("token_hash");
    expect(confirmationRoute).toContain("httpOnly: true");
    expect(actions).toContain("supabase.auth.getUser()");
    expect(actions).toContain('scope: "global"');
  });

  it("keeps the pilot invite-only", () => {
    expect(signup).toContain("Invite-only access");
    expect(signup).not.toContain("signUp");
    expect(productionAuth.disable_signup).toBe(true);
  });

  it("provides an owner-controlled tenant invitation workflow", () => {
    const team = fs.readFileSync("src/app/app/team/page.tsx", "utf8");
    expect(team).toContain("inviteUserByEmail");
    expect(team).toContain("canOwn(actionContext.role)");
    expect(team).toContain('from("memberships").insert');
  });

  it("uses cross-device token-hash links on the canonical origin", () => {
    expect(productionAuth.site_url).toBe("https://salessim-five.vercel.app");
    expect(String(productionAuth.mailer_templates_recovery_content)).toContain(
      "token_hash={{ .TokenHash }}",
    );
    expect(String(productionAuth.mailer_templates_invite_content)).toContain(
      "type=invite",
    );
  });
});
