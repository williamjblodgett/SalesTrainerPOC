import { requireAppContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AnalyticsPage() {
  const context = await requireAppContext();
  const admin = createSupabaseAdminClient();
  if (!admin) return <p className="form-alert">Analytics are unavailable.</p>;
  const [{ data: evaluations }, { count: sessionCount }, { count: memberCount }] = await Promise.all([
    admin.from("evaluations").select("weighted_score,result,created_at").eq("organization_id", context.organization.id).order("created_at"),
    admin.from("sessions").select("id", { count: "exact", head: true }).eq("organization_id", context.organization.id),
    admin.from("memberships").select("id", { count: "exact", head: true }).eq("organization_id", context.organization.id),
  ]);
  const scores = (evaluations ?? []).map((evaluation) => evaluation.weighted_score).filter((score): score is number => typeof score === "number");
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
  const improvementCounts = new Map<string, number>();
  for (const evaluation of evaluations ?? []) for (const item of ((evaluation.result as { priorityImprovements?: string[] }).priorityImprovements ?? [])) improvementCounts.set(item, (improvementCounts.get(item) ?? 0) + 1);
  const weakest = [...improvementCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  return <><header className="page-header"><div><span className="eyebrow">Evidence trends</span><h1>Analytics</h1><p className="page-lead">Metrics derive from completed sessions in this organization; empty states never invent performance.</p></div></header><section className="metric-grid"><article className="metric-card"><div><span>Practice attempts</span><strong>{sessionCount ?? 0}</strong><small>{memberCount ?? 0} team members</small></div></article><article className="metric-card"><div><span>Evaluated calls</span><strong>{scores.length}</strong><small>Evidence-backed results</small></div></article><article className="metric-card"><div><span>Average score</span><strong>{average ?? "—"}</strong><small>{scores.length ? "0–100 weighted" : "Insufficient evidence"}</small></div></article><article className="metric-card"><div><span>Top coaching need</span><strong className="text-lg">{weakest?.[0] ?? "—"}</strong><small>{weakest ? `${weakest[1]} evaluations` : "No completed evaluations"}</small></div></article></section><section className="card mt-6"><h2 className="font-semibold">Score history</h2><div className="mt-5 flex min-h-44 items-end gap-2">{scores.length ? scores.map((score, index) => <div className="flex flex-1 flex-col items-center gap-2" key={`${score}:${index}`}><span className="text-xs font-semibold">{score}</span><div className="w-full rounded-t bg-teal-500" style={{ height: `${Math.max(6, score)}px` }} /></div>) : <p className="text-sm text-slate-500">Complete evaluated sessions to build the team trend.</p>}</div></section></>;
}
