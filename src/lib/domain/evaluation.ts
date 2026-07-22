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
});
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

export function calculateWeightedScore(result: EvaluationResult, rubric: Array<{ id: string; weight: number }>) {
  const scores = new Map(result.criteria.map((item) => [item.criterionId, item.score]));
  const total = rubric.reduce((sum, criterion) => sum + ((scores.get(criterion.id) ?? 0) / 4) * criterion.weight, 0);
  return Math.max(0, Math.min(100, Math.round(total)));
}
