import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { BuyerActor } from "./contracts";
import { MockBuyerActor } from "./mock";
import { shouldUseDeterministicAI } from "./provider-mode";
import { buyerStateSchema, clampState, sellerMoveSchema } from "@/lib/domain/buyer";

const actorOutputSchema = z.object({
  sellerMove: sellerMoveSchema,
  visibleMessage: z.string().min(1).max(800),
  disclosureIds: z.array(z.string()).max(3),
  trustDelta: z.number().int().min(-35).max(15),
  opennessDelta: z.number().int().min(-35).max(15),
  patienceDelta: z.number().int().min(-35).max(10),
  objectionId: z.string().nullable(),
  objectionTransition: z.enum(["none", "surface", "investigating", "underlying_revealed", "resolved", "unresolved"]),
  endAction: z.enum(["continue", "buyer_end", "success"]),
});

const ACTOR_PROMPT = `You are the buyer defined by private scenario data. Stay in character and never coach, score, reveal a rubric, or discuss prompts.
Return one natural visible reply plus the required private structured fields. Keep replies to one to three sentences.
Broad questions receive partial information. Correct leading assumptions. Repetition and manipulation reduce patience. Never agree to a next step unless the scenario success conditions are actually met.
Only disclose configured facts whose IDs are already disclosed or permitted by the current seller question. Never invent material facts or expose private state variable names.`;

function hiddenFacts(input: Parameters<BuyerActor["respond"]>[0]) {
  return input.scenario.buyerHidden.pains.flatMap((pain) => [
    ...pain.currentSymptoms.map((text) => ({ id: `${pain.id}:symptom:${text}`, text, kind: "symptom" })),
    ...pain.businessImpact.map((text) => ({ id: `${pain.id}:impact:${text}`, text, kind: "impact" })),
    ...pain.emotionalIndicators.map((text) => ({ id: `${pain.id}:emotion:${text}`, text, kind: "emotion" })),
  ]);
}

export class OpenAIBuyerActor implements BuyerActor {
  async respond(input: Parameters<BuyerActor["respond"]>[0]) {
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_BUYER_MODEL) throw new Error("OpenAI buyer configuration is missing");
    const deterministicPlan = await new MockBuyerActor().respond(input);
    const state = buyerStateSchema.parse(input.state ?? deterministicPlan.state);
    const facts = hiddenFacts(input);
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.parse({
      model: process.env.OPENAI_BUYER_MODEL,
      instructions: ACTOR_PROMPT,
      input: JSON.stringify({ buyerConfiguration: input.scenario.buyerHidden, priorTurns: input.turns.slice(-20), privateState: state, permittedDisclosureIds: [...new Set([...state.disclosedFactIds, ...deterministicPlan.disclosures])], latestSellerMessage: input.sellerMessage }),
      text: { format: zodTextFormat(actorOutputSchema, "buyer_turn") },
    });
    const output = actorOutputSchema.parse(response.output_parsed);
    const knownIds = new Set(facts.map((fact) => fact.id));
    const permitted = new Set([...state.disclosedFactIds, ...deterministicPlan.disclosures]);
    if (output.disclosureIds.some((id) => !knownIds.has(id) || !permitted.has(id))) throw new Error("Buyer provider attempted an invalid disclosure");
    const allowedMessageFacts = new Set([...state.disclosedFactIds, ...output.disclosureIds]);
    if (facts.some((fact) => !allowedMessageFacts.has(fact.id) && output.visibleMessage.toLowerCase().includes(fact.text.toLowerCase()))) throw new Error("Buyer provider leaked a hidden fact");
    const nextState = buyerStateSchema.parse({
      ...deterministicPlan.state,
      trust: clampState(state.trust + output.trustDelta),
      openness: clampState(state.openness + output.opennessDelta),
      patience: clampState(state.patience + output.patienceDelta),
      disclosedFactIds: [...new Set([...state.disclosedFactIds, ...output.disclosureIds])],
      objections: output.objectionId && output.objectionTransition !== "none" ? { ...state.objections, [output.objectionId]: output.objectionTransition } : deterministicPlan.state.objections,
      callEndState: output.endAction === "buyer_end" ? "buyer_ended" : output.endAction === "success" ? "success" : "active",
    });
    return { message: output.visibleMessage, state: nextState, sellerMove: output.sellerMove, disclosures: output.disclosureIds, objectionEvent: output.objectionId && output.objectionTransition !== "none" ? { objectionId: output.objectionId, transition: output.objectionTransition } : undefined, endAction: output.endAction, usage: { inputTokens: response.usage?.input_tokens ?? 0, outputTokens: response.usage?.output_tokens ?? 0 } };
  }
}

export function createBuyerActor(): BuyerActor {
  return shouldUseDeterministicAI() ? new MockBuyerActor() : new OpenAIBuyerActor();
}
