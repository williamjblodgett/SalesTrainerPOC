import Image from "next/image";
import Link from "next/link";

import { requestPasswordReset } from "@/app/auth/actions";

export default async function ForgotPassword({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link href="/" className="auth-logo">
          <Image src="/brand/suadence-logo.webp" alt="Suadence" width={360} height={107} priority />
        </Link>
        <div>
          <span className="eyebrow light">Secure account access</span>
          <h1>Reset your password.</h1>
          <p>We will send a single-use link. It can be opened securely on your phone or computer.</p>
        </div>
      </section>
      <section className="auth-form-wrap">
        <form action={requestPasswordReset} className="auth-form">
          <div><span className="eyebrow">Account recovery</span><h2>Get a reset link</h2></div>
          {error && <div className="form-alert" role="alert">{error}</div>}
          {message && <div className="form-success" role="status">{message}</div>}
          <label>Work email<input name="email" type="email" autoComplete="email" required /></label>
          <button className="button button-block" type="submit">Send reset link</button>
          <p className="privacy-note">For privacy, we show the same confirmation whether or not an account exists.</p>
          <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
        </form>
      </section>
    </main>
  );
}
