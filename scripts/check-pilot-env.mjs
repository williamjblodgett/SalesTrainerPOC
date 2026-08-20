const required = [
  "APP_ENV",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_MAIN_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "AUTH_ACCESS_MODE",
];

const missing = required.filter((key) => !process.env[key]);
const invalid = [];

if (process.env.APP_ENV !== "production") invalid.push("APP_ENV must equal production");
if (process.env.NEXT_PUBLIC_APP_URL !== "https://salessim-five.vercel.app") {
  invalid.push("NEXT_PUBLIC_APP_URL must use the canonical origin");
}
if (process.env.NEXT_PUBLIC_MAIN_SITE_URL !== process.env.NEXT_PUBLIC_APP_URL) {
  invalid.push("Marketing and product must share the canonical origin");
}
if (process.env.AUTH_ACCESS_MODE !== "invite_only") {
  invalid.push("AUTH_ACCESS_MODE must equal invite_only");
}
if (process.env.ENABLE_REALTIME_VOICE === "true") {
  invalid.push("Realtime voice must remain disabled for the uncalibrated pilot");
}

if (missing.length || invalid.length) {
  if (missing.length) console.error(`Missing pilot variables: ${missing.join(", ")}`);
  for (const message of invalid) console.error(message);
  process.exit(1);
}

console.log("Invite-only pilot environment contract passed.");
