"use client";

import { useMemo, useState } from "react";

import { assessTranscriptEvidence, type PersonaDraft } from "@/lib/domain/persona";

type IndustryOption = { id: string; name: string };
type SourceDraft = { sourceId: string; title: string; content: string; status: "empty" | "parsing" | "ready" | "error"; note?: string };
type ClaimDisposition = "accepted" | "rejected";

function emptySource(index: number): SourceDraft {
  return { sourceId: crypto.randomUUID(), title: `Discovery transcript ${index}`, content: "", status: "empty" };
}

export function PersonaImportForm({ industries }: { industries: IndustryOption[] }) {
  const [industryId, setIndustryId] = useState(industries[0]?.id ?? "b2b-saas");
  const [sources, setSources] = useState<SourceDraft[]>(() => [emptySource(1)]);
  const [consentStatus, setConsentStatus] = useState<"confirmed" | "synthetic">("confirmed");
  const [consentAttested, setConsentAttested] = useState(false);
  const [retentionMode, setRetentionMode] = useState<"redact_then_delete" | "retain_for_audit">("redact_then_delete");
  const [draft, setDraft] = useState<PersonaDraft | null>(null);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, ClaimDisposition>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [pipelineStep, setPipelineStep] = useState("1. Add evidence");
  const [message, setMessage] = useState("");

  const evidenceInput = useMemo(() => sources.filter((source) => source.content.trim()).map((source) => ({ ...source, consentStatus })), [sources, consentStatus]);
  const preflight = evidenceInput.length ? assessTranscriptEvidence(evidenceInput) : null;

  function updateSource(sourceId: string, change: Partial<SourceDraft>) {
    setSources((current) => current.map((source) => source.sourceId === sourceId ? { ...source, ...change } : source));
  }

  async function parseFile(sourceId: string, files: FileList | null) {
    if (!files?.length) return;
    updateSource(sourceId, { status: "parsing", note: "Verifying document and redacting PII…" });
    setPipelineStep("2. Verify & redact");
    const form = new FormData();
    form.set("file", files[0]);
    try {
      const response = await fetch("/api/transcripts/parse", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "File processing failed.");
      updateSource(sourceId, { title: files[0].name, content: body.text, status: "ready", note: `${body.scan.status} · ${body.redactedCount} sensitive value${body.redactedCount === 1 ? "" : "s"} redacted` });
      setPipelineStep("3. Evidence preflight");
    } catch (error) {
      updateSource(sourceId, { status: "error", note: error instanceof Error ? error.message : "File processing failed." });
    }
  }

  async function analyze() {
    if (!evidenceInput.length || evidenceInput.some((source) => source.content.trim().length < 120)) return void (setStatus("error"), setMessage("Each source needs at least 120 characters of transcript evidence."));
    if (new Set(evidenceInput.map((source) => source.title.trim().toLowerCase())).size !== evidenceInput.length) return void (setStatus("error"), setMessage("Give each transcript a distinct source title to prevent duplicate evidence."));
    if (!consentAttested) return void (setStatus("error"), setMessage("Confirm processing authority or synthetic status before analysis."));
    if (preflight?.issues.length) return void (setStatus("error"), setMessage(preflight.issues.join(" ")));
    setStatus("loading"); setPipelineStep("4. Extracting claims"); setMessage(""); setDraft(null);
    try {
      const response = await fetch("/api/personas/extract", {
        method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ industryId, retentionMode, consentAttested: true, transcripts: evidenceInput.map(({ sourceId, title, content }) => ({ sourceId, title, content, consentStatus })) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Persona analysis failed.");
      setDraft(body.draft); setPersonaId(body.personaId); setReviews({}); setStatus("idle"); setPipelineStep("5. Manager review");
    } catch (error) { setStatus("error"); setPipelineStep("3. Evidence preflight"); setMessage(error instanceof Error ? error.message : "Persona analysis failed."); }
  }

  async function transition(action: "approve" | "publish") {
    if (!draft) return;
    if (action === "approve" && Object.keys(reviews).length !== draft.evidenceClaims.length) return void setMessage("Accept or reject every extracted claim before approval.");
    if (personaId && action === "approve") {
      const reviewResponse = await fetch(`/api/personas/${personaId}/claims`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reviews: draft.evidenceClaims.map((claim) => ({ claimId: claim.id, disposition: reviews[claim.id] })) }) });
      if (!reviewResponse.ok) return void setMessage((await reviewResponse.json()).message || "Claim reviews could not be saved.");
    }
    if (!personaId) {
      setDraft((current) => current ? { ...current, status: action === "approve" ? "approved" : "published" } : current);
      setMessage(`${action === "approve" ? "Approval" : "Publication"} simulated in credential-free demo mode.`); return;
    }
    const response = await fetch(`/api/personas/${personaId}/${action}`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) return void setMessage(body.message || `Could not ${action} persona.`);
    setDraft((current) => current ? { ...current, status: body.status } : current);
    setMessage(action === "approve" ? "Persona approved. It can now be published as an immutable version." : "Persona published and ready for scenario compilation.");
  }

  if (draft) return <div className="space-y-5">
    <div className="flex flex-wrap gap-2" aria-label="Persona pipeline progress">{["Evidence added", "Privacy checked", "Claims extracted", "Manager review"].map((step, index) => <span className={`badge ${index < 4 ? "text-teal-700" : ""}`} key={step}>{index + 1}. {step}</span>)}</div>
    <section className="card"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="badge">AI-generated · review required</span><h2 className="mt-4 text-2xl font-semibold">{draft.identity.name}</h2><p className="mt-1 text-sm text-slate-500">{draft.identity.title} · {draft.identity.industry}</p></div><div className="text-right"><strong className="text-3xl text-teal-700">{Math.round(draft.evidenceCoverage * 100)}%</strong><p className="text-xs text-slate-500">evidence coverage</p></div></div>
      <p className="mt-5 rounded-xl bg-sky-50 p-4 text-sm text-sky-900"><strong>How confidence works:</strong> coverage reflects supported persona fields; claim confidence reflects evidence clarity and source diversity. Inferred and unknown fields stay visibly separate from observed facts.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">{draft.fieldEvidence.map((field) => <article className="rounded-xl border border-slate-200 p-3" key={field.path}><span className="badge">{field.support}</span><strong className="mt-2 block text-sm">{field.path}</strong><p className="mt-1 text-xs text-slate-500">{field.explanation}</p></article>)}</div>
      {draft.conflicts.length > 0 && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><strong>Conflicting evidence requires review</strong>{draft.conflicts.map((conflict) => <p className="mt-2 text-sm" key={conflict.field}>{conflict.description} Sources: {conflict.sourceIds.join(", ")}</p>)}</div>}
    </section>
    <section className="card"><div className="flex justify-between gap-3"><div><h2 className="text-lg font-semibold">Review every evidence claim</h2><p className="text-sm text-slate-500">{Object.keys(reviews).length} of {draft.evidenceClaims.length} reviewed</p></div><span className="badge">{evidenceInput.length} source{evidenceInput.length === 1 ? "" : "s"}</span></div><div className="mt-4 grid gap-3">{draft.evidenceClaims.map((claim) => <article className="rounded-xl border border-slate-200 p-4" key={claim.id}><div className="flex flex-wrap justify-between gap-3"><strong className="text-sm capitalize">{claim.claimType.replaceAll("_", " ")}</strong><span className="badge">{Math.round(claim.confidence * 100)}% · {claim.sourceId.slice(0, 8)} · {claim.turnId}</span></div><p className="mt-2 text-sm">{claim.claim}</p><blockquote className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">“{claim.excerpt}”</blockquote><div className="mt-3 flex gap-2"><button className={reviews[claim.id] === "accepted" ? "button" : "button-secondary"} onClick={() => setReviews((current) => ({ ...current, [claim.id]: "accepted" }))}>Accept</button><button className={reviews[claim.id] === "rejected" ? "button" : "button-secondary"} onClick={() => setReviews((current) => ({ ...current, [claim.id]: "rejected" }))}>Reject</button></div></article>)}</div></section>
    <div className="flex flex-wrap gap-2"><button className="button-secondary" onClick={() => setDraft(null)}>Back to evidence</button>{draft.status === "ai_generated" || draft.status === "in_review" ? <button className="button" onClick={() => void transition("approve")}>Approve reviewed draft</button> : draft.status === "approved" ? <button className="button" onClick={() => void transition("publish")}>Publish immutable persona</button> : <span className="badge">Published</span>}</div>{message && <p aria-live="polite" className="text-sm text-teal-700">{message}</p>}
  </div>;

  return <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
    <form className="card space-y-5" onSubmit={(event) => { event.preventDefault(); void analyze(); }}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><span className="badge">{pipelineStep}</span><h2 className="mt-2 text-lg font-semibold">Multi-call persona evidence</h2></div><button className="button-secondary" type="button" onClick={() => setSources((current) => [...current, emptySource(current.length + 1)])}>Add another source</button></div>
      <label>Industry<select value={industryId} onChange={(event) => setIndustryId(event.target.value)}>{industries.map((industry) => <option key={industry.id} value={industry.id}>{industry.name}</option>)}</select></label>
      {sources.map((source, index) => <fieldset className="rounded-xl border border-slate-200 p-4" key={source.sourceId}><legend className="px-2 text-sm font-semibold">Source {index + 1}</legend><div className="space-y-4"><label>Source title<input value={source.title} maxLength={200} onChange={(event) => updateSource(source.sourceId, { title: event.target.value })} /></label><div className="rounded-xl border-2 border-dashed border-slate-200 p-5 text-center"><p className="font-semibold">TXT, DOCX, or PDF · up to 20 MB</p><input className="mt-3" type="file" accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => void parseFile(source.sourceId, event.target.files)} /></div><label>Transcript evidence<textarea rows={9} value={source.content} onChange={(event) => updateSource(source.sourceId, { content: event.target.value, status: event.target.value ? "ready" : "empty" })} placeholder={"Seller: How is the process handled today?\nBuyer: Each region sends a spreadsheet…"} /></label>{source.note && <p className={`text-xs ${source.status === "error" ? "text-red-700" : "text-teal-700"}`} role={source.status === "error" ? "alert" : undefined}>{source.note}</p>}{sources.length > 1 && <button className="button-secondary" type="button" onClick={() => setSources((current) => current.filter((item) => item.sourceId !== source.sourceId))}>Remove source</button>}</div></fieldset>)}
      {preflight && <div aria-live="polite" className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4"><div><strong className="block text-lg">{evidenceInput.length}</strong><span className="text-xs text-slate-500">sources</span></div><div><strong className="block text-lg">{preflight.usableBuyerTurns.length}</strong><span className="text-xs text-slate-500">buyer turns</span></div><div><strong className="block text-lg">{preflight.turns.length}</strong><span className="text-xs text-slate-500">total turns</span></div><div><strong className={`block text-lg ${preflight.injectionTurnIds.length ? "text-amber-700" : "text-emerald-700"}`}>{preflight.injectionTurnIds.length}</strong><span className="text-xs text-slate-500">quarantined instructions</span></div>{preflight.issues.length > 0 && <p className="sm:col-span-4 text-xs text-amber-700">{preflight.issues.join(" ")}</p>}</div>}
      {status === "error" && <p className="form-alert" role="alert">{message}</p>}<button className="button" disabled={status === "loading"} type="submit">{status === "loading" ? "Extracting governed claims…" : "Create persona draft →"}</button>
    </form>
    <aside className="card h-fit"><span className="badge">Privacy controls</span><h2 className="mt-4 font-semibold">Source authority</h2><label className="mt-4">Transcript type<select value={consentStatus} onChange={(event) => { setConsentStatus(event.target.value as "confirmed" | "synthetic"); setConsentAttested(false); }}><option value="confirmed">Processing authority confirmed</option><option value="synthetic">Synthetic training data</option></select></label><label className="mt-4 flex grid-cols-none items-start gap-2"><input className="mt-1 w-auto" type="checkbox" checked={consentAttested} onChange={(event) => setConsentAttested(event.target.checked)} /><span>{consentStatus === "synthetic" ? "I confirm every source contains only synthetic training data." : "I confirm my organization is authorized to process every source."}</span></label><h2 className="mt-7 font-semibold">Retention</h2><label className="mt-4 flex grid-cols-none items-start gap-2"><input className="mt-1 w-auto" type="radio" checked={retentionMode === "redact_then_delete"} onChange={() => setRetentionMode("redact_then_delete")} /><span>Redact, then delete original</span></label><label className="mt-3 flex grid-cols-none items-start gap-2"><input className="mt-1 w-auto" type="radio" checked={retentionMode === "retain_for_audit"} onChange={() => setRetentionMode("retain_for_audit")} /><span>Retain securely for audit</span></label><p className="mt-5 text-xs leading-5 text-slate-500">Uploaded originals are never sent directly to the model. Extracted text is scanned and redacted first. Production storage uses tenant-scoped signed URLs.</p></aside>
  </div>;
}
