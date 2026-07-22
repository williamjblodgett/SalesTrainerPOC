import Link from "next/link";

const personas = [
  ["Jordan Lee", "VP Sales Operations", "Direct · Skeptical", "Core", "Transcript-backed"],
  ["Priya Shah", "Chief Financial Officer", "Analytical · Risk-aware", "Executive", "Manager-built"],
  ["Marcus Reed", "Director of RevOps", "Technical · Candid", "Advanced", "Transcript-backed"],
];

export default function Page() {
  return <><div className="flex flex-wrap items-end justify-between gap-4"><div>
    <p className="text-xs font-bold uppercase tracking-widest text-teal-600">Persona Lab</p>
    <h1 className="mt-2 text-4xl font-semibold tracking-tight">Build buyers worth practicing against.</h1>
    <p className="mt-2 text-slate-600">Reusable archetypes grounded in responsibilities, pressure, buying behavior, and real customer evidence.</p>
  </div><div className="flex gap-2"><Link className="button-secondary" href="/app/personas/import">Import transcripts</Link><Link className="button" href="/app/personas/new">Create persona</Link></div></div>
  <div className="mt-8 grid gap-4 lg:grid-cols-3">{personas.map(([name, title, style, level, source], index) => <article className="card" key={name}>
    <div className="flex items-center justify-between"><span className="badge">{source}</span><span className="text-xs text-slate-400">v{index + 1}.0</span></div>
    <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-400 font-bold text-white">{name.split(" ").map((part) => part[0]).join("")}</div>
    <h2 className="mt-4 text-xl font-semibold">{name}</h2><p className="text-sm text-slate-500">{title}</p>
    <div className="mt-5 border-t border-slate-100 pt-4 text-sm"><p><span className="text-slate-400">Style</span><br />{style}</p><p className="mt-3"><span className="text-slate-400">Highest level</span><br />{level}</p></div>
  </article>)}</div></>;
}
