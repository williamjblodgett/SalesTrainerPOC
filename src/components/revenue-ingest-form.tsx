"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RevenueIngestForm() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function submit(formData: FormData) {
    setBusy(true); setMessage("");
    const response = await fetch("/api/revenue-os/calls", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ title: formData.get("title"), accountName: formData.get("accountName"), transcript: formData.get("transcript"), consentStatus: formData.get("consentStatus"), consentAttested: formData.get("consentAttested") === "on" }) });
    const body = await response.json();
    setMessage(response.ok ? `${body.observationCount} observations connected and ${body.assetCount} governed assets planned.` : body.message);
    setBusy(false); if (response.ok) router.refresh();
  }
  return <form className="panel grid gap-4" action={(formData) => void submit(formData)}><div className="grid gap-4 md:grid-cols-2"><label>Call title<input name="title" required minLength={3} placeholder="Northstar discovery call" /></label><label>Account<input name="accountName" placeholder="Northstar Systems" /></label></div><label>Transcript<textarea name="transcript" rows={10} required minLength={120} placeholder={"Seller: Walk me through the current process.\nBuyer: Each region sends a different spreadsheet…"} /></label><div className="grid gap-4 md:grid-cols-2"><label>Source type<select name="consentStatus"><option value="confirmed">Authorized customer conversation</option><option value="synthetic">Synthetic demonstration</option></select></label><label className="flex grid-cols-none items-start gap-2"><input className="mt-1 w-auto" type="checkbox" name="consentAttested" required /><span>I confirm authorization to process this source or that it is entirely synthetic.</span></label></div>{message && <p className="form-alert">{message}</p>}<button className="button w-fit" disabled={busy} type="submit">{busy ? "Building governed intelligence…" : "Create evidence graph and assets"}</button></form>;
}

