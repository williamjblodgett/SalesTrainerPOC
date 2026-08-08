import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";
import { ingestRevenueCall } from "@/lib/revenue-os/engine";

const schema = z.object({ title: z.string().trim().min(3).max(200), accountName: z.string().trim().max(200), transcript: z.string().min(120).max(200_000), consentStatus: z.enum(["confirmed", "synthetic"]), consentAttested: z.literal(true) });

export async function POST(request: Request) {
  const context = await requireAppContext();
  if (!canManage(context.role)) return NextResponse.json({ code: "unauthorized", message: "Manager access is required." }, { status: 403 });
  const key = request.headers.get("idempotency-key");
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!key || key.length > 200 || !parsed.success) return NextResponse.json({ code: "validation_failed", message: "Provide a consent-attested transcript and idempotency key." }, { status: 400 });
  try { return NextResponse.json(await ingestRevenueCall({ organizationId: context.organization.id, userId: context.user.id, idempotencyKey: key, ...parsed.data })); }
  catch { return NextResponse.json({ code: "internal_error", message: "The call could not be converted into governed revenue intelligence." }, { status: 500 }); }
}

