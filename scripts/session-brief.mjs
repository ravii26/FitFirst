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
  Ravindra (owner) makes every product, architecture, commercial,
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

console.log(`WHEN YOU FINISH
  Update docs/PROJECT_STATUS.md, the checklist item, docs/DECISIONS.md
  (if anything was decided) and add a row to docs/SESSION_LOG.md.
  In Claude Code: /handoff   ·   Verify with: npm run docs:check
=============================================================`);
