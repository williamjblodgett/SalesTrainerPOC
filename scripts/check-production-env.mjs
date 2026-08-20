const required = [
  "APP_ENV",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_MAIN_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "OPENAI_SCENARIO_MODEL",
  "OPENAI_PERSONA_MODEL",
  "OPENAI_BUYER_MODEL",
  "OPENAI_EVALUATOR_MODEL",
  "OPENAI_REALTIME_MODEL",
  "CLOUDMERSIVE_API_KEY",
  "AUTH_ACCESS_MODE",
];

const missing = required.filter((key) => !process.env[key]);
const invalid = [];
if (process.env.APP_ENV !== "production") invalid.push("APP_ENV must equal production");
if (process.env.AI_PROVIDER !== "openai") invalid.push("AI_PROVIDER must equal openai");
if (process.env.DOCUMENT_SCANNER_MODE !== "cloudmersive") invalid.push("DOCUMENT_SCANNER_MODE must equal cloudmersive");
if (process.env.NEXT_PUBLIC_APP_URL !== "https://salessim-five.vercel.app") invalid.push("NEXT_PUBLIC_APP_URL must use the canonical origin");
if (process.env.NEXT_PUBLIC_MAIN_SITE_URL !== process.env.NEXT_PUBLIC_APP_URL) invalid.push("Marketing and product must share the canonical origin");
if (process.env.AUTH_ACCESS_MODE !== "invite_only") invalid.push("AUTH_ACCESS_MODE must equal invite_only");
if (process.env.ENABLE_REALTIME_VOICE === "true" && process.env.TEXT_REALISM_BENCHMARK_STATUS !== "passed") {
  invalid.push("Realtime voice requires TEXT_REALISM_BENCHMARK_STATUS=passed");
}

if (missing.length || invalid.length) {
  if (missing.length) console.error(`Missing production variables: ${missing.join(", ")}`);
  for (const message of invalid) console.error(message);
  process.exit(1);
}
console.log("Production environment contract passed.");
