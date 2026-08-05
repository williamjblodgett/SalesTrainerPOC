import { NextResponse } from "next/server";
import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAppContext();
  if (!canManage(context.role)) return NextResponse.json({ code: "unauthorized", message: "Manager access is required." }, { status: 403 });
  if (context.demo) return NextResponse.json({ deleted: true, persisted: false });
  const admin = createSupabaseAdminClient();
  const userClient = await createSupabaseServerClient();
  if (!admin || !userClient) return NextResponse.json({ code: "internal_error", message: "Deletion service is unavailable." }, { status: 503 });
  const { id } = await params;
  const { data: source } = await admin.from("transcript_sources").select("id,storage_path").eq("id", id).eq("organization_id", context.organization.id).maybeSingle();
  if (!source) return NextResponse.json({ code: "not_found", message: "Transcript source not found." }, { status: 404 });
  if (source.storage_path) {
    const { error } = await admin.storage.from("transcript-originals").remove([source.storage_path]);
    if (error) return NextResponse.json({ code: "internal_error", message: "The retained original could not be deleted." }, { status: 500 });
  }
  const { error } = await userClient.rpc("delete_transcript_source_with_lineage", { p_source_id: id });
  if (error) return NextResponse.json({ code: "internal_error", message: "Derived transcript data could not be deleted." }, { status: 500 });
  return NextResponse.json({ deleted: true, persisted: true });
}
