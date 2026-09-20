import { RNG, CryptoRNG } from "./rng";
import { drawRandomNumbers } from "./random";
import { computeScoreFrequencies, buildScoreWeights, type FrequencyAnalysis } from "./weights";
import { drawWeightedNumbers } from "./weighted";
import { evaluateEntry, type MatchResult, type DrawTier } from "./match";
import {
  calculateSubscriberPrizePool,
  splitTierPools,
  type SubscriberInfo,
  type TierShares,
  type TierPools,
  DEFAULT_TIER_SHARES,
} from "./pools";
import { allocatePrizes, type AllocationResult, type WinnerPayout } from "./allocate";

export interface DrawInputEntry {
  userId: string;
  scores: number[];
}

export interface DrawConfigInput {
  prizePoolPercent?: number; // default 50
  tierShares?: TierShares; // default {5: 40, 4: 35, 3: 25}
  bias?: "frequent" | "rare"; // default "frequent"
  smoothing?: number; // default 1
  drawnNumbersOverride?: number[]; // for deterministic replay / simulation verification
}

export interface DrawResult {
  mode: "random" | "algorithmic";
  drawnNumbers: number[];
  subscriberCount: number;
  entryCount: number;
  tierPools: TierPools;
  allocation: AllocationResult;
  matchedEntries: MatchResult[];
  winners: WinnerPayout[];
  diagnostics?: {
    frequencyAnalysis?: FrequencyAnalysis;
    weights?: Record<number, number>;
  };
}

/**
 * Pure, isolated draw execution engine.
 * Zero database, network, clock, or UI framework coupling.
 */
export function runDraw(
  mode: "random" | "algorithmic",
  subscribers: SubscriberInfo[],
  entries: DrawInputEntry[],
  rolloverInCents: number = 0,
  config: DrawConfigInput = {},
  injectedRng?: RNG
): DrawResult {
  const rng = injectedRng || new CryptoRNG();
  const poolPercent = config.prizePoolPercent ?? 50;
  const tierShares = config.tierShares ?? DEFAULT_TIER_SHARES;

  let drawnNumbers: number[];
  let freqAnalysis: FrequencyAnalysis | undefined;
  let weights: Record<number, number> | undefined;

  // 1. Generate or use supplied drawn numbers
  if (config.drawnNumbersOverride && config.drawnNumbersOverride.length === 5) {
    drawnNumbers = [...config.drawnNumbersOverride].sort((a, b) => a - b);
  } else if (mode === "random") {
    drawnNumbers = drawRandomNumbers(rng, 5, 1, 45);
  } else {
    // Algorithmic mode
    freqAnalysis = computeScoreFrequencies(entries, 1, 45);
    weights = buildScoreWeights(freqAnalysis, {
      bias: config.bias,
      smoothing: config.smoothing,
    });
    drawnNumbers = drawWeightedNumbers(weights, rng, 5);
  }

  // 2. Evaluate all entries against drawn numbers
  const matchedEntries = entries.map((e) => evaluateEntry(e.userId, e.scores, drawnNumbers));

  // 3. Compute prize pools across all active subscribers
  const poolNewCents = calculateSubscriberPrizePool(subscribers, poolPercent);
  const tierPools = splitTierPools(poolNewCents, rolloverInCents, tierShares);

  // 4. Allocate prizes, handle rollovers & unallocated funds
  const allocation = allocatePrizes(tierPools, matchedEntries);

  return {
    mode,
    drawnNumbers,
    subscriberCount: subscribers.length,
    entryCount: entries.length,
    tierPools,
    allocation,
    matchedEntries,
    winners: allocation.winners,
    diagnostics: {
      frequencyAnalysis: freqAnalysis,
      weights,
    },
  };
}
