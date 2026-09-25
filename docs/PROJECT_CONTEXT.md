# FitFirst Project Context

> **Portable handoff for any AI assistant.** Read this file, then [PROJECT_STATUS.md](PROJECT_STATUS.md) (where we are) and [END_TO_END_CHECKLIST.md](END_TO_END_CHECKLIST.md) (what's next). The working rules live in [AGENTS.md](../AGENTS.md); choices live in [DECISIONS.md](DECISIONS.md); history lives in [SESSION_LOG.md](SESSION_LOG.md). [MASTER_PLAN.md](MASTER_PLAN.md) is the full product and architecture plan — read the section you need, not the whole file.

## Product

FitFirst is an in-store recommendation system for independent Indian clothing retailers. It helps shoppers find real, available garments that suit them, helps staff serve them faster, and helps owners sell through ageing stock.

Three surfaces plus a helper service:

| Part | Path | Port | What it is |
|---|---|---|---|
| Kiosk | `kiosk/` | 5174 | Customer consultation app (React, no router; screens are a state machine) |
| Dashboard | `dashboard/` | 5173 | Staff and owner app (React Router, Chart.js) |
| API | `backend/` | 3000 | Fastify + Prisma + PostgreSQL |
| Garment tagger | `backend/ai-service/` | 8000 | Optional Python FastAPI service |

`AI Creation/saree-studio/` is a standalone virtual try-on prototype. It is **git-ignored, contains live API keys, and is not integrated**.

**Who it serves:** the shopper (find something that suits me, fast), the salesperson (know what to bring and to whom), the owner (clear ageing stock and see what actually sold).

## Current reality

A **single-store pilot prototype**. Not production, not multi-tenant, not a POS.

**What exists:**
- Customer kiosk flow: department → size → preferences → attributes → recommendations → staff handoff.
- Staff dashboard: inventory, sessions, purchase logging, baseline data, analytics.
- Deterministic recommendation scoring with stock, department, size and active-product gates.
- PostgreSQL persistence through Prisma; server-side staff authentication; image signature validation.
- Stage 1 automated verification, and a browser walkthrough that stopped partway.

**What does not exist yet:**
- Per-size stock (stock is one number per product), real stock ageing, or variants.
- A complete sale: receipts, payments, returns, exchanges, audit.
- Validated camera accuracy; body-shape or size measurement.
- Multi-store tenancy, roles, POS sync, FitFirst Billing, try-on integration, subscriptions, production deployment.

## Non-goals (deliberate, per [DECISIONS.md](DECISIONS.md))

- Not an accounting system. If FitFirst Billing is built, it exports to Tally rather than keeping ledgers.
- Not an e-commerce store or a marketplace.
- No machine-learned ranking until real labelled outcome data exists.
- No customer messaging or loyalty without an explicit consent decision.

## Repo map

| Area | Path |
|---|---|
| Server setup, CORS, static files | `backend/src/index.ts` |
| API routes | `backend/src/routes/` (`sessions`, `recommendations`, `products`, `purchaseEvents`, `analytics`, `baseline`, `upload`, `scanGarment`) |
| Auth | `backend/src/authGuard.ts` |
| Data model | `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/prisma/seed.ts` |
| Recommendation engine | `backend/src/scoring/engine.ts`, `tables.ts`, `sizes.ts` (+ tests) |
| Garment AI | `backend/ai-service/main.py`, `classifier.py`, `prompts.py` |
| Kiosk flow | `kiosk/src/App.tsx`, `kiosk/src/screens/`, `kiosk/src/utils/visionAnalyzer.ts` |
| Dashboard pages | `dashboard/src/pages/Inventory.tsx`, `Sessions.tsx`, `Analytics.tsx`, `BaselineLog.tsx` |
| Integration check | `backend/scripts/check-stage1.ts` |
| Local backup | `backend/scripts/backup-local.cjs` |

## Running it

```bash
npm run brief                                     # current stage, next actions, open decisions
npm run docs:check                                # do the docs still agree with each other?
npm install
docker-compose up -d                              # Postgres, host port 5434
npm run db:deploy --workspace=backend             # migrations
npm run dev                                       # backend 3000 + dashboard 5173 + kiosk 5174
npm test                                          # backend unit tests (vitest)
npm run build                                     # all three builds
npm run test:integration --workspace=backend      # disposable-schema Postgres checks
npm run db:backup --workspace=backend             # ALWAYS before a migration
```

- Demo data only in an empty non-production database: set `FITFIRST_DEMO_SEED=1`, then `npm run db:seed --workspace=backend`. In PowerShell: `$env:FITFIRST_DEMO_SEED='1'`.
- The Python tagger starts separately: `backend/ai-service/start.bat` (port 8000). It needs `AICREDITS_API_KEY` in `backend/.env`; optional `AICREDITS_TAG_MODEL` and `AICREDITS_JSON_SCHEMA=0`. Tests: `python -m pytest -q` in `backend/ai-service`.
- On a fresh checkout run `npx prisma generate` in `backend/` before `npm test`, or three scoring tests fail.
- Staff PIN comes from `DASHBOARD_PIN` in `backend/.env`. **Never print `.env` values.**
- Postgres is on host port **5434** (a local change); `.env.example` still says 5432.

## Landmines

Things that look finished but are not. Check before trusting them:

| Landmine | Where |
|---|---|
| Stock is one number per product, so a recommended size may be sold out | `backend/prisma/schema.prisma:105-107` |
| `daysInStock` never increments — the promised cron job does not exist, so "aged stock" is currently fiction | `schema.prisma:108` |
| When the AI call fails or there is no key, the tagger returns CLIP/heuristic **guesses** (category from the image's aspect ratio). Since S05-03 this is flagged by `ai_status` and a dashboard "AI off" banner, but the guesses are still offered (D-16) | `backend/ai-service/main.py` |
| The AICredits model ID (`google/gemini-2.5-flash-lite`) and its JSON-schema support are unverified live | `backend/ai-service/classifier.py` |
| Try-on's default image model shuts down **2 Oct 2026** | `AI Creation/saree-studio/app.py:28` |
| Uploaded images are publicly readable at `/uploads/...` | `backend/src/index.ts:58-61` |
| Kiosk API routes have no auth and no rate limit | `backend/src/index.ts:69-71` |
| Staff auth is one shared 4-digit PIN; there are no user identities or roles | `backend/src/authGuard.ts` |
| Scores can exceed 1.0 and are not probabilities — never show a match % | `backend/src/scoring/engine.ts:123-125` |
| The 0.55 quality gate almost never fires (table minimums are 0.60 and 0.50), so nearly everything in-size passes | `backend/src/scoring/tables.ts:190` |
| "Edit preferences" creates a **second** session that sits as "Pending" in the dashboard | `kiosk/src/App.tsx:96-100` |
| "No purchase" reasons are saved only in that browser's localStorage | `dashboard/src/pages/Sessions.tsx` |
| The pilot verdict is hard-coded to INSUFFICIENT_DATA and lift is always null | `backend/src/routes/analytics.ts:34,52` |
| Demo baseline rows are random numbers — never present them as store evidence | `backend/prisma/seed.ts` |
| Skin-tone labels still say "Fair / Porcelain", "Wheatish / Golden", "Deep / Ebony" | `kiosk/src/screens/AttributeEntry.tsx:8-13` |
| `@mediapipe/pose` and TensorFlow.js are dependencies but never imported | `kiosk/package.json` |

## Glossary

| Term | Meaning |
|---|---|
| **Handoff code** | The short code the kiosk shows so a salesperson can pull up that shopper's picks |
| **Aged / dead stock** | Stock past its expected selling window; clearing it is the owner's main reason to pay |
| **Suitability (S)** | How well a garment suits this shopper, 0–1, from colour, silhouette, proportion, occasion and preferences |
| **Clearance boost (λ)** | A capped nudge that lifts aged stock, never enough to outrank a clearly better-suited piece |
| **Holdout** | ~10% of sessions deliberately get no clearance boost, so the effect can be measured rather than claimed |
| **Path A / Path B** | A = sync with the shop's existing billing software; B = FitFirst Billing, our own POS module |
| **Depth / undertone / contrast** | The three skin dimensions used for colour matching; always described in neutral language |
| **Fit goals** | What the shopper wants the outfit to do ("balance hips", "look taller") — used instead of labelling bodies |
| **Kill threshold** | Pre-agreed pilot numbers that decide whether FitFirst is kept, locked before the pilot starts |
| **Stage vs Phase** | "Stage" = execution order in the checklist. "Phase" = the strategy view in MASTER_PLAN. See the mapping below |

## Two numbering systems (read this to avoid confusion)

The checklist's **Stages** are what we execute. MASTER_PLAN's **Phases** are the strategy view. They slice the same work differently:

| MASTER_PLAN phase | Checklist stage |
|---|---|
| Phase 0 — urgent fixes | Stage 0.5 |
| Phase 0.5 — pitch kit | Stage 0 (direction and pitch prep) |
| Phase 1 — foundations v2 (schema, auth, devices, deploy) | Stage 2, plus deployment items in Stage 4 |
| Phase 2 — intake and stock truth | Stage 2 (catalogue/stock) and Stage 5 (garment AI) |
| Phase 3 — recommendations v2 and flows | Stage 3 and Stage 5 |
| Phase 4 — try-on and lookbook | Stage 5 |
| Phase 5 — POS path A and analytics | Stage 4 and Stage 6 |
| Phase 5B — FitFirst Billing (path B) | Stage 6 |
| Phase 6 — scale and learning | Stage 6 |

**When they disagree, the checklist wins for "what do I do next", and MASTER_PLAN wins for "why and how".**

## Source of truth

1. `docs/PROJECT_STATUS.md` — what is true now and what happens next
2. `docs/END_TO_END_CHECKLIST.md` — task status and gates
3. `docs/DECISIONS.md` — what has actually been decided
4. `docs/MASTER_PLAN.md` — approved product direction and long-term roadmap
5. `SYSTEM_IMPROVEMENT_PLAN.md` — the engineering review and known risks
6. `PROJECT_OVERVIEW.md` — screen and API detail; treat its phase labels as historical
7. The source code and tests — the final word on actual behaviour

`fitfirst_product_analysis.md` (August 2026) is **historical**; its missing-feature list is out of date.

## Working agreement (summary — full version in [AGENTS.md](../AGENTS.md))

**Ravindra decides. AI guides.** AI may investigate, explain, recommend, implement an approved task and verify it. AI may not choose scope, architecture, dependencies, providers, pricing, privacy wording or product behaviour, and may not mark work complete.

1. Read status and the checklist first; name the task by its ID before starting.
2. One approved task at a time. Note unrelated problems instead of fixing them.
3. When a choice appears, stop and present options, trade-offs and a recommendation, then wait.
4. No claim without evidence: run the check and report the real result, including failures.
5. Update the docs at the end of the session ([AGENTS.md](../AGENTS.md) §5).

## Starting a new AI chat

Give the assistant `docs/PROJECT_CONTEXT.md`, `docs/PROJECT_STATUS.md` and `docs/END_TO_END_CHECKLIST.md` (add `AGENTS.md` if the tool does not read it automatically). For a code task, add the specific source file and its test rather than the whole repo. For product questions, add the relevant `MASTER_PLAN.md` section.

**Paste-ready kickoff prompt:**

```text
You are joining the FitFirst project. Read the attached PROJECT_CONTEXT.md,
PROJECT_STATUS.md and END_TO_END_CHECKLIST.md (and AGENTS.md if attached).

Before doing anything, reply with:
1. the current stage and focus
2. the next approved task, by ID
3. whether it is approved or blocked on a decision
4. the files you expect to touch
5. the command that will prove it works

Rules: I make every product, architecture, commercial, privacy and UX decision.
You research, lay out options with trade-offs, recommend one, and wait for my answer.
Work only the approved task. Never mark anything complete without running the check.
At the end of the session, give me the doc updates described in AGENTS.md section 5.
```
