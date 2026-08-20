import Image from "next/image";
import Link from "next/link";

export default function Signup() {
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
          <span className="eyebrow light">Private design-partner pilot</span>
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
        <div className="auth-form">
          <div>
            <span className="eyebrow">Invite-only access</span>
            <h2>Request a pilot invitation</h2>
            <p>We are onboarding teams deliberately while buyer realism and scoring are calibrated with sales leaders.</p>
          </div>
          <a className="button button-block" href="mailto:williamjblodgett@gmail.com?subject=Suadence%20pilot%20access">Request pilot access</a>
          <p className="privacy-note">
            Approved users receive a one-time Supabase invitation. ChatGPT is never required.
          </p>
          <p className="auth-switch">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
