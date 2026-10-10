# FitFirst Founder Guide

> For Ravindra: how to learn this project well enough to build it, test it and sell it to a shop owner. Read a little, run the app, then read the code behind what you just saw.
>
> This is a learning path, not a rulebook. The rules are in [AGENTS.md](../AGENTS.md). Current progress is in [PROJECT_STATUS.md](PROJECT_STATUS.md). Code structure standards are in [ENGINEERING_STANDARDS.md](ENGINEERING_STANDARDS.md). You decide; the docs and AI assistants guide.

## The one-minute version

FitFirst helps a shopper in a clothing shop find pieces that suit them, and helps the owner sell **aged stock** that has been sitting too long. A shopper answers a few questions on a **kiosk**. The system ranks the shop's garments with fixed rules (no machine learning). Staff then take over using a **handoff code**, and log the sale on a **dashboard**. The pilot proves value by comparing sales for shoppers who got recommendations against a **holdout group** who did not, against a **kill threshold** fixed in advance.

Today it is a **single-store pilot prototype**: not deployed, not a POS, stock counted per product (not per size).

## Part 1. Understand the business (about 2 hours, no code)

Read in this order. Stop when you can answer the three questions at the end.

1. [PROJECT_STATUS.md](PROJECT_STATUS.md): where you are today.
2. [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md): product, current reality, non-goals, glossary and landmines. Read **Glossary** and **Landmines** twice.
3. [MASTER_PLAN.md](MASTER_PLAN.md), only these sections:
   - **§1 My honest take**: what is strong and weak about the product.
   - **§3 The product we're building**.
   - **§7.2 Path A: integrate with their POS**: the discovery questions for a shop owner.
   - **§8 Plans and pricing**: hypotheses to test, not promises.
   - **§11 Roadmap** and **§12 Pitch and pilot kit**.
4. [DECISIONS.md](DECISIONS.md): the **Open decisions** table only.

Skip the rest of MASTER_PLAN until you need it (scoring algorithms §5, try-on §6, scenarios §9).

**You are ready for Part 2 when you can answer, without looking:**
- Who is the customer, and what do they lose money on today?
- What does FitFirst do about it, in one sentence?
- How will you prove it worked, and what number kills the pilot?

## Part 2. Use the product (about 1 hour)

Do this before reading code. Seeing it teaches you what the code is for.

**Start it** (from the repo root; Windows PowerShell or Git Bash):

```bash
docker-compose up -d                      # Postgres on host port 5434
npm install
npm run db:deploy --workspace=backend     # apply migrations
npm run db:seed --workspace=backend       # demo data (random numbers, not store evidence)
npm run dev                               # backend 3000, dashboard 5173, kiosk 5174
```

Inside the Claude desktop app you can start the same servers from `.claude/launch.json` instead.

| App | URL | You act as |
|---|---|---|
| Kiosk | http://localhost:5174 | The shopper |
| Dashboard | http://localhost:5173 | Staff and owner |
| AI garment tagger (optional) | `backend/ai-service/start.bat`, port 8000 | Needs `AICREDITS_API_KEY` in `backend/.env` |

**Walk through it:**
1. On the kiosk, go through every screen as a shopper until you get a **handoff code**. Try Edit preferences.
2. On the dashboard, log in with the staff PIN, look up that code, log a sale of a recommended item, then of a different item.
3. Open Inventory (try an invalid stock number and the CSV import) and Analytics.
4. Wait on the kiosk for the idle warning, then watch it reset.

Then open [STAGE_1_TEST_GUIDE.md](../STAGE_1_TEST_GUIDE.md). It lists each check with its expected result; repeat a few yourself. Writing down expected result, actual result and date is the testing habit this project wants.

Never print or paste `.env` values. `AI Creation/` is git-ignored and holds live keys.

## Part 3. Learn the code by tracing what you used

Do not read files top to bottom. Pick one thing you did in the app and follow it through the code. Read in this order:

| # | File | What you learn | Matches this thing you saw |
|---|---|---|---|
| 1 | `backend/prisma/schema.prisma` | The data: `Product`, `CustomerSession`, `Recommendation`, `PurchaseEvent`, `DailyBaseline`, `KillThreshold`, `StaffSession`, plus the enums (category, colour, fit, skin tone, gender) | Everything: it is the shape of the whole system |
| 2 | `kiosk/src/App.tsx` | The customer screen flow as one state machine | Walking the kiosk |
| 3 | `kiosk/src/screens/` | One screen per step; open the one you liked least | Each kiosk screen |
| 4 | `backend/src/routes/sessions.ts` | What happens when a shopper finishes: create a session, get recommendations, update in place, handoff | Getting your handoff code |
| 5 | `backend/src/scoring/engine.ts` and `engine.test.ts` | How a garment is ranked; the tests are worked examples | "Why was this item recommended?" |
| 6 | `backend/src/routes/purchaseEvents.ts` | How a sale is logged and attributed | Logging a sale |
| 7 | `dashboard/src/pages/Inventory.tsx` | Adding stock, CSV import, AI scan and the "needs review" flow | Inventory |
| 8 | `backend/src/analyticsMetrics.ts` | How conversion is calculated. **This is the number you sell on.** | Analytics |

**Example trace:** the shopper taps *Show recommendations* → `kiosk/src/screens/Recommendations.tsx` calls the API → `routes/sessions.ts` and `routes/recommendations.ts` → `scoring/engine.ts` ranks products → the response returns to the screen. Draw it on paper once.

When something is unclear, ask an AI assistant to explain *that file* in plain language, then check the answer against the file and the tests.

## Part 4. Make the owner decisions that code depends on

Coding before these wastes effort. Each one has options and a recommendation in [DECISIONS.md](DECISIONS.md).

| Order | Decision | You settle it by |
|---|---|---|
| 1 | **D-02** Rotate the three API keys | Doing it yourself in each provider's console |
| 2 | **D-03** Accept Stage 1, or raise a defect list | Part 2, plus the camera check (S1-08) |
| 3 | **D-04** Which pilot shop and scope | A real conversation with a shop owner |
| 4 | **D-05** POS path A (sync with their software) or B (FitFirst Billing) | The discovery checklist, MASTER_PLAN §7.2 |
| 5 | **D-06, D-07** v2 data model, and how stock is split into sizes | After D-04 and D-05 |

Everything else (hosting, languages, pricing, try-on) can wait until these are answered.

## Part 5. Build and test as you go

**Pick one task at a time** from [END_TO_END_CHECKLIST.md](END_TO_END_CHECKLIST.md). Each task has an ID and a check command.

| Habit | Command |
|---|---|
| Backend unit tests | `npm test` |
| Integration checks (disposable Postgres schema) | `npm run test:integration --workspace=backend` |
| All three builds | `npm run build` |
| Lint | `npm run lint` |
| AI service tests | `python -m pytest -q` in `backend/ai-service` |
| Docs agree with each other | `npm run docs:check` |

**Done means evidence.** A task is done when you ran its check and saw it pass, and wrote the real result down. Code existing is not evidence. Only you mark an item `[x]`.

**Back up before any database migration:** `npm run db:backup --workspace=backend`.

## Part 6. Selling it

The product is still a prototype, so the first sale is a **pilot**, not a subscription.

1. Meet one shop owner with the **§7.2 discovery questions**: how they bill today, how much stock, how much is aged, and who your staff champion would be.
2. Use **§12 Pitch and pilot kit** for the demo. Label every synthetic number as illustrative. The demo data is random, so never present it as store results.
3. Agree three things **in writing** before the pilot starts: the aged-stock KPI, the holdout share, and the kill threshold.
4. Test the price tiers in §8 as hypotheses across your first 5 to 10 conversations.
5. Mind the calendar: Diwali is 8 Nov 2026, the plan targets go-live in early December, and India's DPDP obligations take full effect on 13 May 2027.

## Suggested first week

| Day | Do |
|---|---|
| 1 | Part 1 (read), and rotate the keys (D-02) |
| 2 | Part 2 (run the app and walk through it as shopper and staff) |
| 3 | Part 3, files 1 to 4 |
| 4 | Part 3, files 5 to 8; run the camera check (S1-08) |
| 5 | Book the shop meeting; decide D-03 |

## When you are stuck

- **Where are we?** `npm run brief`, or [PROJECT_STATUS.md](PROJECT_STATUS.md).
- **What is task S05-04?** Search its ID in [END_TO_END_CHECKLIST.md](END_TO_END_CHECKLIST.md).
- **Why did we choose this?** [DECISIONS.md](DECISIONS.md) → Decided.
- **How should new code be written?** [ENGINEERING_STANDARDS.md](ENGINEERING_STANDARDS.md).
- **Starting a new AI chat:** open [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) → "Starting a new AI chat" and paste the kickoff prompt.
