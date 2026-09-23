# FitFirst — In-Store Recommendation Kiosk

**Sell the right item, every time.**

## AI / Contributor Handoff

For a portable project handoff across Copilot, Claude Code, Codex or another AI assistant, start with:

1. [Project context](docs/PROJECT_CONTEXT.md) — product, repo map, commands, glossary, landmines
2. [Current project status](docs/PROJECT_STATUS.md) — where we are, what's next, what needs a decision
3. [End-to-end checklist](docs/END_TO_END_CHECKLIST.md) — every task, with stable IDs

Supporting documents:

- [AGENTS.md](AGENTS.md) — **the rules for AI assistants** (also wired up as `CLAUDE.md` and `.github/copilot-instructions.md`)
- [docs/DECISIONS.md](docs/DECISIONS.md) — every choice, who made it and when; open decisions waiting on the owner
- [docs/SESSION_LOG.md](docs/SESSION_LOG.md) — what happened in each working session
- [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) — the full product and architecture direction

**How this project is run:** the owner makes every product, architecture, commercial, privacy and UX decision; AI assistants research, lay out options, implement approved tasks and verify them. The status, checklist, decisions and session log are living documents, updated at the end of every working session. Nothing is marked complete without recorded evidence.

An in-store recommendation kiosk for independent clothing retailers. A customer enters their size, style preferences, skin tone, and body shape. The system recommends specific, real items from the store's current inventory — ranked by fit, not just inventory pressure.

---

## Monorepo Structure

```
FitFirst/
├── backend/      Fastify + Prisma + PostgreSQL API (port 3000)
├── dashboard/    React staff dashboard (port 5173)
└── kiosk/        React customer kiosk (port 5174)
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker (for Postgres) OR a local PostgreSQL install
- npm 10+

### 1. Clone & Install

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example backend/.env
```

Edit `backend/.env` — set `DATABASE_URL` if not using Docker defaults.

### 3. Start Postgres

```bash
docker-compose up -d
```

Or if using a local Postgres, ensure it's running and the `DATABASE_URL` in `backend/.env` is correct.

### 4. Migrate & Seed Database

```bash
cd backend
npx prisma generate
npm run db:deploy
# Optional: demo data ONLY in a separate, empty development database
# FITFIRST_DEMO_SEED=1 npm run db:seed
cd ..
```

### 5. Run All Three Apps

```bash
npm run dev
```

Opens:
- Backend API: http://localhost:3000
- Staff Dashboard: http://localhost:5173 (use the PIN configured in backend/.env)
- Customer Kiosk: http://localhost:5174

---

## Backend API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create customer session |
| GET | `/api/sessions/:id` | Get session with recommendations + purchases |
| GET | `/api/sessions` | List recent sessions |
| GET | `/api/sessions/:id/recommendations` | Run scoring engine, return ranked products |
| POST | `/api/purchase-events` | Log a purchase |
| GET | `/api/purchase-events` | List recent purchases |
| GET/POST/PUT | `/api/products` | Inventory CRUD |
| PATCH | `/api/products/:id/stock` | Quick stock update |
| DELETE | `/api/products/:id` | Soft-deactivate product |
| POST | `/api/baseline` | Log daily baseline sales entry |
| GET | `/api/baseline` | List all baseline entries |
| GET | `/api/analytics/summary` | Full dashboard metrics + pilot verdict |
| GET | `/api/analytics/baseline-chart` | Chart data |
| GET | `/api/analytics/top-recommendations` | Most recommended products |
| GET | `/api/analytics/slow-stock` | Items >30 days in stock |
| GET | `/health` | Health check |

---

## Scoring Engine

The Phase 1 scoring engine is fully deterministic — no ML, no black box.

**Formula:**
```
colorScore × 0.40   (skin tone → color family compatibility)
fitScore   × 0.40   (body shape → fit type compatibility)
prefBoost  × 0.20   (customer preference tag match)
agingBoost ≤ 0.10   (tiebreak for slow-moving stock, applied AFTER threshold check)
```

**Hard gates:**
- Product must be active + in stock + in customer's size
- `baseScore` must be ≥ 0.55 before aging boost is applied
- Gender must match (or product must be UNISEX)

All lookup tables are in [`backend/src/scoring/tables.ts`](backend/src/scoring/tables.ts). Every weight is documented and tunable based on real conversion data.

**Run tests:**
```bash
cd backend && npm test
```

---

## Phase Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Baseline data capture + kill-threshold framework | ✅ Built |
| 1 | Rules-based recommendation MVP (this build) | ✅ Built |
| 2 | Camera scan (MediaPipe — skin tone + body shape) | ⏳ Gated on Phase 1 exit |
| 3 | CLIP auto-tagging for inventory | ⏳ Gated on Phase 2 exit |
| 4 | Multi-store scale + BullMQ jobs | ⏳ Gated on Phase 3 exit |

**Phase 2 gate:** Compare kiosk-period metrics vs baseline against kill threshold. Don't proceed on hope.

---

## Pilot Setup Checklist

- [ ] Install Docker, start Postgres (`docker-compose up -d`)
- [ ] Run migrations + seed
- [ ] Open staff dashboard, log 14 days of baseline sales before going live
- [ ] Confirm kill threshold with store owner (Analytics page → currently 15% basket lift, 30% conversion)
- [ ] Place kiosk tablet in store, open `http://[your-ip]:5174` in Chrome
- [ ] Enable Chrome kiosk mode: `chrome --kiosk http://localhost:5174`
- [ ] Train staff: sessions log + how to look up a session code

---

## Legal (Phase 1)

- No biometric data is stored — skin tone and body shape are derived categories, not raw photos.
- Privacy notice is shown before any attribute entry.
- Customer can decline and be served manually.
- For Phase 2 (camera) deployment beyond the family store: formal legal consultation on DPDP Act obligations is required before go-live.

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://fitfirst:fitfirst_dev@localhost:5432/fitfirst` | Postgres connection |
| `PORT` | `3000` | Backend API port |
| `KIOSK_URL` | `http://localhost:5174` | CORS whitelist |
| `DASHBOARD_URL` | `http://localhost:5173` | CORS whitelist |
| `DASHBOARD_PIN` | `1234` | Staff dashboard PIN |

---

*Built by Ravi · Ahmedabad, India · Phase 1 MVP*

## Stage 1 testing

See [STAGE_1_TEST_GUIDE.md](STAGE_1_TEST_GUIDE.md) for the current checkpoint. Staff authentication uses a server-issued HttpOnly cookie; no frontend PIN configuration is needed. The backend loads `backend/.env` before creating its database client.

Run `npm test` and `npm run build` from the project root. Run `npm run test:integration --workspace=backend` for PostgreSQL concurrency and rollback checks; this creates and removes a separate temporary schema in the configured database. Run `npm run db:backup --workspace=backend` to create a private local pg_dump backup (requires PostgreSQL command-line tools). Keep backups outside this repository.

The demo seed refuses production and nonempty databases. Its generated figures are demonstration data, not evidence of store performance. Do not run `db:reset` on a store database.
