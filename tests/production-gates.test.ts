import fs from "node:fs";

import { describe, expect, it } from "vitest";

describe("production launch gates", () => {
  it("fails closed when canonical production has no Supabase authentication", () => {
    const context = fs.readFileSync("src/lib/auth/context.ts", "utf8");
    const proxy = fs.readFileSync("src/proxy.ts", "utf8");
    expect(context).toContain("Supabase authentication is required in production");
    expect(proxy).toContain("Service configuration unavailable");
  });

  it("declares Supabase authentication without a ChatGPT dependency", () => {
    const health = fs.readFileSync("src/app/api/health/route.ts", "utf8");
    expect(health).toContain('authProvider: "supabase"');
    expect(health).toContain("chatgptAccountRequired: false");
  });

  it("ships public legal disclosures and operational runbooks", () => {
    for (const file of [
      "public/legal/privacy.html",
      "public/legal/terms.html",
      "public/legal/subprocessors.html",
      "public/legal/security.html",
      "docs/INCIDENT-RESPONSE.md",
      "docs/DATA-RETENTION.md",
      "docs/MONITORING.md",
      "docs/DPA-CHECKLIST.md",
    ]) {
      expect(fs.existsSync(file), `${file} must exist`).toBe(true);
    }
  });

  it("requires a real authenticated browser identity in production deployment", () => {
    const workflow = fs.readFileSync(".github/workflows/canonical-deploy.yml", "utf8");
    expect(workflow).toContain("E2E_EMAIL");
    expect(workflow).toContain("E2E_PASSWORD");
    expect(workflow).toContain("test:e2e:authenticated");
    expect(workflow).toContain("/api/health");
  });
});
