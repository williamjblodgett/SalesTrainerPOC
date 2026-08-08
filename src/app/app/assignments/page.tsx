import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManage, requireAppContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AssignmentsPage() {
  const context = await requireAppContext();
  const admin = createSupabaseAdminClient();
  const manager = canManage(context.role);
  if (!admin) return <p className="form-alert">Assignment persistence is unavailable.</p>;

  async function createAssignment(formData: FormData) {
    "use server";
    const actionContext = await requireAppContext();
    if (!canManage(actionContext.role)) return;
    const actionAdmin = createSupabaseAdminClient();
    if (!actionAdmin) return;
    const scenarioVersionId = String(formData.get("scenarioVersionId") ?? "");
    const userId = String(formData.get("userId") ?? "");
    const due = String(formData.get("dueAt") ?? "");
    const { data: version } = await actionAdmin.from("scenario_versions").select("id").eq("id", scenarioVersionId).eq("organization_id", actionContext.organization.id).not("published_at", "is", null).maybeSingle();
    const { data: membership } = await actionAdmin.from("memberships").select("user_id").eq("user_id", userId).eq("organization_id", actionContext.organization.id).maybeSingle();
    if (!version || !membership) redirect("/app/assignments?error=Choose+a+published+scenario+and+team+member.");
    const { data: assignment } = await actionAdmin.from("assignments").insert({ organization_id: actionContext.organization.id, scenario_version_id: version.id, created_by: actionContext.user.id, due_at: due ? new Date(due).toISOString() : null, status: "active" }).select("id").single();
    if (!assignment) redirect("/app/assignments?error=Assignment+could+not+be+created.");
    await actionAdmin.from("assignment_targets").insert({ organization_id: actionContext.organization.id, assignment_id: assignment.id, user_id: membership.user_id });
    revalidatePath("/app/assignments");
  }

  const [{ data: assignments }, { data: versions }, { data: memberships }] = await Promise.all([
    admin.from("assignments").select("id,due_at,status,created_at,scenario_versions(id,scenario_id,scenarios(title)),assignment_targets(user_id)").eq("organization_id", context.organization.id).order("created_at", { ascending: false }),
    admin.from("scenario_versions").select("id,version,scenarios(title)").eq("organization_id", context.organization.id).not("published_at", "is", null).order("created_at", { ascending: false }),
    admin.from("memberships").select("user_id,role,profiles(display_name)").eq("organization_id", context.organization.id).order("created_at"),
  ]);

  return <><header className="page-header"><div><span className="eyebrow">Practice operations</span><h1>Assignments</h1><p className="page-lead">Assign immutable scenarios to specific team members and track completion.</p></div></header>
    {manager && <form action={createAssignment} className="panel grid gap-4 md:grid-cols-4"><label>Published scenario<select name="scenarioVersionId" required><option value="">Choose scenario</option>{(versions ?? []).map((version) => <option value={version.id} key={version.id}>{(version.scenarios as unknown as { title: string } | null)?.title ?? "Scenario"} · v{version.version}</option>)}</select></label><label>Team member<select name="userId" required><option value="">Choose member</option>{(memberships ?? []).map((membership) => <option value={membership.user_id} key={membership.user_id}>{(membership.profiles as unknown as { display_name: string } | null)?.display_name ?? membership.user_id.slice(0, 8)} · {membership.role}</option>)}</select></label><label>Due date<input name="dueAt" type="datetime-local" /></label><button className="button self-end" type="submit">Create assignment</button></form>}
    <section className="mt-6 grid gap-3">{(assignments ?? []).length ? assignments!.map((assignment) => { const version = assignment.scenario_versions as unknown as { scenarios?: { title?: string } } | null; return <article className="card flex flex-wrap items-center justify-between gap-4" key={assignment.id}><div><span className="badge">{assignment.status}</span><h2 className="mt-3 font-semibold">{version?.scenarios?.title ?? "Practice scenario"}</h2><p className="mt-1 text-sm text-slate-500">Due {assignment.due_at ? new Date(assignment.due_at).toLocaleString() : "any time"} · {(assignment.assignment_targets as unknown as unknown[] | null)?.length ?? 0} target</p></div></article>; }) : <div className="card"><h2 className="font-semibold">No assignments yet</h2><p className="mt-2 text-sm text-slate-500">Publish a scenario, then assign it to a rep.</p></div>}</section>
  </>;
}
