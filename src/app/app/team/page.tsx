import { requireAppContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function TeamPage() {
  const context = await requireAppContext();
  const admin = createSupabaseAdminClient();
  if (!admin) return <p className="form-alert">Team data is unavailable.</p>;
  const [{ data: members }, { data: sessions }] = await Promise.all([
    admin.from("memberships").select("user_id,role,created_at").eq("organization_id", context.organization.id).order("created_at"),
    admin.from("sessions").select("id,user_id,status,created_at,evaluations(weighted_score)").eq("organization_id", context.organization.id).order("created_at", { ascending: false }),
  ]);
  const memberIds = (members ?? []).map((member) => member.user_id);
  const { data: profiles } = memberIds.length ? await admin.from("profiles").select("user_id,display_name").in("user_id", memberIds) : { data: [] };
  const displayNames = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.display_name]));
  const memberLabel = (userId: string) => displayNames.get(userId) ?? (userId === context.user.id ? context.user.email : null) ?? userId.slice(0, 8);
  const rows = (members ?? []).map((member) => {
    const attempts = (sessions ?? []).filter((session) => session.user_id === member.user_id);
    const scores = attempts.flatMap((session) => (session.evaluations as unknown as Array<{ weighted_score: number | null }> | null) ?? []).map((evaluation) => evaluation.weighted_score).filter((score): score is number => typeof score === "number");
    return { ...member, attempts: attempts.length, completed: attempts.filter((session) => session.status === "evaluated").length, average: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null };
  });
  return <><header className="page-header"><div><span className="eyebrow">Manager review</span><h1>Team</h1><p className="page-lead">Real practice activity and evidence scores for this organization.</p></div></header><section className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-500"><th className="p-3">Member</th><th className="p-3">Role</th><th className="p-3">Attempts</th><th className="p-3">Completed</th><th className="p-3">Average score</th></tr></thead><tbody>{rows.map((row) => <tr className="border-b border-slate-100" key={row.user_id}><td className="p-3 font-semibold">{memberLabel(row.user_id)}</td><td className="p-3"><span className="badge">{row.role}</span></td><td className="p-3">{row.attempts}</td><td className="p-3">{row.completed}</td><td className="p-3">{row.average ?? "—"}</td></tr>)}</tbody></table></section></>;
}
