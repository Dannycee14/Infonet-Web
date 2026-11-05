/* POST /api/hit — the site's own visitor counter, read by infonet.ng/admin.

   analytics.js sends { t, p, v, ... } with navigator.sendBeacon:
     t: 'pv' page view · 'hb' heartbeat every 30 s while the tab is open · 'wa' WhatsApp click
     p: path · v: random visitor id kept in localStorage (no names, no IPs stored)
     d: 'mobile' | 'tablet' | 'desktop' · r: referring site's host · w: where on the page (wa)
   "On the site now" = visitors with a heartbeat in the last 75 seconds.
   Daily keys expire after 400 days; totals are kept. Fails quietly — never breaks a page. */

import { redisReady, pipeline } from './_lib/redis.mjs';

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|axios|go-http/i;
const KEEP = 400 * 86400;

async function readBody(req) {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
    const chunks = []; let n = 0;
    for await (const c of req) { n += c.length; if (n > 4096) return {}; chunks.push(c); }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return {}; }
}

const clean = (s, max, re) => { const v = String(s || '').slice(0, max); return re.test(v) ? v : ''; };

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    const done = () => { res.statusCode = 204; res.end(); };
    try {
        if (req.method !== 'POST' || !redisReady() || BOT.test(String(req.headers['user-agent'] || ''))) return done();
        const host = String(req.headers.host || '');
        if (!/(^|\.)infonet\.ng$|\.vercel\.app$|^localhost(:\d+)?$/.test(host)) return done();
        const b = await readBody(req);
        const v = clean(b.v, 32, /^[a-z0-9]{8,32}$/);
        if (!v) return done();
        const now = Date.now();
        const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
        const cmds = [['ZADD', 'stats:live', now, v]];

        if (b.t === 'pv') {
            const p = clean(String(b.p || '').split(/[?#]/)[0], 100, /^\/[\w\-./]*$/) || '/';
            if (p.startsWith('/admin')) return done();
            const d = ['mobile', 'tablet', 'desktop'].includes(b.d) ? b.d : 'desktop';
            const r = clean(b.r, 60, /^[a-z0-9.-]+$/i).toLowerCase().replace(/^www\./, '') || 'direct';
            cmds.push(
                ['SET', 'stats:since', day, 'NX'],
                ['INCR', 'stats:pv:total'], ['INCR', `stats:pv:d:${day}`], ['EXPIRE', `stats:pv:d:${day}`, KEEP],
                ['PFADD', 'stats:uv:total', v], ['PFADD', `stats:uv:d:${day}`, v], ['EXPIRE', `stats:uv:d:${day}`, KEEP],
                ['ZINCRBY', 'stats:pages:total', 1, p], ['ZINCRBY', `stats:pages:d:${day}`, 1, p], ['EXPIRE', `stats:pages:d:${day}`, KEEP],
                ['HINCRBY', 'stats:dev:total', d, 1], ['HINCRBY', `stats:dev:d:${day}`, d, 1], ['EXPIRE', `stats:dev:d:${day}`, KEEP],
            );
            if (r !== 'infonet.ng') cmds.push(['ZINCRBY', 'stats:ref:total', 1, r], ['ZINCRBY', `stats:ref:d:${day}`, 1, r], ['EXPIRE', `stats:ref:d:${day}`, KEEP]);
        } else if (b.t === 'wa') {
            const w = clean(b.w, 80, /^[\w\-./:#]+$/) || 'unknown';
            cmds.push(['INCR', 'stats:wa:total'], ['INCR', `stats:wa:d:${day}`], ['EXPIRE', `stats:wa:d:${day}`, KEEP],
                ['ZINCRBY', 'stats:wa:where:total', 1, w]);
        } else if (b.t !== 'hb') return done();

        await pipeline(cmds);
    } catch (e) { console.error('hit', e.message); }
    return done();
}
