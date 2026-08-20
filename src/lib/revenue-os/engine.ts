import "server-only";

import { createHash } from "node:crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { assetBlueprints, assetContentSchema } from "./contracts";
import {
  createRevenueAssetGenerator,
  createRevenueEvidenceExtractor,
  type PersistedObservation,
} from "./providers";

type IngestRevenueCallInput = {
  organizationId: string;
  userId: string;
  title: string;
  accountName: string;
  transcript: string;
  consentStatus: "confirmed" | "synthetic";
  idempotencyKey: string;
};

function normalizeEntityLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 180);
}

export async function ingestRevenueCall(input: IngestRevenueCallInput) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Revenue intelligence persistence is unavailable");

  const { data: prior } = await supabase
    .from("revenue_calls")
    .select("id,status")
    .eq("organization_id", input.organizationId)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (prior) return { callId: prior.id, status: prior.status, duplicate: true };

  const { data: call, error: callError } = await supabase
    .from("revenue_calls")
    .insert({
      organization_id: input.organizationId,
      provider: "upload",
      title: input.title,
      account_name: input.accountName,
      consent_status: input.consentStatus,
      idempotency_key: input.idempotencyKey,
      created_by: input.userId,
      status: "processing",
    })
    .select("id")
    .single();
  if (callError || !call) throw callError ?? new Error("Call could not be created");

  try {
    const extractionStartedAt = Date.now();
    const synthetic = input.consentStatus === "synthetic";
    const extraction = await createRevenueEvidenceExtractor(synthetic).extract(input.transcript);
    await supabase.from("usage_events").insert({
      organization_id: input.organizationId,
      user_id: input.userId,
      operation_type: "revenue_evidence_extraction",
      model: extraction.model,
      input_tokens: extraction.inputTokens,
      output_tokens: extraction.outputTokens,
      latency_ms: Date.now() - extractionStartedAt,
    });
    const { data: inserted, error: evidenceError } = await supabase
      .from("evidence_observations")
      .insert(
        extraction.result.observations.map((observation) => ({
          organization_id: input.organizationId,
          call_id: call.id,
          turn_id: observation.turnId,
          speaker: observation.speaker,
          observation_type: observation.observationType,
          claim: observation.claim,
          excerpt: observation.excerpt,
          confidence: observation.confidence,
        })),
      )
      .select("id,turn_id,speaker,observation_type,claim,excerpt,confidence");
    if (evidenceError) throw evidenceError;

    const observations: PersistedObservation[] = (inserted ?? []).map((observation) => ({
      id: observation.id,
      turnId: observation.turn_id,
      speaker: observation.speaker as PersistedObservation["speaker"],
      observationType: observation.observation_type as PersistedObservation["observationType"],
      claim: observation.claim,
      excerpt: observation.excerpt,
      confidence: Number(observation.confidence),
    }));

    const uniqueEntities = new Set<string>();
    for (const observation of observations.filter(({ speaker }) => speaker === "buyer")) {
      const entityType = observation.observationType === "impact"
        ? "outcome"
        : observation.observationType === "language"
          ? "priority"
          : observation.observationType;
      if (!["pain", "objection", "priority", "stakeholder", "competitor", "outcome"].includes(entityType)) continue;
      const normalizedLabel = normalizeEntityLabel(observation.claim);
      const entityKey = `${entityType}:${normalizedLabel}`;
      if (!normalizedLabel || uniqueEntities.has(entityKey)) continue;
      uniqueEntities.add(entityKey);
      const { error } = await supabase.rpc("record_knowledge_entity_observation", {
        p_organization_id: input.organizationId,
        p_entity_type: entityType,
        p_canonical_label: observation.claim.slice(0, 240),
        p_normalized_label: normalizedLabel,
        p_confidence: observation.confidence,
      });
      if (error) throw error;
    }

    const evidenceCoverage = Math.min(1, observations.length / 8);
    const enoughEvidence = observations.length >= 2;
    const generationStartedAt = Date.now();
    const generated = enoughEvidence
      ? await createRevenueAssetGenerator(synthetic).generate({
          title: input.title,
          accountName: input.accountName,
          observations,
        })
      : null;
    if (generated) {
      await supabase.from("usage_events").insert({
        organization_id: input.organizationId,
        user_id: input.userId,
        operation_type: "revenue_asset_generation",
        model: generated.model,
        input_tokens: generated.inputTokens,
        output_tokens: generated.outputTokens,
        latency_ms: Date.now() - generationStartedAt,
      });
    }
    const generatedByType = new Map(generated?.assets.map((asset) => [asset.assetType, asset.content]));

    const { data: createdAssets, error: assetError } = await supabase
      .from("revenue_assets")
      .insert(
        assetBlueprints.map(([assetType, label, department]) => ({
          organization_id: input.organizationId,
          call_id: call.id,
          asset_type: assetType,
          title: `${label}: ${input.accountName || input.title}`,
          department,
          status: enoughEvidence ? "review_required" : "insufficient_evidence",
          evidence_coverage: evidenceCoverage,
          current_version: enoughEvidence ? 1 : 0,
          created_by: input.userId,
        })),
      )
      .select("id,asset_type");
    if (assetError) throw assetError;

    if (generated && createdAssets?.length) {
      const sourceHash = createHash("sha256").update(input.transcript).digest("hex");
      const { data: versions, error: versionError } = await supabase
        .from("revenue_asset_versions")
        .insert(
          createdAssets.map((asset) => {
            const content = assetContentSchema.parse(generatedByType.get(asset.asset_type));
            return {
              organization_id: input.organizationId,
              asset_id: asset.id,
              version: 1,
              content: { ...content, sourceHash },
              model: generated.model,
              prompt_version: generated.promptVersion,
              generated_by: input.userId,
            };
          }),
        )
        .select("id,asset_id");
      if (versionError) throw versionError;

      const typeByAssetId = new Map(createdAssets.map((asset) => [asset.id, asset.asset_type]));
      const evidenceLinks = (versions ?? []).flatMap((version) => {
        const type = typeByAssetId.get(version.asset_id);
        const content = type ? generatedByType.get(type) : null;
        return (content?.evidenceObservationIds ?? []).map((observationId) => ({
          organization_id: input.organizationId,
          asset_version_id: version.id,
          observation_id: observationId,
        }));
      });
      if (evidenceLinks.length) {
        const { error } = await supabase.from("revenue_asset_evidence").insert(evidenceLinks);
        if (error) throw error;
      }
    }

    const { error: readyError } = await supabase
      .from("revenue_calls")
      .update({
        status: "ready",
        extraction_model: extraction.model,
        extraction_metadata: {
          assumptions: extraction.result.assumptions,
          missingInformation: extraction.result.missingInformation,
          observationCount: observations.length,
        },
      })
      .eq("id", call.id)
      .eq("organization_id", input.organizationId);
    if (readyError) throw readyError;
    return {
      callId: call.id,
      status: "ready",
      duplicate: false,
      observationCount: observations.length,
      assetCount: assetBlueprints.length,
      extractionModel: extraction.model,
      assetModel: generated?.model ?? null,
    };
  } catch (error) {
    await supabase
      .from("revenue_calls")
      .update({ status: "failed" })
      .eq("id", call.id)
      .eq("organization_id", input.organizationId);
    throw error;
  }
}
