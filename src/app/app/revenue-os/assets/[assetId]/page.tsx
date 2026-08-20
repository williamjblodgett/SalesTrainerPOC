import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canManage, requireAppContext } from "@/lib/auth/context";
import { assetContentSchema } from "@/lib/revenue-os/contracts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  decision: z.enum(["approved", "changes_requested", "rejected"]),
  rationale: z.string().trim().max(2_000),
}).superRefine(({ decision, rationale }, context) => {
  if (decision !== "approved" && rationale.length < 8) {
    context.addIssue({ code: "custom", path: ["rationale"], message: "A rationale is required" });
  }
});

export default async function RevenueAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ assetId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ assetId }, { error }] = await Promise.all([params, searchParams]);
  const context = await requireAppContext();
  if (!canManage(context.role)) notFound();
  const supabase = await createSupabaseServerClient();
  if (!supabase) notFound();

  async function reviewAsset(formData: FormData) {
    "use server";
    const actionContext = await requireAppContext();
    if (!canManage(actionContext.role)) redirect("/app");
    const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) redirect(`/app/revenue-os/assets/${assetId}?error=Add+a+clear+rationale+for+changes+or+rejection.`);
    const actionSupabase = await createSupabaseServerClient();
    if (!actionSupabase) redirect(`/app/revenue-os/assets/${assetId}?error=Review+persistence+is+unavailable.`);
    const { error: reviewError } = await actionSupabase.rpc("review_revenue_asset", {
      p_organization_id: actionContext.organization.id,
      p_asset_id: assetId,
      p_decision: parsed.data.decision,
      p_rationale: parsed.data.rationale,
    });
    if (reviewError) redirect(`/app/revenue-os/assets/${assetId}?error=The+review+could+not+be+saved.`);
    revalidatePath(`/app/revenue-os/assets/${assetId}`);
    revalidatePath("/app/revenue-os");
  }

  const { data: asset } = await supabase
    .from("revenue_assets")
    .select("id,title,asset_type,department,status,evidence_coverage,current_version,call_id,updated_at")
    .eq("id", assetId)
    .eq("organization_id", context.organization.id)
    .maybeSingle();
  if (!asset) notFound();

  const [{ data: version }, { data: reviews }] = await Promise.all([
    supabase.from("revenue_asset_versions").select("id,content,model,prompt_version,created_at").eq("asset_id", asset.id).eq("organization_id", context.organization.id).order("version", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("revenue_asset_reviews").select("id,decision,rationale,reviewer_id,created_at").eq("asset_id", asset.id).eq("organization_id", context.organization.id).order("created_at", { ascending: false }),
  ]);
  const content = version ? assetContentSchema.safeParse(version.content) : null;
  const observationIds = content?.success ? content.data.evidenceObservationIds : [];
  const { data: observations } = observationIds.length
    ? await supabase.from("evidence_observations").select("id,turn_id,speaker,observation_type,claim,excerpt,confidence").in("id", observationIds).eq("organization_id", context.organization.id)
    : { data: [] };

  return <>
    <header className="page-header">
      <div><span className="eyebrow">Evidence-backed asset review</span><h1>{asset.title}</h1><p className="page-lead">{asset.department} · {Math.round(Number(asset.evidence_coverage) * 100)}% evidence coverage · <span className="badge">{asset.status}</span></p></div>
      <Link className="button-secondary" href="/app/revenue-os">Back to Revenue OS</Link>
    </header>
    {error && <div className="form-alert mb-5" role="alert">{error}</div>}
    {!content?.success ? <section className="card"><h2 className="font-semibold">Insufficient evidence</h2><p className="mt-2 text-sm text-slate-500">This asset has no reviewable version yet. Add more transcript evidence and retry ingestion.</p></section> : <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Generated draft</h2><span className="badge">AI-generated · review required</span></div>
        <p className="mt-4 leading-7 text-slate-700">{content.data.summary}</p>
        <div className="mt-6 space-y-5">{content.data.sections.map((section) => <section key={section.heading}><h3 className="font-semibold">{section.heading}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{section.content}</p></section>)}</div>
        {content.data.caveats.length > 0 && <div className="mt-6 rounded-xl bg-amber-50 p-4"><strong className="text-sm">Caveats</strong><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">{content.data.caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}</ul></div>}
        <p className="mt-5 text-xs text-slate-500">Model: {version?.model} · Prompt: {version?.prompt_version}</p>
      </section>
      <aside className="space-y-6">
        <section className="card"><h2 className="font-semibold">Source evidence</h2><div className="mt-4 space-y-3">{(observations ?? []).map((observation) => <article className="rounded-xl border border-slate-200 p-3" key={observation.id}><div className="flex justify-between gap-2"><span className="badge">{observation.observation_type}</span><span className="text-xs text-slate-400">{observation.turn_id} · {observation.speaker}</span></div><blockquote className="mt-3 text-sm leading-6 text-slate-700">“{observation.excerpt}”</blockquote><p className="mt-2 text-xs text-slate-500">{Math.round(Number(observation.confidence) * 100)}% extraction confidence</p></article>)}</div></section>
        <form action={reviewAsset} className="card grid gap-4"><h2 className="font-semibold">Manager decision</h2><label>Decision<select name="decision" defaultValue="approved"><option value="approved">Approve</option><option value="changes_requested">Request changes</option><option value="rejected">Reject</option></select></label><label>Rationale<textarea name="rationale" rows={4} placeholder="Required for changes or rejection" /></label><button className="button" type="submit">Record decision</button></form>
        {(reviews ?? []).length > 0 && <section className="card"><h2 className="font-semibold">Review history</h2><div className="mt-3 space-y-3">{reviews!.map((review) => <article className="border-t border-slate-100 pt-3 first:border-0 first:pt-0" key={review.id}><span className="badge">{review.decision}</span><p className="mt-2 text-sm text-slate-600">{review.rationale || "Approved without additional notes."}</p><time className="mt-1 block text-xs text-slate-400">{new Date(review.created_at).toLocaleString()}</time></article>)}</div></section>}
      </aside>
    </div>}
  </>;
}
