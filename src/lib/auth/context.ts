import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isCanonicalProduction } from "@/lib/supabase/config";

import type { OrganizationRole } from "./roles";
export { canManage, canOwn } from "./roles";

export type AppContext = {
  user: { id: string; email: string; displayName: string };
  organization: { id: string; name: string };
  organizations: Array<{ id: string; name: string; role: OrganizationRole }>;
  role: OrganizationRole;
  demo: boolean;
};

const demoContext: AppContext = {
  user: {
    id: "demo-manager",
    email: "alex@northstar.example",
    displayName: "Alex Morgan",
  },
  organization: { id: "demo-organization", name: "Northstar Revenue Team" },
  organizations: [
    { id: "demo-organization", name: "Northstar Revenue Team", role: "manager" },
  ],
  role: "manager",
  demo: true,
};

export async function getOptionalAppContext(): Promise<AppContext | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    if (isCanonicalProduction()) {
      throw new Error("Supabase authentication is required in production.");
    }
    return demoContext;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("memberships")
    .select("role, organizations(id, name)")
    .eq("user_id", user.id)
    .order("created_at");

  const organizations = (memberships ?? []).flatMap((membership) => {
    const organization = Array.isArray(membership.organizations)
      ? membership.organizations[0]
      : membership.organizations;
    return organization
      ? [{ ...organization, role: membership.role as OrganizationRole }]
      : [];
  });
  if (!organizations.length) {
    return {
      user: {
        id: user.id,
        email: user.email ?? "",
        displayName:
          String(user.user_metadata.display_name || "").trim() ||
          user.email?.split("@")[0] ||
          "New user",
      },
      organization: { id: "", name: "" },
      organizations: [],
      role: "owner",
      demo: false,
    };
  }

  const cookieStore = await cookies();
  const requestedOrganizationId = cookieStore.get("suadence-active-organization")?.value;
  const activeOrganization =
    organizations.find(({ id }) => id === requestedOrganizationId) ?? organizations[0];

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      displayName:
        String(user.user_metadata.display_name || "").trim() ||
        user.email?.split("@")[0] ||
        "User",
    },
    organization: { id: activeOrganization.id, name: activeOrganization.name },
    organizations,
    role: activeOrganization.role,
    demo: false,
  };
}

export async function requireAppContext(): Promise<AppContext> {
  const context = await getOptionalAppContext();
  if (!context) redirect("/login");
  if (!context.organization.id) redirect("/app/onboarding");
  return context;
}
