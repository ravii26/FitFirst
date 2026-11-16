/* Tiny local server for the marketing page. No dependencies.
   Serves marketing/ at "/" and prototype_v2/ at "/prototype_v2/", and nothing else,
   so the "Explore the live demo" link works without exposing the rest of the repo.

   Run:  node marketing/serve.mjs      then open  http://localhost:5180            */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const roots = { marketing: resolve(here), demo: resolve(here, '..', 'prototype_v2') };
const port = Number(process.env.PORT) || 5180;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let root = roots.marketing;
    if (path === '/prototype_v2' || path.startsWith('/prototype_v2/')) { root = roots.demo; path = path.slice('/prototype_v2'.length) || '/'; }
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(root, path));
    if (file !== root && !file.startsWith(root + sep)) throw new Error('outside root');
    if (!(await stat(file)).isFile()) throw new Error('not a file');
    res.writeHead(200, { 'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(port, () => console.log(`FitFirst marketing page: http://localhost:${port}`));
