import "server-only";

import { isCanonicalProduction } from "@/lib/supabase/config";

export class AIProviderConfigurationError extends Error {
  constructor() {
    super("Provider-backed AI is required for live production data");
    this.name = "AIProviderConfigurationError";
  }
}

export function shouldUseDeterministicAI(options: { synthetic?: boolean } = {}) {
  const configuredForMock = process.env.AI_PROVIDER === "mock" || !process.env.OPENAI_API_KEY;
  if (!isCanonicalProduction()) return configuredForMock;
  if (options.synthetic && process.env.AI_PROVIDER === "mock") return true;
  if (process.env.AI_PROVIDER !== "openai" || !process.env.OPENAI_API_KEY) {
    throw new AIProviderConfigurationError();
  }
  return false;
}
