import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import type { Evaluator } from "./contracts";
import { MockEvaluator } from "./mock";
import { evaluationResultSchema, validateEvaluationAgainstTranscript } from "@/lib/domain/evaluation";

const EVALUATOR_PROMPT = `You are an evidence-based sales-call evaluator. Score only observable seller behavior against the supplied immutable 0–4 anchors.
Do not score the buyer, infer missing behavior, reward keyword presence, or treat a purchase outcome as proof of skill. No evidence means not demonstrated.
Every positive score must cite an exact excerpt from a stable seller turn ID. Distinguish asking from discovering, symptoms from impact, rebutting from resolving, and proposing from mutually establishing a next step.
A call advances only when the buyer agrees to a specific action with purpose, participants, and timing. Return insufficient_evidence when meaningful behavior cannot be assessed. Do not calculate the weighted score.`;

export class OpenAIEvaluator implements Evaluator {
  async evaluate(input: Parameters<Evaluator["evaluate"]>[0]) {
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_EVALUATOR_MODEL) throw new Error("OpenAI evaluator configuration is missing");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.parse({
      model: process.env.OPENAI_EVALUATOR_MODEL,
      instructions: EVALUATOR_PROMPT,
      input: JSON.stringify({ scenario: input.scenario, rubric: input.scenario.evaluatorOnly.rubric, transcript: input.turns }),
      text: { format: zodTextFormat(evaluationResultSchema, "evaluation_result") },
    });
    return validateEvaluationAgainstTranscript(evaluationResultSchema.parse(response.output_parsed), input.scenario.evaluatorOnly.rubric, input.turns);
  }
}

export function createEvaluator(): Evaluator {
  return process.env.AI_PROVIDER === "mock" || !process.env.OPENAI_API_KEY ? new MockEvaluator() : new OpenAIEvaluator();
}
