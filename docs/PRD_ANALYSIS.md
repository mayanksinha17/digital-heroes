# PRD_ANALYSIS.md — Digital Heroes PRD (Level 1), Edition 2026

**Revision 2 (post gap-check).** Re-audited against the original PDF; changes are listed in `IMPLEMENTATION_PLAN.md` §9. Notable corrections: PRD terminology for *Draw types* vs *Draw logic*, mandatory simulation before publish, "pre-defined" prize distribution, dashboard active/inactive display, worked acceptance examples (§12), and a section-by-section coverage check (§13).

> Source: `Digital_Heroes_PRD__Level_1_.pdf` — *Version 1.0 · March 2026 · Issued for selection process only*.
> The PRD calls itself "the single source of truth for design, development, and evaluation" and says *"ambiguity is part of the test."*

## 0. Document-integrity notice (read first)

The PDF footers are numbered `NN / 14`, but the file contains **13 physical pages**. The page labelled **`11 / 14` is absent** (footers jump from `10 / 14` to `12 / 14`). I verified this on disk (`pdfinfo` → 13 pages; every physical page has extractable text).

The Contents page (§01) lists, on page 11:

| Section | Title | Status |
|---|---|---|
| § 13 | **Technical requirements** | **Not present in the supplied file** |
| § 14 | **Scalability considerations** | **Not present in the supplied file** |

Consequences:
- I have **not** invented the content of §13/§14. Everything in this analysis about stack, performance, and scalability is marked **[ASSUMPTION]** and logged in `DECISIONS.md` (D-01, D-02). The only technical constraints that *are* in the PRD are the ones scattered elsewhere: Stripe-or-equivalent PCI-compliant provider (§04), "e.g. Supabase" backend + "proper schema" (§15), new Vercel account + new Supabase project + correct env vars (§15.1), responsive on mobile and desktop (§16.1), real-time subscription check on every authenticated request (§04), and the Evaluation criterion "Scalability thinking" (§16).
- **Action for you:** if you have the complete PRD, send me page 11 and I will reconcile all five docs before coding.

### Other document observations (no scope impact)
- The Contents page says *"Sixteen sections"*, but the document also contains a §17 *About this document*.
- Section labels collide: the Contents page header is `§ 01` and the Project overview is also `§ 01`; the Document summary and Core objectives are both `§ 02`; some page headers combine sections (e.g. *§ 09 · Winners & Dashboard* covers §09 and §10). I use the **Contents-page numbering** throughout.
- PRD §06 uses three column headings: **DRAW TYPES** (= the 5-/4-/3-number matches), **DRAW LOGIC** (= Random / Algorithmic), **OPERATIONS**. Rev 1 of these docs mislabelled Random/Algorithmic as "draw types"; corrected below.

## 1. Conventions used in these docs

| Tag | Meaning |
|---|---|
| `[PRD §x]` | Requirement stated explicitly in the PRD, with section reference |
| `[ASSUMPTION D-nn]` | PRD is silent/ambiguous; interpretation logged in `DECISIONS.md` as decision `D-nn` |
| `[EXT]` | Engineering addition not requested by the PRD (kept minimal, clearly labelled, removable) |

PRD terminology is used verbatim: **Public visitor**, **Registered subscriber**, **Administrator**, **Stableford**, **5-Number match / 4-Number match / 3-Number match**, **Jackpot rollover**, **Prize pool**, **Pending → Paid**.

## 2. Project overview `[PRD §01]`

A **subscription-driven web application** combining **golf performance tracking**, **charity fundraising**, and a **monthly draw-based reward engine**. It must feel *"emotionally engaging and modern, deliberately avoiding the aesthetics of a traditional golf website."*

What users do `[PRD §01.1]`:
1. Subscribe (monthly or yearly)
2. Enter their latest golf scores in **Stableford** format
3. Participate in **monthly draw-based prize pools**
4. Support a **charity of their choice** with a portion of their subscription

### Six core objectives `[PRD §02]`

| # | Tag | Objective | Where it lands in the build |
|---|---|---|---|
| 1 | ENGINE | **Subscription** — robust subscription and payment system | Stripe module, webhooks, `subscriptions` |
| 2 | EXPERIENCE | **Score entry** — simple, engaging flow | Scores module, 5-score rolling logic |
| 3 | ENGINE | **Custom draw** — algorithm-powered or random monthly draws | Draw engine (pure, tested) |
| 4 | INTEGRATION | **Charity** — seamless contribution logic | Charity module, contribution ledger |
| 5 | CONTROL | **Admin** — comprehensive dashboard and tools | Admin app area |
| 6 | DESIGN | **Outstanding UI/UX** — stands out in the golf industry | Design system, motion, homepage |

## 3. Feature list

| ID | Feature | PRD § | Priority |
|---|---|---|---|
| F-01 | Public marketing site: concept, draw mechanics, charities, subscribe CTA | §01, §03, §12 | Must |
| F-02 | Signup / login / logout | §03, §15, §16.1 | Must |
| F-03 | Monthly and yearly plans (yearly discounted) | §04 | Must |
| F-04 | Stripe (or equivalent PCI-compliant) checkout + renewal, cancellation, lapsed handling | §04 | Must |
| F-05 | Real-time subscription status check on every authenticated request | §04 | Must |
| F-06 | Restricted access for non-subscribers | §04 | Must |
| F-07 | Score entry (Stableford 1–45, dated) | §05 | Must |
| F-08 | 5-score rolling window, newest-first display | §05 | Must |
| F-09 | One score per date; edit/delete existing | §05 | Must |
| F-10 | **Draw logic**: Random (standard lottery-style) and Algorithmic (weighted by score frequency) | §06, §11 | Must |
| F-11 | **Draw types**: 5-Number match, 4-Number match, 3-Number match | §06 | Must |
| F-12 | Monthly cadence; admin controls publishing; **simulation before publish** (publish blocked without one, D-20) | §06 | Must |
| F-13 | Prize pool auto-calculation per tier from active subscriber count | §07 | Must |
| F-14 | Tier split 40 / 35 / 25 %; equal split among same-tier winners | §07 | Must |
| F-15 | Jackpot rollover (5-match only) | §06, §07 | Must |
| F-16 | Charity selection at signup; min 10 % of fee; voluntary increase | §08.1 | Must |
| F-17 | Independent donation (not tied to gameplay) | §08.1 | Must |
| F-18 | Charity directory (search + filter), profiles (description, images, events), homepage spotlight | §08.2 | Must |
| F-19 | Winner verification: proof upload (score screenshot), admin approve/reject | §09 | Must |
| F-20 | Payout tracking: Pending → Paid | §09 | Must |
| F-21 | User dashboard (5 mandatory modules) | §10 | Must |
| F-22 | Admin dashboard (5 control surfaces) | §11 | Must |
| F-23 | Reports & analytics (total users, total prize pool, charity totals, draw statistics) | §11 | Must |
| F-24 | Motion-enhanced, emotion-led, responsive UI | §12, §16.1 | Must |
| F-25 | Deployment on new Vercel + new Supabase, env vars, test credentials | §15, §15.1 | Must |
| F-26 | Audit log of admin actions | — | `[EXT]` (D-41) |

## 4. User roles and permissions `[PRD §03]`

Three roles, "each with a defined boundary of access — from anonymous browsing to full platform control."

| Capability | Public visitor | Registered subscriber | Administrator |
|---|:-:|:-:|:-:|
| View platform concept | ✅ | ✅ | ✅ |
| Explore listed charities | ✅ | ✅ | ✅ |
| Understand draw mechanics | ✅ | ✅ | ✅ |
| Initiate subscription | ✅ | ✅ (own) | — |
| Manage profile & settings | — | ✅ | ✅ (any user) |
| Enter / edit golf scores | — | ✅ | ✅ (any user) |
| Select charity recipient | — | ✅ | — |
| View participation & winnings | — | ✅ | — |
| Upload winner proof | — | ✅ (winners only) | — |
| Manage users & subscriptions | — | — | ✅ |
| Configure & run draws | — | — | ✅ |
| Manage charity listings | — | — | ✅ |
| Verify winners & payouts | — | — | ✅ |
| Access reports & analytics | — | — | ✅ |

Notes:
- "Public visitor" is an **unauthenticated** state, not a stored role. Stored roles: `subscriber`, `admin` `[ASSUMPTION D-07, D-38]`.
- A *registered* user without an active subscription is neither a visitor nor a full subscriber. PRD says "non-subscribers receive restricted access" — precise boundary defined in D-07.
- Administrator cannot self-register; provisioned by seed/SQL `[ASSUMPTION D-38]`.

## 5. Business rules

### Subscription `[PRD §04]`
- **BR-01** Two plans: monthly and yearly; yearly is at a **discounted rate**.
- **BR-02** Payments via Stripe (or equivalent PCI-compliant provider). No card data touches our servers.
- **BR-03** Non-subscribers get restricted access to platform features.
- **BR-04** Lifecycle must handle **renewal, cancellation, lapsed subscription**.
- **BR-05** Subscription status is validated in real time on **every authenticated request**.

### Scores `[PRD §05]`
- **BR-06** Users enter their **last 5** golf scores.
- **BR-07** Score range **1–45**, Stableford format.
- **BR-08** Every score carries a **date**.
- **BR-09** Only the **latest 5** scores are retained at any time; a new score **replaces the oldest** automatically.
- **BR-10** Scores are displayed **most recent first**.
- **BR-11** **One entry per date.** Duplicate for same date is rejected; the existing entry may only be edited or deleted.

### Draw & pool `[PRD §06, §07]`
- **BR-12** Draw logic: **Random** (standard lottery-style) or **Algorithmic** (weighted by score frequency); admin configures which (§11 *"Configure draw logic (random vs. algorithm)"*).
- **BR-13** Draw types (match tiers): 5-number match, 4-number match, 3-number match.
- **BR-14** Monthly cadence; admin controls publishing; **simulation before publish** — interpreted as: a draw cannot be published unless it has been simulated `[ASSUMPTION D-20]`.
- **BR-15** A **fixed portion of each subscription** contributes to the prize pool; distribution is **pre-defined and enforced automatically** — so the percentage and tier shares are *not* editable from any admin screen; they change only by migration/redeploy `[ASSUMPTION D-45]`.
- **BR-16** Pool share: 5-match **40 %** (rollover: **yes — jackpot**), 4-match **35 %** (no), 3-match **25 %** (no).
- **BR-17** Each pool tier is auto-calculated **based on active subscriber count**.
- **BR-18** Multiple winners in the same tier **split that tier's prize equally**.
- **BR-19** 5-match jackpot **carries forward** if unclaimed.

### Charity `[PRD §08]`
- **BR-20** User selects a charity **at signup**.
- **BR-21** **Minimum** contribution = **10 % of subscription fee**.
- **BR-22** User may **voluntarily increase** their percentage.
- **BR-23** **Independent donation** option, not tied to gameplay.

### Winners `[PRD §09]`
- **BR-24** Verification applies to **winners only**.
- **BR-25** Proof = **screenshot of scores from the golf platform**.
- **BR-26** Admin **approves or rejects** each submission.
- **BR-27** Payment states: **Pending → Paid**.

## 6. Functional requirements

### 6.1 Authentication & profile `[PRD §03, §15, §16.1]`
- FR-AUTH-01 Signup, login, logout. *(Method unspecified → email + password, D-08)*
- FR-AUTH-02 Profile & settings management for registered users.
- FR-AUTH-03 Role-based route protection: public / subscriber / admin.
- FR-AUTH-04 Admin credentials provided as deliverable (§15).

### 6.2 Subscription & payment `[PRD §04]`
- FR-SUB-01 Public pricing with monthly vs yearly (discount visible).
- FR-SUB-02 Checkout via provider-hosted page; success/cancel return flows.
- FR-SUB-03 Webhook-driven state sync: created, renewed, payment failed, cancelled, lapsed.
- FR-SUB-04 User can cancel; access continues per lifecycle rules (D-06).
- FR-SUB-05 Central guard performing the real-time status check on every authenticated request (D-05).
- FR-SUB-06 Dashboard shows status (active / inactive) and **renewal date**.

### 6.3 Score management `[PRD §05]`
- FR-SCORE-01 Create score (value 1–45 integer, date). Reject duplicate date; the UI detects an existing entry for the chosen date and offers **"edit it"** (PRD: *"an existing entry may only be edited or deleted"*).
- FR-SCORE-02 Edit and delete own scores.
- FR-SCORE-03 Enforce rolling window of 5 (DB-level, race-safe).
- FR-SCORE-04 List newest first.
- FR-SCORE-05 Admin can edit any user's scores (§11) under identical validation.

### 6.4 Draw & reward `[PRD §06, §07]`
- FR-DRAW-01 Admin configures **draw logic** (random | algorithmic) per draw; the active distribution config (pool %, 40/35/25) is shown read-only.
- FR-DRAW-02 Admin **runs simulation** any number of times; nothing user-visible is created.
- FR-DRAW-03 Admin **publishes** results **only after at least one simulation exists for that draw** (publish uses a chosen simulation's numbers); publish is atomic, idempotent, single-shot per month, and not allowed for a future month.
- FR-DRAW-04 Engine determines 3/4/5-number matches for every eligible entry.
- FR-DRAW-05 Prize pool per tier computed from active subscriber count; rollover added to 5-match tier.
- FR-DRAW-06 Equal split among same-tier winners; unclaimed 5-match jackpot carries forward.
- FR-DRAW-07 Winners rows created with `Pending` payment state.

### 6.5 Charity `[PRD §08]`
- FR-CH-01 Charity selection during signup; percentage ≥ 10 %.
- FR-CH-02 User can change charity / raise percentage later (D-28).
- FR-CH-03 Contribution amount computed and **recorded per payment** for reporting.
- FR-CH-04 Independent donation flow (D-29).
- FR-CH-05 Directory page with **search and filter**.
- FR-CH-06 Charity profile: description, images, **upcoming events (e.g. golf days)**.
- FR-CH-07 **Homepage spotlight** of featured charity.
- FR-CH-08 Admin: add / edit / delete charities; manage content and media.

### 6.6 Winner verification `[PRD §09]`
- FR-WIN-01 Winners see a claim prompt on dashboard; upload screenshot.
- FR-WIN-02 Admin queue: view submission **beside the winner's draw-time score snapshot** (D-43), then **approve / reject** with a note.
- FR-WIN-03 Admin marks payout **Paid** (only after approval, D-32).
- FR-WIN-04 Winner sees current payment status.

### 6.7 User dashboard `[PRD §10]` — "must include all of the following"
1. Subscription status — active / inactive / renewal date
2. Score entry and edit interface
3. Selected charity and contribution percentage
4. Participation summary — draws entered, upcoming draws
5. Winnings overview — total won and current payment status

Display rule `[ASSUMPTION D-06]`: the PRD shows subscription status as **active / inactive** plus a renewal date. The dashboard therefore shows exactly *Active* or *Inactive* as the headline, with the richer internal state as a sub-label (e.g. *Active — cancels on 12 Oct*, *Inactive — payment past due*, *Inactive — lapsed*).

### 6.8 Admin dashboard `[PRD §11]` — five control surfaces
| # | Surface | Capabilities |
|---|---|---|
| 01 | User management | View/edit user profiles · Edit golf scores · Manage subscriptions |
| 02 | Draw management | Configure draw logic (random vs. algorithm) · Run simulations · Publish results |
| 03 | Charity management | Add, edit, delete charities · Manage content and media |
| 04 | Winners management | View full winners list · Verify submissions · Mark payouts as completed |
| 05 | Reports & analytics | Total users · Total prize pool · Charity contribution totals · Draw statistics |

### 6.9 UI / UX `[PRD §12]`
- **Feel:** clean, modern, motion-enhanced.
- **Avoid:** golf clichés — fairways, plaid, club imagery as primary design language.
- **Homepage** must clearly communicate: *what the user does*, *how they win*, *charity impact*, *call to action*.
- **Animations:** subtle transitions and micro-interactions throughout.
- **CTA:** Subscribe button/flow prominent and persuasive.
- Design *"leads with charitable impact, not sport."*

## 7. Non-functional requirements

| ID | Requirement | Source |
|---|---|---|
| NFR-01 | PCI compliance via hosted provider; no PAN storage | §04 |
| NFR-02 | Real-time subscription validation, every authenticated request | §04 |
| NFR-03 | Responsive on mobile and desktop | §16.1 |
| NFR-04 | Error handling and edge cases covered | §16.1 |
| NFR-05 | Data accuracy across all modules (scores, draws, prizes, contributions) | §16, §16.1 |
| NFR-06 | Clean, structured, **well-commented** codebase | §15 |
| NFR-07 | Extensible codebase and data structures ("Scalability thinking") | §16 |
| NFR-08 | Env vars properly configured; no secrets in repo | §15.1 |
| NFR-09 | Performance, availability, browser support, accessibility targets | **Not in supplied PRD** → D-01/D-39 `[ASSUMPTION]` |
| NFR-10 | Security: authZ at DB (RLS) and app layers, private proof storage, webhook signature verification | `[ASSUMPTION D-33, D-38]` — implied by "PCI", "verification", "admin" |

## 8. Edge cases

**Subscription**
- Payment fails on renewal → past-due; user loses access per D-06; recovers on retry.
- User cancels then resubscribes; user cancels then period ends (lapsed).
- Checkout completed but webhook delayed → user lands on success page before DB updated (reconcile via Stripe lookup).
- Duplicate / out-of-order webhook events → idempotency table.
- Checkout abandoned or 3-D Secure pending (`incomplete`) → treated as inactive; retrying checkout must not conflict with the stale attempt.
- User already has a live subscription and opens checkout again → refused, redirected to the Customer Portal.
- Monthly → yearly switch (D-09). Refunds/chargebacks: not in PRD; status flows through webhooks.

**Scores**
- Same date submitted twice (reject); edit that would move a score onto an existing date (reject).
- 6th score submitted (oldest evicted); backdated 6th score older than all five (D-10).
- Delete a score leaving 4 (allowed; user below eligibility threshold, D-13).
- Value 0, 46, decimal, negative, non-numeric; future date (D-11).
- Two concurrent inserts racing past the limit → DB trigger with per-user advisory lock.
- Lapsed subscriber's scores: retained, read-only (D-12).

**Draw / prize**
- Zero eligible entries; fewer subscribers than needed to fill tiers.
- No 5-match winner → rollover. No 4- or 3-match winner → tier unallocated (D-24).
- Many winners in one tier → per-winner prize floors to smallest currency unit; remainder handling (D-26).
- Double-click publish / two admins publish simultaneously → row lock + unique `draw_month`.
- Publish attempted with **no simulation** → blocked (`DRAW_NOT_SIMULATED`).
- Publish attempted for a **future month** → blocked (`DRAW_FUTURE_MONTH`).
- Subscriber lapses or scores change between simulation and publish (D-20).
- Same score value repeated within a user's five (D-15).
- Admin publishes out of order / skips a month (D-18).
- Jackpot winner rejected or never claims (D-25).

**Charity**
- Charity deleted while referenced (soft-archive, D-30).
- Percentage < 10 or > allowed max (rejected in UI, API, and DB check).
- Changing charity mid-period (prospective only, D-28).
- Donation by user with no subscription (D-29).

**Winners**
- Wrong file type/oversized screenshot; resubmission after rejection (D-32, D-33).
- Winner whose subscription has lapsed still needs to upload proof and see winnings (D-07).
- Admin tries to mark Paid before approval (blocked, DB check).

**Security / access**
- User tries to read another user's proof or scores (RLS).
- Non-admin hits `/admin/*` (middleware + RLS + server-side check).
- Unauthenticated access to dashboard (redirect to login).

## 9. Testing requirements

### 9.1 PRD testing checklist `[PRD §16.1]` → planned coverage
| # | PRD checklist item | Test layers |
|---|---|---|
| 1 | User signup & login | E2E, integration (auth + profile trigger) |
| 2 | Subscription flow (monthly and yearly) | E2E with Stripe test mode + Stripe CLI webhooks; webhook unit tests |
| 3 | Score entry — 5-score rolling logic | Unit (rules), DB/trigger tests, E2E |
| 4 | Draw system logic and simulation | Unit (engine, seeded RNG), integration (RPC publish), E2E |
| 5 | Charity selection and contribution calculation | Unit (percent maths), integration (ledger per payment) |
| 6 | Winner verification flow and payout tracking | E2E (upload → approve/reject → Paid), RLS tests |
| 7 | User dashboard — all modules functional | E2E, component tests |
| 8 | Admin panel — full control and usability | E2E, RBAC tests |
| 9 | Data accuracy across all modules | Reconciliation tests (report totals = ledger sums) |
| 10 | Responsive design on mobile and desktop | Playwright viewports (375 / 768 / 1280) |
| 11 | Error handling and edge cases | §8 list turned into test cases |

### 9.2 Evaluation criteria `[PRD §16]` → what we optimise
| Criterion | Measures | Our response |
|---|---|---|
| Requirements interpretation | Accuracy of requirement → feature translation | This analysis + traceability tags |
| System design | Architecture and data modelling | `ARCHITECTURE.md`, `DATABASE.md` |
| UI/UX creativity | Originality, polish, emotional engagement | Charity-led design, motion system |
| Data handling | Score logic, draw engine, prize maths | Pure engine + integer money + tests |
| Scalability thinking | Extensibility | Modular services, provider interface, config table, indexes |
| Problem-solving | How ambiguity is identified and resolved | `DECISIONS.md` |

## 10. Deployment requirements `[PRD §15, §15.1]`

| Deliverable | Requirement |
|---|---|
| Live website | Fully deployed, **publicly accessible URL** |
| User panel | **Test credentials**; signup / login / score entry / dashboard functional |
| Admin panel | **Admin credentials**; user management, draw system, charities, winner verification |
| Database | Backend connected (e.g. Supabase) with **proper schema** |
| Source code | Clean, structured, well-commented |

Constraints:
- Deploy to a **new Vercel account** (not personal/existing).
- Use a **new Supabase project** (not personal/existing).
- **Environment variables** properly configured.

Implication: the repo must be fully reproducible from migrations + seed + `.env.example`; nothing may depend on an existing personal project.

## 11. Ambiguity index (details in `DECISIONS.md`)

Highest-impact ambiguities, since they change numbers or behaviour:

1. **Missing §13/§14** (D-01).
2. **What the draw numbers are and how they match a user's 5 scores** (D-14, D-15).
3. **"Fixed portion of each subscription"** — the percentage is not stated (D-22).
4. **Plan prices, discount, currency** (D-03).
5. **What "latest 5" means** when a backdated score is entered (D-10).
6. **Algorithmic weighting direction** (D-17).
7. **Tiers with no winner (4/3-match)** (D-24).
8. **Yearly plan → monthly pool contribution** (D-23).
9. **Charity % maximum / interplay with pool** (D-27).
10. **What "restricted access" means** (D-07).
11. **Independent donation scope** (D-29).
12. **Rejected proof handling** (D-32).
13. **Simulation is mandatory before publish** (D-20).
14. **What "unclaimed" means for the jackpot** — no winner vs winner not claiming (D-25).
15. **"Screenshot of scores from the golf platform"** — which platform (D-43).
16. **"Pre-defined and enforced automatically"** — distribution is not admin-editable (D-45).

## 12. Worked acceptance examples (become unit tests)

Placeholder inputs (D-03, D-22): monthly ₹499, yearly ₹4,999, prize-pool 50 %. All money in paise.

**AT-01 — Prize pool, tiers, split, rollover** (PRD §07)
- Active subscribers: 60 monthly + 40 yearly. Monthly equivalent: monthly `49,900`; yearly `floor(499,900 / 12) = 41,658`.
- Contribution each at 50 %: monthly `24,950`; yearly `20,829`.
- `poolNew = 60 × 24,950 + 40 × 20,829 = 1,497,000 + 833,160 = 2,330,160` (₹23,301.60).
- Tier pools: 5-match 40 % = `932,064` · 4-match 35 % = `815,556` · 3-match 25 % = `582,540` (sum = `2,330,160`, no dust).
- Suppose **0** five-match winners, **3** four-match winners, **7** three-match winners, `rolloverIn = 0`:
  - 5-match: no winner → `932,064` becomes `rollover_out` (**jackpot rollover**).
  - 4-match: `815,556 / 3 = 271,852` each (**equal split**).
  - 3-match: `582,540 / 7 = 83,220` each.
  - Conservation: `3×271,852 + 7×83,220 + 932,064 = 2,330,160 = poolNew + rolloverIn` ✔
- Next month with the same pool and one five-match winner: 5-match pool = `932,064 + 932,064 = 1,864,128` to that single winner.

**AT-02 — Score rolling window** (PRD §05)
- Stored (dates): 1, 2, 3, 4, 5 Sep. Add **6 Sep** → 1 Sep evicted; list shows 6, 5, 4, 3, 2 Sep (newest first).
- Add **3 Sep** again → rejected (one score per date); UI offers to edit the 3 Sep entry.
- Add **30 Aug** (older than all five) → rejected under the default `backdated_score_policy` (D-10).
- Values `0`, `46`, `12.5`, `"abc"` → rejected; `1` and `45` → accepted.

**AT-03 — Charity contribution** (PRD §08.1)
- Monthly invoice ₹499 (`49,900`): at 10 % → `4,990`; at 15 % → `7,485`; at 9 % → **rejected**.
- Yearly invoice ₹4,999 (`499,900`): at 10 % → `49,990`.
- User raises 10 % → 15 % mid-year: past `subscription_payments` rows are unchanged; the next invoice uses 15 % (D-28).

**AT-04 — Lifecycle** (PRD §04)
- `active` → user cancels → still `active` (label *"cancels on <date>"*) until `current_period_end` → then `lapsed`: scores read-only, no draw entry, winnings/proof still accessible.
- Renewal payment fails → `past_due` → restricted (default); payment recovered → `active` on the next request.

**AT-05 — Simulation gate** (PRD §06)
- New draw (`draft`) → publish → **blocked**. Simulate → `simulated` → publish → `published`; a second publish → blocked.

## 13. PRD coverage self-check (Rev 2)

| PRD § | Topic | Covered in this document |
|---|---|---|
| §00 Cover | Six objectives, single source of truth | §1, §2 |
| §01 Contents / §02 Summary | Structure, purpose | §0, §1 |
| §01 Overview | Platform concept, four user activities | §2 |
| §02 Core objectives | 6 objectives | §2 |
| §03 User roles | 3 roles, 14 capabilities | §4 |
| §04 Subscription & payment | Plans, gateway, access control, lifecycle, validation | §5 BR-01–05, §6.2 |
| §05 Score management | 5 scores, 1–45, dates, retention, order, one per date | §5 BR-06–11, §6.3, AT-02 |
| §06 Draw & reward | Draw types, draw logic, operations | §5 BR-12–14, §6.4, AT-05 |
| §07 Prize pool | Fixed portion, 40/35/25, rollover, split, active-count | §5 BR-15–19, AT-01 |
| §08 Charity | Contribution model, directory, profiles, spotlight | §5 BR-20–23, §6.5, AT-03 |
| §09 Winner verification | Winners only, screenshot, approve/reject, Pending → Paid | §5 BR-24–27, §6.6 |
| §10 User dashboard | 5 mandatory modules | §6.7 |
| §11 Admin dashboard | 5 control surfaces | §6.8 |
| §12 UI/UX | Feel, avoid, homepage, animations, CTA | §6.9 |
| §13 Technical requirements | **Missing from supplied PDF** | §0 (D-01) |
| §14 Scalability considerations | **Missing from supplied PDF** | §0 (D-01); design-level answer in `ARCHITECTURE.md` §12 |
| §15 / §15.1 Deliverables & constraints | Live site, panels, DB, code, new Vercel/Supabase, env vars | §10 |
| §16 / §16.1 Evaluation & checklist | 6 criteria, 11 checklist items | §9 |
| §17 About | "Ambiguity is part of the test" | §0, `DECISIONS.md` |
