/* ──────────────────────────────────────────────────────────────────────────
   /api/admin?action=… — everything infonet.ng/admin does.

   Sign-in: step one is the password or Google; step two is a Google Authenticator code.
   A passkey (fingerprint / face on the phone or laptop) is both steps in one.
   Until an Authenticator is set up, step one alone gets a "setup" session that can only
   set it up — nothing else.

   Every POST must carry the header X-Infonet-Admin: 1. A cross-site form can't send a
   custom header, so this (with SameSite cookies) is the CSRF guard.
   ────────────────────────────────────────────────────────────────────────── */

import { randomBytes } from 'node:crypto';
import { redisReady, cmd, pipeline } from './_lib/redis.mjs';
import {
    parseCookies, cookie, token, readToken, newSession, currentSession, limited, passwordOk,
    base32, totpAt, totpOk, totpEnabled, newRecoveryCodes, hashCode, useRecoveryCode,
    rpFor, newChallenge, finishRegistration, finishLogin, listPasskeys, b64u,
    googleReady, googleStart, googleFinish,
} from './_lib/auth.mjs';
import { githubReady, readFile, uploadBlob, commit } from './_lib/github.mjs';
import { chromeFrom, productPage, pagePath, patchProducts, patchSitemap, cleanProduct, slugify } from './_lib/render.mjs';

const SESSION = 'infonet_admin', STEP = 'infonet_admin_step', GFLOW = 'infonet_admin_g';

const send = (res, code, body, headers = {}) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    res.end(JSON.stringify(body));
};
const fail = (res, code, message, extra) => send(res, code, { ok: false, error: message, ...extra });

async function readBody(req) {
    if (req.body && typeof req.body === 'object') return req.body;
    const chunks = []; let size = 0;
    for await (const c of req) { size += c.length; if (size > 4_000_000) throw new Error('too-big'); chunks.push(c); }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return {}; }
}

const lagosDay = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });

// Last 30 admin events, for "Recent activity" on the dashboard.
async function log(kind, what) {
    try { await pipeline([['LPUSH', 'admin:log', JSON.stringify({ kind, what, at: new Date().toISOString() })], ['LTRIM', 'admin:log', 0, 29]]); } catch {}
}
const HOW = { password: 'password', google: 'Google', 'password+totp': 'password' };

/* --------------------------------------------------------------- handlers */
async function status(req, res) {
    const s = await currentSession(req);
    send(res, 200, {
        ok: true, signedIn: Boolean(s && s.how !== 'setup'), setupOnly: s?.how === 'setup',
        ready: { password: Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 10),
            redis: redisReady(), github: githubReady(), google: googleReady() },
        totp: await totpEnabled(), passkeys: (await listPasskeys()).length > 0,
    });
}

async function issue(res, remember, how, extraCookies = []) {
    const s = await newSession(remember, how);
    if (how !== 'setup') await log('auth', how.startsWith('passkey:') ? `Signed in with fingerprint (${how.slice(8)})` : `Signed in with ${HOW[how] || how}`);
    res.setHeader('Set-Cookie', [cookie(SESSION, s.value, { maxAge: s.maxAge }), cookie(STEP, '', { maxAge: 0 }), ...extraCookies]);
}

// Step one finished (password or Google). With an Authenticator set up, hand back a
// 5-minute "step" token; without one, a setup-only session.
async function afterFirstStep(res, remember, via, extraCookies = []) {
    if (await totpEnabled()) {
        res.setHeader('Set-Cookie', [cookie(STEP, token('step', { remember, via }, 300), { maxAge: 300 }), ...extraCookies]);
        return { next: 'totp' };
    }
    await issue(res, remember, 'setup', extraCookies);
    return { next: 'setup' };
}

async function loginPassword(req, res, body) {
    if (await limited(req, 'pw')) return fail(res, 429, 'Too many tries. Wait 15 minutes and try again.');
    if (!passwordOk(body.password)) return fail(res, 401, 'That password is not right.');
    send(res, 200, { ok: true, ...(await afterFirstStep(res, Boolean(body.remember), 'password')) });
}

async function loginTotp(req, res, body) {
    const step = readToken('step', parseCookies(req)[STEP]);
    if (!step) return fail(res, 401, 'That took too long. Sign in again.');
    if (await limited(req, 'totp')) return fail(res, 429, 'Too many tries. Wait 15 minutes and try again.');
    const code = String(body.code || '').trim();
    const ok = /^\d{6}$/.test(code) ? await totpOk(code) : await useRecoveryCode(code);
    if (!ok) return fail(res, 401, /^\d{6}$/.test(code) ? 'That code is not right, or it expired. Try the new one.' : 'That recovery code is not valid.');
    await issue(res, step.remember, step.via);
    send(res, 200, { ok: true, usedRecovery: !/^\d{6}$/.test(code) });
}

async function passkeyOptions(req, res) {
    const rp = rpFor(req);
    const keys = (await listPasskeys()).filter((k) => k.rp === rp.id);
    if (!keys.length) return fail(res, 404, 'No fingerprint sign-in is set up on this site yet.');
    send(res, 200, { ok: true, publicKey: {
        challenge: await newChallenge('login'), rpId: rp.id, timeout: 60000, userVerification: 'required',
        allowCredentials: keys.map((k) => ({ type: 'public-key', id: k.id, transports: k.transports })),
    } });
}

async function loginPasskey(req, res, body) {
    if (await limited(req, 'pk')) return fail(res, 429, 'Too many tries. Wait 15 minutes and try again.');
    try {
        const rec = await finishLogin(body.credential || {}, rpFor(req));
        await issue(res, Boolean(body.remember), `passkey:${rec.name}`);
        send(res, 200, { ok: true });
    } catch (e) { fail(res, 401, 'Fingerprint sign-in failed. Try again, or use your password.', { why: e.message }); }
}

async function googleBegin(req, res) {
    if (!googleReady()) { res.statusCode = 302; res.setHeader('Location', '/admin?error=google-not-set-up'); return res.end(); }
    const { url, flow } = googleStart(rpFor(req), new URL(req.url, 'http://x').searchParams.get('remember') === '1');
    res.statusCode = 302;
    res.setHeader('Set-Cookie', cookie(GFLOW, flow, { maxAge: 600 }));
    res.setHeader('Location', url);
    res.end();
}

async function googleCallback(req, res, query) {
    const clear = cookie(GFLOW, '', { maxAge: 0 });
    try {
        if (await limited(req, 'google')) throw new Error('google: too many tries');
        const { remember } = await googleFinish(query, parseCookies(req)[GFLOW]);
        const { next } = await afterFirstStep(res, remember, 'google', [clear]);
        res.statusCode = 302; res.setHeader('Location', `/admin?step=${next}`); res.end();
    } catch (e) {
        res.statusCode = 302; res.setHeader('Set-Cookie', clear);
        res.setHeader('Location', `/admin?error=${encodeURIComponent(e.message.replace(/^google: /, ''))}`); res.end();
    }
}

/* ---------------------------------------------- security settings (signed in) */
async function totpBegin(req, res, s) {
    // With an Authenticator already set up, replacing it needs a full session AND a current code.
    if (await totpEnabled() && s.how === 'setup') return fail(res, 403, 'Sign in fully first.');
    const secret = base32(randomBytes(20));
    await cmd('SET', 'admin:totp-pending', secret, 'EX', 900);
    const label = encodeURIComponent('Infonet Admin:infonet.ng');
    send(res, 200, { ok: true, secret, uri: `otpauth://totp/${label}?secret=${secret}&issuer=Infonet%20Computers&algorithm=SHA1&digits=6&period=30` });
}

async function totpConfirm(req, res, s, body) {
    if (await limited(req, 'totp-setup')) return fail(res, 429, 'Too many tries. Wait 15 minutes.');
    if (await totpEnabled()) {
        if (s.how === 'setup' || !(await totpOk(String(body.current || '')))) return fail(res, 401, 'Enter a code from your current Authenticator to replace it.');
    }
    const pending = await cmd('GET', 'admin:totp-pending');
    if (!pending) return fail(res, 410, 'Setup expired. Start again.');
    const now = Math.floor(Date.now() / 30000), code = String(body.code || '');
    if (![now, now - 1, now + 1].some((st) => totpAt(pending, st) === code)) return fail(res, 401, 'That code does not match. Check the time on your phone and try the next code.');
    const codes = newRecoveryCodes();
    await pipeline([
        ['SET', 'admin:totp', pending], ['DEL', 'admin:totp-pending'], ['DEL', 'admin:recovery'],
        ['HSET', 'admin:recovery', ...codes.flatMap((c) => [hashCode(c), '1'])],
    ]);
    // setup session becomes a real one
    await issue(res, true, s.how === 'setup' ? 'password+totp' : s.how);
    send(res, 200, { ok: true, recoveryCodes: codes });
}

async function recoveryNew(req, res, body) {
    if (!(await totpOk(String(body.code || '')))) return fail(res, 401, 'Enter a current Authenticator code to make new recovery codes.');
    const codes = newRecoveryCodes();
    await pipeline([['DEL', 'admin:recovery'], ['HSET', 'admin:recovery', ...codes.flatMap((c) => [hashCode(c), '1'])]]);
    send(res, 200, { ok: true, recoveryCodes: codes });
}

async function passkeyRegOptions(req, res) {
    const rp = rpFor(req);
    const existing = (await listPasskeys()).filter((k) => k.rp === rp.id);
    send(res, 200, { ok: true, publicKey: {
        challenge: await newChallenge('reg'),
        rp: { id: rp.id, name: 'Infonet Admin' },
        user: { id: b64u(Buffer.from('infonet-admin')), name: 'admin@infonet.ng', displayName: 'Infonet Admin' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
        attestation: 'none', timeout: 90000,
        excludeCredentials: existing.map((k) => ({ type: 'public-key', id: k.id })),
    } });
}

async function passkeyRegister(req, res, body) {
    try {
        const rec = await finishRegistration(body.credential || {}, rpFor(req), body.name);
        send(res, 200, { ok: true, passkey: { id: rec.id, name: rec.name, created: rec.created } });
    } catch (e) { fail(res, 400, 'Could not add this device. Try again.', { why: e.message }); }
}

async function security(req, res) {
    const recovery = (await cmd('HGETALL', 'admin:recovery') || []).length / 2;
    send(res, 200, { ok: true, totp: await totpEnabled(), recoveryLeft: recovery, google: googleReady(),
        passkeys: (await listPasskeys()).map(({ id, name, created, lastUsed, rp }) => ({ id, name, created, lastUsed, rp })) });
}

/* ------------------------------------------------------------------ stats */
async function stats(req, res) {
    if (!redisReady()) return send(res, 200, { ok: true, configured: false, activity: [] });
    const now = Date.now(), today = lagosDay();
    const days = Array.from({ length: 30 }, (_, i) => lagosDay(new Date(now - (29 - i) * 86400000)));
    const r = await pipeline([
        ['ZREMRANGEBYSCORE', 'stats:live', 0, now - 75000], ['ZCARD', 'stats:live'],
        ['GET', 'stats:pv:total'], ['PFCOUNT', 'stats:uv:total'],
        ['GET', `stats:pv:d:${today}`], ['PFCOUNT', `stats:uv:d:${today}`],
        ['ZREVRANGE', `stats:pages:d:${today}`, 0, 9, 'WITHSCORES'], ['ZREVRANGE', 'stats:pages:total', 0, 9, 'WITHSCORES'],
        ['HGETALL', `stats:dev:d:${today}`], ['HGETALL', 'stats:dev:total'],
        ['ZREVRANGE', `stats:ref:d:${today}`, 0, 7, 'WITHSCORES'], ['ZREVRANGE', 'stats:ref:total', 0, 7, 'WITHSCORES'],
        ['GET', `stats:wa:d:${today}`], ['GET', 'stats:wa:total'], ['ZREVRANGE', 'stats:wa:where:total', 0, 7, 'WITHSCORES'],
        ['GET', 'stats:since'], ['LRANGE', 'admin:log', 0, 9],
        ...days.flatMap((d) => [['GET', `stats:pv:d:${d}`], ['PFCOUNT', `stats:uv:d:${d}`]]),
    ]);
    const pairs = (a) => { const o = []; for (let i = 0; i < (a || []).length; i += 2) o.push([a[i], Number(a[i + 1])]); return o; };
    const hash = (a) => Object.fromEntries(pairs(a));
    const base = 17;
    const activity = (r[16] || []).map((x) => { try { return JSON.parse(x); } catch { return null; } }).filter(Boolean);
    send(res, 200, { ok: true, configured: true, since: r[15], activity,
        live: Number(r[1]) || 0,
        total: { visits: Number(r[2]) || 0, visitors: Number(r[3]) || 0, whatsapp: Number(r[13]) || 0 },
        today: { visits: Number(r[4]) || 0, visitors: Number(r[5]) || 0, whatsapp: Number(r[12]) || 0 },
        pages: { today: pairs(r[6]), total: pairs(r[7]) },
        devices: { today: hash(r[8]), total: hash(r[9]) },
        sources: { today: pairs(r[10]), total: pairs(r[11]) },
        whatsappFrom: pairs(r[14]),
        days: days.map((d, i) => ({ day: d, visits: Number(r[base + i * 2]) || 0, visitors: Number(r[base + i * 2 + 1]) || 0 })),
    });
}

/* ------------------------------------------------------------------ stock */
async function stockGet(req, res) {
    if (!githubReady()) return fail(res, 503, 'GitHub is not connected yet (GITHUB_TOKEN).');
    send(res, 200, { ok: true, stock: JSON.parse(await readFile('data/stock.json')) });
}

// One photo at a time keeps each request well under Vercel's 4.5 MB body limit.
async function photoUpload(req, res, body) {
    if (!githubReady()) return fail(res, 503, 'GitHub is not connected yet (GITHUB_TOKEN).');
    const ext = body.ext === 'jpg' ? 'jpg' : 'webp';
    const slug = slugify(body.slug || 'product') || 'product';
    const base = `/assets/img/${slug}-${Date.now().toString(36)}${randomBytes(2).toString('hex')}`;
    const out = {};
    for (const w of [640, 1080]) {
        const data = String(body[`w${w}`] || '');
        if (!/^[A-Za-z0-9+/=]+$/.test(data) || data.length > 1_800_000) return fail(res, 400, 'That photo could not be read.');
        const bytes = Buffer.from(data, 'base64');
        const magic = ext === 'webp' ? bytes.subarray(8, 12).toString() === 'WEBP' : bytes[0] === 0xff && bytes[1] === 0xd8;
        if (!magic) return fail(res, 400, 'That file is not a photo.');
        out[w] = await uploadBlob(data);
    }
    send(res, 200, { ok: true, photo: { base, ext, alt: '' }, blobs: { [`${base}-640.${ext}`]: out[640], [`${base}-1080.${ext}`]: out[1080] } });
}

async function stockSave(req, res, body) {
    if (!githubReady()) return fail(res, 503, 'GitHub is not connected yet (GITHUB_TOKEN).');
    const del = body.delete ? slugify(body.delete) : null;
    let product = null;
    if (!del) {
        const { product: p, problems } = cleanProduct({ ...body.product, updated: lagosDay() });
        if (problems.length) return fail(res, 400, `Add ${problems.join(', ')}.`);
        product = p;
    }
    const blobs = Object.entries(body.blobs || {}).filter(([path, sha]) =>
        /^\/assets\/img\/[a-z0-9-]+-(640|1080)\.(webp|jpg)$/.test(path) && /^[0-9a-f]{40}$/.test(String(sha)));
    let label = '';
    const sha = await commit(() => `stock: ${label}`, async () => {
        const stock = JSON.parse(await readFile('data/stock.json'));
        const old = stock.products.find((x) => x.slug === (del || body.originalSlug || product.slug));
        if (del) {
            if (!old) throw Object.assign(new Error('not-found'), { status: 404 });
            stock.products = stock.products.filter((x) => x !== old);
            label = `remove ${old.name}`;
        } else if (old) {
            Object.assign(old, product);
            label = `update ${product.name}${product.status === 'sold' ? ' (sold)' : ''}`;
        } else {
            if (stock.products.some((x) => x.slug === product.slug)) product.slug = `${product.slug}-${Date.now().toString(36).slice(-4)}`;
            stock.products.unshift(product);
            label = `add ${product.name}`;
        }
        const [home, products, sitemap] = await Promise.all([readFile('index.html'), readFile('products.html'), readFile('sitemap.xml')]);
        const chrome = chromeFrom(home);
        const files = [
            { path: 'data/stock.json', content: `${JSON.stringify(stock, null, 2)}\n` },
            { path: 'products.html', content: patchProducts(products, stock) },
            { path: 'sitemap.xml', content: patchSitemap(sitemap, stock, lagosDay()) },
            ...stock.products.map((p) => ({ path: `${pagePath(p).slice(1)}.html`, content: productPage(p, chrome) })),
            ...blobs.map(([path, s]) => ({ path: path.slice(1), sha: s })),
        ];
        // pages and photos that no product uses any more
        const used = new Set(stock.products.flatMap((p) => p.photos.flatMap((ph) => [640, 1080].map((w) => `${ph.base}-${w}.${ph.ext}`))));
        const gone = old ? old.photos.flatMap((ph) => [640, 1080].map((w) => `${ph.base}-${w}.${ph.ext}`)).filter((f) => !used.has(f)) : [];
        if (old && (del || pagePath(old) !== pagePath(product))) files.push({ path: `${pagePath(old).slice(1)}.html`, delete: true });
        files.push(...gone.map((f) => ({ path: f.slice(1), delete: true })));
        return files;
    });
    await log('stock', label.charAt(0).toUpperCase() + label.slice(1));
    send(res, 200, { ok: true, commit: sha, url: product ? pagePath(product) : null });
}

/* ---------------------------------------------------------------- router */
const PUBLIC = { status, 'login-password': loginPassword, 'login-totp': loginTotp,
    'passkey-options': passkeyOptions, 'login-passkey': loginPasskey };
const SETUP_OK = { 'totp-begin': totpBegin, 'totp-confirm': totpConfirm };
const PRIVATE = { security, stats, 'stock-get': stockGet, 'photo-upload': photoUpload, 'stock-save': stockSave,
    'recovery-new': recoveryNew, 'passkey-reg-options': passkeyRegOptions, 'passkey-register': passkeyRegister };

export default async function handler(req, res) {
    try {
        const url = new URL(req.url, 'http://x');
        const action = url.searchParams.get('action') || '';
        const query = Object.fromEntries(url.searchParams);

        if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 10) {
            if (action !== 'status') return fail(res, 503, 'The admin is not switched on yet: set ADMIN_PASSWORD (10+ characters) in Vercel.');
        }
        if (!redisReady() && action !== 'status') return fail(res, 503, 'The admin needs its Redis store connected in Vercel first.');

        if (req.method === 'GET') {
            if (action === 'google') return googleBegin(req, res);
            if (action === 'google-callback') return googleCallback(req, res, query);
            if (action === 'status') return status(req, res);
            return fail(res, 405, 'Use POST.');
        }
        if (req.method !== 'POST') return fail(res, 405, 'Use POST.');
        if (req.headers['x-infonet-admin'] !== '1') return fail(res, 403, 'Forbidden.');
        const body = await readBody(req);

        if (action === 'logout') {
            res.setHeader('Set-Cookie', [cookie(SESSION, '', { maxAge: 0 }), cookie(STEP, '', { maxAge: 0 })]);
            return send(res, 200, { ok: true });
        }
        if (PUBLIC[action]) return await PUBLIC[action](req, res, body);

        const s = await currentSession(req);
        if (!s) return fail(res, 401, 'Signed out. Sign in again.', { signedOut: true });
        if (SETUP_OK[action]) return await SETUP_OK[action](req, res, s, body);
        if (s.how === 'setup') return fail(res, 403, 'Set up Google Authenticator first.', { setup: true });

        if (action === 'logout-all') {
            await cmd('INCR', 'admin:sessver');
            res.setHeader('Set-Cookie', cookie(SESSION, '', { maxAge: 0 }));
            return send(res, 200, { ok: true });
        }
        if (action === 'passkey-remove') {
            await cmd('HDEL', 'admin:passkeys', String(body.id || ''));
            return send(res, 200, { ok: true });
        }
        if (PRIVATE[action]) return await PRIVATE[action](req, res, body);
        return fail(res, 404, 'Unknown action.');
    } catch (e) {
        console.error('admin', e);
        return fail(res, e.status === 404 ? 404 : 500, e.message === 'too-big' ? 'That upload is too big.' : 'Something went wrong. Try again.');
    }
}
