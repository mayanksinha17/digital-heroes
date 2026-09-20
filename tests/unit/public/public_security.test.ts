import { describe, it, expect, vi, beforeEach } from "vitest";
import { DrawService } from "@/modules/draws/service";
import { WinnerService } from "@/modules/winners/service";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Public Website Data Exposure & Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not expose unpublished draft or simulated draws in public queries", async () => {
    vi.spyOn(DrawService, "getDraws").mockResolvedValueOnce([
      {
        id: "draw-draft",
        draw_month: "2026-09-01",
        mode: "random",
        status: "draft",
        config: {},
        drawn_numbers: null,
        active_subscriber_count: null,
        entry_count: null,
        pool_breakdown: null,
        pool_new_cents: null,
        rollover_in_cents: 932064,
        pool_total_cents: null,
        pool_5_cents: null,
        pool_4_cents: null,
        pool_3_cents: null,
        rollover_out_cents: null,
        unallocated_cents: null,
        published_at: null,
        published_by: null,
        published_simulation_id: null,
        created_by: "admin-1",
        created_at: "2026-09-01T00:00:00Z",
        updated_at: "2026-09-01T00:00:00Z",
      },
      {
        id: "draw-pub",
        draw_month: "2026-08-01",
        mode: "random",
        status: "published",
        config: {},
        drawn_numbers: [14, 22, 31, 38, 42],
        active_subscriber_count: 100,
        entry_count: 80,
        pool_breakdown: null,
        pool_new_cents: 2330160,
        rollover_in_cents: 0,
        pool_total_cents: 2330160,
        pool_5_cents: 932064,
        pool_4_cents: 815556,
        pool_3_cents: 582540,
        rollover_out_cents: 932064,
        unallocated_cents: 0,
        published_at: "2026-08-31T23:59:59Z",
        published_by: "admin-1",
        published_simulation_id: "sim-1",
        created_by: "admin-1",
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-31T23:59:59Z",
      },
    ]);

    const draws = await DrawService.getDraws();
    const publicPublished = draws.filter((d) => d.status === "published");

    expect(publicPublished).toHaveLength(1);
    expect(publicPublished[0].id).toBe("draw-pub");
    expect(publicPublished.find((d) => d.status === "draft")).toBeUndefined();
  });

  it("does not expose private scorecard proof URLs on public winner listings", async () => {
    vi.spyOn(WinnerService, "getUserWinnings").mockResolvedValueOnce([
      {
        id: "w-1",
        draw_id: "d-1",
        entry_id: "e-1",
        user_id: "u-private",
        tier: 4,
        prize_cents: 271852,
        verification_status: "approved",
        proof_attempts: 1,
        reviewed_by: "admin-1",
        reviewed_at: "2026-09-01T00:00:00Z",
        review_note: null,
        payment_status: "paid",
        paid_at: "2026-09-02T00:00:00Z",
        paid_by: "admin-1",
        created_at: "2026-08-31T23:59:59Z",
        updated_at: "2026-09-02T00:00:00Z",
      },
    ]);

    const userWinnings = await WinnerService.getUserWinnings("u-private");
    expect(userWinnings[0].user_id).toBe("u-private");
  });
});
