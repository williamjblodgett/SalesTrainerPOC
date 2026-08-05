import { describe, expect, it } from "vitest";

import { isRealtimeVoiceReleased, textCalibrationCorpusSchema, textRealismGatePassed } from "@/lib/calibration/text-realism";

describe("text realism release gate", () => {
  const passing = {
    evaluatorCaseCount: 50, criterionMeanAbsoluteError: 0.5, overallMeanAbsoluteError: 7,
    buyerCaseCount: 10, buyerExpectedDisclosureRecall: 0.95, buyerForbiddenDisclosureRate: 0, buyerEndActionAccuracy: 0.9,
    personaCaseCount: 10, personaExpectedClaimRecall: 0.95, personaForbiddenClaimRate: 0, providerErrorCount: 0,
  };

  it("requires every text-quality threshold", () => {
    expect(textRealismGatePassed(passing)).toBe(true);
    expect(textRealismGatePassed({ ...passing, evaluatorCaseCount: 49 })).toBe(false);
    expect(textRealismGatePassed({ ...passing, buyerForbiddenDisclosureRate: 0.01 })).toBe(false);
    expect(textRealismGatePassed({ ...passing, providerErrorCount: 1 })).toBe(false);
  });

  it("requires an explicit benchmark pass and voice flag", () => {
    expect(isRealtimeVoiceReleased({ ENABLE_REALTIME_VOICE: "true", TEXT_REALISM_BENCHMARK_STATUS: "passed" })).toBe(true);
    expect(isRealtimeVoiceReleased({ ENABLE_REALTIME_VOICE: "true", TEXT_REALISM_BENCHMARK_STATUS: "pending" })).toBe(false);
    expect(isRealtimeVoiceReleased({ ENABLE_REALTIME_VOICE: "false", TEXT_REALISM_BENCHMARK_STATUS: "passed" })).toBe(false);
  });

  it("does not accept an unlabeled corpus as human-scored", () => {
    expect(() => textCalibrationCorpusSchema.parse({ schemaVersion: "1.0", licenseConfirmed: true, evaluatorCases: [{ id: "one" }], buyerCases: [], personaCases: [] })).toThrow();
  });
});
