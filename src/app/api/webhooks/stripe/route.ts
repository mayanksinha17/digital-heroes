import { NextRequest, NextResponse } from "next/server";
import { paymentProvider } from "@/modules/payments/provider";
import { SubscriptionService } from "@/modules/subscriptions/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    logger.error("Stripe webhook missing signature header");
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook secret unconfigured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = paymentProvider.constructWebhookEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    logger.error("Stripe signature verification failed", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  // 1. Idempotency Check: Check if event was already processed
  const { data: existingEvent } = await adminSupabase
    .from("stripe_events")
    .select("id, processed_at")
    .eq("id", event.id)
    .maybeSingle();

  if (existingEvent && existingEvent.processed_at) {
    logger.info(`Stripe webhook event ${event.id} already processed (idempotent no-op)`);
    return NextResponse.json({ received: true, idempotent: true }, { status: 200 });
  }

  // 2. Record event in stripe_events
  if (!existingEvent) {
    await adminSupabase.from("stripe_events").insert({
      id: event.id,
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
    });
  }

  // 3. Process event by type
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;

          const customerId =
            typeof session.customer === "string" ? session.customer : session.customer?.id;

          if (subscriptionId && customerId) {
            const sub = await paymentProvider.getSubscription(subscriptionId);
            await SubscriptionService.syncStripeSubscription(sub, customerId);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const stripeSub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer?.id;

        if (customerId) {
          await SubscriptionService.syncStripeSubscription(stripeSub, customerId);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Record charity payment ledger
        await SubscriptionService.recordInvoicePayment(invoice);

        // Also sync subscription status if attached
        if (invoice.subscription) {
          const subId =
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : invoice.subscription.id;
          const sub = await paymentProvider.getSubscription(subId);
          const custId =
            typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
          if (custId) {
            await SubscriptionService.syncStripeSubscription(sub, custId);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subId =
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : invoice.subscription.id;
          const sub = await paymentProvider.getSubscription(subId);
          const custId =
            typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
          if (custId) {
            await SubscriptionService.syncStripeSubscription(sub, custId);
          }
        }
        break;
      }

      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    // 4. Mark event as processed
    await adminSupabase
      .from("stripe_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", event.id);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Webhook processing error";
    logger.error(`Error processing Stripe event ${event.id}`, err);

    await adminSupabase
      .from("stripe_events")
      .update({ error: errorMsg })
      .eq("id", event.id);

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
