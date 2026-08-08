"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PersonaOption = { versionId: string; label: string; data: Record<string, unknown> };

export function ScenarioBuilder({ personas }: { personas: PersonaOption[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "compiling" | "saving">("idle");
  const [message, setMessage] = useState("");
  const [compiled, setCompiled] = useState<Record<string, unknown> | null>(null);

  async function submit(formData: FormData) {
    if (!personas.length) return setMessage("Publish a governed persona before creating a scenario.");
    setStatus("compiling"); setMessage("");
    const personaVersionId = String(formData.get("personaVersionId"));
    const persona = personas.find((item) => item.versionId === personaVersionId);
    try {
      const compile = await fetch("/api/scenarios/compile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: formData.get("title"), difficulty: formData.get("difficulty"), callType: "discovery", product: formData.get("product"), persona: persona?.data ?? {}, pains: formData.get("pains"), objections: formData.get("objections"), methodology: formData.get("methodology") }) });
      const compilation = await compile.json();
      if (!compile.ok) throw new Error(compilation.message);
      setCompiled(compilation);
      setStatus("saving");
      const create = await fetch("/api/scenarios", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: formData.get("title"), personaVersionId, scenarioSpec: compilation.spec, source: compilation.aiGenerated ? "ai" : "manager" }) });
      const created = await create.json();
      if (!create.ok) throw new Error(created.message);
      router.push(`/app/scenarios/${created.scenarioId}`); router.refresh();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "The scenario could not be created."); setStatus("idle"); }
  }

  return <form className="card mt-8 max-w-4xl space-y-5" action={(formData) => void submit(formData)}><div className="grid gap-4 md:grid-cols-2"><label>Scenario title<input name="title" required minLength={3} /></label><label>Difficulty<select name="difficulty"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="expert">Expert</option></select></label></div><label>Published buyer persona<select name="personaVersionId" required><option value="">Choose persona</option>{personas.map((persona) => <option value={persona.versionId} key={persona.versionId}>{persona.label}</option>)}</select></label><label>Product and supported capabilities<textarea name="product" rows={4} minLength={3} required /></label><label>Manager-authored pains<textarea name="pains" rows={4} /></label><label>Objections and triggers<textarea name="objections" rows={4} /></label><label>Sales methodology and evaluation requirements<textarea name="methodology" rows={4} /></label>{compiled && <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900"><strong>Generated draft created.</strong> It remains review-required and has not been published automatically.</div>}{message && <p className="form-alert">{message}</p>}<button className="button" disabled={status !== "idle" || !personas.length} type="submit">{status === "compiling" ? "Compiling scenario…" : status === "saving" ? "Saving review draft…" : "Generate review draft"}</button></form>;
}

