"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const recoveryEmailSchema = z.object({ email: z.string().trim().email() });
const recoveryCookieName = "suadence-recovery-intent";

function authError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function signIn(formData: FormData) {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) authError("/login", "Enter a valid email and password.");
  const supabase = await createSupabaseServerClient();
  if (!supabase)
    authError("/login", "Authentication is not configured in this environment.");

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) authError("/login", "The email or password was not recognized.");
  const returnTo = String(formData.get("returnTo") ?? "");
  const safeReturnTo =
    returnTo.startsWith("/app") && !returnTo.startsWith("//")
      ? returnTo
      : "/app";
  redirect(safeReturnTo);
}

export async function requestPasswordReset(formData: FormData) {
  const parsed = recoveryEmailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) authError("/forgot-password", "Enter a valid work email.");
  const supabase = await createSupabaseServerClient();
  if (!supabase)
    authError("/forgot-password", "Authentication is not configured.");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectTo = new URL("/auth/confirm?next=/reset-password", appUrl);
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: redirectTo.toString(),
  });

  redirect(
    "/forgot-password?message=" +
      encodeURIComponent(
        "If that account exists, a new one-time reset link is on its way.",
      ),
  );
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/");
}

export async function switchOrganization(formData: FormData) {
  const organizationId = z.string().uuid().safeParse(formData.get("organizationId"));
  if (!organizationId.success) redirect("/app?error=Invalid+workspace.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("organization_id", organizationId.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) redirect("/app?error=You+cannot+access+that+workspace.");
  const cookieStore = await cookies();
  cookieStore.set("suadence-active-organization", organizationId.data, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  redirect("/app");
}

const changePasswordSchema = z
  .object({
    password: z.string().min(12).max(128),
    confirmPassword: z.string().min(12).max(128),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword);

export async function resetRecoveredPassword(formData: FormData) {
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    authError(
      "/reset-password",
      "Use matching passwords of at least 12 characters.",
    );

  const cookieStore = await cookies();
  const recoveryIntent = cookieStore.get(recoveryCookieName)?.value;
  const supabase = await createSupabaseServerClient();
  if (!supabase || recoveryIntent !== "verified")
    authError(
      "/forgot-password",
      "That recovery session is invalid or expired. Request a new link.",
    );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    authError(
      "/forgot-password",
      "That recovery session is invalid or expired. Request a new link.",
    );

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error)
    authError(
      "/reset-password",
      "We could not save that password. Request a new reset link and try again.",
    );

  cookieStore.delete(recoveryCookieName);
  await supabase.auth.signOut({ scope: "global" });
  redirect(
    "/login?message=" +
      encodeURIComponent("Password updated. Sign in with your new password."),
  );
}

export async function changePassword(formData: FormData) {
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    authError(
      "/app/settings",
      "Use matching passwords of at least 12 characters.",
    );
  const supabase = await createSupabaseServerClient();
  if (!supabase)
    authError("/app/settings", "Authentication is not configured.");

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error)
    authError(
      "/app/settings",
      "We could not change the password. Sign in again and retry.",
    );
  redirect(
    "/app/settings?message=" +
      encodeURIComponent("Password updated successfully."),
  );
}

const organizationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .min(2)
    .max(60),
});

export async function createOrganization(formData: FormData) {
  const parsed = organizationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    authError(
      "/app/onboarding",
      "Use a company name and a lowercase workspace URL.",
    );
  const supabase = await createSupabaseServerClient();
  if (!supabase)
    authError(
      "/app/onboarding",
      "Organization persistence is not configured in this environment.",
    );
  const { error } = await supabase.rpc("create_organization", {
    organization_name: parsed.data.name,
    organization_slug: parsed.data.slug,
  });
  if (error)
    authError(
      "/app/onboarding",
      error.code === "23505"
        ? "That workspace URL is already in use."
        : "We could not create the workspace.",
    );
  redirect("/app");
}
