import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAppContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Snapshot = { version: number; data: Record<string, unknown>; publishedAt: string };

function summarizeChanges(previous: Record<string, unknown>, current: Record<string, unknown>) {
  const keys = Array.from(new Set([...Object.keys(previous), ...Object.keys(current)]));
  return keys.filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(current[key])).map((key) => ({ key, previous: previous[key], current: current[key] }));
}

export default async function PersonaVersionPage({ params }: { params: Promise<{ personaId: string }> }) {
  const { personaId } = await params;
  const context = await requireAppContext();
  const supabase = await createSupabaseServerClient();
  let versions: Snapshot[] = [];
  if (supabase && !context.demo) {
    const { data } = await supabase.from("persona_versions").select("version,structured_data,published_at").eq("persona_id", personaId).eq("organization_id", context.organization.id).order("version", { ascending: false }).limit(2);
    versions = (data ?? []).map((row) => ({ version: row.version, data: row.structured_data as Record<string, unknown>, publishedAt: row.published_at }));
  }
  if (!versions.length && context.demo) versions = [
    { version: 3, publishedAt: "2026-08-04", data: { identity: "VP Sales Operations", priorities: ["Forecast confidence", "Low administrative burden"], objections: ["We already have CRM reporting"], evidenceCoverage: 0.88 } },
    { version: 2, publishedAt: "2026-07-18", data: { identity: "Sales Operations leader", priorities: ["Forecast confidence"], objections: ["Another tool creates admin work"], evidenceCoverage: 0.76 } },
  ];
  if (!versions.length) notFound();
  const latest = versions[0];
  const previous = versions[1];
  const changes = previous ? summarizeChanges(previous.data, latest.data) : [];
  return <><Link className="text-sm text-teal-700" href="/app/personas">← Persona library</Link><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-teal-600">Immutable lineage</p><h1 className="mt-2 text-4xl font-semibold">Persona version comparison</h1><p className="mt-2 text-slate-600">See exactly what changed as new transcript evidence entered the knowledge graph.</p></div><span className="badge">v{latest.version}.0 current</span></div><section className="card mt-8"><div className="grid gap-4 md:grid-cols-2"><div><p className="text-xs font-bold uppercase text-slate-400">Current · v{latest.version}.0</p><pre className="mt-3 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(latest.data, null, 2)}</pre></div>{previous && <div><p className="text-xs font-bold uppercase text-slate-400">Previous · v{previous.version}.0</p><pre className="mt-3 overflow-auto rounded-xl bg-slate-100 p-4 text-xs text-slate-700">{JSON.stringify(previous.data, null, 2)}</pre></div>}</div></section><section className="card mt-5"><h2 className="text-lg font-semibold">Changed fields</h2><div className="mt-4 space-y-3">{changes.length ? changes.map((change) => <article className="rounded-xl border border-slate-200 p-4" key={change.key}><strong>{change.key}</strong><div className="mt-2 grid gap-2 text-sm md:grid-cols-2"><p className="rounded-lg bg-red-50 p-3"><span className="block text-xs font-bold text-red-700">BEFORE</span>{JSON.stringify(change.previous)}</p><p className="rounded-lg bg-emerald-50 p-3"><span className="block text-xs font-bold text-emerald-700">AFTER</span>{JSON.stringify(change.current)}</p></div></article>) : <p className="text-sm text-slate-500">This is the first published version.</p>}</div></section></>;
}
