import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("https://placeholder.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default("placeholder-anon-key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default("placeholder-service-role-key"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().default("pk_test_sample"),
  STRIPE_SECRET_KEY: z.string().default("sk_test_sample"),
  STRIPE_WEBHOOK_SECRET: z.string().default("whsec_sample"),
  NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID: z.string().default("price_monthly_sample"),
  NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID: z.string().default("price_yearly_sample"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
  NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID,
});
