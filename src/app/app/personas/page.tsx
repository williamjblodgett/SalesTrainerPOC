import Link from "next/link";

import { requireAppContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const demoPersonas = [
  { id: "jordan-demo", name: "Jordan Lee", title: "VP Sales Operations", style: "Direct · Skeptical", status: "published", sourceCount: 4, coverage: 88, version: 3 },
  { id: "priya-demo", name: "Priya Shah", title: "Chief Financial Officer", style: "Analytical · Risk-aware", status: "approved", sourceCount: 3, coverage: 81, version: 2 },
  { id: "marcus-demo", name: "Marcus Reed", title: "Director of RevOps", style: "Technical · Candid", status: "in_review", sourceCount: 2, coverage: 72, version: 1 },
];

export default async function Page() {
  const context = await requireAppContext();
  const supabase = await createSupabaseServerClient();
  let personas = demoPersonas;
  if (supabase && !context.demo) {
    const { data } = await supabase.from("persona_drafts").select("id,status,structured_data,evidence_coverage,source_count,created_at").eq("organization_id", context.organization.id).order("created_at", { ascending: false }).limit(24);
    if (data?.length) personas = data.map((row, index) => {
      const structured = row.structured_data as { identity?: { name?: string; title?: string }; behavior?: { communicationStyle?: string } };
      return { id: row.id, name: structured.identity?.name ?? "Untitled persona", title: structured.identity?.title ?? "Unknown role", style: structured.behavior?.communicationStyle ?? "Needs review", status: row.status, sourceCount: row.source_count, coverage: Math.round(Number(row.evidence_coverage) * 100), version: index + 1 };
    });
  }
  return <><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-teal-600">Persona Lab</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Build buyers worth practicing against.</h1><p className="mt-2 text-slate-600">Persisted, versioned archetypes grounded in responsibilities, pressure, buying behavior, and customer evidence.</p></div><div className="flex gap-2"><Link className="button-secondary" href="/app/personas/import">Import transcripts</Link><Link className="button" href="/app/personas/new">Create persona</Link></div></div>
    <div className="mt-8 grid gap-4 lg:grid-cols-3">{personas.map((persona) => <article className="card" key={persona.id}><div className="flex items-center justify-between"><span className="badge">{persona.status.replaceAll("_", " ")}</span><span className="text-xs text-slate-400">v{persona.version}.0</span></div><div className="mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-400 font-bold text-white">{persona.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><h2 className="mt-4 text-xl font-semibold">{persona.name}</h2><p className="text-sm text-slate-500">{persona.title}</p><div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm"><p><span className="text-slate-400">Evidence</span><br />{persona.coverage}% coverage</p><p><span className="text-slate-400">Sources</span><br />{persona.sourceCount} transcript{persona.sourceCount === 1 ? "" : "s"}</p><p className="col-span-2"><span className="text-slate-400">Style</span><br />{persona.style}</p></div><Link className="button-secondary mt-5 inline-flex" href={`/app/personas/${persona.id}`}>Review versions</Link></article>)}</div></>;
}
