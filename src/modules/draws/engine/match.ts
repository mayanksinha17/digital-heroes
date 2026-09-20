export type DrawTier = 5 | 4 | 3;

export interface MatchResult {
  userId: string;
  scores: number[];
  matchCount: number;
  matchedNumbers: number[];
  tier: DrawTier | null;
}

/**
 * Counts the number of matches between a user's distinct scores and the drawn numbers (PRD §06 & D-14, D-15).
 * Match count = size of the set intersection of distinct score values and drawn numbers.
 */
export function countMatches(userScores: number[], drawnNumbers: number[]): number {
  const distinctScores = new Set(userScores);
  const drawnSet = new Set(drawnNumbers);

  let matches = 0;
  for (const num of distinctScores) {
    if (drawnSet.has(num)) {
      matches++;
    }
  }

  return matches;
}

/**
 * Returns the matching numbers between user scores and drawn numbers.
 */
export function getMatchedNumbers(userScores: number[], drawnNumbers: number[]): number[] {
  const distinctScores = Array.from(new Set(userScores));
  const drawnSet = new Set(drawnNumbers);

  return distinctScores.filter((num) => drawnSet.has(num)).sort((a, b) => a - b);
}

/**
 * Determines the winning tier based on match count (PRD §06).
 * 5 matches -> Tier 5 (Jackpot)
 * 4 matches -> Tier 4
 * 3 matches -> Tier 3
 * <= 2 matches -> null
 */
export function getMatchTier(matchCount: number): DrawTier | null {
  if (matchCount === 5) return 5;
  if (matchCount === 4) return 4;
  if (matchCount === 3) return 3;
  return null;
}

/**
 * Evaluates a single participant entry against drawn numbers.
 */
export function evaluateEntry(
  userId: string,
  scores: number[],
  drawnNumbers: number[]
): MatchResult {
  const matchCount = countMatches(scores, drawnNumbers);
  const matchedNumbers = getMatchedNumbers(scores, drawnNumbers);
  const tier = getMatchTier(matchCount);

  return {
    userId,
    scores,
    matchCount,
    matchedNumbers,
    tier,
  };
}
