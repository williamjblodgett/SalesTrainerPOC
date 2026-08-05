import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { OpenAIPersonaEngine } from "@/lib/ai/persona-engine";
import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";
import { PersonaEvidenceError, transcriptPersonaRequestSchema } from "@/lib/domain/persona";
import { normalizeTranscript } from "@/lib/domain/persona";
import { redactSensitiveText } from "@/lib/security/pii-redaction";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const context = await requireAppContext();
  if (!canManage(context.role)) return NextResponse.json({ code: "unauthorized", message: "Manager access is required." }, { status: 403 });
  const parsed = transcriptPersonaRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "validation_failed", message: "Review the transcript, consent, and industry fields.", fields: parsed.error.flatten() }, { status: 400 });

  try {
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey || !/^[0-9a-f-]{36}$/i.test(idempotencyKey)) return NextResponse.json({ code: "validation_failed", message: "A valid idempotency key is required." }, { status: 400 });
    const started = Date.now();
    const piiBySource = new Map<string, ReturnType<typeof redactSensitiveText>["findings"]>();
    const safeInput = {
      ...parsed.data,
      transcripts: parsed.data.transcripts.map((source) => {
        const redacted = redactSensitiveText(source.content);
        piiBySource.set(source.sourceId, redacted.findings);
        return { ...source, content: redacted.text };
      }),
    };
    for (const source of safeInput.transcripts) {
      if (source.storagePath && !source.storagePath.startsWith(`${context.organization.id}/`)) return NextResponse.json({ code: "unauthorized", message: "Transcript storage reference is invalid." }, { status: 403 });
    }
    const result = await new OpenAIPersonaEngine().synthesize(safeInput);
    const supabase = await createSupabaseServerClient();
    let personaId: string | null = null;
    if (supabase && !context.demo) {
      const sources = safeInput.transcripts.map((source) => ({
        sourceId: source.sourceId,
        title: source.title,
        consentStatus: source.consentStatus,
        provider: source.provider ?? (source.storagePath ? "upload" : "paste"),
        storagePath: source.storagePath,
        originalFilename: source.originalFilename,
        originalMimeType: source.originalMimeType,
        originalSizeBytes: source.originalSizeBytes,
        contentHash: createHash("sha256").update(source.content).digest("hex"),
        piiFindings: source.piiFindings ?? piiBySource.get(source.sourceId) ?? [],
        scannerStatus: source.scannerStatus ?? (source.storagePath ? "passed" : "not_applicable"),
        turns: normalizeTranscript(source.content).map((turn, index) => ({ ...turn, sequence: index + 1 })),
      }));
      const { data, error } = await supabase.rpc("create_persona_draft_with_lineage", {
        p_organization_id: context.organization.id,
        p_industry_id: safeInput.industryId,
        p_retention_mode: safeInput.retentionMode,
        p_draft: result.draft,
        p_sources: sources,
        p_idempotency_key: idempotencyKey,
        p_model: result.model,
        p_input_tokens: result.inputTokens,
        p_output_tokens: result.outputTokens,
        p_latency_ms: Date.now() - started,
      });
      if (error) throw error;
      personaId = data;
    }
    return NextResponse.json({ personaId, draft: result.draft, model: result.model, persisted: Boolean(personaId) });
  } catch (error) {
    if (error instanceof PersonaEvidenceError) {
      return NextResponse.json({ code: "validation_failed", message: error.message, issues: error.issues }, { status: 422 });
    }
    return NextResponse.json({ code: "ai_provider_error", message: "Persona analysis could not be completed. Your transcript was not published." }, { status: 502 });
  }
}
