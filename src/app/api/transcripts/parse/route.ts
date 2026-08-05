import { NextResponse } from "next/server";

import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";
import { parseTranscriptFile, TranscriptFileError } from "@/lib/transcripts/file-parser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const context = await requireAppContext();
  if (!canManage(context.role)) return NextResponse.json({ code: "unauthorized", message: "Manager access is required." }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ code: "validation_failed", message: "Choose a TXT, DOCX, or PDF transcript." }, { status: 400 });
    const result = await parseTranscriptFile(file);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TranscriptFileError) return NextResponse.json({ code: "validation_failed", message: error.message }, { status: 400 });
    return NextResponse.json({ code: "internal_error", message: "The document could not be processed safely." }, { status: 500 });
  }
}
