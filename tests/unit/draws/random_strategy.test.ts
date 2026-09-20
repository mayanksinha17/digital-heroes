import { describe, it, expect } from "vitest";
import { drawRandomNumbers } from "@/modules/draws/engine/random";
import { SeededRNG, CryptoRNG } from "@/modules/draws/engine/rng";

describe("Draw Engine: Random Strategy (PRD §06 & D-16)", () => {
  it("generates exactly 5 distinct numbers within range [1, 45]", () => {
    const rng = new CryptoRNG();
    const numbers = drawRandomNumbers(rng, 5, 1, 45);

    expect(numbers).toHaveLength(5);

    // Strict uniqueness
    const unique = new Set(numbers);
    expect(unique.size).toBe(5);

    // Boundary check
    for (const num of numbers) {
      expect(Number.isInteger(num)).toBe(true);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(45);
    }

    // Sorted in ascending order
    for (let i = 0; i < numbers.length - 1; i++) {
      expect(numbers[i]).toBeLessThan(numbers[i + 1]);
    }
  });

  it("produces identical results with deterministic seeded RNG", () => {
    const seed = "digital-heroes-seed-2026";
    const rng1 = new SeededRNG(seed);
    const rng2 = new SeededRNG(seed);

    const draw1 = drawRandomNumbers(rng1, 5, 1, 45);
    const draw2 = drawRandomNumbers(rng2, 5, 1, 45);

    expect(draw1).toEqual(draw2);
  });

  it("produces different numbers with different seeds", () => {
    const rng1 = new SeededRNG("seed-alpha");
    const rng2 = new SeededRNG("seed-beta");

    const draw1 = drawRandomNumbers(rng1, 5, 1, 45);
    const draw2 = drawRandomNumbers(rng2, 5, 1, 45);

    expect(draw1).not.toEqual(draw2);
  });

  it("rejects invalid count requests", () => {
    const rng = new CryptoRNG();
    expect(() => drawRandomNumbers(rng, 0, 1, 45)).toThrow("greater than 0");
    expect(() => drawRandomNumbers(rng, 50, 1, 45)).toThrow("Cannot sample 50 distinct numbers");
  });
});
