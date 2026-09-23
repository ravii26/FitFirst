#!/usr/bin/env node
/**
 * Checks that the living project docs are consistent and fresh.
 *
 *   npm run docs:check            errors fail, staleness only warns
 *   npm run docs:check -- --strict   warnings fail too (use in CI)
 *
 * Checks:
 *   1. Every task ID in the checklist is unique and well formed.
 *   2. The progress tables in the checklist and in the status file match
 *      the actual checkbox counts per stage.
 *   3. Relative markdown links between the docs resolve.
 *   4. The status file is not older than the newest source change (warning).
 *   5. The session log has an entry at least as new as the status file (warning).
 *
 * No dependencies. Works anywhere Node runs, in any AI tool or CI.
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');
const errors = [];
const warnings = [];

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);
const rel = (p) => p.replace(root, '').replace(/^[\\/]/, '').replace(/\\/g, '/');

const CHECKLIST = join(root, 'docs', 'END_TO_END_CHECKLIST.md');
const STATUS = join(root, 'docs', 'PROJECT_STATUS.md');
const SESSION_LOG = join(root, 'docs', 'SESSION_LOG.md');

const DOCS = [
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  '.github/copilot-instructions.md',
  'docs/PROJECT_CONTEXT.md',
  'docs/PROJECT_STATUS.md',
  'docs/END_TO_END_CHECKLIST.md',
  'docs/DECISIONS.md',
  'docs/SESSION_LOG.md',
].map((p) => join(root, p));

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** Parse "23 September 2026" or "2026-09-23". Returns a Date or null. */
function parseDate(text) {
  if (!text) return null;
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const m = text.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const month = MONTHS.findIndex((name) => name.startsWith(m[2].toLowerCase().slice(0, 3)));
  return month === -1 ? null : new Date(Number(m[3]), month, Number(m[1]));
}

/**
 * Rows of a "| 0.5 — Label | done | partial | open | total |" progress table,
 * keyed by stage NUMBER so wording can drift without breaking the check.
 */
function progressRows(md) {
  const rows = new Map();
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(/^\|\s*(?:\*\*)?([0-9][0-9.]*)\s+—[^|*]*?(?:\*\*)?\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/);
    if (m) rows.set(m[1], { done: +m[2], partial: +m[3], open: +m[4], total: +m[5] });
  }
  return rows;
}

// ── 1 + 2: checklist IDs and counts ────────────────────────────────────────
const checklist = read(CHECKLIST);
const status = read(STATUS);

if (!checklist) errors.push('docs/END_TO_END_CHECKLIST.md is missing.');
if (!status) errors.push('docs/PROJECT_STATUS.md is missing.');

if (checklist && status) {
  const actual = new Map();
  const ids = new Map();
  let stage = null;

  for (const line of checklist.split(/\r?\n/)) {
    const heading = line.match(/^##\s+Stage\s+([0-9][0-9.]*)\s*(?:—\s*(.*))?$/);
    if (heading) {
      stage = heading[1];
      actual.set(stage, { done: 0, partial: 0, open: 0, total: 0, label: (heading[2] || '').trim() });
      continue;
    }
    const box = line.match(/^-\s+\[([x~?\s])\]/i);
    if (!box || !stage) continue;

    const bucket = actual.get(stage);
    const mark = box[1].toLowerCase();
    if (mark === 'x') bucket.done++;
    else if (mark === '~') bucket.partial++;
    else bucket.open++;
    bucket.total++;

    const id = line.match(/\*\*([A-Z]\d+(?:\.\d+)?-[A-Z]?\d+[a-z]?)\b/);
    if (!id) {
      warnings.push(`Checklist item without an ID in Stage ${stage}: ${line.trim().slice(0, 70)}…`);
    } else if (ids.has(id[1])) {
      errors.push(`Duplicate task ID ${id[1]} (also in Stage ${ids.get(id[1])}).`);
    } else {
      ids.set(id[1], stage);
    }
  }

  for (const [file, md] of [['docs/END_TO_END_CHECKLIST.md', checklist], ['docs/PROJECT_STATUS.md', status]]) {
    const table = progressRows(md);
    if (table.size === 0) {
      warnings.push(`${file} has no progress table rows to check.`);
      continue;
    }
    for (const [stageNumber, counted] of actual) {
      const claimed = table.get(stageNumber);
      if (!claimed) {
        warnings.push(`${file}: no progress row for Stage ${stageNumber}.`);
        continue;
      }
      for (const key of ['done', 'partial', 'open', 'total']) {
        if (claimed[key] !== counted[key]) {
          errors.push(
            `${file}: Stage ${stageNumber} says ${key}=${claimed[key]} but the checklist actually has ${counted[key]}.`,
          );
        }
      }
    }
  }

  const totals = [...actual.values()].reduce(
    (a, b) => ({ done: a.done + b.done, partial: a.partial + b.partial, open: a.open + b.open, total: a.total + b.total }),
    { done: 0, partial: 0, open: 0, total: 0 },
  );
  console.log(
    `Tasks: ${totals.done} done · ${totals.partial} partial · ${totals.open} open · ${totals.total} total (${ids.size} IDs)`,
  );
}

// ── 3: relative links ──────────────────────────────────────────────────────
for (const doc of DOCS) {
  const md = read(doc);
  if (!md) {
    warnings.push(`Expected doc missing: ${rel(doc)}`);
    continue;
  }
  for (const m of md.matchAll(/\]\(([^)]+\.md[^)]*)\)/g)) {
    const link = m[1];
    if (/^https?:/i.test(link)) continue;
    const target = resolve(dirname(doc), link.split('#')[0]);
    if (!existsSync(target)) errors.push(`${rel(doc)}: broken link -> ${link}`);
  }
}

// ── 4: is the status file stale? ───────────────────────────────────────────
function newestSourceChange() {
  const roots = ['backend/src', 'backend/prisma', 'kiosk/src', 'dashboard/src', 'backend/ai-service'].map((p) => join(root, p));
  let newest = 0;
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === '__pycache__') continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else newest = Math.max(newest, statSync(full).mtimeMs);
    }
  };
  roots.forEach(walk);
  return newest;
}

if (status) {
  const statusDate = parseDate((status.match(/\*\*Last updated:\*\*\s*(.+)/) || [])[1]);
  if (!statusDate) {
    warnings.push('docs/PROJECT_STATUS.md has no readable "**Last updated:**" date.');
  } else {
    const newest = newestSourceChange();
    // Compare against the end of the status date's day, so same-day edits pass.
    const endOfStatusDay = statusDate.getTime() + 24 * 60 * 60 * 1000 - 1;
    if (newest > endOfStatusDay) {
      warnings.push(
        `Source changed on ${new Date(newest).toDateString()} but PROJECT_STATUS.md was last updated ${statusDate.toDateString()}. Run the handoff update.`,
      );
    }

    const log = read(SESSION_LOG);
    if (log) {
      const newestLog = [...log.matchAll(/^\|\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})\s*\|/gm)]
        .map((m) => parseDate(m[1]))
        .filter(Boolean)
        .sort((a, b) => b - a)[0];
      if (!newestLog) warnings.push('docs/SESSION_LOG.md has no dated rows.');
      else if (newestLog.getTime() < statusDate.getTime()) {
        warnings.push(
          `SESSION_LOG.md's newest entry (${newestLog.toDateString()}) is older than PROJECT_STATUS.md (${statusDate.toDateString()}).`,
        );
      }
    } else {
      warnings.push('docs/SESSION_LOG.md is missing.');
    }
  }
}

// ── report ─────────────────────────────────────────────────────────────────
for (const w of warnings) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);

if (errors.length || (strict && warnings.length)) {
  console.log(`\ndocs:check failed — ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`\ndocs:check passed${warnings.length ? ` with ${warnings.length} warning(s)` : ''}.`);
