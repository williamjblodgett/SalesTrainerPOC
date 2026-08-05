import { NextResponse } from "next/server";

import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";
import { parseTranscriptFile, TranscriptFileError } from "@/lib/transcripts/file-parser";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const context = await requireAppContext();
  if (!canManage(context.role)) return NextResponse.json({ code: "unauthorized", message: "Manager access is required." }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    const retentionMode = form.get("retentionMode");
    if (!(file instanceof File)) return NextResponse.json({ code: "validation_failed", message: "Choose a TXT, DOCX, or PDF transcript." }, { status: 400 });
    const result = await parseTranscriptFile(file);
    let storagePath: string | undefined;
    if (retentionMode === "retain_until_deleted" && !context.demo) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) throw new TranscriptFileError("Secure transcript storage is unavailable.");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
      storagePath = `${context.organization.id}/${crypto.randomUUID()}/${safeName}`;
      const { error } = await supabase.storage.from("transcript-originals").upload(storagePath, file, { contentType: result.mime, upsert: false });
      if (error) throw new TranscriptFileError("The transcript could not be retained securely.");
    }
    return NextResponse.json({ ...result, storagePath, originalFilename: file.name, originalMimeType: result.mime, originalSizeBytes: file.size });
  } catch (error) {
    if (error instanceof TranscriptFileError) return NextResponse.json({ code: "validation_failed", message: error.message }, { status: 400 });
    return NextResponse.json({ code: "internal_error", message: "The document could not be processed safely." }, { status: 500 });
  }
}
