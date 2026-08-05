import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  reviews: z.array(z.object({
    claimId: z.string().min(1).max(100),
    disposition: z.enum(["accepted", "rejected"]),
    rationale: z.string().max(500).optional(),
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
  const rows = parsed.data.reviews.map((review) => ({
    organization_id: context.organization.id,
    persona_draft_id: id,
    claim_id: review.claimId,
    disposition: review.disposition,
    rationale: review.rationale,
    reviewed_by: context.user.id,
    reviewed_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("persona_claim_reviews").upsert(rows, { onConflict: "persona_draft_id,claim_id" });
  if (error) return NextResponse.json({ code: "internal_error", message: "Claim reviews could not be saved." }, { status: 500 });
  return NextResponse.json({ saved: rows.length, persisted: true });
}
