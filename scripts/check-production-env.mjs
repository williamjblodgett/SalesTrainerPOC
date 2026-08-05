const required = [
  "NEXT_PUBLIC_APP_URL",
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
];

const missing = required.filter((key) => !process.env[key]);
const invalid = [];
if (process.env.AI_PROVIDER !== "openai") invalid.push("AI_PROVIDER must equal openai");
if (process.env.DOCUMENT_SCANNER_MODE !== "cloudmersive") invalid.push("DOCUMENT_SCANNER_MODE must equal cloudmersive");
if (process.env.ENABLE_REALTIME_VOICE === "true" && process.env.TEXT_REALISM_BENCHMARK_STATUS !== "passed") {
  invalid.push("Realtime voice requires TEXT_REALISM_BENCHMARK_STATUS=passed");
}

if (missing.length || invalid.length) {
  if (missing.length) console.error(`Missing production variables: ${missing.join(", ")}`);
  for (const message of invalid) console.error(message);
  process.exit(1);
}
console.log("Production environment contract passed.");
