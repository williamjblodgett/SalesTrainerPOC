const sections = ["Identity & role", "Company context", "Goals & metrics", "Pains & consequences", "Buying process", "Objections", "Communication", "Difficulty profiles"];

export default function Page() {
  return <><p className="text-xs font-bold uppercase tracking-widest text-teal-600">Guided persona builder</p><h1 className="mt-2 text-4xl font-semibold">Create a buyer archetype</h1>
  <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]"><aside className="space-y-1">{sections.map((section, index) => <div className={`rounded-lg p-3 text-sm ${index === 0 ? "bg-teal-50 font-semibold text-teal-800" : "text-slate-500"}`} key={section}>{index + 1}. {section}</div>)}</aside>
  <form className="card max-w-3xl space-y-5"><div className="grid gap-4 md:grid-cols-2"><div><label>Persona name</label><input placeholder="Jordan Lee" /></div><div><label>Job title</label><input placeholder="VP of Sales Operations" /></div></div>
    <div className="grid gap-4 md:grid-cols-2"><div><label>Seniority</label><select><option>VP</option><option>C-suite</option><option>Director</option><option>Manager</option></select></div><div><label>Primary function</label><input placeholder="Revenue Operations" /></div></div>
    <div><label>Core responsibilities</label><textarea rows={4} placeholder="Forecast accuracy, sales process, planning cadence…" /></div>
    <div><label>Top priorities and KPIs</label><textarea rows={4} placeholder="Reliable weekly forecast, manager adoption, lower reconciliation time…" /></div>
    <div className="flex justify-between"><button className="button-secondary" type="button">Save draft</button><button className="button" type="button">Continue to company context</button></div>
  </form></div></>;
}
