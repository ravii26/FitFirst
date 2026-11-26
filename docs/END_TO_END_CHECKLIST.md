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
- **AI model tier (DEC-27):** open tasks in the current and next stages end with `— Tier: deep | standard | light | none`. Pick the model from the table in [AGENTS.md](../AGENTS.md) §4b. Later stages are tagged when they are broken down.
- **Granularity rule:** the current and next stage carry *how* and *evidence* hints. Later stages stay coarse on purpose and get decomposed when the stage is approved, so we don't plan in detail work whose shape will change.

## Progress

| Stage | Done | Partial | Open | Total |
|---|---|---|---|---|
| 0 — Direction and safety | 3 | 1 | 6 | 10 |
| 0.5 — Urgent technical fixes | 9 | 0 | 0 | 9 |
| 1 — Stabilise the pilot | 13 | 0 | 0 | 13 |
| P — Perception (core track) | 0 | 0 | 12 | 12 |
| 2 — Single-store operations | 0 | 0 | 42 | 42 |
| 3 — Customer and staff experience | 0 | 0 | 23 | 23 |
| 4 — Measurement and deployment | 0 | 0 | 13 | 13 |
| 5 — Recommendation evidence and AI | 0 | 0 | 14 | 14 |
| 6 — Multi-store and commercial | 0 | 0 | 20 | 20 |
| 7 — Engineering foundations (parallel) | 0 | 2 | 4 | 6 |
| **Total** | **25** | **3** | **134** | **162** |

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
| Camera perception | Yes | Skin-tone prototype only (beta, unvalidated); the perception track SP-01 … SP-12 covers skin tone v2, body type, garment colour, rules and a 200-person evaluation | 1, P, 5 |
| Virtual try-on | Yes | Separate prototype, not integrated | 5 |
| Auth, roles and tenancy | Yes | Shared-PIN pilot auth; no roles or stores | 2, 6 |
| Privacy, consent and retention | Yes | Notice screen only; no consent records | 0, 2, 5, 6 |
| Analytics and pilot measurement | Yes | Basic analytics; definitions pending | 1, 4, 6 |
| Deployment, backups, support ops | Yes | Not production-ready | 0, 4, 6 |

**Planning conclusion:** the major surfaces are covered. **Delivery conclusion:** the unchecked items are real work, and decision-gated items need Ravindra's approval first.

## V2 target tasks (drafted 17 Nov 2026)

`prototype_v2/` is the target design (DEC-26). Screens it shows that had no task here were added as tasks marked **V2 draft**: `S2-V01` … `S2-V11`, `S3-13` … `S3-23`, `S4-12`, `S4-13`, `S5-13`, `S5-14`, `S6-07a` … `S6-07e` and `S6-13` … `S6-15`. Each names the V2 screen it comes from. They are **drafts for Ravindra's review**: edit, merge or delete any of them. Like every later-stage task, they stay coarse until their stage is approved. Matching V2 also needs the work it only simulates (photos, camera, AI tagging, try-on, payments, printing, messaging, offline sync), which lives in S0-10, S5-* and S6-*.

**V2 comparison at every stage gate (Ravindra, 17 Nov 2026).** Before Ravindra accepts Stage 2 … 6, open `prototype_v2/` beside the real app for the screens that stage built and list every difference in the gate's evidence, as one of: **intended** (a recorded decision says so; name it), **improved** (better than V2; say why), or **missed** (becomes a new task, or a `DECISION NEEDED` if it should be dropped). A gate is not ready while any difference is unlisted.

---

## Work split (DEC-41)

**Approved 23 Nov 2026.** Work is split into two **chains**, each running end to end across every app it needs, so every dependency stays inside one person's chain and neither owner waits for the other. Each task line carries **Assigned: Ravindra**, **Assigned: Het** or **Assigned: Ravindra and Het**; `npm run brief` shows each person their next task. Work your own queue top to bottom; never start a task assigned to the other owner without their OK in writing (chat or PR comment). **Merging (DEC-42):** each owner works on their own task branch; finished tasks or working pieces go into `architecture-changes` through a PR the other owner reviews, at least every 2–3 days; every session starts by fetching and merging `origin/architecture-changes`. If your queue is blocked or empty, take an unassigned task from Stage 3 or Stage 0 and tell the other owner.

**Day 1, together (about 30 minutes):** agree the **result format** both chains share, from [PERCEPTION_PLAN.md](PERCEPTION_PLAN.md) §3 and §4: skin `{depthGroup, mstPick, undertone, contrast, confidence, method}` and body `{shape, ratios, heightBand, confidence, method}`, with tone and shape allowed to be "unknown". Het writes it into `packages/types` as the first piece of S7-02. After that, Ravindra's scans **produce** it and Het's scoring **reads** it (built and tested against made-up results). Changing it later needs both owners' OK before merge; adding an optional field never breaks the other side.

| Order | Ravindra — reading the shopper | Het — the clothes and the scoring |
|---|---|---|
| 1 | SP-01 MediaPipe test page | S7-04 finish validation, logging, config |
| 2 | SP-05 skin tone v2 | S7-02 shared types (starts with the result format) |
| 3 | S3-04 neutral words; body shape as unnamed drawings | S7-03 backend layers (routes → services → repositories) |
| 4 | SP-07 body type from a phone photo | SP-08 garment colour from product photos (Pillow, no SP-01 wait) |
| 5 | S3-03 tone and body inputs optional | SP-04 rule tables: Claude drafts, stylist signs |
| 6 | SP-06 swatch-plus-quiz fallback | SP-09 confidence-aware scoring; accepts "unknown" |
| 7 | S7-05 shared UI package | SP-03 evaluation tool and recruiting |
| 8 | S7-06 frontend feature folders | |
| Alongside | S0-08 privacy review; SP-02 camera kit | SP-12 find a stylist |
| Joint | S0-05, S0-06, S0-07 pilot shop and dates; SP-10 run the evaluation; SP-11 accept the track | ← same |

**Why this order never blocks:** S3-03 (Ravindra) needs the API to accept "unknown", which SP-09 (Het) delivers; SP-09 sits about two weeks earlier in Het's queue than S3-03 does in Ravindra's. If Ravindra reaches S3-03 first, do S7-05 and come back. SP-09 also edits `kiosk/src/screens/Recommendations.tsx` (the silent defaults): Het tells Ravindra before touching it. S7-05 and S7-06 move kiosk files, so they come only after Ravindra's perception screens are merged.

## Stage 0 — Direction and safety

- [x] **S0-01** Product goal, target shops and owner value proposition documented. — *evidence:* `MASTER_PLAN.md` §1, §3
- [x] **S0-02** Human decision gates and the AI working agreement documented. — *evidence:* `AGENTS.md`, `DECISIONS.md`
- [x] **S0-03** Portable AI handoff set in place, so any assistant in any tool can pick the project up. — *evidence (24 Sep 2026):* the five living docs; an instructions file per tool (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursor/rules/fitfirst.mdc`, `.windsurfrules`, `.clinerules`); `npm run brief`; `npm run docs:check` (passes clean, and fails on drift); `/handoff` command and Copilot prompt; Claude Code session-start hook
- [~] **S0-04 (owner)** Rotate the three live provider keys and set spend caps. — D-02; keys are in `AI Creation/saree-studio/.env` (Gemini, OpenRouter, AICredits). *No AI touches these values.* *Evidence (22 Oct 2026):* Ravindra reported all three keys rotated and spend caps set (DEC-21). Not checked by AI, by design; Ravindra promotes to `[x]`. — Tier: none
- [ ] **S0-05 (owner)** Confirm the pilot shop: departments, catalogue size, staff champion, space. — D-04 — Tier: none — **Assigned: Ravindra and Het** (DEC-41)
- [ ] **S0-06 (owner)** Confirm the pilot's POS situation and choose path A (sync) or path B (FitFirst Billing). — D-05; *how:* the discovery checklist in `MASTER_PLAN.md` §7.2 — Tier: none — **Assigned: Ravindra and Het** (DEC-41)
- [ ] **S0-07 (owner)** Confirm pilot dates, baseline source, holdout method and kill threshold. — D-08 — Tier: none — **Assigned: Ravindra and Het** (DEC-41)
- [ ] **S0-08 (owner)** Review DPDP, camera, try-on, retention and third-party provider obligations with a qualified reviewer. — Tier: none — **Assigned: Ravindra** (DEC-41)
- [ ] **S0-09** Demo-data policy: every synthetic number is labelled as synthetic, in the app and in the deck. — Tier: standard
- [ ] **S0-10** Pitch kit: deck, ROI calculator, discovery checklist, and a demo store built from **our own** photographs (not the CC BY-SA sample images). — Tier: standard

## Stage 0.5 — Urgent technical fixes

**D-01 approved 25 Sep 2026. Deadline 2 October 2026** — the try-on image model shuts down that day, and the tagger's last working model could stop any time.

- [x] **S05-01** Read the tagger's model from config and remove the dead models. Per D-18 the tagger now calls **AICredits** (`AICREDITS_API_KEY`, `AICREDITS_TAG_MODEL`, default `google/gemini-2.5-flash-lite`, alternatives commented in code) instead of Gemini direct; one model, no silent chain. — `backend/ai-service/classifier.py`, `main.py`; *check:* `/scan` reports the engine actually used. *Evidence (25 Sep 2026):* `python -m pytest -q` in `backend/ai-service` → 33 passed (8 new tests with a mocked gateway: default model, env override, base URL, engine reports the gateway's model, single call on failure). **Not verified:** a live AICredits call — the model ID and gateway behaviour are unconfirmed (aicredits.in was unreachable from the session). *Live check (25 Sep 2026):* a direct `POST /scan` to the AI service with `AICREDITS_TAG_MODEL=gpt-4o` returned `ai_status: ok`, engine `aicredits (gpt-4o-2024-08-06)`, in ~5 s; `/health` then showed `ai_status: ok` and the model. Not yet run from the dashboard scan button, and no real garment photo was available (the only upload was a logo, which was confidently tagged ACCESSORIES 0.95 without "needs review"). *Owner check (20 Nov 2026):* Ravindra scanned one real garment from the dashboard (Inventory → Add piece) with the rotated key in `backend/.env` and no model override. `POST /api/scan-garment` → 200 in ~5.2 s; AI service `POST /scan` → 200; `/health` then showed `ai_status: ok`, engine `aicredits (gemini-2.5-flash-lite)`, `last_ai_error: null`. So the default model ID `google/gemini-2.5-flash-lite` works on AICredits, and no `AICREDITS_TAG_MODEL` override is needed. **Accepted by Ravindra, 20 Nov 2026.** — Tier: light
- [x] **S05-02** Use a response schema; an invalid answer becomes empty and "needs review" instead of the first enum value. — `classifier.py`, `main.py`, `dashboard/src/pages/Inventory.tsx`; *check:* a unit test feeding a bad payload. *Evidence (25 Sep 2026):* the request sends a strict JSON schema with every attribute's enums (`AICREDITS_JSON_SCHEMA=0` turns it off); a missing, out-of-list or malformed value comes back as `value: ""`, `needs_review: true`; the dashboard shows "⚠ … needs review", explains which fields to choose, and its selects are `required`, so the form cannot be saved until staff choose. `python -m pytest -q` in `backend/ai-service` → 45 passed (12 new); `npm run build --workspace=dashboard` passes. **Not verified:** whether AICredits accepts the schema (no live call), and the dashboard change in a browser. *Owner check (20 Nov 2026):* Ravindra scanned one real garment from the dashboard (Inventory → Add piece) with the rotated key in `backend/.env` and no model override. `POST /api/scan-garment` → 200 in ~5.2 s; AI service `POST /scan` → 200; `/health` then showed `ai_status: ok`, engine `aicredits (gemini-2.5-flash-lite)`, `last_ai_error: null`. No `response_format` error, so AICredits accepts the JSON schema with this model (`AICREDITS_JSON_SCHEMA` left unset). **Accepted by Ravindra, 20 Nov 2026.** — Tier: light
- [x] **S05-03** Make AI failure loud: `/health` reports the real engine, and the dashboard shows an "AI off" banner instead of silently using heuristics. — `backend/ai-service/main.py`, `backend/src/routes/scanGarment.ts`, `dashboard/src/pages/Inventory.tsx`. *Evidence (25 Sep 2026):* `/scan` returns `ai_status` (`ok`/`off`/`failed`) and a key-redacted `ai_error`; `/health` reports `ai_status` (adds `not_tried`), the engine the last scan really used, `last_ai_error` and `last_scan_at`; new `GET /api/scan-garment/health` (staff-only) passes it through; the Add-piece modal checks it on open and after each scan and shows a red "AI off" banner with the reason; guessed tags say "rough guess, not from the AI". The fallback guesses themselves are kept (dropping them is D-16). `python -m pytest -q` → 49 passed; `npx vitest run` → 45 passed (after `npx prisma generate`); backend `tsc` and dashboard build pass. **Browser-checked** in Chromium against a throwaway local Postgres, AI service and backend: banner shows "No AI key is configured" on open, and "The last AI call failed: … Connection error" after a scan with a fake key; no banner before the first scan when a key is set. The after-scan checks ran with the scan-proxy fix, which Ravindra approved and which is now in the code (DEC-17; `npx vitest run` → 46 passed, and the new regression test fails on the old line). *Owner check (20 Nov 2026):* Ravindra scanned one real garment from the dashboard (Inventory → Add piece) with the rotated key in `backend/.env` and no model override. `POST /api/scan-garment` → 200 in ~5.2 s; AI service `POST /scan` → 200; `/health` then showed `ai_status: ok`, engine `aicredits (gemini-2.5-flash-lite)`, `last_ai_error: null`. `/health` and `/api/scan-garment/health` reported the real engine before and after the scan. **Accepted by Ravindra, 20 Nov 2026.** — Tier: light
- [x] **S05-04** Fix `load_dotenv("../.env")`, which depends on the working directory. — `backend/ai-service/classifier.py:16`. *Evidence (24 Oct 2026):* `classifier.py` now loads `ENV_PATH = Path(__file__).resolve().parent.parent / ".env"` (always `backend/.env`); new `tests/test_env_path.py` imports the classifier from an unrelated working directory with a stray `.env` one level up and checks the stray file is ignored. `python -m pytest -q` in `backend/ai-service` → 50 passed. Manual check: with the old code a stray `../.env` was loaded (`stray = loaded`) and, started from the repo root, `AICREDITS_API_KEY` was not found; with the new code the stray file is ignored and, from the repo root, `backend/.env` is found and the key is set (value not printed). **Not verified:** the full service (`start.bat` / `main.py`) started from another folder, though `main.py` gets its config only through `classifier`. Old-vs-new check repeated from the repo root (24 Oct 2026): old code `ai_enabled: False`, new code `ai_enabled: True`. **Accepted by Ravindra, 24 Oct 2026** (commit `22cec06`).
- [x] **S05-05** Point saree-studio's default image model at `google/gemini-3.1-flash-image` in code, README and `.env.example`. — `AI Creation/saree-studio/app.py:28`. *Evidence (24 Oct 2026):* `DEFAULT_MODEL` in `app.py`, the `.env.example` value and comment, and the README now name `google/gemini-3.1-flash-image` and warn that `google/gemini-2.5-flash-image` was due to shut down on 2 Oct; no other reference to the old ID remains in the code, README or tests. `python -m unittest discover -s tests` in `AI Creation/saree-studio` → 13 passed, including the mocked-gateway test that checks the default model is the one sent. **Not verified:** a live try-on call with the new default (costs AICredits credit). Ravindra's local `.env` sets `AICREDITS_IMAGE_MODEL=google/gemini-3.1-flash-lite-image`, which overrides the default, so his own runs were not using the old model. The folder is git-ignored, so this change has no commit. *How to check:* (1) open `AI Creation/saree-studio/app.py` line 28 and confirm `DEFAULT_MODEL = 'google/gemini-3.1-flash-image'`; `.env.example` line 5 and README line 19 name the same model. (2) In `AI Creation/saree-studio` run `python -m unittest discover -s tests` → expect `Ran 13 tests … OK` (the folder's macOS `.venv` does not work on Windows; use the system Python). (3) Optional, costs credit: comment out `AICREDITS_IMAGE_MODEL` in `saree-studio/.env` so the default is used, start the app, generate one try-on and confirm an image comes back. Then say "accept S05-05". **Accepted by Ravindra, 24 Oct 2026**, without the optional live try-on call.
- [x] **S05-06** Repo hygiene: delete `AI Creation/__MACOSX/`, the macOS `.venv` and `__pycache__`; untrack `backend/uploads/*.png`; commit `package-lock.json`; add `.gitattributes`. *Evidence (24 Oct 2026):* deleted `AI Creation/__MACOSX/` (232 KB of macOS zip metadata), `AI Creation/saree-studio/.venv` (a macOS Python 3.13 venv from another person's Mac, unusable on Windows) and the two `__pycache__` folders; this folder is git-ignored, so the deletion is permanent and not in any commit. `git rm --cached` on the two tracked `backend/uploads/*.png` (files kept on disk) and `backend/uploads/` added to `.gitignore` (DEC-23: the whole folder, not only `*.png`; the backend recreates it at start-up, `backend/src/index.ts:27-29`). Removed `package-lock.json` from `.gitignore` and added the lock file (DEC-23). New `.gitattributes`: `* text=auto`, CRLF for `.bat`/`.cmd`, LF for `.sh`, images/fonts/PDF binary; every file in the index was already LF, so no file changed. Checks: `npm ci --dry-run --ignore-scripts` succeeds (lock matches every `package.json`; lock file unchanged); `npm run build` exit 0; `npm test` → 46 passed; `git ls-files --eol` shows only LF text in the index. **Not verified:** a fresh clone with `npm ci` on another machine, and CI on GitHub (the workflow still runs `npm install` with a now-stale comment; switching it to `npm ci` belongs to S05-09). *How to check:* (1) `git show --stat HEAD` → `.gitattributes`, `.gitignore`, `package-lock.json` added or changed and the two `.png` uploads deleted from git. (2) `git status --short` → no `backend/uploads/` files listed, yet `ls backend/uploads` still shows them. (3) `ls "AI Creation" "AI Creation/saree-studio"` → no `__MACOSX`, `.venv` or `__pycache__`. (4) `npm ci --dry-run --ignore-scripts` → finishes without an "out of sync" error. (5) `npm run build` and `npm test` → builds succeed, `46 passed`. Then say "accept S05-06". **Accepted by Ravindra, 24 Oct 2026** (commit `aae920c`).
- [x] **S05-07** Config truth: add `AI_SERVICE_URL` to `.env.example` (the `AICREDITS_*` tagger variables were added in S05-01); set `DATABASE_URL` to port 5434; update the README; add an `ai-service` entry to `.claude/launch.json`. *Evidence (24 Oct 2026):* `.env.example` now uses port 5434 for `DATABASE_URL` (with a note that `docker-compose.yml` publishes 5434, and 5432 is for a local install) and has a commented `AI_SERVICE_URL` line with its default. README: the setup step says to set `DASHBOARD_PIN` and that Docker uses 5434; a new optional step 6 explains starting the garment tagger; the configuration table now shows 5434, adds `AI_SERVICE_URL`, the `AICREDITS_*` variables and `FITFIRST_DEMO_SEED`, and corrects `DASHBOARD_PIN` (the README claimed a default of `1234`, but the backend has no default and refuses staff login until it is set, `backend/src/authGuard.ts:36-37`). The `ai-service` entry already existed in `.claude/launch.json`; started through the preview tool, it ran `start.bat`, and `GET /health` answered `status: ok`, `ai_enabled: true`, `ai_provider: aicredits`. Ravindra's own `backend/.env` already uses port 5434. **Not verified:** a database connection with the example URL (Docker was not running), and a fresh setup from the README on a clean machine. *How to check:* (1) `git show HEAD -- .env.example README.md` (after the commit) → port 5434, the `AI_SERVICE_URL` line, the corrected `DASHBOARD_PIN` row. (2) `grep -n 5434 docker-compose.yml .env.example` → both say 5434. (3) With Docker running, `docker-compose up -d`, copy `.env.example` to a scratch file, and confirm the backend starts against it (or compare its `DATABASE_URL` with the one in your working `backend/.env`). (4) In the Claude Code app, start the `ai-service` preview, or run `backend/ai-service/start.bat`, then open `http://localhost:8000/health` → `"status": "ok"`. Then say "accept S05-07". **Accepted by Ravindra, 24 Oct 2026** (commit `8c01f11`).
- [x] **S05-08** Demo-facing kiosk fixes: remove the shopper-visible staff dashboard link (`kiosk/src/screens/Welcome.tsx:129-136`), fix the `&arr;` typo (`SizeEntry.tsx:192`), and replace the "Fair / Porcelain" style labels with neutral numbered depth (`AttributeEntry.tsx:8-13`). *Evidence (24 Oct 2026):* staff-dashboard link removed from the welcome screen (the camera-privacy note stays); `&arr;` → `&rarr;`; skin-tone labels are now "Tone 1" … "Tone 4" with the existing swatches and colour hints, under the heading "1. Skin tone" with the hint "Swatches go from lightest (1) to deepest (4)" (was "1. Complexion Undertone"), per DEC-24 (option A). The dashboard Sessions page (`dashboard/src/pages/Sessions.tsx:33-38`) shows the same labels (DEC-24). Internal codes `FAIR`/`WHEATISH`/`MEDIUM`/`DEEP` are unchanged (no data change). `npm run build` exit 0; no `Porcelain`/`Wheatish /`/`Ebony`/`&arr;`/`localhost:5173` left in `kiosk/src` or `dashboard/src`. Browser check (Chromium preview, kiosk only): welcome screen has no staff link; size button reads "Continue to Preferences →"; the skin-tone screen shows the new heading, hint and four Tone buttons; selecting Tone 2 sets `aria-pressed=true` and the screen-reader label reads "Skin tone: Tone 2". **Not verified:** the dashboard Sessions page in a browser (needs the backend and database; Docker was not running) — only its build. *How to check:* (1) `git show HEAD --stat` (after the commit) → the four `.tsx` files. (2) Start the kiosk (`npm run dev`, or the `kiosk` preview) at `http://localhost:5174`: the welcome screen has no "Staff Dashboard" link at the bottom. (3) Begin → Continue to Shop → a department → a size: the button reads "Continue to Preferences →" with a real arrow. (4) Skip preferences: the skin-tone panel says "1. Skin tone", "Swatches go from lightest (1) to deepest (4)", and Tone 1 … Tone 4 — no Fair / Wheatish / Olive / Ebony. (5) With the database running, finish a session and open it on the dashboard Sessions page: the skin tone shows as "Tone N". Then say "accept S05-08". **Accepted by Ravindra, 24 Oct 2026** (commit `24637c8`).
- [x] **S05-09** CI: GitHub Actions running build, vitest, pytest and a secret scan. *Evidence (20 Nov 2026):* `.github/workflows/ci.yml` now runs on every push and pull request with three jobs: `check` (`npm ci` from the committed lock file, Prisma generate, build, vitest, lint, `docs:check --strict`), `ai-service` (Python 3.12, `pytest tests`, without torch/transformers, because the tests force the no-CLIP path and torch would make the service download the CLIP model; `test_ai_scan.py` is a manual check against a running server and is not collected) and `secrets` (gitleaks 8.28.0, checksum-verified, full history, redacted; DEC-29). Lint now skips `prototype/`, `prototype_v2/` and `marketing/` (DEC-30). Run locally: `npm ci --dry-run` OK; `npm run build` passes; `npm test` → 55 passed; `npm run lint` → 0 errors, 71 warnings; `pytest -q tests` in a clean venv without torch → 49 passed; `docs:check --strict` passes; the workflow parses as YAML. *GitHub run (20 Nov 2026):* the first run (`4b7251b`) failed in `check` on `docs:check --strict` (status date older than the source change), fixed by the handoff update in `2c92c0d`; Ravindra reported all three jobs (`check`, `ai-service`, `secrets`) green on that run, so gitleaks found no leaks in the full history. **Accepted by Ravindra, 20 Nov 2026.** *How to check:* commit and push, open the repo's Actions tab, and confirm `check`, `ai-service` and `secrets` are all green. If `secrets` fails, read its log (values are redacted) and decide per finding: allowlist it (only if the key was already rotated) or clean it from history. — Tier: standard

## Stage 1 — Stabilise the current pilot

Automated checks pass; browser checks were recorded 25 Sep 2026 in `STAGE_1_TEST_GUIDE.md` (camera S1-08 not run). *How for all of Stage 1:* start the services, use `http://localhost:5174` (kiosk) and `http://localhost:5173` (dashboard), on **dedicated test stock**, and record each result in `STAGE_1_TEST_GUIDE.md` or a linked test log.

- [x] **S1-01** Backend unit tests pass. — 42 tests (9 Sep); 46 after S05-03 (25 Sep 2026) **Accepted by Ravindra, 21 Nov 2026 (D-03, DEC-33).** — Tier: light
- [x] **S1-02** Backend, dashboard and kiosk builds pass. **Accepted by Ravindra, 21 Nov 2026 (D-03, DEC-33).** — Tier: light
- [x] **S1-03** Disposable-schema PostgreSQL integration checks pass. — `npm run test:integration --workspace=backend` **Accepted by Ravindra, 21 Nov 2026 (D-03, DEC-33).** — Tier: light
- [x] **S1-04** Migration backup and additive migration exercised locally. — `npm run db:backup --workspace=backend` **Accepted by Ravindra, 21 Nov 2026 (D-03, DEC-33).** — Tier: light
- [x] **S1-05** Browser walkthrough reaches privacy, department, size and preferences. **Accepted by Ravindra, 21 Nov 2026 (D-03, DEC-33).** — Tier: light
- [x] **S1-06** Staff login, refresh, lock and wrong-PIN checks. *Evidence (25 Sep 2026):* wrong PIN, refresh and Lock pass — see the browser test log in `STAGE_1_TEST_GUIDE.md`. **Accepted by Ravindra, 21 Nov 2026 (D-03, DEC-33).** — Tier: light
- [x] **S1-07** The complete customer path through recommendations and handoff. *Evidence (25 Sep 2026):* full path to handoff code and dashboard lookup passes; Edit preferences left a duplicate session (issue 1); fixed the same day by updating the session in place (`PUT /api/sessions/:id/answers`), re-tested in the browser and covered by `npm run test:integration` — `STAGE_1_TEST_GUIDE.md`. **Accepted by Ravindra, 21 Nov 2026 (D-03, DEC-33).** — Tier: light
- [x] **S1-08** Camera success, denied permission, poor light and manual fallback. *Owner check, part 1 (20 Nov 2026):* in Chrome, the camera opened, sampled and returned an estimate (success flow works), but the card said "Estimated tone: fair" (against DEC-24) and the estimate looked too light in a backlit room. This led to DEC-32 (perception becomes the core track; see [PERCEPTION_PLAN.md](PERCEPTION_PLAN.md)). *Camera-beta fix (21 Nov 2026):* new shared label list `kiosk/src/utils/toneLabels.ts` used by both `AttributeEntry.tsx` and `CameraScan.tsx`; the result card now says "Estimated tone: Tone N" under a "Beta" label and "You'll confirm or change it on the next screen". Checks: the list maps FAIR/WHEATISH/MEDIUM/DEEP to Tone 1–4 (script); kiosk build passes; `npm test` → 55 passed; kiosk lint 0 errors; in the browser pane the picker shows Tone 1–4 and the camera screen opens and returns to the picker with "Select manually" (the pane blocks cameras, so the result card itself was not seen). *Owner check, part 2 (21 Nov 2026):* Ravindra re-ran all four cases in Chrome and reported all pass; the result card showed "Beta · Estimated tone: Tone 2". Recorded in the browser test log in `STAGE_1_TEST_GUIDE.md`. Accuracy is not validated (that is the perception track, DEC-32). **Accepted by Ravindra, 21 Nov 2026 (D-03, DEC-33).** — Tier: none
- [x] **S1-09** Idle warning, keep-shopping and full reset. *Evidence (25 Sep 2026):* warning, Keep shopping, 120 s reset and Start over pass — `STAGE_1_TEST_GUIDE.md`. **Accepted by Ravindra, 21 Nov 2026 (D-03, DEC-33).** — Tier: light
- [x] **S1-10** Recommended sale, other-item sale and repeated-submit checks. *Evidence (25 Sep 2026):* recommended sale, other-item sale and double-click save pass on demo data — `STAGE_1_TEST_GUIDE.md`. **Accepted by Ravindra, 21 Nov 2026 (D-03, DEC-33).** — Tier: light
- [x] **S1-11** Inventory image, invalid stock, CSV validation and analytics checks. *Evidence (25 Sep 2026):* invalid stock (UI and API), CSV validation and analytics pass; no demo product has an image — `STAGE_1_TEST_GUIDE.md`. **Accepted by Ravindra, 21 Nov 2026 (D-03, DEC-33).** — Tier: light
- [x] **S1-12** Record expected result, actual result, screenshots/issues, tester and date for each check. *Evidence (25 Sep 2026):* the browser test log in `STAGE_1_TEST_GUIDE.md` records check, expected, actual, result, tester, date and five issues. **Missing:** screenshots. S1-08 (camera) was added to the log on 21 Nov 2026. **Accepted by Ravindra, 21 Nov 2026 (D-03, DEC-33), without screenshots.** — Tier: light
- [x] **S1-13 (owner)** Accept Stage 1, or produce a prioritised defect list. — D-03 **Ravindra accepted Stage 1 on 21 Nov 2026 (DEC-33); follow-ups listed there.** — Tier: none

## Stage P — Perception (core track)

**Approved by Ravindra, 23 Nov 2026** ("Yes, add all 12"), from [PERCEPTION_PLAN.md](PERCEPTION_PLAN.md) §8. DEC-32 makes this FitFirst's core track and puts it before Stage 2. Decisions: vision library DEC-35, camera DEC-36, rule tables DEC-37, accuracy bars DEC-38, body wording DEC-39, shape set DEC-40. **No shopper, including at the pilot shop, sees either scan until SP-10's report passes every bar in every skin-depth group, an owner accepts it (SP-11), and S0-08 is done.** Can start now: SP-01, the SP-04 draft, SP-06, SP-12.

- [ ] **SP-01** MediaPipe Tasks-Vision spike (DEC-35): add `@mediapipe/tasks-vision` to the kiosk at an exact pinned version; host the Face Landmarker, Pose Landmarker and selfie multiclass segmenter model files ourselves; a hidden test page (not reachable by shoppers) showing the face mesh, body points and skin/hair/clothes mask with fps and scan time, and the camera's exposure and white-balance lock capabilities. Measure on a laptop, a mid-range Android phone and a candidate kiosk device, on built-in cameras (DEC-36). Edge cases: no WebGL, camera blocked, first load offline, two people in frame, dupatta or hijab, very dark or bright light. *Done when:* a report with numbers per device; more than about 3 s per kiosk scan reopens a kiosk-only shop server as a decision. — P-D1 (DEC-35) — Tier: deep — **Assigned: Ravindra** (DEC-41)
- [ ] **SP-02** Buy and test the kiosk camera kit (DEC-36): a mid-range 1080p webcam whose exposure and white balance lock from the browser (checked on the actual unit, from a seller with a return window), a soft panel light and a grey reference card, about ₹8,000–12,000 per kiosk. Must finish before SP-03's sessions and SP-10; not needed for SP-01 or SP-05 development. — P-D2 (DEC-36) — Tier: standard — **Assigned: Ravindra** (DEC-41)
- [ ] **SP-03** Evaluation tool and consent form; recruit **200 adults**, about 40 per skin-depth group, men and women, 18–60, each scanned in daylight, shop LED and a warm bulb (and fitted and loose clothing for body). A stylist labels each person in person; self-report recorded. The first 60 are an internal checkpoint only. Consented photos kept encrypted inside the evaluation set and deleted at the end. — P-D4 (DEC-38); S0-08 for the consent wording; SP-02 for the kit — Tier: standard — **Assigned: Het** (DEC-41)
- [ ] **SP-04** Stylist rule tables v1 (DEC-37): Claude drafts a readable document (not code) from published guidance, adapted for Indian skin and garments, with sources: colour (depth × undertone × contrast × garment colour), shape (5 women's and 3 men's shapes × garment type × silhouette and drape, DEC-40) and neutral reason texts in EN/HI/GU. Guardrails: no colour forbidden for any tone; no "fairer", "slimmer" or weight words; a fairness check that every depth gets an equally wide and attractive range. A stylist reviews and signs; an owner approves; only then does it enter the code. — P-D3 (DEC-37); sign-off needs SP-12 — Tier: deep — **Assigned: Het** (DEC-41)
- [ ] **SP-05** Skin tone v2 on the kiosk (PERCEPTION_PLAN §3; replaces draft S5-15): face landmarks with quality gates and a face-skin mask; forehead and upper-cheek samples with highlights and shadows dropped; 20–30 frames, median; grey-card light correction, with exposure and white balance locked where the camera allows and working when it does not (DEC-36); depth group shown as the 3 nearest Monk swatches for the shopper to tap; undertone and skin–hair contrast, each allowed to be "unknown"; a confidence score; "not sure" instead of a guess; no image stored or sent; neutral wording only. Stays switched off for shoppers until SP-11. — SP-01; SP-02 before evaluation — Tier: deep — **Assigned: Ravindra** (DEC-41)
- [ ] **SP-06** Swatch-plus-quiz tone fallback (PERCEPTION_PLAN §3; replaces draft S5-16): the Tone swatches plus three questions (gold or silver jewellery; wrist veins green, blue or both; in the sun you tan, burn or both) for shoppers who skip or decline the camera, have no camera, cover their hair, or are on a Kids profile; never blocks shopping. — S3-03 — Tier: standard — **Assigned: Ravindra** (DEC-41)
- [ ] **SP-07** Body type from a phone photo (PERCEPTION_PLAN §4), behind a switch that stays off: quality gates, pose points and body outline, shoulder/waist/hip ratios, a height band from the shopper, a loose-clothing check that lowers confidence or abstains; result shown as the closest **unnamed drawing** with its neighbours, in fit-goal words only (DEC-39), over 5 women's and 3 men's shapes (DEC-40); adults only (18+), no body estimate on a Kids profile; photos processed in the phone's browser and discarded. — SP-01; D-11 and D-25 (DEC-39, DEC-40) — Tier: deep — **Assigned: Ravindra** (DEC-41)
- [ ] **SP-08** Measured garment colour (CIELAB) from product photos, with confidence and source, so rules can score depth × undertone × contrast; does the work of S5-03. Built in the Python AI service with Pillow (already a dependency); no wait on SP-01 (DEC-41). — Tier: standard — **Assigned: Het** (DEC-41)
- [ ] **SP-09** Confidence-aware scoring and neutral reasons (PERCEPTION_PLAN §5.3, §5.4) from the signed SP-04 tables; tone and shape may be "unknown" and are then scored without that input, replacing the silent Tone 2 / Hourglass defaults in `kiosk/src/screens/Recommendations.tsx:80-81, 97-98` (DEC-33 follow-up). — SP-04, SP-05 — Tier: deep — **Assigned: Het** (DEC-41)
- [ ] **SP-10** Run the 200-person evaluation and write the report: every PERCEPTION_PLAN §1 bar, per condition and **per skin-depth group** (each group must pass on its own), on the option B kit. — SP-02, SP-03, SP-05, SP-07; DEC-38 — Tier: deep — **Assigned: Ravindra and Het** (DEC-41)
- [ ] **SP-11 (owner)** Accept the perception track: review SP-10's report against the §1 bars and decide whether each scan may be switched on for shoppers. — SP-10, S0-08 — Tier: none — **Assigned: Ravindra and Het** (DEC-41)
- [ ] **SP-12 (owner)** Find a stylist who knows Indian skin and ethnic wear to review and sign the SP-04 rule tables; agree scope and fee. — DEC-37 — Tier: none — **Assigned: Het** (DEC-41)

## Stage 2 — Single-store operations

### Decisions before any coding

- [?] **S2-D01** Approve the v2 data model scope. — D-06 — Tier: deep
- [?] **S2-D02** Migrate in place, or take a clean v2 baseline plus importer? — D-06 — Tier: deep
- [?] **S2-D03** Provide the physical stock-count plan for splitting product stock into sizes. — D-07 — Tier: deep
- [?] **S2-D04** Approve staff roles, authentication, device access and audit requirements. — Tier: deep

### Catalogue and stock

- [ ] **S2-C01** Add ProductVariant with size, SKU/barcode and colour where needed. — Tier: deep
- [ ] **S2-C02** Add store-level stock balances and enforce non-negative quantities. — Tier: deep
- [ ] **S2-C03** Add inventory lots with received date and age source (this is what makes "aged stock" real). — Tier: deep
- [ ] **S2-C04** Add stock movements: receipt, sale, return, adjustment, damage, sync. — Tier: deep
- [ ] **S2-C05** Add reservations with expiry and release. — Tier: deep
- [ ] **S2-C06** Build the product-to-variant migration/import, with an unresolved-count report. — Tier: deep
- [ ] **S2-C07** Build the physical stock-count workflow and reconcile a sample against the shop. — Tier: standard
- [ ] **S2-C08** Add rack/location fields and search, so staff can actually find a piece. — Tier: standard

### Sales and sessions

- [ ] **S2-S01** Replace purchase events with Sale and SaleLine records. — Tier: deep
- [ ] **S2-S02** Make the sale and its stock movement atomic and idempotent. — Tier: deep
- [ ] **S2-S03** Enforce server-side recommendation attribution. — Tier: deep
- [ ] **S2-S04** Support multi-item sales, quantity, price snapshot and discount (bargaining is normal here). — Tier: deep
- [ ] **S2-S05** Add void, correction, return and exchange paths with an audit trail. — Tier: deep
- [ ] **S2-S06** Persist handoff code, expiry, status, assignment and outcome events. — Tier: standard
- [ ] **S2-S07** Add server-side code search and pagination (today search only covers the newest 100 sessions, in the browser). — Tier: standard
- [ ] **S2-S08** Add the live staff queue with claim/assignment. — Tier: standard
- [ ] **S2-S09** Add focused concurrency, retry, return and cross-device tests. — Tier: deep

### Authentication and trust

- [ ] **S2-A01** Remove any browser-delivered staff credentials. — Tier: deep
- [ ] **S2-A02** Add server login, expiring sessions, logout, rate limiting and role checks. — Tier: deep
- [ ] **S2-A03** Scope customer session detail behind an expiring access mechanism. — Tier: deep
- [ ] **S2-A04** Add notice/consent records with retention and erasure behaviour. — Tier: deep
- [ ] **S2-A05** Add audit events for privileged changes. — Tier: standard

### Console screens from the V2 target (V2 draft, DEC-26)

- [ ] **S2-V01** Role-aware **Today** home: different numbers and tasks for owner/manager, sales staff and intake. — V2 Today; needs S2-A02 roles — Tier: standard
- [ ] **S2-V02** Console navigation: 7 top tabs (Today, Sessions, Inventory, Counter, Analytics, Baseline Log, Setup) with sub-tabs, an "All pages" menu, role-locked pages with "switch person", a bottom tab bar on phones. — V2 console shell — Tier: standard
- [ ] **S2-V03** Name-first sign-in with a personal PIN per person and lock-out after 5 tries (part of S2-A02); owner sign-in by phone code needs an SMS provider decision first. — V2 sign-in — Tier: deep
- [ ] **S2-V04** One **Sessions** page: live board (Waiting · With staff · Done today) plus the visits list with chips (incl. "Left midway"), channel filter, code search, date range and paging; no-purchase reasons saved on the session for every device. — V2 Sessions; with S2-S07, S2-S08 — Tier: standard
- [?] **S2-V05** Session detail: picks with racks and talking points; Tried / Rejected / Hold / Swap / Add to bill; a 30-minute hold that really reduces stock available to others (S2-C05); add another piece; mark no purchase with reasons; erase. — V2 session detail; D-22 — Tier: standard
- [ ] **S2-V06** Printable pick list with rack codes. — V2 session detail; needs S2-C08 — Tier: light
- [ ] **S2-V07** Step-by-step intake (photos → AI read → check highlighted fields → stock by size), an intake timer against the 90 s / 3 min targets, and a **Review queue** page for uncertain tags (S5-04). — V2 Inventory → Intake, Review queue — Tier: standard
- [ ] **S2-V08** **Purchase inward**: receive stock against a supplier delivery, adding lots (S2-C03) and movements (S2-C04). — V2 Inventory → Purchase inward — Tier: standard
- [ ] **S2-V09** **Labels**: print price/barcode labels for new or recounted stock (printer hardware untested). — V2 Inventory → Labels — Tier: standard
- [ ] **S2-V10** Catalogue as a six-column table with stock by size, and a piece drawer (overview, stock with per-size edit and a reason, history). — V2 Inventory → Catalogue — Tier: standard
- [ ] **S2-V11** An audit log page that lists the S2-A05 events. — V2 Settings → Audit — Tier: light

### Stage 2 gate

- [ ] **S2-G01** Two staff devices see the same session outcome. — Tier: deep
- [ ] **S2-G02** Concurrent attempts to sell the final unit allow exactly one sale. — Tier: deep
- [ ] **S2-G03** A return restores the correct variant and lot. — Tier: deep
- [ ] **S2-G04** Replayed imports and sale requests never duplicate records or movements. — Tier: deep
- [ ] **S2-G05 (owner)** Accept Stage 2 and approve the next stage. *V2 comparison first:* list each difference from `prototype_v2/` for this stage's screens as intended, improved or missed (see "V2 target tasks"). — Tier: none

## Stage 3 — Customer and staff experience

- [ ] **S3-01** Ask department/category before attributes, and ask only size questions relevant to that category.
- [ ] **S3-02** Add budget, occasion, colour likes/dislikes and optional fit goals.
- [ ] **S3-03** Make tone and body inputs optional, neutral and easy to correct. — **Assigned: Ravindra** (DEC-41)
- [ ] **S3-04** Replace colourist labels with neutral depth language throughout. — D-11 (decided, DEC-39: body shape as unnamed drawings, fit-goal words) — **Assigned: Ravindra** (DEC-41)
- [ ] **S3-05** Show three strong picks first, with real product media and true availability.
- [ ] **S3-06** Add details, shortlist / Add to Try, edit preferences and contextual help.
- [ ] **S3-07** Add the expiring QR handoff, and show "staff notified" only when delivery is confirmed.
- [ ] **S3-08** Add English, Hindi and Gujarati copy with human review. — D-14
- [ ] **S3-09** Complete responsive, keyboard, touch, focus, contrast and reduced-motion checks.
- [ ] **S3-10** Add missing-photo and connection states that never misrepresent inventory.
- [ ] **S3-11** Validate the journey with representative shoppers and staff.
- [?] **S3-13** Regroup the kiosk into V2's five labelled steps (Section → Looking for → Size → Colouring & fit → Picks), every step-4 input skippable with nothing assumed, plus V2's idle prompt and reset timing. — V2 draft; D-10 (decided, DEC-32), D-11 (decided, DEC-39), D-24
- [ ] **S3-14** Results as one hero pick plus a ranked list: no match %, "why it suits you" from the top-scoring rule, true size availability, an add-to-try toggle and try-list tray, "Store pick · offer" labels. — V2 draft; details S3-05, S3-06
- [ ] **S3-15** A "Call staff" button on every kiosk screen that raises an alert in the live queue. — V2 draft
- [ ] **S3-16** Per-purpose consent switches and a kind "nothing was saved" screen when the shopper declines. — V2 draft; with S2-A04
- [ ] **S3-17** Family visit: add another family member under one code, a tab per person for staff and on the phone; under-18 profiles get no tone or fit questions. — V2 draft
- [?] **S3-18** Empty results with alternatives, and a "tell me when it arrives" opt-in listed beside the demand gaps. — V2 draft; needs the messaging and consent decisions in S6-10
- [?] **S3-19** One shopper flow in three modes: kiosk, assisted (staff tablet) and QR on the shopper's phone. — V2 draft; D-21
- [ ] **S3-20** Shopper phone: enter a code, lookbook with family tabs, piece detail, share link, "remember me". A `DECISION NEEDED` comes first on what the share link shows and when it expires, and on what "remember me" stores (new personal data). — V2 draft
- [ ] **S3-21** Shopper self-service privacy: see what is kept and until when, and delete it from the phone (the bill is kept for GST); staff can do the same at the counter. — V2 draft; with S2-A04
- [ ] **S3-22** Shop name and area come from settings, not hard-coded ("Ahmedabad Showroom"). — V2 draft
- [ ] **S3-23** Light and dark themes on the kiosk and phone, with motion that switches off under "reduce motion". — V2 draft; with S3-09
- [ ] **S3-12 (owner)** Approve the UX, language and accessibility gate. *V2 comparison first:* list each difference from `prototype_v2/` for this stage's screens as intended, improved or missed (see "V2 target tasks").

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
- [?] **S4-12** Pilot analytics page: a verdict built from three measured targets with sample-size rules ("not measurable yet" when an input is missing), control-group lift, funnel, rejection reasons, attribution shown as a range, metric definitions on each tile. — V2 draft; D-08
- [ ] **S4-13** Baseline Log extended: footfall, a before/after summary, pass marks that lock, and a Pilot scorecard sub-page. — V2 draft; with D-08
- [ ] **S4-11 (owner)** Approve go-live evidence and the operational runbook. — D-13. *V2 comparison first:* list each difference from `prototype_v2/` for this stage's screens as intended, improved or missed (see "V2 target tasks").

## Stage 5 — Recommendation evidence and AI

- [ ] **S5-01** Create a stylist-reviewed garment evaluation set.
- [ ] **S5-02** Version the taxonomy, rulesets, prompts and model adapters. — D-09
- [ ] **S5-03** Measure colour in a documented colour space; retain confidence and source. — the work is done by SP-08 (approved 23 Nov 2026)
- [ ] **S5-04** Add human review for uncertain garment tags; invalid values must never silently default.
- [ ] **S5-05** Evaluate camera repeatability and lighting before making any store claim. — D-10
- [ ] **S5-06** Improve category-specific size, silhouette, occasion, budget and diversity rules.
- [ ] **S5-07** Add ageing/clearance controls with suitability gates and holdout measurement.
- [ ] **S5-08** Keep explanations deterministic, neutral and human-translated.
- [ ] **S5-09** Add property tests for boost caps, suitability boundaries and offline recommendations.
- [ ] **S5-10 (owner)** Decide whether and when to integrate virtual try-on. — D-12
- [ ] **S5-11** If approved: consent, 18+ gate, provider DPA, quotas, automated QA, AI labelling, retention and cost monitoring.
- [?] **S5-13** Clearance page: aged stock with "shown · 7 days", a plain-words markdown suggestion (never an automatic price change), the clearance simulator (same shopper, nudge off and on), and pushes with an optional staff incentive. — V2 draft; with S5-07; D-23
- [ ] **S5-14** Ruleset lifecycle: clone → edit weights on the draft → activate with a manager PIN. — V2 draft; with S5-02
- [ ] **S5-12 (owner)** Approve every new model or provider, and review the evaluation report. *V2 comparison first:* list each difference from `prototype_v2/` for this stage's screens as intended, improved or missed (see "V2 target tasks").

## Stage 6 — Multi-store and commercial scale

- [ ] **S6-01** Add Organization, Store, Membership, roles and store-scoped queries.
- [ ] **S6-02** Add device enrolment, revocation, heartbeat and configuration.
- [ ] **S6-03** Add tenant-isolation tests and operational audit review.
- [ ] **S6-04** Add POS Excel/CSV import with a maintained parser, preview, mapping and idempotent sync.
- [ ] **S6-05** Add only the POS bridge or API a paying shop actually requires.
- [ ] **S6-06 (owner)** Decide whether to build the focused FitFirst Billing module. — D-05
- [ ] **S6-07** If approved: offline-first billing, tax rules, invoices, payments, returns, day close and exports, with CA review.
- [?] **S6-07a** Counter → New bill: scan a visit code, any catalogue item and size, price after bargaining, discount limit with manager PIN, GST explained on the line, UPI, held bills. Hide the Counter tab for path-A shops. — V2 draft; D-05
- [?] **S6-07b** Counter → Sales register with GST summary and exports. — V2 draft; D-05
- [?] **S6-07c** Counter → Day close. — V2 draft; D-05
- [?] **S6-07d** Returns, credit notes and exchanges inside the exchange window. — V2 draft; D-05, D-24
- [?] **S6-07e** The e-bill landing page on the shopper's phone (opened from the WhatsApp link). — V2 draft; D-05, S6-10
- [ ] **S6-08** Add plan, entitlement, usage and quota metering.
- [ ] **S6-09** Add multi-store stock transfers and consolidated reporting.
- [ ] **S6-10** Add WhatsApp or saved profiles only with explicit consent and retention decisions.
- [ ] **S6-11** Validate support, pricing, onboarding and hardware runbooks with real shops. — D-15
- [ ] **S6-13** Setup guide for a new shop: six guided steps (dead-stock sprint, import, count, staff, devices) that also run the billing discovery questions and propose path A or B. — V2 draft
- [ ] **S6-14** Settings areas from V2 (store, staff and role table, devices and camera calibration, racks, taxonomy, rules, billing, billing software, try-on, privacy and consent records, notifications, plan, audit). Audit which the pilot needs first; demo controls stay prototype-only. — V2 draft
- [ ] **S6-15** FitFirst ops console: model registry, swap a retired model, try-on spend kill-switch. — V2 draft
- [ ] **S6-12 (owner)** Approve commercial launch readiness. *V2 comparison first:* list each difference from `prototype_v2/` for this stage's screens as intended, improved or missed (see "V2 target tasks").

---

## Stage 7 — Engineering foundations (parallel track)

**Approved 3 Oct 2026 as DEC-19 (option B).** Structure and coding standards are in [ENGINEERING_STANDARDS.md](ENGINEERING_STANDARDS.md). This track changes structure only, never behaviour. **Only S7-01 may start before D-03.** *D-03 answered 21 Nov 2026 (DEC-33): Stage 1 accepted, so S7-02 … S7-06 are unblocked; when they run relative to the perception track (DEC-32) is Ravindra's call.* S7-02 … S7-06 touch files that carry uncommitted edits, so they also wait until that work is committed. *D-19 answered 20 Nov 2026 (DEC-28, option B):* S7-02 … S7-06 were never unblocked, so this gate stands until D-03; the early S7-04 commit `caa85a7` is kept as it is.

- [~] **S7-01** Tooling baseline (option A, 3 Oct 2026): root ESLint (typescript-eslint, react-hooks), Prettier, `.editorconfig`, `lint`/`format` scripts and a CI workflow. No application logic changed. — *evidence (3 Oct 2026):* `npm run lint` → 0 errors, 73 warnings; `npm run build` passes; `npm test` → 46 passed; `npm run docs:check` passes. **Not done / not verified:** the CI workflow has never run on GitHub; `format:check` is **not** in CI because 59 files are unformatted and ~20 carry uncommitted edits, so the one-time `npm run format` waits until that work is committed; `no-useless-catch` is a warning (5 sites in `products.ts`, `purchaseEvents.ts`) until S7-03; 73 existing warnings (`any`, unused vars, hook dependencies) are untouched. — Tier: light
- [ ] **S7-02** Shared types package (`packages/types`) for API request/response shapes and enums; first audit and count how many shapes are duplicated today. — D-03; *check:* three builds pass — Tier: standard — **Assigned: Het** (DEC-41)
- [ ] **S7-03** Backend layering: route → service → repository, one route file per sub-task, starting with `sessions.ts` then `products.ts`. — D-03; *check:* `npm test` and `npm run test:integration --workspace=backend` unchanged — Tier: deep — **Assigned: Het** (DEC-41)
- [~] **S7-04** Backend cross-cutting: shared validation, one error shape, structured logging and a validated config module. — D-03; *check:* same, plus a test per piece. *Note (8 Nov 2026):* the "one error shape" piece is already committed (`caa85a7`, 2 Nov, het2108: `backend/src/lib/errors.ts`, routes and the dashboard API client) ahead of this gate. Ravindra chose to keep it and keep the gate (DEC-28, 20 Nov 2026). `npm test` → 55 passed, including 9 for the error module. **Not verified:** builds, `npm run test:integration`, and dashboard error messages in a browser. Shared validation, structured logging and the config module are not done. D-03 answered 21 Nov 2026 (DEC-33): the gate is lifted, so the finished error-shape piece is marked `[~]`; the other three pieces are not started. — Tier: standard — **Assigned: Het** (DEC-41)
- [ ] **S7-05** Shared UI package (`packages/ui`): audit dashboard and kiosk for real duplication first, then extract only what both use. Only after Ravindra's perception screens are merged (DEC-41). — D-03; *check:* both frontend builds pass — Tier: standard — **Assigned: Ravindra** (DEC-41)
- [ ] **S7-06** Frontend feature folders for the dashboard pages and kiosk screens; tidy `lib/api.ts` into the single typed client. Only after Ravindra's perception screens are merged (DEC-41). — D-03; *check:* both builds pass, kiosk path to handoff re-checked in a browser — Tier: standard — **Assigned: Ravindra** (DEC-41)

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
