-- 0010_row_level_security.sql
-- Digital Heroes: Row Level Security (RLS) and Access Policies

-- Helper: Check if current user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: Check if user has an active subscription
create or replace function public.has_active_subscription(uid uuid)
returns boolean
language sql
security definer
stable as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = uid
      and status = 'active'
      and current_period_end > now()
  );
$$;

-- Enable RLS on all tables
alter table platform_settings enable row level security;
alter table charities enable row level security;
alter table charity_events enable row level security;
alter table charity_media enable row level security;
alter table profiles enable row level security;
alter table plans enable row level security;
alter table subscriptions enable row level security;
alter table stripe_events enable row level security;
alter table subscription_payments enable row level security;
alter table donations enable row level security;
alter table golf_scores enable row level security;
alter table draws enable row level security;
alter table draw_simulations enable row level security;
alter table draw_entries enable row level security;
alter table draw_winners enable row level security;
alter table winner_proofs enable row level security;
alter table audit_log enable row level security;

-- 1. Platform Settings
create policy "Authenticated users can view platform settings"
  on platform_settings for select
  to authenticated
  using (true);

-- 2. Charities & Content (Publicly viewable)
create policy "Public can view active charities"
  on charities for select
  using (is_active = true or is_admin());

create policy "Admins can manage charities"
  on charities for all
  using (is_admin());

create policy "Public can view charity events"
  on charity_events for select
  using (is_published = true or is_admin());

create policy "Admins can manage charity events"
  on charity_events for all
  using (is_admin());

create policy "Public can view charity media"
  on charity_media for select
  using (true);

create policy "Admins can manage charity media"
  on charity_media for all
  using (is_admin());

-- 3. Profiles
create policy "Users can view own profile"
  on profiles for select
  to authenticated
  using (id = auth.uid() or is_admin());

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and (role = (select role from profiles where id = auth.uid())));

create policy "Admins can manage all profiles"
  on profiles for all
  to authenticated
  using (is_admin());

-- 4. Plans
create policy "Public can view active plans"
  on plans for select
  using (is_active = true or is_admin());

create policy "Admins can manage plans"
  on plans for all
  using (is_admin());

-- 5. Subscriptions & Payments
create policy "Users can view own subscriptions"
  on subscriptions for select
  to authenticated
  using (user_id = auth.uid() or is_admin());

create policy "Users can view own payment history"
  on subscription_payments for select
  to authenticated
  using (user_id = auth.uid() or is_admin());

create policy "Users can view own donations"
  on donations for select
  to authenticated
  using (user_id = auth.uid() or is_admin());

-- 6. Golf Scores (Must be subscriber to insert/update/delete)
create policy "Users can view own scores"
  on golf_scores for select
  to authenticated
  using (user_id = auth.uid() or is_admin());

create policy "Active subscribers can insert own scores"
  on golf_scores for insert
  to authenticated
  with check (user_id = auth.uid() and (has_active_subscription(auth.uid()) or is_admin()));

create policy "Active subscribers can update own scores"
  on golf_scores for update
  to authenticated
  using (user_id = auth.uid() and (has_active_subscription(auth.uid()) or is_admin()));

create policy "Active subscribers can delete own scores"
  on golf_scores for delete
  to authenticated
  using (user_id = auth.uid() and (has_active_subscription(auth.uid()) or is_admin()));

-- 7. Draws & Simulations
create policy "Authenticated users can view published draws"
  on draws for select
  to authenticated
  using (status = 'published' or is_admin());

create policy "Admins can manage draws"
  on draws for all
  using (is_admin());

create policy "Admins can manage draw simulations"
  on draw_simulations for all
  using (is_admin());

-- 8. Draw Entries & Winners
create policy "Users can view own draw entries"
  on draw_entries for select
  to authenticated
  using (user_id = auth.uid() or is_admin());

create policy "Users can view own winnings"
  on draw_winners for select
  to authenticated
  using (user_id = auth.uid() or is_admin());

create policy "Admins can manage draw entries and winners"
  on draw_entries for all
  using (is_admin());

create policy "Admins can manage draw winners"
  on draw_winners for all
  using (is_admin());

-- 9. Winner Proofs
create policy "Winners can view own proofs"
  on winner_proofs for select
  to authenticated
  using (
    exists (
      select 1 from draw_winners
      where draw_winners.id = winner_proofs.winner_id
        and draw_winners.user_id = auth.uid()
    ) or is_admin()
  );

create policy "Winners can insert own proof"
  on winner_proofs for insert
  to authenticated
  with check (
    exists (
      select 1 from draw_winners
      where draw_winners.id = winner_proofs.winner_id
        and draw_winners.user_id = auth.uid()
    )
  );

-- 10. Audit Log
create policy "Admins can view audit log"
  on audit_log for select
  using (is_admin());
