---
mode: agent
description: Update the FitFirst living docs and give the 3-line handoff
---

Run the handoff update for this session, as defined in `AGENTS.md` §5.

1. Identify what actually changed: code, decisions, findings, test results. If nothing changed, reply "no doc update needed" and stop.
2. Update, in one pass:
   - `docs/PROJECT_STATUS.md` — last-updated date, stage and focus, "Start here (the next three actions)", verified facts, "Noticed, not actioned", progress table, decisions waiting on the owner.
   - `docs/END_TO_END_CHECKLIST.md` — re-mark the tasks touched with evidence and date. `[x]` only when the owner accepted it and a check was run; otherwise `[~]`. Keep the progress table in step.
   - `docs/DECISIONS.md` — any decision the owner made (date, choice, reasoning, what it unblocks), and any new open decision.
   - `docs/SESSION_LOG.md` — one new row at the top: date · what changed · files · validation · next.
3. Run `npm run docs:check` and fix what it reports.
4. End with: **Changed** / **Next** (task ID) / **Needs Ravindra** (decision IDs or "nothing").

Never invent evidence, never mark unverified work complete, and never record a decision the owner did not make.
