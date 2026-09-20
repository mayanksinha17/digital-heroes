import type { RNG } from "./rng";

/**
 * Performs sequential weighted random sampling WITHOUT replacement (PRD §06 Algorithmic Draw).
 * Returns `count` distinct numbers sampled according to their weights.
 */
export function drawWeightedNumbers(
  weights: Record<number, number>,
  rng: RNG,
  count: number = 5
): number[] {
  const candidatePool: Array<{ number: number; weight: number }> = Object.entries(weights)
    .map(([numStr, w]) => ({ number: Number(numStr), weight: Math.max(0, Math.floor(w)) }))
    .filter((item) => item.weight > 0);

  if (candidatePool.length < count) {
    throw new Error(
      `Insufficient candidates with positive weight: required ${count}, available ${candidatePool.length}`
    );
  }

  const selected: number[] = [];

  for (let step = 0; step < count; step++) {
    // 1. Calculate sum of weights for remaining candidates
    let totalWeight = 0;
    for (const item of candidatePool) {
      totalWeight += item.weight;
    }

    if (totalWeight <= 0) {
      throw new Error("Total candidate weight must be positive");
    }

    // 2. Pick a random integer in [0, totalWeight - 1]
    const target = rng.nextInt(0, totalWeight - 1);

    // 3. Find candidate by cumulative weight
    let cumulative = 0;
    let chosenIdx = -1;

    for (let i = 0; i < candidatePool.length; i++) {
      cumulative += candidatePool[i].weight;
      if (target < cumulative) {
        chosenIdx = i;
        break;
      }
    }

    if (chosenIdx === -1) {
      chosenIdx = candidatePool.length - 1;
    }

    // 4. Record selected and remove from pool without replacement
    selected.push(candidatePool[chosenIdx].number);
    candidatePool.splice(chosenIdx, 1);
  }

  return selected.sort((a, b) => a - b);
}
