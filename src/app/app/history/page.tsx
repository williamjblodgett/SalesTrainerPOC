import Link from "next/link";

import { requireAppContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function HistoryPage() {
  const context = await requireAppContext();
  const admin = createSupabaseAdminClient();
  const { data: sessions } = admin ? await admin.from("sessions").select("id,status,started_at,completed_at,scenario_versions(scenarios(title)),evaluations(weighted_score,status)").eq("organization_id", context.organization.id).eq("user_id", context.user.id).order("started_at", { ascending: false }) : { data: [] };
  return <>
    <header className="page-header"><div><span className="eyebrow">Practice history</span><h1>Your conversations.</h1><p className="page-lead">Revisit persisted transcripts, evidence, and follow-up actions.</p></div></header>
    <section className="grid gap-3">{(sessions ?? []).length ? sessions!.map((session) => {
      const version = session.scenario_versions as unknown as { scenarios?: { title?: string } } | null;
      const evaluation = Array.isArray(session.evaluations) ? session.evaluations[0] : session.evaluations as unknown as { weighted_score?: number; status?: string } | null;
      return <article className="card flex flex-wrap items-center justify-between gap-4" key={session.id}><div><span className="badge">{session.status}</span><h2 className="mt-3 font-semibold">{version?.scenarios?.title ?? "Practice session"}</h2><p className="mt-1 text-sm text-slate-500">{new Date(session.started_at).toLocaleString()} · Score {evaluation?.weighted_score ?? "pending"}</p></div><Link className="button-secondary" href={`/app/sessions/${session.id}`}>Review</Link></article>;
    }) : <div className="card"><h2 className="font-semibold">Your first completed session will appear here.</h2><p className="mt-2 text-sm text-slate-500">Start an assigned scenario to create a persistent transcript and scorecard.</p><Link href="/app/practice" className="button mt-5">Start practice</Link></div>}</section>
  </>;
}
