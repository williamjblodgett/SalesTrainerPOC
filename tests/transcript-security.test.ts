import { describe, expect, it } from "vitest";
import { parseTranscriptFile } from "@/lib/transcripts/file-parser";

const validTranscript = "Seller: How does the current workflow operate today and what should we understand?\nBuyer: My team manually reconciles inconsistent reports every week, which wastes time and delays decisions for leadership.";

describe("transcript file safety", () => {
  it("parses and redacts a valid text transcript", async () => {
    const file = new File([`${validTranscript}\nBuyer: Contact me at buyer@example.com after the review.`], "call.txt", { type: "text/plain" });
    const result = await parseTranscriptFile(file);
    expect(result.text).toContain("[EMAIL REDACTED]");
    expect(result.piiFindings).toContainEqual({ kind: "email", count: 1 });
    expect(result.scan.status).toBe("passed");
  });

  it("rejects mismatched types and active-content markers", async () => {
    await expect(parseTranscriptFile(new File([validTranscript], "call.pdf", { type: "text/plain" }))).rejects.toThrow("extension and detected document type");
    await expect(parseTranscriptFile(new File([`${validTranscript}\n/JavaScript`], "call.txt", { type: "text/plain" }))).rejects.toThrow("quarantined");
  });
});
