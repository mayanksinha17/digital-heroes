import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/lib/errors";
import { ScoreService } from "@/modules/scores/service";
import { WinnerService } from "@/modules/winners/service";
import { AuthService } from "@/modules/auth/service";

// Mock Supabase clients
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe("Dashboard Security & Cross-User Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks non-admin user from querying another user's scores", async () => {
    const victimUserId = "victim-user-456";
    const attackerUserId = "attacker-user-789";

    vi.spyOn(AuthService, "getProfileById").mockResolvedValueOnce({
      id: attackerUserId,
      email: "attacker@test.com",
      role: "subscriber",
      full_name: "Attacker",
      charity_id: null,
      charity_percent: 10,
      stripe_customer_id: null,
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-09-01T00:00:00Z",
    });

    vi.spyOn(ScoreService, "updateScore").mockRejectedValueOnce(
      new AppError("FORBIDDEN", "You can only modify your own scores", 403)
    );

    await expect(
      ScoreService.updateScore(attackerUserId, "score-123", {
        id: "score-123",
        score: 40,
        playedOn: "2026-09-15",
      })
    ).rejects.toThrowError("You can only modify your own scores");
  });

  it("blocks non-admin user from querying or accessing another user's winnings", async () => {
    const attackerUserId = "attacker-user-789";

    vi.spyOn(WinnerService, "getWinnerById").mockRejectedValueOnce(
      new AppError("FORBIDDEN", "You do not have permission to view this winning entry", 403)
    );

    await expect(
      WinnerService.getWinnerById("winner-belonging-to-other-user", attackerUserId)
    ).rejects.toThrowError("You do not have permission to view this winning entry");
  });

  it("prevents non-admin from approving or marking paid on winnings", async () => {
    const attackerUserId = "attacker-user-789";

    vi.spyOn(AuthService, "getProfileById").mockResolvedValueOnce({
      id: attackerUserId,
      email: "attacker@test.com",
      role: "subscriber",
      full_name: "Attacker",
      charity_id: null,
      charity_percent: 10,
      stripe_customer_id: null,
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-09-01T00:00:00Z",
    });

    vi.spyOn(WinnerService, "adminReviewWinner").mockRejectedValueOnce(
      new AppError("FORBIDDEN", "Admin authorization required", 403)
    );

    await expect(
      WinnerService.adminReviewWinner(attackerUserId, {
        winnerId: "w-1",
        status: "approved",
      })
    ).rejects.toThrowError("Admin authorization required");
  });
});
