import { NextResponse } from "next/server";

import { OpenAIPersonaEngine } from "@/lib/ai/persona-engine";
import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";
import { PersonaEvidenceError, transcriptPersonaRequestSchema } from "@/lib/domain/persona";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const context = await requireAppContext();
  if (!canManage(context.role)) return NextResponse.json({ code: "unauthorized", message: "Manager access is required." }, { status: 403 });
  const parsed = transcriptPersonaRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "validation_failed", message: "Review the transcript, consent, and industry fields.", fields: parsed.error.flatten() }, { status: 400 });

  try {
    const started = Date.now();
    const result = await new OpenAIPersonaEngine().synthesize(parsed.data);
    const supabase = await createSupabaseServerClient();
    let personaId: string | null = null;
    if (supabase && !context.demo) {
      const { data, error } = await supabase.from("persona_drafts").insert({
        organization_id: context.organization.id,
        created_by: context.user.id,
        industry_id: parsed.data.industryId,
        status: "ai_generated",
        structured_data: result.draft,
        evidence_coverage: result.draft.evidenceCoverage,
        source_count: parsed.data.transcripts.length,
      }).select("id").single();
      if (error) throw error;
      personaId = data.id;
      await supabase.from("usage_events").insert({
        organization_id: context.organization.id,
        user_id: context.user.id,
        operation_type: "persona_synthesis",
        model: result.model,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        latency_ms: Date.now() - started,
      });
    }
    return NextResponse.json({ personaId, draft: result.draft, model: result.model, persisted: Boolean(personaId) });
  } catch (error) {
    if (error instanceof PersonaEvidenceError) {
      return NextResponse.json({ code: "validation_failed", message: error.message, issues: error.issues }, { status: 422 });
    }
    return NextResponse.json({ code: "ai_provider_error", message: "Persona analysis could not be completed. Your transcript was not published." }, { status: 502 });
  }
}
