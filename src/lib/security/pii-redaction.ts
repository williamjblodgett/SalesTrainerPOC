export type PiiKind = "email" | "phone" | "ssn" | "payment_card" | "api_credential";

export type PiiFinding = {
  kind: PiiKind;
  count: number;
};

const luhnValid = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19 || /^(\d)\1+$/.test(digits)) return false;
  let sum = 0; let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) { let digit = Number(digits[index]); if (double) { digit *= 2; if (digit > 9) digit -= 9; } sum += digit; double = !double; }
  return sum % 10 === 0;
};

const patterns: Array<{ kind: PiiKind; expression: RegExp; replacement: string; validate?: (value: string) => boolean }> = [
  { kind: "email", expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, replacement: "[EMAIL REDACTED]" },
  { kind: "ssn", expression: /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g, replacement: "[SSN REDACTED]" },
  { kind: "phone", expression: /(?<!\d)(?:\+?1[-. (]*)?(?:\d{3}|\(\d{3}\))[-. )]*\d{3}[-. ]*\d{4}(?!\d)/g, replacement: "[PHONE REDACTED]" },
  { kind: "payment_card", expression: /\b(?:\d[ -]*?){13,19}\b/g, replacement: "[PAYMENT CARD REDACTED]", validate: luhnValid },
  { kind: "api_credential", expression: /\b(?:sk|api|token|secret)[-_][A-Za-z0-9_-]{16,}\b/gi, replacement: "[CREDENTIAL REDACTED]" },
];

export function redactSensitiveText(input: string) {
  const counts = new Map<PiiKind, number>();
  let text = input;
  for (const pattern of patterns) {
    text = text.replace(pattern.expression, (value) => {
      if (pattern.validate && !pattern.validate(value)) return value;
      counts.set(pattern.kind, (counts.get(pattern.kind) ?? 0) + 1);
      return pattern.replacement;
    });
  }
  const findings: PiiFinding[] = Array.from(counts, ([kind, count]) => ({ kind, count }));
  return { text, findings, redactedCount: findings.reduce((sum, finding) => sum + finding.count, 0) };
}
