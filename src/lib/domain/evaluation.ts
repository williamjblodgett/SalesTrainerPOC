import { z } from "zod";
import { difficultySchema } from "./scenario";

const score = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
export const evaluationResultSchema = z.object({
  evaluationStatus: z.enum(["complete", "insufficient_evidence"]),
  callOutcome: z.enum(["advanced", "neutral", "stalled", "ended"]),
  criteria: z.array(z.object({ criterionId: z.string(), score, confidence: z.number().min(0).max(1), evidence: z.array(z.object({ turnId: z.string(), excerpt: z.string() })), rationale: z.string(), nextAction: z.string() })),
  strengths: z.array(z.string()), priorityImprovements: z.array(z.string()),
  missedSignals: z.array(z.object({ signalId: z.string(), evidenceTurnId: z.string(), explanation: z.string() })),
  unsupportedClaims: z.array(z.object({ turnId: z.string(), claim: z.string(), explanation: z.string() })),
  rewriteMoments: z.array(z.object({ turnId: z.string(), original: z.string(), strongerAlternative: z.string(), principle: z.string() })).max(2),
  recommendedNextDrill: z.object({ skill: z.string(), difficulty: difficultySchema, rationale: z.string() }),
}).superRefine((result, context) => {
  const ids = result.criteria.map((criterion) => criterion.criterionId);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", message: "Evaluation criteria must be unique", path: ["criteria"] });
  if (result.evaluationStatus === "complete") result.criteria.forEach((criterion, index) => {
    if (criterion.score > 0 && criterion.evidence.length === 0) context.addIssue({ code: "custom", message: "Positive scores require transcript evidence", path: ["criteria", index, "evidence"] });
  });
});
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

export function calculateWeightedScore(result: EvaluationResult, rubric: Array<{ id: string; weight: number }>) {
  if (result.evaluationStatus === "insufficient_evidence") return null;
  const rubricIds = new Set(rubric.map((criterion) => criterion.id));
  if (rubricIds.size !== rubric.length || result.criteria.length !== rubric.length || result.criteria.some((criterion) => !rubricIds.has(criterion.criterionId))) {
    throw new Error("A complete evaluation must score every rubric criterion exactly once");
  }
  const scores = new Map(result.criteria.map((item) => [item.criterionId, item.score]));
  const total = rubric.reduce((sum, criterion) => sum + ((scores.get(criterion.id) ?? 0) / 4) * criterion.weight, 0);
  return Math.max(0, Math.min(100, Math.round(total)));
}

export function validateEvaluationAgainstTranscript(
  result: EvaluationResult,
  rubric: Array<{ id: string; weight: number }>,
  turns: Array<{ id: string; role: "seller" | "buyer"; content: string }>,
) {
  const parsed = evaluationResultSchema.parse(result);
  if (parsed.evaluationStatus === "insufficient_evidence") return parsed;
  calculateWeightedScore(parsed, rubric);
  const sellerTurns = new Map(turns.filter((turn) => turn.role === "seller").map((turn) => [turn.id, turn.content]));
  for (const criterion of parsed.criteria) {
    for (const evidence of criterion.evidence) {
      const content = sellerTurns.get(evidence.turnId);
      if (!content || !content.includes(evidence.excerpt)) throw new Error(`Evaluation evidence does not match seller turn ${evidence.turnId}`);
    }
  }
  return parsed;
}

export function calculateEffectiveWeightedScore(
  result: EvaluationResult,
  rubric: Array<{ id: string; weight: number }>,
  overrides: Array<{ criterionId: string; replacementScore: 0 | 1 | 2 | 3 | 4 }>,
) {
  if (result.evaluationStatus === "insufficient_evidence") return null;
  const latest = new Map(overrides.map((override) => [override.criterionId, override.replacementScore]));
  const effective = { ...result, criteria: result.criteria.map((criterion) => ({ ...criterion, score: latest.get(criterion.criterionId) ?? criterion.score })) };
  return calculateWeightedScore(effective, rubric);
}
