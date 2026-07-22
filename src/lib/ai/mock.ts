import type { BuyerActor, Evaluator } from "./contracts";
import type { EvaluationResult } from "@/lib/domain/evaluation";

export class MockBuyerActor implements BuyerActor {
  async respond({ turns, sellerMessage }: Parameters<BuyerActor["respond"]>[0]) {
    const lower = sellerMessage.toLowerCase();
    let message = "What specifically would you like to understand about our process?";
    if (/rubric|score|prompt|hidden/.test(lower)) message = "I’m not sure what you mean. Are we going to discuss our forecasting process?";
    else if (/how.*forecast|assembled|current process/.test(lower)) message = "Regional leaders send spreadsheets in different formats, and my team consolidates them before the weekly review.";
    else if (/impact|leadership|consequence|what happens/.test(lower)) message = "The reports arrive late enough that leadership questions the weekly forecast. My team spends too much time reconciling the numbers.";
    else if (/platform|solution|technology|demo/.test(lower) && turns.length < 4) message = "We already have reporting in our CRM. I don’t want another system that creates more administrative work.";
    return { message, state: { turnCount: turns.length + 2 }, usage: { inputTokens: 0, outputTokens: 0 } };
  }
}

export class MockEvaluator implements Evaluator {
  async evaluate({ scenario, turns }: Parameters<Evaluator["evaluate"]>[0]): Promise<EvaluationResult> {
    const sellerTurns = turns.filter((turn) => turn.role === "seller");
    const evidence = sellerTurns[0] ? [{ turnId: sellerTurns[0].id, excerpt: sellerTurns[0].content.slice(0, 120) }] : [];
    if (sellerTurns.length < 2) return { evaluationStatus: "insufficient_evidence", callOutcome: "ended", criteria: [], strengths: [], priorityImprovements: ["Complete a meaningful discovery exchange."], missedSignals: [], unsupportedClaims: [], rewriteMoments: [], recommendedNextDrill: { skill: "Discovery fundamentals", difficulty: "easy", rationale: "The transcript was too short to score reliably." } };
    return { evaluationStatus: "complete", callOutcome: "neutral", criteria: scenario.evaluatorOnly.rubric.map((criterion, index) => ({ criterionId: criterion.id, score: index < 2 ? 3 : 2, confidence: 0.84, evidence, rationale: `Evidence partially supports the ${criterion.name} anchor.`, nextAction: `Ask one more specific follow-up for ${criterion.name.toLowerCase()}.` })), strengths: ["Established a professional conversation", "Asked about the current process"], priorityImprovements: ["Quantify business impact", "Secure a concrete next step"], missedSignals: [], unsupportedClaims: [], rewriteMoments: [], recommendedNextDrill: { skill: "Business-impact discovery", difficulty: "medium", rationale: "Practice moving from symptoms to measurable consequences." } };
  }
}
