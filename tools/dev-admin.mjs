// Local test rig for /admin — NOT deployed (tools/ is in .vercelignore).
// Serves the site, runs api/*.mjs handlers, and fakes GitHub (backed by a copy of the repo
// in $FAKE_REPO) and Redis (in memory). Usage: node tools/dev-admin.mjs  → http://localhost:4174
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, rmSync, cpSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname, dirname } from 'node:path';

const ROOT = process.cwd();
const REPO = process.env.FAKE_REPO || '/tmp/fakegh/repo';
const PORT = Number(process.env.PORT || 4174);
process.env.INFONET_DEV_MEMORY = '1';
process.env.ADMIN_PASSWORD ||= 'test-password-123';
process.env.GITHUB_TOKEN ||= 'fake';
process.env.GITHUB_API_URL = `http://localhost:${PORT}/__gh`;

if (!existsSync(REPO)) {
    mkdirSync(REPO, { recursive: true });
    for (const f of ['index.html', 'products.html', 'sitemap.xml', 'data', 'laptops', 'assets']) cpSync(join(ROOT, f), join(REPO, f), { recursive: true });
}
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.xml': 'application/xml' };

/* ------------------------------------------------------------- fake GitHub */
const blobs = new Map(), trees = new Map(), commits = new Map();
let head = 'c0'; commits.set('c0', { tree: 't0' });
const sha = (x) => createHash('sha1').update(x).digest('hex');
async function body(req) { const c = []; for await (const x of req) c.push(x); return c.length ? JSON.parse(Buffer.concat(c).toString()) : {}; }
async function fakeGh(req, res, path) {
    const j = (code, o) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
    const m = path.match(/^\/repos\/[^/]+\/[^/]+(\/.*)$/); const p = m ? m[1] : path;
    if (req.method === 'GET' && p.startsWith('/contents/')) {
        const f = join(REPO, decodeURI(p.slice(10).split('?')[0]));
        if (!existsSync(f)) return j(404, { message: 'Not Found' });
        return j(200, { content: readFileSync(f).toString('base64'), sha: sha(readFileSync(f)) });
    }
    if (req.method === 'POST' && p === '/git/blobs') { const b = await body(req); const s = sha(b.content); blobs.set(s, b.content); return j(201, { sha: s }); }
    if (req.method === 'GET' && p.startsWith('/git/ref/heads/')) return j(200, { object: { sha: head } });
    if (req.method === 'GET' && p.startsWith('/git/commits/')) return j(200, { tree: { sha: commits.get(p.slice(13))?.tree || 't0' } });
    if (req.method === 'POST' && p === '/git/trees') { const b = await body(req); const s = sha(JSON.stringify(b) + Math.random()); trees.set(s, b.tree); return j(201, { sha: s }); }
    if (req.method === 'POST' && p === '/git/commits') { const b = await body(req); const s = sha(JSON.stringify(b) + Math.random()); commits.set(s, { tree: b.tree, message: b.message, parent: b.parents[0] }); return j(201, { sha: s }); }
    if (req.method === 'PATCH' && p.startsWith('/git/refs/heads/')) {
        const b = await body(req); const c = commits.get(b.sha);
        if (c.parent !== head) return j(422, { message: 'not a fast forward' });
        for (const e of trees.get(c.tree)) {
            const f = join(REPO, e.path);
            if (e.sha === null) { if (existsSync(f)) unlinkSync(f); continue; }
            mkdirSync(dirname(f), { recursive: true });
            writeFileSync(f, e.content != null ? e.content : Buffer.from(blobs.get(e.sha), 'base64'));
        }
        head = b.sha; console.log(`  [fake-github] commit: ${c.message}`);
        return j(200, { object: { sha: head } });
    }
    j(404, { message: `fake github: ${req.method} ${p}` });
}

/* ------------------------------------------------------------------ server */
const handlers = {};
createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    try {
        if (url.pathname.startsWith('/__gh')) return await fakeGh(req, res, url.pathname.slice(5));
        if (url.pathname.startsWith('/api/')) {
            const name = url.pathname.slice(5).replace(/[^a-z-]/g, '');
            handlers[name] ||= (await import(join(ROOT, 'api', `${name}.mjs`))).default;
            return await handlers[name](req, res);
        }
        // pages: committed products/laptops pages come from the fake repo, so saves show up
        let rel = decodeURIComponent(url.pathname);
        for (const base of [REPO, ROOT]) {
            let f = join(base, rel);
            if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
            else if (!existsSync(f) && existsSync(`${f}.html`)) f = `${f}.html`;
            if (existsSync(f) && statSync(f).isFile()) {
                res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
                return res.end(readFileSync(f));
            }
        }
        res.writeHead(404); res.end('not found');
    } catch (e) { console.error(e); res.writeHead(500); res.end(String(e)); }
}).listen(PORT, () => console.log(`▸ admin test rig http://localhost:${PORT}/admin (password: ${process.env.ADMIN_PASSWORD})`));
