import { NextResponse } from "next/server";

import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAppContext();
  if (!canManage(context.role)) return NextResponse.json({ code: "unauthorized", message: "Manager access is required." }, { status: 403 });
  const supabase = await createSupabaseServerClient();
  if (!supabase || context.demo) return NextResponse.json({ personaId: null, status: "published", persisted: false });
  const { id } = await params;
  const { data, error } = await supabase.rpc("publish_persona_draft", { draft_id: id });
  if (error) return NextResponse.json({ code: "conflict", message: "Approve the persona draft before publishing it." }, { status: 409 });
  return NextResponse.json({ personaId: data, status: "published", persisted: true });
}
