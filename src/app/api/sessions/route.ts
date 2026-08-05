import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAppContext } from "@/lib/auth/context";
import { createInitialBuyerState } from "@/lib/domain/buyer";
import { scenarioSpecSchema, toPracticeBrief } from "@/lib/domain/scenario";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({ scenarioVersionId: z.string().uuid(), sellerLevel: z.enum(["new_rep", "experienced_rep", "manager", "vp"]).default("new_rep") });

export async function POST(request: Request) {
  const context = await requireAppContext();
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "validation_failed", message: "Choose a published scenario and seller level." }, { status: 400 });
  if (context.demo) return NextResponse.json({ sessionId: crypto.randomUUID(), practiceBrief: null, persisted: false });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ code: "internal_error", message: "Session persistence is unavailable." }, { status: 503 });
  const { data: version } = await admin.from("scenario_versions").select("id,scenario_spec,persona_version_id,published_at").eq("id", parsed.data.scenarioVersionId).eq("organization_id", context.organization.id).maybeSingle();
  if (!version) return NextResponse.json({ code: "not_found", message: "Scenario version not found." }, { status: 404 });
  if (!version.published_at || !version.persona_version_id) return NextResponse.json({ code: "conflict", message: "The scenario must reference a published persona version." }, { status: 409 });
  if (context.role === "rep") {
    const { data: targets } = await admin.from("assignment_targets").select("assignment_id").eq("organization_id", context.organization.id).eq("user_id", context.user.id);
    const assignmentIds = (targets ?? []).map((target) => target.assignment_id);
    if (!assignmentIds.length) return NextResponse.json({ code: "unauthorized", message: "This scenario is not assigned to you." }, { status: 403 });
    const { data: assignment } = await admin.from("assignments").select("id").eq("organization_id", context.organization.id).eq("scenario_version_id", version.id).in("id", assignmentIds).eq("status", "active").limit(1).maybeSingle();
    if (!assignment) return NextResponse.json({ code: "unauthorized", message: "This scenario is not assigned to you." }, { status: 403 });
  }
  const scenario = scenarioSpecSchema.parse(version.scenario_spec);
  const { data: session, error } = await admin.from("sessions").insert({ organization_id: context.organization.id, scenario_version_id: version.id, persona_version_id: version.persona_version_id, user_id: context.user.id, seller_level: parsed.data.sellerLevel, status: "active" }).select("id,started_at").single();
  if (error || !session) return NextResponse.json({ code: "internal_error", message: "The practice session could not be started." }, { status: 500 });
  const { error: stateError } = await admin.from("buyer_session_states").insert({ session_id: session.id, organization_id: context.organization.id, state: createInitialBuyerState(scenario) });
  if (stateError) { await admin.from("sessions").delete().eq("id", session.id); return NextResponse.json({ code: "internal_error", message: "The buyer state could not be initialized." }, { status: 500 }); }
  return NextResponse.json({ sessionId: session.id, startedAt: session.started_at, practiceBrief: toPracticeBrief(scenario), persisted: true });
}
