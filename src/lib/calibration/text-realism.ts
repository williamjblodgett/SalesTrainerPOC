import { z } from "zod";

import { transcriptPersonaRequestSchema } from "@/lib/domain/persona";
import { scenarioSpecSchema } from "@/lib/domain/scenario";

const anchoredScoreSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
const reviewersSchema = z.array(z.string().min(2)).min(2).refine((ids) => new Set(ids).size === ids.length, "Two distinct reviewers are required");
const turnSchema = z.object({ id: z.string().min(1), role: z.enum(["seller", "buyer"]), content: z.string().min(1) });

export const textCalibrationCorpusSchema = z.object({
  schemaVersion: z.literal("1.0"),
  licenseConfirmed: z.literal(true),
  evaluatorCases: z.array(z.object({
    id: z.string().min(1), scenario: scenarioSpecSchema, transcript: z.array(turnSchema).min(3),
    humanScores: z.record(z.string(), anchoredScoreSchema), humanOverallScore: z.number().int().min(0).max(100),
    reviewerIds: reviewersSchema, adjudicatedAt: z.string().datetime(),
  })),
  buyerCases: z.array(z.object({
    id: z.string().min(1), scenario: scenarioSpecSchema, reviewerIds: reviewersSchema,
    steps: z.array(z.object({
      sellerMessage: z.string().min(1), expectedDisclosureIds: z.array(z.string()), forbiddenDisclosureIds: z.array(z.string()),
      forbiddenResponseText: z.array(z.string()), expectedEndAction: z.enum(["continue", "buyer_end", "success"]),
    })).min(2),
  })),
  personaCases: z.array(z.object({
    id: z.string().min(1), request: transcriptPersonaRequestSchema, expectedClaimTypes: z.array(z.string().min(1)).min(1),
    forbiddenClaimText: z.array(z.string()), reviewerIds: reviewersSchema,
  })),
});

export type TextCalibrationMetrics = {
  evaluatorCaseCount: number; criterionMeanAbsoluteError: number; overallMeanAbsoluteError: number;
  buyerCaseCount: number; buyerExpectedDisclosureRecall: number; buyerForbiddenDisclosureRate: number; buyerEndActionAccuracy: number;
  personaCaseCount: number; personaExpectedClaimRecall: number; personaForbiddenClaimRate: number; providerErrorCount: number;
};

export const defaultTextCalibrationThresholds = {
  minimumEvaluatorCases: 50, minimumBuyerCases: 10, minimumPersonaCases: 10,
  maximumCriterionMae: 0.6, maximumOverallMae: 8, minimumBehaviorRecall: 0.9,
  maximumForbiddenRate: 0, minimumEndActionAccuracy: 0.9,
};

export function textRealismGatePassed(metrics: TextCalibrationMetrics, thresholds = defaultTextCalibrationThresholds) {
  return metrics.providerErrorCount === 0
    && metrics.evaluatorCaseCount >= thresholds.minimumEvaluatorCases
    && metrics.buyerCaseCount >= thresholds.minimumBuyerCases
    && metrics.personaCaseCount >= thresholds.minimumPersonaCases
    && metrics.criterionMeanAbsoluteError <= thresholds.maximumCriterionMae
    && metrics.overallMeanAbsoluteError <= thresholds.maximumOverallMae
    && metrics.buyerExpectedDisclosureRecall >= thresholds.minimumBehaviorRecall
    && metrics.buyerForbiddenDisclosureRate <= thresholds.maximumForbiddenRate
    && metrics.buyerEndActionAccuracy >= thresholds.minimumEndActionAccuracy
    && metrics.personaExpectedClaimRecall >= thresholds.minimumBehaviorRecall
    && metrics.personaForbiddenClaimRate <= thresholds.maximumForbiddenRate;
}

export function isRealtimeVoiceReleased(environment: Record<string, string | undefined> = process.env) {
  return environment.ENABLE_REALTIME_VOICE === "true" && environment.TEXT_REALISM_BENCHMARK_STATUS === "passed";
}
