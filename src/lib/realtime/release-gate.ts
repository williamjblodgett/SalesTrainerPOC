export function realtimeVoiceEnabled() {
  return Boolean(process.env.OPENAI_API_KEY) && process.env.ENABLE_REALTIME_VOICE === "true" && process.env.TEXT_REALISM_BENCHMARK_STATUS === "passed" && process.env.STORE_RAW_CALL_AUDIO !== "true";
}
