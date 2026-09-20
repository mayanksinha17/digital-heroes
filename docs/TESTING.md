# docs/TESTING.md — Automated Test Suite & Coverage

This document tracks all unit, integration, and acceptance tests implemented across each phase.

---

## Current Test Summary

- **Total Test Files:** 41 files
- **Total Tests Passing:** 172 tests (100% Green)
- **Framework:** Vitest 2.1.9 + JSDOM
- **Execution Command:** `npm test`

---

## Test Inventory by Domain

### 1. End-to-End User Journeys (Phase 12)
- [flow1_auth_onboarding.test.ts](file:///tests/e2e/flow1_auth_onboarding.test.ts) (1 test): Full signup, auth, profile creation, charity selection with $\ge 10\%$ floor, and subscription state check.
- [flow2_score_lifecycle.test.ts](file:///tests/e2e/flow2_score_lifecycle.test.ts) (1 test): Progressive scoring, 5-score rolling window auto-trim, backdated score rejection (`SCORE_TOO_OLD`), duplicate date prevention (`SCORE_DUPLICATE_DATE`).
- [flow3_subscriber_dashboard.test.ts](file:///tests/e2e/flow3_subscriber_dashboard.test.ts) (1 test): Live dashboard aggregation across subscription, rolling 5 rounds, cumulative charity impact, and draw qualification.
- [flow4_admin_draw_management.test.ts](file:///tests/e2e/flow4_admin_draw_management.test.ts) (1 test): Draft draw creation, entrant snapshots, deterministic replay, 40/35/25 prize pool splits, atomic publishing.
- [flow5_winner_verification_payout.test.ts](file:///tests/e2e/flow5_winner_verification_payout.test.ts) (1 test): Published winner claim, proof screenshot submission, admin review & approval, external payment marking (`paid`).
- [flow6_public_visitor_experience.test.ts](file:///tests/e2e/flow6_public_visitor_experience.test.ts) (1 test): Public unauthenticated visitor experience across landing, rules, pricing, charity directory, and published results.
- [flow7_unauthorized_admin_access.test.ts](file:///tests/e2e/flow7_unauthorized_admin_access.test.ts) (2 tests): Unauthenticated access denial (401), subscriber forbidden from admin surfaces (`FORBIDDEN` 403).
- [flow8_cross_user_isolation.test.ts](file:///tests/e2e/flow8_cross_user_isolation.test.ts) (2 tests): IDOR protection blocking cross-user score mutation and cross-user winner proof generation.

### 2. Public Website, Motion & Security (Phase 11)
- [public_pages.test.ts](file:///tests/unit/public/public_pages.test.ts) (3 tests):
  - Homepage, How It Works, Pricing, and Trust pages public availability
  - Charity and Draw directory public rendering
  - Navigation links correctly routing between public landing points and authentication flows
- [public_security.test.ts](file:///tests/unit/public/public_security.test.ts) (2 tests):
  - Strict isolation: public endpoints never expose unapproved/unverified winner claims or private proof URLs
  - Draft and simulated draw records are strictly excluded from public draw result feeds

### 2. Admin Dashboard, Control Surfaces & RBAC (Phase 10)
- [admin_service.test.ts](file:///tests/unit/admin/admin_service.test.ts) (4 tests):
  - Live PostgreSQL dashboard metrics aggregation across users, billing revenue, charity ledger, prize pools, and winner queues
  - Paginated user list with search, subscription status, and score/winnings count
  - 360-degree user detail inspection (profile, subscription, 5-score rounds, winnings, payment invoices)
  - Filtered audit log retrieval with before/after state snapshots
- [admin_rbac_security.test.ts](file:///tests/unit/admin/admin_rbac_security.test.ts) (5 tests):
  - Non-admin blocked from draw creation (`adminCreateDrawAction`)
  - Non-admin blocked from draw simulation (`adminSimulateDrawAction`)
  - Non-admin blocked from atomic draw publishing (`adminPublishDrawAction`)
  - Non-admin blocked from winner proof review (`adminReviewWinnerAction`)
  - Non-admin blocked from marking payouts paid (`adminMarkWinnerPaidAction`)

### 1. User Dashboard & Data Scoping (Phase 9)
- [dashboard_data.test.ts](file:///tests/unit/dashboard/dashboard_data.test.ts) (4 tests):
  - Real-time subscription state & 5-score draw qualification aggregation
  - Cumulative charity impact calculation from subscription invoice payments and direct donations
  - User draw participation, entry snapshot, and match results
  - Action banner filtering for unverified / rejected winning claims
- [dashboard_security.test.ts](file:///tests/unit/dashboard/dashboard_security.test.ts) (3 tests):
  - Cross-user score modification blocked with `FORBIDDEN` (403)
  - Cross-user winnings/proof access blocked with `FORBIDDEN` (403)
  - Non-admin blocked from administrative winner review and payout operations

### 1. Winner Verification, Proof Storage & Payouts (Phase 8)
- [winner_schemas.test.ts](file:///tests/unit/winners/winner_schemas.test.ts) (8 tests):
  - Valid image upload formats (image/png, image/jpeg, image/webp) $\le 5\text{ MB}$
  - Rejection of oversized files ($> 5\text{ MB}$) with `FILE_TOO_LARGE`
  - Rejection of invalid MIME types (e.g. application/pdf, image/gif) with `INVALID_FILE_TYPE`
  - Validation schemas for `proofUploadRequestSchema`, `proofSubmissionSchema`, `adminReviewWinnerSchema`, `adminMarkWinnerPaidSchema`
- [winner_service.test.ts](file:///tests/unit/winners/winner_service.test.ts) (7 tests):
  - Winner retrieval with ownership enforcement (`FORBIDDEN` 403 when requesting other users' winnings)
  - Signed upload session generation targeting isolated path `winner-proofs/{user_id}/{winner_id}/attempt-{n}.{ext}`
  - Cap of 3 proof submission attempts per winning entry (D-32)
  - Non-admin blocked from `adminReviewWinner` and `adminMarkWinnerPaid`
  - Atomic review execution via `review_winner` RPC updating verification status and audit logging
  - Atomic payout execution via `mark_winner_paid` RPC with `paid_at` timestamping
- [winner_lifecycle_integration.test.ts](file:///tests/unit/winners/winner_lifecycle_integration.test.ts) (1 test / 8-step lifecycle):
  - Complete integration test through the full winner lifecycle:
    1. Draw published with winner record initialized in `pending_proof` and `pending` payment
    2. Winner requests signed upload URL for attempt 1
    3. Winner records proof submission -> status transitions to `under_review`
    4. Admin rejects attempt 1 with feedback -> status transitions to `rejected`
    5. Winner uploads attempt 2 -> status returns to `under_review`
    6. Admin approves attempt 2 -> status transitions to `approved`
    7. Admin marks payout paid -> status transitions to `paid` with immutable prize amount preserved
    8. Attempt to mark paid twice or modify payout amount is prevented by database & RPC invariants

### 1. Draw Operations, State Machine & Snapshots (Phase 7)
- [draw_lifecycle.test.ts](file:///tests/unit/draws/draw_lifecycle.test.ts) (6 tests):
  - Draft draw creation with incoming rollover from last published draw
  - Prevention of duplicate draws for same calendar month (409)
  - Simulation execution without publishing (status updated to `simulated`)
  - Prevention of simulation on already published draws
  - Rejection of publish when no simulation exists (`DRAW_NOT_SIMULATED`)
  - Atomic publishing via `publish_draw_atomic` RPC
- [draw_eligibility_snapshot.test.ts](file:///tests/unit/draws/draw_eligibility_snapshot.test.ts) (1 test):
  - Active subscriber gathering with plan monthly-equivalent math
  - Filtering entrants to those holding $\ge 5$ scores
  - Inclusion of partial score holders in pool math while omitting from entry snapshot
- [draw_operations_rbac.test.ts](file:///tests/unit/draws/draw_operations_rbac.test.ts) (4 tests):
  - Non-admin blocked from draw creation, simulation, and publishing (`FORBIDDEN` 403)
  - Input validation returning `VALIDATION_ERROR` for malformed dates/UUIDs

### 2. Pure Draw Engine & Reward Mathematics (Phase 6)
- [random_strategy.test.ts](file:///tests/unit/draws/random_strategy.test.ts) (4 tests):
  - Generates 5 distinct numbers within [1, 45] range
  - Seeded RNG reproducibility
  - Differential results with different seeds
  - Rejection of invalid count requests
- [algorithmic_strategy.test.ts](file:///tests/unit/draws/algorithmic_strategy.test.ts) (5 tests):
  - Accurate frequency distribution across participant scores
  - Frequent bias with smoothing
  - Rare bias weighting
  - Seeded weighted sampling reproducibility
  - Statistical preference validation over repeated iterations
- [matching.test.ts](file:///tests/unit/draws/matching.test.ts) (8 tests):
  - Set intersection matches (0, 1, 2 = no prize; 3 = Tier 3; 4 = Tier 4; 5 = Tier 5 Jackpot)
  - Deduplication of repeated score values within a user's 5 entries
  - Order-invariant score matching
  - Full entry evaluation structure
- [prize_pools.test.ts](file:///tests/unit/draws/prize_pools.test.ts) (4 tests):
  - Subscriber monthly equivalent minor unit pool calculation (50% share)
  - 40% / 35% / 25% tier splits with rolloverIn addition
  - Equal splitting with integer floor remainder dust handling
  - 5-match jackpot rollover vs 4/3-match unallocated retention
- [acceptance_at01.test.ts](file:///tests/unit/draws/acceptance_at01.test.ts) (1 test / 4-step lifecycle):
  - Executable PRD Worked Acceptance Example AT-01:
    1. 60 monthly + 40 yearly subscribers -> poolNew = 2,330,160 paise (₹23,301.60)
    2. 40/35/25 split -> 932,064 / 815,556 / 582,540 paise
    3. 0 five-match winners, 3 four-match winners (271,852 each), 7 three-match winners (83,220 each) -> 932,064 rolls over
    4. Month 2 rollover -> 1,864,128 paise awarded to single 5-match jackpot winner
- [run_draw.test.ts](file:///tests/unit/draws/run_draw.test.ts) (6 tests):
  - End-to-end random draw execution
  - End-to-end algorithmic draw with frequency diagnostics
  - Deterministic replay with `drawnNumbersOverride`
  - Validation schemas for `drawnNumbersSchema`, `createDrawSchema`, `simulateDrawSchema`, `publishDrawSchema`

### 1. Score Management & Rolling Window (Phase 5)
- [score_schemas.test.ts](file:///tests/unit/scores/score_schemas.test.ts) (17 tests):
  - Minimum Stableford boundary (1) succeeds
  - Maximum Stableford boundary (45) succeeds
  - Valid integer Stableford scores (36) succeed
  - Score < 1 (0) fails
  - Negative score (-5) fails
  - Score > 45 (46) fails
  - Non-integer / float scores (36.5) fail
  - String & null score inputs fail
  - Today date succeeds
  - Past dates succeed
  - Future dates fail
  - Non YYYY-MM-DD formats fail
  - `createScoreSchema`, `updateScoreSchema`, and `deleteScoreSchema` validation with UUID checking
- [score_service.test.ts](file:///tests/unit/scores/score_service.test.ts) (11 tests):
  - Active subscriber requirement for add, update, and delete
  - Non-subscriber receives `SUBSCRIPTION_REQUIRED` (403)
  - Ownership enforcement: users cannot modify or delete other users' scores (`FORBIDDEN` 403)
  - Admin score update bypass with audit logging to `audit_log`
  - Postgres unique date violation mapped to `SCORE_DUPLICATE_DATE` (409)
  - Database trigger backdated score rejection mapped to `SCORE_TOO_OLD` (400)
  - Database trigger future date rejection mapped to `SCORE_DATE_IN_FUTURE` (400)
  - Reverse chronological ordering query by `played_on desc, created_at desc`
- [acceptance_at02.test.ts](file:///tests/unit/scores/acceptance_at02.test.ts) (1 test / 8-step lifecycle):
  - Executable simulation of PRD Worked Example AT-02:
    1. User adds initial 5 scores: Jan 1 (30), Jan 5 (32), Jan 10 (28), Jan 15 (35), Jan 20 (31)
    2. User adds 6th score: Jan 25 (37) -> Jan 1 (30) automatically evicted
    3. User submits backdated score older than all 5 (Jan 2 -> 29) -> Rejected with `SCORE_TOO_OLD` (D-10)
    4. User submits intermediate date (Jan 18 -> 40) -> Evicts Jan 5 (32), retaining 25, 20, 18, 15, 10 Jan
    5. User edits score in place (18 Jan -> 44)
    6. User attempts duplicate date collision on edit -> Rejected with `SCORE_DUPLICATE_DATE`
    7. User deletes Jan 10 (28) -> 4 scores remain
    8. User adds Jan 2 (29) with 4 scores -> Accepted and becomes 5th score

### 2. Subscriptions & Stripe Integration (Phase 4)
- [plans.test.ts](file:///tests/unit/subscriptions/plans.test.ts) (3 tests): Monthly ₹499 & Yearly ₹4,999 pricing, minor unit conversion (49,900 / 499,900 paise), 12-month discount equivalence.
- [access_control.test.ts](file:///tests/unit/subscriptions/access_control.test.ts) (4 tests): `requireSubscriptionState` for active, past_due, canceled, and inactive users; `past_due_counts_as_active` flag enforcement.
- [webhooks.test.ts](file:///tests/unit/subscriptions/webhooks.test.ts) (2 tests): Signed webhook payload validation, idempotency via `stripe_events`.

### 3. Charity & Donations (Phase 3)
- [charity_service.test.ts](file:///tests/unit/charities/charity_service.test.ts) (10 tests): Public listing, category filter, keyword search, spotlight ranking, minimum 10% floor, voluntary increase, and exact invoice contribution minor unit math.
- [donations.test.ts](file:///tests/unit/donations/donations.test.ts) (2 tests): Independent direct donation validation and isolation from draw prize pool.

### 4. Authentication & RBAC (Phase 2)
- [rbac.test.ts](file:///tests/unit/auth/rbac.test.ts) (6 tests): Viewer roles (`subscriber`, `admin`), permission matrix (`score:create`, `score:update`, `score:delete`, `admin:charity:write`, `admin:draw:simulate`, `admin:draw:publish`).
- [schemas.test.ts](file:///tests/unit/auth/schemas.test.ts) (6 tests): Email formatting, password strength, charity selection at signup.

### 5. Database, Invariants, & Core Utils (Phases 0–1)
- [schema_and_rules.test.ts](file:///tests/unit/database/schema_and_rules.test.ts) (6 tests): Stableford DB check, 1-per-date unique constraint, `charity_percent >= 10.0` check, `paid => approved` winner constraint.
- [money.test.ts](file:///tests/unit/lib/money.test.ts) (11 tests): Minor unit arithmetic, no floating point errors, zero sum conservation in tier splits.
- [errors.test.ts](file:///tests/unit/lib/errors.test.ts) (3 tests): Typed error mapping for Postgres error codes.
- [dates.test.ts](file:///tests/unit/lib/dates.test.ts) (2 tests): Month formatting, timezone parsing.
- [settings.test.ts](file:///tests/unit/settings/settings.test.ts) (2 tests): Default settings registry snapshotting.
