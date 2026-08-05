import {
  assessTranscriptEvidence,
  personaDraftSchema,
  PersonaEvidenceError,
  type PersonaDraft,
  type TranscriptPersonaRequest,
} from "./persona";

type BuyerTurn = ReturnType<typeof assessTranscriptEvidence>["usableBuyerTurns"][number];

function findConflicts(turns: BuyerTurn[]) {
  const rules = [
    { field: "decisionProcess.budgetPosture", positive: /budget (?:is )?(?:approved|available|allocated)/i, negative: /(?:no|without) (?:approved )?budget|budget (?:is )?not approved/i, description: "Sources disagree about whether budget is approved." },
    { field: "decisionProcess.timeline", positive: /(?:urgent|this (?:month|quarter)|within \d+ (?:days|weeks))/i, negative: /(?:no timeline|next year|not (?:urgent|a priority))/i, description: "Sources disagree about decision timing or urgency." },
    { field: "decisionProcess.alternatives", positive: /(?:use|using|standardized on) (?:salesforce|hubspot|dynamics|spreadsheets?)/i, negative: /(?:replacing|moving (?:off|away from)|do not use) (?:salesforce|hubspot|dynamics|spreadsheets?)/i, description: "Sources describe conflicting current-solution states." },
    { field: "priorities", positive: /(?:top|highest|urgent) priority/i, negative: /(?:not|isn't|is not) (?:a )?priority/i, description: "Sources disagree about the priority of the problem." },
  ];
  return rules.flatMap((rule) => {
    const positive = turns.filter((turn) => rule.positive.test(turn.content));
    const negative = turns.filter((turn) => rule.negative.test(turn.content));
    if (!positive.length || !negative.length) return [];
    return [{ field: rule.field, description: rule.description, sourceIds: Array.from(new Set([...positive, ...negative].map((turn) => turn.sourceId))) }];
  });
}

export function createDeterministicPersona(input: TranscriptPersonaRequest): PersonaDraft {
  const quality = assessTranscriptEvidence(input.transcripts);
  if (quality.issues.length) throw new PersonaEvidenceError(quality.issues);
  const buyerTurns = quality.usableBuyerTurns;
  const first = buyerTurns[0];
  const evidenceClaims = buyerTurns.slice(0, 8).map((turn, index) => ({
    id: `E${index + 1}`,
    sourceId: turn.sourceId,
    turnId: turn.turnId,
    excerpt: turn.content.slice(0, 220),
    claimType: (["priority", "pain", "business_impact", "objection", "decision_process", "communication_style"] as const)[index % 6],
    claim: turn.content.slice(0, 500),
    confidence: Math.min(0.9, 0.58 + input.transcripts.length * 0.05 + Math.min(buyerTurns.length, 6) * 0.025),
  }));
  const allText = buyerTurns.map((turn) => turn.content).join(" ");
  const observedIds = evidenceClaims.map((claim) => claim.id);
  const objectionIds = evidenceClaims.filter((claim) => claim.claimType === "objection").map((claim) => claim.id);
  const decisionIds = evidenceClaims.filter((claim) => claim.claimType === "decision_process").map((claim) => claim.id);
  const conflicts = findConflicts(buyerTurns);
  const hasBudgetConflict = conflicts.some((conflict) => conflict.field === "decisionProcess.budgetPosture");

  return personaDraftSchema.parse({
    schemaVersion: "1.0",
    status: "ai_generated",
    identity: { name: "Evidence-backed buyer", title: "Unknown buyer role", industry: input.industryId, seniority: "Unknown — manager review required", companyProfile: "Derived only from supplied transcript evidence." },
    responsibilities: ["Likely owns or influences the process described in the source calls"],
    kpis: [],
    priorities: [first.content],
    pains: [{
      label: /reconcil|manual|late/i.test(allText) ? "Manual workflow friction" : "Operational friction",
      symptoms: buyerTurns.slice(0, 2).map((turn) => turn.content),
      businessImpact: buyerTurns.filter((turn) => /impact|cost|time|risk|leadership|delay|revenue|downtime/i.test(turn.content)).slice(0, 3).map((turn) => turn.content),
      emotionalImpact: buyerTurns.filter((turn) => /frustrat|concern|worry|skept/i.test(turn.content)).slice(0, 2).map((turn) => turn.content),
      buyingTriggers: ["Clear evidence of value with limited implementation burden"],
    }],
    objections: [{
      surfaceStatement: buyerTurns.find((turn) => /already|don't|cannot|price|fee|concern|skept/i.test(turn.content))?.content ?? "No explicit objection was evidenced",
      trigger: "Seller positions before completing discovery",
      underlyingConcern: "Additional cost, risk, or administrative burden",
      resolutionSignals: ["Acknowledges the current approach", "Investigates where it breaks down", "Avoids unsupported replacement claims"],
    }],
    decisionProcess: { stakeholders: [], budgetPosture: hasBudgetConflict ? "Conflicting evidence — manager review required" : "Not established", timeline: "Not established", approvalProcess: "Not established", alternatives: [] },
    behavior: { communicationStyle: /skept|already|concern/i.test(allText) ? "Direct and skeptical" : "Pragmatic", talkativeness: 3, skepticism: 4, patience: 3, riskTolerance: 2 },
    vocabulary: Array.from(new Set(allText.toLowerCase().match(/[a-z]{7,}/g) ?? [])).slice(0, 8),
    complianceConstraints: ["Do not infer sensitive or protected traits", "Do not treat this draft as legal or professional advice"],
    evidenceClaims,
    fieldEvidence: [
      { path: "identity.title", support: "unknown", evidenceClaimIds: [], explanation: "No reliable buyer title was extracted from the supplied dialogue." },
      { path: "responsibilities", support: "inferred", evidenceClaimIds: observedIds.slice(0, 2), explanation: "Responsibility is inferred from the process the buyer describes owning." },
      { path: "kpis", support: "unknown", evidenceClaimIds: [], explanation: "No measurable KPI was stated directly." },
      { path: "priorities", support: "observed", evidenceClaimIds: observedIds.slice(0, 1), explanation: "The first buyer statement supplies the initial priority signal." },
      { path: "pains", support: "observed", evidenceClaimIds: observedIds.slice(0, 3), explanation: "Pain and impact use buyer-language excerpts." },
      { path: "objections", support: objectionIds.length ? "observed" : "unknown", evidenceClaimIds: objectionIds, explanation: "Objection state reflects explicit buyer resistance when present." },
      { path: "decisionProcess", support: decisionIds.length ? "inferred" : "unknown", evidenceClaimIds: decisionIds, explanation: "Decision information is incomplete and remains manager-reviewable." },
      { path: "behavior.communicationStyle", support: "inferred", evidenceClaimIds: observedIds.slice(0, 4), explanation: "Style is inferred from phrasing across buyer turns." },
      { path: "vocabulary", support: "observed", evidenceClaimIds: observedIds, explanation: "Vocabulary is extracted from the buyer's own words." },
    ],
    conflicts,
    assumptions: ["Identity details were intentionally left unknown until a manager reviews the source context"],
    missingInformation: ["Buyer title", "Measurable KPIs", "Budget posture", "Full buying committee", "Decision timeline"],
    evidenceCoverage: Math.min(0.88, 0.4 + Math.min(buyerTurns.length, 8) * 0.04 + input.transcripts.length * 0.05),
  });
}
