# FitFirst Project Status

> **The answer to "where are we and what's next".** Update at the end of every working session — see [AGENTS.md](../AGENTS.md) §5. History goes in [SESSION_LOG.md](SESSION_LOG.md); choices go in [DECISIONS.md](DECISIONS.md). Keep this file short enough to paste into any AI chat.

## Right now

- **Last updated:** 24 September 2026
- **Stage:** Stage 1 (stabilise the pilot) — implemented, **not yet accepted**
- **Focus:** record the Stage 1 browser checks, and clear the urgent model/key fixes
- **Maturity:** single-store pilot prototype
- **Branch:** `feature/stage-1-pilot-stabilization` (verify with `git status` before relying on it)
- **Blocked on owner decision:** yes — D-01, D-02, D-03

## Start here (the next three actions)

1. **D-02 — today, owner only.** Rotate the three live API keys in `AI Creation/saree-studio/.env` (Gemini, OpenRouter, AICredits) and set spend caps. No AI should touch these values.
2. **D-01 — by 2 Oct.** Approve Stage 0.5, the urgent fixes. The try-on prototype's image model shuts down **2 October 2026**, and two of the garment tagger's three models are already shut down, so tagging silently drops to a guess-from-image-shape fallback.
3. **S1-06 … S1-12.** Run and record the Stage 1 browser checks on dedicated test stock, especially recommendations → handoff → dashboard → sale.

## Progress at a glance

| Stage | Done | Partial | Open | Total | State |
|---|---|---|---|---|---|
| 0 — Direction and safety | 3 | 0 | 7 | 10 | Waiting on owner input |
| 0.5 — Urgent technical fixes | 0 | 0 | 9 | 9 | **Deadline 2 Oct** — needs D-01 |
| 1 — Stabilise the pilot | 0 | 5 | 8 | 13 | Automated checks pass; browser checks not recorded |
| 2 — Single-store operations | 0 | 0 | 31 | 31 | Not started; 4 decisions first |
| 3 — Customer and staff experience | 0 | 0 | 12 | 12 | Planned |
| 4 — Measurement and deployment | 0 | 0 | 11 | 11 | Planned |
| 5 — Recommendation evidence and AI | 0 | 0 | 12 | 12 | Planned |
| 6 — Multi-store and commercial | 0 | 0 | 12 | 12 | Planned |
| **Total** | **3** | **5** | **102** | **110** | |

Update these counts whenever you tick an item in [END_TO_END_CHECKLIST.md](END_TO_END_CHECKLIST.md).

## Decisions waiting on you

Full list and trade-offs in [DECISIONS.md](DECISIONS.md).

| ID | Question | Urgency |
|---|---|---|
| D-02 | Rotate the three exposed API keys | **Today** |
| D-01 | Go-ahead for the urgent technical fixes | **By 2 Oct** |
| D-03 | Accept Stage 1, or raise a defect list? | After the browser checks |
| D-04 / D-05 | Pilot shop and scope; POS path A or B | Before the pitch meeting |
| D-06 / D-07 | v2 migration strategy; how stock is split into sizes | Before Stage 2 coding |

## Hard dates

| Date | What |
|---|---|
| **2 Oct 2026** | `gemini-2.5-flash-image` shuts down — the try-on prototype stops working |
| Any day | `gemini-2.5-flash` (the tagger's last working model) is restricted for new projects and reported returning 404s |
| 8 Nov 2026 | Diwali — avoid go-live and cut-overs around it; the plan targets early December |
| 13 May 2027 | India's DPDP obligations take full effect |

## Verified facts

**Confirmed by running something:**
- 42 backend unit tests pass.
- Backend, dashboard and kiosk production builds pass.
- PostgreSQL integration checks pass in a disposable schema: repeat session requests, stable recommendation snapshots, duplicate sales, concurrent last-unit sales, rollback, invalid stock and distinct-session metrics.
- An additive migration was applied after a local backup; existing products were retained.
- Browser verification reached the kiosk's privacy, department, size and preference screens.

**Not verified:**
- The full browser journey through recommendations, handoff, dashboard lookup and sale.
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
| The `openai` package and `OPENAI_API_KEY` are read but unused in the AI service | `backend/ai-service/` |
| Inventory low-stock and ageing highlights use a CSS variable that is not defined, so they never show colour | `dashboard/src/pages/Inventory.tsx` |

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
