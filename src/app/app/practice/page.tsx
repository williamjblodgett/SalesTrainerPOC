import Link from "next/link";

import { canManage, requireAppContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ScenarioRow = {
  id: string;
  version: number;
  scenario_spec: { metadata?: { difficulty?: string; callType?: string }; repVisible?: { buyerName?: string; buyerTitle?: string; callObjective?: string } };
  scenarios: { title?: string } | null;
};

export default async function PracticePage() {
  const context = await requireAppContext();
  const admin = createSupabaseAdminClient();
  if (!admin) return <p className="form-alert">Practice persistence is unavailable.</p>;

  let allowedVersionIds: string[] | null = null;
  if (!canManage(context.role)) {
    const { data: targets } = await admin
      .from("assignment_targets")
      .select("assignments(scenario_version_id,status)")
      .eq("organization_id", context.organization.id)
      .eq("user_id", context.user.id);
    allowedVersionIds = (targets ?? [])
      .map((target) => target.assignments as unknown as { scenario_version_id?: string; status?: string } | null)
      .filter((assignment) => assignment?.status === "active" && assignment.scenario_version_id)
      .map((assignment) => assignment!.scenario_version_id!);
  }

  let query = admin
    .from("scenario_versions")
    .select("id,version,scenario_spec,scenarios(title)")
    .eq("organization_id", context.organization.id)
    .not("published_at", "is", null)
    .order("created_at", { ascending: false });
  if (allowedVersionIds) {
    if (!allowedVersionIds.length) query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
    else query = query.in("id", allowedVersionIds);
  }
  const { data } = await query;
  const scenarios = (data ?? []) as unknown as ScenarioRow[];

  return <>
    <header className="page-header"><div><span className="eyebrow">Practice room</span><h1>Choose a buyer conversation.</h1><p className="page-lead">Only published, immutable scenarios available to your role appear here.</p></div></header>
    <section className="grid gap-4 md:grid-cols-2">
      {scenarios.length ? scenarios.map((scenario) => <article className="card" key={scenario.id}>
        <span className="badge">{scenario.scenario_spec.metadata?.difficulty ?? "Practice"} · {scenario.scenario_spec.metadata?.callType ?? "Call"}</span>
        <h2 className="mt-4 text-lg font-semibold">{scenario.scenarios?.title ?? "Sales scenario"}</h2>
        <p className="mt-2 text-sm text-slate-600">{scenario.scenario_spec.repVisible?.buyerName ?? "Buyer"} · {scenario.scenario_spec.repVisible?.buyerTitle ?? "Prospect"}</p>
        <p className="mt-3 text-sm text-slate-500">{scenario.scenario_spec.repVisible?.callObjective}</p>
        <Link className="button mt-5" href={`/app/practice/${scenario.id}`}>Start practice</Link>
      </article>) : <div className="card"><h2 className="font-semibold">No practice is assigned yet.</h2><p className="mt-2 text-sm text-slate-500">Ask your manager to publish and assign a scenario.</p></div>}
    </section>
  </>;
}
