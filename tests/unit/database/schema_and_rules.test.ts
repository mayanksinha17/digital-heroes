import { describe, it, expect } from "vitest";

describe("Database Rules & Invariants (DATABASE.md Verification)", () => {
  describe("Stableford Score Constraints (PRD §05 & BR-07)", () => {
    function isValidScore(score: number): boolean {
      return Number.isInteger(score) && score >= 1 && score <= 45;
    }

    it("accepts boundary scores 1 and 45", () => {
      expect(isValidScore(1)).toBe(true);
      expect(isValidScore(45)).toBe(true);
      expect(isValidScore(36)).toBe(true);
    });

    it("rejects scores outside 1–45 range or non-integers", () => {
      expect(isValidScore(0)).toBe(false);
      expect(isValidScore(46)).toBe(false);
      expect(isValidScore(-5)).toBe(false);
      expect(isValidScore(36.5)).toBe(false);
    });
  });

  describe("Draw Number Validation (is_valid_draw_numbers)", () => {
    function isValidDrawNumbers(nums: number[] | null): boolean {
      if (nums === null) return true;
      if (nums.length !== 5) return false;
      const unique = new Set(nums);
      if (unique.size !== 5) return false;
      return nums.every((n) => Number.isInteger(n) && n >= 1 && n <= 45);
    }

    it("validates 5 distinct integers between 1 and 45", () => {
      expect(isValidDrawNumbers([7, 14, 21, 28, 35])).toBe(true);
      expect(isValidDrawNumbers([1, 2, 3, 4, 45])).toBe(true);
    });

    it("rejects duplicates or numbers outside range", () => {
      expect(isValidDrawNumbers([7, 7, 21, 28, 35])).toBe(false); // Duplicate
      expect(isValidDrawNumbers([7, 14, 21, 28])).toBe(false); // Only 4 numbers
      expect(isValidDrawNumbers([7, 14, 21, 28, 46])).toBe(false); // Out of range 46
    });
  });

  describe("5-Score Rolling Window (AT-02 & BR-09)", () => {
    interface ScoreEntry {
      score: number;
      played_on: string;
      created_at: string;
    }

    function trimScores(scores: ScoreEntry[], retainedCount: number = 5): ScoreEntry[] {
      return [...scores]
        .sort((a, b) => {
          if (a.played_on !== b.played_on) {
            return b.played_on.localeCompare(a.played_on);
          }
          return b.created_at.localeCompare(a.created_at);
        })
        .slice(0, retainedCount);
    }

    it("retains newest 5 by played_on date, evicting the oldest automatically", () => {
      const initial: ScoreEntry[] = [
        { score: 32, played_on: "2026-09-01", created_at: "2026-09-01T10:00:00Z" },
        { score: 34, played_on: "2026-09-02", created_at: "2026-09-02T10:00:00Z" },
        { score: 36, played_on: "2026-09-03", created_at: "2026-09-03T10:00:00Z" },
        { score: 38, played_on: "2026-09-04", created_at: "2026-09-04T10:00:00Z" },
        { score: 40, played_on: "2026-09-05", created_at: "2026-09-05T10:00:00Z" },
      ];

      // Add 6th score for 2026-09-06
      const newScore: ScoreEntry = {
        score: 42,
        played_on: "2026-09-06",
        created_at: "2026-09-06T10:00:00Z",
      };

      const updated = trimScores([...initial, newScore], 5);
      expect(updated).toHaveLength(5);
      // Newest should be 2026-09-06, oldest 2026-09-01 should be evicted
      expect(updated[0].played_on).toBe("2026-09-06");
      expect(updated[4].played_on).toBe("2026-09-02");
      expect(updated.some((s) => s.played_on === "2026-09-01")).toBe(false);
    });
  });

  describe("Winner Verification & Payout Invariants (BR-26, BR-27)", () => {
    interface WinnerRow {
      verification_status: "awaiting_proof" | "pending_review" | "approved" | "rejected";
      payment_status: "pending" | "paid";
    }

    function canMarkPaid(winner: WinnerRow): boolean {
      return winner.verification_status === "approved" && winner.payment_status === "pending";
    }

    it("allows marking paid only when verification_status is approved", () => {
      expect(canMarkPaid({ verification_status: "approved", payment_status: "pending" })).toBe(true);
      expect(canMarkPaid({ verification_status: "awaiting_proof", payment_status: "pending" })).toBe(false);
      expect(canMarkPaid({ verification_status: "pending_review", payment_status: "pending" })).toBe(false);
      expect(canMarkPaid({ verification_status: "rejected", payment_status: "pending" })).toBe(false);
    });
  });
});
