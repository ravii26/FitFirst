# Copilot instructions — FitFirst

Full rules: [`AGENTS.md`](../AGENTS.md). Read these three docs before suggesting work: `docs/PROJECT_STATUS.md`, `docs/END_TO_END_CHECKLIST.md`, `docs/PROJECT_CONTEXT.md`.

## What this project is

An in-store clothing recommendation system for independent Indian retailers: a customer kiosk (`kiosk/`, port 5174), a staff and owner dashboard (`dashboard/`, 5173), a Fastify + Prisma + PostgreSQL API (`backend/`, 3000), and an optional Python garment tagger (`backend/ai-service/`, 8000). It is a **single-store pilot prototype**, not production, not multi-tenant, and not a POS.

## How to work here

- **The human decides.** Propose options and a recommendation; never pick scope, architecture, dependencies, providers, pricing or privacy wording yourself.
- **One approved task at a time**, taken from the checklist by its ID (e.g. `S1-06`). Note unrelated problems instead of fixing them.
- **No claim without evidence.** Run the check; report the real result. Never mark a checklist item done on your own.
- **After meaningful work**, update `docs/PROJECT_STATUS.md`, the checklist item, `docs/DECISIONS.md` if a decision was made, and add a row to `docs/SESSION_LOG.md`.

## Conventions

- TypeScript with Zod validation in the backend; Prisma for all database access; Vitest for tests.
- React 18 with Vite in both frontends; the kiosk has no router (screens are a state machine in `kiosk/src/App.tsx`).
- Money values are rupees as integers today; the v2 plan moves to paise.
- Keep changes small and in the existing style. Add or update a focused test for behaviour changes.

## Gotchas

- Stock is per product, not per size, so a recommended size may be sold out.
- `daysInStock` never increments; "aged stock" is not real yet.
- The garment tagger silently falls back to CLIP and then to an aspect-ratio heuristic; invalid AI answers become the first enum value.
- `/uploads/...` is publicly readable; kiosk API routes have no auth or rate limit; staff auth is one shared PIN.
- Recommendation scores can exceed 1.0 and must never be shown as a match percentage.
- Demo and seed data are random; never present them as store evidence.

## Customer-facing language

Never use "fair", "wheatish" or "dark" for skin, and never promise "look fairer" or "look slimmer". Use neutral depth wording and fit goals. Do not state privacy or legal guarantees the code does not implement.
