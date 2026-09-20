import { describe, it, expect } from "vitest";
import {
  countMatches,
  getMatchedNumbers,
  getMatchTier,
  evaluateEntry,
} from "@/modules/draws/engine/match";

describe("Draw Engine: Match Calculation & Tier Assignment (PRD §06 & D-14, D-15)", () => {
  const drawnNumbers = [7, 14, 21, 28, 35];

  describe("Set Intersection Match Counting", () => {
    it("returns 0 matches when no numbers match", () => {
      const userScores = [1, 2, 3, 4, 5];
      expect(countMatches(userScores, drawnNumbers)).toBe(0);
      expect(getMatchedNumbers(userScores, drawnNumbers)).toEqual([]);
      expect(getMatchTier(0)).toBeNull();
    });

    it("returns 1 or 2 matches with no winning tier (null)", () => {
      const scores1 = [7, 1, 2, 3, 4];
      expect(countMatches(scores1, drawnNumbers)).toBe(1);
      expect(getMatchTier(1)).toBeNull();

      const scores2 = [7, 14, 1, 2, 3];
      expect(countMatches(scores2, drawnNumbers)).toBe(2);
      expect(getMatchTier(2)).toBeNull();
    });

    it("identifies 3-number match as Tier 3", () => {
      const userScores = [7, 14, 21, 1, 2];
      expect(countMatches(userScores, drawnNumbers)).toBe(3);
      expect(getMatchedNumbers(userScores, drawnNumbers)).toEqual([7, 14, 21]);
      expect(getMatchTier(3)).toBe(3);
    });

    it("identifies 4-number match as Tier 4", () => {
      const userScores = [7, 14, 21, 28, 1];
      expect(countMatches(userScores, drawnNumbers)).toBe(4);
      expect(getMatchedNumbers(userScores, drawnNumbers)).toEqual([7, 14, 21, 28]);
      expect(getMatchTier(4)).toBe(4);
    });

    it("identifies 5-number match as Tier 5 (Jackpot)", () => {
      const userScores = [7, 14, 21, 28, 35];
      expect(countMatches(userScores, drawnNumbers)).toBe(5);
      expect(getMatchedNumbers(userScores, drawnNumbers)).toEqual([7, 14, 21, 28, 35]);
      expect(getMatchTier(5)).toBe(5);
    });
  });

  describe("Deduplication & Order Invariance", () => {
    it("matches correctly regardless of score order", () => {
      // Out of order: 35, 21, 7, 28, 14
      const userScores = [35, 21, 7, 28, 14];
      expect(countMatches(userScores, drawnNumbers)).toBe(5);
      expect(getMatchTier(5)).toBe(5);
    });

    it("deduplicates duplicate scores within user's entries (D-15)", () => {
      // User entered 7 multiple times (on different dates, but same value)
      const userScores = [7, 7, 14, 21, 28];
      // Distinct scores: {7, 14, 21, 28} -> 4 distinct numbers matching drawnNumbers
      expect(countMatches(userScores, drawnNumbers)).toBe(4);
      expect(getMatchTier(4)).toBe(4);
    });

    it("evaluates complete entry and returns typed match result", () => {
      const res = evaluateEntry("user-01", [7, 14, 21, 1, 2], drawnNumbers);
      expect(res.userId).toBe("user-01");
      expect(res.matchCount).toBe(3);
      expect(res.matchedNumbers).toEqual([7, 14, 21]);
      expect(res.tier).toBe(3);
    });
  });
});
