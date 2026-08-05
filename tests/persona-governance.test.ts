import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import industryPacks from "../public/data/industry-packs.json";
import { transcriptPersonaRequestSchema, validatePersonaEvidence } from "@/lib/domain/persona";
import { createDeterministicPersona } from "@/lib/domain/persona-mock";
import { redactSensitiveText } from "@/lib/security/pii-redaction";

function input(industryId: string, texts: string[]) {
  return transcriptPersonaRequestSchema.parse({
    industryId, retentionMode: "redact_then_delete", consentAttested: true,
    transcripts: texts.map((content, index) => ({ sourceId: `source-${index + 1}`, title: `Manager-labeled call ${index + 1}`, content, consentStatus: "synthetic" })),
  });
}

const base = (signal: string) => `Seller: What are you responsible for and how is the process performing today?
Buyer: I own this workflow and ${signal} is a top priority because manual steps delay our weekly decisions.
Seller: What happens if the team cannot improve it?
Buyer: Leadership loses confidence, operating cost rises, and I worry the team will miss its commitments.
Seller: What would stop you from making a change?
Buyer: We already use an existing system and I will not add administrative work.`;

describe("persona governance and calibration", () => {
  it("redacts common PII and credentials before model input", () => {
    const result = redactSensitiveText("Email jane@example.com, call (212) 555-0199, SSN 123-45-6789, token sk_test_abcdefghijklmnop.");
    expect(result.text).not.toContain("jane@example.com");
    expect(result.text).not.toContain("123-45-6789");
    expect(result.redactedCount).toBe(4);
    expect(result.findings.map((finding) => finding.kind)).toEqual(expect.arrayContaining(["email", "phone", "ssn", "api_credential"]));
  });

  it.each(industryPacks.map((pack) => [pack.id, pack.signals[0]]))("meets citation and field-lineage calibration for %s", (industryId, signal) => {
    const request = input(industryId, [base(signal), base(signal)]);
    const persona = createDeterministicPersona(request);
    expect(() => validatePersonaEvidence(persona, request.transcripts)).not.toThrow();
    expect(persona.fieldEvidence).toHaveLength(9);
    expect(persona.fieldEvidence.filter((field) => field.support === "observed").every((field) => field.evidenceClaimIds.length > 0)).toBe(true);
    expect(persona.identity.title).toMatch(/Unknown/);
    expect(persona.decisionProcess.stakeholders).toEqual([]);
    const citedSourceDiversity = new Set(persona.evidenceClaims.map((claim) => claim.sourceId)).size / request.transcripts.length;
    expect(citedSourceDiversity).toBe(1);
  });

  it("detects timeline, priority, and current-solution conflicts", () => {
    const persona = createDeterministicPersona(input("b2b-saas", [
      base("forecast confidence") + "\nBuyer: This is urgent and must be decided this quarter. We use Salesforce today.",
      base("forecast confidence") + "\nBuyer: This is not a priority and there is no timeline until next year. We are moving away from Salesforce.",
    ]));
    expect(persona.conflicts.map((conflict) => conflict.field)).toEqual(expect.arrayContaining(["decisionProcess.timeline", "decisionProcess.alternatives", "priorities"]));
  });

  it("defines RLS, immutable versions, atomic lineage, and cascade deletion contracts", () => {
    const migration = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/202608050001_persona_governance.sql"), "utf8");
    expect(migration).toContain("create_persona_draft_with_lineage");
    expect(migration).toContain("persona_claim_reviews enable row level security");
    expect(migration).toContain("delete_transcript_source_with_lineage");
    expect(migration).toContain("has_org_role");
  });
});
