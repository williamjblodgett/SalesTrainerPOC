import {
  assessTranscriptEvidence,
  personaDraftSchema,
  PersonaEvidenceError,
  type PersonaDraft,
  type TranscriptPersonaRequest,
} from "./persona";

type BuyerTurn = ReturnType<typeof assessTranscriptEvidence>["usableBuyerTurns"][number];
type ClaimType = PersonaDraft["evidenceClaims"][number]["claimType"];

const classifiers: Array<[ClaimType, RegExp]> = [
  ["responsibility", /\b(?:responsible|own|manage|lead|oversee)\b/i],
  ["kpi", /\b(?:kpi|quota|target|metric|conversion|revenue|margin|accuracy)\b/i],
  ["priority", /\b(?:priority|important|need|goal|focus|must)\b/i],
  ["pain", /\b(?:problem|pain|manual|late|friction|difficult|waste|broken|reconcil|inconsistent)\b/i],
  ["business_impact", /\b(?:impact|cost|time|risk|leadership|delay|revenue|downtime|hours|lost)\b/i],
  ["emotional_impact", /\b(?:frustrat|concern|worry|skept|annoy|pressure)\b/i],
  ["objection", /\b(?:already|don't|cannot|can't|price|fee|concern|skept|not interested)\b/i],
  ["decision_process", /\b(?:approve|budget|timeline|finance|legal|procurement|stakeholder|decision)\b/i],
  ["communication_style", /\b(?:direct|brief|detail|straightforward)\b/i],
];

function findConflicts(turns: BuyerTurn[]) {
  const joined = turns.map((turn) => turn.content).join(" ");
  const conflicts: Array<{ field: string; description: string; sourceIds: string[] }> = [];
  if (/budget (?:is )?(?:approved|available|allocated)/i.test(joined) && /(?:no|without) (?:approved )?budget|budget (?:is )?not approved/i.test(joined)) {
    conflicts.push({ field: "decisionProcess.budgetPosture", description: "Sources disagree about whether budget is approved.", sourceIds: [...new Set(turns.map((turn) => turn.sourceId))] });
  }
  const rules = [
    { field: "decisionProcess.timeline", positive: /(?:urgent|this (?:month|quarter)|within \d+ (?:days|weeks))/i, negative: /(?:no timeline|next year|not (?:urgent|a priority))/i, description: "Sources disagree about decision timing or urgency." },
    { field: "decisionProcess.alternatives", positive: /(?:use|using|standardized on) (?:salesforce|hubspot|dynamics|spreadsheets?)/i, negative: /(?:replacing|moving (?:off|away from)|do not use) (?:salesforce|hubspot|dynamics|spreadsheets?)/i, description: "Sources describe conflicting current-solution states." },
    { field: "priorities", positive: /(?:top|highest|urgent) priority/i, negative: /(?:not|isn't|is not) (?:a )?priority/i, description: "Sources disagree about the priority of the problem." },
  ];
  for (const rule of rules) if (rule.positive.test(joined) && rule.negative.test(joined)) conflicts.push({ field: rule.field, description: rule.description, sourceIds: [...new Set(turns.map((turn) => turn.sourceId))] });
  return conflicts;
}

export function createDeterministicPersona(input: TranscriptPersonaRequest): PersonaDraft {
  const quality = assessTranscriptEvidence(input.transcripts);
  if (quality.issues.length) throw new PersonaEvidenceError(quality.issues);
  const buyerTurns = quality.usableBuyerTurns;
  const candidates = buyerTurns.flatMap((turn) => classifiers.flatMap(([claimType, pattern]) => {
    const explicitlyAbsent = /\b(?:(?:no|not|without)\s+(?:real\s+)?(?:problem|pain|issue|impact|concern|objection|priority|budget|timeline)|nothing is (?:a )?priority)\b/i.test(turn.content);
    return pattern.test(turn.content) && !(explicitlyAbsent && ["pain", "business_impact", "emotional_impact", "objection", "priority", "decision_process"].includes(claimType)) ? [{ turn, claimType }] : [];
  }));
  if (!candidates.length) throw new PersonaEvidenceError(["The buyer dialogue contains no classifiable persona evidence."]);

  const evidenceClaims = candidates.slice(0, 30).map(({ turn, claimType }, index) => {
    const excerpt = turn.content.slice(0, 220);
    return {
      id: `E${index + 1}`,
      sourceId: turn.sourceId,
      turnId: turn.turnId,
      excerpt,
      charStart: 0,
      charEnd: excerpt.length,
      claimType,
      claim: turn.content.slice(0, 500),
      origin: "observed" as const,
      confidence: 0.72,
    };
  });
  const idsFor = (...types: ClaimType[]) => evidenceClaims.filter((claim) => types.includes(claim.claimType)).map((claim) => claim.id);
  const claimsFor = (...types: ClaimType[]) => evidenceClaims.filter((claim) => types.includes(claim.claimType)).map((claim) => claim.claim);
  const allText = buyerTurns.map((turn) => turn.content).join(" ");
  const observedFieldCount = ["responsibility", "kpi", "priority", "pain", "objection", "decision_process", "communication_style"]
    .filter((type) => evidenceClaims.some((claim) => claim.claimType === type)).length;

  return personaDraftSchema.parse({
    schemaVersion: "1.0",
    status: "ai_generated",
    identity: { name: "Evidence-backed buyer", title: "Unknown buyer role", industry: input.industryId, seniority: "Unknown — manager review required", companyProfile: "Derived only from supplied transcript evidence." },
    responsibilities: claimsFor("responsibility"),
    kpis: claimsFor("kpi"),
    priorities: claimsFor("priority"),
    pains: idsFor("pain").length ? [{
      label: claimsFor("pain")[0],
      symptoms: claimsFor("pain"),
      businessImpact: claimsFor("business_impact"),
      emotionalImpact: claimsFor("emotional_impact"),
      buyingTriggers: [],
    }] : [],
    objections: claimsFor("objection").map((claim) => ({ surfaceStatement: claim, trigger: "Unknown", underlyingConcern: "Unknown", resolutionSignals: [] })),
    decisionProcess: { stakeholders: [], budgetPosture: findConflicts(buyerTurns).some((conflict) => conflict.field === "decisionProcess.budgetPosture") ? "Conflicting evidence — manager review required" : "Unknown", timeline: "Unknown", approvalProcess: "Unknown", alternatives: [] },
    behavior: { communicationStyle: claimsFor("communication_style")[0] ?? "Unknown", talkativeness: 3, skepticism: 3, patience: 3, riskTolerance: 3 },
    vocabulary: [...new Set(allText.toLowerCase().match(/[a-z]{7,}/g) ?? [])].slice(0, 8),
    complianceConstraints: ["Do not infer sensitive or protected traits", "Do not treat this draft as legal or professional advice"],
    evidenceClaims,
    fieldEvidence: [
      { path: "identity.title", support: "unknown", evidenceClaimIds: [], explanation: "No reliable buyer title was extracted." },
      { path: "responsibilities", support: idsFor("responsibility").length ? "observed" : "unknown", evidenceClaimIds: idsFor("responsibility"), explanation: "Only explicit responsibility language is included." },
      { path: "kpis", support: idsFor("kpi").length ? "observed" : "unknown", evidenceClaimIds: idsFor("kpi"), explanation: "Only explicit KPI language is included." },
      { path: "priorities", support: idsFor("priority").length ? "observed" : "unknown", evidenceClaimIds: idsFor("priority"), explanation: "Only explicit priority language is included." },
      { path: "pains", support: idsFor("pain").length ? "observed" : "unknown", evidenceClaimIds: idsFor("pain", "business_impact", "emotional_impact"), explanation: "Pain and impact use buyer-language excerpts." },
      { path: "objections", support: idsFor("objection").length ? "observed" : "unknown", evidenceClaimIds: idsFor("objection"), explanation: "Only explicit resistance is included." },
      { path: "decisionProcess", support: idsFor("decision_process").length ? "observed" : "unknown", evidenceClaimIds: idsFor("decision_process"), explanation: "Only explicit decision language is included." },
      { path: "behavior.communicationStyle", support: idsFor("communication_style").length ? "observed" : "unknown", evidenceClaimIds: idsFor("communication_style"), explanation: "Style remains unknown unless explicitly evidenced." },
      { path: "vocabulary", support: "observed", evidenceClaimIds: evidenceClaims.map((claim) => claim.id), explanation: "Vocabulary is extracted from buyer language." },
    ],
    conflicts: findConflicts(buyerTurns),
    assumptions: [],
    missingInformation: ["Buyer title", "Validated behavior settings", "Budget posture", "Buying committee", "Decision timeline"],
    evidenceCoverage: Math.min(0.9, observedFieldCount / 9),
  });
}
