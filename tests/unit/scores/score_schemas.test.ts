import { describe, it, expect } from "vitest";
import {
  scoreValueSchema,
  playedDateSchema,
  createScoreSchema,
  updateScoreSchema,
  deleteScoreSchema,
} from "@/modules/scores/schemas";

describe("Score Domain Schemas Validation", () => {
  describe("Stableford Score Value Validation (1–45)", () => {
    it("accepts boundary minimum score of 1", () => {
      const res = scoreValueSchema.safeParse(1);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe(1);
      }
    });

    it("accepts boundary maximum score of 45", () => {
      const res = scoreValueSchema.safeParse(45);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe(45);
      }
    });

    it("accepts valid mid-range score of 36", () => {
      const res = scoreValueSchema.safeParse(36);
      expect(res.success).toBe(true);
    });

    it("rejects score below 1 (0)", () => {
      const res = scoreValueSchema.safeParse(0);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("Minimum Stableford score is 1");
      }
    });

    it("rejects negative score (-5)", () => {
      const res = scoreValueSchema.safeParse(-5);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("Minimum Stableford score is 1");
      }
    });

    it("rejects score above 45 (46)", () => {
      const res = scoreValueSchema.safeParse(46);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("Maximum Stableford score is 45");
      }
    });

    it("rejects non-integer / floating point scores (36.5)", () => {
      const res = scoreValueSchema.safeParse(36.5);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("must be an integer");
      }
    });

    it("rejects string or null inputs", () => {
      const resStr = scoreValueSchema.safeParse("36");
      expect(resStr.success).toBe(false);

      const resNull = scoreValueSchema.safeParse(null);
      expect(resNull.success).toBe(false);
    });
  });

  describe("Played Date Validation (YYYY-MM-DD & No Future Dates)", () => {
    it("accepts today's date", () => {
      const today = new Date().toISOString().split("T")[0];
      const res = playedDateSchema.safeParse(today);
      expect(res.success).toBe(true);
    });

    it("accepts a past date", () => {
      const pastDate = "2024-01-15";
      const res = playedDateSchema.safeParse(pastDate);
      expect(res.success).toBe(true);
    });

    it("rejects a future date", () => {
      const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];
      const res = playedDateSchema.safeParse(tomorrow);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("Score date cannot be in the future");
      }
    });

    it("rejects invalid date formats", () => {
      const res1 = playedDateSchema.safeParse("15/01/2024");
      expect(res1.success).toBe(false);

      const res2 = playedDateSchema.safeParse("invalid-date");
      expect(res2.success).toBe(false);
    });
  });

  describe("Create, Update, and Delete Composite Schemas", () => {
    it("validates valid createScore input", () => {
      const res = createScoreSchema.safeParse({
        score: 38,
        playedOn: "2024-05-10",
      });
      expect(res.success).toBe(true);
    });

    it("fails createScore when missing score or playedOn", () => {
      const resMissingScore = createScoreSchema.safeParse({ playedOn: "2024-05-10" });
      expect(resMissingScore.success).toBe(false);

      const resMissingDate = createScoreSchema.safeParse({ score: 38 });
      expect(resMissingDate.success).toBe(false);
    });

    it("validates updateScore with valid UUID", () => {
      const res = updateScoreSchema.safeParse({
        id: "a0000000-0000-0000-0000-000000000001",
        score: 42,
        playedOn: "2024-05-12",
      });
      expect(res.success).toBe(true);
    });

    it("rejects updateScore with non-UUID id", () => {
      const res = updateScoreSchema.safeParse({
        id: "not-a-uuid",
        score: 42,
        playedOn: "2024-05-12",
      });
      expect(res.success).toBe(false);
    });

    it("validates deleteScore schema", () => {
      const res = deleteScoreSchema.safeParse({
        id: "a0000000-0000-0000-0000-000000000001",
      });
      expect(res.success).toBe(true);
    });
  });
});
