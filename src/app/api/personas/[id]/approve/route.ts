import { NextResponse } from "next/server";

import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";
import { personaDraftSchema, projectReviewedPersona } from "@/lib/domain/persona";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAppContext();
  if (!canManage(context.role)) return NextResponse.json({ code: "unauthorized", message: "Manager access is required." }, { status: 403 });
  const supabase = await createSupabaseServerClient();
  if (!supabase || context.demo) return NextResponse.json({ status: "approved", persisted: false });
  const { id } = await params;
  const [{ data: draft }, { data: reviews }] = await Promise.all([
    supabase.from("persona_drafts").select("structured_data").eq("id", id).eq("organization_id", context.organization.id).maybeSingle(),
    supabase.from("persona_claim_reviews").select("claim_id,disposition,rationale,replacement_claim").eq("persona_draft_id", id).eq("organization_id", context.organization.id),
  ]);
  if (!draft) return NextResponse.json({ code: "not_found", message: "Persona draft not found." }, { status: 404 });
  let approved;
  try {
    approved = projectReviewedPersona(personaDraftSchema.parse(draft.structured_data), (reviews ?? []).map((review) => ({ claimId: review.claim_id, disposition: review.disposition as "accepted" | "edited" | "rejected", rationale: review.rationale ?? undefined, replacementClaim: review.replacement_claim ?? undefined })));
  } catch {
    return NextResponse.json({ code: "conflict", message: "Accept, edit, or reject every evidence claim before approval." }, { status: 409 });
  }
  const { data, error } = await supabase.from("persona_drafts").update({ status: "approved", structured_data: approved, approved_by: context.user.id, approved_at: new Date().toISOString() }).eq("id", id).eq("organization_id", context.organization.id).in("status", ["ai_generated", "in_review"]).select("id,status").maybeSingle();
  if (error) return NextResponse.json({ code: "internal_error", message: "The persona could not be approved." }, { status: 500 });
  if (!data) return NextResponse.json({ code: "not_found", message: "Persona draft not found or already finalized." }, { status: 404 });
  return NextResponse.json({ ...data, persisted: true });
}
