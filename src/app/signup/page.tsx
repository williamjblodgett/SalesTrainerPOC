import Image from "next/image";
import Link from "next/link";

import { signUp } from "@/app/auth/actions";

export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="auth-shell">
      <section className="auth-story trial-story">
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
          <span className="eyebrow light">14-day team trial</span>
          <h1>Build a coaching system your managers will actually use.</h1>
          <ul className="trial-list">
            <li>Realistic buyer personas grounded in your market</li>
            <li>Text and voice practice for every role level</li>
            <li>Evidence, calibration, and focused follow-up drills</li>
          </ul>
        </div>
        <p className="auth-footnote">No public leaderboards · No raw audio storage</p>
      </section>
      <section className="auth-form-wrap">
        <form action={signUp} className="auth-form">
          <div>
            <span className="eyebrow">Create your workspace</span>
            <h2>Start with your team</h2>
            <p>You will configure your company and first buyer next.</p>
          </div>
          {error && <div className="form-alert">{error}</div>}
          <label>
            Your name
            <input
              name="displayName"
              autoComplete="name"
              placeholder="Alex Morgan"
              required
            />
          </label>
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
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <button className="button button-block" type="submit">
            Create workspace
          </button>
          <p className="auth-switch">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
