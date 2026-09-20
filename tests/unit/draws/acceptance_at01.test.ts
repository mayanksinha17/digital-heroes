import { describe, it, expect } from "vitest";
import {
  calculateSubscriberPrizePool,
  splitTierPools,
  type SubscriberInfo,
} from "@/modules/draws/engine/pools";
import { allocatePrizes } from "@/modules/draws/engine/allocate";
import type { MatchResult } from "@/modules/draws/engine/match";

describe("Acceptance Test AT-01: Prize Pool, Tier Split, Equal Payouts & Jackpot Rollover (PRD §07)", () => {
  // Construct 60 monthly and 40 yearly active subscribers
  const subscribers: SubscriberInfo[] = [
    ...Array.from({ length: 60 }, (_, i) => ({
      userId: `monthly-user-${i + 1}`,
      planCode: "monthly" as const,
      monthlyEquivalentCents: 49900, // ₹499.00
    })),
    ...Array.from({ length: 40 }, (_, i) => ({
      userId: `yearly-user-${i + 1}`,
      planCode: "yearly" as const,
      monthlyEquivalentCents: Math.floor(499900 / 12), // ₹416.58 = 41,658 paise
    })),
  ];

  it("executes the exact worked prize pool calculation from the PRD and PRD_ANALYSIS", () => {
    // --- Step 1: Compute poolNew at 50% ---
    const poolNew = calculateSubscriberPrizePool(subscribers, 50);
    // 60 * 24,950 + 40 * 20,829 = 1,497,000 + 833,160 = 2,330,160 paise (₹23,301.60)
    expect(poolNew).toBe(2330160);

    // --- Step 2: Split into 40% / 35% / 25% tiers with rolloverIn = 0 ---
    const month1Tiers = splitTierPools(poolNew, 0);
    expect(month1Tiers.pool5Cents).toBe(932064); // 40% of 2,330,160
    expect(month1Tiers.pool4Cents).toBe(815556); // 35% of 2,330,160
    expect(month1Tiers.pool3Cents).toBe(582540); // 25% of 2,330,160
    expect(month1Tiers.dustCents).toBe(0);

    // --- Step 3: Month 1 Winners: 0 five-match, 3 four-match, 7 three-match ---
    const month1MatchedEntries: MatchResult[] = [
      // 3 four-match winners
      { userId: "w4-1", scores: [], matchCount: 4, matchedNumbers: [], tier: 4 },
      { userId: "w4-2", scores: [], matchCount: 4, matchedNumbers: [], tier: 4 },
      { userId: "w4-3", scores: [], matchCount: 4, matchedNumbers: [], tier: 4 },
      // 7 three-match winners
      { userId: "w3-1", scores: [], matchCount: 3, matchedNumbers: [], tier: 3 },
      { userId: "w3-2", scores: [], matchCount: 3, matchedNumbers: [], tier: 3 },
      { userId: "w3-3", scores: [], matchCount: 3, matchedNumbers: [], tier: 3 },
      { userId: "w3-4", scores: [], matchCount: 3, matchedNumbers: [], tier: 3 },
      { userId: "w3-5", scores: [], matchCount: 3, matchedNumbers: [], tier: 3 },
      { userId: "w3-6", scores: [], matchCount: 3, matchedNumbers: [], tier: 3 },
      { userId: "w3-7", scores: [], matchCount: 3, matchedNumbers: [], tier: 3 },
    ];

    const month1Alloc = allocatePrizes(month1Tiers, month1MatchedEntries);

    // Verify 4-match equal split: 815,556 / 3 = 271,852 paise each
    expect(month1Alloc.tierAllocations[4].payoutPerWinnerCents).toBe(271852);
    expect(month1Alloc.tierAllocations[4].totalPaidCents).toBe(815556);

    // Verify 3-match equal split: 582,540 / 7 = 83,220 paise each
    expect(month1Alloc.tierAllocations[3].payoutPerWinnerCents).toBe(83220);
    expect(month1Alloc.tierAllocations[3].totalPaidCents).toBe(582540);

    // Verify 5-match jackpot rollover: 932,064 rolls over
    expect(month1Alloc.tierAllocations[5].winnerCount).toBe(0);
    expect(month1Alloc.rolloverOutCents).toBe(932064);

    // Verify total conservation invariant:
    // 3 * 271,852 + 7 * 83,220 + 932,064 = 2,330,160 paise
    const totalAwarded = month1Alloc.totalPrizesAwardedCents;
    expect(totalAwarded + month1Alloc.rolloverOutCents).toBe(2330160);
    expect(month1Alloc.financialInvariantSatisfied).toBe(true);

    // --- Step 4: Month 2 with Rollover from Month 1 ---
    const rolloverInMonth2 = month1Alloc.rolloverOutCents; // 932,064 paise
    const month2Tiers = splitTierPools(poolNew, rolloverInMonth2);

    // Tier 5 pool = 932,064 (new) + 932,064 (rolloverIn) = 1,864,128 paise (₹18,641.28)
    expect(month2Tiers.pool5Cents).toBe(1864128);

    // Month 2 has 1 five-match winner
    const month2MatchedEntries: MatchResult[] = [
      { userId: "jackpot-winner", scores: [], matchCount: 5, matchedNumbers: [], tier: 5 },
    ];

    const month2Alloc = allocatePrizes(month2Tiers, month2MatchedEntries);
    expect(month2Alloc.tierAllocations[5].winnerCount).toBe(1);
    expect(month2Alloc.tierAllocations[5].payoutPerWinnerCents).toBe(1864128);
    expect(month2Alloc.tierAllocations[5].totalPaidCents).toBe(1864128);

    // Month 2 rollover out is 0 since jackpot was claimed (and no dust)
    expect(month2Alloc.rolloverOutCents).toBe(0);
    expect(month2Alloc.financialInvariantSatisfied).toBe(true);
  });
});
