import "server-only";

type OperationalLevel = "info" | "warn" | "error";

const blockedKeys = /transcript|content|prompt|secret|token|password|api.?key/i;

function sanitizeMetadata(metadata: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => !blockedKeys.test(key))
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.slice(0, 250) : value,
      ]),
  );
}

export function recordOperationalEvent(
  level: OperationalLevel,
  event: string,
  metadata: Record<string, unknown> = {},
) {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...sanitizeMetadata(metadata),
  });
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.info(payload);
}
