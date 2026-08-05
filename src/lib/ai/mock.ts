import type { BuyerActor, Evaluator } from "./contracts";
import type { EvaluationResult } from "@/lib/domain/evaluation";
import { clampState, createInitialBuyerState, fingerprintQuestion, type BuyerState, type SellerMove } from "@/lib/domain/buyer";

function initialState(input: Parameters<BuyerActor["respond"]>[0]): BuyerState {
  return createInitialBuyerState(input.scenario);
}

function classify(message: string, state: BuyerState): SellerMove {
  const lower = message.toLowerCase();
  const fingerprint = fingerprintQuestion(message);
  if (/rubric|system prompt|hidden pain|ignore .*instruction|score me|act as/.test(lower)) return "manipulation";
  if (/stupid|idiot|buy now|waste of time|you must/.test(lower)) return "manipulation";
  if (fingerprint.length > 8 && state.answeredQuestionFingerprints.includes(fingerprint)) return "repetition";
  if ((message.match(/\?/g) ?? []).length > 1) return "multi_question";
  if (/so (?:you|your).*right\?|isn't it|obviously|clearly .*right/.test(lower)) return "leading_assumption";
  if (/next step|follow[- ]?up|schedule|book|meet again/.test(lower)) return "next_step";
  if (/frustrat|personally|feel about|pressure/.test(lower)) return "emotion";
  if (/impact|consequence|cost|what happens|leadership|business/.test(lower)) return "impact";
  if (/already|underlying|concern|hesitat|what worries/.test(lower)) return "objection_probe";
  if (/platform|solution|demo|technology|replace|guarantee|our product/.test(lower) && state.disclosedFactIds.length === 0) return "premature_pitch";
  if (/you said|sounds like|earlier|if i heard/.test(lower)) return "active_listening";
  if (/how|walk me through|current|process|today|why|where/.test(lower)) return state.discussedTopicIds.length ? "follow_up" : "discovery";
  return "other";
}

export class MockBuyerActor implements BuyerActor {
  async respond(input: Parameters<BuyerActor["respond"]>[0]) {
    const state = structuredClone(input.state ?? initialState(input));
    if (state.callEndState !== "active") return { message: "I’ve ended the conversation.", state, sellerMove: "other" as const, disclosures: [], endAction: "buyer_end" as const, usage: { inputTokens: 0, outputTokens: 0 } };
    const move = classify(input.sellerMessage, state);
    const fingerprint = fingerprintQuestion(input.sellerMessage);
    if (fingerprint) state.answeredQuestionFingerprints = [...new Set([...state.answeredQuestionFingerprints, fingerprint])];
    const pain = input.scenario.buyerHidden.pains[0];
    const objection = input.scenario.buyerHidden.objections[0];
    const disclosures: string[] = [];
    let message = "Can you be more specific about what you want to understand?";
    let objectionEvent: { objectionId: string; transition: string } | undefined;
    let endAction: "continue" | "buyer_end" | "success" = "continue";

    if (move === "manipulation") {
      state.trust = clampState(state.trust - 35); state.patience = clampState(state.patience - 35); state.warningsIssued += 1;
      if (state.warningsIssued >= 2 || state.patience <= 10) { state.callEndState = "buyer_ended"; state.willingnessToContinue = 0; endAction = "buyer_end"; message = "This is not a productive conversation. I’m going to end it here."; }
      else message = "I’m not going to discuss that. If you want to understand the business issue, ask me about it directly.";
    } else if (move === "repetition") {
      state.patience = clampState(state.patience - 20); state.trust = clampState(state.trust - 8);
      message = state.patience < 25 ? "I already answered that, and we’re running out of time. Is there a more specific part you need?" : "I just walked through that. What part of the process do you want to go deeper on?";
    } else if (move === "leading_assumption") {
      state.trust = clampState(state.trust - 12);
      message = "No—that’s stronger than what I said. I’d rather you ask than put words in my mouth.";
    } else if (move === "premature_pitch" && objection) {
      state.trust = clampState(state.trust - 12); state.objections[objection.id] = "surface";
      objectionEvent = { objectionId: objection.id, transition: "dormant→surface" };
      message = objection.surfaceStatement;
    } else if (move === "objection_probe" && objection && state.objections[objection.id] === "surface") {
      state.objections[objection.id] = "underlying_revealed"; state.trust = clampState(state.trust + 6);
      objectionEvent = { objectionId: objection.id, transition: "surface→underlying_revealed" };
      message = objection.underlyingConcern;
    } else if ((move === "discovery" || move === "follow_up") && pain) {
      const fact = pain.currentSymptoms.find((item) => !state.disclosedFactIds.includes(`${pain.id}:symptom:${item}`));
      if (fact) { const id = `${pain.id}:symptom:${fact}`; disclosures.push(id); state.disclosedFactIds.push(id); message = fact; }
      else message = "That’s the main workflow issue. What specifically are you trying to determine from it?";
      state.openness = clampState(state.openness + 8); state.perceivedRelevance = clampState(state.perceivedRelevance + 8);
    } else if (move === "impact" && pain && state.disclosedFactIds.some((id) => id.startsWith(`${pain.id}:symptom`))) {
      const fact = pain.businessImpact.find((item) => !state.disclosedFactIds.includes(`${pain.id}:impact:${item}`));
      if (fact) { const id = `${pain.id}:impact:${fact}`; disclosures.push(id); state.disclosedFactIds.push(id); message = fact; }
      else message = "It creates delay and makes the review harder, but I don’t have a precise number for you.";
      state.trust = clampState(state.trust + 5);
    } else if (move === "emotion" && pain && state.trust >= 45 && state.disclosedFactIds.some((id) => id.includes(":impact:"))) {
      const fact = pain.emotionalIndicators[0];
      if (fact) { const id = `${pain.id}:emotion:${fact}`; disclosures.push(id); state.disclosedFactIds.push(id); message = fact; }
    } else if (move === "next_step") {
      const criticalObjectionOpen = Object.values(state.objections).some((value) => ["surface", "investigating", "underlying_revealed", "unresolved"].includes(value));
      const enoughDiscovery = state.disclosedFactIds.some((id) => id.includes(":impact:")) && state.trust >= 45 && !criticalObjectionOpen;
      if (enoughDiscovery) { state.callEndState = "success"; endAction = "success"; message = input.scenario.buyerHidden.successEndConditions[0] ?? "A focused follow-up could make sense. Send me an agenda and I’ll involve the appropriate stakeholder."; }
      else { state.trust = clampState(state.trust - 5); message = "We haven’t established enough yet for me to commit to another meeting. What would we accomplish?"; }
    }
    state.discussedTopicIds = [...new Set([...state.discussedTopicIds, move])];
    state.willingnessToContinue = clampState(Math.min(state.patience, state.trust + 20));
    return { message, state, sellerMove: move, disclosures, objectionEvent, endAction, usage: { inputTokens: 0, outputTokens: 0 } };
  }
}

export class MockEvaluator implements Evaluator {
  async evaluate({ scenario, turns }: Parameters<Evaluator["evaluate"]>[0]): Promise<EvaluationResult> {
    const sellerTurns = turns.filter((turn) => turn.role === "seller");
    if (sellerTurns.length < 2) return { evaluationStatus: "insufficient_evidence", callOutcome: "ended", criteria: [], strengths: [], priorityImprovements: ["Complete a meaningful discovery exchange."], missedSignals: [], unsupportedClaims: [], rewriteMoments: [], recommendedNextDrill: { skill: "Discovery fundamentals", difficulty: "easy", rationale: "The transcript was too short to score reliably." } };
    return { evaluationStatus: "complete", callOutcome: "neutral", criteria: scenario.evaluatorOnly.rubric.map((criterion) => ({ criterionId: criterion.id, score: 0, confidence: 1, evidence: [], rationale: `${criterion.name} was not demonstrated by the deterministic mock.`, nextAction: `Demonstrate ${criterion.name.toLowerCase()} with a specific observable behavior.` })), strengths: [], priorityImprovements: scenario.evaluatorOnly.rubric.slice(0, 2).map((criterion) => criterion.name), missedSignals: [], unsupportedClaims: [], rewriteMoments: [], recommendedNextDrill: { skill: "Evidence-based discovery", difficulty: "easy", rationale: "Mock mode fails closed rather than inventing positive evidence." } };
  }
}
