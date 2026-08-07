"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

export default function ResetPassword() {
  const accessTokenRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("Verifying your secure link…");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");
    if (!accessToken) {
      const errorCode = hash.get("error_code");
      void Promise.resolve().then(() =>
        setMessage(
          errorCode === "otp_expired"
            ? "Supabase reports that this one-time link was already used or expired. Request a new one below."
            : "This reset link did not contain a recovery session. Request a new one below.",
        ),
      );
      return;
    }
    accessTokenRef.current = accessToken;
    window.history.replaceState({}, "", window.location.pathname);
    void Promise.resolve().then(() => {
      setMessage("");
      setReady(true);
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmPassword") ?? "");
    if (password.length < 8 || password !== confirmation) {
      setMessage("Use matching passwords of at least eight characters.");
      return;
    }

    const accessToken = accessTokenRef.current;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!accessToken || !supabaseUrl || !anonKey) {
      setMessage("The secure session is not ready. Request a new reset link and try again.");
      return;
    }

    setSubmitting(true);
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "PUT",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);
    if (!response.ok) {
      setMessage("We could not save that password. Request a new reset link and try again.");
      return;
    }
    window.location.assign("/login?message=Password%20updated.%20You%20can%20sign%20in%20now.");
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link href="/" className="auth-logo">Suadence</Link>
        <div><span className="eyebrow light">Secure account access</span><h1>Choose a new password.</h1><p>Use at least eight characters and keep it unique to Suadence.</p></div>
      </section>
      <section className="auth-form-wrap">
        <form onSubmit={submit} className="auth-form">
          <div><span className="eyebrow">Password setup</span><h2>Create your password</h2></div>
          {message && <div className="form-alert" role="status">{message}</div>}
          {ready ? <>
            <label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
            <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
            <button className="button button-block" type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save password"}</button>
          </> : <p className="auth-switch"><Link href="/forgot-password">Request a new reset link</Link></p>}
          <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
        </form>
      </section>
    </main>
  );
}
