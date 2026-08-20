import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/config";

const allowedTypes = new Set<EmailOtpType>([
  "email",
  "invite",
  "magiclink",
  "recovery",
  "signup",
  "email_change",
]);

function safeNextPath(value: string | null, fallback: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const tokenHash = url.searchParams.get("token_hash");
  const rawType = url.searchParams.get("type");
  const type = rawType && allowedTypes.has(rawType as EmailOtpType)
    ? (rawType as EmailOtpType)
    : null;
  const fallback = type === "recovery" || type === "invite" ? "/reset-password" : "/app";
  const next = safeNextPath(url.searchParams.get("next"), fallback);

  if (!isSupabaseConfigured() || !tokenHash || !type) {
    return NextResponse.redirect(new URL("/forgot-password?error=Invalid+or+expired+link.", url));
  }

  const response = NextResponse.redirect(new URL(next, url));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) => {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    return NextResponse.redirect(new URL("/forgot-password?error=Invalid+or+expired+link.", url));
  }

  if (type === "recovery" || type === "invite") {
    response.cookies.set("suadence-recovery-intent", "verified", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });
  }
  return response;
}
