import "server-only";

import { createHash } from "node:crypto";

import { normalizeTranscript } from "@/lib/domain/persona";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { assetBlueprints } from "./contracts";

type Observation = { turnId: string; speaker: "buyer" | "seller" | "unknown"; type: "pain" | "symptom" | "impact" | "objection" | "priority" | "stakeholder" | "decision_process" | "competitor" | "language" | "outcome"; claim: string; excerpt: string; confidence: number };

function classify(text: string): Observation["type"] {
  if (/object|already have|too expensive|not interested|concern|risk/i.test(text)) return "objection";
  if (/impact|cost|revenue|delay|leadership|result|consequence/i.test(text)) return "impact";
  if (/approve|committee|legal|security|stakeholder|decision/i.test(text)) return "stakeholder";
  if (/priority|important|goal|need to|must/i.test(text)) return "priority";
  if (/competitor|alternative|other vendor|build it/i.test(text)) return "competitor";
  if (/problem|challenge|manual|frustrat|difficult|breaks|late/i.test(text)) return "pain";
  return "language";
}

function extractObservations(transcript: string): Observation[] {
  return normalizeTranscript(transcript)
    .filter((turn) => turn.speaker === "buyer" && turn.content.length >= 12)
    .slice(0, 100)
    .map((turn) => ({ turnId: turn.turnId, speaker: turn.speaker, type: classify(turn.content), claim: turn.content, excerpt: turn.content, confidence: 0.62 }));
}

export async function ingestRevenueCall(input: { organizationId: string; userId: string; title: string; accountName: string; transcript: string; consentStatus: "confirmed" | "synthetic"; idempotencyKey: string }) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Revenue intelligence persistence is unavailable");
  const { data: prior } = await admin.from("revenue_calls").select("id,status").eq("organization_id", input.organizationId).eq("idempotency_key", input.idempotencyKey).maybeSingle();
  if (prior) return { callId: prior.id, status: prior.status, duplicate: true };
  const { data: call, error: callError } = await admin.from("revenue_calls").insert({ organization_id: input.organizationId, provider: "upload", title: input.title, account_name: input.accountName, consent_status: input.consentStatus, idempotency_key: input.idempotencyKey, created_by: input.userId, status: "processing" }).select("id").single();
  if (callError || !call) throw callError ?? new Error("Call could not be created");
  try {
    const observations = extractObservations(input.transcript);
    if (observations.length) {
      const { data: inserted } = await admin.from("evidence_observations").insert(observations.map((observation) => ({ organization_id: input.organizationId, call_id: call.id, turn_id: observation.turnId, speaker: observation.speaker, observation_type: observation.type, claim: observation.claim, excerpt: observation.excerpt, confidence: observation.confidence }))).select("id,observation_type,claim,excerpt,confidence");
      for (const observation of inserted ?? []) {
        const normalized = observation.claim.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 180);
        const entityType = observation.observation_type === "impact" ? "outcome" : observation.observation_type === "language" ? "priority" : observation.observation_type;
        if (!["pain", "objection", "priority", "stakeholder", "competitor", "outcome"].includes(entityType)) continue;
        await admin.from("knowledge_entities").upsert({ organization_id: input.organizationId, entity_type: entityType, canonical_label: observation.claim.slice(0, 240), normalized_label: normalized, evidence_count: 1, distinct_call_count: 1, confidence: observation.confidence, last_seen_at: new Date().toISOString() }, { onConflict: "organization_id,entity_type,normalized_label" });
      }
      const evidenceIds = (inserted ?? []).map((observation) => observation.id);
      const evidenceCoverage = Math.min(1, evidenceIds.length / 8);
      const assets = assetBlueprints.map(([assetType, label, department]) => ({ organization_id: input.organizationId, call_id: call.id, asset_type: assetType, title: `${label}: ${input.accountName || input.title}`, department, status: evidenceIds.length >= 2 ? "review_required" : "insufficient_evidence", evidence_coverage: evidenceCoverage, current_version: evidenceIds.length >= 2 ? 1 : 0, created_by: input.userId }));
      const { data: createdAssets } = await admin.from("revenue_assets").insert(assets).select("id,asset_type,title,status");
      if (evidenceIds.length >= 2 && createdAssets?.length) {
        const sourceHash = createHash("sha256").update(input.transcript).digest("hex");
        const sharedContent = {
          sections: [{ heading: "Customer evidence", content: (inserted ?? []).slice(0, 5).map((item) => item.claim).join("\n") }],
          caveats: ["Manager review is required before publication."],
          sourceHash,
        };
        const { data: versions, error: versionError } = await admin.from("revenue_asset_versions").insert(createdAssets.map((asset) => ({
          organization_id: input.organizationId,
          asset_id: asset.id,
          version: 1,
          content: { ...sharedContent, summary: `Evidence-backed ${asset.title}` },
          model: "deterministic-evidence-planner",
          prompt_version: "asset-planner-v1",
          generated_by: input.userId,
        }))).select("id");
        if (versionError) throw versionError;
        const evidenceLinks = (versions ?? []).flatMap((version) => evidenceIds.map((observationId) => ({ organization_id: input.organizationId, asset_version_id: version.id, observation_id: observationId })));
        if (evidenceLinks.length) {
          const { error: evidenceError } = await admin.from("revenue_asset_evidence").insert(evidenceLinks);
          if (evidenceError) throw evidenceError;
        }
      }
    }
    await admin.from("revenue_calls").update({ status: "ready" }).eq("id", call.id).eq("organization_id", input.organizationId);
    return { callId: call.id, status: "ready", duplicate: false, observationCount: observations.length, assetCount: assetBlueprints.length };
  } catch (error) {
    await admin.from("revenue_calls").update({ status: "failed" }).eq("id", call.id).eq("organization_id", input.organizationId);
    throw error;
  }
}
