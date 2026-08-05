export type PiiKind = "email" | "phone" | "ssn" | "payment_card" | "api_credential";

export type PiiFinding = {
  kind: PiiKind;
  count: number;
};

const patterns: Array<{ kind: PiiKind; expression: RegExp; replacement: string }> = [
  { kind: "email", expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, replacement: "[EMAIL REDACTED]" },
  { kind: "ssn", expression: /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g, replacement: "[SSN REDACTED]" },
  { kind: "phone", expression: /(?<!\d)(?:\+?1[-. (]*)?(?:\d{3}|\(\d{3}\))[-. )]*\d{3}[-. ]*\d{4}(?!\d)/g, replacement: "[PHONE REDACTED]" },
  { kind: "payment_card", expression: /\b(?:\d[ -]*?){13,19}\b/g, replacement: "[PAYMENT CARD REDACTED]" },
  { kind: "api_credential", expression: /\b(?:sk|api|token|secret)[-_][A-Za-z0-9_-]{16,}\b/gi, replacement: "[CREDENTIAL REDACTED]" },
];

export function redactSensitiveText(input: string) {
  const counts = new Map<PiiKind, number>();
  let text = input;
  for (const pattern of patterns) {
    text = text.replace(pattern.expression, () => {
      counts.set(pattern.kind, (counts.get(pattern.kind) ?? 0) + 1);
      return pattern.replacement;
    });
  }
  const findings: PiiFinding[] = Array.from(counts, ([kind, count]) => ({ kind, count }));
  return { text, findings, redactedCount: findings.reduce((sum, finding) => sum + finding.count, 0) };
}
