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
  const [{ data: draft }, { count: reviewCount }] = await Promise.all([
    supabase.from("persona_drafts").select("structured_data").eq("id", id).eq("organization_id", context.organization.id).maybeSingle(),
    supabase.from("persona_claim_reviews").select("id", { count: "exact", head: true }).eq("persona_draft_id", id).eq("organization_id", context.organization.id),
  ]);
  const claimCount = Array.isArray((draft?.structured_data as { evidenceClaims?: unknown[] } | null)?.evidenceClaims) ? (draft?.structured_data as { evidenceClaims: unknown[] }).evidenceClaims.length : 0;
  if (!draft) return NextResponse.json({ code: "not_found", message: "Persona draft not found." }, { status: 404 });
  if ((reviewCount ?? 0) < claimCount) return NextResponse.json({ code: "conflict", message: "Accept or reject every evidence claim before approval." }, { status: 409 });
  const { data, error } = await supabase.from("persona_drafts").update({ status: "approved", approved_by: context.user.id, approved_at: new Date().toISOString() }).eq("id", id).eq("organization_id", context.organization.id).in("status", ["ai_generated", "in_review"]).select("id,status").maybeSingle();
  if (error) return NextResponse.json({ code: "internal_error", message: "The persona could not be approved." }, { status: 500 });
  if (!data) return NextResponse.json({ code: "not_found", message: "Persona draft not found or already finalized." }, { status: 404 });
  return NextResponse.json({ ...data, persisted: true });
}
