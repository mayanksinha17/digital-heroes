-- 0002_platform_settings.sql
-- Digital Heroes: Configuration and Platform Settings

create table platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid, -- Foreign key to profiles(id) added in profiles migration
  updated_at timestamptz not null default now()
);
