-- 0001_extensions_and_enums.sql
-- Digital Heroes: Extensions and Core Domain Enums

create extension if not exists pgcrypto;
create extension if not exists citext;

create type user_role as enum ('subscriber', 'admin');
create type billing_interval as enum ('month', 'year');
create type subscription_status as enum (
  'incomplete',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete_expired'
);
create type draw_mode as enum ('random', 'algorithmic');
create type draw_status as enum ('draft', 'simulated', 'published');
create type verification_status as enum (
  'awaiting_proof',
  'pending_review',
  'approved',
  'rejected'
);
create type payment_status as enum ('pending', 'paid');
create type donation_status as enum ('pending', 'succeeded', 'failed');
