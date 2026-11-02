# FitFirst Architecture

> **The answer to "where does this code live, and why is it built this way?"** Read this before your first change. It describes the system **as it is today**, names the gaps honestly, and says where new code goes.
>
> Related: [ENGINEERING_STANDARDS.md](ENGINEERING_STANDARDS.md) is the target structure and coding rules. [MASTER_PLAN.md](MASTER_PLAN.md) is where the product is going. [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) has the repo map, commands and landmines. [AGENTS.md](../AGENTS.md) is how work is approved here.
>
> **Status:** written 25 October 2026, at the start of the Stage 7 architecture track (S7-02 … S7-06, unblocked by Ravindra on 25 October). Sections marked **Gap** are known problems with a task ID, not accidents.

---

## 1. What the system is

A single-store, in-store clothing recommendation system. Three user-facing apps and one helper service talk to one API and one database.

| Part | Path | Port | Who uses it | Auth |
|---|---|---|---|---|
| Kiosk | `kiosk/` | 5174 | The shopper, unattended | **None** (see §6) |
| Dashboard | `dashboard/` | 5173 | Staff and the owner | Shared 4-digit PIN → cookie |
| API | `backend/` | 3000 | Both apps | Issues and checks the staff cookie |
| Garment tagger | `backend/ai-service/` | 8000 | The API only | None (private service) |

`AI Creation/saree-studio/` is a standalone try-on prototype. It is git-ignored, holds live API keys, and is **not part of this architecture** until integration is approved (D-12).

### Request flow

```
Shopper at the kiosk                    Staff at the dashboard
        │                                        │
        │ POST /api/sessions                     │ POST /api/auth/login  (PIN)
        │ GET  /api/sessions/:id/recommendations │ → httpOnly cookie, 8 h
        ▼                                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Fastify API (backend/src/index.ts)                         │
│    CORS → sensible → error handler → multipart → static     │
│    ├── public:  sessions, recommendations                   │
│    └── guarded: products, purchase-events, analytics,       │
│                 baseline, upload, scan-garment              │
└───────────────┬──────────────────────────┬──────────────────┘
                │ Prisma                   │ HTTP (multipart)
                ▼                          ▼
          PostgreSQL :5434        AI tagger :8000 ──► AICredits gateway
```

---

## 2. Where code lives today

```
backend/
  src/
    index.ts            server wiring, plugins, error handler, route registration
    authGuard.ts        staff cookie auth + login/logout routes + login throttle
    imageSniff.ts       magic-byte check on uploads (used by upload + scan)
    analyticsMetrics.ts distinct-session metric helpers
    routes/             one file per resource — HTTP + validation + rules + Prisma
    scoring/            engine.ts, tables.ts, sizes.ts — pure, no I/O, well tested
  prisma/               schema.prisma, migrations/, seed.ts
  ai-service/           Python FastAPI garment tagger (own tests, own runtime)
  scripts/              check-stage1.ts (integration), backup-local.cjs
dashboard/src/
  App.tsx (433 lines)   routing, auth shell, lock screen
  pages/                Inventory, Sessions, Analytics, BaselineLog
  lib/api.ts            15-line fetch wrapper
kiosk/src/
  App.tsx (226 lines)   the screen state machine — single source of navigation
  screens/              one component per step of the shopper flow
  utils/visionAnalyzer.ts  on-device skin-tone estimate (nothing is uploaded)
docs/                   status, checklist, decisions, plan, standards, this file
```

### Where do I put…?

| I want to… | Go here |
|---|---|
| Add or change an API endpoint | `backend/src/routes/<resource>.ts` |
| Change a recommendation rule or weight | `backend/src/scoring/tables.ts`, `engine.ts` |
| Change size matching or aliases | `backend/src/scoring/sizes.ts` |
| Change the database | `backend/prisma/schema.prisma` + a **new** migration |
| Change staff login or route protection | `backend/src/authGuard.ts` |
| Add a dashboard page | `dashboard/src/pages/` + a route in `dashboard/src/App.tsx` |
| Change the kiosk step order | `kiosk/src/App.tsx` (the state machine) — never in a screen |
| Change one kiosk step's UI | `kiosk/src/screens/<Step>.tsx` |
| Change garment AI prompts or parsing | `backend/ai-service/prompts.py`, `classifier.py` |
| Record a decision | `docs/DECISIONS.md` |

---

## 3. The parts that are genuinely well built

Do not "simplify" these without reading the tests first. Each exists because of a real failure mode.

**Idempotency — writes are safe to repeat.** A kiosk on a flaky network, or a staff member double-clicking, must not create duplicates.
- `routes/sessions.ts` — a `requestKey` makes session creation repeatable; a repeat with the *same* answers returns the same session, a repeat with *different* answers is a `409`.
- `routes/purchaseEvents.ts` — catches Prisma `P2002` and returns the existing event with `replay: true` instead of erroring.

**Recommendation snapshots are frozen.** `routes/recommendations.ts` takes `pg_advisory_xact_lock(hashtext(sessionId))` inside a transaction, then returns the stored `recommendationSnapshot` if one exists. Two parallel requests can never produce two different lists for one shopper.

**The last unit can only be sold once.** Stock decrements are transactional; concurrent sales of the final piece are covered in `scripts/check-stage1.ts`.

**The scoring engine is pure.** `scoring/` takes a session and candidate products and returns ranked results with a score breakdown. No database, no clock, no randomness — which is why it has 208 lines of tests for 198 lines of code, and why it can later move to a shared package and run offline.

**Uploads are sniffed, not trusted.** `imageSniff.ts` checks magic bytes rather than the filename or the declared content type.

**Staff auth.** 64-hex random token, stored **hashed** (`sha256`), `httpOnly` + `SameSite=Strict` cookie, 8-hour expiry, `timingSafeEqual` PIN comparison, and an `x-fitfirst-request` header required on writes as CSRF protection.

---

## 4. Dependency rules

Enforced in review today; to be enforced by lint during S7-03/S7-04.

- `routes` → may use `services` and `lib`. **Never** Prisma directly *(not true yet — see Gap A)*.
- `services` → may use `repositories`, `scoring`, `lib`. **Never** Fastify types.
- `repositories` → may use Prisma and `lib`. **Never** `services` or `routes`.
- `scoring` → imports nothing from the app. Stays pure.
- Frontends → may import `packages/*`. `packages/*` never import an app.
- `dashboard` and `kiosk` → **never** import each other.

---

## 5. Known gaps, with task IDs

These are tracked, not forgotten. Each is a Stage 7 task.

### Gap A — No layering · S7-03
Every route file does HTTP parsing, validation, business rules and Prisma calls in one function. `routes/products.ts` is 298 lines, includes a hand-rolled CSV parser that cannot handle quoted newlines, and types one handler as `request: any`, which switches off type checking there.

### Gap B — No fixed API contract · S7-04
Five different success shapes are live:

| Endpoint | Returns |
|---|---|
| `GET /api/products` | a bare array |
| `POST /api/sessions` | `{ id }` |
| `POST /api/products/bulk` | `{ success, message, createdCount, updatedCount }` |
| `GET /api/scan-garment/health` | `{ aiServiceAvailable, ...spread }` |
| `GET /api/analytics/summary` | an ad-hoc object |

And three error shapes: `@fastify/sensible` helpers give `{ statusCode, error, message }`; the handler in `index.ts` gives `{ message }` only; `products.ts` bulk import gives `{ success: false, message, errors[] }`. **There are no stable error codes**, so the frontend cannot distinguish a duplicate SKU from a database outage without matching on English text. `dashboard/src/lib/api.ts` reads only `data.message` and `data.errors`, so it works by accident.

**Target:** `{ error: { code, message } }` with stable codes, and one envelope for success.

### Gap C — No shared types · S7-02
`schema.prisma` defines 7 enums (`Category`, `ColorFamily`, `Pattern`, `FitType`, `SkinToneBucket`, `BodyShapeBucket`, `Gender`). The frontends hand-retype them:

| Declared in | Type |
|---|---|
| `kiosk/src/utils/visionAnalyzer.ts:11` | `SkinToneBucket` |
| `kiosk/src/screens/AttributeEntry.tsx:5` | `SkinTone` — **the same enum, declared twice inside one app** |
| `kiosk/src/screens/GenderSelect.tsx:3` | `Gender` |
| `dashboard/src/pages/Inventory.tsx:75` | `Product` |
| `dashboard/src/pages/Sessions.tsx:16` | `Session`, `RecommendationItem` |

20 such declarations exist across the two apps, none linked to the backend. **Changing an enum in the schema breaks the frontends silently at runtime** — nothing fails to compile.

### Gap D — No pagination
Ten `findMany` calls have no `take`: `products.ts:34`, `sessions.ts:82`, `purchaseEvents.ts:37`, `baseline.ts:39`, `analytics.ts` (×5), `recommendations.ts:16`. Invisible at demo size; a failure at a real shop's catalogue. `ENGINEERING_STANDARDS.md` §9 already requires list limits.

### Gap E — Config is scattered
`process.env` is read at module scope in `index.ts` and inside routes, with no validation beyond the `DASHBOARD_PIN` format check. `dotenv` is loaded twice (`import "dotenv/config"` and `dotenv.config()`). Target: one validated `lib/config.ts` that fails fast on boot.

### Gap F — Frontend
- **Kiosk has no API client.** `const API = "/api"` is hardcoded inside `screens/Recommendations.tsx`.
- Dashboard's client returns a raw `Response`, so every caller re-does `.json()` untyped.
- Components far over the ~200-line guideline: `Inventory.tsx` **1,056**, `Sessions.tsx` 864, dashboard `App.tsx` 433, `Analytics.tsx` 429, kiosk `Recommendations.tsx` 402.
- **Zero frontend tests** (backend has 46, the AI service 50).

### Gap G — No generated API documentation
The endpoint table in `README.md` is hand-written and will drift from the code. There is no OpenAPI spec, so the only reliable way to learn a response shape is to read the route handler.

---

## 6. Security posture, stated plainly

| Area | Today |
|---|---|
| Staff auth | One **shared** 4-digit PIN. No user identities, no roles, no audit of who did what. |
| Kiosk routes | **No authentication and no rate limit.** `POST /api/sessions` and the recommendations route are open to anyone who can reach the server. Per-session access is guarded only by the `x-kiosk-key` request key. |
| Login throttle | 5 attempts per IP per 15 minutes — but held **in memory** (`authGuard.ts:28`), so it resets on restart and is per-process. |
| Uploads | Written to `backend/uploads/` and served **publicly** at `/uploads/...`. Anyone with the URL can read any uploaded photo. |
| Security headers | None. `helmet` is not installed. |
| API versioning | None. No `/v1/` prefix, so a response-shape change breaks any deployed kiosk. |
| Secrets | Environment only; `.env` git-ignored; keys rotated with spend caps 22 Oct (DEC-21). |
| Logs | Fastify logger redacts `cookie` and `authorization`. No request IDs. |

This is acceptable for a single-store pilot on a trusted network. **It is not acceptable for a second shop or any public deployment.**

---

## 7. The scale question

"Scale" here means two different things, in this order.

**1. Team scale — more people in the repo safely.** This is the current bottleneck and what Stage 7 addresses: layers, shared types, one API contract, lint and CI so two people can change different features without conflict.

**2. Shop scale — more than one store.** This is the larger risk, and it is **not yet decided**.

There is **no `storeId` or `orgId` on any of the 7 models**, and no store scoping in any query. "Ahmedabad Showroom" is hard-coded in the frontends. A second shop cannot exist.

The documents disagree about when to fix this:
- [MASTER_PLAN.md](MASTER_PLAN.md) §3.4: *"Tenancy is set from day one: `orgId`/`storeId` on every table"*, and §11 places it in **Phase 1** with the reason *"cheap now, costly later"*.
- [END_TO_END_CHECKLIST.md](END_TO_END_CHECKLIST.md) places it in **Stage 6 (S6-01)**.

Adding the column now is one migration and a query filter. Adding it after a pilot shop holds live inventory means backfilling every table, rewriting every query, re-indexing, and carrying data-migration risk on a paying customer. **This needs an owner decision (relates to D-06) before Stage 2 schema work begins.**

---

## 8. Conventions for new code

Full rules in [ENGINEERING_STANDARDS.md](ENGINEERING_STANDARDS.md). The short version:

- Validate `params`, `query` and `body` with `zod` at the route edge. Services receive valid, typed input.
- One error shape, stable codes, no string-matching on messages.
- `camelCase.ts` modules, `PascalCase.tsx` components, `*.test.ts` beside the code.
- No `any`; use `unknown` and narrow. No `console.log`, no dead or commented-out code.
- Any write a user can retry or double-click must be idempotent, with a test proving it.
- A bug fix ships with the test that fails on the old code.
- Schema changes go through a checked-in migration after `npm run db:backup`. **Never edit a shipped migration.**
- New routes are protected by default; opening one needs a stated reason.
- Adding a dependency, package or tool is an **owner decision**, not a refactor detail ([AGENTS.md](../AGENTS.md) §2).

## 9. Checks before you open a PR

```bash
npx prisma generate --schema backend/prisma/schema.prisma   # fresh checkout only
npm run build
npm test
npm run test:integration --workspace=backend                 # needs Postgres on 5434
npm run lint
npm run docs:check
```

One task ID per PR, named in the title. **A refactor PR changes structure only; a feature PR changes behaviour only.** Mixed PRs are rejected.
