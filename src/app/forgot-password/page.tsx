"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useState } from "react";

function createRecoveryClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

export default function ForgotPassword() {
  const [message, setMessage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(undefined);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const supabase = createRecoveryClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    setMessage(
      error
        ? "We could not send a reset link. Wait a minute and try again."
        : "If that account exists, a new secure reset link is on its way.",
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link href="/" className="auth-logo">Suadence</Link>
        <div><span className="eyebrow light">Secure account access</span><h1>Reset your password.</h1><p>We will send a time-limited link that works even when you open it on another device.</p></div>
      </section>
      <section className="auth-form-wrap">
        <form onSubmit={submit} className="auth-form">
          <div><span className="eyebrow">Account recovery</span><h2>Get a reset link</h2></div>
          {message && <div className="form-alert" role="status">{message}</div>}
          <label>Work email<input name="email" type="email" autoComplete="email" required /></label>
          <button className="button button-block" type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </button>
          <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
        </form>
      </section>
    </main>
  );
}
