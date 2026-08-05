import { NextResponse } from "next/server";
import { createEvaluator } from "@/lib/ai/evaluator";
import { requireAppContext } from "@/lib/auth/context";
import { calculateWeightedScore } from "@/lib/domain/evaluation";
import { scenarioSpecSchema } from "@/lib/domain/scenario";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const started = Date.now();
  const context = await requireAppContext();
  const key = request.headers.get("idempotency-key");
  if (!key || key.length > 200) return NextResponse.json({ code: "validation_failed", message: "An evaluation idempotency key is required." }, { status: 400 });
  if (context.demo) return NextResponse.json({ code: "conflict", message: "Demo results use the deterministic preview." }, { status: 409 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ code: "internal_error", message: "Evaluation persistence is unavailable." }, { status: 503 });
  const { id } = await params;
  const { data: session } = await admin.from("sessions").select("id,user_id,status,scenario_version_id,persona_version_id").eq("id", id).eq("organization_id", context.organization.id).maybeSingle();
  if (!session) return NextResponse.json({ code: "not_found", message: "Session not found." }, { status: 404 });
  if (session.user_id !== context.user.id && context.role === "rep") return NextResponse.json({ code: "unauthorized", message: "You cannot evaluate another representative’s session." }, { status: 403 });
  const { data: existing } = await admin.from("evaluations").select("id,status,weighted_score,result").eq("session_id", id).eq("organization_id", context.organization.id).maybeSingle();
  if (existing) return NextResponse.json({ evaluationId: existing.id, status: existing.status, weightedScore: existing.weighted_score, result: existing.result, duplicate: true });
  if (session.status !== "completed") return NextResponse.json({ code: "conflict", message: "Complete the session before evaluation." }, { status: 409 });
  const [{ data: version }, { data: turns }] = await Promise.all([
    admin.from("scenario_versions").select("scenario_spec").eq("id", session.scenario_version_id).eq("organization_id", context.organization.id).maybeSingle(),
    admin.from("session_turns").select("id,role,content").eq("session_id", id).eq("organization_id", context.organization.id).order("sequence"),
  ]);
  if (!version) return NextResponse.json({ code: "internal_error", message: "The immutable scenario is unavailable." }, { status: 500 });
  try {
    await admin.from("sessions").update({ status: "evaluating" }).eq("id", id).eq("status", "completed");
    const scenario = scenarioSpecSchema.parse(version.scenario_spec);
    const transcript = (turns ?? []).map((turn) => ({ id: turn.id, role: turn.role as "seller" | "buyer", content: turn.content }));
    const result = await createEvaluator().evaluate({ scenario, turns: transcript });
    const weightedScore = calculateWeightedScore(result, scenario.evaluatorOnly.rubric);
    const model = process.env.AI_PROVIDER === "mock" ? "deterministic-mock" : process.env.OPENAI_EVALUATOR_MODEL!;
    const { data: evaluation, error } = await admin.from("evaluations").insert({ organization_id: context.organization.id, session_id: id, scenario_version_id: session.scenario_version_id, rubric_version: scenario.schemaVersion, evaluator_model: model, evaluator_prompt_version: "evaluator-v2", result, weighted_score: weightedScore, status: result.evaluationStatus, idempotency_key: key }).select("id,status,weighted_score").single();
    if (error || !evaluation) throw error ?? new Error("Evaluation insert failed");
    await Promise.all([
      admin.from("sessions").update({ status: "evaluated" }).eq("id", id),
      admin.from("usage_events").insert({ organization_id: context.organization.id, user_id: context.user.id, session_id: id, scenario_version_id: session.scenario_version_id, operation_type: "post_call_evaluation", model, latency_ms: Date.now() - started }),
    ]);
    return NextResponse.json({ evaluationId: evaluation.id, status: evaluation.status, weightedScore: evaluation.weighted_score, result, duplicate: false });
  } catch {
    await admin.from("sessions").update({ status: "completed" }).eq("id", id).eq("status", "evaluating");
    return NextResponse.json({ code: "ai_provider_error", message: "The evaluation could not be completed. Retry safely with the same key." }, { status: 502 });
  }
}
