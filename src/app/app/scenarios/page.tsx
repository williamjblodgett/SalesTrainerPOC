import Link from "next/link";

import { canManage, requireAppContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function ScenariosPage() {
  const context = await requireAppContext();
  const admin = createSupabaseAdminClient();
  if (!canManage(context.role)) return <p className="form-alert">Manager access is required.</p>;
  const { data: scenarios } = admin ? await admin.from("scenarios").select("id,title,status,created_at,scenario_versions(id,version,published_at,source)").eq("organization_id", context.organization.id).order("created_at", { ascending: false }) : { data: [] };
  return <>
    <header className="page-header"><div><span className="eyebrow">Scenario Studio</span><h1>Scenarios</h1><p className="page-lead">Structured buyer simulations, versioned and approved before use.</p></div><Link className="button" href="/app/scenarios/new">New scenario</Link></header>
    <section className="grid gap-4 md:grid-cols-2">{(scenarios ?? []).length ? scenarios!.map((scenario) => {
      const versions = (scenario.scenario_versions ?? []) as unknown as Array<{ id: string; version: number; published_at: string | null; source: string }>;
      const latest = [...versions].sort((a, b) => b.version - a.version)[0];
      return <article className="card" key={scenario.id}><span className="badge">{latest?.published_at ? "Published" : "Draft"}{latest?.source === "ai" ? " · AI-generated" : ""}</span><h2 className="mt-4 text-lg font-semibold">{scenario.title}</h2><p className="mt-2 text-sm text-slate-600">{latest ? `Version ${latest.version}` : "No compiled version"} · {scenario.status}</p><Link className="button-secondary mt-5" href={`/app/scenarios/${scenario.id}`}>Open studio</Link></article>;
    }) : <div className="card"><h2 className="font-semibold">Create your first scenario.</h2><p className="mt-2 text-sm text-slate-500">Compile a structured buyer, review all private fields, then publish an immutable version.</p><Link className="button mt-5" href="/app/scenarios/new">Create scenario</Link></div>}</section>
  </>;
}
