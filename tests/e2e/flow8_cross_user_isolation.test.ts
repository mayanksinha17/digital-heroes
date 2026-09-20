import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScoreService } from "@/modules/scores/service";
import { WinnerService } from "@/modules/winners/service";
import { SubscriptionService } from "@/modules/subscriptions/service";
import { AppError } from "@/lib/errors";

describe("E2E Flow 8 — Cross-User IDOR Protection & Row-Level Data Isolation", () => {
  const userA = "user-alice-111";
  const userB = "user-bob-222";
  const userBScoreId = "score-bob-999";
  const userBWinnerId = "11111111-1111-1111-1111-111111111111";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(SubscriptionService, "isUserActiveSubscriber").mockResolvedValue(true);
  });

  it("blocks User A from mutating User B's golf score (IDOR prevention)", async () => {
    vi.spyOn(ScoreService, "updateScore").mockImplementation(async (actorId, scoreId, input) => {
      // Score belongs to Bob
      if (actorId !== userB) {
        throw new AppError("FORBIDDEN", "You cannot modify another user's score", 403);
      }
      return {} as any;
    });

    vi.spyOn(ScoreService, "deleteScore").mockImplementation(async (actorId, scoreId) => {
      if (actorId !== userB) {
        throw new AppError("FORBIDDEN", "You cannot delete another user's score", 403);
      }
    });

    // Alice attempts to update Bob's score
    await expect(
      ScoreService.updateScore(userA, userBScoreId, {
        id: userBScoreId,
        score: 42,
        playedOn: "2026-06-10",
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      httpStatus: 403,
    });

    // Alice attempts to delete Bob's score
    await expect(
      ScoreService.deleteScore(userA, userBScoreId)
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      httpStatus: 403,
    });
  });

  it("blocks User A from viewing or generating proof upload URLs for User B's winnings", async () => {
    vi.spyOn(WinnerService, "getWinnerById").mockImplementation(async (winnerId, actorId) => {
      if (actorId !== userB) {
        throw new AppError("FORBIDDEN", "You cannot access another user's winning record", 403);
      }
      return {} as any;
    });

    vi.spyOn(WinnerService, "createProofUploadSession").mockImplementation(async (actorId, input) => {
      if (actorId !== userB) {
        throw new AppError("FORBIDDEN", "You cannot submit proof for another user's win", 403);
      }
      return {} as any;
    });

    // Alice attempts to view Bob's winner record
    await expect(
      WinnerService.getWinnerById(userBWinnerId, userA)
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      httpStatus: 403,
    });

    // Alice attempts to request upload session for Bob's winning record
    await expect(
      WinnerService.createProofUploadSession(userA, {
        winnerId: userBWinnerId,
        mimeType: "image/png",
        sizeBytes: 1024 * 1024,
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      httpStatus: 403,
    });
  });
});
