import { ScenarioBuilder } from "@/components/scenario-builder";
import { requireAppContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function NewScenarioPage() {
  const context = await requireAppContext();
  const admin = createSupabaseAdminClient();
  const { data } = admin ? await admin.from("persona_versions").select("id,version,structured_data").eq("organization_id", context.organization.id).order("created_at", { ascending: false }) : { data: [] };
  const personas = (data ?? []).map((version) => ({ versionId: version.id, label: `${String((version.structured_data as { identity?: { name?: string; title?: string } }).identity?.name ?? "Buyer")} · ${String((version.structured_data as { identity?: { title?: string } }).identity?.title ?? "Unknown role")} · v${version.version}`, data: version.structured_data as Record<string, unknown> }));
  return <><h1 className="text-3xl font-semibold">Create discovery scenario</h1><p className="mt-2 text-slate-600">Configure sales concepts; Suadence compiles the private buyer policy and scorecard.</p><ScenarioBuilder personas={personas} /></>;
}
