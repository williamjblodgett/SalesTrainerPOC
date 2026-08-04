import { NextResponse } from "next/server";

import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAppContext();
  if (!canManage(context.role)) return NextResponse.json({ code: "unauthorized", message: "Manager access is required." }, { status: 403 });
  const supabase = await createSupabaseServerClient();
  if (!supabase || context.demo) return NextResponse.json({ status: "approved", persisted: false });
  const { id } = await params;
  const { data, error } = await supabase.from("persona_drafts").update({ status: "approved", approved_by: context.user.id, approved_at: new Date().toISOString() }).eq("id", id).eq("organization_id", context.organization.id).in("status", ["ai_generated", "in_review"]).select("id,status").maybeSingle();
  if (error) return NextResponse.json({ code: "internal_error", message: "The persona could not be approved." }, { status: 500 });
  if (!data) return NextResponse.json({ code: "not_found", message: "Persona draft not found or already finalized." }, { status: 404 });
  return NextResponse.json({ ...data, persisted: true });
}
