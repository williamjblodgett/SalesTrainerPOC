import { z } from "zod";
import type { ScenarioSpec } from "./scenario";

export const objectionStateSchema = z.enum(["dormant", "surface", "investigating", "underlying_revealed", "resolved", "unresolved"]);
export const buyerStateSchema = z.object({
  trust: z.number().int().min(0).max(100),
  openness: z.number().int().min(0).max(100),
  patience: z.number().int().min(0).max(100),
  perceivedRelevance: z.number().int().min(0).max(100),
  willingnessToContinue: z.number().int().min(0).max(100),
  disclosedFactIds: z.array(z.string()),
  discussedTopicIds: z.array(z.string()),
  answeredQuestionFingerprints: z.array(z.string()),
  objections: z.record(z.string(), objectionStateSchema),
  warningsIssued: z.number().int().min(0),
  callEndState: z.enum(["active", "buyer_ended", "success"]),
});
export type BuyerState = z.infer<typeof buyerStateSchema>;

export const sellerMoveSchema = z.enum([
  "opening", "discovery", "follow_up", "impact", "emotion", "active_listening", "leading_assumption",
  "premature_pitch", "unsupported_claim", "objection_probe", "objection_response", "next_step", "repetition",
  "manipulation", "multi_question", "other",
]);
export type SellerMove = z.infer<typeof sellerMoveSchema>;

export function clampState(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function fingerprintQuestion(message: string) {
  return message.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !["what", "your", "that", "this", "with", "have", "does", "would", "could"].includes(word)).sort().join(" ");
}

export function createInitialBuyerState(scenario: ScenarioSpec): BuyerState {
  const behavior = scenario.buyerHidden.behavior;
  return buyerStateSchema.parse({ trust: behavior.initialTrust * 20, openness: behavior.initialTrust * 18, patience: behavior.patience * 20, perceivedRelevance: 40, willingnessToContinue: 60, disclosedFactIds: [], discussedTopicIds: [], answeredQuestionFingerprints: [], objections: Object.fromEntries(scenario.buyerHidden.objections.map((objection) => [objection.id, "dormant"])), warningsIssued: 0, callEndState: "active" });
}
