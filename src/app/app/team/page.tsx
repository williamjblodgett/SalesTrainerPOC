import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { canOwn, requireAppContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const inviteSchema = z.object({
  email: z.string().trim().email(),
  displayName: z.string().trim().min(2).max(80),
  role: z.enum(["manager", "rep"]),
});

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const context = await requireAppContext();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <p className="form-alert">Team data is unavailable.</p>;

  async function inviteMember(formData: FormData) {
    "use server";
    const actionContext = await requireAppContext();
    if (!canOwn(actionContext.role)) redirect("/app/team?error=Owner+access+is+required.");
    const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) redirect("/app/team?error=Enter+a+valid+name,+email,+and+role.");
    const admin = createSupabaseAdminClient();
    const actionSupabase = await createSupabaseServerClient();
    if (!admin || !actionSupabase) redirect("/app/team?error=Invitations+are+not+configured.");
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/confirm?next=/reset-password`;
    const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: { display_name: parsed.data.displayName },
      redirectTo,
    });
    if (inviteError || !data.user) redirect("/app/team?error=That+user+could+not+be+invited.");
    const { error: membershipError } = await actionSupabase.from("memberships").insert({
      organization_id: actionContext.organization.id,
      user_id: data.user.id,
      role: parsed.data.role,
    });
    if (membershipError) {
      await admin.auth.admin.deleteUser(data.user.id);
      redirect("/app/team?error=The+invitation+could+not+be+assigned+to+this+workspace.");
    }
    revalidatePath("/app/team");
    redirect("/app/team?message=Invitation+sent.");
  }
  const [{ data: members }, { data: sessions }] = await Promise.all([
    supabase.from("memberships").select("user_id,role,created_at").eq("organization_id", context.organization.id).order("created_at"),
    supabase.from("sessions").select("id,user_id,status,created_at,evaluations(weighted_score)").eq("organization_id", context.organization.id).order("created_at", { ascending: false }),
  ]);
  const memberIds = (members ?? []).map((member) => member.user_id);
  const { data: profiles } = memberIds.length ? await supabase.from("profiles").select("id,display_name").in("id", memberIds) : { data: [] };
  const displayNames = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  const memberLabel = (userId: string) => displayNames.get(userId) ?? (userId === context.user.id ? context.user.email : null) ?? userId.slice(0, 8);
  const rows = (members ?? []).map((member) => {
    const attempts = (sessions ?? []).filter((session) => session.user_id === member.user_id);
    const scores = attempts.flatMap((session) => (session.evaluations as unknown as Array<{ weighted_score: number | null }> | null) ?? []).map((evaluation) => evaluation.weighted_score).filter((score): score is number => typeof score === "number");
    return { ...member, attempts: attempts.length, completed: attempts.filter((session) => session.status === "evaluated").length, average: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null };
  });
  return <><header className="page-header"><div><span className="eyebrow">Manager review</span><h1>Team</h1><p className="page-lead">Real practice activity and evidence scores for this organization.</p></div></header>
    {error && <div className="form-alert mb-5" role="alert">{error}</div>}{message && <div className="form-success mb-5" role="status">{message}</div>}
    {canOwn(context.role) && <form action={inviteMember} className="panel mb-6 grid gap-4 md:grid-cols-4"><label>Name<input name="displayName" placeholder="Jordan Lee" required /></label><label>Work email<input name="email" type="email" autoComplete="email" required /></label><label>Role<select name="role" defaultValue="rep"><option value="rep">Representative</option><option value="manager">Manager</option></select></label><button className="button self-end" type="submit">Send secure invitation</button><p className="md:col-span-4 text-xs text-slate-500">The invitation is single-use and creates access only to {context.organization.name}. ChatGPT is not involved.</p></form>}
    <section className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-500"><th className="p-3">Member</th><th className="p-3">Role</th><th className="p-3">Attempts</th><th className="p-3">Completed</th><th className="p-3">Average score</th></tr></thead><tbody>{rows.map((row) => <tr className="border-b border-slate-100" key={row.user_id}><td className="p-3 font-semibold">{memberLabel(row.user_id)}</td><td className="p-3"><span className="badge">{row.role}</span></td><td className="p-3">{row.attempts}</td><td className="p-3">{row.completed}</td><td className="p-3">{row.average ?? "—"}</td></tr>)}</tbody></table></section></>;
}
