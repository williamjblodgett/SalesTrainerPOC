import { describe, expect, it } from "vitest";

import {
  normalizeTranscript,
  personaDraftSchema,
  transcriptPersonaRequestSchema,
  validatePersonaEvidence,
} from "@/lib/domain/persona";

const transcript = `Seller: How is the forecast assembled today?
Buyer: Regional leaders send spreadsheets in different formats.
Seller: What happens downstream when they arrive late?
Buyer: Leadership questions the weekly forecast and my team loses Monday reconciling it.`;

describe("transcript persona contracts", () => {
  it("normalizes stable turn ids and speakers", () => {
    expect(normalizeTranscript(transcript)).toEqual([
      { turnId: "T1", speaker: "seller", content: "How is the forecast assembled today?" },
      { turnId: "T2", speaker: "buyer", content: "Regional leaders send spreadsheets in different formats." },
      { turnId: "T3", speaker: "seller", content: "What happens downstream when they arrive late?" },
      { turnId: "T4", speaker: "buyer", content: "Leadership questions the weekly forecast and my team loses Monday reconciling it." },
    ]);
  });

  it("rejects an unsupported evidence excerpt", () => {
    const source = transcriptPersonaRequestSchema.parse({
      industryId: "b2b-saas",
      retentionMode: "redact_then_delete",
      transcripts: [{ sourceId: "source-1", title: "Discovery", content: transcript, consentStatus: "synthetic" }],
    });
    const draft = personaDraftSchema.parse({
      schemaVersion: "1.0", status: "ai_generated",
      identity: { name: "Jordan", title: "VP Sales Operations", industry: "B2B SaaS", seniority: "VP", companyProfile: "Distributed sales team" },
      responsibilities: [], kpis: [], priorities: [], pains: [], objections: [],
      decisionProcess: { stakeholders: [], budgetPosture: "unknown", timeline: "unknown", approvalProcess: "unknown", alternatives: [] },
      behavior: { communicationStyle: "direct", talkativeness: 3, skepticism: 4, patience: 3, riskTolerance: 2 },
      vocabulary: [], complianceConstraints: [], conflicts: [], assumptions: [], missingInformation: [], evidenceCoverage: 0.5,
      evidenceClaims: [{ sourceId: "source-1", turnId: "T2", excerpt: "This text was invented", claimType: "pain", claim: "Spreadsheet inconsistency", confidence: 0.8 }],
    });
    expect(() => validatePersonaEvidence(draft, source.transcripts)).toThrow(/does not match/);
  });
});
