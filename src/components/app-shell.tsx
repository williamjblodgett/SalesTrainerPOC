import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import { getOptionalAppContext } from "@/lib/auth/context";

import { AppNavigation } from "./app-navigation";

const mainSiteUrl =
  process.env.NEXT_PUBLIC_MAIN_SITE_URL ??
  "https://williamjblodgett.github.io/SalesTrainerPOC/";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const context = await getOptionalAppContext();
  if (!context) redirect("/login");

  // Onboarding lives under /app, but it must render before a membership exists.
  // Rendering the organization shell here would call the organization guard and
  // redirect /app/onboarding back to itself indefinitely.
  if (!context.organization.id) {
    return <main className="min-h-screen bg-slate-50 p-6 sm:p-10">{children}</main>;
  }

  const initials = context.user.displayName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="app-frame">
      <aside className="app-rail">
        <Link href="/app" className="brand-lockup">
          <Image
            src="/brand/suadence-logo.webp"
            alt="Suadence — Practice the conversation before it counts"
            width={620}
            height={184}
            priority
          />
        </Link>
        <div className="workspace-card">
          <span>Workspace</span>
          <strong>{context.organization.name}</strong>
          <small>{context.role}</small>
        </div>
        <AppNavigation role={context.role} />
        <Link href={mainSiteUrl} className="main-site-link">
          <span aria-hidden="true">←</span>
          Main site
        </Link>
        <div className="rail-account">
          <div className="account-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <strong>{context.user.displayName}</strong>
            <span>{context.demo ? "Demonstration workspace" : context.user.email}</span>
          </div>
          {context.demo ? (
            <span className="demo-chip">Demo</span>
          ) : (
            <form action={signOut}>
              <button className="text-button" type="submit">
                Sign out
              </button>
            </form>
          )}
        </div>
      </aside>
      <div className="app-surface">
        <header className="mobile-bar">
          <Link href="/app">
            <Image
              src="/brand/suadence-logo.webp"
              alt="Suadence"
              width={210}
              height={62}
            />
          </Link>
          <div className="mobile-bar-actions">
            <Link href={mainSiteUrl} className="mobile-main-site-link">
              Main site
            </Link>
            <span className="role-chip">{context.role}</span>
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
