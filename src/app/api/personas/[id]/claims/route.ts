import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  reviews: z.array(z.object({
    claimId: z.string().min(1).max(100),
    disposition: z.enum(["accepted", "edited", "rejected"]),
    rationale: z.string().max(500).optional(),
    replacementClaim: z.string().min(1).max(1_000).optional(),
  }).superRefine((review, context) => {
    if (review.disposition === "edited" && !review.replacementClaim) context.addIssue({ code: "custom", message: "Edited claims require replacement text", path: ["replacementClaim"] });
  })).min(1).max(100),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAppContext();
  if (!canManage(context.role)) return NextResponse.json({ code: "unauthorized", message: "Manager access is required." }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "validation_failed", message: "Review every persona claim." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase || context.demo) return NextResponse.json({ saved: parsed.data.reviews.length, persisted: false });
  const { id } = await params;
  const { data: draft } = await supabase.from("persona_drafts").select("structured_data,status").eq("id", id).eq("organization_id", context.organization.id).maybeSingle();
  if (!draft) return NextResponse.json({ code: "not_found", message: "Persona draft not found." }, { status: 404 });
  if (!["ai_generated", "in_review"].includes(draft.status)) return NextResponse.json({ code: "conflict", message: "Only reviewable drafts can be changed." }, { status: 409 });
  const claimIds = ((draft.structured_data as { evidenceClaims?: Array<{ id: string }> }).evidenceClaims ?? []).map((claim) => claim.id);
  const submittedIds = parsed.data.reviews.map((review) => review.claimId);
  if (new Set(submittedIds).size !== submittedIds.length || submittedIds.length !== claimIds.length || submittedIds.some((claimId) => !claimIds.includes(claimId))) {
    return NextResponse.json({ code: "validation_failed", message: "Reviews must exactly match every claim in this draft." }, { status: 400 });
  }
  const rows = parsed.data.reviews.map((review) => ({
    organization_id: context.organization.id,
    persona_draft_id: id,
    claim_id: review.claimId,
    disposition: review.disposition,
    rationale: review.rationale,
    replacement_claim: review.replacementClaim,
    reviewed_by: context.user.id,
    reviewed_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("persona_claim_reviews").upsert(rows, { onConflict: "persona_draft_id,claim_id" });
  if (error) return NextResponse.json({ code: "internal_error", message: "Claim reviews could not be saved." }, { status: 500 });
  await supabase.from("persona_drafts").update({ status: "in_review", updated_at: new Date().toISOString() }).eq("id", id).eq("organization_id", context.organization.id);
  return NextResponse.json({ saved: rows.length, persisted: true });
}
