import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/errors";
import { paymentProvider } from "@/modules/payments/provider";
import { AuthService } from "@/modules/auth/service";
import { calculateCharityContribution } from "@/lib/money";
import type { Database, SubscriptionStatus } from "@/types/database";
import type Stripe from "stripe";

export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type SubscriptionPayment = Database["public"]["Tables"]["subscription_payments"]["Row"];

export class SubscriptionService {
  /**
   * Retrieves all active subscription plans from database
   */
  static async getActivePlans(): Promise<Plan[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("price_cents", { ascending: true });

    if (error || !data || data.length === 0) {
      // Fallback defaults if database is not yet seeded
      return [
        {
          id: "p-monthly",
          code: "monthly",
          name: "Monthly Hero Plan",
          billing_interval: "month",
          price_cents: 49900,
          currency: "INR",
          stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || null,
          is_active: true,
          monthly_equivalent_cents: 49900,
        },
        {
          id: "p-yearly",
          code: "yearly",
          name: "Yearly Hero Plan (Discounted)",
          billing_interval: "year",
          price_cents: 499900,
          currency: "INR",
          stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || null,
          is_active: true,
          monthly_equivalent_cents: 41658,
        },
      ];
    }

    return data as Plan[];
  }

  /**
   * Retrieves a plan by its code ('monthly' | 'yearly')
   */
  static async getPlanByCode(code: "monthly" | "yearly"): Promise<Plan | null> {
    const plans = await this.getActivePlans();
    return plans.find((p) => p.code === code) || null;
  }

  /**
   * Retrieves the user's latest subscription record
   */
  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as Subscription;
  }

  /**
   * Real-time subscription check on every authenticated request (D-05, D-06)
   */
  static async requireSubscriptionState(userId: string): Promise<{
    isSubscribed: boolean;
    subscription: Subscription | null;
    headline: "Active" | "Inactive";
    subLabel: string;
  }> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      return {
        isSubscribed: false,
        subscription: null,
        headline: "Inactive",
        subLabel: "No active subscription",
      };
    }

    const now = new Date();
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null;

    const isPeriodValid = periodEnd ? periodEnd > now : false;

    if (subscription.status === "active") {
      if (subscription.cancel_at_period_end) {
        return {
          isSubscribed: isPeriodValid,
          subscription,
          headline: isPeriodValid ? "Active" : "Inactive",
          subLabel: isPeriodValid
            ? `Cancels at end of period (${periodEnd?.toLocaleDateString()})`
            : "Lapsed (canceled)",
        };
      }
      return {
        isSubscribed: isPeriodValid,
        subscription,
        headline: isPeriodValid ? "Active" : "Inactive",
        subLabel: isPeriodValid ? "Active subscription" : "Lapsed",
      };
    }

    if (subscription.status === "past_due") {
      return {
        isSubscribed: false,
        subscription,
        headline: "Inactive",
        subLabel: "Payment past due - please update payment method",
      };
    }

    return {
      isSubscribed: false,
      subscription,
      headline: "Inactive",
      subLabel: `Subscription ${subscription.status}`,
    };
  }

  /**
   * Boolean check for access gating
   */
  static async isUserActiveSubscriber(userId: string): Promise<boolean> {
    const profile = await AuthService.getProfileById(userId);
    if (profile?.role === "admin") return true;

    const state = await this.requireSubscriptionState(userId);
    return state.isSubscribed;
  }

  /**
   * Creates a Stripe Checkout Session for a plan.
   * If the user already has an active subscription, redirects to Customer Portal (D-06).
   */
  static async createCheckoutForPlan(
    userId: string,
    planCode: "monthly" | "yearly"
  ): Promise<{ checkoutUrl?: string; portalUrl?: string }> {
    const profile = await AuthService.getProfileById(userId);
    if (!profile) {
      throw new AppError("UNAUTHORIZED", "User profile not found", 401);
    }

    const plan = await this.getPlanByCode(planCode);
    if (!plan) {
      throw new AppError("VALIDATION_ERROR", "Invalid subscription plan", 400);
    }

    // Check if user already has an active subscription
    const existingSub = await this.getUserSubscription(userId);
    if (existingSub && existingSub.status === "active") {
      const portalUrl = await this.createPortalSession(userId);
      return { portalUrl };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      customerId = await paymentProvider.createCustomer({
        email: profile.email,
        name: profile.full_name,
        metadata: { userId: profile.id },
      });

      const adminSupabase = createAdminClient();
      await adminSupabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", profile.id);
    }

    const session = await paymentProvider.createCheckoutSession({
      customerId,
      priceId: plan.stripe_price_id || undefined,
      amountCents: plan.price_cents,
      planName: plan.name,
      interval: plan.billing_interval,
      currency: plan.currency,
      mode: "subscription",
      successUrl: `${appUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/pricing`,
      metadata: {
        userId: profile.id,
        planCode: plan.code,
        planId: plan.id,
      },
    });

    return { checkoutUrl: session.url };
  }

  /**
   * Generates a Stripe Customer Portal session URL for subscription & billing management.
   */
  static async createPortalSession(userId: string): Promise<string> {
    const profile = await AuthService.getProfileById(userId);
    if (!profile || !profile.stripe_customer_id) {
      throw new AppError("VALIDATION_ERROR", "No active billing profile found", 400);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return await paymentProvider.createCustomerPortalSession(
      profile.stripe_customer_id,
      `${appUrl}/dashboard`
    );
  }

  /**
   * Synchronizes a Stripe Subscription event into Supabase (Called from Webhook)
   */
  static async syncStripeSubscription(
    stripeSub: Stripe.Subscription,
    customerId: string
  ): Promise<Subscription> {
    const adminSupabase = createAdminClient();

    // 1. Resolve user ID
    let userId = stripeSub.metadata?.userId;
    if (!userId) {
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      userId = profile?.id;
    }

    if (!userId) {
      throw new AppError("NOT_FOUND", `User not found for Stripe customer ${customerId}`, 404);
    }

    // 2. Resolve plan ID
    const planPriceId = stripeSub.items.data[0]?.price.id;
    let planId: string | null = null;

    if (planPriceId) {
      const { data: plan } = await adminSupabase
        .from("plans")
        .select("id")
        .eq("stripe_price_id", planPriceId)
        .maybeSingle();

      planId = plan?.id || null;
    }

    if (!planId) {
      const interval = stripeSub.items.data[0]?.price.recurring?.interval || "month";
      const { data: plan } = await adminSupabase
        .from("plans")
        .select("id")
        .eq("billing_interval", interval)
        .eq("is_active", true)
        .limit(1)
        .single();

      planId = plan?.id || null;
    }

    if (!planId) {
      throw new AppError("NOT_FOUND", "Matching plan not found", 404);
    }

    // Map Stripe status to domain SubscriptionStatus
    const statusMap: Record<string, SubscriptionStatus> = {
      active: "active",
      past_due: "past_due",
      canceled: "canceled",
      unpaid: "unpaid",
      incomplete: "incomplete",
      incomplete_expired: "incomplete_expired",
      trialing: "active",
    };

    const status: SubscriptionStatus = statusMap[stripeSub.status] || "incomplete";
    const periodStart = new Date(stripeSub.current_period_start * 1000).toISOString();
    const periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
    const canceledAt = stripeSub.canceled_at
      ? new Date(stripeSub.canceled_at * 1000).toISOString()
      : null;

    // Check existing subscription by stripe_subscription_id
    const { data: existing } = await adminSupabase
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", stripeSub.id)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await adminSupabase
        .from("subscriptions")
        .update({
          status,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: stripeSub.cancel_at_period_end,
          canceled_at: canceledAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error || !updated) {
        throw new AppError("INTERNAL_SERVER_ERROR", error?.message || "Failed to update subscription", 500);
      }
      return updated as Subscription;
    }

    // Insert new subscription row
    const { data: inserted, error } = await adminSupabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: planId,
        stripe_subscription_id: stripeSub.id,
        stripe_customer_id: customerId,
        status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: stripeSub.cancel_at_period_end,
        canceled_at: canceledAt,
      })
      .select()
      .single();

    if (error || !inserted) {
      throw new AppError("INTERNAL_SERVER_ERROR", error?.message || "Failed to insert subscription", 500);
    }

    return inserted as Subscription;
  }

  /**
   * Records a paid subscription invoice into subscription_payments ledger with charity snapshot (D-28, AT-03)
   */
  static async recordInvoicePayment(invoice: Stripe.Invoice): Promise<SubscriptionPayment | null> {
    if (!invoice.paid || invoice.amount_paid <= 0) {
      return null;
    }

    const adminSupabase = createAdminClient();
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

    if (!customerId) return null;

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("id, charity_id, charity_percent")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!profile || !profile.charity_id) {
      return null;
    }

    const grossCents = invoice.amount_paid;
    const charityPercent = Number(profile.charity_percent) || 10;
    const charityCents = calculateCharityContribution(grossCents, charityPercent);
    const paidAt = invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
      : new Date().toISOString();

    const { data: payment, error } = await adminSupabase
      .from("subscription_payments")
      .insert({
        user_id: profile.id,
        stripe_invoice_id: invoice.id,
        gross_cents: grossCents,
        currency: (invoice.currency || "INR").toUpperCase(),
        charity_id: profile.charity_id,
        charity_percent: charityPercent,
        charity_cents: charityCents,
        paid_at: paidAt,
      })
      .select()
      .single();

    if (error) {
      // If unique violation on invoice ID, payment was already recorded (idempotent)
      return null;
    }

    return payment as SubscriptionPayment;
  }

  /**
   * Retrieves user subscription with associated plan details
   */
  static async getUserSubscriptionWithPlan(
    userId: string
  ): Promise<(Subscription & { plan?: Plan | null }) | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, plans(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      ...data,
      plan: (data.plans as unknown as Plan) || null,
    };
  }

  /**
   * Aggregates total charity contributions generated by the user through subscription invoices & direct donations
   */
  static async getUserCharityImpact(userId: string): Promise<{
    subscriptionCharityCents: number;
    donationCharityCents: number;
    totalCharityCents: number;
  }> {
    const supabase = createClient();

    // 1. Subscription invoice charity amounts
    const { data: subPayments } = await supabase
      .from("subscription_payments")
      .select("charity_cents")
      .eq("user_id", userId);

    const subscriptionCharityCents = (subPayments || []).reduce(
      (acc, curr) => acc + Number(curr.charity_cents || 0),
      0
    );

    // 2. Direct donations (status = completed)
    const { data: directDonations } = await supabase
      .from("donations")
      .select("amount_cents")
      .eq("user_id", userId)
      .eq("status", "completed");

    const donationCharityCents = (directDonations || []).reduce(
      (acc, curr) => acc + Number(curr.amount_cents || 0),
      0
    );

    return {
      subscriptionCharityCents,
      donationCharityCents,
      totalCharityCents: subscriptionCharityCents + donationCharityCents,
    };
  }
}
