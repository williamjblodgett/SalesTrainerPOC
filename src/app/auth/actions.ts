"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const signupSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(2).max(80),
});

const emailSchema = z.object({ email: z.string().email() });
const newPasswordSchema = z
  .object({
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Passwords must match.",
  });

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
  redirect("/app");
}

export async function signUp(formData: FormData) {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    authError(
      "/signup",
      "Use a valid email, a name, and a password of at least eight characters.",
    );
  const supabase = await createSupabaseServerClient();
  if (!supabase)
    authError("/signup", "Authentication is not configured in this environment.");

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  });
  if (error) authError("/signup", "We could not create that account.");
  if (!data.session) {
    redirect(
      "/login?message=" +
        encodeURIComponent("Check your email to confirm your Suadence account."),
    );
  }
  redirect("/app/onboarding");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) authError("/forgot-password", "Enter a valid email address.");
  const supabase = await createSupabaseServerClient();
  if (!supabase)
    authError("/forgot-password", "Authentication is not configured in this environment.");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
  });
  redirect(
    "/login?message=" +
      encodeURIComponent("If that account exists, a secure password-reset link is on its way."),
  );
}

export async function updatePassword(formData: FormData) {
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    authError("/reset-password", "Use matching passwords of at least eight characters.");
  const supabase = await createSupabaseServerClient();
  if (!supabase)
    authError("/reset-password", "Authentication is not configured in this environment.");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) authError("/reset-password", "This reset link is invalid or has expired.");
  redirect("/app");
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
