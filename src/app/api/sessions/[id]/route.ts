import { NextResponse } from "next/server";
import { requireAppContext } from "@/lib/auth/context";
import { scenarioSpecSchema, toPracticeBrief } from "@/lib/domain/scenario";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAppContext();
  if (context.demo) return NextResponse.json({ code: "not_found", message: "Session not found." }, { status: 404 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ code: "internal_error", message: "Session persistence is unavailable." }, { status: 503 });
  const { id } = await params;
  const { data: session } = await admin.from("sessions").select("id,user_id,status,scenario_version_id,persona_version_id,seller_level,started_at,completed_at").eq("id", id).eq("organization_id", context.organization.id).maybeSingle();
  if (!session) return NextResponse.json({ code: "not_found", message: "Session not found." }, { status: 404 });
  if (session.user_id !== context.user.id && context.role === "rep") return NextResponse.json({ code: "unauthorized", message: "You cannot access another representative’s session." }, { status: 403 });
  const [{ data: version }, { data: turns }] = await Promise.all([
    admin.from("scenario_versions").select("scenario_spec").eq("id", session.scenario_version_id).eq("organization_id", context.organization.id).maybeSingle(),
    admin.from("session_turns").select("id,sequence,role,content,created_at").eq("session_id", id).eq("organization_id", context.organization.id).order("sequence"),
  ]);
  if (!version) return NextResponse.json({ code: "internal_error", message: "Scenario version is unavailable." }, { status: 500 });
  return NextResponse.json({ session, practiceBrief: toPracticeBrief(scenarioSpecSchema.parse(version.scenario_spec)), turns: turns ?? [] });
}
