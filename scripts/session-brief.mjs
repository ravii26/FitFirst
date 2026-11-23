#!/usr/bin/env node
/**
 * Prints the current FitFirst project brief.
 *
 *   npm run brief
 *
 * Works in any tool: run it at the start of a chat (Claude Code does it
 * automatically via .claude/settings.json), or paste its output into
 * Copilot, Codex, Cursor, ChatGPT or anything else.
 *
 * Source of truth: docs/PROJECT_STATUS.md. No dependencies.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const statusPath = join(root, 'docs', 'PROJECT_STATUS.md');

/** Return the body under a "## Heading" until the next "## ". */
function section(md, headingStartsWith) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex(
    (l) => l.startsWith('## ') && l.slice(3).toLowerCase().startsWith(headingStartsWith.toLowerCase()),
  );
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith('## '));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();
}

if (!existsSync(statusPath)) {
  console.error('FitFirst: docs/PROJECT_STATUS.md not found. Are you in the repo root?');
  process.exit(1);
}

const md = readFileSync(statusPath, 'utf8');

console.log(`
=============================================================
 FitFirst — project brief (from docs/PROJECT_STATUS.md)
=============================================================

HOW THIS PROJECT IS RUN
  The owners, Ravindra and Het Thakkar (equal authority; Ravindra
  breaks ties, DEC-34), make every product, architecture, commercial,
  privacy and UX decision. AI researches, lays out options with
  trade-offs, recommends one, and waits. AI never marks work complete.
  Full rules: AGENTS.md

BEFORE YOU START
  1. docs/PROJECT_STATUS.md        where we are, what's next
  2. docs/END_TO_END_CHECKLIST.md  tasks with IDs (e.g. S1-06)
  3. docs/PROJECT_CONTEXT.md       repo map, commands, landmines
  Then say: stage, task ID, approved or needs a decision, files, check command.
`);

for (const [label, heading] of [
  ['RIGHT NOW', 'Right now'],
  ['START HERE', 'Start here'],
  ['DECISIONS WAITING ON THE OWNER', 'Decisions waiting'],
  ['HARD DATES', 'Hard dates'],
]) {
  const body = section(md, heading);
  if (body) console.log(`${label}\n${body}\n`);
}

// ── Work split (DEC-41): each owner's next task ───────────────────────────
const checklistPath = join(root, 'docs', 'END_TO_END_CHECKLIST.md');
const TASK_ID = /\b(SP-\d+|S\d+(?:\.\d+)?-[A-Z]?\d+[a-z]?)\b/g;

/** Who is running this: FITFIRST_USER, else git's user.name. */
function currentOwner() {
  let name = process.env.FITFIRST_USER || '';
  if (!name) {
    try {
      name = execFileSync('git', ['config', 'user.name'], { cwd: root, encoding: 'utf8' }).trim();
    } catch {
      name = '';
    }
  }
  if (/het/i.test(name)) return 'Het';
  if (/ravindra/i.test(name)) return 'Ravindra';
  return null;
}

/** Ordered queues from the "Work split" table, plus each task's checkbox and title. */
function workSplit(checklistMd) {
  const body = section(checklistMd, 'Work split');
  if (!body) return null;
  const queues = { Ravindra: [], Het: [] };
  const alongside = { Ravindra: [], Het: [] };
  let joint = [];
  for (const line of body.split(/\r?\n/)) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 4 || /^-+$/.test(cells[1]) || cells[1] === 'Order') continue;
    const ids = (cell) => cell.match(TASK_ID) ?? [];
    if (/^\d+$/.test(cells[1])) {
      queues.Ravindra.push(...ids(cells[2]).slice(0, 1));
      queues.Het.push(...ids(cells[3]).slice(0, 1));
    } else if (/^alongside$/i.test(cells[1])) {
      alongside.Ravindra = ids(cells[2]);
      alongside.Het = ids(cells[3]);
    } else if (/^joint$/i.test(cells[1])) {
      joint = ids(cells[2]);
    }
  }
  const tasks = new Map();
  for (const line of checklistMd.split(/\r?\n/)) {
    const m = line.match(/^-\s+\[([x~?\s])\]\s+\*\*(SP-\d+|S\d+(?:\.\d+)?-[A-Z]?\d+[a-z]?)\b[^*]*\*\*\s*(.*)$/i);
    if (m) tasks.set(m[2], { mark: m[1].toLowerCase(), title: m[3].replace(/\s+—.*$/, '').replace(/\*/g, '') });
  }
  return { queues, alongside, joint, tasks };
}

function describe(split, id) {
  const t = split.tasks.get(id);
  if (!t) return `${id}  (not found in the checklist)`;
  const mark = { x: 'done', '~': 'started or awaiting acceptance', '?': 'blocked on a decision', ' ': 'not started' }[t.mark];
  const title = t.title.length > 70 ? `${t.title.slice(0, 67)}…` : t.title;
  return `${id}  ${title}  [${mark}]`;
}

const notDone = (split) => (id) => split.tasks.get(id)?.mark !== 'x';

if (existsSync(checklistPath)) {
  const split = workSplit(readFileSync(checklistPath, 'utf8'));
  if (split) {
    const me = currentOwner();
    const owners = me ? [me, me === 'Ravindra' ? 'Het' : 'Ravindra'] : ['Ravindra', 'Het'];
    const lines = ['YOUR WORK (split agreed in DEC-41; never start the other owner\'s task without their OK)'];
    if (!me) lines.push('  (could not tell who you are: set git user.name, or FITFIRST_USER=Ravindra / Het)');
    for (const [i, owner] of owners.entries()) {
      const open = split.queues[owner].filter(notDone(split));
      const label = me && i === 0 ? `${owner} (you)` : owner;
      if (me && i === 1) {
        lines.push(`  ${label}'s next: ${open[0] ? describe(split, open[0]) : 'queue finished'}`);
        continue;
      }
      lines.push(`  ${label}, next task: ${open[0] ? describe(split, open[0]) : 'queue finished; take an unassigned Stage 3 or Stage 0 task and tell the other owner'}`);
      if (open.length > 1) lines.push(`    then: ${open.slice(1, 4).join(', ')}`);
      const side = split.alongside[owner].filter(notDone(split));
      if (side.length) lines.push(`    alongside: ${side.join(', ')}`);
    }
    const joint = split.joint.filter(notDone(split));
    if (joint.length) lines.push(`  Together: ${joint.join(', ')}`);
    console.log(`${lines.join('\n')}\n`);
  }
}

console.log(`WHEN YOU FINISH
  Update docs/PROJECT_STATUS.md, the checklist item, docs/DECISIONS.md
  (if anything was decided) and add a row to docs/SESSION_LOG.md.
  In Claude Code: /handoff   ·   Verify with: npm run docs:check
=============================================================`);
