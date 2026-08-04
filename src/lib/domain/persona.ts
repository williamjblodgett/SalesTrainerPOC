import { z } from "zod";

const evidenceClaimSchema = z.object({
  sourceId: z.string().min(1),
  turnId: z.string().min(1),
  excerpt: z.string().min(1).max(500),
  claimType: z.enum([
    "responsibility",
    "kpi",
    "priority",
    "pain",
    "business_impact",
    "emotional_impact",
    "objection",
    "decision_process",
    "communication_style",
    "vocabulary",
  ]),
  claim: z.string().min(1).max(1_000),
  confidence: z.number().min(0).max(1),
});

const objectionSchema = z.object({
  surfaceStatement: z.string(),
  trigger: z.string(),
  underlyingConcern: z.string(),
  resolutionSignals: z.array(z.string()),
});

export const personaDraftSchema = z.object({
  schemaVersion: z.literal("1.0"),
  status: z.enum(["ai_generated", "in_review", "approved", "published"]),
  identity: z.object({
    name: z.string().min(1),
    title: z.string().min(1),
    industry: z.string().min(1),
    seniority: z.string(),
    companyProfile: z.string(),
  }),
  responsibilities: z.array(z.string()),
  kpis: z.array(z.string()),
  priorities: z.array(z.string()),
  pains: z.array(
    z.object({
      label: z.string(),
      symptoms: z.array(z.string()),
      businessImpact: z.array(z.string()),
      emotionalImpact: z.array(z.string()),
      buyingTriggers: z.array(z.string()),
    }),
  ),
  objections: z.array(objectionSchema),
  decisionProcess: z.object({
    stakeholders: z.array(z.string()),
    budgetPosture: z.string(),
    timeline: z.string(),
    approvalProcess: z.string(),
    alternatives: z.array(z.string()),
  }),
  behavior: z.object({
    communicationStyle: z.string(),
    talkativeness: z.number().int().min(1).max(5),
    skepticism: z.number().int().min(1).max(5),
    patience: z.number().int().min(1).max(5),
    riskTolerance: z.number().int().min(1).max(5),
  }),
  vocabulary: z.array(z.string()),
  complianceConstraints: z.array(z.string()),
  evidenceClaims: z.array(evidenceClaimSchema),
  conflicts: z.array(z.object({ field: z.string(), description: z.string(), sourceIds: z.array(z.string()) })),
  assumptions: z.array(z.string()),
  missingInformation: z.array(z.string()),
  evidenceCoverage: z.number().min(0).max(1),
});

export const transcriptPersonaRequestSchema = z.object({
  industryId: z.string().min(1),
  transcripts: z.array(
    z.object({
      sourceId: z.string().min(1).max(100),
      title: z.string().min(1).max(200),
      content: z.string().min(120).max(200_000),
      consentStatus: z.enum(["confirmed", "synthetic"]),
    }),
  ).min(1).max(20),
  retentionMode: z.enum(["redact_then_delete", "retain_for_audit"]),
});

export type PersonaDraft = z.infer<typeof personaDraftSchema>;
export type TranscriptPersonaRequest = z.infer<typeof transcriptPersonaRequestSchema>;

export function normalizeTranscript(content: string) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      turnId: `T${index + 1}`,
      speaker: /^(buyer|customer|prospect)\s*:/i.test(line) ? "buyer" as const : /^(seller|rep|advisor|agent)\s*:/i.test(line) ? "seller" as const : "unknown" as const,
      content: line.replace(/^[^:]{1,40}:\s*/, ""),
    }));
}

export function validatePersonaEvidence(draft: PersonaDraft, sources: TranscriptPersonaRequest["transcripts"]) {
  const turns = new Map<string, string>();
  for (const source of sources) {
    for (const turn of normalizeTranscript(source.content)) turns.set(`${source.sourceId}:${turn.turnId}`, turn.content);
  }
  for (const claim of draft.evidenceClaims) {
    const sourceTurn = turns.get(`${claim.sourceId}:${claim.turnId}`);
    if (!sourceTurn || !sourceTurn.toLocaleLowerCase().includes(claim.excerpt.toLocaleLowerCase())) {
      throw new Error(`Persona evidence does not match ${claim.sourceId}:${claim.turnId}`);
    }
  }
  return draft;
}
