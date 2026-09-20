import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
  typescript: true,
  appInfo: {
    name: "Digital Heroes Platform",
    version: "1.0.0",
  },
});
