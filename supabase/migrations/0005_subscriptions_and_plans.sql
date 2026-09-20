-- 0005_subscriptions_and_plans.sql
-- Digital Heroes: Plans, Subscriptions, Stripe Events, and Financial Ledgers

create table plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('monthly', 'yearly')),
  name text not null,
  billing_interval billing_interval not null,
  price_cents integer not null check (price_cents > 0),
  currency char(3) not null default 'INR',
  stripe_price_id text unique,
  is_active boolean not null default true,
  monthly_equivalent_cents integer generated always as
    (case when billing_interval = 'month' then price_cents else price_cents / 12 end) stored
);

create unique index plans_one_active_per_interval on plans (billing_interval) where is_active;

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_id uuid not null references plans(id),
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  status subscription_status not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_status_idx on subscriptions (user_id, status, current_period_end desc);
create index subscriptions_status_period_idx on subscriptions (status, current_period_end);
create index subscriptions_stripe_customer_idx on subscriptions (stripe_customer_id);

create table stripe_events (
  id text primary key,
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);

create table subscription_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete restrict,
  subscription_id uuid references subscriptions(id) on delete set null,
  stripe_invoice_id text not null unique,
  gross_cents integer not null check (gross_cents >= 0),
  currency char(3) not null,
  charity_id uuid references charities(id) on delete restrict,
  charity_percent numeric(4,1) not null check (charity_percent >= 10.0),
  charity_cents integer not null check (charity_cents >= 0 and charity_cents <= gross_cents),
  paid_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index subscription_payments_charity_paid_idx on subscription_payments (charity_id, paid_at);
create index subscription_payments_user_paid_idx on subscription_payments (user_id, paid_at desc);

create table donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  charity_id uuid not null references charities(id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  currency char(3) not null default 'INR',
  status donation_status not null default 'pending',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index donations_charity_status_idx on donations (charity_id, status);
