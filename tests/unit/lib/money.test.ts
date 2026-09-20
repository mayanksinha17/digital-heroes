import { describe, it, expect } from "vitest";
import {
  calculateCharityContribution,
  calculateSubscriberContribution,
  calculateTierPools,
  formatMoney,
  getMonthlyEquivalentCents,
  splitTierPrize,
} from "@/lib/money";

describe("lib/money", () => {
  describe("formatMoney", () => {
    it("formats INR correctly", () => {
      const formatted = formatMoney(49900, "INR", "en-IN");
      expect(formatted).toContain("499");
    });
  });

  describe("getMonthlyEquivalentCents", () => {
    it("returns exact price for monthly plans", () => {
      expect(getMonthlyEquivalentCents(49900, "month")).toBe(49900);
    });

    it("returns floor(yearly / 12) for yearly plans", () => {
      // 499900 / 12 = 41658.333... -> 41658
      expect(getMonthlyEquivalentCents(499900, "year")).toBe(41658);
    });
  });

  describe("calculateSubscriberContribution", () => {
    it("calculates 50% contribution correctly", () => {
      expect(calculateSubscriberContribution(49900, 50)).toBe(24950);
      expect(calculateSubscriberContribution(41658, 50)).toBe(20829);
    });
  });

  describe("calculateCharityContribution", () => {
    it("calculates 10% minimum charity contribution", () => {
      expect(calculateCharityContribution(49900, 10)).toBe(4990);
    });

    it("calculates 15% increased charity contribution", () => {
      expect(calculateCharityContribution(49900, 15)).toBe(7485);
    });

    it("rejects less than 10% charity contribution", () => {
      expect(() => calculateCharityContribution(49900, 9)).toThrow(
        "Charity contribution cannot be less than 10%"
      );
    });
  });

  describe("calculateTierPools (PRD §07 & AT-01)", () => {
    it("calculates exact 40/35/25 distribution with no loss of money", () => {
      // Worked example AT-01: poolNew = 2,330,160 paise
      const poolNew = 2330160;
      const breakdown = calculateTierPools(poolNew, 0);

      expect(breakdown.tier5Cents).toBe(932064); // 40%
      expect(breakdown.tier4Cents).toBe(815556); // 35%
      expect(breakdown.tier3Cents).toBe(582540); // 25%
      expect(breakdown.dustCents).toBe(0);

      const totalAllocated =
        breakdown.tier5Cents + breakdown.tier4Cents + breakdown.tier3Cents + breakdown.dustCents;
      expect(totalAllocated).toBe(poolNew);
    });

    it("adds rollover_in to tier 5 jackpot", () => {
      const breakdown = calculateTierPools(2330160, 500000);
      expect(breakdown.tier5Cents).toBe(932064 + 500000);
      expect(breakdown.poolTotalCents).toBe(2330160 + 500000);
    });
  });

  describe("splitTierPrize", () => {
    it("splits equally among winners and computes remainder", () => {
      // 815,556 / 3 = 271,852 each, 0 remainder
      const split4 = splitTierPrize(815556, 3);
      expect(split4.perWinnerCents).toBe(271852);
      expect(split4.remainderCents).toBe(0);

      // 582,540 / 7 = 83,220 each, 0 remainder
      const split3 = splitTierPrize(582540, 7);
      expect(split3.perWinnerCents).toBe(83220);
      expect(split3.remainderCents).toBe(0);
    });

    it("handles zero winners safely", () => {
      const split = splitTierPrize(932064, 0);
      expect(split.perWinnerCents).toBe(0);
      expect(split.remainderCents).toBe(932064);
    });
  });
});
