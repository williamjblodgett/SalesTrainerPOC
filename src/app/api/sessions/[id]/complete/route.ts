import { NextResponse } from "next/server";
import { requireAppContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAppContext();
  const key = request.headers.get("idempotency-key");
  if (!key || key.length > 200) return NextResponse.json({ code: "validation_failed", message: "A completion idempotency key is required." }, { status: 400 });
  if (context.demo) return NextResponse.json({ status: "completed", persisted: false });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ code: "internal_error", message: "Session persistence is unavailable." }, { status: 503 });
  const { id } = await params;
  const { data: session } = await admin.from("sessions").select("id,user_id,status,completion_key,completed_at").eq("id", id).eq("organization_id", context.organization.id).maybeSingle();
  if (!session) return NextResponse.json({ code: "not_found", message: "Session not found." }, { status: 404 });
  if (session.user_id !== context.user.id && context.role === "rep") return NextResponse.json({ code: "unauthorized", message: "You cannot complete another representative’s session." }, { status: 403 });
  if (session.completion_key === key || session.status !== "active") return NextResponse.json({ status: session.status, completedAt: session.completed_at, duplicate: true });
  const completedAt = new Date().toISOString();
  const { data, error } = await admin.from("sessions").update({ status: "completed", completed_at: completedAt, completion_key: key }).eq("id", id).eq("organization_id", context.organization.id).eq("status", "active").select("status,completed_at").maybeSingle();
  if (error || !data) return NextResponse.json({ code: "conflict", message: "The session could not be completed because its state changed." }, { status: 409 });
  return NextResponse.json({ status: data.status, completedAt: data.completed_at, duplicate: false });
}
