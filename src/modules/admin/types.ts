import type { Database, UserRole, SubscriptionStatus, DrawStatus, VerificationStatus, PaymentStatus } from "@/types/database";

export interface AdminDashboardMetrics {
  users: {
    total: number;
    subscribers: number;
    nonSubscribers: number;
    active: number;
    pastDue: number;
    canceled: number;
  };
  finances: {
    totalGrossRevenueCents: number;
    totalCharityContributionsCents: number;
    totalDirectDonationsCents: number;
    totalPrizePoolsCents: number;
    totalPaidDisbursedCents: number;
    totalPendingPayoutsCents: number;
  };
  draws: {
    total: number;
    published: number;
    simulated: number;
    draft: number;
    currentRolloverCents: number;
  };
  winners: {
    total: number;
    awaitingProof: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    paid: number;
  };
}

export interface AdminUserListItem {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  charityId: string | null;
  charityPercent: number;
  charityName?: string | null;
  subscriptionStatus: SubscriptionStatus | "none";
  planCode?: string | null;
  currentPeriodEnd?: string | null;
  scoreCount: number;
  winningsCount: number;
  totalWonCents: number;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUserListItem {
  scores: Array<{
    id: string;
    score: number;
    playedOn: string;
    createdAt: string;
  }>;
  winnings: Array<{
    id: string;
    drawMonth: string;
    tier: number;
    prizeCents: number;
    verificationStatus: VerificationStatus;
    paymentStatus: PaymentStatus;
    createdAt: string;
  }>;
  drawEntries: Array<{
    id: string;
    drawMonth: string;
    scores: number[];
    matchCount: number;
    tier: number | null;
  }>;
  paymentLedger: Array<{
    id: string;
    invoiceId: string;
    grossCents: number;
    charityCents: number;
    paidAt: string;
  }>;
}

export interface AuditLogItem {
  id: string;
  actorId: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  createdAt: string;
}
