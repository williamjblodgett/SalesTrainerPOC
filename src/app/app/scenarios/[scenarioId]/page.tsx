import { notFound } from "next/navigation";

import { ScenarioStudioActions } from "@/components/scenario-studio-actions";
import { requireAppContext } from "@/lib/auth/context";
import { scenarioSpecSchema } from "@/lib/domain/scenario";
import { demoScenario } from "@/lib/demo/scenario";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function ScenarioStudio({ params }: { params: Promise<{ scenarioId: string }> }) {
  const { scenarioId } = await params;
  const context = await requireAppContext();
  let scenario = demoScenario;
  let version = 1;
  let published = scenarioId === "demo";
  if (scenarioId !== "demo") {
    const admin = createSupabaseAdminClient();
    if (!admin) notFound();
    const { data } = await admin.from("scenario_versions").select("version,scenario_spec,published_at").eq("scenario_id", scenarioId).eq("organization_id", context.organization.id).order("version", { ascending: false }).limit(1).maybeSingle();
    if (!data) notFound();
    scenario = scenarioSpecSchema.parse(data.scenario_spec); version = data.version; published = Boolean(data.published_at);
  }
  return <><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-blue-600">SCENARIO STUDIO · VERSION {version}</p><h1 className="mt-2 text-3xl font-semibold">{scenario.metadata.title}</h1><p className="mt-2 text-sm text-slate-500">AI-generated fields remain review-required until a manager publishes this immutable version.</p></div>{scenarioId === "demo" ? <span className="badge">Demo fixture</span> : <ScenarioStudioActions scenarioId={scenarioId} published={published} />}</div><div className="mt-8 grid gap-5 xl:grid-cols-3"><section className="card"><span className="badge">A · Rep sees</span><h2 className="mt-4 font-semibold">Pre-call brief</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-slate-500">Account</dt><dd>{scenario.repVisible.accountName}</dd></div><div><dt className="text-slate-500">Buyer</dt><dd>{scenario.repVisible.buyerName} · {scenario.repVisible.buyerTitle}</dd></div><div><dt className="text-slate-500">Objective</dt><dd>{scenario.repVisible.callObjective}</dd></div><div><dt className="text-slate-500">Known facts</dt><dd>{scenario.repVisible.knownFacts.join(" · ")}</dd></div></dl></section><section className="card"><span className="badge">B · Buyer knows</span><h2 className="mt-4 font-semibold">Private scenario</h2><p className="mt-3 text-sm text-slate-600">{scenario.buyerHidden.companyContext}</p><h3 className="mt-5 text-sm font-semibold">Hidden pains</h3>{scenario.buyerHidden.pains.map((pain) => <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm" key={pain.id}>{pain.label} · severity {pain.severity}<p className="mt-1 text-xs text-slate-500">Reveal: {pain.revealConditions.join(" · ")}</p></div>)}<h3 className="mt-5 text-sm font-semibold">Objections</h3>{scenario.buyerHidden.objections.map((objection) => <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm" key={objection.id}>{objection.surfaceStatement}</div>)}</section><section className="card"><span className="badge">C · Scorecard</span><h2 className="mt-4 font-semibold">Weighted rubric</h2><div className="mt-3 space-y-2">{scenario.evaluatorOnly.rubric.map((rubric) => <details className="border-b border-slate-100 py-2 text-sm" key={rubric.id}><summary className="flex cursor-pointer justify-between"><span>{rubric.name}</span><strong>{rubric.weight}%</strong></summary><div className="mt-3 space-y-1 text-xs text-slate-600">{Object.entries(rubric.anchors).map(([score, anchor]) => <p key={score}><strong>{score}:</strong> {anchor}</p>)}</div></details>)}</div></section></div></>;
}
