import { NextResponse } from "next/server";
import { z } from "zod";

import { createBuyerActor } from "@/lib/ai/buyer-actor";
import { requireAppContext } from "@/lib/auth/context";
import { buyerStateSchema } from "@/lib/domain/buyer";
import { scenarioSpecSchema } from "@/lib/domain/scenario";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({ message: z.string().trim().min(1).max(4_000), expectedStateVersion: z.number().int().positive() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const started = Date.now();
  const context = await requireAppContext();
  const key = request.headers.get("idempotency-key");
  if (!key || key.length > 200) return NextResponse.json({ code: "validation_failed", message: "A valid idempotency key is required." }, { status: 400 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "validation_failed", message: "Enter a message and current session version." }, { status: 400 });
  if (context.demo) return NextResponse.json({ code: "not_found", message: "Use the demo practice endpoint." }, { status: 404 });
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const userClient = await createSupabaseServerClient();
  if (!admin || !userClient) return NextResponse.json({ code: "internal_error", message: "Practice persistence is unavailable." }, { status: 503 });
  const { data: session } = await admin.from("sessions").select("id,user_id,status,scenario_version_id").eq("id", id).eq("organization_id", context.organization.id).maybeSingle();
  if (!session) return NextResponse.json({ code: "not_found", message: "Session not found." }, { status: 404 });
  if (session.user_id !== context.user.id && context.role === "rep") return NextResponse.json({ code: "unauthorized", message: "You cannot access another representative’s session." }, { status: 403 });
  if (session.status !== "active") return NextResponse.json({ code: "conflict", message: "This session is already complete." }, { status: 409 });
  const [{ data: version }, { data: stateRow }, { data: rows }] = await Promise.all([
    admin.from("scenario_versions").select("scenario_spec").eq("id", session.scenario_version_id).eq("organization_id", context.organization.id).maybeSingle(),
    admin.from("buyer_session_states").select("state,state_version").eq("session_id", id).eq("organization_id", context.organization.id).maybeSingle(),
    admin.from("session_turns").select("id,role,content").eq("session_id", id).eq("organization_id", context.organization.id).order("sequence"),
  ]);
  if (!version || !stateRow) return NextResponse.json({ code: "internal_error", message: "Session configuration is incomplete." }, { status: 500 });
  if (stateRow.state_version !== parsed.data.expectedStateVersion) return NextResponse.json({ code: "conflict", message: "The session changed. Refresh before sending again.", stateVersion: stateRow.state_version }, { status: 409 });
  try {
    const scenario = scenarioSpecSchema.parse(version.scenario_spec);
    const result = await createBuyerActor().respond({ scenario, turns: (rows ?? []).map((turn) => ({ id: turn.id, role: turn.role as "seller" | "buyer", content: turn.content })), sellerMessage: parsed.data.message, state: buyerStateSchema.parse(stateRow.state) });
    const { data, error } = await userClient.rpc("persist_buyer_turn", { p_session_id: id, p_organization_id: context.organization.id, p_expected_state_version: parsed.data.expectedStateVersion, p_idempotency_key: key, p_seller_content: parsed.data.message, p_buyer_content: result.message, p_next_state: result.state, p_event: { sellerMove: result.sellerMove, disclosures: result.disclosures, objectionEvent: result.objectionEvent, endAction: result.endAction }, p_model: process.env.AI_PROVIDER === "mock" ? "deterministic-mock" : process.env.OPENAI_BUYER_MODEL!, p_input_tokens: result.usage?.inputTokens ?? 0, p_output_tokens: result.usage?.outputTokens ?? 0, p_latency_ms: Date.now() - started });
    if (error) return NextResponse.json({ code: error.message.includes("conflict") ? "conflict" : "internal_error", message: error.message.includes("conflict") ? "The session changed. Retry this turn." : "The turn could not be saved." }, { status: error.message.includes("conflict") ? 409 : 500 });
    return NextResponse.json({ ...data, sessionStatus: result.endAction === "continue" ? "active" : "buyer_ended" });
  } catch {
    return NextResponse.json({ code: "ai_provider_error", message: "The buyer could not respond. Retry this turn." }, { status: 502 });
  }
}
