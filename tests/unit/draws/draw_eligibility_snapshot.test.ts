import { describe, it, expect, vi, beforeEach } from "vitest";
import { DrawService } from "@/modules/draws/service";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}));

describe("Draw Operations: Eligibility & Immutable Participant Snapshot (PRD §06 & D-13, D-19)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts active subscribers and filters entrants with >= 5 golf scores", async () => {
    // 3 Active Subscribers:
    // Sub 1: Monthly, holds 5 scores -> Eligible entrant
    // Sub 2: Yearly, holds 5 scores -> Eligible entrant
    // Sub 3: Monthly, holds only 3 scores -> Contributes to pool, but NOT in draw_entries (D-13)
    const activeSubs = [
      {
        user_id: "user-01",
        plan_id: "plan-m",
        status: "active",
        current_period_end: new Date(Date.now() + 86400000 * 10).toISOString(),
        plans: { code: "monthly", price_cents: 49900, interval: "month" },
      },
      {
        user_id: "user-02",
        plan_id: "plan-y",
        status: "active",
        current_period_end: new Date(Date.now() + 86400000 * 10).toISOString(),
        plans: { code: "yearly", price_cents: 499900, interval: "year" },
      },
      {
        user_id: "user-03",
        plan_id: "plan-m",
        status: "active",
        current_period_end: new Date(Date.now() + 86400000 * 10).toISOString(),
        plans: { code: "monthly", price_cents: 49900, interval: "month" },
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "subscriptions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gt: vi.fn().mockResolvedValue({ data: activeSubs, error: null }),
            }),
          }),
        };
      }
      if (table === "golf_scores") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((col: string, userId: string) => {
              let scoreList: Array<{ score: number; played_on: string; created_at: string }> = [];
              if (userId === "user-01") {
                scoreList = [
                  { score: 30, played_on: "2026-02-01", created_at: "2026-02-01T00:00:00Z" },
                  { score: 32, played_on: "2026-02-05", created_at: "2026-02-05T00:00:00Z" },
                  { score: 34, played_on: "2026-02-10", created_at: "2026-02-10T00:00:00Z" },
                  { score: 36, played_on: "2026-02-15", created_at: "2026-02-15T00:00:00Z" },
                  { score: 38, played_on: "2026-02-20", created_at: "2026-02-20T00:00:00Z" },
                ];
              } else if (userId === "user-02") {
                scoreList = [
                  { score: 20, played_on: "2026-02-01", created_at: "2026-02-01T00:00:00Z" },
                  { score: 22, played_on: "2026-02-05", created_at: "2026-02-05T00:00:00Z" },
                  { score: 24, played_on: "2026-02-10", created_at: "2026-02-10T00:00:00Z" },
                  { score: 26, played_on: "2026-02-15", created_at: "2026-02-15T00:00:00Z" },
                  { score: 28, played_on: "2026-02-20", created_at: "2026-02-20T00:00:00Z" },
                ];
              } else if (userId === "user-03") {
                // Only 3 scores
                scoreList = [
                  { score: 15, played_on: "2026-02-01", created_at: "2026-02-01T00:00:00Z" },
                  { score: 17, played_on: "2026-02-05", created_at: "2026-02-05T00:00:00Z" },
                  { score: 19, played_on: "2026-02-10", created_at: "2026-02-10T00:00:00Z" },
                ];
              }
              return {
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: scoreList, error: null }),
                  }),
                }),
              };
            }),
          }),
        };
      }
      return {};
    });

    const { subscribers, entries } = await DrawService.getEligibleParticipantsSnapshot();

    // All 3 active subscribers contribute to the pool
    expect(subscribers).toHaveLength(3);
    expect(subscribers[0].monthlyEquivalentCents).toBe(49900);
    expect(subscribers[1].monthlyEquivalentCents).toBe(41658); // floor(499900 / 12)

    // Only user-01 and user-02 have >= 5 scores and become entrants
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.userId)).toEqual(["user-01", "user-02"]);
    expect(entries[0].scores).toEqual([30, 32, 34, 36, 38]);
  });
});
