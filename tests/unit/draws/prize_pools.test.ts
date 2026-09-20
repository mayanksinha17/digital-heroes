import { describe, it, expect } from "vitest";
import {
  calculateSubscriberPrizePool,
  splitTierPools,
  type SubscriberInfo,
} from "@/modules/draws/engine/pools";
import { allocatePrizes } from "@/modules/draws/engine/allocate";
import type { MatchResult } from "@/modules/draws/engine/match";

describe("Draw Engine: Prize Pools & Financial Invariants (PRD §07)", () => {
  const sampleSubscribers: SubscriberInfo[] = [
    { userId: "u1", planCode: "monthly", monthlyEquivalentCents: 49900 },
    { userId: "u2", planCode: "monthly", monthlyEquivalentCents: 49900 },
    { userId: "u3", planCode: "yearly", monthlyEquivalentCents: 41658 },
    { userId: "u4", planCode: "yearly", monthlyEquivalentCents: 41658 },
  ];

  it("calculates prize pool from active subscribers in minor unit paise (50% share)", () => {
    // 2 monthly @ 24,950 = 49,900
    // 2 yearly @ 20,829 = 41,658
    // Total = 91,558 paise
    const poolNew = calculateSubscriberPrizePool(sampleSubscribers, 50);
    expect(poolNew).toBe(91558);
  });

  it("splits pool into 40% / 35% / 25% tiers and tracks dust remainder", () => {
    const poolNew = 100000; // ₹1,000.00
    const rolloverIn = 25000; // ₹250.00
    const tiers = splitTierPools(poolNew, rolloverIn);

    expect(tiers.poolNewCents).toBe(100000);
    expect(tiers.rolloverInCents).toBe(25000);
    expect(tiers.pool5Cents).toBe(40000 + 25000); // 65,000 paise (40% + rollover)
    expect(tiers.pool4Cents).toBe(35000); // 35,000 paise (35%)
    expect(tiers.pool3Cents).toBe(25000); // 25,000 paise (25%)
    expect(tiers.dustCents).toBe(0);
  });

  it("handles equal splitting among multiple winners in a tier (BR-18)", () => {
    const tierPools = splitTierPools(100000, 0); // Tier 4 pool = 35,000 paise

    // 3 winners in Tier 4
    const matchedEntries: MatchResult[] = [
      { userId: "w1", scores: [], matchCount: 4, matchedNumbers: [], tier: 4 },
      { userId: "w2", scores: [], matchCount: 4, matchedNumbers: [], tier: 4 },
      { userId: "w3", scores: [], matchCount: 4, matchedNumbers: [], tier: 4 },
    ];

    const alloc = allocatePrizes(tierPools, matchedEntries);
    expect(alloc.tierAllocations[4].winnerCount).toBe(3);
    // 35,000 / 3 = 11,666 each with 2 remainder
    expect(alloc.tierAllocations[4].payoutPerWinnerCents).toBe(11666);
    expect(alloc.tierAllocations[4].totalPaidCents).toBe(34998);
    expect(alloc.tierAllocations[4].remainderCents).toBe(2);

    // Remainder 2 paise is swept into rolloverOut to conserve all funds
    expect(alloc.rolloverOutCents).toBe(40000 + 2); // Tier 5 pool (40,000) + remainder (2)
    expect(alloc.financialInvariantSatisfied).toBe(true);
  });

  it("rolls over Tier 5 (Jackpot) when unclaimed, but leaves Tiers 4 and 3 as unallocated (BR-19 & D-24)", () => {
    const tierPools = splitTierPools(100000, 50000); // Total pool = 150,000 (Pool 5 = 90,000, Pool 4 = 35,000, Pool 3 = 25,000)

    // No winners in any tier
    const alloc = allocatePrizes(tierPools, []);

    expect(alloc.winners).toHaveLength(0);
    expect(alloc.totalPrizesAwardedCents).toBe(0);

    // Tier 5 rolls over completely
    expect(alloc.rolloverOutCents).toBe(90000);

    // Tiers 4 and 3 become unallocated (retained by platform revenue, not rolled over)
    expect(alloc.unallocatedCents).toBe(35000 + 25000); // 60,000 paise

    // Total conservation: 90,000 (rolloverOut) + 60,000 (unallocated) = 150,000 (totalIn)
    expect(alloc.financialInvariantSatisfied).toBe(true);
  });
});
