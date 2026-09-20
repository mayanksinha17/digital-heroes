# docs/CURRENT_STATE_AUDIT.md — Digital Heroes Level 1

**Audit Date:** September 2026  
**Auditor:** Lead Full-Stack Engineer  
**Objective:** Baseline inspection of the existing workspace, comparison against planning documentation (PRD_ANALYSIS.md, ARCHITECTURE.md, DATABASE.md, DECISIONS.md, IMPLEMENTATION_PLAN.md) and original PRD, and tracking phase-by-phase execution progress.

---

## 1. Workspace Inventory

### 1.1 Filesystem & Repository Status
- **Root Directory:** `C:\Users\ASUS\Desktop\Assignment`
- **Source Code (`src/`):** Complete Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion, and modular domain architecture.
- **Database (`supabase/`):** Complete SQL migrations `0001` to `0010` and `seed.sql` implemented.
- **Authentication & RBAC (`src/modules/auth/`, `src/middleware.ts`):** Complete with Supabase Auth, server guards (`requireUser`, `requireAdmin`, `withAuth`), login/signup forms, and route protection.
- **Settings & Charities (`src/modules/settings/`, `src/modules/charities/`, `src/modules/donations/`):** Complete with public directory, search/filters, charity profiles, events, spotlighting, subscriber selection with 10% floor, admin CRUD, and independent donations.
- **Subscriptions & Stripe (`src/modules/subscriptions/`, `src/modules/payments/`, `src/app/api/webhooks/stripe/`):** Complete with monthly & yearly plans, Stripe Checkout, Customer Portal, signed webhook handling, event idempotency via `stripe_events`, charity payment ledgers, and real-time subscription status validation.
- **Testing (`vitest.config.ts`, `tests/`):** Configured and passing 57 unit, database, auth/RBAC, charity, donation, and subscription tests.
- **Environment (`.env.example`, `.env.local`):** Fully documented and configured.

---

## 2. Phase Execution Status Matrix

| Phase | Description | Key Deliverables | Status | Tests Passed |
|---|---|---|---|---|
| **Phase 0** | Foundation & Tooling | Next.js, TS, Tailwind tokens, `lib/money.ts`, `lib/errors.ts`, `lib/dates.ts`, `lib/env.ts`, `lib/supabase/*` | 🟢 Complete | 16/16 Unit Tests, Build Verified |
| **Phase 1** | Database & RLS | Migrations `0001`–`0010`, `seed.sql`, TypeScript DB types, RLS policies, RPCs (`publish_draw_atomic`, `review_winner`, `mark_winner_paid`, etc.) | 🟢 Complete | 22/22 Tests, Typecheck Verified |
| **Phase 2** | Auth & RBAC | Supabase Auth, middleware session handler, route guards (`requireUser`, `requireAdmin`, `withAuth`), login/signup UI, profile creation | 🟢 Complete | 34/34 Tests, Typecheck Verified |
| **Phase 3** | Settings & Charities | Directory, search/filters, profiles, events, spotlight, subscriber charity selection (min 10%), admin CRUD, independent donations | 🟢 Complete | 48/48 Tests, Build Verified |
| **Phase 4** | Subscriptions & Stripe | Monthly/yearly plans, Stripe checkout, portal, webhook idempotency, charity payment ledgers, real-time per-request check | 🟢 Complete | 57/57 Tests, Build Verified |
| **Phase 5** | Score Management | 1–45 range, 5-score rolling window, animated slots, edit/delete, duplicate date rejection, backdated enforcement | 🟢 Complete | 86/86 Tests, Build & Lint Verified |
| **Phase 6** | Pure Draw Engine | Random/algorithmic modes, 40/35/25 distribution, rollover, pure TS, AT-01 acceptance | 🟢 Complete | 114/114 Tests, Build & Lint Verified |
| **Phase 7** | Draw Operations | Simulation gate, atomic publishing, diffing, snapshot immutability, transactional RPC | 🟢 Complete | 125/125 Tests, Build & Lint Verified |
| **Phase 8** | Winner Verification | Private storage, screenshot review queue, Pending → Paid, RLS, audit logging | 🟢 Complete | 141/141 Tests, Build & Lint Verified |
| **Phase 9** | User Dashboard | 5 mandatory PRD modules with live data, responsive AppNav, cumulative charity ledger, draw status | 🟢 Complete | 148/148 Tests, Build & Lint Verified |
| **Phase 10** | Admin Dashboard | 5 control surfaces (Users, Draws & Sim, Charities, Winners & Payouts, Reports & Audit), live Postgres metrics | 🟢 Complete | 157/157 Tests, Build & Lint Verified |
| **Phase 11** | Public Site & Motion | "Feel, not fairway" marketing site, editorial styling, dynamic draws & trust pillars, Framer Motion, reduced-motion compliance, SEO metadata | 🟢 Complete | 162/162 Tests, Build & Lint Verified |
| **Phase 12** | Hardening & Audit | Full PRD audit, 8 E2E journeys, security review, financial conservation verification, deployment runbook | 🟢 Complete | 172/172 Tests, Production Build Verified |

---

## 3. Invariants & Security Enforced (Phases 0–7)
1. **Server-Enforced Subscription Guard:** Validated on every authenticated request and score mutation (`addScore`, `updateScore`, `deleteScore`) using `requireSubscriptionState()` and `isUserActiveSubscriber()`.
2. **Deterministic 5-Score Rolling Window (PRD §05 & D-10):** The database trigger `trim_scores_to_window` enforces retention of only the 5 most recent rounds (ordered by `played_on desc, created_at desc`). When 5 scores exist, submitting a backdated score older than all 5 is rejected with `SCORE_TOO_OLD`.
3. **One Score Per Date Uniqueness:** Strictly enforced at database level with `unique (user_id, played_on)` and application layer, mapped to typed `SCORE_DUPLICATE_DATE` (409).
4. **Stableford Range Invariant:** Server-side Zod and Postgres check `score between 1 and 45` strictly enforced. Non-integers, zeros, and out-of-range values rejected with `SCORE_OUT_OF_RANGE`.
5. **Ownership & Admin RBAC:** Users can only edit and delete their own scores. Administrative edits and draw actions are audit-logged in `audit_log` with before/after state snapshots.
6. **Mandatory Simulation Before Publish (D-20):** Draws cannot transition to `published` without a prior valid simulation record. The atomic publish operation verifies that the simulation belongs to the draw.
7. **Immutable Participant & Result Snapshot:** At publish time, `draw_entries` captures participant scores, match counts, and tier assignments. Future user score edits or subscription changes never alter historical published draws.
8. **Transactional Atomic Publish (`publish_draw_atomic`):** Row-level locks, financial conservation invariant assertion (`poolNew + rolloverIn = totalPrizes + rolloverOut + unallocated`), winner creation, and status transitions occur inside a single Postgres transaction.
9. **Jackpot Rollover Integrity:** Unclaimed 5-match jackpot carries forward to next month's draft `rollover_in_cents`; 4- and 3-match unclaimed pools remain safely unallocated.
10. **Concurrency & Race Condition Safety:** Mutations execute under `pg_advisory_xact_lock(hashtextextended(user_id::text, 0))` to prevent concurrent window corruption.
11. **Signed Webhook Verification & Idempotency:** Stripe webhooks verify signatures and track events in `stripe_events`.
12. **Charity Contribution Floor:** `charity_percent >= 10.0` guaranteed on all subscriptions and profile updates.
