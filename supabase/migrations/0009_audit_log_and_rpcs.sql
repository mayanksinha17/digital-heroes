-- 0009_audit_log_and_rpcs.sql
-- Digital Heroes: Audit Logging and Transactional RPCs

create table audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on audit_log (entity_type, entity_id);
create index audit_log_created_idx on audit_log (created_at desc);

-- Review winner proof RPC (admin only)
create or replace function public.review_winner(
  p_winner_id uuid,
  p_admin_id uuid,
  p_status verification_status,
  p_note text default null
)
returns void
language plpgsql
security definer set search_path = public as $$
declare
  v_current_status verification_status;
begin
  if p_status not in ('approved', 'rejected') then
    raise exception 'Invalid verification status' using errcode = 'P0001';
  end if;

  select verification_status into v_current_status from draw_winners where id = p_winner_id;
  if not found then
    raise exception 'Winner record not found' using errcode = 'P0002';
  end if;

  update draw_winners
  set verification_status = p_status,
      review_note = p_note,
      reviewed_by = p_admin_id,
      reviewed_at = now(),
      updated_at = now()
  where id = p_winner_id;

  insert into audit_log (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (
    p_admin_id,
    'winner.review',
    'draw_winners',
    p_winner_id::text,
    jsonb_build_object('status', v_current_status),
    jsonb_build_object('status', p_status, 'note', p_note)
  );
end;
$$;

-- Mark winner payout paid RPC (admin only)
create or replace function public.mark_winner_paid(
  p_winner_id uuid,
  p_admin_id uuid
)
returns void
language plpgsql
security definer set search_path = public as $$
declare
  v_verification verification_status;
  v_payment payment_status;
begin
  select verification_status, payment_status into v_verification, v_payment
  from draw_winners where id = p_winner_id;

  if not found then
    raise exception 'Winner record not found' using errcode = 'P0002';
  end if;

  if v_verification <> 'approved' then
    raise exception 'PAYOUT_NOT_APPROVED: Winner proof must be approved before payout' using errcode = 'P0003';
  end if;

  if v_payment = 'paid' then
    raise exception 'PAYOUT_ALREADY_PAID: Payout has already been completed' using errcode = 'P0004';
  end if;

  update draw_winners
  set payment_status = 'paid',
      paid_at = now(),
      paid_by = p_admin_id,
      updated_at = now()
  where id = p_winner_id;

  insert into audit_log (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (
    p_admin_id,
    'winner.payout',
    'draw_winners',
    p_winner_id::text,
    jsonb_build_object('payment_status', 'pending'),
    jsonb_build_object('payment_status', 'paid')
  );
end;
$$;

-- Get published draw results summary (safe for public/participants)
create or replace function public.published_draw_results(p_draw_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public as $$
declare
  v_draw record;
  v_winners_5 int;
  v_winners_4 int;
  v_winners_3 int;
begin
  select * into v_draw from draws where id = p_draw_id and status = 'published';
  if not found then
    return null;
  end if;

  select count(*) into v_winners_5 from draw_winners where draw_id = p_draw_id and tier = 5;
  select count(*) into v_winners_4 from draw_winners where draw_id = p_draw_id and tier = 4;
  select count(*) into v_winners_3 from draw_winners where draw_id = p_draw_id and tier = 3;

  return jsonb_build_object(
    'id', v_draw.id,
    'draw_month', v_draw.draw_month,
    'mode', v_draw.mode,
    'drawn_numbers', v_draw.drawn_numbers,
    'pool_total_cents', v_draw.pool_total_cents,
    'pool_5_cents', v_draw.pool_5_cents,
    'pool_4_cents', v_draw.pool_4_cents,
    'pool_3_cents', v_draw.pool_3_cents,
    'rollover_in_cents', v_draw.rollover_in_cents,
    'rollover_out_cents', v_draw.rollover_out_cents,
    'published_at', v_draw.published_at,
    'winner_counts', jsonb_build_object(
      'tier5', v_winners_5,
      'tier4', v_winners_4,
      'tier3', v_winners_3
    )
  );
end;
$$;

-- Admin Reports RPC
create or replace function public.get_admin_reports()
returns jsonb
language plpgsql
security definer set search_path = public as $$
declare
  v_total_users int;
  v_active_subscribers int;
  v_total_pool_cents bigint;
  v_subscription_charity_cents bigint;
  v_donation_charity_cents bigint;
  v_total_draws int;
begin
  select count(*) into v_total_users from profiles;
  select count(*) into v_active_subscribers from subscriptions where status = 'active' and current_period_end > now();
  select coalesce(sum(pool_total_cents), 0) into v_total_pool_cents from draws where status = 'published';
  select coalesce(sum(charity_cents), 0) into v_subscription_charity_cents from subscription_payments;
  select coalesce(sum(amount_cents), 0) into v_donation_charity_cents from donations where status = 'succeeded';
  select count(*) into v_total_draws from draws where status = 'published';

  return jsonb_build_object(
    'total_users', v_total_users,
    'active_subscribers', v_active_subscribers,
    'total_prize_pool_cents', v_total_pool_cents,
    'total_charity_cents', (v_subscription_charity_cents + v_donation_charity_cents),
    'subscription_charity_cents', v_subscription_charity_cents,
    'direct_donation_cents', v_donation_charity_cents,
    'total_published_draws', v_total_draws
  );
end;
$$;
