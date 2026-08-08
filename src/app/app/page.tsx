import { ArrowRight, CheckCircle2, Target, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

import { canManage, requireAppContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function Dashboard() {
  const context = await requireAppContext();
  const admin = createSupabaseAdminClient();
  const manager = canManage(context.role);
  const firstName = context.user.displayName.split(" ")[0];
  if (!admin) return <p className="form-alert">Workspace data is unavailable.</p>;

  if (!manager) {
    const [{ count: assigned }, { data: sessions }] = await Promise.all([
      admin.from("assignment_targets").select("id", { count: "exact", head: true }).eq("organization_id", context.organization.id).eq("user_id", context.user.id),
      admin.from("sessions").select("id,status,started_at,evaluations(weighted_score)").eq("organization_id", context.organization.id).eq("user_id", context.user.id).order("started_at", { ascending: false }).limit(5),
    ]);
    return <>
      <header className="page-header"><div><span className="eyebrow">Your readiness plan</span><h1>Ready for your next conversation, {firstName}?</h1><p className="page-lead">Your assignments and results are drawn from your private workspace.</p></div><Link className="button" href="/app/practice">Start practice <ArrowRight size={16} /></Link></header>
      <section className="metric-grid"><article className="metric-card"><div><span>Assigned drills</span><strong>{assigned ?? 0}</strong><small>Active and historical</small></div><Target size={20} /></article><article className="metric-card"><div><span>Practice attempts</span><strong>{sessions?.length ?? 0}</strong><small>Recent sessions</small></div><CheckCircle2 size={20} /></article></section>
      <section className="card mt-6"><h2 className="font-semibold">Recent practice</h2><div className="mt-4 grid gap-3">{sessions?.length ? sessions.map((session) => { const evaluation = Array.isArray(session.evaluations) ? session.evaluations[0] : session.evaluations as unknown as { weighted_score?: number } | null; return <Link className="rounded-xl border border-slate-200 p-4 hover:border-teal-400" href={`/app/sessions/${session.id}`} key={session.id}>{new Date(session.started_at).toLocaleDateString()} · {session.status} · Score {evaluation?.weighted_score ?? "pending"}</Link>; }) : <p className="text-sm text-slate-500">No sessions yet. Open Practice to begin.</p>}</div></section>
    </>;
  }

  const [{ count: sessionCount }, { data: evaluations }, { count: memberCount }, { count: assetCount }, { data: recentSessions }] = await Promise.all([
    admin.from("sessions").select("id", { count: "exact", head: true }).eq("organization_id", context.organization.id),
    admin.from("evaluations").select("weighted_score,result").eq("organization_id", context.organization.id),
    admin.from("memberships").select("id", { count: "exact", head: true }).eq("organization_id", context.organization.id),
    admin.from("revenue_assets").select("id", { count: "exact", head: true }).eq("organization_id", context.organization.id),
    admin.from("sessions").select("id,status,started_at,user_id,evaluations(weighted_score)").eq("organization_id", context.organization.id).order("started_at", { ascending: false }).limit(5),
  ]);
  const scores = (evaluations ?? []).map((row) => row.weighted_score).filter((value): value is number => typeof value === "number");
  const average = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : null;
  const improvements = new Map<string, number>();
  for (const row of evaluations ?? []) for (const item of (row.result as { priorityImprovements?: string[] }).priorityImprovements ?? []) improvements.set(item, (improvements.get(item) ?? 0) + 1);
  const coachingNeed = [...improvements.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  return <>
    <header className="page-header"><div><span className="eyebrow">Manager workspace</span><h1>Good morning, {firstName}.</h1><p className="page-lead">A live view of practice evidence and revenue intelligence for {context.organization.name}.</p></div><div className="header-actions"><Link className="button-secondary" href="/app/scenarios/new">New scenario</Link><Link className="button" href="/app/assignments">Assign practice</Link></div></header>
    <section className="metric-grid">
      {[{ label: "Practice attempts", value: sessionCount ?? 0, detail: `${scores.length} evaluated`, icon: CheckCircle2 }, { label: "Average score", value: average ?? "—", detail: scores.length ? "Weighted 0–100" : "No evaluated calls", icon: TrendingUp }, { label: "Team members", value: memberCount ?? 0, detail: "Tenant members", icon: Users }, { label: "Revenue assets", value: assetCount ?? 0, detail: "Evidence-linked outputs", icon: Target }].map(({ label, value, detail, icon: Icon }) => <article className="metric-card" key={label}><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div><div className="metric-icon"><Icon size={19} /></div></article>)}
    </section>
    <section className="dashboard-grid"><div className="card"><h2 className="font-semibold">Recent team sessions</h2><div className="mt-4 grid gap-3">{recentSessions?.length ? recentSessions.map((session) => { const evaluation = Array.isArray(session.evaluations) ? session.evaluations[0] : session.evaluations as unknown as { weighted_score?: number } | null; return <Link className="flex justify-between rounded-xl border border-slate-200 p-4 hover:border-teal-400" href={`/app/sessions/${session.id}`} key={session.id}><span>{new Date(session.started_at).toLocaleString()} · {session.status}</span><strong>{evaluation?.weighted_score ?? "—"}</strong></Link>; }) : <p className="text-sm text-slate-500">No team sessions yet.</p>}</div></div><aside className="card"><span className="eyebrow">Coaching signal</span><h2 className="mt-2 font-semibold">{coachingNeed ?? "Awaiting evidence"}</h2><p className="mt-2 text-sm text-slate-500">{coachingNeed ? "Most frequent priority improvement across completed evaluations." : "Complete calls to identify a defensible team pattern."}</p><Link className="button-secondary mt-5" href="/app/analytics">Open analytics</Link></aside></section>
  </>;
}
