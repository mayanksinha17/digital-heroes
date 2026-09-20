# Digital Heroes

Digital Heroes is a full-stack, subscription-driven web platform that connects regular golf performance with monthly prize draws and charitable fundraising. Subscribers log their 18-hole Stableford scores, retain an automated rolling five-score window, direct a minimum 10% contribution floor to partner charities, enter monthly cryptographic prize draws, and verify winning claims through an administrative proof review workflow.

---

## Overview

Digital Heroes bridges recreational golf with rewards and social impact:
- **Golfers & Subscribers:** Choose a monthly (₹499) or discounted yearly (₹4,999) plan, select a verified partner charity (with a non-negotiable $\ge 10\%$ contribution floor), and enter Stableford scores (1–45) from their club rounds.
- **Rolling Five-Score Window:** The platform automatically retains the player's 5 most recent calendar scores (ordered by date played), forming their active monthly draw entry.
- **Monthly Prize Draws:** Generated via random or frequency-weighted algorithmic strategies using 50% of monthly subscriber revenues. Players match 5, 4, or 3 numbers against the winning draw, with unclaimed 5-match jackpots rolling over to the next month.
- **Winner Verification & Payouts:** Winners upload scorecard proof screenshots to a private storage bucket. Administrators verify submissions via a dedicated review queue before authorizing external payouts.
- **Administrative Control Center:** Real-time visibility into financial metrics, subscriber directories, draw simulations, charity spotlight management, and immutable system audit logs.

---

## Key Features

- **Authentication & RBAC:** Supabase Auth integration, session synchronization via Next.js middleware, and typed server-side route guards (`requireUser`, `requireAdmin`, `withAuth`).
- **User Profiles & Settings:** Configurable user profile details, selected charity partner, and custom contribution percentage ($\ge 10\%$).
- **Charity Ecosystem & Direct Donations:** Public partner charity directory with category filtering, search, spotlighting, mission storytelling, and isolated direct donations.
- **Subscription Management & Stripe Integration:** Monthly and annual recurring billing via Stripe Checkout, Customer Portal session management, and signed webhook event processing with idempotent tracking in `stripe_events`.
- **Golf Score Management:** Validation for Stableford rounds (1–45), strict one-score-per-calendar-date enforcement, and reverse-chronological scorecard views.
- **Deterministic Rolling Window:** Database triggers enforce a 5-score maximum window per user, automatically evicting the oldest date when a newer round is logged, and rejecting backdated scores older than the active window (`SCORE_TOO_OLD`).
- **Cryptographic & Algorithmic Draw Engine:** Pure TypeScript engine supporting pure random (CryptoRNG / Seeded RNG) and frequency-weighted algorithmic draw generation with smoothing diagnostics.
- **Prize Pool Mathematics & Rollover:** 50% subscriber revenue pool allocation in integer minor units (paise), split 40% (Tier 5 Jackpot), 35% (Tier 4), and 25% (Tier 3). Unclaimed 5-match jackpots roll forward to the next month's pool.
- **Simulation Gate & Atomic Publishing:** Mandatory simulation preview before publishing (D-20); transactional atomic publishing RPC (`publish_draw_atomic`) with participant snapshot immutability.
- **Winner Verification & Proof Storage:** Private isolated storage paths (`winner-proofs/{user_id}/{winner_id}/*`), 15-minute signed URLs, and a 3-attempt submission limit.
- **Payout Management & Financial Ledger:** Verification status invariant enforcing that only `approved` claims can transition to `paid` via `mark_winner_paid` RPC.
- **Subscriber Dashboard:** Multi-module dashboard providing real-time subscription status, rolling 5 score slots, cumulative charity donation ledger, draw qualification status, and unverified claim banners.
- **Admin Control Surfaces:** 5 command surfaces (Executive KPI Dashboard, User Directory 360, Draw Operations & Simulator, Charity CRUD, Winner Verification & Payout Queue, Reports & System Audit Logs).
- **Security & Data Scoping:** Supabase Row-Level Security (RLS) across all tables, IDOR protection, and isolation of private winner proofs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, Server Components, Server Actions) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Frontend UI & Styling** | React 18, Tailwind CSS, Tailwind Animate, Lucide Icons |
| **Motion & Accessibility** | Framer Motion (with `prefers-reduced-motion` compliance) |
| **Database & Auth** | Supabase (PostgreSQL 15, Row-Level Security, Database Triggers, PL/pgSQL RPCs) |
| **Payments & Billing** | Stripe (Hosted Checkout, Customer Portal, Stripe Webhooks) |
| **Data Validation** | Zod (Runtime validation for schemas, actions, and API routes) |
| **Testing & Tooling** | Vitest 2.1, JSDOM, React Testing Library, ESLint |

---

## Architecture

The project follows a modular domain-driven architecture organized under `src/modules/`:

```
src/
├── app/                  # Next.js 14 App Router routes & layouts
│   ├── (admin)/          # Admin Control Center routes (Protected by requireAdmin)
│   ├── (app)/            # Authenticated subscriber dashboard routes (Protected by requireUser)
│   ├── (auth)/           # Authentication pages (Login, Signup)
│   ├── (public)/         # Public pages (How It Works, Pricing, Charities, Draws, Trust)
│   ├── api/webhooks/     # Stripe webhook endpoints
│   └── page.tsx          # Public homepage / landing experience
├── components/           # UI components, layouts, motion wrappers, and dashboard widgets
├── lib/                  # Shared utilities (money arithmetic in paise, dates, errors, Supabase clients)
├── modules/              # Domain modules (auth, charities, dashboard, donations, draws, payments, scores, subscriptions, winners, admin)
└── types/                # Supabase database types and application interfaces
```

Key Architectural Invariants:
- **Server/Client Boundaries:** Server Components fetch database data directly; Client Components are isolated to interactive forms, score slot animations, and motion disclosures.
- **Transactional Atomic Operations:** Multi-table mutations (draw publishing, winner creation, payout authorization) execute within PostgreSQL transactions and RPCs (`publish_draw_atomic`, `review_winner`, `mark_winner_paid`).
- **Concurrency Protection:** User score mutations use Postgres advisory transaction locks (`pg_advisory_xact_lock`) to prevent race conditions during rolling window updates.

---

## Project Structure

```
.
├── docs/                 # Authoritative specifications, architecture docs, audit matrices, and test reports
│   ├── ARCHITECTURE.md
│   ├── CURRENT_STATE_AUDIT.md
│   ├── DATABASE.md
│   ├── DECISIONS.md
│   ├── DEPLOYMENT.md
│   ├── FINAL_PRD_AUDIT.md
│   ├── FINAL_TEST_REPORT.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── PRD_ANALYSIS.md
│   ├── PRD_COMPLIANCE.md
│   └── TESTING.md
├── src/                  # Application source code (App Router, components, modules, lib)
├── supabase/             # Database migrations (0001 to 0011) and seed dataset
│   ├── migrations/
│   └── seed.sql
├── tests/                # Automated test suites (Unit, Integration, Acceptance, and E2E)
│   ├── e2e/              # 8 End-to-End user journeys
│   ├── helpers/          # Shared test utilities and Supabase mock builders
│   └── unit/             # Domain unit and integration tests
├── .env.example          # Environment variable template
├── package.json          # Project scripts and dependencies
├── tailwind.config.ts    # Design tokens and theme configuration
├── tsconfig.json         # Strict TypeScript compiler configuration
└── vitest.config.ts      # Vitest test runner configuration
```

---

## Business Rules

1. **Integer Money Precision:** All monetary amounts are stored and calculated in integer minor units (paise, ₹1 = 100 paise). Floating-point currency math is prohibited.
2. **Subscription Pricing:** Monthly plan is ₹499 (49,900 paise); Yearly plan is ₹4,999 (499,900 paise, ₹416.58 monthly equivalent).
3. **Charity Contribution Floor:** A minimum of 10% of each subscription payment is allocated to the subscriber's chosen partner charity (`charity_percent >= 10.0`).
4. **Stableford Score Scale:** Allowed integer range is 1 to 45 inclusive.
5. **One Score Per Date:** Only one score per calendar date per user is permitted (`unique (user_id, played_on)`).
6. **Rolling 5-Score Window:** Only the 5 most recent rounds (by `played_on desc, created_at desc`) are retained. Older scores are automatically evicted upon newer score entry.
7. **Backdated Score Rejection:** When 5 scores already exist, a score older than all 5 is rejected with `SCORE_TOO_OLD` (400).
8. **Prize Pool Calculation:** 50% of active monthly subscriber equivalent revenue constitutes the new prize pool (`poolNewCents`).
9. **Tier Splits:**
   - **Tier 5 (5 Matches):** 40% of pool + incoming rollover
   - **Tier 4 (4 Matches):** 35% of pool
   - **Tier 3 (3 Matches):** 25% of pool
10. **Equal Winner Splitting & Dust Handling:** Tier prize pools are split equally among winners using integer floor division; remainder dust remains in pool accounting.
11. **Jackpot Rollover:** Unclaimed Tier 5 jackpot rolls forward to the next month's draft draw `rollover_in_cents`; unclaimed Tier 4 and Tier 3 pools remain unallocated.
12. **Winner Proof Verification:** Scorecard proofs must be valid images (PNG, JPEG, WebP $\le 5\text{ MB}$). Maximum 3 proof submission attempts per winning claim.
13. **Payout Integrity:** Winner payout status can transition to `paid` only if `verification_status = 'approved'`.

---

## Testing

The test suite contains **172 automated tests across 41 test files** (100% passing).

```
Test Files  41 passed (41)
     Tests  172 passed (172)
  Duration  ~7.05s
```

### Test Coverage Overview

- **End-to-End User Journeys (8 Suites / 10 Tests in `tests/e2e/`):**
  - `flow1_auth_onboarding.test.ts`: Signup, auth, profile creation, charity selection with $\ge 10\%$ floor, subscription verification.
  - `flow2_score_lifecycle.test.ts`: Progressive scoring, 5-score rolling window auto-eviction, backdated rejection (`SCORE_TOO_OLD`), duplicate date prevention.
  - `flow3_subscriber_dashboard.test.ts`: Live dashboard aggregation across subscription, rolling 5 rounds, cumulative charity impact ledger, draw qualification.
  - `flow4_admin_draw_management.test.ts`: Draft draw creation, entrant snapshots, deterministic replay, 40/35/25 prize pool splits, atomic publishing.
  - `flow5_winner_verification_payout.test.ts`: Published winner claim, proof screenshot submission, admin review & approval, external payment marking (`paid`).
  - `flow6_public_visitor_experience.test.ts`: Unauthenticated landing, rules, pricing plans, charity directory, published draw results feed.
  - `flow7_unauthorized_admin_access.test.ts`: Unauthenticated access denial (401), subscriber forbidden from admin surfaces (`FORBIDDEN` 403).
  - `flow8_cross_user_isolation.test.ts`: IDOR protection blocking cross-user score mutation and cross-user winner proof generation.
- **Domain & Acceptance Tests (33 Suites / 162 Tests in `tests/unit/`):**
  - PRD Worked Acceptance Example AT-01 ([acceptance_at01.test.ts](file:///tests/unit/draws/acceptance_at01.test.ts))
  - PRD Worked Acceptance Example AT-02 ([acceptance_at02.test.ts](file:///tests/unit/scores/acceptance_at02.test.ts))
  - Draw matching, algorithmic frequency weighting, and prize pools
  - Winner verification lifecycle integration and signed upload validation
  - Subscription access control, webhook signature verification, and idempotency
  - Charity directory, spotlight ranking, and direct donations
  - Admin RBAC and live PostgreSQL KPI aggregations
  - Money minor-unit arithmetic, date formatting, and database invariant rules

---

## Getting Started

### Prerequisites
- **Node.js:** 20.x or higher
- **npm:** 10.x or higher

### Installation & Local Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mayanksinha17/digital-heroes.git
   cd digital-heroes
   ```

2. **Install dependencies:**
   ```bash
   npm ci
   ```

3. **Configure environment variables:**
   Copy the example environment configuration:
   ```bash
   cp .env.example .env.local
   ```
   *(Populate `.env.local` with your local or test Supabase and Stripe credentials).*

4. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run typecheck:**
   ```bash
   npm run typecheck
   ```

6. **Run linter:**
   ```bash
   npm run lint
   ```

7. **Run test suite:**
   ```bash
   npm test
   ```

8. **Build for production:**
   ```bash
   npm run build
   ```

---

## Environment Variables

Local execution requires `.env.local`. Reference variable definitions in `.env.example`:

| Variable Name | Description | Environment |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Base application URL (e.g. `http://localhost:3000`) | Client & Server |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Client & Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Client Key | Client & Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (Privileged operations) | **Server Only** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key | Client & Server |
| `STRIPE_SECRET_KEY` | Stripe Secret API Key | **Server Only** |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook HMAC Signing Secret | **Server Only** |
| `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` | Stripe Price ID for Monthly Plan (₹499) | Client & Server |
| `NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID` | Stripe Price ID for Yearly Plan (₹4,999) | Client & Server |
| `DEFAULT_CURRENCY` | Default currency code (`INR`) | Server Only |
| `DEFAULT_PRIZE_POOL_PERCENT` | Default prize pool revenue percentage (`50`) | Server Only |

---

## Deployment

Detailed production deployment specifications are documented in [DEPLOYMENT.md](file:///docs/DEPLOYMENT.md).

- **Current Status:** **READY FOR DEPLOYMENT** (all code, migrations, database triggers, RLS policies, type safety, linting, and 172 automated test suites are verified locally).
- **Target Platforms:** Vercel (Next.js 14 App Router), Supabase (PostgreSQL 15), Stripe (Live Billing & Webhooks).
- **Deployment Requirements:**
  1. Execute migrations `0001` through `0011` and `seed.sql` on the production Supabase instance.
  2. Create the private `winner-proofs` Supabase Storage bucket.
  3. Create Stripe products and prices matching ₹499/mo and ₹4,999/yr.
  4. Register the production Stripe webhook endpoint (`https://<domain>/api/webhooks/stripe`).
  5. Provision production environment variables in the hosting provider.

*(Note: The codebase is fully verified and deployment-ready; actual deployment requires configuring live cloud credentials).*

---

## Security

- **Row-Level Security (RLS):** Enabled and enforced on all PostgreSQL tables. Subscribers can only access their own scores, winnings, and subscription records.
- **Server-Side Authorization:** Admin operations (draw creation, simulation, atomic publishing, winner review, marking payouts) are guarded server-side using `requireAdmin()`.
- **IDOR Prevention:** Verified with dedicated security tests; cross-user mutations on scores or winning claims are rejected with 403 `FORBIDDEN`.
- **Private Winner Proof Storage:** Screenshot proofs are stored in a private Supabase Storage bucket (`winner-proofs`) and accessed only via short-lived signed URLs (15-minute TTL).
- **Stripe Webhook Security:** Webhook payloads verify Stripe HMAC signatures before processing and record event IDs in `stripe_events` to enforce idempotency.
- **Secrets Isolation:** Server keys (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) are strictly excluded from client-side bundles.

---

## Development Commands

| Command | Action |
|---|---|
| `npm run dev` | Starts Next.js development server at `http://localhost:3000` |
| `npm run build` | Compiles optimized Next.js production build |
| `npm run start` | Runs the compiled production server |
| `npm run lint` | Runs Next.js ESLint verification |
| `npm run typecheck` | Runs strict TypeScript compiler check (`tsc --noEmit`) |
| `npm test` | Executes all 172 Vitest unit, integration, and E2E test suites |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run test:coverage` | Generates test code coverage report |

---

## Project Status

- **TypeScript:** 0 type errors (`npx tsc --noEmit`)
- **ESLint:** 0 warnings, 0 errors (`next lint`)
- **Automated Tests:** 172 passed across 41 test files (`npm test`)
- **Production Build:** 27 App Router routes successfully compiled (`npm run build`)
- **Documentation:** Complete specification matrices in `docs/FINAL_PRD_AUDIT.md`, `docs/FINAL_TEST_REPORT.md`, and `docs/DEPLOYMENT.md`.

---

## Repository

- **GitHub Repository:** [https://github.com/mayanksinha17/digital-heroes](https://github.com/mayanksinha17/digital-heroes)

---

## Notes

- Real Supabase and Stripe secret keys must never be committed to source control.
- `.env.local` is intentionally ignored in `.gitignore`.
