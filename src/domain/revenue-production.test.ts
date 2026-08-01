import { describe, expect, it } from "vitest";

import {
  buildAssetDescriptor,
  buildSyntheticTranscript,
  demoTemplates,
  entitySimilarity,
  extractDeterministicNodes,
  normalizeEntityLabel,
  signConnectorPayload,
  validateNormalizedConnectorEvent,
  verifyConnectorSignature,
} from "../../dist/server/revenue-production.js";

describe("production revenue intelligence contracts", () => {
  it("generates clearly labeled, deterministic synthetic demonstrations", () => {
    expect(demoTemplates).toHaveLength(4);

    const strong = buildSyntheticTranscript({
      templateKey: "forecast_confidence",
      sellerQuality: "strong",
    });
    const weak = buildSyntheticTranscript({
      templateKey: "forecast_confidence",
      sellerQuality: "weak",
    });

    expect(strong.transcript).toContain("SYNTHETIC DEMONSTRATION TRANSCRIPT");
    expect(strong.transcript).toContain("no real customer data");
    expect(strong.transcript).toContain("systems workflow review");
    expect(weak.transcript).toContain("This is not relevant enough to continue");
    expect(weak.transcript).not.toContain("appropriate owner");
  });

  it("extracts six evidence nodes and derives call-specific assets", () => {
    const synthetic = buildSyntheticTranscript({ templateKey: "security_review" });
    const nodes = extractDeterministicNodes("call-1", synthetic.transcript, synthetic.hints);
    const descriptor = buildAssetDescriptor(
      "battle_card",
      { account_name: synthetic.accountName },
      nodes,
    );

    expect(nodes).toHaveLength(6);
    expect(new Set(nodes.map((node) => node.type))).toEqual(
      new Set(["persona", "pain", "impact", "objection", "risk", "next_step"]),
    );
    expect(descriptor.title).toContain("Data retention is too risky");
    expect(descriptor.summary).toContain("Security review delays");
  });

  it("normalizes graph entities and identifies likely duplicates", () => {
    expect(normalizeEntityLabel("The Current CRM Reporting Process")).toBe(
      "crm reporting process",
    );
    expect(entitySimilarity("forecast reconciliation", "weekly forecast reconciliation")).toBe(
      0.67,
    );
    expect(entitySimilarity("budget freeze", "manager adoption")).toBe(0);
  });

  it("validates a normalized connector event at the ingestion boundary", () => {
    const valid = validateNormalizedConnectorEvent(
      {
        eventId: "evt-1",
        eventType: "transcript.ready",
        call: {
          externalCallId: "gong-call-1",
          title: "Discovery call",
          accountName: "Example Co",
          durationSeconds: 900,
          consentStatus: "confirmed",
          transcript:
            "Seller: How does the current process work? Buyer: We reconcile every regional forecast manually each Friday.",
        },
      },
      "gong",
    );

    expect(valid).toMatchObject({
      ok: true,
      eventId: "evt-1",
      externalCallId: "gong-call-1",
    });
    expect(
      validateNormalizedConnectorEvent(
        {
          eventId: "evt-2",
          eventType: "transcript.ready",
          call: { externalCallId: "call-2", transcript: "too short", consentStatus: "confirmed" },
        },
        "gong",
      ),
    ).toMatchObject({ ok: false, code: "transcript_invalid" });
    expect(validateNormalizedConnectorEvent({ eventId: "evt" }, "unknown")).toEqual({
      ok: false,
      code: "provider_not_supported",
    });
  });

  it("rejects tampered and replayed signed connector payloads", async () => {
    const secret = "test-only-secret";
    const body = JSON.stringify({ eventId: "evt-1" });
    const now = Date.now();
    const timestamp = String(Math.floor(now / 1000));
    const signature = await signConnectorPayload(secret, timestamp, body);

    await expect(
      verifyConnectorSignature({ secret, timestamp, signature, body, now }),
    ).resolves.toBe(true);
    await expect(
      verifyConnectorSignature({ secret, timestamp, signature, body: `${body}x`, now }),
    ).resolves.toBe(false);
    await expect(
      verifyConnectorSignature({
        secret,
        timestamp,
        signature,
        body,
        now: now + 6 * 60 * 1000,
      }),
    ).resolves.toBe(false);
  });
});
