import industryPacks from "../../../../../public/data/industry-packs.json";

import { PersonaImportForm } from "@/components/persona-import-form";

export default function Page() {
  return <><p className="text-xs font-bold uppercase tracking-widest text-teal-600">Transcript Lab</p><h1 className="mt-2 text-4xl font-semibold">Turn customer calls into buyer evidence.</h1><p className="mt-2 max-w-3xl text-slate-600">Normalize the conversation, extract claims with stable turn references, flag gaps, and propose a structured persona for manager approval.</p><div className="mt-8"><PersonaImportForm industries={industryPacks.map(({ id, name }) => ({ id, name }))} /></div></>;
}
