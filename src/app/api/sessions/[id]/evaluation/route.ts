import { NextResponse } from "next/server";
import { requireAppContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAppContext();
  if (context.demo) return NextResponse.json({ code: "not_found", message: "Evaluation not found." }, { status: 404 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ code: "internal_error", message: "Evaluation persistence is unavailable." }, { status: 503 });
  const { id } = await params;
  const { data: session } = await admin.from("sessions").select("id,user_id").eq("id", id).eq("organization_id", context.organization.id).maybeSingle();
  if (!session) return NextResponse.json({ code: "not_found", message: "Session not found." }, { status: 404 });
  if (session.user_id !== context.user.id && context.role === "rep") return NextResponse.json({ code: "unauthorized", message: "You cannot access another representative’s evaluation." }, { status: 403 });
  const { data: evaluation } = await admin.from("evaluations").select("id,status,weighted_score,result,evaluator_model,evaluator_prompt_version,created_at").eq("session_id", id).eq("organization_id", context.organization.id).maybeSingle();
  if (!evaluation) return NextResponse.json({ code: "not_found", message: "Evaluation not found." }, { status: 404 });
  const { data: overrides } = await admin.from("manager_score_overrides").select("id,criterion_id,replacement_score,rationale,manager_id,created_at,supersedes_override_id,effective_weighted_score").eq("organization_id", context.organization.id).eq("evaluation_id", evaluation.id).order("created_at");
  return NextResponse.json({ evaluation, overrides: (overrides ?? []).filter((override) => override.id && override.criterion_id) });
}
