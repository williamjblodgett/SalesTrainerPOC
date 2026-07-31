import { describe, expect, it } from "vitest";

import {
  assetBlueprints,
  calculateRevenueDna,
  landingHtml,
  revenueAppHtml,
  revenueSchemaStatements,
} from "../../dist/server/revenue-os.js";

describe("Suadence Revenue OS", () => {
  it("turns one call into exactly 20 distinct governed asset types", () => {
    const types = assetBlueprints.map(([type]) => type);

    expect(assetBlueprints).toHaveLength(20);
    expect(new Set(types).size).toBe(20);
    expect(types).toEqual(
      expect.arrayContaining([
        "customer_persona",
        "digital_twin",
        "roleplay",
        "battle_card",
        "follow_up",
        "manager_coaching",
        "executive_brief",
        "knowledge_update",
      ]),
    );
  });

  it("calculates Revenue DNA deterministically and exposes evidence confidence", () => {
    const result = calculateRevenueDna({
      callCount: 1,
      assetCount: 20,
      nodeCount: 6,
      readinessAssetCount: 3,
      recentCallCount: 1,
      consentedCallCount: 1,
      signals: [{ signal_type: "knowledge_drift", severity: "high" }],
    });

    expect(result.status).toBe("complete");
    expect(result.overall).toBe(84);
    expect(result.confidence).toBe(52);
    expect(result.components).toEqual({
      marketCoverage: 68,
      messagingConsistency: 82,
      behaviorReadiness: 100,
      evidenceFreshness: 100,
      closedLoopActivation: 60,
      governanceHealth: 100,
    });
    expect(calculateRevenueDna({ callCount: 0 }).status).toBe("insufficient_evidence");
  });

  it("keeps the category promise and enterprise buying narrative explicit", () => {
    expect(landingHtml).toContain("One call in.");
    expect(landingHtml).toContain("20 revenue assets out.");
    expect(landingHtml).toContain("3-month starter");
    expect(landingHtml).toContain("Customer intelligence stays customer-owned");
    expect(landingHtml).toContain("V3 · Anticipate");
  });

  it("requires consent in the live ingestion workflow", () => {
    expect(revenueAppHtml).toContain("Consent-aware source layer");
    expect(revenueAppHtml).toContain('name="consent"');
    expect(revenueAppHtml).toContain("consentStatus");
    expect(revenueAppHtml).toContain("Deletion workflows");
  });

  it("scopes every revenue intelligence table and index to an organization", () => {
    const tables = revenueSchemaStatements.filter((statement) =>
      statement.startsWith("CREATE TABLE"),
    );

    expect(tables.length).toBeGreaterThanOrEqual(6);
    expect(tables.every((statement) => statement.includes("organization_id TEXT NOT NULL"))).toBe(true);
    expect(revenueSchemaStatements.join("\n")).toContain(
      "revenue_calls(organization_id, idempotency_key)",
    );
  });

  it("presents the product as an operating system across revenue departments", () => {
    const productExperience = landingHtml + revenueAppHtml;

    for (const department of [
      "Sales",
      "Enablement",
      "Marketing",
      "Product",
      "Customer Success",
      "Leadership",
    ]) {
      expect(productExperience).toContain(department);
    }
    expect(revenueAppHtml).toContain("Knowledge graph");
    expect(revenueAppHtml).toContain("Revenue DNA Score");
    expect(revenueAppHtml).toContain("Proactive revenue advisor");
  });
});
