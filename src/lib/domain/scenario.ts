import { z } from "zod";

export const difficultySchema = z.enum(["easy", "medium", "hard", "expert"]);
const scale = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
const anchors = z.object({ 0: z.string(), 1: z.string(), 2: z.string(), 3: z.string(), 4: z.string() });

export const scenarioSpecSchema = z.object({
  schemaVersion: z.literal("1.0"),
  metadata: z.object({
    title: z.string().min(1), description: z.string(),
    callType: z.enum(["cold_call", "discovery", "demo", "pricing", "renewal", "expansion"]),
    difficulty: difficultySchema, targetDurationMinutes: z.number().int().positive().max(120),
  }),
  repVisible: z.object({
    accountName: z.string(), buyerName: z.string(), buyerTitle: z.string(), meetingContext: z.string(),
    callObjective: z.string(), knownFacts: z.array(z.string()),
  }),
  buyerHidden: z.object({
    companyContext: z.string(),
    identity: z.object({ responsibilities: z.array(z.string()), priorities: z.array(z.string()), communicationStyle: z.string(), professionalBackground: z.string().optional() }),
    pains: z.array(z.object({ id: z.string(), label: z.string(), severity: scale, currentSymptoms: z.array(z.string()), businessImpact: z.array(z.string()), emotionalIndicators: z.array(z.string()), revealConditions: z.array(z.string()), shouldNotVolunteer: z.boolean() })),
    objections: z.array(z.object({ id: z.string(), trigger: z.string(), surfaceStatement: z.string(), underlyingConcern: z.string(), resolutionSignals: z.array(z.string()) })),
    decisionProcess: z.object({ budgetStatus: z.string(), timeline: z.string(), stakeholders: z.array(z.string()), approvalProcess: z.string(), alternativesBeingConsidered: z.array(z.string()) }),
    behavior: z.object({ baselineTone: z.string(), talkativeness: scale, initialTrust: scale, patience: scale, priceSensitivity: scale }),
    successEndConditions: z.array(z.string()), failureEndConditions: z.array(z.string()),
  }),
  evaluatorOnly: z.object({
    rubric: z.array(z.object({ id: z.string(), name: z.string(), description: z.string(), weight: z.number().positive(), anchors })),
    requiredDiscoveries: z.array(z.string()), prohibitedClaims: z.array(z.string()), criticalMistakes: z.array(z.string()),
  }).superRefine((value, context) => {
    const total = value.rubric.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (Math.abs(total - 100) > 0.001) context.addIssue({ code: "custom", message: "Rubric weights must total 100", path: ["rubric"] });
  }),
});

export type ScenarioSpec = z.infer<typeof scenarioSpecSchema>;
export type RepPracticeBrief = Pick<ScenarioSpec, "schemaVersion" | "metadata" | "repVisible">;
export function toPracticeBrief(spec: ScenarioSpec): RepPracticeBrief {
  return { schemaVersion: spec.schemaVersion, metadata: spec.metadata, repVisible: spec.repVisible };
}
