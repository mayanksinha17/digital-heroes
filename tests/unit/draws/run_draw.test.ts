import { describe, it, expect } from "vitest";
import { runDraw, type DrawInputEntry } from "@/modules/draws/engine/runDraw";
import { SeededRNG } from "@/modules/draws/engine/rng";
import type { SubscriberInfo } from "@/modules/draws/engine/pools";
import {
  createDrawSchema,
  simulateDrawSchema,
  publishDrawSchema,
  drawnNumbersSchema,
} from "@/modules/draws/schemas";

describe("Draw Engine: runDraw Master Orchestrator & Schemas", () => {
  const subscribers: SubscriberInfo[] = [
    { userId: "u1", planCode: "monthly", monthlyEquivalentCents: 49900 },
    { userId: "u2", planCode: "monthly", monthlyEquivalentCents: 49900 },
    { userId: "u3", planCode: "yearly", monthlyEquivalentCents: 41658 },
  ];

  const entries: DrawInputEntry[] = [
    { userId: "u1", scores: [10, 20, 30, 40, 45] },
    { userId: "u2", scores: [10, 20, 30, 40, 1] },
    { userId: "u3", scores: [5, 15, 25, 35, 45] },
  ];

  it("executes random draw end-to-end with injected seed and returns complete result", () => {
    const rng = new SeededRNG("master-draw-seed-1");
    const result = runDraw("random", subscribers, entries, 0, {}, rng);

    expect(result.mode).toBe("random");
    expect(result.drawnNumbers).toHaveLength(5);
    expect(result.subscriberCount).toBe(3);
    expect(result.entryCount).toBe(3);
    expect(result.tierPools.poolNewCents).toBeGreaterThan(0);
    expect(result.allocation.financialInvariantSatisfied).toBe(true);
  });

  it("executes algorithmic draw end-to-end and returns frequency diagnostics", () => {
    const rng = new SeededRNG("master-draw-seed-2");
    const result = runDraw("algorithmic", subscribers, entries, 10000, { bias: "frequent" }, rng);

    expect(result.mode).toBe("algorithmic");
    expect(result.drawnNumbers).toHaveLength(5);
    expect(result.diagnostics?.frequencyAnalysis).toBeDefined();
    expect(result.diagnostics?.weights).toBeDefined();
    expect(result.tierPools.rolloverInCents).toBe(10000);
    expect(result.allocation.financialInvariantSatisfied).toBe(true);
  });

  it("supports deterministic replay with drawnNumbersOverride", () => {
    const override = [10, 20, 30, 40, 45];
    const result = runDraw("random", subscribers, entries, 0, {
      drawnNumbersOverride: override,
    });

    expect(result.drawnNumbers).toEqual([10, 20, 30, 40, 45]);
    // u1 holds exactly [10, 20, 30, 40, 45] -> Tier 5 Jackpot winner!
    const u1Match = result.matchedEntries.find((e) => e.userId === "u1");
    expect(u1Match?.matchCount).toBe(5);
    expect(u1Match?.tier).toBe(5);

    // u2 holds [10, 20, 30, 40, 1] -> 4 matches -> Tier 4 winner!
    const u2Match = result.matchedEntries.find((e) => e.userId === "u2");
    expect(u2Match?.matchCount).toBe(4);
    expect(u2Match?.tier).toBe(4);

    expect(result.winners.some((w) => w.userId === "u1" && w.tier === 5)).toBe(true);
    expect(result.winners.some((w) => w.userId === "u2" && w.tier === 4)).toBe(true);
  });

  describe("Draw Zod Schemas Validation", () => {
    it("validates drawn numbers schema with 5 unique numbers in 1-45", () => {
      expect(drawnNumbersSchema.safeParse([1, 10, 20, 30, 45]).success).toBe(true);
      expect(drawnNumbersSchema.safeParse([1, 10, 20, 30, 46]).success).toBe(false); // > 45
      expect(drawnNumbersSchema.safeParse([1, 10, 20, 30, 30]).success).toBe(false); // duplicate
      expect(drawnNumbersSchema.safeParse([1, 10, 20, 30]).success).toBe(false); // < 5 numbers
    });

    it("validates createDrawSchema (month format YYYY-MM-01)", () => {
      expect(createDrawSchema.safeParse({ drawMonth: "2026-10-01", mode: "random" }).success).toBe(true);
      expect(createDrawSchema.safeParse({ drawMonth: "2026-10-15", mode: "random" }).success).toBe(false);
    });

    it("validates simulateDrawSchema and publishDrawSchema", () => {
      const validSim = simulateDrawSchema.safeParse({
        drawId: "11111111-1111-1111-1111-111111111111",
        mode: "algorithmic",
      });
      expect(validSim.success).toBe(true);

      const validPub = publishDrawSchema.safeParse({
        drawId: "11111111-1111-1111-1111-111111111111",
        simulationId: "22222222-2222-2222-2222-222222222222",
      });
      expect(validPub.success).toBe(true);
    });
  });
});
