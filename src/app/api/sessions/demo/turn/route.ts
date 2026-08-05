import { NextResponse } from "next/server";
import { z } from "zod";
import { createBuyerActor } from "@/lib/ai/buyer-actor";
import { demoScenario } from "@/lib/demo/scenario";
import type { BuyerState } from "@/lib/domain/buyer";

const input = z.object({ sessionId: z.string().uuid(), message: z.string().trim().min(1).max(4000), turns: z.array(z.object({ id: z.string(), role: z.enum(["seller", "buyer"]), content: z.string() })).max(60) });
const seen = new Map<string, { turnId: string; message: string; sessionStatus: string }>();
const sessionStates = new Map<string, BuyerState>();

export async function POST(request: Request) {
  const key = request.headers.get("idempotency-key");
  if (!key) return NextResponse.json({ code: "validation_failed", message: "Idempotency key required" }, { status: 400 });
  if (seen.has(key)) return NextResponse.json(seen.get(key));
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "validation_failed", message: "Invalid turn" }, { status: 400 });
  const current = sessionStates.get(parsed.data.sessionId);
  if (current && current.callEndState !== "active") return NextResponse.json({ code: "conflict", message: "The buyer has ended this session." }, { status: 409 });
  try {
    const result = await createBuyerActor().respond({ scenario: demoScenario, turns: parsed.data.turns, sellerMessage: parsed.data.message, state: current });
    sessionStates.set(parsed.data.sessionId, result.state);
    const body = { turnId: crypto.randomUUID(), message: result.message, sessionStatus: result.endAction === "continue" ? "active" : "completed" };
    seen.set(key, body);
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ code: "ai_provider_error", message: "The buyer could not respond. Try this turn again." }, { status: 502 });
  }
}
