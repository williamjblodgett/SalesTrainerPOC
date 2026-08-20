import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";

import { resetRecoveredPassword } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const verified =
    cookieStore.get("suadence-recovery-intent")?.value === "verified" &&
    Boolean(data.user);
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link href="/" className="auth-logo">
          <Image src="/brand/suadence-logo.webp" alt="Suadence" width={360} height={107} priority />
        </Link>
        <div>
          <span className="eyebrow light">Verified recovery</span>
          <h1>Choose a new password.</h1>
          <p>Use at least 12 characters and keep it unique to Suadence.</p>
        </div>
      </section>
      <section className="auth-form-wrap">
        <form action={resetRecoveredPassword} className="auth-form">
          <div><span className="eyebrow">Password setup</span><h2>Create your password</h2></div>
          {error && <div className="form-alert" role="alert">{error}</div>}
          {verified ? <>
            <label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
            <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required /></label>
            <button className="button button-block" type="submit">Save password</button>
          </> : <div className="form-alert" role="alert">This recovery session is invalid or expired. Request a new one-time link.</div>}
          <p className="auth-switch"><Link href="/forgot-password">Request a new reset link</Link></p>
          <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
        </form>
      </section>
    </main>
  );
}
