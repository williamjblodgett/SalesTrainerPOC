import Image from "next/image";
import Link from "next/link";

import { signIn } from "@/app/auth/actions";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; returnTo?: string }>;
}) {
  const { error, message, returnTo } = await searchParams;
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link href="/" className="auth-logo">
          <Image
            src="/brand/suadence-logo.webp"
            alt="Suadence"
            width={360}
            height={107}
            priority
          />
        </Link>
        <div>
          <span className="eyebrow light">Sales readiness workspace</span>
          <h1>Practice the conversation before it counts.</h1>
          <p>
            Give every rep a realistic buyer, every manager transcript evidence,
            and every team a clear path to readiness.
          </p>
        </div>
        <p className="auth-footnote">
          Private by design · Evidence-backed coaching · No live-call scoring
        </p>
      </section>
      <section className="auth-form-wrap">
        <form action={signIn} className="auth-form">
          <input type="hidden" name="returnTo" value={returnTo ?? "/app"} />
          <div>
            <span className="eyebrow">Welcome back</span>
            <h2>Sign in to Suadence</h2>
            <p>Continue managing practice, coaching, and team readiness.</p>
          </div>
          {error && <div className="form-alert">{error}</div>}
          {message && <div className="form-alert">{message}</div>}
          <label>
            Work email
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={8}
              required
            />
          </label>
          <p className="auth-switch">
            <Link href="/forgot-password">Forgot your password?</Link>
          </p>
          <button className="button button-block" type="submit">
            Sign in
          </button>
          <p className="privacy-note">
            Authentication is provided by Suadence through Supabase. A ChatGPT
            account is never required.
          </p>
          <p className="auth-switch">
            New to Suadence? <Link href="/signup">Request pilot access</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
