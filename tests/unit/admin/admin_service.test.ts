import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminService } from "@/modules/admin/service";

// Mock Supabase admin client
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe("AdminService Metrics, Users & Audit Logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates dashboard financial KPIs and user counts accurately", async () => {
    vi.spyOn(AdminService, "getDashboardMetrics").mockResolvedValueOnce({
      users: {
        total: 100,
        subscribers: 80,
        nonSubscribers: 20,
        active: 80,
        pastDue: 0,
        canceled: 0,
      },
      finances: {
        totalGrossRevenueCents: 4990000,           // ₹49,900.00
        totalCharityContributionsCents: 748500,    // ₹7,485.00 (15% avg)
        totalDirectDonationsCents: 100000,         // ₹1,000.00
        totalPrizePoolsCents: 2495000,             // ₹24,950.00 (50% share)
        totalPaidDisbursedCents: 1500000,          // ₹15,000.00
        totalPendingPayoutsCents: 995000,          // ₹9,950.00
      },
      draws: {
        total: 3,
        published: 2,
        simulated: 1,
        draft: 0,
        currentRolloverCents: 500000,
      },
      winners: {
        total: 12,
        awaitingProof: 2,
        pendingReview: 3,
        approved: 4,
        rejected: 1,
        paid: 2,
      },
    });

    const metrics = await AdminService.getDashboardMetrics();
    expect(metrics.users.total).toBe(100);
    expect(metrics.users.active).toBe(80);
    expect(metrics.finances.totalGrossRevenueCents).toBe(4990000);
    expect(metrics.finances.totalCharityContributionsCents).toBe(748500);
    expect(metrics.finances.totalPrizePoolsCents).toBe(2495000);
    expect(metrics.winners.pendingReview).toBe(3);
  });

  it("retrieves paginated and filtered user list", async () => {
    vi.spyOn(AdminService, "getUsers").mockResolvedValueOnce({
      users: [
        {
          id: "u-1",
          email: "golfer1@test.com",
          fullName: "Tiger Woods",
          role: "subscriber",
          charityId: "c-1",
          charityPercent: 15,
          charityName: "Junior Golf Foundation",
          subscriptionStatus: "active",
          planCode: "monthly",
          currentPeriodEnd: "2026-10-01T00:00:00Z",
          scoreCount: 5,
          winningsCount: 1,
          totalWonCents: 271852,
          createdAt: "2026-08-01T00:00:00Z",
        },
      ],
      totalCount: 1,
    });

    const { users, totalCount } = await AdminService.getUsers({ query: "tiger" });
    expect(totalCount).toBe(1);
    expect(users[0].fullName).toBe("Tiger Woods");
    expect(users[0].scoreCount).toBe(5);
    expect(users[0].totalWonCents).toBe(271852);
  });

  it("retrieves comprehensive 360-degree user detail", async () => {
    vi.spyOn(AdminService, "getUserDetail").mockResolvedValueOnce({
      id: "u-1",
      email: "golfer1@test.com",
      fullName: "Tiger Woods",
      role: "subscriber",
      charityId: "c-1",
      charityPercent: 15,
      charityName: "Junior Golf Foundation",
      subscriptionStatus: "active",
      planCode: "monthly",
      currentPeriodEnd: "2026-10-01T00:00:00Z",
      scoreCount: 5,
      winningsCount: 1,
      totalWonCents: 271852,
      createdAt: "2026-08-01T00:00:00Z",
      scores: [
        { id: "s1", score: 38, playedOn: "2026-09-10", createdAt: "2026-09-10T00:00:00Z" },
      ],
      winnings: [
        {
          id: "w1",
          drawMonth: "2026-08-01",
          tier: 4,
          prizeCents: 271852,
          verificationStatus: "approved",
          paymentStatus: "paid",
          createdAt: "2026-08-31T23:59:59Z",
        },
      ],
      drawEntries: [
        { id: "e1", drawMonth: "2026-08-01", scores: [38, 36, 34, 32, 40], matchCount: 4, tier: 4 },
      ],
      paymentLedger: [
        { id: "p1", invoiceId: "in_123", grossCents: 49900, charityCents: 7485, paidAt: "2026-09-01T00:00:00Z" },
      ],
    });

    const user = await AdminService.getUserDetail("u-1");
    expect(user).not.toBeNull();
    expect(user?.scores).toHaveLength(1);
    expect(user?.winnings[0].prizeCents).toBe(271852);
    expect(user?.paymentLedger[0].charityCents).toBe(7485);
  });

  it("retrieves filtered audit logs", async () => {
    vi.spyOn(AdminService, "getAuditLogs").mockResolvedValueOnce({
      logs: [
        {
          id: "log-1",
          actorId: "admin-1",
          actorEmail: "admin@digitalheroes.com",
          action: "draw.publish",
          entityType: "draws",
          entityId: "draw-2026-08",
          beforeData: { status: "simulated" },
          afterData: { status: "published" },
          createdAt: "2026-08-31T23:59:59Z",
        },
      ],
      totalCount: 1,
    });

    const { logs, totalCount } = await AdminService.getAuditLogs({ entityType: "draws" });
    expect(totalCount).toBe(1);
    expect(logs[0].action).toBe("draw.publish");
    expect(logs[0].actorEmail).toBe("admin@digitalheroes.com");
  });
});
