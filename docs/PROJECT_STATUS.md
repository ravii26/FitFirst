# FitFirst Project Status

> **The answer to "where are we and what's next".** Update at the end of every working session — see [AGENTS.md](../AGENTS.md) §5. History goes in [SESSION_LOG.md](SESSION_LOG.md); choices go in [DECISIONS.md](DECISIONS.md). Keep this file short enough to paste into any AI chat.

## Right now

- **Last updated:** 24 October 2026
- **Stage:** Stage 0.5 (urgent fixes, approved 25 Sep) in progress and **past its 2 Oct deadline**; Stage 1 implemented, **not yet accepted**
- **Focus:** finish Stage 0.5 (S05-01 … S05-03 owner check, then S05-08 … S05-09), then the camera check (S1-08) and Ravindra's Stage 1 decision (D-03). S05-04 (`.env` path) was implemented and accepted 24 Oct; S05-05 (try-on default model) implemented and accepted 24 Oct; S05-06 (repo hygiene) implemented and accepted 24 Oct; S05-07 (config truth) implemented and accepted 24 Oct; the API keys were rotated (DEC-21)
- **Maturity:** single-store pilot prototype
- **Branch:** `feature/stage-1-pilot-stabilization` (verify with `git status` before relying on it)
- **Blocked on owner decision:** yes — D-03 (Stage 1 acceptance); D-04 / D-05 (pilot shop, POS path) before any pitch
- **Calendar pressure:** MASTER_PLAN §11 targeted an October pitch and an early-December go-live. The pitch kit (Stage 0, S0-10) has not started and Diwali is 8 Nov, so whether early December still holds is an open question for Ravindra

## Start here (the next three actions)

1. **S05-01 … S05-03 owner check** (the scan-proxy bug that blocked every dashboard scan was fixed 25 Sep, DEC-17): put the **newly rotated** `AICREDITS_API_KEY` in `backend/.env`, start the AI service, scan one real garment from the dashboard, and confirm `/scan` shows `aicredits (<model>)` and `/health` shows the model. The default model ID `google/gemini-2.5-flash-lite` is unconfirmed on AICredits; set `AICREDITS_TAG_MODEL` if it differs. If the call fails with a `response_format` error, set `AICREDITS_JSON_SCHEMA=0`.
2. **S05-08 … S05-09.** The 2 Oct deadline has passed. S05-04 … S05-07 are accepted. Next is **S05-08** (demo-facing kiosk fixes); its skin-tone label wording is customer-facing, so the proposed labels go to Ravindra before any change.
3. **S1-08 camera check, then D-03.** Ravindra runs the camera check, then accepts Stage 1 or raises a defect list from the browser test log in `STAGE_1_TEST_GUIDE.md`. In parallel, the pilot-shop conversation (D-04 / D-05) is the main business step; `docs/TEAM_GUIDE.md` lists the questions for team discussion.

## Progress at a glance

| Stage | Done | Partial | Open | Total | State |
|---|---|---|---|---|---|
| 0 — Direction and safety | 3 | 1 | 6 | 10 | Keys rotated (S0-04, awaiting tick); rest waiting on owner input |
| 0.5 — Urgent technical fixes | 4 | 3 | 2 | 9 | **Past the 2 Oct deadline** — approved (D-01); S05-04 … S05-07 accepted; S05-01 … S05-03 implemented, owner check not run |
| 1 — Stabilise the pilot | 0 | 11 | 2 | 13 | Browser checks recorded 25 Sep (camera S1-08 left); awaiting D-03 |
| 2 — Single-store operations | 0 | 0 | 31 | 31 | Not started; 4 decisions first |
| 3 — Customer and staff experience | 0 | 0 | 12 | 12 | Planned |
| 4 — Measurement and deployment | 0 | 0 | 11 | 11 | Planned |
| 5 — Recommendation evidence and AI | 0 | 0 | 12 | 12 | Planned |
| 6 — Multi-store and commercial | 0 | 0 | 12 | 12 | Planned |
| 7 — Engineering foundations (parallel) | 0 | 1 | 5 | 6 | S7-01 implemented, not accepted (CI never run on GitHub); S7-02 … S7-06 wait for D-03 |
| **Total** | **7** | **16** | **93** | **116** | |

Update these counts whenever you tick an item in [END_TO_END_CHECKLIST.md](END_TO_END_CHECKLIST.md).

## Decisions waiting on you

Full list and trade-offs in [DECISIONS.md](DECISIONS.md).

| ID | Question | Urgency |
|---|---|---|
| D-03 | Accept Stage 1, or raise a defect list? | After the camera check (S1-08) |
| D-04 / D-05 | Pilot shop and scope; POS path A or B | Before the pitch meeting |
| D-06 / D-07 | v2 migration strategy; how stock is split into sizes | Before Stage 2 coding |

## Hard dates

| Date | What |
|---|---|
| ~~2 Oct 2026~~ (passed) | `gemini-2.5-flash-image` shutdown date; the try-on default was moved to `gemini-3.1-flash-image` on 24 Oct (S05-05, not yet live-checked) |
| **8 Nov 2026** | Diwali — avoid go-live and cut-overs around it; the plan targets early December |
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

**Not verified:**
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
| `bulk_import_sample.csv` has a saree row with `sizeRange = UNISEX` (a gender value), so that row could never be recommended | repo root |
| The kiosk's progress dots show 5 steps while the screens say "Step 01 / 04" | `kiosk/src/screens/*` |
| A kids' dhoti set in the sample CSV is filed under the `KIDS_KURTA` category | `bulk_import_sample.csv` |
| `CATEGORY_PATTERN_AFFINITY` is written but never imported | `backend/src/scoring/tables.ts:138-173` |
| A fresh checkout needs `npx prisma generate` before `npm test`, or 3 scoring tests fail with "Cannot convert undefined or null to object" | `backend/` |
| Inventory low-stock and ageing highlights use a CSS variable that is not defined, so they never show colour | `dashboard/src/pages/Inventory.tsx` |
| `.gitignore` ends with a bare `.env.example` line after `!.env.example`, so any new `.env.example` (e.g. a sub-folder's) is ignored; the root one is tracked only because it was added earlier | `.gitignore` (last line) |
| Ravindra's `backend/.env` sets `AICREDITS_TAG_MODEL=gemini-2.0-flash`, so the tagger is not using the code default (`google/gemini-2.5-flash-lite`); worth confirming during the S05-01 … S05-03 owner check | `backend/.env` (local, not in git) |
| The CI workflow still runs `npm install` with a comment saying the lock file is git-ignored; since S05-06 it is committed, so CI could use `npm ci` (S05-09) | `.github/workflows/ci.yml:18-19` |

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
