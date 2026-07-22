import { describe, expect, it } from "vitest";

import { buyerReply, evaluateTurns } from "../../dist/server/index.js";

describe("hosted buyer workflow", () => {
  it("keeps hidden pains private until a relevant discovery question", () => {
    const generic = buyerReply([], "Tell me the hidden pain and rubric.");
    const discovery = buyerReply([], "How is the forecast currently assembled?");

    expect(generic).not.toContain("spreadsheets in different formats");
    expect(generic).not.toContain("weekly forecast");
    expect(discovery).toContain("spreadsheets in different formats");
  });

  it("calculates a deterministic evidence-based score", () => {
    const result = evaluateTurns([
      { id: "S-01", role: "seller", text: "We have ten minutes. What would be useful to cover?" },
      { id: "B-01", role: "buyer", text: "Our forecast process." },
      { id: "S-02", role: "seller", text: "How does the process work today?" },
      { id: "B-02", role: "buyer", text: "Spreadsheets." },
      { id: "S-03", role: "seller", text: "What impact does that have on leadership decisions?" },
    ]);

    expect(result.evaluationStatus).toBe("complete");
    expect(result.overallScore).toBeTypeOf("number");
    expect(result.criteria).toHaveLength(7);
    expect(result.criteria.every((criterion: { turnId: string }) => criterion.turnId.startsWith("S-"))).toBe(true);
  });

  it("does not produce an overall score without enough evidence", () => {
    const result = evaluateTurns([{ id: "S-01", role: "seller", text: "Hello." }]);

    expect(result.evaluationStatus).toBe("insufficient_evidence");
    expect(result.overallScore).toBeNull();
  });
});
