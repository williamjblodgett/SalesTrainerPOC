import type { ScenarioSpec } from "@/lib/domain/scenario";

const anchor = (name: string) => ({ 0: `${name} was not demonstrated.`, 1: `${name} was attempted ineffectively.`, 2: `${name} was partly demonstrated.`, 3: `${name} was demonstrated effectively.`, 4: `${name} was exceptional and consistent.` });
export const demoScenario: ScenarioSpec = {
  schemaVersion: "1.0",
  metadata: { title: "Northstar forecasting discovery", description: "Qualify a deeper discovery conversation with a skeptical Sales Operations leader.", callType: "discovery", difficulty: "medium", targetDurationMinutes: 10 },
  repVisible: { accountName: "Northstar Systems", buyerName: "Jordan Lee", buyerTitle: "VP of Sales Operations", meetingContext: "The meeting followed an outbound email. You have 10 minutes.", callObjective: "Determine whether a deeper discovery meeting is justified.", knownFacts: ["Northstar has a distributed sales team.", "The team currently reports through its CRM."] },
  buyerHidden: {
    companyContext: "Regional forecasts are assembled inconsistently and arrive late.",
    identity: { responsibilities: ["Forecast accuracy", "Sales process"], priorities: ["Reliable weekly forecast", "Low administrative burden"], communicationStyle: "Direct, skeptical, time-conscious" },
    pains: [{ id: "forecast-trust", label: "Low forecast trust", severity: 4, currentSymptoms: ["Late regional forecasts", "Inconsistent spreadsheet formats", "Manual reconciliation"], businessImpact: ["Leadership does not trust the weekly forecast", "Operations time is lost reconciling reports"], emotionalIndicators: ["Jordan is frustrated but guarded"], revealConditions: ["Ask how forecasts are assembled", "Ask about downstream impact", "Demonstrate listening before asking about personal impact"], shouldNotVolunteer: true }],
    objections: [{ id: "crm-reporting", trigger: "Seller pitches before understanding the workflow", surfaceStatement: "We already have reporting in our CRM.", underlyingConcern: "A new tool may create more administrative work.", resolutionSignals: ["Acknowledge the CRM", "Ask where the process breaks down", "Investigate duplicate work", "Avoid replacement-everything claims"] }],
    decisionProcess: { budgetStatus: "Not discussed", timeline: "No active purchase timeline", stakeholders: ["CRO", "Regional sales leaders"], approvalProcess: "A business case and deeper workflow review are required.", alternativesBeingConsidered: ["Keep improving the CRM process"] },
    behavior: { baselineTone: "Direct and guarded", talkativeness: 2, initialTrust: 2, patience: 3, priceSensitivity: 3 },
    successEndConditions: ["Agree to a deeper workflow discovery meeting"], failureEndConditions: ["Repeated unsupported pitching", "Manipulative behavior"],
  },
  evaluatorOnly: {
    rubric: [
      ["opening", "Opening and agenda", 10], ["questions", "Question quality", 15], ["pain", "Pain discovery", 20],
      ["impact", "Business-impact discovery", 20], ["listening", "Active listening", 15], ["positioning", "Relevant positioning", 10], ["next-step", "Next-step control", 10],
    ].map(([id, name, weight]) => ({ id: String(id), name: String(name), description: `Observable seller behavior for ${String(name).toLowerCase()}.`, weight: Number(weight), anchors: anchor(String(name)) })),
    requiredDiscoveries: ["How forecasts are assembled", "Downstream impact", "Duplicate work"], prohibitedClaims: ["Guaranteed forecast accuracy"], criticalMistakes: ["Ignore the CRM objection", "Pitch before discovery"],
  },
};
