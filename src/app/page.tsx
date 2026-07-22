import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6"><div className="max-w-3xl">
    <Image src="/brand/suadence-logo.webp" alt="Suadence" width={420} height={125} priority />
    <span className="badge mt-10">AI buyer practice · Evidence-backed coaching</span>
    <h1 className="mt-6 text-6xl font-semibold tracking-tight text-slate-950">Practice the conversation before it counts.</h1>
    <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600">Build realistic buyer personas from structured sales knowledge or real transcripts, then coach every rep with transparent, manager-owned scoring.</p>
    <div className="mt-9 flex gap-3"><Link className="button" href="/app">Open workspace</Link><Link className="button-secondary" href="/signup">Create account</Link></div>
  </div></main>;
}
