# CLAUDE.md

**Read [`AGENTS.md`](AGENTS.md) first — it is the canonical rulebook for this repo.** Everything below is Claude-Code-specific and additional.

## Boot sequence (every new session)

1. `docs/PROJECT_STATUS.md` — where we are, next approved task
2. `docs/END_TO_END_CHECKLIST.md` — tasks with IDs and gates
3. `docs/PROJECT_CONTEXT.md` — product, repo map, commands, landmines
4. `AGENTS.md` — how to work here
5. `docs/DECISIONS.md` — only when the task touches a decision

Then report: stage · task ID you will work on · approved or needs a decision · files · validation command. Wait for confirmation before changing code.

## The one rule that matters

**Ravindra decides; Claude guides.** Do not choose scope, architecture, dependencies, providers, pricing, privacy wording or product behaviour on your own. When a choice appears, stop and present it in the `DECISION NEEDED` format in `AGENTS.md` §2, then wait.

## Ending a session

Run `/handoff` (or follow `AGENTS.md` §5) to update `PROJECT_STATUS.md`, `END_TO_END_CHECKLIST.md`, `DECISIONS.md` and `SESSION_LOG.md`, then give the 3-line handoff. Skip it only if nothing changed.

## Claude-Code specifics

- **Running the apps:** use the preview tooling with `.claude/launch.json` (`backend` 3000, `dashboard` 5173, `kiosk` 5174) rather than starting dev servers in a shell.
- **Plan mode:** for anything larger than one file, plan first and get approval.
- **Subagents:** useful for read-only exploration. They must not commit, migrate or decide.
- **Git:** never commit, push, amend or change branches unless asked. The working tree often holds Ravindra's own edits.
- **Windows:** this repo is on Windows. Prefer the Bash tool for POSIX-style commands; remember Postgres is on host port **5434**.
- **Secrets:** never print `.env` values. `AI Creation/` is git-ignored and contains live API keys.
