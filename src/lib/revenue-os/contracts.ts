import { z } from "zod";

export const assetBlueprints = [
  ["customer_persona", "Customer persona", "Sales"],
  ["digital_twin", "Digital twin buyer", "Enablement"],
  ["roleplay", "Roleplay simulation", "Enablement"],
  ["playbook", "Playbook update", "Enablement"],
  ["talk_track", "Talk track", "Sales"],
  ["battle_card", "Battle card", "Sales"],
  ["follow_up", "Follow-up email", "Sales"],
  ["manager_coaching", "Manager coaching brief", "Enablement"],
  ["rep_scorecard", "Rep scorecard", "Enablement"],
  ["objection_library", "Objection library entry", "Sales"],
  ["pain_map", "Customer pain map", "Product"],
  ["voice_of_customer", "Voice-of-customer brief", "Marketing"],
  ["message_angle", "Campaign message angle", "Marketing"],
  ["content_brief", "Content brief", "Marketing"],
  ["product_signal", "Product signal", "Product"],
  ["feature_request", "Feature request", "Product"],
  ["success_plan", "Customer success plan", "Customer Success"],
  ["risk_alert", "Customer risk alert", "Customer Success"],
  ["executive_brief", "Executive revenue brief", "Leadership"],
  ["knowledge_update", "Knowledge graph update", "Revenue OS"],
] as const;

export type RevenueAssetType = (typeof assetBlueprints)[number][0];

export const evidenceObservationSchema = z.object({
  turnId: z.string().min(1),
  speaker: z.enum(["buyer", "seller", "unknown"]),
  observationType: z.enum(["pain", "symptom", "impact", "objection", "priority", "stakeholder", "decision_process", "competitor", "language", "outcome"]),
  claim: z.string().min(3).max(1_000),
  excerpt: z.string().min(1).max(1_000),
  confidence: z.number().min(0).max(1),
});

export const evidenceExtractionSchema = z.object({
  observations: z.array(evidenceObservationSchema).max(100),
  assumptions: z.array(z.string()).max(20),
  missingInformation: z.array(z.string()).max(20),
});

export const assetContentSchema = z.object({
  summary: z.string().min(1),
  sections: z.array(z.object({ heading: z.string(), content: z.string() })).min(1).max(12),
  evidenceObservationIds: z.array(z.string().uuid()).min(1),
  caveats: z.array(z.string()).max(10),
});

export const revenueAssetDraftSchema = z.object({
  assetType: z.enum(assetBlueprints.map(([type]) => type) as [RevenueAssetType, ...RevenueAssetType[]]),
  content: assetContentSchema,
});

export const revenueAssetBatchSchema = z.object({
  assets: z.array(revenueAssetDraftSchema).length(assetBlueprints.length),
}).superRefine(({ assets }, context) => {
  const types = assets.map(({ assetType }) => assetType);
  if (new Set(types).size !== assetBlueprints.length) {
    context.addIssue({ code: "custom", path: ["assets"], message: "Every revenue asset type must appear exactly once" });
  }
  for (const [type] of assetBlueprints) {
    if (!types.includes(type)) {
      context.addIssue({ code: "custom", path: ["assets"], message: `Missing revenue asset type: ${type}` });
    }
  }
});

export type EvidenceExtraction = z.infer<typeof evidenceExtractionSchema>;
export type RevenueAssetDraft = z.infer<typeof revenueAssetDraftSchema>;

export const connectorCatalog = [
  { provider: "gong", name: "Gong", scopes: ["calls:read", "transcripts:read", "users:read"] },
  { provider: "chorus", name: "Chorus", scopes: ["calls:read", "transcripts:read"] },
  { provider: "zoom", name: "Zoom", scopes: ["recording:read", "transcript:read"] },
  { provider: "teams", name: "Microsoft Teams", scopes: ["OnlineMeetings.Read", "CallRecords.Read.All"] },
  { provider: "salesforce", name: "Salesforce", scopes: ["api", "refresh_token"] },
] as const;
