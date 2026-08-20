import fs from "node:fs";

import { describe, expect, it } from "vitest";

import { canPerform } from "@/lib/auth/roles";

describe("production role permissions", () => {
  it("keeps rep practice access while restricting management", () => {
    expect(canPerform("rep", "practice")).toBe(true);
    expect(canPerform("rep", "review_team")).toBe(false);
    expect(canPerform("rep", "manage_content")).toBe(false);
  });

  it("allows managers to coach but reserves organization controls for owners", () => {
    expect(canPerform("manager", "review_team")).toBe(true);
    expect(canPerform("manager", "manage_content")).toBe(true);
    expect(canPerform("manager", "manage_members")).toBe(false);
    expect(canPerform("owner", "manage_members")).toBe(true);
    expect(canPerform("owner", "manage_billing")).toBe(true);
  });
});

describe("production database foundation", () => {
  const initial = fs.readFileSync(
    "supabase/migrations/202607220001_initial.sql",
    "utf8",
  );
  const foundation = fs.readFileSync(
    "supabase/migrations/202607230001_production_foundation.sql",
    "utf8",
  );
  const hardening = fs.readFileSync(
    "supabase/migrations/202608200001_auth_and_profile_hardening.sql",
    "utf8",
  );

  it("does not reference a nonexistent organization_id on organizations", () => {
    expect(initial).not.toMatch(
      /tenant_select on public\.organizations[\s\S]*organization_id/,
    );
    expect(initial).toContain(
      "organization_member_select on public.organizations",
    );
  });

  it("creates organizations and owner membership atomically", () => {
    expect(foundation).toContain("function public.create_organization");
    expect(foundation).toContain(
      "insert into public.memberships(organization_id, user_id, role)",
    );
    expect(foundation).toContain("values (new_organization_id, auth.uid(), 'owner')");
  });

  it("enforces manager and self-service session write boundaries", () => {
    expect(foundation).toContain("manager_insert");
    expect(foundation).toContain("session_insert_self");
    expect(foundation).toContain("auth.uid() = user_id");
    expect(foundation).toContain("override_manager_insert");
  });

  it("prevents reps from selecting hidden scenario specs or peer sessions", () => {
    expect(hardening).toContain("drop policy if exists tenant_select");
    expect(hardening).toContain("manager_tenant_select");
    expect(hardening).toContain("session_owner_or_manager_select");
    expect(hardening).toContain("session_turn_owner_or_manager_select");
  });

  it("creates assignments atomically through an authorized RPC", () => {
    expect(hardening).toContain("function public.create_assignment_for_member");
    expect(hardening).toContain("manager access required");
    expect(hardening).toContain("insert into public.assignment_targets");
  });
});
