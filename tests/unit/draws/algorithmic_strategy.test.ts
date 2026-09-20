import { describe, it, expect } from "vitest";
import { computeScoreFrequencies, buildScoreWeights } from "@/modules/draws/engine/weights";
import { drawWeightedNumbers } from "@/modules/draws/engine/weighted";
import { SeededRNG } from "@/modules/draws/engine/rng";

describe("Draw Engine: Algorithmic / Weighted Strategy (PRD §06 & D-17)", () => {
  const sampleEntries = [
    { scores: [36, 38, 40, 42, 44] },
    { scores: [36, 38, 40, 41, 43] },
    { scores: [36, 38, 39, 40, 45] },
    { scores: [36, 30, 32, 34, 38] },
    { scores: [36, 28, 30, 32, 38] },
  ];

  it("accurately computes score frequencies across all entrant score tokens", () => {
    const analysis = computeScoreFrequencies(sampleEntries, 1, 45);

    expect(analysis.totalScoreTokens).toBe(25);
    expect(analysis.frequencies[36]).toBe(5); // 36 appeared in all 5 entries
    expect(analysis.frequencies[38]).toBe(5); // 38 appeared in all 5 entries
    expect(analysis.frequencies[40]).toBe(3);
    expect(analysis.frequencies[1]).toBe(0); // 1 did not appear
    expect(analysis.maxFrequency).toBe(5);
  });

  it("builds integer weights with frequent bias and smoothing", () => {
    const analysis = computeScoreFrequencies(sampleEntries, 1, 45);
    const weights = buildScoreWeights(analysis, { bias: "frequent", smoothing: 1 });

    expect(weights[36]).toBe(6); // freq(5) + 1
    expect(weights[38]).toBe(6); // freq(5) + 1
    expect(weights[40]).toBe(4); // freq(3) + 1
    expect(weights[1]).toBe(1); // freq(0) + 1 (smoothing ensures non-zero probability)
  });

  it("builds integer weights with rare bias", () => {
    const analysis = computeScoreFrequencies(sampleEntries, 1, 45);
    const weights = buildScoreWeights(analysis, { bias: "rare", smoothing: 1 });

    // With rare bias: maxFreq(5) - freq + 1
    expect(weights[36]).toBe(1); // 5 - 5 + 1 = 1 (least weighted)
    expect(weights[1]).toBe(6); // 5 - 0 + 1 = 6 (most weighted)
  });

  it("draws 5 distinct numbers deterministically using weighted sampling", () => {
    const analysis = computeScoreFrequencies(sampleEntries, 1, 45);
    const weights = buildScoreWeights(analysis, { bias: "frequent", smoothing: 1 });

    const rng1 = new SeededRNG("algo-seed-12345");
    const rng2 = new SeededRNG("algo-seed-12345");

    const draw1 = drawWeightedNumbers(weights, rng1, 5);
    const draw2 = drawWeightedNumbers(weights, rng2, 5);

    expect(draw1).toHaveLength(5);
    expect(new Set(draw1).size).toBe(5);
    expect(draw1).toEqual(draw2);
  });

  it("statistically favors higher-weighted numbers over many iterations", () => {
    // Artificial distribution: Number 10 has huge weight 1000, other numbers have weight 1
    const weights: Record<number, number> = {};
    for (let i = 1; i <= 45; i++) {
      weights[i] = i === 10 ? 1000 : 1;
    }

    const rng = new SeededRNG("statistical-test-seed");
    let count10Selected = 0;
    const iterations = 50;

    for (let i = 0; i < iterations; i++) {
      const drawn = drawWeightedNumbers(weights, rng, 5);
      if (drawn.includes(10)) {
        count10Selected++;
      }
    }

    // Number 10 with 1000x weight should be selected in nearly all runs
    expect(count10Selected).toBeGreaterThanOrEqual(45);
  });
});
