"use client";

import {
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  GraduationCap,
  History,
  Home,
  LibraryBig,
  Network,
  Settings,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { OrganizationRole } from "@/lib/auth/roles";

const groups = {
  rep: [
    {
      label: "Workspace",
      links: [
        ["Home", "/app", Home],
        ["Practice", "/app/practice", Sparkles],
        ["Assignments", "/app/assignments", ClipboardCheck],
        ["History", "/app/history", History],
      ],
    },
  ],
  manager: [
    {
      label: "Coach",
      links: [
        ["Home", "/app", Home],
        ["Coaching inbox", "/app/team", Target],
        ["Assignments", "/app/assignments", ClipboardCheck],
        ["Team readiness", "/app/analytics", BarChart3],
      ],
    },
    {
      label: "Build",
      links: [
        ["Personas", "/app/personas", Users],
        ["Revenue OS", "/app/revenue-os", Network],
        ["Industry library", "/app/industries", LibraryBig],
        ["Scenarios", "/app/scenarios", BriefcaseBusiness],
        ["Scorecards", "/app/scorecards", GraduationCap],
        ["Playbooks", "/app/playbooks", BookOpenCheck],
      ],
    },
  ],
  owner: [
    {
      label: "Coach",
      links: [
        ["Home", "/app", Home],
        ["Coaching inbox", "/app/team", Target],
        ["Assignments", "/app/assignments", ClipboardCheck],
        ["Team readiness", "/app/analytics", BarChart3],
      ],
    },
    {
      label: "Build",
      links: [
        ["Personas", "/app/personas", Users],
        ["Revenue OS", "/app/revenue-os", Network],
        ["Industry library", "/app/industries", LibraryBig],
        ["Scenarios", "/app/scenarios", BriefcaseBusiness],
        ["Scorecards", "/app/scorecards", GraduationCap],
        ["Playbooks", "/app/playbooks", BookOpenCheck],
      ],
    },
    {
      label: "Organization",
      links: [["Settings & usage", "/app/settings", Settings]],
    },
  ],
} satisfies Record<
  OrganizationRole,
  Array<{
    label: string;
    links: Array<
      readonly [
        string,
        string,
        React.ComponentType<{ size?: number; strokeWidth?: number }>,
      ]
    >;
  }>
>;

export function AppNavigation({ role }: { role: OrganizationRole }) {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label="Application">
      {groups[role].map((group) => (
        <div className="nav-group" key={group.label}>
          <p>{group.label}</p>
          {group.links.map(([label, href, Icon]) => {
            const active =
              pathname === href || (href !== "/app" && pathname.startsWith(href));
            return (
              <Link
                href={href}
                key={href}
                className={active ? "active" : undefined}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={17} strokeWidth={1.9} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
