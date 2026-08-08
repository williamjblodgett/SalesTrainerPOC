"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ScenarioStudioActions({ scenarioId, published }: { scenarioId: string; published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function publish() {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/scenarios/${scenarioId}/publish`, { method: "POST", headers: { "idempotency-key": `publish:${scenarioId}` } });
    const body = await response.json();
    if (!response.ok) setMessage(body.message ?? "Publication failed.");
    else { setMessage("Published as an immutable scenario version."); router.refresh(); }
    setBusy(false);
  }
  return <div className="flex flex-wrap items-center gap-2">{published ? <span className="badge">Published · immutable</span> : <button className="button" disabled={busy} onClick={() => void publish()}>{busy ? "Publishing…" : "Publish"}</button>}{message && <span className="text-sm text-teal-700">{message}</span>}</div>;
}

