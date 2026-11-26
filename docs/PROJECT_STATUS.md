# FitFirst Project Status

> **The answer to "where are we and what's next".** Update at the end of every working session — see [AGENTS.md](../AGENTS.md) §5. History goes in [SESSION_LOG.md](SESSION_LOG.md); choices go in [DECISIONS.md](DECISIONS.md). Keep this file short enough to paste into any AI chat.

## Right now

- **Last updated:** 26 November 2026
- **Target design:** `prototype_v2/` (DEC-26, 17 Nov). Its screens that had no task were added to the checklist as 34 **V2 draft** tasks (116 → 150) for the owners' review; they do not change the order of work below. Each stage gate now needs a V2 comparison first
- **AI model per task:** tasks in Stages 0, 0.5, 1, 2 and 7 carry a tier (deep / standard / light / none); pick the model from `AGENTS.md` §4b (DEC-27)
- **Stage:** Stage 0.5 complete (20 Nov); **Stage 1 accepted 21 Nov 2026** (D-03, DEC-33). Next is the **perception track** (DEC-32), before Stage 2
- **Focus:** the owners (Ravindra, Het Thakkar) review the draft [PERCEPTION_PLAN.md](PERCEPTION_PLAN.md) (tasks SP-01 … SP-12 approved into the checklist 23 Nov as Stage P; every perception decision answered 22–23 Nov: P-D1 MediaPipe in the browser, DEC-35; P-D2 built-in camera for now, webcam kit before real testing, DEC-36; P-D3 rules drafted from published guidance and reviewed by a stylist, DEC-37, with no stylist found yet; P-D4 full bar on 200 people before any shopper sees a scan, DEC-38; D-11 body shape as unnamed drawings with fit-goal words, DEC-39; D-25 five women's shapes plus a men's set, DEC-40). Stage 7 (S7-02 … S7-06) is unblocked by DEC-33; when it runs relative to the perception track is the owners' call. The early S7-04 error-shape commit `caa85a7` counts as that task's first piece
- **Maturity:** single-store pilot prototype
- **Branch:** `architecture-changes` is the shared integration branch (DEC-42): each owner works on their own task branch and merges through a PR the other owner reviews; catch up with `git fetch` + merge at the start of every session. Het's `origin/feature/s7` (`d4c3aca`, 25 Nov, S7-04 validated config module) is pushed but not yet merged or reviewed. `main` has none of the Stage 0.5, Stage 1 or Stage P work (verify with `git status` before relying on it)
- **Blocked on owner decision:** yes — the perception plan review (none left; SP-01 waits only for Ravindra to say start; work split agreed, DEC-41); D-04 / D-05 (pilot shop, POS path) before any pitch
- **Calendar pressure:** MASTER_PLAN §11 targeted an October pitch and an early-December go-live. October has passed with the pitch kit (Stage 0, S0-10) not started and no pilot shop confirmed, so whether early December still holds is an open question for Ravindra

## Start here (the next three actions)

1. **Review the perception plan** ([PERCEPTION_PLAN.md](PERCEPTION_PLAN.md), draft 21 Nov): Stage P is approved (SP-01 … SP-12) and **split between the owners** (DEC-41; the "Work split" table in the checklist; `npm run brief` shows your next task). Day 1: both owners agree the shared result format (30 min); then Ravindra starts SP-01 and Het starts S7-04. Previously: an owner says "start SP-01" (the MediaPipe test page, the first code change); in parallel Claude drafts the SP-04 rule tables and the owners look for a stylist (SP-12). Start looking for a stylist who knows Indian wear to review the rule tables (DEC-37).
2. **Pilot-shop conversation (D-04 / D-05)** in parallel: it is the main business step, and the shop's camera hardware feeds P-D2; `docs/TEAM_GUIDE.md` lists the questions for team discussion.

## Progress at a glance

| Stage | Done | Partial | Open | Total | State |
|---|---|---|---|---|---|
| 0 — Direction and safety | 3 | 1 | 6 | 10 | Keys rotated (S0-04, awaiting tick); rest waiting on owner input |
| 0.5 — Urgent technical fixes | 9 | 0 | 0 | 9 | **Complete (20 Nov 2026)**, past the 2 Oct deadline. S05-01 … S05-03 accepted after a live dashboard scan; S05-09 CI green on GitHub (build, vitest, lint, pytest, gitleaks) |
| 1 — Stabilise the pilot | 13 | 0 | 0 | 13 | **Accepted 21 Nov 2026** (DEC-33); camera S1-08 passed after the beta wording fix; follow-ups in DEC-33 |
| P — Perception (core track) | 0 | 0 | 12 | 12 | **Next.** Tasks approved 23 Nov 2026; all decisions answered (DEC-35 … DEC-40). Can start: SP-01, the SP-04 draft, SP-06, SP-12 (owner: find a stylist) |
| 2 — Single-store operations | 0 | 0 | 42 | 42 | Not started; 4 decisions first |
| 3 — Customer and staff experience | 0 | 0 | 23 | 23 | Planned |
| 4 — Measurement and deployment | 0 | 0 | 13 | 13 | Planned |
| 5 — Recommendation evidence and AI | 0 | 0 | 14 | 14 | Planned |
| 6 — Multi-store and commercial | 0 | 0 | 20 | 20 | Planned |
| 7 — Engineering foundations (parallel) | 0 | 2 | 4 | 6 | S7-01 implemented (CI green on GitHub since 20 Nov), not accepted; S7-02 … S7-06 unblocked by DEC-33; S7-04's error-shape piece (`caa85a7`) done, the rest not started |
| **Total** | **25** | **3** | **134** | **162** | |

Update these counts whenever you tick an item in [END_TO_END_CHECKLIST.md](END_TO_END_CHECKLIST.md).

## Decisions waiting on you

Full list and trade-offs in [DECISIONS.md](DECISIONS.md).

| ID | Question | Urgency |
|---|---|---|
| D-04 / D-05 | Pilot shop and scope; POS path A or B | Before the pitch meeting |
| D-06 / D-07 | v2 migration strategy; how stock is split into sizes | Before Stage 2 coding |
| D-20 | When do `orgId` / `storeId` go into the database? | Before Stage 2 schema work |
| D-21 … D-24 | Raised from the V2 target: staff-text language in assisted mode; near-miss alternatives in the staff view; staff incentives; exchange window and kiosk idle timing | With the stage that needs each |
| (review) | Review the 34 **V2 draft** tasks in the checklist: keep, edit, merge or delete | Before Stage 2 is decomposed |

## Hard dates

| Date | What |
|---|---|
| ~~2 Oct 2026~~ (passed) | `gemini-2.5-flash-image` shutdown date; the try-on default was moved to `gemini-3.1-flash-image` on 24 Oct (S05-05, not yet live-checked) |
| ~~8 Nov 2026~~ (passed) | Diwali; the plan targets an early-December go-live, which is still an open question |
| 13 May 2027 | India's DPDP obligations take full effect |

## Verified facts

**Confirmed by running something:**
- Backend, dashboard and kiosk production builds pass.
- Root lint (ESLint) runs clean of errors (73 warnings) and the backend's 46 tests pass after the S7-01 tooling change (3 Oct 2026). The GitHub CI workflow has not run yet.
- PostgreSQL integration checks pass in a disposable schema: repeat session requests, stable recommendation snapshots, duplicate sales, concurrent last-unit sales, rollback, invalid stock and distinct-session metrics.
- An additive migration was applied after a local backup; existing products were retained.
- Stage 1 browser checks (25 Sep 2026, Chromium, demo data): staff PIN/refresh/lock, full customer path to handoff and dashboard lookup, idle warning and reset, recommended and other-item sales with double-click, invalid stock, CSV validation and analytics all pass. Five issues found and fixed the same day, including Edit preferences now updating the same session (DEC-18). Log in `STAGE_1_TEST_GUIDE.md`.
- The AI service's Python tests pass (49, 25 Sep 2026), including tagger tests against a mocked AICredits gateway: bad AI answers become "needs review", never a guessed value.
- The dashboard production build passes with the "needs review" change (25 Sep 2026).
- The "AI off" banner was checked in Chromium against a throwaway local database (25 Sep 2026): it names the reason (no key, service down, or the AI call's error). The backend has 46 tests.
- Dashboard scans now actually reach the AI service: the scan proxy sent `[object FormData]` instead of the photo, and has been fixed (proven in a browser; a regression test fails on the old code).

- The tagger loads `backend/.env` whatever directory it is started from (S05-04, 24 Oct 2026): AI service Python tests → 50 passed, including a regression test that ignores a stray `../.env`.
- The try-on prototype defaults to `google/gemini-3.1-flash-image` in code, README and `.env.example` (S05-05, 24 Oct 2026): its 13 tests pass. A live try-on call with that model is not verified.
- The three provider keys (Gemini, OpenRouter, AICredits) were rotated and spend caps set (DEC-21; reported by Ravindra, 22 Oct 2026; not checked by AI, by design).
- Backend unit tests pass on `architecture-changes` with the new error shape (8 Nov 2026): `npm test` → 55 passed (46 before, plus 9 in `src/lib/errors.test.ts`).

**Not verified:**
- Commit `caa85a7` (the API's new error shape) beyond unit tests: builds, `npm run test:integration` and the dashboard's error messages in a browser were not run after it.
- `setup.ps1` (added 4 Nov): not run on a clean machine in any recorded check.
- The camera flow (S1-08): needs a real camera and store lighting.
- Screenshots for the Stage 1 checks (S1-12).
- A live AICredits tagging call: the model ID, image input, the JSON response schema and replies through the gateway are untested.
- The dashboard's "needs review" display and required fields, in a browser.
- Camera accuracy under real store lighting.
- Real pilot data quality and the live-store workflow.
- Production deployment, restore, monitoring, privacy/legal review, device testing.

## Current product boundaries

- Stock is per product, not per size or colour variant.
- The sales flow is not a complete POS: no receipts, payments, returns or exchange handling.
- The camera estimates skin tone only, and is not validated for store use.
- The Python garment service is optional and its output needs human review.
- Not multi-store, not subscription-ready, not deployed.
- Try-on stays a separate prototype until integration is approved (D-12).
- Demo and baseline seed data are random numbers, not store evidence.

## Noticed, not actioned

Real findings from code review that are **not** yet tasks. Raise them to the checklist when a stage picks them up.

| Finding | Where |
|---|---|
| `prototype_v2/` is the target design (DEC-26); its screens are now V2 draft tasks. The open decisions it assumed (D-04, D-05, D-07 … D-12, D-14 … D-16, D-20) are still open. Biggest remaining demo gap: no real product photos (S0-10) | `prototype_v2/`, `prototype_v2/PROTOTYPE_V2_IMPROVEMENTS.md` |
| V1 (`prototype/`) is kept as a reference. Its register's two open questions are now handled: control-group flags hidden from staff (part of DEC-26), near-miss alternatives raised as D-22 | `prototype/`, `PROTOTYPE_GAPS_AND_IMPROVEMENTS.md` §3, §5.5, §5.8 |
| `bulk_import_sample.csv` has a saree row with `sizeRange = UNISEX` (a gender value), so that row could never be recommended | repo root |
| When a session has no skin tone, recommendations silently assume `WHEATISH` (Tone 2) | `kiosk/src/screens/Recommendations.tsx:80,97` |
| The kiosk's progress dots show 5 steps while the screens say "Step 01 / 04" | `kiosk/src/screens/*` |
| A kids' dhoti set in the sample CSV is filed under the `KIDS_KURTA` category | `bulk_import_sample.csv` |
| `CATEGORY_PATTERN_AFFINITY` is written but never imported | `backend/src/scoring/tables.ts:138-173` |
| A fresh checkout needs `npx prisma generate` before `npm test`, or 3 scoring tests fail with "Cannot convert undefined or null to object" | `backend/` |
| Inventory low-stock and ageing highlights use a CSS variable that is not defined, so they never show colour | `dashboard/src/pages/Inventory.tsx` |
| `.gitignore` ends with a bare `.env.example` line after `!.env.example`, so any new `.env.example` (e.g. a sub-folder's) is ignored; the root one is tracked only because it was added earlier | `.gitignore` (last line) |
| The CI workflow still runs `npm install` with a comment saying the lock file is git-ignored; since S05-06 it is committed, so CI could use `npm ci` (S05-09) | `.github/workflows/ci.yml:18-19` |
| Shutdown disconnects Prisma before closing the server, so requests in progress can fail during a restart (read from the code, not run) | `backend/src/index.ts:90-94` |
| `Product.sku` and `DailyBaseline.date` are unique across the whole database, so adding a store needs these constraints changed too; `ARCHITECTURE.md` §7 calls tenancy "one migration and a query filter", which understates it (see D-20) | `backend/prisma/schema.prisma:97,179` |
| `/health` reports `ok` without checking the database | `backend/src/index.ts:83` |

## Working here

| Command | What it does |
|---|---|
| `npm run brief` | Prints this file's key sections — run it when starting any AI chat |
| `npm run docs:check` | Verifies the docs agree with each other (counts, IDs, links, freshness) — run it before finishing |
| `/handoff` | Claude Code and Copilot: does the end-of-session doc update |

## Where to look next

- **What to do:** [END_TO_END_CHECKLIST.md](END_TO_END_CHECKLIST.md)
- **What was decided:** [DECISIONS.md](DECISIONS.md)
- **How we got here:** [SESSION_LOG.md](SESSION_LOG.md)
- **Why and how, in depth:** [MASTER_PLAN.md](MASTER_PLAN.md)
- **How to work here:** [AGENTS.md](../AGENTS.md)
- **How code is structured:** [ENGINEERING_STANDARDS.md](ENGINEERING_STANDARDS.md)
- **How to learn the project (founder reading and running path):** [FOUNDER_GUIDE.md](FOUNDER_GUIDE.md)
- **Plain-English guide and discussion questions for non-technical teammates:** [TEAM_GUIDE.md](TEAM_GUIDE.md)
