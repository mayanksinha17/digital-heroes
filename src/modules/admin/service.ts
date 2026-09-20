import { createAdminClient } from "@/lib/supabase/admin";
import { AppError, mapDbError } from "@/lib/errors";
import type {
  AdminDashboardMetrics,
  AdminUserListItem,
  AdminUserDetail,
  AuditLogItem,
} from "./types";
import type { DrawRow, DrawSimulationRow } from "@/modules/draws/types";
import type { UserRole, SubscriptionStatus, VerificationStatus, PaymentStatus } from "@/types/database";

export class AdminService {
  /**
   * Retrieves high-level KPIs and financial aggregates directly from Postgres tables
   */
  static async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const supabase = createAdminClient();

    // 1. Users & Subscriptions metrics
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, role");
    if (pErr) throw mapDbError(pErr);

    const { data: subs, error: sErr } = await supabase
      .from("subscriptions")
      .select("user_id, status, current_period_end");
    if (sErr) throw mapDbError(sErr);

    const totalUsers = profiles?.length || 0;
    const activeSubs = (subs || []).filter(
      (s) => s.status === "active" && (!s.current_period_end || new Date(s.current_period_end) > new Date())
    );
    const pastDueSubs = (subs || []).filter((s) => s.status === "past_due");
    const canceledSubs = (subs || []).filter((s) => s.status === "canceled");

    // 2. Financial Metrics from Subscription Payments & Donations
    const { data: payments, error: payErr } = await supabase
      .from("subscription_payments")
      .select("gross_cents, charity_cents");
    if (payErr) throw mapDbError(payErr);

    const { data: donations, error: donErr } = await supabase
      .from("donations")
      .select("amount_cents, status")
      .eq("status", "completed");
    if (donErr) throw mapDbError(donErr);

    const totalGrossRevenueCents = (payments || []).reduce(
      (acc, curr) => acc + Number(curr.gross_cents || 0),
      0
    );
    const totalCharityFromInvoicesCents = (payments || []).reduce(
      (acc, curr) => acc + Number(curr.charity_cents || 0),
      0
    );
    const totalDirectDonationsCents = (donations || []).reduce(
      (acc, curr) => acc + Number(curr.amount_cents || 0),
      0
    );

    // 3. Draws & Rollover
    const { data: draws, error: dErr } = await supabase
      .from("draws")
      .select("status, pool_total_cents, rollover_out_cents, rollover_in_cents");
    if (dErr) throw mapDbError(dErr);

    const publishedDraws = (draws || []).filter((d) => d.status === "published");
    const simulatedDraws = (draws || []).filter((d) => d.status === "simulated");
    const draftDraws = (draws || []).filter((d) => d.status === "draft");

    const totalPrizePoolsCents = publishedDraws.reduce(
      (acc, curr) => acc + Number(curr.pool_total_cents || 0),
      0
    );

    // Latest published draw rollover
    const latestPublished = publishedDraws[publishedDraws.length - 1];
    const currentRolloverCents = Number(latestPublished?.rollover_out_cents || 0);

    // 4. Winners & Payouts
    const { data: winners, error: wErr } = await supabase
      .from("draw_winners")
      .select("prize_cents, verification_status, payment_status");
    if (wErr) throw mapDbError(wErr);

    const totalPaidDisbursedCents = (winners || [])
      .filter((w) => w.payment_status === "paid")
      .reduce((acc, curr) => acc + Number(curr.prize_cents || 0), 0);

    const totalPendingPayoutsCents = (winners || [])
      .filter((w) => w.payment_status === "pending" && w.verification_status === "approved")
      .reduce((acc, curr) => acc + Number(curr.prize_cents || 0), 0);

    return {
      users: {
        total: totalUsers,
        subscribers: activeSubs.length,
        nonSubscribers: totalUsers - activeSubs.length,
        active: activeSubs.length,
        pastDue: pastDueSubs.length,
        canceled: canceledSubs.length,
      },
      finances: {
        totalGrossRevenueCents,
        totalCharityContributionsCents: totalCharityFromInvoicesCents + totalDirectDonationsCents,
        totalDirectDonationsCents,
        totalPrizePoolsCents,
        totalPaidDisbursedCents,
        totalPendingPayoutsCents,
      },
      draws: {
        total: (draws || []).length,
        published: publishedDraws.length,
        simulated: simulatedDraws.length,
        draft: draftDraws.length,
        currentRolloverCents,
      },
      winners: {
        total: (winners || []).length,
        awaitingProof: (winners || []).filter((w) => w.verification_status === "awaiting_proof").length,
        pendingReview: (winners || []).filter((w) => w.verification_status === "pending_review").length,
        approved: (winners || []).filter((w) => w.verification_status === "approved").length,
        rejected: (winners || []).filter((w) => w.verification_status === "rejected").length,
        paid: (winners || []).filter((w) => w.payment_status === "paid").length,
      },
    };
  }

  /**
   * Retrieves paginated list of platform users with subscription and score counts
   */
  static async getUsers(options?: {
    query?: string;
    role?: UserRole;
    limit?: number;
    offset?: number;
  }): Promise<{ users: AdminUserListItem[]; totalCount: number }> {
    const supabase = createAdminClient();
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    let dbQuery = supabase
      .from("profiles")
      .select(
        `
        id,
        email,
        full_name,
        role,
        charity_id,
        charity_percent,
        created_at,
        charities(name),
        subscriptions(status, current_period_end, plans(code)),
        golf_scores(count),
        draw_winners(prize_cents)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.role) {
      dbQuery = dbQuery.eq("role", options.role);
    }

    if (options?.query) {
      dbQuery = dbQuery.or(
        `email.ilike.%${options.query}%,full_name.ilike.%${options.query}%`
      );
    }

    const { data, count, error } = await dbQuery;
    if (error) throw mapDbError(error);

    const users: AdminUserListItem[] = (data || []).map((row: Record<string, unknown>) => {
      const sub = Array.isArray(row.subscriptions)
        ? (row.subscriptions[0] as Record<string, unknown> | undefined)
        : (row.subscriptions as Record<string, unknown> | null);
      const charity = row.charities as { name?: string } | null;
      const scoreRows = row.golf_scores as Array<{ count?: number }> | undefined;
      const scoreCount = Array.isArray(scoreRows)
        ? scoreRows[0]?.count || 0
        : 0;

      const winnings = (Array.isArray(row.draw_winners) ? row.draw_winners : []) as Array<{ prize_cents?: number }>;
      const totalWonCents = winnings.reduce(
        (acc: number, curr: { prize_cents?: number }) => acc + Number(curr.prize_cents || 0),
        0
      );

      const plansObj = sub?.plans as { code?: string } | undefined;

      return {
        id: String(row.id),
        email: String(row.email || ""),
        fullName: String(row.full_name || ""),
        role: (row.role as UserRole) || "subscriber",
        charityId: (row.charity_id as string) || null,
        charityPercent: Number(row.charity_percent) || 10,
        charityName: charity?.name || null,
        subscriptionStatus: (sub?.status as SubscriptionStatus) || "none",
        planCode: plansObj?.code || null,
        currentPeriodEnd: (sub?.current_period_end as string) || null,
        scoreCount: Number(scoreCount),
        winningsCount: winnings.length,
        totalWonCents,
        createdAt: String(row.created_at),
      };
    });

    return {
      users,
      totalCount: count || users.length,
    };
  }

  /**
   * Retrieves single user complete detail snapshot
   */
  static async getUserDetail(userId: string): Promise<AdminUserDetail | null> {
    const supabase = createAdminClient();

    // 1. Profile
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("*, charities(name)")
      .eq("id", userId)
      .single();

    if (pErr || !profile) return null;

    // 2. Subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*, plans(code)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Scores
    const { data: scores } = await supabase
      .from("golf_scores")
      .select("id, score, played_on, created_at")
      .eq("user_id", userId)
      .order("played_on", { ascending: false })
      .order("created_at", { ascending: false });

    // 4. Winnings
    const { data: winnings } = await supabase
      .from("draw_winners")
      .select("id, tier, prize_cents, verification_status, payment_status, created_at, draws(draw_month)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // 5. Draw entries
    const { data: drawEntries } = await supabase
      .from("draw_entries")
      .select("id, scores, match_count, tier, draws(draw_month)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // 6. Payments
    const { data: payments } = await supabase
      .from("subscription_payments")
      .select("id, stripe_invoice_id, gross_cents, charity_cents, paid_at")
      .eq("user_id", userId)
      .order("paid_at", { ascending: false });

    const totalWonCents = (winnings || []).reduce(
      (acc, curr) => acc + Number(curr.prize_cents || 0),
      0
    );

    const charityObj = profile.charities as { name?: string } | null;
    const planObj = sub?.plans as { code?: string } | null;

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      charityId: profile.charity_id,
      charityPercent: Number(profile.charity_percent) || 10,
      charityName: charityObj?.name || null,
      subscriptionStatus: (sub?.status as SubscriptionStatus) || "none",
      planCode: planObj?.code || null,
      currentPeriodEnd: sub?.current_period_end || null,
      scoreCount: (scores || []).length,
      winningsCount: (winnings || []).length,
      totalWonCents,
      createdAt: profile.created_at,
      scores: (scores || []).map((s) => ({
        id: s.id,
        score: s.score,
        playedOn: s.played_on,
        createdAt: s.created_at,
      })),
      winnings: (winnings || []).map((w: Record<string, unknown>) => {
        const drawObj = w.draws as { draw_month?: string } | null;
        return {
          id: String(w.id),
          drawMonth: drawObj?.draw_month || "",
          tier: Number(w.tier),
          prizeCents: Number(w.prize_cents),
          verificationStatus: (w.verification_status as VerificationStatus) || "pending_proof",
          paymentStatus: (w.payment_status as PaymentStatus) || "pending",
          createdAt: String(w.created_at),
        };
      }),
      drawEntries: (drawEntries || []).map((e: Record<string, unknown>) => {
        const drawObj = e.draws as { draw_month?: string } | null;
        return {
          id: String(e.id),
          drawMonth: drawObj?.draw_month || "",
          scores: (e.scores as number[]) || [],
          matchCount: Number(e.match_count),
          tier: (e.tier as number) || null,
        };
      }),
      paymentLedger: (payments || []).map((p) => ({
        id: p.id,
        invoiceId: p.stripe_invoice_id,
        grossCents: p.gross_cents,
        charityCents: p.charity_cents,
        paidAt: p.paid_at,
      })),
    };
  }

  /**
   * Retrieves audit logs for security & compliance inspection
   */
  static async getAuditLogs(options?: {
    limit?: number;
    offset?: number;
    entityType?: string;
  }): Promise<{ logs: AuditLogItem[]; totalCount: number }> {
    const supabase = createAdminClient();
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    let query = supabase
      .from("audit_log")
      .select("*, profiles(email)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.entityType) {
      query = query.eq("entity_type", options.entityType);
    }

    const { data, count, error } = await query;
    if (error) throw mapDbError(error);

    const logs: AuditLogItem[] = (data || []).map((row: Record<string, unknown>) => {
      const profileObj = row.profiles as { email?: string } | null;
      return {
        id: String(row.id),
        actorId: (row.actor_id as string) || null,
        actorEmail: profileObj?.email || null,
        action: String(row.action),
        entityType: String(row.entity_type),
        entityId: (row.entity_id as string) || null,
        beforeData: (row.before_data as Record<string, unknown>) || null,
        afterData: (row.after_data as Record<string, unknown>) || null,
        createdAt: String(row.created_at),
      };
    });

    return {
      logs,
      totalCount: count || logs.length,
    };
  }
}
