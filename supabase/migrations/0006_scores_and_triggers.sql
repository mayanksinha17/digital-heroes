-- 0006_scores_and_triggers.sql
-- Digital Heroes: Golf Scores with 1–45 Range, 1-per-date Uniqueness, and 5-Score Rolling Retention

create table golf_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  score smallint not null check (score between 1 and 45),
  played_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, played_on)
);

create index golf_scores_user_recent_idx on golf_scores (user_id, played_on desc, created_at desc);

-- Rule enforcement before score insert/update
create or replace function public.enforce_score_rules()
returns trigger
language plpgsql
security definer set search_path = public as $$
declare
  retained int := coalesce((select (value)::int from platform_settings where key = 'score_retained_count'), 5);
  policy text := coalesce((select value #>> '{}' from platform_settings where key = 'backdated_score_policy'), 'reject');
  tz text := coalesce((select value #>> '{}' from platform_settings where key = 'draw_timezone'), 'Asia/Kolkata');
  cnt int;
  oldest date;
begin
  -- Serialise score mutations per user to prevent concurrent race conditions
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  if new.played_on > (now() at time zone tz)::date then
    raise exception 'SCORE_DATE_IN_FUTURE' using errcode = 'P0001';
  end if;

  if tg_op = 'INSERT' then
    select count(*), min(played_on) into cnt, oldest from golf_scores where user_id = new.user_id;
    if cnt >= retained and new.played_on < oldest and policy = 'reject' then
      raise exception 'SCORE_TOO_OLD' using errcode = 'P0001';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger golf_scores_rules
  before insert or update on golf_scores
  for each row execute function public.enforce_score_rules();

-- Trim scores to window of 5 after insert
create or replace function public.trim_scores_to_window()
returns trigger
language plpgsql
security definer set search_path = public as $$
declare
  retained int := coalesce((select (value)::int from platform_settings where key = 'score_retained_count'), 5);
begin
  delete from golf_scores
  where user_id = new.user_id
    and id not in (
      select id from golf_scores
      where user_id = new.user_id
      order by played_on desc, created_at desc
      limit retained
    );
  return null;
end;
$$;

create or replace trigger golf_scores_trim
  after insert on golf_scores
  for each row execute function public.trim_scores_to_window();
