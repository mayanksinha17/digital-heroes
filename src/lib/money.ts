/**
 * Digital Heroes - Money and Minor Unit Financial Calculations
 * Invariant: Never use floating-point arithmetic for monetary calculations.
 * All amounts are stored and manipulated as integer minor units (paise/cents).
 */

export interface TierBreakdown {
  tier5Cents: number; // 40% of new pool + rollover in (jackpot)
  tier4Cents: number; // 35% of new pool
  tier3Cents: number; // 25% of new pool
  dustCents: number;  // Remainder from tier split division
  poolNewCents: number;
  rolloverInCents: number;
  poolTotalCents: number;
}

export interface WinnerSplit {
  winnerCount: number;
  tierPoolCents: number;
  perWinnerCents: number;
  remainderCents: number;
}

/**
 * Formats integer minor units into human-readable localized currency string.
 * @param amountInMinorUnits e.g. 49900 for ₹499.00
 * @param currency ISO currency code, default 'INR'
 */
export function formatMoney(
  amountInMinorUnits: number,
  currency: string = "INR",
  locale: string = "en-IN"
): string {
  const majorUnits = amountInMinorUnits / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(majorUnits);
}

/**
 * Calculates the monthly equivalent of a plan in minor units.
 * Monthly plan = plan price.
 * Yearly plan = floor(plan price / 12).
 */
export function getMonthlyEquivalentCents(
  priceCents: number,
  interval: "month" | "year"
): number {
  if (interval === "month") {
    return priceCents;
  }
  return Math.floor(priceCents / 12);
}

/**
 * Calculates prize pool contribution from an active subscriber.
 * @param monthlyEquivalentCents Monthly equivalent in minor units
 * @param prizePoolPercent Configurable percent (default 50)
 */
export function calculateSubscriberContribution(
  monthlyEquivalentCents: number,
  prizePoolPercent: number = 50
): number {
  return Math.floor((monthlyEquivalentCents * prizePoolPercent) / 100);
}

/**
 * Calculates charity contribution from an invoice payment.
 * PRD requirement: Minimum 10% of subscription fee.
 */
export function calculateCharityContribution(
  grossCents: number,
  charityPercent: number
): number {
  if (charityPercent < 10) {
    throw new Error("Charity contribution cannot be less than 10%");
  }
  return Math.floor((grossCents * charityPercent) / 100);
}

/**
 * Computes deterministic tier distributions for a monthly draw pool.
 * PRD §07:
 * - 5-Number match: 40% (plus rollover_in)
 * - 4-Number match: 35%
 * - 3-Number match: 25%
 * Conservation: poolNewCents = tier5New + tier4 + tier3 + dust.
 * Any rounding dust is safely allocated to the rollover out.
 */
export function calculateTierPools(
  poolNewCents: number,
  rolloverInCents: number = 0
): TierBreakdown {
  if (poolNewCents < 0 || rolloverInCents < 0) {
    throw new Error("Pool amounts cannot be negative");
  }

  const tier5NewCents = Math.floor((poolNewCents * 40) / 100);
  const tier4Cents = Math.floor((poolNewCents * 35) / 100);
  const tier3Cents = Math.floor((poolNewCents * 25) / 100);

  const allocatedNew = tier5NewCents + tier4Cents + tier3Cents;
  const dustCents = poolNewCents - allocatedNew;

  // 5-match jackpot includes previous rollover
  const tier5Cents = tier5NewCents + rolloverInCents;
  const poolTotalCents = poolNewCents + rolloverInCents;

  return {
    tier5Cents,
    tier4Cents,
    tier3Cents,
    dustCents,
    poolNewCents,
    rolloverInCents,
    poolTotalCents,
  };
}

/**
 * Splits a tier prize equally among multiple winners with remainder tracking.
 * PRD §07: Multiple winners in the same tier split that tier's prize equally.
 */
export function splitTierPrize(
  tierPoolCents: number,
  winnerCount: number
): WinnerSplit {
  if (winnerCount <= 0) {
    return {
      winnerCount: 0,
      tierPoolCents,
      perWinnerCents: 0,
      remainderCents: tierPoolCents,
    };
  }

  const perWinnerCents = Math.floor(tierPoolCents / winnerCount);
  const remainderCents = tierPoolCents - perWinnerCents * winnerCount;

  return {
    winnerCount,
    tierPoolCents,
    perWinnerCents,
    remainderCents,
  };
}
