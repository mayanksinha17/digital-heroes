export interface SubscriberInfo {
  userId: string;
  planCode: "monthly" | "yearly";
  monthlyEquivalentCents: number;
}

export interface TierShares {
  5: number;
  4: number;
  3: number;
}

export const DEFAULT_TIER_SHARES: TierShares = {
  5: 40,
  4: 35,
  3: 25,
};

export interface TierPools {
  poolNewCents: number;
  rolloverInCents: number;
  poolTotalCents: number;
  pool5Cents: number;
  pool4Cents: number;
  pool3Cents: number;
  dustCents: number;
}

/**
 * Calculates new prize pool contribution generated from active subscribers (PRD §07 & D-22, D-23).
 * Uses integer minor unit arithmetic (paise).
 */
export function calculateSubscriberPrizePool(
  subscribers: SubscriberInfo[],
  prizePoolPercent: number = 50
): number {
  if (prizePoolPercent < 0 || prizePoolPercent > 100) {
    throw new Error(`Invalid prize pool percentage: ${prizePoolPercent}`);
  }

  let poolNewCents = 0;
  for (const sub of subscribers) {
    const contribution = Math.floor((sub.monthlyEquivalentCents * prizePoolPercent) / 100);
    poolNewCents += contribution;
  }

  return poolNewCents;
}

/**
 * Splits new prize pool into the 40% / 35% / 25% tiers and adds incoming jackpot rollover (PRD §07).
 */
export function splitTierPools(
  poolNewCents: number,
  rolloverInCents: number = 0,
  tierShares: TierShares = DEFAULT_TIER_SHARES
): TierPools {
  if (poolNewCents < 0) {
    throw new Error("New prize pool cannot be negative");
  }
  if (rolloverInCents < 0) {
    throw new Error("Incoming rollover cannot be negative");
  }

  const shareSum = tierShares[5] + tierShares[4] + tierShares[3];
  if (shareSum !== 100) {
    throw new Error(`Tier shares must sum to 100%, received ${shareSum}%`);
  }

  const base5 = Math.floor((poolNewCents * tierShares[5]) / 100);
  const base4 = Math.floor((poolNewCents * tierShares[4]) / 100);
  const base3 = Math.floor((poolNewCents * tierShares[3]) / 100);

  // Remaining fractional paise from floor division
  const dustCents = poolNewCents - (base5 + base4 + base3);

  const pool5Cents = base5 + rolloverInCents;
  const pool4Cents = base4;
  const pool3Cents = base3;
  const poolTotalCents = poolNewCents + rolloverInCents;

  return {
    poolNewCents,
    rolloverInCents,
    poolTotalCents,
    pool5Cents,
    pool4Cents,
    pool3Cents,
    dustCents,
  };
}
