import fs from "node:fs/promises";

import { OpenAIBuyerActor } from "../src/lib/ai/buyer-actor";
import { OpenAIEvaluator } from "../src/lib/ai/evaluator";
import { OpenAIPersonaEngine } from "../src/lib/ai/persona-engine";
import { textCalibrationCorpusSchema, textRealismGatePassed, type TextCalibrationMetrics } from "../src/lib/calibration/text-realism";
import { calculateWeightedScore } from "../src/lib/domain/evaluation";

async function main() {
if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required for live calibration");
for (const key of ["OPENAI_PERSONA_MODEL", "OPENAI_BUYER_MODEL", "OPENAI_EVALUATOR_MODEL"] as const) {
  if (!process.env[key]) throw new Error(`${key} is required for live calibration`);
}

const corpusPath = process.env.CALIBRATION_CORPUS_PATH ?? "calibration/human-scored.json";
const reportPath = process.env.CALIBRATION_REPORT_PATH ?? "calibration/output/latest.json";
const corpus = textCalibrationCorpusSchema.parse(JSON.parse(await fs.readFile(corpusPath, "utf8")));

let criterionError = 0, criterionCount = 0, overallError = 0, evaluatedCases = 0;
let expectedDisclosures = 0, observedExpectedDisclosures = 0, forbiddenDisclosures = 0, checkedForbiddenDisclosures = 0;
let correctEndActions = 0, checkedEndActions = 0, expectedClaimTypes = 0, observedExpectedClaimTypes = 0;
let forbiddenClaimTexts = 0, checkedForbiddenClaimTexts = 0;
const failures: Array<{ caseId: string; stage: string; message: string }> = [];

const evaluator = new OpenAIEvaluator();
for (const item of corpus.evaluatorCases) {
  try {
    const result = await evaluator.evaluate({ scenario: item.scenario, turns: item.transcript });
    for (const criterion of item.scenario.evaluatorOnly.rubric) {
      const predicted = result.criteria.find((candidate) => candidate.criterionId === criterion.id)?.score;
      const expected = item.humanScores[criterion.id];
      if (predicted === undefined || expected === undefined) throw new Error(`Missing score for ${criterion.id}`);
      criterionError += Math.abs(predicted - expected);
      criterionCount += 1;
    }
    const predictedOverall = calculateWeightedScore(result, item.scenario.evaluatorOnly.rubric);
    if (predictedOverall === null) throw new Error("Evaluator returned insufficient evidence for a human-scored case");
    overallError += Math.abs(predictedOverall - item.humanOverallScore);
    evaluatedCases += 1;
  } catch (error) {
    failures.push({ caseId: item.id, stage: "evaluator", message: error instanceof Error ? error.message : "Unknown provider error" });
  }
}

const buyer = new OpenAIBuyerActor();
for (const item of corpus.buyerCases) {
  let state;
  const turns: Array<{ id: string; role: "seller" | "buyer"; content: string }> = [];
  for (const [index, step] of item.steps.entries()) {
    try {
      const result = await buyer.respond({ scenario: item.scenario, turns, sellerMessage: step.sellerMessage, state });
      state = result.state;
      turns.push({ id: `S${index + 1}`, role: "seller", content: step.sellerMessage }, { id: `B${index + 1}`, role: "buyer", content: result.message });
      expectedDisclosures += step.expectedDisclosureIds.length;
      observedExpectedDisclosures += step.expectedDisclosureIds.filter((id) => result.disclosures.includes(id)).length;
      checkedForbiddenDisclosures += step.forbiddenDisclosureIds.length + step.forbiddenResponseText.length;
      forbiddenDisclosures += step.forbiddenDisclosureIds.filter((id) => result.disclosures.includes(id)).length;
      forbiddenDisclosures += step.forbiddenResponseText.filter((text) => result.message.toLowerCase().includes(text.toLowerCase())).length;
      checkedEndActions += 1;
      if (result.endAction === step.expectedEndAction) correctEndActions += 1;
    } catch (error) {
      failures.push({ caseId: item.id, stage: `buyer-step-${index + 1}`, message: error instanceof Error ? error.message : "Unknown provider error" });
      break;
    }
  }
}

const persona = new OpenAIPersonaEngine();
for (const item of corpus.personaCases) {
  try {
    const result = await persona.synthesize(item.request);
    const types = new Set<string>(result.draft.evidenceClaims.map((claim) => claim.claimType));
    expectedClaimTypes += item.expectedClaimTypes.length;
    observedExpectedClaimTypes += item.expectedClaimTypes.filter((type) => types.has(type)).length;
    checkedForbiddenClaimTexts += item.forbiddenClaimText.length;
    const claims = result.draft.evidenceClaims.map((claim) => claim.claim.toLowerCase());
    forbiddenClaimTexts += item.forbiddenClaimText.filter((text) => claims.some((claim) => claim.includes(text.toLowerCase()))).length;
  } catch (error) {
    failures.push({ caseId: item.id, stage: "persona", message: error instanceof Error ? error.message : "Unknown provider error" });
  }
}

const ratio = (numerator: number, denominator: number) => denominator ? numerator / denominator : 0;
const metrics: TextCalibrationMetrics = {
  evaluatorCaseCount: corpus.evaluatorCases.length,
  criterionMeanAbsoluteError: ratio(criterionError, criterionCount),
  overallMeanAbsoluteError: ratio(overallError, evaluatedCases),
  buyerCaseCount: corpus.buyerCases.length,
  buyerExpectedDisclosureRecall: ratio(observedExpectedDisclosures, expectedDisclosures),
  buyerForbiddenDisclosureRate: ratio(forbiddenDisclosures, checkedForbiddenDisclosures),
  buyerEndActionAccuracy: ratio(correctEndActions, checkedEndActions),
  personaCaseCount: corpus.personaCases.length,
  personaExpectedClaimRecall: ratio(observedExpectedClaimTypes, expectedClaimTypes),
  personaForbiddenClaimRate: ratio(forbiddenClaimTexts, checkedForbiddenClaimTexts),
  providerErrorCount: failures.length,
};
const report = {
  schemaVersion: "1.0", generatedAt: new Date().toISOString(),
  models: { persona: process.env.OPENAI_PERSONA_MODEL, buyer: process.env.OPENAI_BUYER_MODEL, evaluator: process.env.OPENAI_EVALUATOR_MODEL },
  metrics, passed: textRealismGatePassed(metrics), failures,
};
const reportDirectory = reportPath.replace(/[\\/][^\\/]+$/, "");
if (reportDirectory !== reportPath) await fs.mkdir(reportDirectory, { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Live calibration failed");
  process.exitCode = 1;
});
