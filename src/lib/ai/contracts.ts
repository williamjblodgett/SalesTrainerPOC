import type { EvaluationResult } from "@/lib/domain/evaluation";
import type { ScenarioSpec } from "@/lib/domain/scenario";

export type Turn = { id: string; role: "seller" | "buyer"; content: string };
export interface ScenarioCompiler { compile(input: Record<string, unknown>): Promise<{ spec: ScenarioSpec; assumptions: string[]; missingInformation: string[]; sourceReferences: string[] }> }
export interface BuyerActor { respond(input: { scenario: ScenarioSpec; turns: Turn[]; sellerMessage: string }): Promise<{ message: string; state: Record<string, unknown>; usage?: { inputTokens: number; outputTokens: number } }> }
export interface Evaluator { evaluate(input: { scenario: ScenarioSpec; turns: Turn[] }): Promise<EvaluationResult> }
export const AI_BOUNDARIES = ["scenario-compiler", "buyer-actor", "post-call-evaluator"] as const;
