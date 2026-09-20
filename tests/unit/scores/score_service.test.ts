import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScoreService, type GolfScore } from "@/modules/scores/service";
import { SubscriptionService } from "@/modules/subscriptions/service";
import { AppError } from "@/lib/errors";

// Mock Supabase server and admin clients
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}));

describe("ScoreService Domain Logic (PRD §05 & Decisions D-07, D-10, D-11, D-12)", () => {
  const userId = "user-1111-1111";
  const otherUserId = "user-2222-2222";
  const adminId = "admin-9999-9999";
  const scoreId = "score-aaaa-bbbb";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Subscription Guard Enforcement (D-07, D-12)", () => {
    it("blocks non-subscriber from adding a score", async () => {
      vi.spyOn(SubscriptionService, "isUserActiveSubscriber").mockResolvedValue(false);

      await expect(
        ScoreService.addScore(userId, { score: 36, playedOn: "2024-05-10" })
      ).rejects.toThrow(AppError);

      await expect(
        ScoreService.addScore(userId, { score: 36, playedOn: "2024-05-10" })
      ).rejects.toMatchObject({
        code: "SUBSCRIPTION_REQUIRED",
        httpStatus: 403,
      });
    });

    it("blocks non-subscriber from updating a score", async () => {
      vi.spyOn(SubscriptionService, "isUserActiveSubscriber").mockResolvedValue(false);

      await expect(
        ScoreService.updateScore(userId, scoreId, {
          id: "a0000000-0000-0000-0000-000000000001",
          score: 38,
          playedOn: "2024-05-10",
        })
      ).rejects.toMatchObject({
        code: "SUBSCRIPTION_REQUIRED",
        httpStatus: 403,
      });
    });

    it("blocks non-subscriber from deleting a score", async () => {
      vi.spyOn(SubscriptionService, "isUserActiveSubscriber").mockResolvedValue(false);

      await expect(ScoreService.deleteScore(userId, scoreId)).rejects.toMatchObject({
        code: "SUBSCRIPTION_REQUIRED",
        httpStatus: 403,
      });
    });
  });

  describe("Score Addition for Active Subscribers", () => {
    it("successfully creates score when user is an active subscriber", async () => {
      vi.spyOn(SubscriptionService, "isUserActiveSubscriber").mockResolvedValue(true);

      const fakeScore: GolfScore = {
        id: scoreId,
        user_id: userId,
        score: 38,
        played_on: "2024-05-10",
        created_at: "2024-05-10T12:00:00Z",
        updated_at: "2024-05-10T12:00:00Z",
      };

      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: fakeScore, error: null }),
          }),
        }),
      });

      const result = await ScoreService.addScore(userId, { score: 38, playedOn: "2024-05-10" });
      expect(result.score).toBe(38);
      expect(result.user_id).toBe(userId);
    });

    it("maps duplicate date database violation to SCORE_DUPLICATE_DATE (409)", async () => {
      vi.spyOn(SubscriptionService, "isUserActiveSubscriber").mockResolvedValue(true);

      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: "23505",
                message: 'duplicate key value violates unique constraint "golf_scores_user_id_played_on_key"',
              },
            }),
          }),
        }),
      });

      await expect(
        ScoreService.addScore(userId, { score: 36, playedOn: "2024-05-10" })
      ).rejects.toMatchObject({
        code: "SCORE_DUPLICATE_DATE",
        httpStatus: 409,
      });
    });

    it("maps backdated rejection trigger to SCORE_TOO_OLD (400)", async () => {
      vi.spyOn(SubscriptionService, "isUserActiveSubscriber").mockResolvedValue(true);

      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: "SCORE_TOO_OLD",
              },
            }),
          }),
        }),
      });

      await expect(
        ScoreService.addScore(userId, { score: 36, playedOn: "2024-01-01" })
      ).rejects.toMatchObject({
        code: "SCORE_TOO_OLD",
        httpStatus: 400,
      });
    });

    it("maps future date trigger to SCORE_DATE_IN_FUTURE (400)", async () => {
      vi.spyOn(SubscriptionService, "isUserActiveSubscriber").mockResolvedValue(true);

      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: "SCORE_DATE_IN_FUTURE",
              },
            }),
          }),
        }),
      });

      await expect(
        ScoreService.addScore(userId, { score: 36, playedOn: "2026-12-31" })
      ).rejects.toMatchObject({
        code: "SCORE_DATE_IN_FUTURE",
        httpStatus: 400,
      });
    });
  });

  describe("Ownership & RBAC Validation (Phase 2 & Phase 5)", () => {
    it("prevents user from modifying another user's score", async () => {
      vi.spyOn(SubscriptionService, "isUserActiveSubscriber").mockResolvedValue(true);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: scoreId, user_id: otherUserId },
              error: null,
            }),
          }),
        }),
      });

      await expect(
        ScoreService.updateScore(userId, scoreId, {
          id: "a0000000-0000-0000-0000-000000000001",
          score: 40,
          playedOn: "2024-05-10",
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        httpStatus: 403,
      });
    });

    it("prevents user from deleting another user's score", async () => {
      vi.spyOn(SubscriptionService, "isUserActiveSubscriber").mockResolvedValue(true);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: scoreId, user_id: otherUserId },
              error: null,
            }),
          }),
        }),
      });

      await expect(ScoreService.deleteScore(userId, scoreId)).rejects.toMatchObject({
        code: "FORBIDDEN",
        httpStatus: 403,
      });
    });

    it("allows admin to update user score and records audit trail", async () => {
      const existingScore: GolfScore = {
        id: scoreId,
        user_id: userId,
        score: 32,
        played_on: "2024-05-10",
        created_at: "2024-05-10T12:00:00Z",
        updated_at: "2024-05-10T12:00:00Z",
      };

      const updatedScore: GolfScore = {
        ...existingScore,
        score: 38,
        updated_at: "2024-05-10T14:00:00Z",
      };

      const mockInsertAudit = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === "audit_log") {
          return { insert: mockInsertAudit };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingScore, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedScore, error: null }),
              }),
            }),
          }),
        };
      });

      const res = await ScoreService.adminUpdateUserScore(adminId, userId, scoreId, {
        id: "a0000000-0000-0000-0000-000000000001",
        score: 38,
        playedOn: "2024-05-10",
      });

      expect(res.score).toBe(38);
      expect(mockInsertAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          actor_id: adminId,
          action: "score.admin_edit",
          entity_id: scoreId,
        })
      );
    });
  });

  describe("Score Query Ordering (BR-10 & Reverse Chronological)", () => {
    it("returns scores ordered by played_on descending", async () => {
      const mockScoreList: GolfScore[] = [
        {
          id: "s1",
          user_id: userId,
          score: 35,
          played_on: "2024-05-20",
          created_at: "2024-05-20T10:00:00Z",
          updated_at: "2024-05-20T10:00:00Z",
        },
        {
          id: "s2",
          user_id: userId,
          score: 32,
          played_on: "2024-05-15",
          created_at: "2024-05-15T10:00:00Z",
          updated_at: "2024-05-15T10:00:00Z",
        },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockScoreList, error: null }),
              }),
            }),
          }),
        }),
      });

      const scores = await ScoreService.getUserScores(userId);
      expect(scores).toHaveLength(2);
      expect(scores[0].played_on).toBe("2024-05-20");
      expect(scores[1].played_on).toBe("2024-05-15");
    });
  });
});
