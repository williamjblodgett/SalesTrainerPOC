import Link from "next/link";

import { updatePassword } from "@/app/auth/actions";

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link href="/" className="auth-logo">Suadence</Link>
        <div><span className="eyebrow light">Secure account access</span><h1>Choose a new password.</h1><p>Use at least eight characters and keep it unique to Suadence.</p></div>
      </section>
      <section className="auth-form-wrap">
        <form action={updatePassword} className="auth-form">
          <div><span className="eyebrow">Password setup</span><h2>Create your password</h2></div>
          {error && <div className="form-alert">{error}</div>}
          <label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
          <button className="button button-block" type="submit">Save password</button>
          <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
        </form>
      </section>
    </main>
  );
}
