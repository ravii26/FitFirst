# FitFirst End-to-End Checklist

> Human-gated delivery checklist. Every task has a stable **ID** (`S1-06`) so any chat, PR or AI can refer to it exactly.
>
> `[x]` verified with recorded evidence · `[~]` implemented but not accepted · `[ ]` not done · `[?]` blocked on a decision (see [DECISIONS.md](DECISIONS.md)) · **(owner)** only Ravindra can do or approve it.

## How to use this checklist

- Work the **first unchecked item of the current stage**, unless Ravindra names another task.
- Each task should fit one focused chat or PR. If it turns out bigger, split it into sub-IDs (`S2-C01a`, `S2-C01b`) and confirm which part to do.
- `[?]` items need a decision recorded in [DECISIONS.md](DECISIONS.md) **before** any code.
- After the work, run the listed check, then update this file, [PROJECT_STATUS.md](PROJECT_STATUS.md) and [SESSION_LOG.md](SESSION_LOG.md) in the same change.
- Only Ravindra marks an item `[x]`. Code existing is not evidence — a recorded result is.
- **Granularity rule:** the current and next stage carry *how* and *evidence* hints. Later stages stay coarse on purpose and get decomposed when the stage is approved, so we don't plan in detail work whose shape will change.

## Progress

| Stage | Done | Partial | Open | Total |
|---|---|---|---|---|
| 0 — Direction and safety | 3 | 0 | 7 | 10 |
| 0.5 — Urgent technical fixes | 0 | 3 | 6 | 9 |
| 1 — Stabilise the pilot | 0 | 5 | 8 | 13 |
| 2 — Single-store operations | 0 | 0 | 31 | 31 |
| 3 — Customer and staff experience | 0 | 0 | 12 | 12 |
| 4 — Measurement and deployment | 0 | 0 | 11 | 11 |
| 5 — Recommendation evidence and AI | 0 | 0 | 12 | 12 |
| 6 — Multi-store and commercial | 0 | 0 | 12 | 12 |
| **Total** | **3** | **8** | **99** | **110** |

Keep this table and the one in `PROJECT_STATUS.md` in step.

## Capability coverage map

This confirms the plan covers the whole product, while keeping *planned* separate from *built*.

| Capability | Covered in plan | Current implementation | Main stages |
|---|---|---|---|
| Customer experience | Yes | Partial pilot flow | 1, 3 |
| Salesperson/staff workflow | Yes | Basic session lookup and purchase logging | 1, 2, 3 |
| Admin/owner panel | Yes | Inventory, baseline, sessions, analytics | 1, 2, 4, 6 |
| Inventory/catalogue | Yes | Product-level stock and basic inventory UI | 1, 2 |
| Sales and attribution | Yes | Basic purchase events, not a complete sale | 1, 2, 4 |
| POS integration (path A) | Yes | Not started | 0, 6 |
| FitFirst Billing (path B) | Yes | Not started; needs owner approval | 0, 6 |
| AI tagging and recommendations | Yes | Prototype tagger and deterministic scorer | 1, 5 |
| Camera perception | Yes | Skin-tone prototype only; unvalidated | 1, 5 |
| Virtual try-on | Yes | Separate prototype, not integrated | 5 |
| Auth, roles and tenancy | Yes | Shared-PIN pilot auth; no roles or stores | 2, 6 |
| Privacy, consent and retention | Yes | Notice screen only; no consent records | 0, 2, 5, 6 |
| Analytics and pilot measurement | Yes | Basic analytics; definitions pending | 1, 4, 6 |
| Deployment, backups, support ops | Yes | Not production-ready | 0, 4, 6 |

**Planning conclusion:** the major surfaces are covered. **Delivery conclusion:** the unchecked items are real work, and decision-gated items need Ravindra's approval first.

---

## Stage 0 — Direction and safety

- [x] **S0-01** Product goal, target shops and owner value proposition documented. — *evidence:* `MASTER_PLAN.md` §1, §3
- [x] **S0-02** Human decision gates and the AI working agreement documented. — *evidence:* `AGENTS.md`, `DECISIONS.md`
- [x] **S0-03** Portable AI handoff set in place, so any assistant in any tool can pick the project up. — *evidence (24 Sep 2026):* the five living docs; an instructions file per tool (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursor/rules/fitfirst.mdc`, `.windsurfrules`, `.clinerules`); `npm run brief`; `npm run docs:check` (passes clean, and fails on drift); `/handoff` command and Copilot prompt; Claude Code session-start hook
- [ ] **S0-04 (owner)** Rotate the three live provider keys and set spend caps. — D-02; keys are in `AI Creation/saree-studio/.env` (Gemini, OpenRouter, AICredits). *No AI touches these values.*
- [ ] **S0-05 (owner)** Confirm the pilot shop: departments, catalogue size, staff champion, space. — D-04
- [ ] **S0-06 (owner)** Confirm the pilot's POS situation and choose path A (sync) or path B (FitFirst Billing). — D-05; *how:* the discovery checklist in `MASTER_PLAN.md` §7.2
- [ ] **S0-07 (owner)** Confirm pilot dates, baseline source, holdout method and kill threshold. — D-08
- [ ] **S0-08 (owner)** Review DPDP, camera, try-on, retention and third-party provider obligations with a qualified reviewer.
- [ ] **S0-09** Demo-data policy: every synthetic number is labelled as synthetic, in the app and in the deck.
- [ ] **S0-10** Pitch kit: deck, ROI calculator, discovery checklist, and a demo store built from **our own** photographs (not the CC BY-SA sample images).

## Stage 0.5 — Urgent technical fixes

**D-01 approved 25 Sep 2026. Deadline 2 October 2026** — the try-on image model shuts down that day, and the tagger's last working model could stop any time.

- [~] **S05-01** Read the tagger's model from config and remove the dead models. Per D-18 the tagger now calls **AICredits** (`AICREDITS_API_KEY`, `AICREDITS_TAG_MODEL`, default `google/gemini-2.5-flash-lite`, alternatives commented in code) instead of Gemini direct; one model, no silent chain. — `backend/ai-service/classifier.py`, `main.py`; *check:* `/scan` reports the engine actually used. *Evidence (25 Sep 2026):* `python -m pytest -q` in `backend/ai-service` → 33 passed (8 new tests with a mocked gateway: default model, env override, base URL, engine reports the gateway's model, single call on failure). **Not verified:** a live AICredits call — the model ID and gateway behaviour are unconfirmed (aicredits.in was unreachable from the session).
- [~] **S05-02** Use a response schema; an invalid answer becomes empty and "needs review" instead of the first enum value. — `classifier.py`, `main.py`, `dashboard/src/pages/Inventory.tsx`; *check:* a unit test feeding a bad payload. *Evidence (25 Sep 2026):* the request sends a strict JSON schema with every attribute's enums (`AICREDITS_JSON_SCHEMA=0` turns it off); a missing, out-of-list or malformed value comes back as `value: ""`, `needs_review: true`; the dashboard shows "⚠ … needs review", explains which fields to choose, and its selects are `required`, so the form cannot be saved until staff choose. `python -m pytest -q` in `backend/ai-service` → 45 passed (12 new); `npm run build --workspace=dashboard` passes. **Not verified:** whether AICredits accepts the schema (no live call), and the dashboard change in a browser.
- [~] **S05-03** Make AI failure loud: `/health` reports the real engine, and the dashboard shows an "AI off" banner instead of silently using heuristics. — `backend/ai-service/main.py`, `backend/src/routes/scanGarment.ts`, `dashboard/src/pages/Inventory.tsx`. *Evidence (25 Sep 2026):* `/scan` returns `ai_status` (`ok`/`off`/`failed`) and a key-redacted `ai_error`; `/health` reports `ai_status` (adds `not_tried`), the engine the last scan really used, `last_ai_error` and `last_scan_at`; new `GET /api/scan-garment/health` (staff-only) passes it through; the Add-piece modal checks it on open and after each scan and shows a red "AI off" banner with the reason; guessed tags say "rough guess, not from the AI". The fallback guesses themselves are kept (dropping them is D-16). `python -m pytest -q` → 49 passed; `npx vitest run` → 45 passed (after `npx prisma generate`); backend `tsc` and dashboard build pass. **Browser-checked** in Chromium against a throwaway local Postgres, AI service and backend: banner shows "No AI key is configured" on open, and "The last AI call failed: … Connection error" after a scan with a fake key; no banner before the first scan when a key is set. The after-scan checks ran with the scan-proxy fix, which Ravindra approved and which is now in the code (DEC-17; `npx vitest run` → 46 passed, and the new regression test fails on the old line).
- [ ] **S05-04** Fix `load_dotenv("../.env")`, which depends on the working directory. — `backend/ai-service/classifier.py:16`
- [ ] **S05-05** Point saree-studio's default image model at `google/gemini-3.1-flash-image` in code, README and `.env.example`. — `AI Creation/saree-studio/app.py:28`
- [ ] **S05-06** Repo hygiene: delete `AI Creation/__MACOSX/`, the macOS `.venv` and `__pycache__`; untrack `backend/uploads/*.png`; commit `package-lock.json`; add `.gitattributes`.
- [ ] **S05-07** Config truth: add `AI_SERVICE_URL` to `.env.example` (the `AICREDITS_*` tagger variables were added in S05-01); set `DATABASE_URL` to port 5434; update the README; add an `ai-service` entry to `.claude/launch.json`.
- [ ] **S05-08** Demo-facing kiosk fixes: remove the shopper-visible staff dashboard link (`kiosk/src/screens/Welcome.tsx:129-136`), fix the `&arr;` typo (`SizeEntry.tsx:192`), and replace the "Fair / Porcelain" style labels with neutral numbered depth (`AttributeEntry.tsx:8-13`).
- [ ] **S05-09** CI: GitHub Actions running build, vitest, pytest and a secret scan.

## Stage 1 — Stabilise the current pilot

Automated checks pass; the browser walkthrough stopped at the preferences screen. *How for all of Stage 1:* start the services, use `http://127.0.0.1:5174` (kiosk) and `http://127.0.0.1:5173` (dashboard), on **dedicated test stock**, and record each result in `STAGE_1_TEST_GUIDE.md` or a linked test log.

- [~] **S1-01** Backend unit tests pass. — 42 tests
- [~] **S1-02** Backend, dashboard and kiosk builds pass.
- [~] **S1-03** Disposable-schema PostgreSQL integration checks pass. — `npm run test:integration --workspace=backend`
- [~] **S1-04** Migration backup and additive migration exercised locally. — `npm run db:backup --workspace=backend`
- [~] **S1-05** Browser walkthrough reaches privacy, department, size and preferences.
- [ ] **S1-06** Staff login, refresh, lock and wrong-PIN checks.
- [ ] **S1-07** The complete customer path through recommendations and handoff.
- [ ] **S1-08** Camera success, denied permission, poor light and manual fallback.
- [ ] **S1-09** Idle warning, keep-shopping and full reset.
- [ ] **S1-10** Recommended sale, other-item sale and repeated-submit checks.
- [ ] **S1-11** Inventory image, invalid stock, CSV validation and analytics checks.
- [ ] **S1-12** Record expected result, actual result, screenshots/issues, tester and date for each check.
- [ ] **S1-13 (owner)** Accept Stage 1, or produce a prioritised defect list. — D-03

## Stage 2 — Single-store operations

### Decisions before any coding

- [?] **S2-D01** Approve the v2 data model scope. — D-06
- [?] **S2-D02** Migrate in place, or take a clean v2 baseline plus importer? — D-06
- [?] **S2-D03** Provide the physical stock-count plan for splitting product stock into sizes. — D-07
- [?] **S2-D04** Approve staff roles, authentication, device access and audit requirements.

### Catalogue and stock

- [ ] **S2-C01** Add ProductVariant with size, SKU/barcode and colour where needed.
- [ ] **S2-C02** Add store-level stock balances and enforce non-negative quantities.
- [ ] **S2-C03** Add inventory lots with received date and age source (this is what makes "aged stock" real).
- [ ] **S2-C04** Add stock movements: receipt, sale, return, adjustment, damage, sync.
- [ ] **S2-C05** Add reservations with expiry and release.
- [ ] **S2-C06** Build the product-to-variant migration/import, with an unresolved-count report.
- [ ] **S2-C07** Build the physical stock-count workflow and reconcile a sample against the shop.
- [ ] **S2-C08** Add rack/location fields and search, so staff can actually find a piece.

### Sales and sessions

- [ ] **S2-S01** Replace purchase events with Sale and SaleLine records.
- [ ] **S2-S02** Make the sale and its stock movement atomic and idempotent.
- [ ] **S2-S03** Enforce server-side recommendation attribution.
- [ ] **S2-S04** Support multi-item sales, quantity, price snapshot and discount (bargaining is normal here).
- [ ] **S2-S05** Add void, correction, return and exchange paths with an audit trail.
- [ ] **S2-S06** Persist handoff code, expiry, status, assignment and outcome events.
- [ ] **S2-S07** Add server-side code search and pagination (today search only covers the newest 100 sessions, in the browser).
- [ ] **S2-S08** Add the live staff queue with claim/assignment.
- [ ] **S2-S09** Add focused concurrency, retry, return and cross-device tests.

### Authentication and trust

- [ ] **S2-A01** Remove any browser-delivered staff credentials.
- [ ] **S2-A02** Add server login, expiring sessions, logout, rate limiting and role checks.
- [ ] **S2-A03** Scope customer session detail behind an expiring access mechanism.
- [ ] **S2-A04** Add notice/consent records with retention and erasure behaviour.
- [ ] **S2-A05** Add audit events for privileged changes.

### Stage 2 gate

- [ ] **S2-G01** Two staff devices see the same session outcome.
- [ ] **S2-G02** Concurrent attempts to sell the final unit allow exactly one sale.
- [ ] **S2-G03** A return restores the correct variant and lot.
- [ ] **S2-G04** Replayed imports and sale requests never duplicate records or movements.
- [ ] **S2-G05 (owner)** Accept Stage 2 and approve the next stage.

## Stage 3 — Customer and staff experience

- [ ] **S3-01** Ask department/category before attributes, and ask only size questions relevant to that category.
- [ ] **S3-02** Add budget, occasion, colour likes/dislikes and optional fit goals.
- [ ] **S3-03** Make tone and body inputs optional, neutral and easy to correct.
- [ ] **S3-04** Replace colourist labels with neutral depth language throughout. — D-11
- [ ] **S3-05** Show three strong picks first, with real product media and true availability.
- [ ] **S3-06** Add details, shortlist / Add to Try, edit preferences and contextual help.
- [ ] **S3-07** Add the expiring QR handoff, and show "staff notified" only when delivery is confirmed.
- [ ] **S3-08** Add English, Hindi and Gujarati copy with human review. — D-14
- [ ] **S3-09** Complete responsive, keyboard, touch, focus, contrast and reduced-motion checks.
- [ ] **S3-10** Add missing-photo and connection states that never misrepresent inventory.
- [ ] **S3-11** Validate the journey with representative shoppers and staff.
- [ ] **S3-12 (owner)** Approve the UX, language and accessibility gate.

## Stage 4 — Measurement and deployment

- [ ] **S4-01** Define completed sale, qualifying session, conversion, basket, return and attribution.
- [ ] **S4-02** Add date windows, store timezone, footfall input and missing-data states.
- [ ] **S4-03** Add funnel events, no-match reasons and demand-gap reporting.
- [ ] **S4-04** Reconcile reports against a known hand-built sales dataset.
- [ ] **S4-05** Separate demo data from production data; protect seed and reset operations.
- [ ] **S4-06** Check in reproducible migrations and environment validation.
- [ ] **S4-07** Configure production routing for both apps, the API and media.
- [ ] **S4-08** Add HTTPS, error monitoring, backups and a restore drill.
- [ ] **S4-09** Test media backup/restore, and private temporary shopper media if introduced.
- [ ] **S4-10** Run a clean-database deployment rehearsal.
- [ ] **S4-11 (owner)** Approve go-live evidence and the operational runbook. — D-13

## Stage 5 — Recommendation evidence and AI

- [ ] **S5-01** Create a stylist-reviewed garment evaluation set.
- [ ] **S5-02** Version the taxonomy, rulesets, prompts and model adapters. — D-09
- [ ] **S5-03** Measure colour in a documented colour space; retain confidence and source.
- [ ] **S5-04** Add human review for uncertain garment tags; invalid values must never silently default.
- [ ] **S5-05** Evaluate camera repeatability and lighting before making any store claim. — D-10
- [ ] **S5-06** Improve category-specific size, silhouette, occasion, budget and diversity rules.
- [ ] **S5-07** Add ageing/clearance controls with suitability gates and holdout measurement.
- [ ] **S5-08** Keep explanations deterministic, neutral and human-translated.
- [ ] **S5-09** Add property tests for boost caps, suitability boundaries and offline recommendations.
- [ ] **S5-10 (owner)** Decide whether and when to integrate virtual try-on. — D-12
- [ ] **S5-11** If approved: consent, 18+ gate, provider DPA, quotas, automated QA, AI labelling, retention and cost monitoring.
- [ ] **S5-12 (owner)** Approve every new model or provider, and review the evaluation report.

## Stage 6 — Multi-store and commercial scale

- [ ] **S6-01** Add Organization, Store, Membership, roles and store-scoped queries.
- [ ] **S6-02** Add device enrolment, revocation, heartbeat and configuration.
- [ ] **S6-03** Add tenant-isolation tests and operational audit review.
- [ ] **S6-04** Add POS Excel/CSV import with a maintained parser, preview, mapping and idempotent sync.
- [ ] **S6-05** Add only the POS bridge or API a paying shop actually requires.
- [ ] **S6-06 (owner)** Decide whether to build the focused FitFirst Billing module. — D-05
- [ ] **S6-07** If approved: offline-first billing, tax rules, invoices, payments, returns, day close and exports, with CA review.
- [ ] **S6-08** Add plan, entitlement, usage and quota metering.
- [ ] **S6-09** Add multi-store stock transfers and consolidated reporting.
- [ ] **S6-10** Add WhatsApp or saved profiles only with explicit consent and retention decisions.
- [ ] **S6-11** Validate support, pricing, onboarding and hardware runbooks with real shops. — D-15
- [ ] **S6-12 (owner)** Approve commercial launch readiness.

---

## Per-task completion record

Copy this into the PR or chat, and into the `SESSION_LOG.md` row:

- **Task ID:**
- **Owner decision/approval:** (which decision, and when it was given)
- **Files changed:**
- **Behaviour changed:**
- **Validation run:** (exact command)
- **Result:** (real output, including failures)
- **Known limitation:**
- **Next task ID:**
