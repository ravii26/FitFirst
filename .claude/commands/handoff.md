---
description: Update the living project docs and give the 3-line handoff
---

Run the handoff update for this session, exactly as defined in `AGENTS.md` §5.

1. Work out what actually changed in this session: code, decisions, findings, test results. If nothing changed, say "no doc update needed" and stop.

2. Update these files in one pass:
   - **`docs/PROJECT_STATUS.md`** — the last-updated date, current stage and focus, "Start here (the next three actions)", verified facts, "Noticed, not actioned", the progress table, and the decisions waiting on the owner.
   - **`docs/END_TO_END_CHECKLIST.md`** — re-mark the tasks touched, with the evidence and date. `[x]` only if Ravindra accepted it and a check was actually run; otherwise `[~]`. Keep the progress table in step with the boxes.
   - **`docs/DECISIONS.md`** — record any decision Ravindra made this session (date, choice, reasoning, what it unblocks), and add any new `OPEN` decision that came up.
   - **`docs/SESSION_LOG.md`** — one new row at the top: date · what changed · files · validation · next/decision needed.

3. Run `npm run docs:check` and fix anything it reports.

4. Finish with the 3-line handoff:
   - **Changed:** …
   - **Next:** task ID and what it needs
   - **Needs Ravindra:** the decision IDs waiting, or "nothing"

Rules: do not invent evidence, do not mark work complete that was not verified, and do not record a decision Ravindra did not actually make.
