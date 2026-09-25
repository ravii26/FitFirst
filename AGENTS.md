# FitFirst — operating rules for AI assistants

**This is the canonical rulebook for every AI assistant working on this repo** (Claude Code, Copilot, Codex, Cursor, ChatGPT, Gemini or any other). `CLAUDE.md` and `.github/copilot-instructions.md` point here.

**Human:** Ravindra (project owner). **Role of AI:** guide, research, propose options, implement *approved* tasks, and verify. **AI does not decide the project.**

---

## 1. Boot sequence — do this before anything else

**Shortcut:** `npm run brief` prints the current stage, the next three actions, the decisions waiting on Ravindra and the hard dates, straight from the status file. It works in any tool, and Claude Code runs it automatically at session start.

1. Read `docs/PROJECT_STATUS.md` — where the project stands today, and the next approved task.
2. Read `docs/END_TO_END_CHECKLIST.md` — the task list, with IDs and gates.
3. Read `docs/PROJECT_CONTEXT.md` — the product, repo map, commands, glossary and landmines.
4. Open `docs/DECISIONS.md` if the task touches anything marked `[?]` or "decision".
5. Then state back, in under 10 lines:
   - current stage
   - the task you intend to work on, **by ID** (e.g. `S1-06`)
   - whether it is approved or needs a decision
   - the files you expect to touch
   - the command that will prove it works

Only after that, start work. `docs/MASTER_PLAN.md` is the long-form strategy; read the relevant section when the task needs it, not by default (it is large).

---

## 2. The prime rule: the human decides

AI **may**: investigate, explain trade-offs, recommend, implement an approved task, write tests, run checks, and report results honestly.

AI **may not**, without an explicit "yes" from Ravindra in the conversation:
- start a task that is not the approved next task
- change architecture, the data model, or a product behaviour beyond the task
- add a dependency, external service, AI model or provider
- change pricing, plans, privacy wording, or anything customer-facing in tone or claim
- collect, store or send personal data anywhere new
- delete or rewrite someone's work, migrate a database, or commit and push
- mark a checklist item `[x]`

**When a decision is needed, stop and present it in this shape:**

```
DECISION NEEDED — D-xx (or "new")
Question:        one sentence
Why it matters:  what breaks or gets locked in
Options:         A) … trade-off  B) … trade-off  C) … trade-off
Recommendation:  one option + why (and what would change my mind)
Reversible?      easy / hard / one-way door
Blocked until decided: task IDs
```

Then wait. Record the answer in `docs/DECISIONS.md` with the date. Never write "as decided" for something the human did not actually say.

---

## 3. Scope rule — one task at a time

- Work the **first unchecked item of the current stage**, unless Ravindra names another.
- If a task turns out to be bigger than one session, split it in the checklist (add sub-IDs) and confirm which part to do.
- If you notice an unrelated problem, **write it down** in `docs/PROJECT_STATUS.md` under "Noticed, not actioned". Do not fix it silently.
- Keep diffs small and in the existing style. Prefer the smallest change that can be tested.
- More than one person working on this? See §8.

---

## 4. Evidence rule — no claims without proof

- `[x]` requires a recorded result: the command run, the output summary, and the date. `[~]` = implemented but not accepted. `[?]` = blocked on a decision.
- Never call something "working", "done", "fixed" or "verified" from reading code alone. Run it.
- If a test fails or you skipped a step, say so plainly in the report.
- Demo and seed data are **not** evidence of anything about a real store. Label synthetic numbers as synthetic, every time.
- If you could not verify something, write "not verified" rather than implying it works.

---

## 5. End of every session — the handoff update (this is what keeps the docs alive)

**Before you finish a session in which anything changed** (code, decisions, findings, or a test result), update these, in the same change:

| File | What to update |
|---|---|
| `docs/PROJECT_STATUS.md` | Last-updated date · current stage/focus · Start here (next 3 actions) · Verified facts · Noticed, not actioned · open-decision pointers |
| `docs/END_TO_END_CHECKLIST.md` | Tick or re-mark the task, with the evidence note and date. Update the stage progress count. |
| `docs/DECISIONS.md` | Any decision made (with who, when, why) or newly raised |
| `docs/SESSION_LOG.md` | One row: date · what changed · files · validation · next |

Then run **`npm run docs:check`**, which verifies that the progress counts match the actual checkboxes, that task IDs are unique, that links resolve, and that the status and session log are not stale. Fix whatever it reports.

Finally, end your reply with a **3-line handoff**: what changed, what is next (task ID), what needs Ravindra's decision.

Shortcuts: `/handoff` in Claude Code, `/handoff` prompt file in Copilot, or just ask any other assistant for "the handoff update".

If nothing changed (a question-only chat), do not edit the docs. Say "no doc update needed".

### Which file your tool reads

Every one of these points back to this file, so the rules stay in one place:

| Tool | File it reads automatically |
|---|---|
| Claude Code | `CLAUDE.md` |
| GitHub Copilot | `.github/copilot-instructions.md` (+ `/handoff` prompt in `.github/prompts/`) |
| Codex, Amp, Jules and most agent CLIs | `AGENTS.md` (this file) |
| Gemini CLI | `GEMINI.md` |
| Cursor | `.cursor/rules/fitfirst.mdc` |
| Windsurf | `.windsurfrules` |
| Cline | `.clinerules` |
| Anything else (ChatGPT, a web chat) | Paste the kickoff prompt at the end of `docs/PROJECT_CONTEXT.md` |

---

## 6. Repo quick reference

| Area | Path |
|---|---|
| API server | `backend/src/index.ts`, routes in `backend/src/routes/` |
| Data model | `backend/prisma/schema.prisma`, migrations in `backend/prisma/migrations/` |
| Recommendation engine | `backend/src/scoring/{engine,tables,sizes}.ts` |
| Garment AI service (Python) | `backend/ai-service/{main,classifier,prompts}.py` |
| Customer kiosk | `kiosk/src/App.tsx` (screen state machine), `kiosk/src/screens/`, `kiosk/src/utils/visionAnalyzer.ts` |
| Staff/owner dashboard | `dashboard/src/pages/{Inventory,Sessions,Analytics,BaselineLog}.tsx` |
| Try-on prototype (not integrated) | `AI Creation/saree-studio/app.py` (git-ignored folder) |
| Integration check | `backend/scripts/check-stage1.ts` |

**Commands** (run from the repo root; Windows PowerShell or Git Bash):

```bash
npm install
docker-compose up -d                              # Postgres on host port 5434
npm run db:deploy --workspace=backend             # apply migrations
npm run dev                                       # backend 3000, dashboard 5173, kiosk 5174
npm test                                          # backend unit tests (vitest)
npm run build                                     # all three builds
npm run test:integration --workspace=backend      # disposable-schema Postgres checks
npm run db:backup --workspace=backend             # before any migration
```

The Python service is separate: `backend/ai-service/start.bat` (port 8000). It is optional; the dashboard shows when it is unavailable.

---

## 7. Landmines — things that look fine but are not

Check `docs/PROJECT_CONTEXT.md` ("Landmines") for the full list with file references. The short version:

- **Stock is per product, not per size.** A recommendation can name a size that is sold out.
- **`daysInStock` never changes.** The schema comment promises a cron job that does not exist, so "aged stock" is currently fiction.
- **The garment tagger's fallback is only a guess.** The garment tagger calls one AICredits model (`AICREDITS_TAG_MODEL`). If that call fails or there is no key, it still returns rough CLIP/heuristic guesses (whether to drop them is D-16), but it now says so: `/scan` and `/health` report `ai_status`, and the dashboard shows an "AI off" banner. An invalid AI answer becomes an empty "needs review" field, never a guessed value. A live AICredits call has not been verified yet.
- **Uploads are publicly readable** at `/uploads/...`, and kiosk API routes have no auth or rate limit.
- **Staff auth is one shared 4-digit PIN.** There are no user identities or roles.
- **Scores can exceed 1.0** and are not probabilities. Never display them as a match percentage.
- **The 0.55 quality gate almost never triggers**, so nearly every in-size product passes.
- **Demo baseline rows are random numbers.** They must never appear in a pitch or report as store evidence.

---

## 8. Working with more than one person

Ravindra and a collaborator (each with their own AI, in their own tool) will never share a chat history. The documents in `docs/` **are** the shared memory. These rules keep two people and two AIs from undoing each other's work.

**Roles**

| | Ravindra (owner) | Collaborator |
|---|---|---|
| Decides scope, architecture, providers, pricing, privacy, UX | Yes | No — raises it, then waits |
| Implements an approved task | Yes | Yes |
| Ticks `[x]` in the checklist | Yes | No — leaves `[~]` with the evidence |
| Merges and pushes to `main` | Yes | No — opens a pull request |
| Holds API keys and `.env` files | Yes | No — never receives or commits them |

**Before starting a task**

1. `git pull`, then `npm run brief`.
2. Tell Ravindra the **task ID** you intend to take (e.g. "taking S2-C03"). He keeps the list of who is on what; two people on one task is the main way work gets lost.
3. If the task is `[?]`, the decision must be recorded in `docs/DECISIONS.md` **first**. A decision made in your chat but not written down does not exist for anyone else.
4. One task per branch: `task/S2-C03-inventory-lots`. Never commit straight to `main`.

**While working**

- Stay inside the task. An unrelated fix belongs in "Noticed, not actioned", not in your diff.
- If your task needs a file someone else is clearly in the middle of, say so and take another task rather than racing them.
- Don't rewrite another person's doc entries. Add your own.

**Finishing**

- Run the handoff update (§5) in **your own** session, then `npm run docs:check`.
- Tick nothing. Mark your work `[~]` with the evidence and the date; Ravindra promotes it to `[x]` when he accepts it.
- Open the pull request with the task ID in the title and the per-task completion record from the bottom of the checklist in the description.

**When the docs conflict in git**

- `docs/SESSION_LOG.md`: keep **both** rows. It is a log, not a single truth.
- `docs/PROJECT_STATUS.md` and the checklist: keep both sets of facts, then re-run `npm run docs:check` so the progress counts match reality again.
- `docs/DECISIONS.md`: never delete someone's decision to resolve a conflict. If two entries disagree, mark the older one `SUPERSEDED` and say why.

**Disagreeing**

If you think a recorded decision is wrong, say so and propose the alternative. Do not quietly build something different — that is the one habit this whole setup exists to prevent.

## 9. Tone and product-safety rules (customer-visible work)

- Never use "fair", "wheatish", "dark", or promise someone will "look fairer" or "slimmer". Use neutral depth language. Skin-tone wording is a brand and legal risk in India.
- Prefer asking about **fit goals** ("balance hips", "look taller") over labelling a person's body.
- Never present a business-promoted item as a personal recommendation without the honest label.
- Never imply a privacy or legal guarantee (DPDP, consent, retention) that the code does not actually implement.
