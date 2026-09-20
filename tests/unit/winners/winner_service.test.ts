import { describe, it, expect, vi, beforeEach } from "vitest";
import { WinnerService } from "@/modules/winners/service";
import { AppError } from "@/lib/errors";
import type { DrawWinnerRow } from "@/modules/winners/types";

const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockCreateSignedUploadUrl = vi.fn();
const mockCreateSignedUrl = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
    storage: {
      from: () => ({
        createSignedUploadUrl: mockCreateSignedUploadUrl,
        createSignedUrl: mockCreateSignedUrl,
      }),
    },
  }),
}));

describe("WinnerService Domain & Security (PRD §09 & D-07, D-32, D-34)", () => {
  const userId = "user-1111-1111";
  const otherUserId = "user-2222-2222";
  const adminId = "admin-9999-9999";
  const winnerId = "winner-aaaa-bbbb";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Ownership & Proof Upload Session Security", () => {
    it("allows winner to request signed upload session for their own win", async () => {
      const winnerRow: Partial<DrawWinnerRow> = {
        id: winnerId,
        user_id: userId,
        tier: 5,
        prize_cents: 1864128,
        verification_status: "awaiting_proof",
        proof_attempts: 0,
        payment_status: "pending",
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: winnerRow, error: null }),
          }),
        }),
      });

      mockCreateSignedUploadUrl.mockResolvedValue({
        data: { signedUrl: "https://storage.supabase.co/upload-url" },
        error: null,
      });

      const session = await WinnerService.createProofUploadSession(userId, {
        winnerId,
        mimeType: "image/png",
        sizeBytes: 1500000,
      });

      expect(session.winnerId).toBe(winnerId);
      expect(session.attemptNo).toBe(1);
      expect(session.storagePath).toBe(`${userId}/${winnerId}/attempt-1.png`);
    });

    it("blocks user from requesting upload session for another user's win (IDOR)", async () => {
      const winnerRow: Partial<DrawWinnerRow> = {
        id: winnerId,
        user_id: otherUserId, // Different user
        tier: 5,
        verification_status: "awaiting_proof",
        proof_attempts: 0,
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: winnerRow, error: null }),
          }),
        }),
      });

      await expect(
        WinnerService.createProofUploadSession(userId, {
          winnerId,
          mimeType: "image/png",
          sizeBytes: 1500000,
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        httpStatus: 403,
      });
    });

    it("enforces max 3 attempts limit (Decision D-32)", async () => {
      const winnerRow: Partial<DrawWinnerRow> = {
        id: winnerId,
        user_id: userId,
        tier: 5,
        verification_status: "rejected",
        proof_attempts: 3, // Already used 3 attempts
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: winnerRow, error: null }),
          }),
        }),
      });

      await expect(
        WinnerService.createProofUploadSession(userId, {
          winnerId,
          mimeType: "image/png",
          sizeBytes: 1500000,
        })
      ).rejects.toMatchObject({
        code: "PROOF_ATTEMPTS_EXCEEDED",
        httpStatus: 400,
      });
    });

    it("blocks proof upload when winner is already approved or paid", async () => {
      const approvedWinner: Partial<DrawWinnerRow> = {
        id: winnerId,
        user_id: userId,
        verification_status: "approved",
        proof_attempts: 1,
        payment_status: "pending",
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: approvedWinner, error: null }),
          }),
        }),
      });

      await expect(
        WinnerService.createProofUploadSession(userId, {
          winnerId,
          mimeType: "image/png",
          sizeBytes: 1500000,
        })
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        httpStatus: 400,
      });
    });
  });

  describe("Admin Review & Payout Operations", () => {
    it("calls review_winner RPC with approved status", async () => {
      mockRpc.mockResolvedValue({ error: null });

      await WinnerService.adminReviewWinner(adminId, {
        winnerId,
        status: "approved",
        note: "Card verified",
      });

      expect(mockRpc).toHaveBeenCalledWith("review_winner", {
        p_winner_id: winnerId,
        p_admin_id: adminId,
        p_status: "approved",
        p_note: "Card verified",
      });
    });

    it("calls mark_winner_paid RPC when approved", async () => {
      mockRpc.mockResolvedValue({ error: null });

      await WinnerService.adminMarkWinnerPaid(adminId, winnerId);

      expect(mockRpc).toHaveBeenCalledWith("mark_winner_paid", {
        p_winner_id: winnerId,
        p_admin_id: adminId,
      });
    });

    it("maps database exception when trying to mark paid before approval", async () => {
      mockRpc.mockResolvedValue({
        error: {
          code: "P0003",
          message: "PAYOUT_NOT_APPROVED: Winner proof must be approved before payout",
        },
      });

      await expect(
        WinnerService.adminMarkWinnerPaid(adminId, winnerId)
      ).rejects.toMatchObject({
        code: "PAYOUT_NOT_APPROVED",
        httpStatus: 400,
      });
    });
  });
});
