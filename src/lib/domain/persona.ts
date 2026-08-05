import { z } from "zod";

export const evidenceClaimSchema = z.preprocess((input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input;
  const claim = input as Record<string, unknown>;
  const excerpt = typeof claim.excerpt === "string" ? claim.excerpt : "";
  const charStart = typeof claim.charStart === "number" ? claim.charStart : 0;
  return { ...claim, charStart, charEnd: typeof claim.charEnd === "number" ? claim.charEnd : charStart + excerpt.length, origin: claim.origin ?? "observed" };
}, z.object({
  id: z.string().min(1).max(100),
  sourceId: z.string().min(1),
  turnId: z.string().min(1),
  excerpt: z.string().min(1).max(500),
  charStart: z.number().int().min(0),
  charEnd: z.number().int().positive(),
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
  origin: z.enum(["observed", "inferred", "manager_authored", "industry_template"]),
  confidence: z.number().min(0).max(1),
}).superRefine((claim, context) => {
  if (claim.charEnd <= claim.charStart) context.addIssue({ code: "custom", message: "Evidence span must have positive length", path: ["charEnd"] });
  if (claim.origin === "observed" && claim.charEnd - claim.charStart !== claim.excerpt.length) {
    context.addIssue({ code: "custom", message: "Observed evidence span must match excerpt length", path: ["charEnd"] });
  }
}));

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
      storagePath: z.string().max(500).optional(),
      provider: z.string().max(50).optional(),
      scannerStatus: z.string().max(100).optional(),
      piiFindings: z.array(z.object({ kind: z.string(), count: z.number().int().positive() })).max(20).optional(),
      originalFilename: z.string().max(255).optional(),
      originalMimeType: z.string().max(150).optional(),
      originalSizeBytes: z.number().int().positive().max(20 * 1024 * 1024).optional(),
    }),
  ).min(1).max(20),
  retentionMode: z.enum(["redact_then_delete", "retain_for_audit", "retain_until_deleted"]),
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
    if (claim.origin === "observed" && sourceTurn?.slice(claim.charStart, claim.charEnd) !== claim.excerpt) {
      throw new Error(`Persona evidence span does not match ${claim.sourceId}:${claim.turnId}`);
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

export type PersonaClaimReview = {
  claimId: string;
  disposition: "accepted" | "edited" | "rejected";
  rationale?: string;
  replacementClaim?: string;
};

export function projectReviewedPersona(draft: PersonaDraft, reviews: PersonaClaimReview[]) {
  const expected = new Set(draft.evidenceClaims.map((claim) => claim.id));
  const received = new Set(reviews.map((review) => review.claimId));
  if (received.size !== reviews.length || received.size !== expected.size || [...received].some((id) => !expected.has(id))) {
    throw new Error("Claim reviews must exactly match the draft evidence claim set");
  }
  const reviewById = new Map(reviews.map((review) => [review.claimId, review]));
  const evidenceClaims = draft.evidenceClaims.flatMap((claim) => {
    const review = reviewById.get(claim.id)!;
    if (review.disposition === "rejected") return [];
    if (review.disposition === "edited") {
      if (!review.replacementClaim?.trim()) throw new Error(`Edited claim ${claim.id} requires replacement text`);
      return [{ ...claim, claim: review.replacementClaim.trim(), origin: "manager_authored" as const, confidence: 1 }];
    }
    return [claim];
  });
  const acceptedIds = new Set(evidenceClaims.map((claim) => claim.id));
  const fieldEvidence = draft.fieldEvidence.map((field) => {
    const evidenceClaimIds = field.evidenceClaimIds.filter((id) => acceptedIds.has(id));
    return evidenceClaimIds.length ? { ...field, evidenceClaimIds } : { ...field, support: "unknown" as const, evidenceClaimIds: [], explanation: "No accepted evidence supports this field." };
  });
  const supported = (path: string) => fieldEvidence.find((field) => field.path === path)?.support !== "unknown";
  const projected = {
    ...draft,
    status: "approved" as const,
    identity: { ...draft.identity, title: supported("identity.title") ? draft.identity.title : "Unknown buyer role" },
    responsibilities: supported("responsibilities") ? draft.responsibilities : [],
    kpis: supported("kpis") ? draft.kpis : [],
    priorities: supported("priorities") ? draft.priorities : [],
    pains: supported("pains") ? draft.pains : [],
    objections: supported("objections") ? draft.objections : [],
    decisionProcess: supported("decisionProcess") ? draft.decisionProcess : { stakeholders: [], budgetPosture: "Unknown", timeline: "Unknown", approvalProcess: "Unknown", alternatives: [] },
    behavior: { ...draft.behavior, communicationStyle: supported("behavior.communicationStyle") ? draft.behavior.communicationStyle : "Unknown" },
    vocabulary: supported("vocabulary") ? draft.vocabulary : [],
    evidenceClaims,
    fieldEvidence,
  };
  return personaDraftSchema.parse(projected);
}
