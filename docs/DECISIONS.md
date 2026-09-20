# DECISIONS.md — Ambiguities, interpretations, and configurability

The PRD states that *"ambiguity is part of the test"* and is the single source of truth. This file lists **every place the PRD is silent, vague, or internally in tension**, what I chose, why, and how the choice stays changeable.

**Ground rules**
1. Quote the PRD first; only then interpret.
2. Prefer the **most literal reading** that produces a working system.
3. Where a value is arbitrary (percentages, prices, limits), it is a **placeholder in `platform_settings`** — not hard-coded — and needs stakeholder confirmation.
4. Anything not asked for by the PRD is tagged `[EXT]` and can be removed without touching PRD features.

**Status legend:** 🔴 needs your confirmation before coding · 🟡 sensible default, confirm when convenient · 🟢 low-risk / literal reading

**Revision 2 (gap check):** changed D-05, D-06, D-18, D-20, D-21, D-22, D-25 (now 🔴), D-40; added D-43 – D-45. Ten 🔴 items now need a glance.

## Settings registry (referenced below)

Stored in `platform_settings` (key → jsonb). Snapshotted into `draws.config` at draw time so history never changes retroactively. **Not editable from any UI** — the PRD's five admin surfaces (§11) include no settings screen, and §07 says the distribution is *"pre-defined and enforced automatically"* (D-45). Values change only by migration/redeploy; the admin draw console shows the active values read-only.

| Key | Default | Decision |
|---|---|---|
| `currency` | `"inr"` | D-03 |
| `prize_pool_percent` | `50` **(placeholder)** | D-22 |
| `tier_shares` | `{"5":40,"4":35,"3":25}` | PRD §07 (must sum to 100) |
| `score_retained_count` | `5` | PRD §05 |
| `min_scores_to_enter` | `5` | D-13 |
| `backdated_score_policy` | `"reject"` | D-10 |
| `algorithm_bias` | `"frequent"` | D-17 |
| `algorithm_weight_smoothing` | `1` | D-17 |
| `unclaimed_lower_tier_policy` | `"retain"` | D-24 |
| `charity_min_percent` | `10` | PRD §08.1 |
| `charity_max_percent` | `50` **(placeholder)** | D-27 |
| `donation_min_cents` | `10000` **(placeholder)** | D-29 |
| `allow_guest_donations` | `false` | D-29 |
| `proof_max_attempts` | `3` | D-32 |
| `proof_max_size_mb` / `proof_allowed_mime` | `5` / `image/png, image/jpeg, image/webp` | D-33 |
| `past_due_counts_as_active` | `false` | D-06 |
| `draw_timezone` | `"Asia/Kolkata"` | D-18 |
| `results_visibility` | `"authenticated"` | D-21 |

---

## A. Missing content & technical baseline

### D-01 🔴 Sections §13 (Technical requirements) and §14 (Scalability considerations) are absent
- **PRD says:** Contents lists both on page 11. The supplied PDF has 13 physical pages; the page labelled `11 / 14` does not exist.
- **Ambiguity:** Any mandated stack, performance, security, or scalability targets are unknown.
- **Decision:** Do not invent them. Use only technical constraints stated elsewhere (Stripe-or-equivalent, "e.g. Supabase", Vercel, env vars, responsive, real-time status check). Everything else is `[ASSUMPTION]`. Scalability is addressed through design (config table, provider interface, pure engine, indexes, batching) rather than claimed numeric targets.
- **Why:** Silent invention would violate "single source of truth". Evaluation criterion "Scalability thinking" is still served by structure.
- **Configurable:** n/a. **Blocking question:** please supply page 11 if available.

### D-02 🟡 Technology stack
- **PRD says:** Backend "e.g. Supabase"; deploy on Vercel; Stripe-or-equivalent. No framework named in the supplied pages.
- **Decision:** **Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion**, **Supabase** (Postgres, Auth, Storage, RLS), **Stripe** (Checkout, Customer Portal, Webhooks), **Zod** validation, **Vitest** + **Playwright**.
- **Why:** First-class Vercel deployment, server actions/route handlers suit webhooks and RPC, strong typing for money/draw logic, fits "full-stack development trainees".
- **Configurable:** Modules are framework-light (pure TS services) so the UI layer can be swapped.

## B. Subscription & payment (§04)

### D-03 🔴 Plan prices, "discounted rate", currency
- **PRD says:** "Monthly plan and yearly plan (discounted rate)". No amounts, no currency.
- **Decision:** `plans` table holds prices; seed **placeholders**: monthly `₹499`, yearly `₹4,999` (≈ 16.5 % below 12 × monthly). Currency default INR (issuer domain is `.co.in`); stored per plan.
- **Why:** The engine needs numbers to test; real prices are a business input.
- **Configurable:** Yes — `plans` rows + Stripe Price IDs in env; no code change.

### D-04 🟡 Payment provider
- **PRD says:** "Stripe (or equivalent PCI-compliant provider)".
- **Ambiguity:** Stripe live mode availability varies by country; "equivalent" is allowed.
- **Decision:** Implement Stripe in **test mode** for the deliverable behind a small `PaymentProvider` interface (`createCheckout`, `createPortalSession`, `parseWebhook`, `cancel`). Hosted Checkout only.
- **Why:** Satisfies PCI by never handling card data; interface keeps an alternative provider possible.
- **Configurable:** Provider implementation swappable; only Stripe shipped.

### D-05 🟡 "Real-time subscription status check on every authenticated request"
- **Ambiguity:** Calling Stripe's API on every request is slow, rate-limited, and costly.
- **Decision:** A single server guard, `requireSubscriptionState()`, runs on **every authenticated request** (called from every page loader via `getViewer()` and from every server action / route handler via `withAuth()`; middleware only refreshes the session and does coarse gating — a layout-only check is **not** enough because App Router layouts do not re-render on client-side navigation). It reads the **webhook-synchronised** `subscriptions` row and validates `status` **and** `current_period_end`. If the row is missing/stale (e.g. right after checkout return), it does a **just-in-time Stripe retrieve** and updates the row.
- **Why:** Real-time in effect (status changes apply on the next request), without per-request network calls to Stripe. RLS repeats the check for writes.
- **Configurable:** `past_due_counts_as_active`.

### D-06 🟡 Lifecycle states ("renewal, cancellation, lapsed")
- **Decision:** Internal states mapped from Stripe:

| Internal state | Stripe status | Access |
|---|---|---|
| `active` | `active` (incl. `cancel_at_period_end=true` until period ends) | Full |
| `past_due` | `past_due` | Restricted by default (`past_due_counts_as_active=false`) |
| `lapsed` | `canceled` / `unpaid` / `incomplete_expired` / period ended | Restricted |
| `inactive` | no subscription yet, or checkout not completed (`incomplete`) | Restricted |

- **Cancellation:** takes effect at **period end** (user keeps access they paid for).
- **Why:** Standard SaaS behaviour; unambiguous mapping; "Renewal date" shown = `current_period_end`.
- **Dashboard display:** PRD §10 says *"active / inactive / renewal date"*, so the headline is exactly **Active** or **Inactive**; the internal state is a sub-label (*"cancels on …"*, *"payment past due"*, *"lapsed"*).
- **One live subscription per user** is enforced in the app (checkout refused when an `active`/`past_due` subscription exists → Customer Portal), **not** with a unique index, so an unexpected duplicate can never make a webhook fail permanently; admin reports flag duplicates.

### D-07 🔴 Meaning of "restricted access for non-subscribers"
- **PRD says:** "Non-subscribers receive restricted access to platform features"; but §03 lists "Registered subscriber" as one role.
- **Decision:** A registered user without an active subscription **can**: log in, manage profile, choose charity, browse charities/draw mechanics, subscribe, make an independent donation, **view winnings and upload proof for past wins**. They **cannot**: add/edit/delete scores, be entered into draws. Their existing scores remain stored, read-only. Dashboard shows "inactive" plus a subscribe CTA.
- **Why:** Scores and draws are the paid value; winners must still be able to claim prizes they legitimately won.
- **Configurable:** Enforced in one guard + RLS helper `has_active_subscription()`.

### D-08 🟡 Signup sequencing, auth method, email verification
- **PRD says:** "Users select a charity at signup"; "Initiate subscription" is a visitor capability; auth method unspecified.
- **Decision:** Email + password via Supabase Auth. Flow: **signup form (name, email, password) → charity selection + percentage (min 10 %) → plan choice → Stripe Checkout**. Account creation does not require payment. Email verification **off** for the demo deliverable (evaluators need instant test logins), with a documented switch.
- **Why:** Satisfies both "select at signup" and "restricted access for non-subscribers" (an account can exist before payment).

### D-09 🟢 Switching plans
- **PRD says:** Nothing.
- **Decision:** Plan changes and cancellation via **Stripe Customer Portal**; webhooks update our row. No custom proration UI.
- **Why:** Not required; lowest risk.

## C. Score management (§05)

### D-10 🔴 What "latest 5" means and backdated entries
- **PRD says:** "Only the latest 5 scores are retained"; "A new score replaces the oldest stored score automatically"; "most recent first"; each score has a date.
- **Ambiguity:** Latest/oldest by **played date** or by **entry time**? What if a new score's date is older than all five stored?
- **Decision:** "Latest/oldest" = **by played date** (ties broken by creation time). On insert, if the user already has 5 and the new date is **older than all five**, it is **rejected** with a clear message (`backdated_score_policy = "reject"`). Otherwise the oldest by date is evicted automatically.
- **Why:** Keeps the invariant "the five stored scores are always the five most recent rounds". Silently inserting then deleting the same row would confuse users.
- **Configurable:** `backdated_score_policy = "accept_and_trim"` would accept and immediately evict.

### D-11 🟢 Score validation
- **Decision:** Integer 1–45 inclusive (DB `CHECK`); date required, **not in the future** (trigger), stored as `DATE`. **Same score value on different dates is allowed** (only same *date* is unique).
- **Why:** Literal reading of §05; note in PRD applies to dates, not values.

### D-12 🟢 Edit/delete semantics
- **Decision:** Edit may change score and/or date; the new date must not collide with another of the user's entries and must respect D-10. Delete is allowed and can leave fewer than 5. Lapsed users cannot edit (D-07). Editing after a draw is published does **not** alter that draw (entries are snapshotted, D-19).

### D-13 🟡 Minimum scores to be eligible for a draw
- **PRD says:** "Users must enter their last 5 golf scores."
- **Decision:** A user is **entered into a draw only if they hold ≥ `min_scores_to_enter` (default 5) scores** at snapshot time.
- **Why:** The 5-number match tier is meaningless with fewer than 5 numbers; literal "must enter 5".
- **Configurable:** `min_scores_to_enter` (e.g. set to 3 to allow partial entries).

## D. Draw & reward system (§06)

### D-14 🔴 What is drawn and what is matched
- **PRD says:** Draw types "Random — standard lottery-style" / "Algorithmic — weighted by score frequency"; match types "5-number / 4-number / 3-number". Score range 1–45. The PRD never says explicitly that user scores are the "numbers".
- **Decision:** Each draw generates **5 distinct numbers in 1–45** (the Stableford range). A user's **five stored scores** are their entry numbers. The match count is how many of the drawn numbers appear among the user's scores.
- **Why:** It is the only reading that links score entry (§05) to draws (§06) and explains 5/4/3-number tiers and "weighted by score frequency". 
- **Configurable:** `draw_numbers_count` fixed at 5 (PRD tiers assume 5).

### D-15 🟡 Match counting and tier assignment
- **Decision:** Match count = size of the **set intersection** of the user's **distinct** score values and the drawn numbers. A user wins **only their highest tier** (exactly 5, 4, or 3 matches); < 3 = no prize. One winner row per user per draw.
- **Why:** Avoids double-paying one entry across tiers and avoids duplicate-value inflation (a user repeating "32" five times cannot match five distinct numbers).

### D-16 🟢 Random draw
- **Decision:** 5 distinct numbers sampled uniformly without replacement using a cryptographically secure RNG (`crypto.randomInt`), server-side only. Engine accepts an injected RNG so tests are deterministic.

### D-17 🔴 Algorithmic draw weighting
- **PRD says:** "Algorithmic — weighted by score frequency."
- **Ambiguity:** Frequency among whom, and does high frequency mean *more* or *less* likely?
- **Decision:** Frequency = occurrences of each value 1–45 across **all eligible entries' stored scores** in the draw snapshot. Weight `w(v) = frequency(v) + smoothing` (default smoothing 1, so unseen numbers stay drawable). Weighted sampling **without replacement**. Default bias **`frequent`** (common scores likelier). `rare` inverts weights: `w(v) = (maxFreq − freq(v)) + smoothing`.
- **Why:** Literal "weighted by frequency"; smoothing prevents zero-probability numbers; the switch lets the business choose whether the algorithm should raise or lower winner counts.
- **Configurable:** `algorithm_bias`, `algorithm_weight_smoothing`; stored in `draws.config`.

### D-18 🟡 Monthly cadence, draw identity, timezone
- **PRD says:** "Monthly cadence; admin controls publishing."
- **Decision:** One draw per calendar month, identified by `draw_month` (first day of month), **unique**. Admin creates/simulates/publishes manually — **no automatic cron publishing**. Months are evaluated in `draw_timezone` (IST). Publishing is only allowed for a month **later than the last published month** (keeps jackpot rollover chronological) and **not for a future month** (a month's draw can be published once that month has begun, in `draw_timezone`).
- **Why:** "Admin controls publishing" excludes auto-publish; chronological rule protects rollover integrity.

### D-19 🟡 Eligibility, entries, snapshot
- **PRD says:** "Participate in monthly draw-based prize pools"; dashboard shows "draws entered".
- **Decision:** **Automatic entry** — no opt-in step. At simulate/publish time the system snapshots all users with an **active** subscription (D-06) and ≥ `min_scores_to_enter` scores into `draw_entries` (scores copied). **Prize pool counts all active subscribers**, whether or not they qualified for an entry (they paid). Admins are not special-cased; an admin with an active subscription would count like any user.
- **Why:** Matches "based on active subscriber count" (§07) and "draws entered" (§10). Snapshots make results reproducible and immune to later edits.

### D-20 🟡 Simulation before publish
- **PRD says:** "Simulation before publish."
- **Decision:** A simulation runs the **complete pipeline** (numbers → matches → tiers → prizes → rollover) and stores the result in `draw_simulations`; it creates no winners and nothing user-visible. Admin can re-run freely. **Publish requires a chosen simulation — a draw with no simulation cannot be published** — and uses that simulation's numbers, takes a **fresh snapshot**, recomputes, and writes final results in **one DB transaction**. If the final result differs from the simulation (e.g. someone lapsed), the admin sees a diff **before** confirming.
- **Why:** Guarantees "what you previewed is what you publish" as far as data allows, without ever publishing stale eligibility.

### D-21 🟢 Result visibility
- **Decision:** Published draw numbers and per-tier winner counts are visible to **logged-in** users; no winner identities are shown to other users (served by a `published_draw_results()` RPC returning numbers and per-tier counts only); the public site explains mechanics but not live results. Individual entries/prizes visible only to their owner and admins.
- **Configurable:** `results_visibility = "public"`.

## E. Prize pool logic (§07)

### D-22 🔴 The "fixed portion of each subscription"
- **PRD says:** "A fixed portion of each subscription contributes to the prize pool." **The percentage is never given.**
- **Decision:** `prize_pool_percent` = **50 %** of the subscription's monthly-equivalent amount — **a placeholder** — applied to the **gross** plan price (before Stripe fees; fees are outside the PRD).
- **Why:** A number is required to compute pools; 50 % leaves room for the 10 %+ charity share and platform revenue.
- **Configurable:** By migration only (D-45); snapshotted per draw. **Please confirm the real figure.**
- **Fee basis:** the *plan price* (monthly equivalent) is the base for the pool; for charity contributions the base is the **invoice amount paid excluding tax**. Coupons/discounts therefore reduce the charity base but not the pool base (PRD is silent; flagged).

### D-23 🟡 Yearly plan contribution
- **Decision:** Every active subscriber contributes their **monthly equivalent** each month: monthly plan = price; yearly plan = `floor(yearly_price / 12)`. Pool = Σ over active subscribers of `floor(monthly_equivalent × prize_pool_percent / 100)`.
- **Why:** "Auto-calculation … based on active subscriber count" plus a *monthly* draw requires monthly amounts; keeps yearly subscribers in every draw they are active for.

### D-24 🟡 Tier with no winner (4-match, 3-match)
- **PRD says:** Rollover applies to 5-number only; others "No".
- **Decision:** An unwon 4- or 3-match tier is **not paid and not rolled over**; it is recorded as `unallocated` and shown in reports (`unclaimed_lower_tier_policy = "retain"`).
- **Configurable:** `"roll_to_jackpot"` would add it to next month's 5-match pool.

### D-25 🔴 Jackpot rollover mechanics
- **Decision:** If **no user has 5 matches** at publish, the 5-match tier amount (including any prior rollover) becomes `rollover_out` and is added to the next published draw's 5-match pool; repeats indefinitely. "Unclaimed" = **no 5-match winner exists** — *not* "winner failed verification".
- **Two possible readings of "unclaimed"** (PRD §06/§07: *"Jackpot rollover if unclaimed"*): (a) **no one matched 5 numbers** — chosen default; (b) a 5-match winner exists but **never successfully claims** (rejected / no proof).
- **v1 behaviour under (a):** a 5-match winner whose proof is later rejected or never submitted is **not** rolled over automatically; the row stays visible to the admin.
- **If you prefer (b):** add a `forfeited` verification outcome and an admin action "release to rollover" that adds the prize to the next draw's `rollover_in`. Not built unless confirmed (avoids inventing a claim deadline the PRD never states).

### D-26 🟢 Rounding and remainders
- **Decision:** All money is **integer minor units** (paise/cents). Equal split = `floor(tier_pool / winners)`. Any remainder ("dust") and floor losses from the tier-share split are added to `rollover_out`.
- **Why:** No floating-point money; deterministic; nothing silently disappears.

## F. Charity system (§08)

### D-27 🔴 Percentage bounds and interplay with pool share
- **PRD says:** "Minimum contribution: 10 % of subscription fee"; users "may voluntarily increase".
- **Ambiguity:** Increase up to what? 100 % would leave nothing for the "fixed" prize pool.
- **Decision:** Allowed range **10 %–`charity_max_percent` (default 50 %)**, whole or one-decimal percentages. Charity share is taken from the gross fee **independently** of the prize-pool share; the platform keeps the remainder; validation ensures `prize_pool_percent + charity_percent ≤ 100`. DB enforces the **hard PRD floor** (`CHECK charity_percent ≥ 10`).
- **Configurable:** `charity_min_percent` (can only raise the floor), `charity_max_percent`.

### D-28 🟢 Changing charity or percentage later
- **Decision:** Allowed any time; applies **prospectively** to future invoices. Each paid invoice stores a **snapshot** (`charity_id`, `charity_percent`, `charity_cents`) so historic totals never change.

### D-29 🟡 Independent donation
- **PRD says:** "Independent donation option, not tied to gameplay."
- **Decision:** One-off donation to a chosen charity via Stripe Checkout (`mode=payment`), available to **any logged-in user, subscribed or not**; anonymous donation off by default. No effect on draws. Stored in `donations`; included in charity totals separately from subscription contributions.
- **Configurable:** `allow_guest_donations`, `donation_min_cents`.

### D-30 🟢 Directory "search and filter", events, spotlight, deletion
- **Decision:** Search = name/description text; **filter** = `category` tag, "has upcoming events", "featured". Events are `charity_events` rows (title, date, location). Homepage spotlight = charities flagged `is_featured` (ordered by `featured_order`; one shown, rotating optional). **Delete** = soft archive (`archived_at`) if referenced by users/contributions; hard delete only when unreferenced.
- **Why:** PRD names the features but not the filter dimensions; soft delete protects financial history.

### D-31 🟢 Paying charities
- **PRD says:** Nothing about remitting money to charities.
- **Decision:** Track contribution **totals** (§11 reporting) only. No remittance/settlement workflow.

## G. Winner verification (§09)

### D-32 🔴 Verification states and rejection handling
- **PRD says:** "Approve or reject submission"; payment states "Pending → Paid".
- **Ambiguity:** Payment has only two states; rejection outcome and resubmission undefined.
- **Decision:** Two independent fields: `verification_status`: `awaiting_proof` → `pending_review` → `approved` | `rejected`; `payment_status`: `pending` → `paid` (**exactly the PRD states**). `paid` requires `approved` (DB check). On **reject** the admin gives a note and the winner may **re-upload** up to `proof_max_attempts` (default 3); after that the row stays `rejected` (admin can reset).
- **Configurable:** `proof_max_attempts`.

### D-33 🟢 Proof file rules and privacy
- **PRD says:** "Screenshot of scores from the golf platform."
- **Decision:** PNG/JPEG/WebP ≤ 5 MB, stored in a **private** Storage bucket under `{user_id}/{winner_id}/…`; admins view via short-lived signed URLs; owner may view their own.

### D-34 🟢 Payout mechanics
- **Decision:** Admin marks payout as **Paid** manually after paying **outside the app**. **No bank/UPI details are collected** in v1; this is flagged as a real-world gap, not a PRD feature.

## H. Dashboards & reports (§10, §11)

### D-35 🟢 "Participation summary" and "Winnings overview"
- **Decision:** *Draws entered* = count of `draw_entries` for the user; *upcoming draws* = next unpublished draw month (and its status). *Total won* = Σ prizes across the user's winner rows; *current payment status* = per-win badge (`Pending`/`Paid`, plus verification state).

### D-36 🟡 Report definitions
- **Decision:** **Total users** = registered profiles (with active-subscriber subset). **Total prize pool** = cumulative published pools **and** current month's projected pool (labelled). **Charity contribution totals** = per charity and overall, split subscription vs donation. **Draw statistics** = per draw: entries, active subscribers, winners per tier, pool per tier, rollover in/out, paid vs pending.
- **Why:** PRD lists names only; definitions chosen to reconcile to ledgers (NFR-05).

### D-37 🟢 Admin scope wording
- **Decision:** "View and edit user profiles" = name, charity/percentage, role-safe fields (never password). "Edit golf scores" = same validation as users (D-10/D-11). "Manage subscriptions" = view status, cancel at period end, re-sync from Stripe; Stripe remains source of truth; no manual comp grants. "Manage content and media" = charity text, images, events.

### D-38 🟢 Admin provisioning
- **Decision:** Admins are created by **seed script / SQL only**; the `role` column is not client-writable (column privileges + trigger). No admin self-signup.

## I. UX, deployment, extras

### D-39 🟡 Responsive, browsers, accessibility, motion
- **Decision:** Mobile-first; verified at 375 / 768 / 1280 px; latest Chrome/Safari/Firefox/Edge. Target **WCAG 2.1 AA** contrast and keyboard access `[EXT]`. Motion via Framer Motion with `prefers-reduced-motion` respected. Charity-led imagery (people, community, abstract shapes) instead of golf clichés; the brand palette on the PRD cover (deep navy, forest green, copper accent) is a reasonable starting reference.

### D-40 🟢 Deployment & credentials
- **Decision:** New Vercel account/team + new Supabase project as mandated. `.env.example` documents all variables; secrets only in Vercel/Supabase dashboards. Seed script creates the **admin**, and the **test subscriber** account with 5 sample scores; the test subscriber's **subscription is created through a real Stripe test-mode checkout** (card `4242…`) so it is genuinely webhook-synced (a hand-inserted subscription row would be overwritten by the just-in-time reconcile). Synthetic subscription rows exist only in automated-test fixtures. Credentials go in the submission note, not in git history; the README also tells evaluators how to subscribe with a Stripe test card.

### D-41 🟢 `[EXT]` Audit log
- **Decision:** Minimal `audit_log` for admin mutations (score edits, draw publish, winner review, payout, charity CRUD).
- **Why:** Supports "Data handling" and trust; **removable** with no PRD impact.

### D-42 🟡 Regulatory flag (not a requirement)
- **Observation:** A paid-entry, prize-awarding draw may be regulated (lottery/gaming laws) depending on jurisdiction. The PRD does not address this. It is noted for the record; the assignment build proceeds in Stripe **test mode** with no real payouts.

## J. Added in Rev 2 (gap check)

### D-43 🟡 "Screenshot of scores from the golf platform"
- **PRD says:** proof upload = *"Screenshot of scores from the golf platform"* (§09).
- **Ambiguity:** "the golf platform" is undefined — the external app/club system where the winner recorded their rounds, or this platform?
- **Decision:** the **external golf scoring app/system** where the user logged the rounds. The admin review screen shows the winner's **draw-time score snapshot** (values + dates) beside the screenshot; approval means the screenshot corroborates those scores. No OCR/automation.
- **Why:** the only reading under which a screenshot can *verify* something our own database already holds.

### D-44 🟢 Notifications
- **PRD says:** nothing about email/push notifications.
- **Decision:** none built. Winners see *awaiting proof* / *pending review* / *approved* / *rejected* / *Paid* on their dashboard; only Supabase Auth's own emails exist. Optional `[EXT]` later.

### D-45 🟡 "Pre-defined and enforced automatically" distribution
- **PRD says:** *"A fixed portion of each subscription contributes to the prize pool. Distribution is pre-defined and enforced automatically."* (§07)
- **Decision:** the pool percentage and the 40/35/25 tier shares are **not admin-editable at runtime**. They live in `platform_settings` for transparency and per-draw snapshotting but have no UI and no client write path (service role / migration only). The engine applies them automatically; the admin draw console shows them read-only.
- **Why:** editing shares between simulation and publish would contradict "pre-defined"; the PRD's admin surfaces contain no settings screen.
- **Configurable:** by migration/redeploy.
