-- 0007_draws_and_simulations.sql
-- Digital Heroes: Draws, Simulations, and Score Snapshots

create or replace function public.is_valid_draw_numbers(nums smallint[])
returns boolean
language sql
immutable as $$
  select nums is null or (
    cardinality(nums) = 5
    and (select count(distinct n) = 5 and bool_and(n between 1 and 45) from unnest(nums) n)
  );
$$;

create table draws (
  id uuid primary key default gen_random_uuid(),
  draw_month date not null unique
    check (draw_month = date_trunc('month', draw_month)::date),
  mode draw_mode not null,
  status draw_status not null default 'draft',
  config jsonb not null default '{}'::jsonb,
  drawn_numbers smallint[] check (is_valid_draw_numbers(drawn_numbers)),
  active_subscriber_count integer check (active_subscriber_count >= 0),
  entry_count integer check (entry_count >= 0),
  pool_breakdown jsonb,
  pool_new_cents bigint check (pool_new_cents >= 0),
  rollover_in_cents bigint not null default 0 check (rollover_in_cents >= 0),
  pool_total_cents bigint check (pool_total_cents >= 0),
  pool_5_cents bigint check (pool_5_cents >= 0),
  pool_4_cents bigint check (pool_4_cents >= 0),
  pool_3_cents bigint check (pool_3_cents >= 0),
  rollover_out_cents bigint check (rollover_out_cents >= 0),
  unallocated_cents bigint check (unallocated_cents >= 0),
  published_at timestamptz,
  published_by uuid references profiles(id),
  published_simulation_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    status <> 'published' or (
      drawn_numbers is not null
      and published_at is not null
      and pool_total_cents is not null
      and rollover_out_cents is not null
      and published_simulation_id is not null
    )
  )
);

create table draw_simulations (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references draws(id) on delete cascade,
  mode draw_mode not null,
  config jsonb not null,
  drawn_numbers smallint[] not null check (is_valid_draw_numbers(drawn_numbers)),
  result jsonb not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table draws
  add constraint draws_published_simulation_fk
  foreign key (published_simulation_id) references draw_simulations(id);

create table draw_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references draws(id) on delete restrict,
  user_id uuid not null references profiles(id) on delete restrict,
  scores smallint[] not null check (cardinality(scores) between 1 and 5),
  match_count smallint not null default 0 check (match_count between 0 and 5),
  tier smallint check (tier in (3, 4, 5)),
  created_at timestamptz not null default now(),
  unique (draw_id, user_id),
  check (tier is not distinct from (case when match_count >= 3 then match_count end))
);

create index draws_status_month_idx on draws (status, draw_month desc);
create index draw_entries_draw_tier_idx on draw_entries (draw_id, tier);
create index draw_entries_user_idx on draw_entries (user_id);
