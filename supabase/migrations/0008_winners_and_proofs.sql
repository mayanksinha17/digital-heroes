-- 0008_winners_and_proofs.sql
-- Digital Heroes: Winner Tracking, Proof Uploads, and Verification

create table draw_winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references draws(id) on delete restrict,
  entry_id uuid not null unique references draw_entries(id) on delete restrict,
  user_id uuid not null references profiles(id) on delete restrict,
  tier smallint not null check (tier in (3, 4, 5)),
  prize_cents bigint not null check (prize_cents >= 0),
  verification_status verification_status not null default 'awaiting_proof',
  proof_attempts smallint not null default 0 check (proof_attempts >= 0),
  review_note text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  payment_status payment_status not null default 'pending',
  paid_at timestamptz,
  paid_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (draw_id, user_id),
  check (payment_status <> 'paid' or verification_status = 'approved'),
  check ((payment_status = 'paid') = (paid_at is not null))
);

create table winner_proofs (
  id uuid primary key default gen_random_uuid(),
  winner_id uuid not null references draw_winners(id) on delete cascade,
  attempt_no smallint not null check (attempt_no >= 1),
  storage_path text not null,
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  uploaded_at timestamptz not null default now(),
  unique (winner_id, attempt_no)
);

create index draw_winners_user_idx on draw_winners (user_id);
create index draw_winners_queue_idx on draw_winners (verification_status, payment_status);
