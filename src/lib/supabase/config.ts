export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isCanonicalProduction() {
  return (
    process.env.APP_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}
