import Link from "next/link";
import { notFound } from "next/navigation";

import { MockEvaluator } from "@/lib/ai/mock";
import { requireAppContext } from "@/lib/auth/context";
import { calculateWeightedScore, evaluationResultSchema } from "@/lib/domain/evaluation";
import { scenarioSpecSchema } from "@/lib/domain/scenario";
import { demoScenario } from "@/lib/demo/scenario";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function SessionResults({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const context = await requireAppContext();
  let scenario = demoScenario;
  let turns = [
    { id: "s1", role: "seller" as const, content: "Could you walk me through how your forecast is assembled today?" },
    { id: "b1", role: "buyer" as const, content: "Regional leaders send spreadsheets in different formats." },
    { id: "s2", role: "seller" as const, content: "What impact does that have on the weekly leadership review?" },
    { id: "b2", role: "buyer" as const, content: "The reports arrive late and leadership questions the forecast." },
  ];
  let evaluation = await new MockEvaluator().evaluate({ scenario, turns });
  let score = calculateWeightedScore(evaluation, scenario.evaluatorOnly.rubric);
  let createdAt = new Date().toISOString();
  let retryVersionId = "demo";

  if (sessionId !== "demo") {
    const admin = createSupabaseAdminClient();
    if (!admin) notFound();
    const { data: session } = await admin.from("sessions").select("id,user_id,status,scenario_version_id,started_at,completed_at").eq("id", sessionId).eq("organization_id", context.organization.id).maybeSingle();
    if (!session || (context.role === "rep" && session.user_id !== context.user.id)) notFound();
    const [{ data: version }, { data: persistedTurns }, { data: persistedEvaluation }] = await Promise.all([
      admin.from("scenario_versions").select("scenario_spec").eq("id", session.scenario_version_id).eq("organization_id", context.organization.id).maybeSingle(),
      admin.from("session_turns").select("id,role,content").eq("session_id", sessionId).eq("organization_id", context.organization.id).order("sequence"),
      admin.from("evaluations").select("result,weighted_score,created_at").eq("session_id", sessionId).eq("organization_id", context.organization.id).maybeSingle(),
    ]);
    if (!version || !persistedEvaluation) notFound();
    scenario = scenarioSpecSchema.parse(version.scenario_spec);
    retryVersionId = session.scenario_version_id;
    turns = (persistedTurns ?? []).map((turn) => ({ id: turn.id, role: turn.role as "seller" | "buyer", content: turn.content }));
    evaluation = evaluationResultSchema.parse(persistedEvaluation.result);
    score = persistedEvaluation.weighted_score ?? calculateWeightedScore(evaluation, scenario.evaluatorOnly.rubric);
    createdAt = persistedEvaluation.created_at;
  }

  return <>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-blue-600">EVIDENCE-BACKED RESULTS</p><div className="mt-2 flex items-end gap-5"><div className={score === null ? "text-3xl font-semibold" : "text-6xl font-semibold"}>{score === null ? "Not scored" : score}</div><div className="pb-2 text-slate-500">{score === null ? "Insufficient evidence" : "/ 100"} · {evaluation.callOutcome}</div></div><h1 className="mt-5 text-2xl font-semibold">{scenario.metadata.title}</h1><p className="mt-1 text-sm text-slate-500">{new Date(createdAt).toLocaleString()}</p></div><Link className="button" href={`/app/practice/${retryVersionId}`}>Retry scenario</Link></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]"><section className="space-y-3">{evaluation.criteria.map((criterion) => { const rubric = scenario.evaluatorOnly.rubric.find((item) => item.id === criterion.criterionId); if (!rubric) return null; return <article className="card" key={criterion.criterionId}><div className="flex justify-between gap-4"><div><h2 className="font-semibold">{rubric.name}</h2><p className="mt-1 text-sm text-slate-500">{rubric.description}</p></div><strong className="text-xl">{criterion.score}/4</strong></div>{criterion.evidence.map((item) => <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm" key={`${criterion.criterionId}:${item.turnId}`}><span className="font-semibold">Evidence · turn {item.turnId}</span><p className="mt-1 text-slate-600">“{item.excerpt}”</p></div>)}<p className="mt-3 text-sm text-slate-600">{criterion.rationale}</p><p className="mt-2 text-sm font-semibold text-blue-700">Next: {criterion.nextAction}</p></article>; })}</section>
      <aside className="space-y-4"><div className="card"><h2 className="font-semibold">Strengths</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">{evaluation.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="card"><h2 className="font-semibold">Priority improvements</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">{evaluation.priorityImprovements.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="card"><span className="badge">Next drill</span><h2 className="mt-3 font-semibold">{evaluation.recommendedNextDrill.skill}</h2><p className="mt-2 text-sm text-slate-600">{evaluation.recommendedNextDrill.rationale}</p></div></aside>
    </div>
    <section className="card mt-6"><h2 className="font-semibold">Annotated transcript</h2><div className="mt-4 space-y-3">{turns.map((turn) => <article className="grid gap-2 rounded-xl border border-slate-200 p-4 md:grid-cols-[100px_1fr]" id={`turn-${turn.id}`} key={turn.id}><strong className="text-xs uppercase text-slate-500">{turn.role} · {turn.id}</strong><p className="text-sm text-slate-700">{turn.content}</p></article>)}</div></section>
  </>;
}
