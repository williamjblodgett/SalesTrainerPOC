import Link from "next/link";

import { requestPasswordReset } from "@/app/auth/actions";

export default async function ForgotPassword({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link href="/" className="auth-logo">Suadence</Link>
        <div><span className="eyebrow light">Secure account access</span><h1>Reset your password.</h1><p>We will send a time-limited link to your account email.</p></div>
      </section>
      <section className="auth-form-wrap">
        <form action={requestPasswordReset} className="auth-form">
          <div><span className="eyebrow">Account recovery</span><h2>Get a reset link</h2></div>
          {error && <div className="form-alert">{error}</div>}
          <label>Work email<input name="email" type="email" autoComplete="email" required /></label>
          <button className="button button-block" type="submit">Send reset link</button>
          <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
        </form>
      </section>
    </main>
  );
}
