import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import industryPacks from "../public/data/industry-packs.json";

describe("industry launch library", () => {
  it("ships seven industries and thirty-five unique simulations", () => {
    expect(industryPacks).toHaveLength(7);
    const scenarios = industryPacks.flatMap((pack) => pack.scenarios.map((scenario) => `${pack.id}:${scenario.id}`));
    expect(scenarios).toHaveLength(35);
    expect(new Set(scenarios).size).toBe(35);
  });

  it("includes buyer roles, scoring criteria, and responsible-selling guardrails", () => {
    for (const pack of industryPacks) {
      expect(pack.buyerRoles.length).toBeGreaterThanOrEqual(5);
      expect(pack.criteria.length).toBeGreaterThanOrEqual(5);
      expect(pack.guardrails.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("GitHub Pages application", () => {
  it("uses hash-safe routes and contains no server credentials", () => {
    const script = readFileSync(path.resolve("demo/app.js"), "utf8");
    expect(script).toContain('location.hash = "/dashboard"');
    expect(script).toContain("#/practice");
    expect(script).not.toMatch(/OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY/);
  });
});
