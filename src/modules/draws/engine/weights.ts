export interface WeightOptions {
  bias?: "frequent" | "rare";
  smoothing?: number;
  minScore?: number;
  maxScore?: number;
}

export interface FrequencyAnalysis {
  frequencies: Record<number, number>;
  totalScoreTokens: number;
  maxFrequency: number;
  minFrequency: number;
}

/**
 * Computes frequency distribution of numbers across all participant entry scores (PRD §06 & D-17).
 */
export function computeScoreFrequencies(
  entries: Array<{ scores: number[] }>,
  minScore: number = 1,
  maxScore: number = 45
): FrequencyAnalysis {
  const frequencies: Record<number, number> = {};
  for (let num = minScore; num <= maxScore; num++) {
    frequencies[num] = 0;
  }

  let totalScoreTokens = 0;
  for (const entry of entries) {
    for (const score of entry.scores) {
      if (score >= minScore && score <= maxScore) {
        frequencies[score] = (frequencies[score] || 0) + 1;
        totalScoreTokens++;
      }
    }
  }

  const values = Object.values(frequencies);
  const maxFrequency = values.length > 0 ? Math.max(...values) : 0;
  const minFrequency = values.length > 0 ? Math.min(...values) : 0;

  return {
    frequencies,
    totalScoreTokens,
    maxFrequency,
    minFrequency,
  };
}

/**
 * Converts frequency distribution into integer weights based on configured bias (frequent vs rare)
 * and smoothing parameter (Decision D-17).
 */
export function buildScoreWeights(
  analysis: FrequencyAnalysis,
  options: WeightOptions = {}
): Record<number, number> {
  const bias = options.bias || "frequent";
  const smoothing = Math.max(1, Math.floor(options.smoothing ?? 1));
  const minScore = options.minScore || 1;
  const maxScore = options.maxScore || 45;

  const weights: Record<number, number> = {};

  for (let num = minScore; num <= maxScore; num++) {
    const freq = analysis.frequencies[num] || 0;
    if (bias === "frequent") {
      // Frequent: Common scores get higher weights
      weights[num] = freq + smoothing;
    } else {
      // Rare: Less common scores get higher weights
      weights[num] = analysis.maxFrequency - freq + smoothing;
    }
  }

  return weights;
}
