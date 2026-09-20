import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { AppError } from "@/lib/errors";

export interface CreateCheckoutParams {
  customerId?: string;
  customerEmail?: string;
  priceId?: string;
  amountCents?: number;
  planName?: string;
  interval?: "month" | "year";
  currency?: string;
  mode: "subscription" | "payment";
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}

export interface PaymentProvider {
  createCustomer(params: { email: string; name: string; metadata?: Record<string, string> }): Promise<string>;
  createCheckoutSession(params: CreateCheckoutParams): Promise<{ sessionId: string; url: string }>;
  createCustomerPortalSession(customerId: string, returnUrl: string): Promise<string>;
  constructWebhookEvent(payload: string | Buffer, signature: string, secret: string): Stripe.Event;
  getSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
}

export class StripePaymentProvider implements PaymentProvider {
  async createCustomer(params: {
    email: string;
    name: string;
    metadata?: Record<string, string>;
  }): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: params.metadata,
      });
      return customer.id;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create Stripe customer";
      throw new AppError("STRIPE_ERROR", message, 500);
    }
  }

  async createCheckoutSession(
    params: CreateCheckoutParams
  ): Promise<{ sessionId: string; url: string }> {
    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: params.mode,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
        allow_promotion_codes: true,
      };

      if (params.customerId) {
        sessionParams.customer = params.customerId;
      } else if (params.customerEmail) {
        sessionParams.customer_email = params.customerEmail;
      }

      if (params.priceId && !params.priceId.includes("placeholder") && !params.priceId.includes("sample")) {
        sessionParams.line_items = [
          {
            price: params.priceId,
            quantity: 1,
          },
        ];
      } else {
        // Dynamic price item for testing / fallback
        sessionParams.line_items = [
          {
            price_data: {
              currency: (params.currency || "INR").toLowerCase(),
              product_data: {
                name: params.planName || "Digital Heroes Subscription",
              },
              unit_amount: params.amountCents || 49900,
              ...(params.mode === "subscription"
                ? {
                    recurring: {
                      interval: params.interval || "month",
                    },
                  }
                : {}),
            },
            quantity: 1,
          },
        ];
      }

      if (params.mode === "subscription") {
        sessionParams.subscription_data = {
          metadata: params.metadata,
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      if (!session.url) {
        throw new AppError("STRIPE_ERROR", "Stripe checkout session URL is unavailable", 500);
      }

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create Stripe checkout session";
      throw new AppError("STRIPE_ERROR", message, 500);
    }
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string): Promise<string> {
    try {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return portal.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create customer portal session";
      throw new AppError("STRIPE_ERROR", message, 500);
    }
  }

  constructWebhookEvent(payload: string | Buffer, signature: string, secret: string): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid Stripe webhook signature";
      throw new AppError("UNAUTHORIZED", message, 400);
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to retrieve subscription from Stripe";
      throw new AppError("STRIPE_ERROR", message, 500);
    }
  }
}

export const paymentProvider = new StripePaymentProvider();
