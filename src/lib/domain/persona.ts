import { z } from "zod";

const evidenceClaimSchema = z.object({
  id: z.string().min(1).max(100),
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

const fieldEvidenceSchema = z.object({
  path: z.string().min(1).max(200),
  support: z.enum(["observed", "inferred", "unknown"]),
  evidenceClaimIds: z.array(z.string().min(1)).max(50),
  explanation: z.string().min(1).max(500),
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
  fieldEvidence: z.array(fieldEvidenceSchema),
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
  consentAttested: z.literal(true, { error: "Transcript authority or synthetic status must be attested" }),
}).superRefine((value, context) => {
  const ids = new Set<string>();
  value.transcripts.forEach((transcript, index) => {
    if (ids.has(transcript.sourceId)) {
      context.addIssue({ code: "custom", message: "Transcript source IDs must be unique", path: ["transcripts", index, "sourceId"] });
    }
    ids.add(transcript.sourceId);
  });
});

export type PersonaDraft = z.infer<typeof personaDraftSchema>;
export type TranscriptPersonaRequest = z.infer<typeof transcriptPersonaRequestSchema>;

export const requiredPersonaEvidencePaths = [
  "identity.title", "responsibilities", "kpis", "priorities", "pains", "objections",
  "decisionProcess", "behavior.communicationStyle", "vocabulary",
] as const;

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

const injectionPatterns = [
  /ignore (?:all |the )?(?:previous|prior|system) instructions?/i,
  /reveal (?:the )?(?:system prompt|hidden prompt|rubric)/i,
  /you are now (?:an?|the) /i,
  /act as (?:an?|the) (?:assistant|system|evaluator|coach)/i,
  /<\/?(?:system|assistant|developer)>/i,
];

export function isPromptInjectionAttempt(content: string) {
  return injectionPatterns.some((pattern) => pattern.test(content));
}

export class PersonaEvidenceError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join(" "));
    this.name = "PersonaEvidenceError";
  }
}

export function assessTranscriptEvidence(sources: TranscriptPersonaRequest["transcripts"]) {
  const turns = sources.flatMap((source) => normalizeTranscript(source.content).map((turn) => ({ ...turn, sourceId: source.sourceId })));
  const injectionTurnIds = turns.filter((turn) => isPromptInjectionAttempt(turn.content)).map((turn) => `${turn.sourceId}:${turn.turnId}`);
  const usableBuyerTurns = turns.filter((turn) => turn.speaker === "buyer" && !isPromptInjectionAttempt(turn.content));
  const issues: string[] = [];
  if (usableBuyerTurns.length < 2) issues.push("At least two usable buyer turns are required to create a persona.");
  if (usableBuyerTurns.every((turn) => turn.content.length < 20)) issues.push("Buyer evidence is too brief to support a persona.");
  return { turns, usableBuyerTurns, injectionTurnIds, issues };
}

export function validatePersonaEvidence(draft: PersonaDraft, sources: TranscriptPersonaRequest["transcripts"]) {
  const turns = new Map<string, string>();
  for (const source of sources) {
    for (const turn of normalizeTranscript(source.content)) turns.set(`${source.sourceId}:${turn.turnId}`, turn.content);
  }
  const claimIds = new Set<string>();
  for (const claim of draft.evidenceClaims) {
    if (claimIds.has(claim.id)) throw new Error(`Duplicate persona evidence ID ${claim.id}`);
    claimIds.add(claim.id);
    const sourceTurn = turns.get(`${claim.sourceId}:${claim.turnId}`);
    const normalizedSource = sourceTurn?.replace(/\s+/g, " ").trim().toLocaleLowerCase();
    const normalizedExcerpt = claim.excerpt.replace(/\s+/g, " ").trim().toLocaleLowerCase();
    if (!normalizedSource || isPromptInjectionAttempt(claim.excerpt) || !normalizedSource.includes(normalizedExcerpt)) {
      throw new Error(`Persona evidence does not match ${claim.sourceId}:${claim.turnId}`);
    }
  }
  if (!draft.evidenceClaims.length) throw new Error("Persona draft must include transcript evidence");
  const paths = new Set(draft.fieldEvidence.map((item) => item.path));
  for (const path of requiredPersonaEvidencePaths) {
    if (!paths.has(path)) throw new Error(`Persona field evidence is missing ${path}`);
  }
  for (const field of draft.fieldEvidence) {
    if (field.support === "observed" && field.evidenceClaimIds.length === 0) throw new Error(`Observed field ${field.path} must cite evidence`);
    if (field.evidenceClaimIds.some((id) => !claimIds.has(id))) throw new Error(`Persona field ${field.path} cites unknown evidence`);
  }
  return draft;
}
