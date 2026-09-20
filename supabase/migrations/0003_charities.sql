-- 0003_charities.sql
-- Digital Heroes: Charities, Charity Events, and Charity Media

create table charities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  short_description text not null,
  description text not null,
  category text,
  logo_url text,
  hero_image_url text,
  website_url text,
  is_featured boolean not null default false,
  featured_order integer,
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table charity_events (
  id uuid primary key default gen_random_uuid(),
  charity_id uuid not null references charities(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  location text,
  image_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table charity_media (
  id uuid primary key default gen_random_uuid(),
  charity_id uuid not null references charities(id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '',
  sort_order integer not null default 0
);

create index charities_active_featured_idx on charities (is_active, is_featured, featured_order);
create index charity_events_charity_starts_idx on charity_events (charity_id, starts_at);
