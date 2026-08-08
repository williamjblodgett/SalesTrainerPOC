import { NextResponse } from "next/server";
import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";
import { scenarioSpecSchema } from "@/lib/domain/scenario";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAppContext();
  if (!canManage(context.role)) return NextResponse.json({ code: "unauthorized", message: "Manager access is required." }, { status: 403 });
  const key = request.headers.get("idempotency-key");
  if (!key || key.length > 200) return NextResponse.json({ code: "validation_failed", message: "A publication idempotency key is required." }, { status: 400 });
  if (context.demo) return NextResponse.json({ status: "published", persisted: false });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ code: "internal_error", message: "Scenario persistence is unavailable." }, { status: 503 });
  const { id } = await params;
  const { data: existing } = await admin.from("scenario_versions").select("id,published_at").eq("organization_id", context.organization.id).eq("idempotency_key", key).maybeSingle();
  if (existing) return NextResponse.json({ scenarioVersionId: existing.id, status: "published", publishedAt: existing.published_at, duplicate: true });
  const { data: version } = await admin.from("scenario_versions").select("id,scenario_spec,persona_version_id,published_at").eq("scenario_id", id).eq("organization_id", context.organization.id).order("version", { ascending: false }).limit(1).maybeSingle();
  if (!version) return NextResponse.json({ code: "not_found", message: "Scenario draft not found." }, { status: 404 });
  if (version.published_at) return NextResponse.json({ scenarioVersionId: version.id, status: "published", publishedAt: version.published_at, duplicate: true });
  try { scenarioSpecSchema.parse(version.scenario_spec); } catch { return NextResponse.json({ code: "validation_failed", message: "Scenario specification is invalid." }, { status: 400 }); }
  const { data: persona } = await admin.from("persona_versions").select("id").eq("id", version.persona_version_id).eq("organization_id", context.organization.id).maybeSingle();
  if (!persona) return NextResponse.json({ code: "conflict", message: "Publish and attach a governed persona version first." }, { status: 409 });
  const userClient = await createSupabaseServerClient();
  if (!userClient) return NextResponse.json({ code: "internal_error", message: "Scenario persistence is unavailable." }, { status: 503 });
  const { data: publishedId, error } = await userClient.rpc("publish_scenario_draft", { p_organization_id: context.organization.id, p_scenario_id: id, p_idempotency_key: key });
  if (error || !publishedId) return NextResponse.json({ code: "conflict", message: "The scenario changed before publication." }, { status: 409 });
  const { data } = await admin.from("scenario_versions").select("id,published_at").eq("id", publishedId).eq("organization_id", context.organization.id).maybeSingle();
  if (!data?.published_at) return NextResponse.json({ code: "conflict", message: "The scenario changed before publication." }, { status: 409 });
  return NextResponse.json({ scenarioVersionId: data.id, status: "published", publishedAt: data.published_at, duplicate: false });
}
