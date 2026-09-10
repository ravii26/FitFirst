// Read credentials without putting them in command arguments or printing them.
require('dotenv').config();
const { execFileSync } = require('node:child_process');
const { mkdtempSync, chmodSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const url = new URL(process.env.DATABASE_URL);
const directory = mkdtempSync(path.join(tmpdir(), 'fitfirst-before-stage1-'));
chmodSync(directory, 0o700);
const file = path.join(directory, 'database.dump');
execFileSync('pg_dump', ['--format=custom', '--file', file], {
  env: { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432', PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGDATABASE: decodeURIComponent(url.pathname.slice(1)) },
  stdio: 'pipe',
});
chmodSync(file, 0o600);
console.log('Database backup created: ' + file);
