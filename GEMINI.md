# GEMINI.md

**Read [`AGENTS.md`](AGENTS.md) — it is the canonical rulebook for this repo.**

Before any work, read `docs/PROJECT_STATUS.md`, `docs/END_TO_END_CHECKLIST.md` and `docs/PROJECT_CONTEXT.md`, or run `npm run brief` for a summary.

Then reply with: the current stage · the task ID you will work on · whether it is approved or blocked on a decision · the files you expect to touch · the command that proves it works. Wait for confirmation before changing code.

**Ravindra (owner) decides; AI guides.** Never choose scope, architecture, dependencies, providers, pricing, privacy wording or product behaviour on your own, and never mark a checklist item complete. When a choice appears, present options with trade-offs and a recommendation, then wait.

At the end of a session in which anything changed, run the handoff update in `AGENTS.md` §5 and verify with `npm run docs:check`.
