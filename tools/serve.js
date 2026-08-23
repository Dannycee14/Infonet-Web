// Dev server. Replaces `python3 -m http.server`, which is not the command name on
// Windows (there it is `python` or `py`), so `npm run dev` failed there.
// No dependencies — Node's own http + fs.
//
//   npm run dev            -> http://localhost:4173
//   npm run dev -- 5000    -> http://localhost:5000
import { createServer } from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const PORT = Number(process.argv[2]) || 4173;
const ROOT = resolve(process.cwd());

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const send = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(body);
};

createServer((req, res) => {
  // Strip the query string, then normalise — without this, `..` in a URL walks
  // out of the project directory.
  const url = decodeURIComponent(req.url.split('?')[0]);
  const safe = normalize(url).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, safe);

  if (!resolve(file).startsWith(ROOT)) return send(res, 403, 'Forbidden');

  // Match Vercel's clean URLs: /services -> services.html, / -> index.html
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  else if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;

  if (!existsSync(file)) return send(res, 404, `404 — ${safe}`);

  res.writeHead(200, {
    'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`▸ Infonet dev server  http://localhost:${PORT}   (ctrl-c to stop)`);
});
