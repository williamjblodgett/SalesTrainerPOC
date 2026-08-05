import { describe, expect, it } from "vitest";

import {
  assetBlueprints,
  calculateRevenueDna,
  connectorCatalog,
  demoLabHtml,
  repairedLandingHtml as landingHtml,
  repairedRevenueAppHtml as revenueAppHtml,
  revenueSchemaStatements,
  validateAssetReview,
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
      approvedAssetCount: 20,
      nodeCount: 6,
      approvedReadinessAssetCount: 3,
      recentCallCount: 1,
      consentedCallCount: 1,
      signals: [{ signal_type: "knowledge_drift", severity: "high" }],
    });

    expect(result.status).toBe("complete");
    expect(result.overall).toBe(88);
    expect(result.confidence).toBe(52);
    expect(result.components).toEqual({
      marketCoverage: 68,
      messagingConsistency: 82,
      behaviorReadiness: 100,
      evidenceFreshness: 100,
      closedLoopActivation: 100,
      governanceHealth: 100,
    });
    expect(calculateRevenueDna({ callCount: 0 }).status).toBe("insufficient_evidence");

    const unapproved = calculateRevenueDna({
      callCount: 1,
      assetCount: 20,
      approvedAssetCount: 0,
      nodeCount: 6,
      approvedReadinessAssetCount: 0,
      recentCallCount: 1,
      consentedCallCount: 1,
      signals: [{ signal_type: "knowledge_drift", severity: "high" }],
    });

    expect(unapproved.overall).toBe(58);
    expect(unapproved.components?.behaviorReadiness).toBe(0);
    expect(unapproved.components?.closedLoopActivation).toBe(0);
  });

  it("keeps the category promise and enterprise buying narrative explicit", () => {
    expect(landingHtml).toContain("One call in.");
    expect(landingHtml).toContain("20 revenue assets out.");
    expect(landingHtml).toContain(">TBD<");
    expect(landingHtml).not.toContain("$12,000");
    expect(landingHtml).toContain("/demo");
    expect(landingHtml).toContain("Customer intelligence stays customer-owned");
    expect(landingHtml).toContain("V3 · Anticipate");
  });

  it("ships an isolated synthetic Demo Lab with visible data labeling", () => {
    expect(demoLabHtml).toContain("Suadence Synthetic Demo Lab");
    expect(demoLabHtml).toContain("SYNTHETIC DATA ONLY");
    expect(demoLabHtml).toContain("Generate cohort");
    expect(demoLabHtml).toContain("Reset synthetic data");
    expect(demoLabHtml).toContain("excluded from the live command center");
    expect(demoLabHtml).toContain("/brand/suadence-logo.webp");
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

    expect(tables.length).toBeGreaterThanOrEqual(10);
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

  it("models connector health without claiming unconfigured OAuth imports", () => {
    expect(connectorCatalog.map((connector) => connector.provider)).toEqual([
      "gong",
      "chorus",
      "zoom",
      "teams",
      "salesforce",
      "upload",
    ]);
    expect(revenueAppHtml).toContain("Customer authorization still required");
    expect(revenueAppHtml).toContain("Provider credentials not configured");
    expect(revenueAppHtml).toContain("Permitted scopes");
  });

  it("requires human review rationale for adverse asset decisions", () => {
    expect(validateAssetReview({ decision: "approved" })).toMatchObject({
      ok: true,
      decision: "approved",
    });
    expect(
      validateAssetReview({
        decision: "changes_requested",
        rationale: "Needs more evidence.",
      }),
    ).toMatchObject({ ok: true, decision: "changes_requested" });
    expect(validateAssetReview({ decision: "rejected", rationale: "no" })).toEqual({
      ok: false,
      code: "rationale_required",
    });
    expect(validateAssetReview({ decision: "published" })).toEqual({
      ok: false,
      code: "validation_failed",
    });
  });

  it("exposes evidence review, governed advisor, and deletion workflows", () => {
    expect(revenueAppHtml).toContain("Evidence-backed asset review");
    expect(revenueAppHtml).toContain("Human governance");
    expect(revenueAppHtml).toContain("Governed action queue");
    expect(revenueAppHtml).toContain("72-hour cooling-off window");
    expect(revenueAppHtml).toContain("Append-only accountability");
    expect(revenueAppHtml).toContain("Production readiness");
    expect(revenueAppHtml).toContain("Open Synthetic Demo Lab");
    expect(revenueAppHtml).toContain('href="/">← Main site</a>');
    expect(revenueAppHtml).toContain('href="/">Main site</a>');
    expect(revenueAppHtml).not.toMatch(/[ÃÂâÎ]/);
  });
});
