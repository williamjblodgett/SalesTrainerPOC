import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";
import { scenarioSpecSchema } from "@/lib/domain/scenario";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({ title: z.string().trim().min(3).max(200), personaVersionId: z.string().uuid(), scenarioSpec: scenarioSpecSchema, source: z.enum(["manager", "ai"]).default("manager") });

export async function POST(request: Request) {
  const context = await requireAppContext();
  if (!canManage(context.role)) return NextResponse.json({ code: "unauthorized", message: "Manager access is required." }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "validation_failed", message: "Review the scenario and published persona version." }, { status: 400 });
  if (context.demo) return NextResponse.json({ scenarioId: crypto.randomUUID(), scenarioVersionId: crypto.randomUUID(), persisted: false });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ code: "internal_error", message: "Scenario persistence is unavailable." }, { status: 503 });
  const { data: personaVersion } = await admin.from("persona_versions").select("id").eq("id", parsed.data.personaVersionId).eq("organization_id", context.organization.id).maybeSingle();
  if (!personaVersion) return NextResponse.json({ code: "not_found", message: "Published persona version not found." }, { status: 404 });
  const { data: scenario, error } = await admin.from("scenarios").insert({ organization_id: context.organization.id, title: parsed.data.title, status: "draft", created_by: context.user.id }).select("id").single();
  if (error || !scenario) return NextResponse.json({ code: "internal_error", message: "The scenario could not be created." }, { status: 500 });
  const { data: version, error: versionError } = await admin.from("scenario_versions").insert({ organization_id: context.organization.id, scenario_id: scenario.id, version: 1, scenario_spec: parsed.data.scenarioSpec, persona_version_id: personaVersion.id, source: parsed.data.source }).select("id").single();
  if (versionError || !version) { await admin.from("scenarios").delete().eq("id", scenario.id); return NextResponse.json({ code: "internal_error", message: "The scenario version could not be created." }, { status: 500 }); }
  return NextResponse.json({ scenarioId: scenario.id, scenarioVersionId: version.id, status: "draft", persisted: true });
}
