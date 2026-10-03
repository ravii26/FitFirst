# FitFirst Engineering Standards

> How code is structured and written here, so several people can work in the same repo without stepping on each other. **Approved 3 Oct 2026 as option B (DEC-19): target structure plus a migration track, sequenced after D-03.**
>
> **Read this as a target, not a description.** The repo does not match it yet. Section 1 says exactly where it differs. New code follows this document; old code moves only through the Stage 7 tasks in [END_TO_END_CHECKLIST.md](END_TO_END_CHECKLIST.md).
>
> Where this file disagrees with [AGENTS.md](../AGENTS.md) on *who decides*, AGENTS.md wins. These standards never override the human-gated rule: adding a dependency, a package or a new layer is an owner decision.

## 1. Current state vs target

| Area | Today | Target |
|---|---|---|
| Workspaces | `backend`, `dashboard`, `kiosk` | Same, plus `packages/types` and `packages/ui` (S7-02, S7-05) |
| Backend logic | Route files hold HTTP, validation and Prisma calls together (`routes/sessions.ts`, `routes/products.ts`) | `routes → services → repositories` (S7-03) |
| Validation / errors / logs / config | Per route; `zod` is installed but there is no shared convention | One shared module for each (S7-04) |
| Shared types | None shared; the apps appear to declare their own API shapes (S7-02 confirms and counts them) | One `packages/types` imported by all three (S7-02) |
| Shared UI | None shared; duplication between dashboard and kiosk is unmeasured (S7-05 audits it first) | `packages/ui` for what both apps really use (S7-05) |
| Frontend layout | Flat `pages/` and `screens/` | Feature folders (S7-06) |
| Lint / format / CI | Added by S7-01 (3 Oct 2026): ESLint, Prettier, CI workflow; the repo is not yet reformatted | Format check in CI after the one-time `npm run format` |
| Tests | Co-located `*.test.ts` in the backend (vitest); integration script `check-stage1.ts`; Python tests in `ai-service` | Keep. Add frontend tests with the S7-05/06 moves |

Strict TypeScript is already on in `backend/tsconfig.json`; keep it on everywhere.

## 2. Repository layout (target)

```
backend/
  src/
    routes/          HTTP only: parse request, call a service, shape the reply
    services/        business rules; no Fastify types, no direct Prisma
    repositories/    all Prisma access; one file per aggregate
    scoring/         recommendation engine (already pure and tested — keep it pure)
    lib/             validation, errors, logger, config, small helpers
    index.ts         wiring only
  prisma/            schema and migrations (never edit a shipped migration)
  ai-service/        Python garment tagger (separate runtime, own tests)
dashboard/src/
  features/<name>/   one folder per feature: components, hooks, api calls, tests
  lib/               api client, small helpers
kiosk/src/
  features/<name>/   same shape; the screen state machine stays in App.tsx
packages/
  types/             API request/response types and enums shared by all apps
  ui/                presentational components and hooks used by 2+ apps
docs/
```

**Dependency direction (enforce in review, then in lint):**

- `routes` may import `services` and `lib`. Never `repositories` or Prisma.
- `services` may import `repositories`, `scoring` and `lib`. Never Fastify.
- `repositories` may import Prisma and `lib`. Never `services` or `routes`.
- `scoring` imports nothing from the app. It stays a pure function of its inputs.
- Frontends may import `packages/*`. `packages/*` never import an app.
- `dashboard` and `kiosk` never import each other.

## 3. Shared code: when and where

- **Extract on the second real use**, not before. One use stays where it is. Two uses in different apps go to `packages/`. Do not build a component "in case".
- **`packages/types`** holds what crosses the wire: request/response shapes, enums, error codes. No logic, no runtime dependencies beyond `zod` schemas if S7-02 adopts them.
- **`packages/ui`** holds presentational components (buttons, inputs, cards, tables, the idle/lock overlays) and hooks with no app knowledge. Anything that calls the API or knows a business rule stays in the app's feature folder.
- Shared components take data and callbacks as props, have typed props, and ship with one test each.
- Adding a package, a build tool or a UI library is a `DECISION NEEDED`, not a refactor detail.

## 4. Backend conventions

- **Validation:** every route validates `params`, `query` and `body` with `zod` at the edge. Services receive typed, already-valid input.
- **Errors:** one error shape for the whole API, `{ error: { code, message } }`, with stable `code` strings the frontends can switch on. Services throw typed errors; one handler maps them to HTTP status. No string-matching on messages.
- **Logging:** structured (Fastify's logger), one line per request, a request ID, and never a PIN, token, API key, photo or personal field. Customer data is logged by ID only.
- **Config:** read environment variables in one `lib/config.ts`, validate on boot, fail fast with a clear message. No `process.env` anywhere else. Never print `.env` values.
- **Database:** schema changes go through a checked-in migration, after `npm run db:backup`. Multi-row writes use a transaction. Queries that serve a list have a limit.
- **Idempotency:** any write a user can double-click or retry (sales, session creation) must be safe to repeat. Keep the existing tests that prove this.
- **Auth:** the staff guard lives in one place (`authGuard.ts`). New routes are protected by default; opening one needs a reason in the PR.

## 5. Frontend conventions

- **Size:** a component over about 200 lines is a candidate to split. Pages and screens compose; they do not contain business rules.
- **State:** local state first. Server data goes through the API client in `lib/api.ts` (typed with `packages/types`). Add a data-fetching library only through a decision.
- **API access:** components never call `fetch` directly. One client handles the base URL, the staff cookie, error mapping and timeouts.
- **Kiosk:** the screen state machine in `App.tsx` stays the single source of navigation. Every screen handles the idle reset and Edit preferences consistently (see DEC-18).
- **Accessibility and copy:** labels on every control, visible focus, contrast that holds in shop lighting. Customer-visible text follows [AGENTS.md](../AGENTS.md) §9 and is kept in one place per feature so Stage 3 translation is possible.
- **Styling:** use the CSS variables already defined; never reference one that is not defined (the Inventory highlight bug in PROJECT_STATUS "Noticed" is exactly that).

## 6. Naming and code style

- Files: `camelCase.ts` for modules, `PascalCase.tsx` for components, `*.test.ts(x)` beside the code.
- One exported component per file. Hooks start with `use`. Types and interfaces are `PascalCase`; no `I` prefix.
- No `any`. Use `unknown` and narrow. A `// @ts-expect-error` needs a reason on the same line.
- Prefer small pure functions. Side effects (network, database, clock, randomness) sit at the edges so the middle is testable.
- Comments explain *why*, not *what*. Match the density of the surrounding code.
- No dead code, no commented-out code, no `console.log` left behind.
- Prettier formats, ESLint checks; `npm run lint` and `npm run format` are the root commands. Do not argue style in review.

## 7. Testing

- **Unit:** every service rule and every scoring change has a test. The scoring engine already has them; keep that bar.
- **Integration:** `npm run test:integration --workspace=backend` runs against a disposable Postgres schema. Anything touching stock, sales or sessions adds a case there.
- **Frontend:** new shared components get a render test. Flows that matter (kiosk path to handoff, sale logging) keep a browser check recorded in `STAGE_1_TEST_GUIDE.md` until automated.
- **AI service:** `python -m pytest -q` in `backend/ai-service`. Gateway calls are mocked; a live call is a manual, recorded check.
- A bug fix adds the test that fails on the old code.
- A claim that something works needs recorded evidence, per [AGENTS.md](../AGENTS.md) §4.

## 8. Git, review and CI

- One task ID per branch or PR, named in the title (`S7-03: ...`).
- Small PRs: one concern, behaviour changes separate from moves. **A refactor PR changes structure only; a feature PR changes behaviour only.** Mixed PRs are rejected.
- Never commit secrets, `AI Creation/`, `.env` files or uploaded images (`backend/uploads/`).
- CI (`.github/workflows/ci.yml`, from S7-01) runs on every PR: install, `prisma generate`, `build` for all workspaces, `test`, `lint` and `npm run docs:check -- --strict`. A red CI blocks merge. It uses `npm install` because `package-lock.json` is git-ignored. The format check joins CI after the one-time `npm run format`, which waits until the uncommitted work is committed.
- PR checklist: task ID · decision reference · files · validation command and real output · known limitation · docs updated (status, checklist, log).

## 9. Production readiness (what "scalable" has to mean here)

Scale for FitFirst is first more *people* working safely, then more *shops*. In that order:

1. **Team scale:** layers, shared packages, lint and CI so two people can change different features without conflicts.
2. **Data scale:** every query indexed for its filter; list endpoints paginated; tenant (store) identifiers added in Stage 6 (S6-01), so keep store-agnostic code out of services now.
3. **Operations:** health endpoints, structured logs, backups and a tested restore, config by environment (Stage 4: deployment, D-13).
4. **Security and privacy:** secrets only in environment, least privilege, consent and retention rules (DPDP, 13 May 2027).

Do not add queues, caches, microservices or Kubernetes for a single-store pilot. Add them when a measured problem calls for it, through a decision.

## 10. How a Stage 7 task runs

1. State the task ID, the files, and the check command (boot sequence, [AGENTS.md](../AGENTS.md) §1).
2. If the task adds a dependency, package or tool, present a `DECISION NEEDED` first and wait.
3. Make the structural change only. No behaviour change.
4. Run `npm run build`, `npm test`, and the integration check where relevant. Real output goes in the PR and session log.
5. Update the docs in the same change. Only Ravindra marks the item `[x]`.

**Sequencing:** only S7-01 may start before D-03. S7-02 to S7-06 stay `[?]` until Ravindra accepts Stage 1 (D-03), and also need the working tree committed first, because they touch files with uncommitted edits.
