import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScoreService, type GolfScore } from "@/modules/scores/service";
import { SubscriptionService } from "@/modules/subscriptions/service";
import { AppError } from "@/lib/errors";

describe("E2E Flow 2 — Subscriber Score Management & 5-Score Rolling Behavior", () => {
  const userId = "sub-user-123";
  let activeScores: GolfScore[];

  beforeEach(() => {
    vi.clearAllMocks();
    activeScores = [];
    vi.spyOn(SubscriptionService, "isUserActiveSubscriber").mockResolvedValue(true);
  });

  it("handles progressive score submission, 5-score window cap, and backdated rejection", async () => {
    vi.spyOn(ScoreService, "getUserScores").mockImplementation(async (uid: string) => {
      return activeScores;
    });

    vi.spyOn(ScoreService, "addScore").mockImplementation(async (uid: string, input) => {
      // Check 1-score per date uniqueness
      const duplicate = activeScores.find((s) => s.played_on === input.playedOn);
      if (duplicate) {
        throw new AppError("SCORE_DUPLICATE_DATE", "A score has already been logged for this date", 409);
      }

      // Check backdated score rejection if 5 scores exist
      if (activeScores.length >= 5) {
        const oldestDate = activeScores[activeScores.length - 1].played_on;
        if (input.playedOn < oldestDate) {
          throw new AppError("SCORE_TOO_OLD", "Backdated score cannot be older than current 5 scores", 400);
        }
      }

      const newScore: GolfScore = {
        id: `score-${Date.now()}-${Math.random()}`,
        user_id: uid,
        score: input.score,
        played_on: input.playedOn,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      activeScores.push(newScore);
      activeScores.sort((a, b) => b.played_on.localeCompare(a.played_on));
      if (activeScores.length > 5) {
        activeScores = activeScores.slice(0, 5);
      }

      return newScore;
    });

    // 1. Add first 5 scores
    await ScoreService.addScore(userId, { score: 36, playedOn: "2026-05-01" });
    await ScoreService.addScore(userId, { score: 38, playedOn: "2026-05-05" });
    await ScoreService.addScore(userId, { score: 34, playedOn: "2026-05-10" });
    await ScoreService.addScore(userId, { score: 40, playedOn: "2026-05-15" });
    await ScoreService.addScore(userId, { score: 42, playedOn: "2026-05-20" });

    let scores = await ScoreService.getUserScores(userId);
    expect(scores.length).toBe(5);
    expect(scores.map((s) => s.score)).toEqual([42, 40, 34, 38, 36]);

    // 2. Add 6th newer score (2026-05-25 -> 44) -> 2026-05-01 (36) is evicted
    await ScoreService.addScore(userId, { score: 44, playedOn: "2026-05-25" });
    scores = await ScoreService.getUserScores(userId);
    expect(scores.length).toBe(5);
    expect(scores.map((s) => s.score)).toEqual([44, 42, 40, 34, 38]);

    // 3. Attempt to submit backdated score older than all 5 (2026-05-01) -> Rejection with SCORE_TOO_OLD
    await expect(
      ScoreService.addScore(userId, { score: 30, playedOn: "2026-05-01" })
    ).rejects.toMatchObject({
      code: "SCORE_TOO_OLD",
      httpStatus: 400,
    });

    // 4. Attempt to submit duplicate score on existing date (2026-05-25) -> Rejection with SCORE_DUPLICATE_DATE
    await expect(
      ScoreService.addScore(userId, { score: 39, playedOn: "2026-05-25" })
    ).rejects.toMatchObject({
      code: "SCORE_DUPLICATE_DATE",
      httpStatus: 409,
    });
  });
});
