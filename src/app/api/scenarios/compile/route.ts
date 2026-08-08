import { NextResponse } from "next/server";

import { compileScenario } from "@/lib/ai/scenario-compiler";
import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";

export async function POST(request: Request) {
  const context = await requireAppContext();
  if (!canManage(context.role)) return NextResponse.json({ code: "unauthorized", message: "Manager access is required." }, { status: 403 });
  try {
    const result = await compileScenario(await request.json());
    return NextResponse.json({ ...result, aiGenerated: result.model !== "deterministic-preview", reviewRequired: true });
  } catch (error) {
    const validation = error instanceof Error && error.name === "ZodError";
    return NextResponse.json({ code: validation ? "validation_failed" : "ai_provider_error", message: validation ? "Review the structured scenario inputs." : "The scenario could not be compiled safely." }, { status: validation ? 400 : 502 });
  }
}

