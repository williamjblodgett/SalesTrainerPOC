"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

function createRecoveryClient(): SupabaseClient {
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

export default function ResetPassword() {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("Verifying your secure link…");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createRecoveryClient();
    supabaseRef.current = supabase;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (!accessToken || !refreshToken || hash.get("type") !== "recovery") {
      void Promise.resolve().then(() =>
        setMessage("This reset link is invalid or has expired. Request a new one below."),
      );
      return;
    }

    void supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setMessage("This reset link is invalid or has expired. Request a new one below.");
          return;
        }
        window.history.replaceState({}, "", window.location.pathname);
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

    const supabase = supabaseRef.current;
    if (!supabase) {
      setMessage("The secure session is not ready. Request a new reset link and try again.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setMessage("We could not save that password. Request a new reset link and try again.");
      return;
    }
    await supabase.auth.signOut();
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
