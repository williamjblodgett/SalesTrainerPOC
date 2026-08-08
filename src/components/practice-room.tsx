"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Turn = { id: string; role: "seller" | "buyer"; content: string };
type Brief = {
  title: string;
  difficulty: string;
  targetDurationMinutes: number;
  accountName: string;
  buyerName: string;
  buyerTitle: string;
  meetingContext: string;
  callObjective: string;
  knownFacts: string[];
};

export function PracticeRoom({ scenarioVersionId }: { scenarioVersionId: string }) {
  const router = useRouter();
  const demo = scenarioVersionId === "demo";
  const [sessionId, setSessionId] = useState<string | null>(demo ? "demo" : null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [stateVersion, setStateVersion] = useState(1);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(!demo);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (demo || started.current) return;
    started.current = true;
    void (async () => {
      try {
        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scenarioVersionId, sellerLevel: "new_rep" }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message ?? "The session could not be started.");
        setSessionId(body.sessionId);
        setBrief(body.practiceBrief);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The session could not be started.");
      } finally {
        setBusy(false);
      }
    })();
  }, [demo, scenarioVersionId]);

  async function send() {
    if (!message.trim() || busy || completed || !sessionId) return;
    const seller = { id: crypto.randomUUID(), role: "seller" as const, content: message.trim() };
    setTurns((current) => [...current, seller]);
    setMessage("");
    setError("");
    setBusy(true);
    try {
      const endpoint = demo ? "/api/sessions/demo/turn" : `/api/sessions/${sessionId}/turn`;
      const bodyData = demo
        ? { sessionId, message: seller.content, turns }
        : { message: seller.content, expectedStateVersion: stateVersion };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": seller.id },
        body: JSON.stringify(bodyData),
      });
      const body = await response.json();
      if (!response.ok) {
        if (body.stateVersion) setStateVersion(body.stateVersion);
        throw new Error(body.message ?? "The buyer could not respond.");
      }
      setTurns((current) => [...current, { id: body.turnId, role: "buyer", content: body.message }]);
      if (body.stateVersion) setStateVersion(body.stateVersion);
      setCompleted(body.sessionStatus === "completed" || body.sessionStatus === "buyer_ended");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The buyer could not respond.");
    } finally {
      setBusy(false);
    }
  }

  async function endCall() {
    if (!sessionId || busy) return;
    if (demo) return void router.push("/app/sessions/demo");
    setBusy(true);
    setError("");
    try {
      const completionKey = crypto.randomUUID();
      const complete = await fetch(`/api/sessions/${sessionId}/complete`, { method: "POST", headers: { "idempotency-key": completionKey } });
      const completeBody = await complete.json();
      if (!complete.ok) throw new Error(completeBody.message ?? "The call could not be completed.");
      const evaluate = await fetch(`/api/sessions/${sessionId}/evaluate`, { method: "POST", headers: { "idempotency-key": `evaluation:${sessionId}` } });
      const evaluationBody = await evaluate.json();
      if (!evaluate.ok) throw new Error(evaluationBody.message ?? "The evaluation could not be completed.");
      router.push(`/app/sessions/${sessionId}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The call could not be completed.");
      setBusy(false);
    }
  }

  const visibleBrief = brief ?? {
    title: "Northstar forecasting discovery", difficulty: "medium", targetDurationMinutes: 10,
    accountName: "Northstar Systems", buyerName: "Jordan Lee", buyerTitle: "VP of Sales Operations",
    meetingContext: "The meeting followed an outbound email.", callObjective: "Determine whether a deeper discovery meeting is justified.",
    knownFacts: ["Northstar has a distributed sales team.", "The team currently reports through its CRM."],
  };

  return <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
    <section className="card flex min-h-[650px] max-h-[calc(100dvh-7rem)] flex-col">
      <div className="border-b border-slate-200 pb-4"><p className="text-xs font-semibold text-blue-600">LIVE TEXT PRACTICE · PRIVATE BUYER STATE</p><h1 className="mt-1 text-xl font-semibold">{visibleBrief.buyerName} <span className="font-normal text-slate-500">· {visibleBrief.buyerTitle}</span></h1></div>
      <div className="flex-1 space-y-4 overflow-y-auto py-6">
        {!turns.length && !busy && <div className="max-w-[78%] rounded-2xl bg-slate-100 p-3 text-sm leading-6"><p className="mb-1 text-[10px] font-bold uppercase opacity-70">{visibleBrief.buyerName}</p>Hi, I have about {visibleBrief.targetDurationMinutes} minutes. What did you want to cover?</div>}
        {turns.map((turn) => <div key={turn.id} className={`max-w-[85%] rounded-2xl p-3 text-sm leading-6 sm:max-w-[78%] ${turn.role === "seller" ? "ml-auto bg-blue-600 text-white" : "bg-slate-100 text-slate-800"}`}><p className="mb-1 text-[10px] font-bold uppercase opacity-70">{turn.role === "seller" ? "You" : visibleBrief.buyerName}</p>{turn.content}</div>)}
        {busy && <p className="text-sm text-slate-400" role="status">{sessionId ? `${visibleBrief.buyerName} is responding…` : "Preparing the private scenario…"}</p>}
      </div>
      {error && <p className="mb-2 text-sm text-red-700" role="alert">{error}</p>}
      <div className="sticky bottom-0 flex gap-2 bg-white pt-2"><textarea aria-label="Message" rows={2} value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={completed ? "This conversation has ended." : `Reply to ${visibleBrief.buyerName}…`} disabled={completed || !sessionId}/><button className="button" onClick={() => void send()} disabled={busy || completed || !message.trim() || !sessionId}>Send</button></div>
    </section>
    <aside className="space-y-4"><div className="card"><span className="badge capitalize">{visibleBrief.difficulty}</span><h2 className="mt-4 font-semibold">Your objective</h2><p className="mt-2 text-sm leading-6 text-slate-600">{visibleBrief.callObjective}</p><h3 className="mt-5 text-sm font-semibold">Known facts</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-600">{visibleBrief.knownFacts.map((fact) => <li key={fact}>{fact}</li>)}</ul></div><button className="button-secondary w-full" onClick={() => void endCall()} disabled={busy || !sessionId}>End call and evaluate</button><Link className="block text-center text-sm text-slate-500" href="/app/practice">Leave practice</Link></aside>
  </div>;
}
