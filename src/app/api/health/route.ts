import { NextResponse } from "next/server";

import { recordOperationalEvent } from "@/lib/observability/operational-event";
import { isCanonicalProduction, isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const checks = {
    supabase: isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    scanner:
      process.env.DOCUMENT_SCANNER_MODE === "cloudmersive" &&
      Boolean(process.env.CLOUDMERSIVE_API_KEY),
    authProvider: "supabase",
  } as const;
  const requiredReady = checks.supabase && checks.openai && checks.scanner;
  const ready = isCanonicalProduction() ? requiredReady : true;
  recordOperationalEvent(ready ? "info" : "error", "service_health_checked", {
    ready,
    canonicalProduction: isCanonicalProduction(),
    supabaseConfigured: checks.supabase,
    openaiConfigured: checks.openai,
    scannerConfigured: checks.scanner,
  });
  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      authentication: "supabase",
      chatgptAccountRequired: false,
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
