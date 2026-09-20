# docs/PRD_COMPLIANCE.md — Requirements Traceability Matrix

This matrix tracks full compliance with the Digital Heroes Level 1 PRD.

---

## PRD Requirements & Implementation Matrix

| Section | PRD Requirement | Implementation / File Reference | Compliance Status |
|---|---|---|---|
| **§03 User Roles** | Registered Subscriber, Non-Subscriber, Administrator | [guards.ts](file:///src/modules/auth/guards.ts), [rbac.test.ts](file:///tests/unit/auth/rbac.test.ts) | 🟢 100% Compliant |
| **§04 Subscriptions** | Monthly & Yearly plans with discounted annual rate | [service.ts](file:///src/modules/subscriptions/service.ts), [plans.test.ts](file:///tests/unit/subscriptions/plans.test.ts) | 🟢 100% Compliant |
| **§04 Payment Provider** | Stripe (or equivalent) hosted checkout & portal | [provider.ts](file:///src/modules/payments/provider.ts), [stripe.ts](file:///src/lib/stripe.ts) | 🟢 100% Compliant |
| **§04 Access Guard** | Real-time subscription status check on every request | `requireSubscriptionState()`, `has_active_subscription()` | 🟢 100% Compliant |
| **§04 Idempotency** | Webhook verification & idempotency against double credit | [route.ts](file:///src/app/api/webhooks/stripe/route.ts), `stripe_events` | 🟢 100% Compliant |
| **§05 Score Entry** | Stableford scale 1–45 validation | [schemas.ts](file:///src/modules/scores/schemas.ts), `0006_scores_and_triggers.sql` | 🟢 100% Compliant |
| **§05 One Per Date** | Only one score per calendar date per user | `unique (user_id, played_on)`, [actions.ts](file:///src/modules/scores/actions.ts) | 🟢 100% Compliant |
| **§05 5-Score Window** | Retain latest 5 scores, auto-trim oldest by date | `trim_scores_to_window`, [acceptance_at02.test.ts](file:///tests/unit/scores/acceptance_at02.test.ts) | 🟢 100% Compliant |
| **§05 Backdated Scores** | Backdated rejection when 5 scores already exist | `enforce_score_rules`, [score_service.test.ts](file:///tests/unit/scores/score_service.test.ts) | 🟢 100% Compliant (D-10) |
| **§05 Score Actions** | Edit score & date, delete score, reverse chronological | [ScoreEditor.tsx](file:///src/components/dashboard/ScoreEditor.tsx), [ScoreSlot.tsx](file:///src/components/motion/ScoreSlot.tsx) | 🟢 100% Compliant |
| **§06 Draw Modes** | Random (lottery-style) and Algorithmic (weighted by frequency) | [random.ts](file:///src/modules/draws/engine/random.ts), [weighted.ts](file:///src/modules/draws/engine/weighted.ts) | 🟢 100% Compliant |
| **§06 Draw Lifecycle** | Draft -> Simulated -> Published state machine | [service.ts](file:///src/modules/draws/service.ts), `0007_draws_and_simulations.sql` | 🟢 100% Compliant |
| **§06 Simulation Gate** | Simulation required before publish; preview matches & pools | [service.ts](file:///src/modules/draws/service.ts), [draw_lifecycle.test.ts](file:///tests/unit/draws/draw_lifecycle.test.ts) | 🟢 100% Compliant (D-20) |
| **§06 Atomic Publishing** | Single Postgres transaction publishing and snapshot lock | `0011_publish_draw_atomic.sql`, [service.ts](file:///src/modules/draws/service.ts) | 🟢 100% Compliant |
| **§06 Draw Tiers** | 5-number, 4-number, 3-number match classification | [match.ts](file:///src/modules/draws/engine/match.ts), [matching.test.ts](file:///tests/unit/draws/matching.test.ts) | 🟢 100% Compliant |
| **§07 Prize Pools** | Auto-calculation from active subscriber count (50% share) | [pools.ts](file:///src/modules/draws/engine/pools.ts), [prize_pools.test.ts](file:///tests/unit/draws/prize_pools.test.ts) | 🟢 100% Compliant |
| **§07 Tier Split** | 40% (5-match) / 35% (4-match) / 25% (3-match) split | [pools.ts](file:///src/modules/draws/engine/pools.ts), [acceptance_at01.test.ts](file:///tests/unit/draws/acceptance_at01.test.ts) | 🟢 100% Compliant |
| **§07 Equal Payouts** | Equal split among winners in the same tier | [allocate.ts](file:///src/modules/draws/engine/allocate.ts), [acceptance_at01.test.ts](file:///tests/unit/draws/acceptance_at01.test.ts) | 🟢 100% Compliant |
| **§07 Jackpot Rollover** | 5-match jackpot rolls over when unclaimed | [allocate.ts](file:///src/modules/draws/engine/allocate.ts), [acceptance_at01.test.ts](file:///tests/unit/draws/acceptance_at01.test.ts) | 🟢 100% Compliant |
| **§08 Charity System** | Minimum 10% contribution floor guaranteed | [schemas.ts](file:///src/modules/charities/schemas.ts), `check (charity_percent >= 10.0)` | 🟢 100% Compliant |
| **§08 Charity Selection** | Public directory, categories, search, profile selection | [charities/page.tsx](file:///src/app/(public)/charities/page.tsx), [CharityPicker.tsx](file:///src/components/dashboard/CharityPicker.tsx) | 🟢 100% Compliant |
| **§08 Donations** | Independent direct donations isolated from draw pool | [donations/service.ts](file:///src/modules/donations/service.ts) | 🟢 100% Compliant |
| **§09 Winner Identification** | Published draw creates immutable winner records with tier & prize | `publish_draw_atomic`, [service.ts](file:///src/modules/winners/service.ts) | 🟢 100% Compliant |
| **§09 Winner Lifecycle** | Pending Proof → Under Review → Approved/Rejected → Payout Pending → Paid | [service.ts](file:///src/modules/winners/service.ts), [winner_lifecycle_integration.test.ts](file:///tests/unit/winners/winner_lifecycle_integration.test.ts) | 🟢 100% Compliant |
| **§09 Proof Storage** | Private isolated storage paths with short-lived signed URLs | `winner-proofs/{user_id}/{winner_id}/*`, `0009_storage_buckets.sql` | 🟢 100% Compliant |
| **§09 Verification Queue** | Admin review interface, proof preview, notes, reject/approve actions | [WinnerReviewQueue.tsx](file:///src/components/admin/WinnerReviewQueue.tsx), `review_winner` RPC | 🟢 100% Compliant |
| **§09 Payout Invariant** | Payout status requires prior approval (`payment_status <> 'paid' or verification_status = 'approved'`) | `0008_winners_and_payouts.sql`, `mark_winner_paid` RPC | 🟢 100% Compliant |
| **§09 Audit Logging** | Proof upload, review, approval, rejection, and payout logged | `audit_log`, [service.ts](file:///src/modules/winners/service.ts) | 🟢 100% Compliant |
| **§10 Subscriber Dashboard** | Live multi-module dashboard: subscription, rolling-5 scores, charity impact, draw participation, winnings & claims | [page.tsx](file:///src/app/(app)/dashboard/page.tsx), [AppNav.tsx](file:///src/components/layout/AppNav.tsx) | 🟢 100% Compliant |
| **§10 Cumulative Charity Ledger** | Real-time calculation of all invoice and direct donations directed to charity | [CharityImpactCard.tsx](file:///src/components/dashboard/CharityImpactCard.tsx), `getUserCharityImpact` | 🟢 100% Compliant |
| **§10 Draw Status & Numbers in Play** | Upcoming draw rollover preview, active numbers in play, qualification status | [DrawStatusWidget.tsx](file:///src/components/dashboard/DrawStatusWidget.tsx) | 🟢 100% Compliant |
| **§10 Verification Action Prompt** | Persistent alert banner for unverified/rejected winning claims with direct upload CTA | [UnverifiedWinningsBanner.tsx](file:///src/components/dashboard/UnverifiedWinningsBanner.tsx) | 🟢 100% Compliant |
| **§11 Admin Command Center** | Executive KPI dashboard: users, subscriptions, billing revenue, prize pools, charity ledger, payouts | [admin/page.tsx](file:///src/app/(admin)/admin/page.tsx), [AdminNav.tsx](file:///src/components/admin/AdminNav.tsx) | 🟢 100% Compliant |
| **§11 User Directory & Inspection** | Paginated user management, search, role filters, 360-degree user detail view | [admin/users/page.tsx](file:///src/app/(admin)/admin/users/page.tsx), [users/[id]/page.tsx](file:///src/app/(admin)/admin/users/[id]/page.tsx) | 🟢 100% Compliant |
| **§11 Draw Control & Simulator** | Create monthly draft draws, run simulation engine with frequency diagnostics, preview allocations, atomic publish | [DrawSimulator.tsx](file:///src/components/admin/DrawSimulator.tsx), [admin/draws/page.tsx](file:///src/app/(admin)/admin/draws/page.tsx) | 🟢 100% Compliant |
| **§11 Reports & Financial Audit** | Accounting reconciliation ledger and searchable immutable system audit logs | [admin/reports/page.tsx](file:///src/app/(admin)/admin/reports/page.tsx), `AdminService.getAuditLogs` | 🟢 100% Compliant |
| **§12 Public Experience & Motion** | Editorial "Feel, not fairway" marketing site, hero CTA, 6-step How It Works, Pricing tiers | [page.tsx](file:///src/app/page.tsx), [how-it-works/page.tsx](file:///src/app/(public)/how-it-works/page.tsx) | 🟢 100% Compliant |
| **§12 Public Draws & Integrity** | Public historical draw results feed, rollover notifications, 6-pillar trust architecture | [draws/page.tsx](file:///src/app/(public)/draws/page.tsx), [trust/page.tsx](file:///src/app/(public)/trust/page.tsx) | 🟢 100% Compliant |
| **§12 Accessibility & Motion** | Framer Motion animations with `prefers-reduced-motion` compliance, responsive layout, SEO metadata | [MotionFadeIn.tsx](file:///src/components/motion/MotionFadeIn.tsx), [PublicNav.tsx](file:///src/components/layout/PublicNav.tsx) | 🟢 100% Compliant |
