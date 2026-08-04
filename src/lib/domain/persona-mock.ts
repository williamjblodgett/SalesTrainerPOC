import {
  assessTranscriptEvidence,
  personaDraftSchema,
  PersonaEvidenceError,
  type PersonaDraft,
  type TranscriptPersonaRequest,
} from "./persona";

export function createDeterministicPersona(input: TranscriptPersonaRequest): PersonaDraft {
  const quality = assessTranscriptEvidence(input.transcripts);
  if (quality.issues.length) throw new PersonaEvidenceError(quality.issues);
  const buyerTurns = quality.usableBuyerTurns;
  const first = buyerTurns[0];
  const evidenceClaims = buyerTurns.slice(0, 8).map((turn, index) => ({
    sourceId: turn.sourceId,
    turnId: turn.turnId,
    excerpt: turn.content.slice(0, 220),
    claimType: (["priority", "pain", "business_impact", "objection", "decision_process", "communication_style"] as const)[index % 6],
    claim: turn.content.slice(0, 500),
    confidence: Math.min(0.9, 0.58 + input.transcripts.length * 0.05 + Math.min(buyerTurns.length, 6) * 0.025),
  }));
  const allText = buyerTurns.map((turn) => turn.content).join(" ");
  const conflictingBudgetSources = new Set([
    ...buyerTurns.filter((turn) => /budget (?:is )?(?:approved|available|allocated)/i.test(turn.content)).map((turn) => turn.sourceId),
    ...buyerTurns.filter((turn) => /(?:no|without) (?:approved )?budget|budget (?:is )?not approved/i.test(turn.content)).map((turn) => turn.sourceId),
  ]);
  const hasBudgetConflict = /budget (?:is )?(?:approved|available|allocated)/i.test(allText) && /(?:no|without) (?:approved )?budget|budget (?:is )?not approved/i.test(allText);
  return personaDraftSchema.parse({
    schemaVersion: "1.0",
    status: "ai_generated",
    identity: { name: "Evidence-backed buyer", title: "Buyer stakeholder", industry: input.industryId, seniority: "Needs manager review", companyProfile: "Derived only from supplied transcript evidence." },
    responsibilities: ["Own the business process discussed in the source calls"],
    kpis: ["Outcome and KPI require additional evidence"],
    priorities: [first.content],
    pains: [{ label: /reconcil|manual|late/i.test(allText) ? "Manual workflow friction" : "Operational friction", symptoms: buyerTurns.slice(0, 2).map((turn) => turn.content), businessImpact: buyerTurns.filter((turn) => /impact|cost|time|risk|leadership|delay|revenue|downtime/i.test(turn.content)).slice(0, 3).map((turn) => turn.content), emotionalImpact: buyerTurns.filter((turn) => /frustrat|concern|worry|skept/i.test(turn.content)).slice(0, 2).map((turn) => turn.content), buyingTriggers: ["Clear evidence of value with limited implementation burden"] }],
    objections: [{ surfaceStatement: buyerTurns.find((turn) => /already|don't|cannot|price|fee|concern|skept/i.test(turn.content))?.content ?? "No explicit objection was evidenced", trigger: "Seller positions before completing discovery", underlyingConcern: "Additional cost, risk, or administrative burden", resolutionSignals: ["Acknowledges the current approach", "Investigates where it breaks down", "Avoids unsupported replacement claims"] }],
    decisionProcess: { stakeholders: ["Operational owner", "Economic approver"], budgetPosture: hasBudgetConflict ? "Conflicting evidence — manager review required" : "Not established", timeline: "Not established", approvalProcess: "Requires additional evidence", alternatives: ["Current process"] },
    behavior: { communicationStyle: /skept|already|concern/i.test(allText) ? "Direct and skeptical" : "Pragmatic", talkativeness: 3, skepticism: 4, patience: 3, riskTolerance: 2 },
    vocabulary: Array.from(new Set(allText.toLowerCase().match(/[a-z]{7,}/g) ?? [])).slice(0, 8),
    complianceConstraints: ["Do not infer sensitive or protected traits", "Do not treat this draft as legal or professional advice"],
    evidenceClaims,
    conflicts: hasBudgetConflict ? [{ field: "decisionProcess.budgetPosture", description: "Sources disagree about whether budget is approved.", sourceIds: Array.from(conflictingBudgetSources) }] : [],
    assumptions: ["Identity details were intentionally generalized until a manager reviews the source context"],
    missingInformation: ["Measurable KPIs", "Budget posture", "Full buying committee", "Decision timeline"],
    evidenceCoverage: Math.min(0.88, 0.4 + Math.min(buyerTurns.length, 8) * 0.04 + input.transcripts.length * 0.05),
  });
}
