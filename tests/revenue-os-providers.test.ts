import { afterEach, describe, expect, it, vi } from "vitest";

import { assetBlueprints, revenueAssetBatchSchema } from "@/lib/revenue-os/contracts";
import {
  DeterministicAssetGenerator,
  DeterministicEvidenceExtractor,
} from "@/lib/revenue-os/providers";
import { shouldUseDeterministicAI } from "@/lib/ai/provider-mode";

const transcript = `Seller: How are regional forecasts assembled today?
Buyer: Every manager sends a different spreadsheet and two regions are usually late.
Seller: What happens when those reports arrive late?
Buyer: Leadership questions the weekly number and my team loses Monday reconciling it.
Seller: Would you consider replacing the CRM?
Buyer: We already have CRM reporting, and I will not add another administrative burden.`;

describe("Revenue OS provider contracts", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("fails closed instead of using mock AI for live production data", () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("AI_PROVIDER", "mock");
    vi.stubEnv("OPENAI_API_KEY", "");
    expect(() => shouldUseDeterministicAI()).toThrow(/Provider-backed AI/);
    expect(shouldUseDeterministicAI({ synthetic: true })).toBe(true);
  });

  it("extracts stable, grounded observations in deterministic test mode", async () => {
    const { result, model } = await new DeterministicEvidenceExtractor().extract(transcript);
    expect(model).toContain("synthetic");
    expect(result.observations).toHaveLength(6);
    expect(result.observations.map(({ turnId }) => turnId)).toEqual(["T1", "T2", "T3", "T4", "T5", "T6"]);
    expect(result.observations.every(({ excerpt }) => transcript.includes(excerpt))).toBe(true);
  });

  it("creates exactly 20 distinct, evidence-linked asset types", async () => {
    const { result } = await new DeterministicEvidenceExtractor().extract(transcript);
    const observations = result.observations.map((observation, index) => ({
      ...observation,
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    }));
    const generated = await new DeterministicAssetGenerator().generate({
      title: "Forecast discovery",
      accountName: "Northstar Systems",
      observations,
    });
    expect(() => revenueAssetBatchSchema.parse({ assets: generated.assets })).not.toThrow();
    expect(generated.assets).toHaveLength(20);
    expect(new Set(generated.assets.map(({ assetType }) => assetType)).size).toBe(assetBlueprints.length);
    expect(new Set(generated.assets.map(({ content }) => content.summary)).size).toBe(assetBlueprints.length);
    expect(generated.assets.every(({ content }) => content.evidenceObservationIds.length > 0)).toBe(true);
  });

  it("rejects a batch that repeats one asset type", async () => {
    const { result } = await new DeterministicEvidenceExtractor().extract(transcript);
    const observations = result.observations.map((observation, index) => ({
      ...observation,
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    }));
    const generated = await new DeterministicAssetGenerator().generate({ title: "Call", accountName: "Acme", observations });
    const duplicated = generated.assets.map((asset, index) => index === 1 ? { ...asset, assetType: generated.assets[0].assetType } : asset);
    expect(() => revenueAssetBatchSchema.parse({ assets: duplicated })).toThrow(/exactly once|Missing/);
  });
});
