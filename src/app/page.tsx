import Image from "next/image";
import Link from "next/link";

const assetNames = [
  "Customer persona",
  "Digital twin buyer",
  "Roleplay simulation",
  "Playbook update",
  "Talk track",
  "Battle card",
  "Follow-up email",
  "Manager coaching",
  "Rep scorecard",
  "Objection library",
  "Pain map",
  "Voice-of-customer brief",
  "Campaign angle",
  "Content brief",
  "Product signal",
  "Feature request",
  "Success plan",
  "Risk alert",
  "Executive brief",
  "Knowledge update",
];

const differentiators = [
  ["DNA", "Revenue DNA Score", "See whether market truth, messaging, readiness, and execution reinforce each other."],
  ["Δ", "Knowledge Drift", "Detect when approved guidance and current customer evidence stop agreeing."],
  ["GAP", "Content Gap Engine", "Prioritize repeated buyer questions with no trusted answer."],
  ["2×", "Digital twin buyers", "Practice against governed buyer patterns grounded in real evidence."],
  ["→", "Proactive advisor", "Turn system changes into ranked, permission-aware next actions."],
  ["6D", "Cross-team intelligence", "Activate one source across Sales, Marketing, Product, CS, Enablement, and Leadership."],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#07162f]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Image src="/brand/suadence-logo.webp" alt="Suadence" width={240} height={72} priority />
        <div className="flex items-center gap-3">
          <Link className="button-secondary" href="/login">Sign in</Link>
          <Link className="button" href="/app">Open Revenue OS</Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1fr_1.08fr] lg:items-center">
        <div>
          <span className="badge">The revenue intelligence operating system</span>
          <h1 className="mt-7 max-w-3xl text-6xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#071e41] md:text-7xl">
            One call in.<br />
            <span className="text-[#078eaa]">20 revenue assets out.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-xl leading-8 text-slate-600">
            Turn every consented customer conversation into connected intelligence and coordinated action across your entire revenue organization.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link className="button" href="/app">Enter the operating system →</Link>
            <a className="button-secondary" href="#platform">See how it compounds</a>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#071e41] p-3 shadow-2xl shadow-slate-900/15">
          <div className="rounded-[22px] bg-white p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-600">Intelligence pipeline</p><h2 className="mt-1">Northstar discovery call</h2></div>
              <span className="badge">Consent verified</span>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <article className="rounded-2xl bg-blue-50 p-4"><span className="text-xs text-slate-500">Input</span><strong className="mt-2 block">42:18 call</strong><p className="mt-2 text-sm text-slate-500">Gong · 4 speakers</p></article>
              <article className="rounded-2xl bg-teal-50 p-4"><span className="text-xs text-slate-500">Knowledge</span><strong className="mt-2 block">6 nodes · 8 edges</strong><p className="mt-2 text-sm text-slate-500">Evidence connected</p></article>
              <article className="rounded-2xl bg-emerald-50 p-4"><span className="text-xs text-slate-500">Activation</span><strong className="mt-2 block">20 assets ready</strong><p className="mt-2 text-sm text-slate-500">Six departments</p></article>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[["82", "Revenue DNA"], ["3", "Drift alerts"], ["92%", "Coverage"]].map(([value, label]) => <div key={label} className="rounded-xl border border-slate-200 p-4 text-center"><strong className="text-2xl text-[#071e41]">{value}</strong><span className="mt-1 block text-xs text-slate-500">{label}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-600">The revenue asset factory</p>
          <h2 className="mt-3 max-w-3xl text-4xl">Your calls already contain the strategy. Suadence makes it operational.</h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {assetNames.map((name, index) => <article key={name} className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5"><span className="text-xs font-bold text-teal-600">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-6">{name}</h3><p className="mt-2 text-sm leading-6 text-slate-500">Structured, evidence-linked, reviewable, and ready for the team that can act.</p></article>)}
          </div>
        </div>
      </section>

      <section className="bg-[#071e41] py-24 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-300">Compounding intelligence</p>
          <h2 className="mt-3 max-w-3xl text-4xl !text-white">Not a call library. A revenue cognition layer.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {differentiators.map(([mark, title, body]) => <article key={title} className="rounded-2xl border border-white/15 bg-white/[0.06] p-6"><strong className="text-3xl text-teal-300">{mark}</strong><h3 className="mt-6 !text-white">{title}</h3><p className="mt-3 leading-7 text-slate-300">{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="rounded-[30px] bg-white p-10 shadow-xl shadow-slate-900/5 md:flex md:items-end md:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-600">Pricing</p><h2 className="mt-3 text-4xl">TBD</h2><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Packaging and commercial terms are being finalized. No pricing commitment is represented on this site.</p></div>
          <Link className="button mt-8 shrink-0 md:mt-0" href="/app">Explore Revenue OS →</Link>
        </div>
      </section>
    </main>
  );
}
