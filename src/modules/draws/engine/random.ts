import type { RNG } from "./rng";

/**
 * Generates N distinct numbers uniformly at random from [min, max] (PRD §06 Random Draw).
 * Default: 5 distinct numbers between 1 and 45.
 */
export function drawRandomNumbers(
  rng: RNG,
  count: number = 5,
  min: number = 1,
  max: number = 45
): number[] {
  if (count <= 0) {
    throw new Error("Draw count must be greater than 0");
  }
  const totalAvailable = max - min + 1;
  if (count > totalAvailable) {
    throw new Error(`Cannot sample ${count} distinct numbers from a range of ${totalAvailable}`);
  }

  // Generate candidate pool
  const pool: number[] = Array.from({ length: totalAvailable }, (_, i) => min + i);
  const selected: number[] = [];

  for (let i = 0; i < count; i++) {
    const pickIdx = rng.nextInt(0, pool.length - 1);
    selected.push(pool[pickIdx]);
    // Swap with last element and pop (Fisher-Yates selection step)
    pool[pickIdx] = pool[pool.length - 1];
    pool.pop();
  }

  return selected.sort((a, b) => a - b);
}
