export type OrganizationRole = "owner" | "manager" | "rep";

export function canManage(role: OrganizationRole) {
  return role === "owner" || role === "manager";
}

export function canOwn(role: OrganizationRole) {
  return role === "owner";
}

export function canPerform(
  role: OrganizationRole,
  action:
    | "practice"
    | "review_team"
    | "manage_content"
    | "manage_members"
    | "manage_billing",
) {
  if (action === "practice") return true;
  if (action === "manage_members" || action === "manage_billing")
    return canOwn(role);
  return canManage(role);
}
