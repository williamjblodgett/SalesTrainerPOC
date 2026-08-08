import { revalidatePath } from "next/cache";

import { canManage, requireAppContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function PlaybooksPage() {
  const context = await requireAppContext();
  const admin = createSupabaseAdminClient();
  if (!admin) return <p className="form-alert">Playbook persistence is unavailable.</p>;
  async function createPlaybook(formData: FormData) {
    "use server";
    const actionContext = await requireAppContext();
    if (!canManage(actionContext.role)) return;
    const name = String(formData.get("name") ?? "").trim();
    const methodology = String(formData.get("methodology") ?? "").trim();
    if (name.length < 3 || methodology.length < 10) return;
    const actionAdmin = createSupabaseAdminClient();
    await actionAdmin?.from("playbooks").insert({ organization_id: actionContext.organization.id, name, content: { methodology, status: "draft", untrustedReferencePolicy: true } });
    revalidatePath("/app/playbooks");
  }
  const { data: playbooks } = await admin.from("playbooks").select("id,name,content,created_at").eq("organization_id", context.organization.id).order("created_at", { ascending: false });
  return <><header className="page-header"><div><span className="eyebrow">Approved selling guidance</span><h1>Playbooks</h1><p className="page-lead">Store methodology and manager-approved guidance. Uploaded content remains untrusted reference material until reviewed.</p></div></header>
    {canManage(context.role) && <form action={createPlaybook} className="panel grid gap-4"><label>Playbook name<input name="name" required minLength={3} placeholder="Discovery methodology" /></label><label>Methodology and approved guidance<textarea name="methodology" rows={7} required minLength={10} placeholder="Describe stages, required discoveries, positioning rules, and next-step standards…" /></label><button className="button w-fit" type="submit">Save playbook</button></form>}
    <section className="mt-6 grid gap-4 md:grid-cols-2">{(playbooks ?? []).length ? playbooks!.map((playbook) => <article className="card" key={playbook.id}><span className="badge">{String((playbook.content as { status?: string }).status ?? "draft")}</span><h2 className="mt-4 font-semibold">{playbook.name}</h2><p className="mt-2 line-clamp-4 text-sm text-slate-600">{String((playbook.content as { methodology?: string }).methodology ?? "")}</p></article>) : <article className="card"><h2 className="font-semibold">No playbooks yet</h2><p className="mt-2 text-sm text-slate-500">Add the selling methodology that should shape scenarios and evaluation.</p></article>}</section>
  </>;
}
