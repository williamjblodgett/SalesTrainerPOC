"use client";

import { useState } from "react";

import { assessTranscriptEvidence, type PersonaDraft } from "@/lib/domain/persona";

type IndustryOption = { id: string; name: string };

export function PersonaImportForm({ industries }: { industries: IndustryOption[] }) {
  const [industryId, setIndustryId] = useState(industries[0]?.id ?? "b2b-saas");
  const [sourceTitle, setSourceTitle] = useState("Discovery transcript");
  const [transcript, setTranscript] = useState("");
  const [consentStatus, setConsentStatus] = useState<"confirmed" | "synthetic">("confirmed");
  const [consentAttested, setConsentAttested] = useState(false);
  const [retentionMode, setRetentionMode] = useState<"redact_then_delete" | "retain_for_audit">("redact_then_delete");
  const [draft, setDraft] = useState<PersonaDraft | null>(null);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function analyze() {
    if (transcript.trim().length < 120) {
      setStatus("error");
      setMessage("Add at least 120 characters of consent-confirmed or synthetic transcript evidence.");
      return;
    }
    if (!consentAttested) {
      setStatus("error");
      setMessage("Confirm that you are authorized to process this transcript or that it is synthetic.");
      return;
    }
    setStatus("loading"); setMessage(""); setDraft(null);
    try {
      const response = await fetch("/api/personas/extract", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({
          industryId,
          retentionMode,
          consentAttested: true,
          transcripts: [{ sourceId: crypto.randomUUID(), title: sourceTitle, content: transcript, consentStatus }],
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Persona analysis failed.");
      setDraft(body.draft); setPersonaId(body.personaId); setStatus("idle");
    } catch (error) {
      setStatus("error"); setMessage(error instanceof Error ? error.message : "Persona analysis failed.");
    }
  }

  async function readFiles(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    if (file.size > 20 * 1024 * 1024) { setStatus("error"); setMessage("The selected file exceeds 20 MB."); return; }
    if (!file.name.toLowerCase().endsWith(".txt")) { setStatus("error"); setMessage("Direct browser import currently supports TXT only."); return; }
    setTranscript(await file.text()); setStatus("idle"); setMessage("");
  }

  async function transition(action: "approve" | "publish") {
    if (!personaId) {
      setDraft((current) => current ? { ...current, status: action === "approve" ? "approved" : "published" } : current);
      setMessage(`${action === "approve" ? "Approval" : "Publication"} simulated in credential-free demo mode.`);
      return;
    }
    const response = await fetch(`/api/personas/${personaId}/${action}`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) { setMessage(body.message || `Could not ${action} persona.`); return; }
    setDraft((current) => current ? { ...current, status: body.status } : current);
    setMessage(action === "approve" ? "Persona approved. It can now be published as an immutable version." : "Persona published and ready for scenario compilation.");
  }

  if (draft) return <div className="space-y-5">
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><span className="badge">AI-generated · review required</span><h2 className="mt-4 text-2xl font-semibold">{draft.identity.name}</h2><p className="mt-1 text-sm text-slate-500">{draft.identity.title} · {draft.identity.industry}</p></div><div className="text-right"><strong className="text-3xl text-teal-700">{Math.round(draft.evidenceCoverage * 100)}%</strong><p className="text-xs text-slate-500">evidence coverage</p></div></div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">{[
        ["Responsibilities", draft.responsibilities], ["Priorities", draft.priorities], ["KPIs", draft.kpis],
        ["Communication", [draft.behavior.communicationStyle]], ["Missing information", draft.missingInformation], ["Assumptions", draft.assumptions],
      ].map(([label, values]) => <article className="rounded-xl border border-slate-200 p-4" key={label as string}><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label as string}</p><ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-slate-700">{(values as string[]).map((value) => <li key={value}>{value}</li>)}</ul></article>)}</div>
    </section>
    <section className="card"><h2 className="text-lg font-semibold">Transcript evidence</h2><div className="mt-4 grid gap-3">{draft.evidenceClaims.map((claim) => <article className="rounded-xl border border-slate-200 p-4" key={`${claim.sourceId}-${claim.turnId}-${claim.claimType}`}><div className="flex justify-between gap-3"><strong className="text-sm capitalize">{claim.claimType.replaceAll("_", " ")}</strong><span className="badge">{Math.round(claim.confidence * 100)}% · {claim.turnId}</span></div><p className="mt-2 text-sm">{claim.claim}</p><blockquote className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">“{claim.excerpt}”</blockquote></article>)}</div></section>
    <div className="flex gap-2"><button className="button-secondary" onClick={() => setDraft(null)}>Back to evidence</button>{draft.status === "ai_generated" || draft.status === "in_review" ? <button className="button" onClick={() => void transition("approve")}>Approve draft</button> : draft.status === "approved" ? <button className="button" onClick={() => void transition("publish")}>Publish immutable persona</button> : <span className="badge">Published</span>}</div>{message && <p aria-live="polite" className="text-sm text-teal-700">{message}</p>}
  </div>;

  const preflight = transcript.trim() ? assessTranscriptEvidence([{ sourceId: "preflight", title: sourceTitle, content: transcript, consentStatus }]) : null;

  return <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
    <form className="card space-y-5" onSubmit={(event) => { event.preventDefault(); void analyze(); }}>
      <label>Industry<select value={industryId} onChange={(event) => setIndustryId(event.target.value)}>{industries.map((industry) => <option key={industry.id} value={industry.id}>{industry.name}</option>)}</select></label>
      <label>Source title<input value={sourceTitle} maxLength={200} onChange={(event) => setSourceTitle(event.target.value)} /></label>
      <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center"><p className="font-semibold">Add a transcript</p><p className="mt-1 text-sm text-slate-500">TXT up to 20 MB · additional formats are coming next</p><input className="mt-4" type="file" accept=".txt,text/plain" onChange={(event) => void readFiles(event.target.files)} /></div>
      <label>Or paste transcript evidence<textarea rows={12} value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder={"Seller: How is the process handled today?\nBuyer: Each region sends a spreadsheet…"} /></label>
      {preflight && <div aria-live="polite" className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3"><div><strong className="block text-lg text-slate-900">{preflight.usableBuyerTurns.length}</strong><span className="text-xs text-slate-500">usable buyer turns</span></div><div><strong className="block text-lg text-slate-900">{preflight.turns.length}</strong><span className="text-xs text-slate-500">total turns</span></div><div><strong className={`block text-lg ${preflight.injectionTurnIds.length ? "text-amber-700" : "text-emerald-700"}`}>{preflight.injectionTurnIds.length}</strong><span className="text-xs text-slate-500">quarantined instructions</span></div>{preflight.issues.length > 0 && <p className="sm:col-span-3 text-xs text-amber-700">{preflight.issues.join(" ")}</p>}</div>}
      {status === "error" && <p className="form-alert" role="alert">{message}</p>}
      <button className="button" disabled={status === "loading"} type="submit">{status === "loading" ? "Analyzing evidence…" : "Create persona draft →"}</button>
    </form>
    <aside className="card h-fit"><span className="badge">Privacy controls</span><h2 className="mt-4 font-semibold">Source authority</h2><label className="mt-4">Transcript type<select value={consentStatus} onChange={(event) => { setConsentStatus(event.target.value as "confirmed" | "synthetic"); setConsentAttested(false); }}><option value="confirmed">Consent or processing authority confirmed</option><option value="synthetic">Synthetic training data</option></select></label><label className="mt-4 flex grid-cols-none items-start gap-2"><input className="mt-1 w-auto" type="checkbox" checked={consentAttested} onChange={(event) => setConsentAttested(event.target.checked)} /><span>{consentStatus === "synthetic" ? "I confirm this transcript contains only synthetic training data." : "I confirm my organization is authorized to process this transcript for training and persona analysis."}</span></label><h2 className="mt-7 font-semibold">Manager-controlled retention</h2><label className="mt-4 flex grid-cols-none items-start gap-2"><input className="mt-1 w-auto" type="radio" checked={retentionMode === "redact_then_delete"} onChange={() => setRetentionMode("redact_then_delete")} /><span>Redact, then delete original</span></label><label className="mt-3 flex grid-cols-none items-start gap-2"><input className="mt-1 w-auto" type="radio" checked={retentionMode === "retain_for_audit"} onChange={() => setRetentionMode("retain_for_audit")} /><span>Retain securely for audit</span></label><p className="mt-5 text-xs leading-5 text-slate-500">Every claim must match a stable transcript turn. Nothing publishes without human review.</p></aside>
  </div>;
}
