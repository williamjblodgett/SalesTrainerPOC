import Image from "next/image";
import Link from "next/link";

const links = [
  ["Overview", "/app"],
  ["Personas", "/app/personas"],
  ["Transcript Lab", "/app/personas/import"],
  ["Practice", "/app/practice"],
  ["Scenarios", "/app/scenarios"],
  ["Scorecards", "/app/scorecards"],
  ["Team Coaching", "/app/team"],
  ["Analytics", "/app/analytics"],
  ["Settings", "/app/settings"],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
    <aside className="border-r border-[#183657] bg-[#071e41] p-5 text-white">
      <Link href="/app" className="block rounded-xl bg-white p-3">
        <Image src="/brand/suadence-logo.webp" alt="Suadence — Practice the conversation before it counts" width={620} height={184} priority />
      </Link>
      <p className="mt-5 px-2 text-xs text-slate-400">Northstar Revenue Team · Manager</p>
      <nav className="mt-5 grid gap-1">{links.map(([label, href]) => <Link key={href} href={href} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-[#12335e] hover:text-white">{label}</Link>)}</nav>
    </aside>
    <main className="min-w-0 p-6 lg:p-10">{children}</main>
  </div>;
}
