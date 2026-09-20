-- 0004_profiles.sql
-- Digital Heroes: User Profiles and Auth Triggers

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  full_name text not null,
  role user_role not null default 'subscriber',
  charity_id uuid references charities(id) on delete restrict,
  charity_percent numeric(4,1) not null default 10.0
    check (charity_percent >= 10.0 and charity_percent <= 100.0),
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table platform_settings
  add constraint platform_settings_updated_by_fk
  foreign key (updated_by) references profiles(id);

create index profiles_stripe_customer_idx on profiles (stripe_customer_id);

-- Trigger to create profile upon Supabase auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    charity_id,
    charity_percent
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Digital Hero'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'subscriber'),
    (new.raw_user_meta_data->>'charity_id')::uuid,
    coalesce((new.raw_user_meta_data->>'charity_percent')::numeric, 10.0)
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
