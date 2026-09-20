import type { TierPools } from "./pools";
import type { DrawTier, MatchResult } from "./match";

export interface WinnerPayout {
  userId: string;
  tier: DrawTier;
  prizeCents: number;
  matchCount: number;
  matchedNumbers: number[];
}

export interface TierAllocation {
  tier: DrawTier;
  winnerCount: number;
  poolCents: number;
  payoutPerWinnerCents: number;
  totalPaidCents: number;
  unallocatedCents: number;
  remainderCents: number;
}

export interface AllocationResult {
  winners: WinnerPayout[];
  tierAllocations: Record<DrawTier, TierAllocation>;
  totalPrizesAwardedCents: number;
  rolloverOutCents: number;
  unallocatedCents: number;
  dustCents: number;
  financialInvariantSatisfied: boolean;
}

/**
 * Allocates tier prize pools equally among same-tier winners (PRD §07 BR-18).
 * Manages 5-number jackpot rollover (BR-19), lower-tier unallocated funds (D-24),
 * and exact financial conservation without lost or created minor units.
 */
export function allocatePrizes(
  tierPools: TierPools,
  matchedEntries: MatchResult[]
): AllocationResult {
  const winners5 = matchedEntries.filter((e) => e.tier === 5);
  const winners4 = matchedEntries.filter((e) => e.tier === 4);
  const winners3 = matchedEntries.filter((e) => e.tier === 3);

  const winnersList: WinnerPayout[] = [];

  // --- Tier 5 (Jackpot) ---
  let tier5Paid = 0;
  let tier5PayoutPerWinner = 0;
  let tier5Rollover = 0;
  let tier5Remainder = 0;

  if (winners5.length > 0) {
    tier5PayoutPerWinner = Math.floor(tierPools.pool5Cents / winners5.length);
    tier5Paid = tier5PayoutPerWinner * winners5.length;
    tier5Remainder = tierPools.pool5Cents - tier5Paid;
    for (const w of winners5) {
      winnersList.push({
        userId: w.userId,
        tier: 5,
        prizeCents: tier5PayoutPerWinner,
        matchCount: w.matchCount,
        matchedNumbers: w.matchedNumbers,
      });
    }
  } else {
    // Unclaimed 5-match jackpot carries forward to next month
    tier5Rollover = tierPools.pool5Cents;
  }

  // --- Tier 4 ---
  let tier4Paid = 0;
  let tier4PayoutPerWinner = 0;
  let tier4Unallocated = 0;
  let tier4Remainder = 0;

  if (winners4.length > 0) {
    tier4PayoutPerWinner = Math.floor(tierPools.pool4Cents / winners4.length);
    tier4Paid = tier4PayoutPerWinner * winners4.length;
    tier4Remainder = tierPools.pool4Cents - tier4Paid;
    for (const w of winners4) {
      winnersList.push({
        userId: w.userId,
        tier: 4,
        prizeCents: tier4PayoutPerWinner,
        matchCount: w.matchCount,
        matchedNumbers: w.matchedNumbers,
      });
    }
  } else {
    // Unclaimed Tier 4 does not roll over
    tier4Unallocated = tierPools.pool4Cents;
  }

  // --- Tier 3 ---
  let tier3Paid = 0;
  let tier3PayoutPerWinner = 0;
  let tier3Unallocated = 0;
  let tier3Remainder = 0;

  if (winners3.length > 0) {
    tier3PayoutPerWinner = Math.floor(tierPools.pool3Cents / winners3.length);
    tier3Paid = tier3PayoutPerWinner * winners3.length;
    tier3Remainder = tierPools.pool3Cents - tier3Paid;
    for (const w of winners3) {
      winnersList.push({
        userId: w.userId,
        tier: 3,
        prizeCents: tier3PayoutPerWinner,
        matchCount: w.matchCount,
        matchedNumbers: w.matchedNumbers,
      });
    }
  } else {
    // Unclaimed Tier 3 does not roll over
    tier3Unallocated = tierPools.pool3Cents;
  }

  // Dust and integer rounding remainders are swept into rollover_out
  const totalDust = tierPools.dustCents + tier5Remainder + tier4Remainder + tier3Remainder;
  const rolloverOutCents = tier5Rollover + totalDust;
  const totalPrizesAwardedCents = tier5Paid + tier4Paid + tier3Paid;
  const totalUnallocatedCents = tier4Unallocated + tier3Unallocated;

  // Strict conservation check: Pool In === Pool Out
  const poolIn = tierPools.poolNewCents + tierPools.rolloverInCents;
  const poolOut = totalPrizesAwardedCents + rolloverOutCents + totalUnallocatedCents;
  const financialInvariantSatisfied = poolIn === poolOut;

  if (!financialInvariantSatisfied) {
    throw new Error(
      `Financial conservation invariant violated: poolIn (${poolIn}) != poolOut (${poolOut})`
    );
  }

  const tierAllocations: Record<DrawTier, TierAllocation> = {
    5: {
      tier: 5,
      winnerCount: winners5.length,
      poolCents: tierPools.pool5Cents,
      payoutPerWinnerCents: tier5PayoutPerWinner,
      totalPaidCents: tier5Paid,
      unallocatedCents: 0,
      remainderCents: tier5Remainder,
    },
    4: {
      tier: 4,
      winnerCount: winners4.length,
      poolCents: tierPools.pool4Cents,
      payoutPerWinnerCents: tier4PayoutPerWinner,
      totalPaidCents: tier4Paid,
      unallocatedCents: tier4Unallocated,
      remainderCents: tier4Remainder,
    },
    3: {
      tier: 3,
      winnerCount: winners3.length,
      poolCents: tierPools.pool3Cents,
      payoutPerWinnerCents: tier3PayoutPerWinner,
      totalPaidCents: tier3Paid,
      unallocatedCents: tier3Unallocated,
      remainderCents: tier3Remainder,
    },
  };

  return {
    winners: winnersList,
    tierAllocations,
    totalPrizesAwardedCents,
    rolloverOutCents,
    unallocatedCents: totalUnallocatedCents,
    dustCents: totalDust,
    financialInvariantSatisfied,
  };
}
