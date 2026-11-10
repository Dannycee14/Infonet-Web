/* Admin authentication: sessions, password, TOTP (Google Authenticator), recovery codes,
   passkeys (WebAuthn) and Google sign-in. No libraries — node:crypto does the crypto.

   Secrets come only from Vercel environment variables and never leave the server:
     ADMIN_PASSWORD        the password (required)
     ADMIN_SESSION_SECRET  optional; signs cookies. Defaults to a key derived from the password,
                           so changing the password signs everyone out.
     GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / ADMIN_GOOGLE_EMAIL   for "Sign in with Google"
   Per-device data (TOTP secret, passkeys, recovery-code hashes) lives in Redis under admin:*. */

import { createHmac, createHash, randomBytes, timingSafeEqual, createPublicKey, verify as cverify } from 'node:crypto';
import { cmd, pipeline } from './redis.mjs';

export const b64u = (buf) => Buffer.from(buf).toString('base64url');
export const fromB64u = (s) => Buffer.from(String(s), 'base64url');
const sha256 = (x) => createHash('sha256').update(x).digest();
export const safeEq = (a, b) => {
    const x = sha256(String(a)), y = sha256(String(b));
    return timingSafeEqual(x, y);
};
const secret = () => process.env.ADMIN_SESSION_SECRET || sha256(`infonet-admin-v1:${process.env.ADMIN_PASSWORD || ''}`).toString('hex');
const sign = (s) => createHmac('sha256', secret()).update(s).digest('base64url');

/* ----------------------------------------------------------------- cookies */
export function parseCookies(req) {
    const out = {};
    for (const part of String(req.headers.cookie || '').split(';')) {
        const i = part.indexOf('=');
        if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    }
    return out;
}
export function cookie(name, value, { maxAge, path = '/api/admin' } = {}) {
    const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return `${name}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; SameSite=Lax${secure}${maxAge != null ? `; Max-Age=${maxAge}` : ''}`;
}

/* Signed, expiring tokens: "<kind>.<payload b64u>.<exp>.<sig>". Used for the session, for the
   half-way state between password and Authenticator, and for the Google round trip. */
export function token(kind, payload, ttlSec) {
    const exp = Math.floor(Date.now() / 1000) + ttlSec;
    const body = `${kind}.${b64u(JSON.stringify(payload))}.${exp}`;
    return `${body}.${sign(body)}`;
}
export function readToken(kind, t) {
    const parts = String(t || '').split('.');
    if (parts.length !== 4 || parts[0] !== kind) return null;
    const body = parts.slice(0, 3).join('.');
    if (!safeEq(sign(body), parts[3])) return null;
    if (Number(parts[2]) < Date.now() / 1000) return null;
    try { return JSON.parse(fromB64u(parts[1])); } catch { return null; }
}

/* Sessions carry the current "session version"; bumping it signs out every device. */
export async function sessionVersion() { return Number(await cmd('GET', 'admin:sessver')) || 1; }
export async function newSession(remember, how) {
    const ttl = remember ? 30 * 86400 : 12 * 3600;
    return { value: token('s', { v: await sessionVersion(), how }, ttl), maxAge: ttl };
}
export async function currentSession(req) {
    const s = readToken('s', parseCookies(req).infonet_admin);
    if (!s) return null;
    return s.v === (await sessionVersion()) ? s : null;
}

/* ---------------------------------------------------------- rate limiting */
// 8 tries per 15 minutes per IP, and 40 per 15 minutes overall, per kind (password, totp…).
export async function limited(req, kind) {
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '?').split(',')[0].trim();
    const [a, , b] = await pipeline([
        ['INCR', `admin:rl:${kind}:${ip}`], ['EXPIRE', `admin:rl:${kind}:${ip}`, 900],
        ['INCR', `admin:rl:${kind}:all`], ['EXPIRE', `admin:rl:${kind}:all`, 900],
    ]);
    return a > 8 || b > 40;
}

export function passwordOk(pw) {
    const real = process.env.ADMIN_PASSWORD;
    return Boolean(real && real.length >= 10 && pw && safeEq(pw, real));
}

/* ------------------------------------------------------------- TOTP (RFC 6238) */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(buf) {
    let bits = 0, val = 0, out = '';
    for (const byte of buf) { val = (val << 8) | byte; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } }
    if (bits > 0) out += B32[(val << (5 - bits)) & 31];
    return out;
}
function unbase32(s) {
    let bits = 0, val = 0; const out = [];
    for (const c of s.replace(/=+$/, '').toUpperCase()) { val = (val << 5) | B32.indexOf(c); bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } }
    return Buffer.from(out);
}
export function totpAt(secretB32, step) {
    const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(step));
    const h = createHmac('sha1', unbase32(secretB32)).update(msg).digest();
    const o = h[h.length - 1] & 15;
    return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, '0');
}
// ±1 step of clock drift; a code can be used once (stops a shoulder-surfed replay).
export async function totpOk(code) {
    const sec = await cmd('GET', 'admin:totp');
    if (!sec || !/^\d{6}$/.test(String(code))) return false;
    const now = Math.floor(Date.now() / 30000);
    for (const s of [now, now - 1, now + 1]) {
        if (safeEq(totpAt(sec, s), code)) return (await cmd('SET', `admin:totp-used:${s}:${code}`, '1', 'EX', 120, 'NX')) === 'OK';
    }
    return false;
}
export const totpEnabled = async () => Boolean(await cmd('GET', 'admin:totp'));

export function newRecoveryCodes() {
    return Array.from({ length: 8 }, () => {
        const r = base32(randomBytes(6)).slice(0, 10);
        return `${r.slice(0, 5)}-${r.slice(5)}`;
    });
}
export const hashCode = (c) => sha256(`infonet-rc:${String(c).toUpperCase().replace(/[^A-Z2-7]/g, '')}`).toString('hex');
export async function useRecoveryCode(code) {
    return (await cmd('HDEL', 'admin:recovery', hashCode(code))) === 1;
}

/* --------------------------------------------------------- WebAuthn passkeys */
// Minimal CBOR decoder — enough for attestationObject and COSE keys.
export function cbor(buf) {
    let i = 0;
    const len = (ai) => {
        if (ai < 24) return ai;
        if (ai === 24) return buf[i++];
        if (ai === 25) { const v = buf.readUInt16BE(i); i += 2; return v; }
        if (ai === 26) { const v = buf.readUInt32BE(i); i += 4; return v; }
        if (ai === 27) { const v = Number(buf.readBigUInt64BE(i)); i += 8; return v; }
        throw new Error('cbor: indefinite length');
    };
    const item = () => {
        const b = buf[i++], mt = b >> 5, ai = b & 31;
        switch (mt) {
            case 0: return len(ai);
            case 1: return -1 - len(ai);
            case 2: { const n = len(ai); const v = buf.subarray(i, i + n); i += n; return Buffer.from(v); }
            case 3: { const n = len(ai); const v = buf.toString('utf8', i, i + n); i += n; return v; }
            case 4: { const n = len(ai); return Array.from({ length: n }, item); }
            case 5: { const n = len(ai); const m = new Map(); for (let k = 0; k < n; k++) m.set(item(), item()); return m; }
            case 6: len(ai); return item();
            case 7: if (ai === 20) return false; if (ai === 21) return true; if (ai === 22) return null; throw new Error('cbor: float');
        }
        throw new Error('cbor: bad type');
    };
    const out = item();
    return { value: out, end: i };
}

function coseToJwk(m) {
    const kty = m.get(1), alg = m.get(3);
    if (kty === 2 && alg === -7) return { alg, jwk: { kty: 'EC', crv: 'P-256', x: b64u(m.get(-2)), y: b64u(m.get(-3)) } };
    if (kty === 3 && alg === -257) return { alg, jwk: { kty: 'RSA', n: b64u(m.get(-1)), e: b64u(m.get(-2)) } };
    throw new Error('passkey: unsupported key type');
}

function parseAuthData(ad) {
    const rpIdHash = ad.subarray(0, 32), flags = ad[32], counter = ad.readUInt32BE(33);
    const out = { rpIdHash, flags, counter, up: !!(flags & 1), uv: !!(flags & 4) };
    if (flags & 64) {                       // attested credential data
        let p = 37 + 16;                    // skip AAGUID
        const idLen = ad.readUInt16BE(p); p += 2;
        out.credId = ad.subarray(p, p + idLen); p += idLen;
        out.cose = cbor(ad.subarray(p)).value;
    }
    return out;
}

// The site's own host is the passkey's "relying party". Only real hosts are accepted.
export function rpFor(req) {
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
    const name = host.replace(/:\d+$/, '');
    const ok = name === 'infonet.ng' || name === 'www.infonet.ng' || name.endsWith('.vercel.app') || name === 'localhost';
    if (!ok) throw new Error('passkey: unknown host');
    return { id: name, origin: `${name === 'localhost' ? 'http' : 'https'}://${host}` };
}

export async function newChallenge(kind) {
    const c = b64u(randomBytes(32));
    await cmd('SET', `admin:chal:${c}`, kind, 'EX', 300);
    return c;
}
async function takeChallenge(c, kind) { return (await cmd('GETDEL', `admin:chal:${c}`)) === kind; }

function checkClient(clientDataJSON, type, rp) {
    const cd = JSON.parse(fromB64u(clientDataJSON).toString('utf8'));
    if (cd.type !== type) throw new Error('passkey: wrong type');
    if (cd.origin !== rp.origin) throw new Error('passkey: wrong origin');
    return cd.challenge;
}

export async function finishRegistration(resp, rp, name) {
    const challenge = checkClient(resp.clientDataJSON, 'webauthn.create', rp);
    if (!(await takeChallenge(challenge, 'reg'))) throw new Error('passkey: challenge expired');
    const att = cbor(fromB64u(resp.attestationObject)).value;
    const ad = parseAuthData(att.get('authData'));
    if (!ad.rpIdHash.equals(sha256(rp.id))) throw new Error('passkey: wrong site');
    if (!ad.up || !ad.uv) throw new Error('passkey: fingerprint/face not confirmed');
    const { alg, jwk } = coseToJwk(ad.cose);
    const id = b64u(ad.credId);
    const rec = { id, alg, jwk, counter: ad.counter, name: String(name || 'This device').slice(0, 40), rp: rp.id,
        created: new Date().toISOString(), lastUsed: null, transports: (resp.transports || []).slice(0, 6) };
    await cmd('HSET', 'admin:passkeys', id, JSON.stringify(rec));
    return rec;
}

export async function listPasskeys() {
    const flat = await cmd('HGETALL', 'admin:passkeys') || [];
    const out = [];
    for (let i = 0; i < flat.length; i += 2) { try { out.push(JSON.parse(flat[i + 1])); } catch {} }
    return out;
}

export async function finishLogin(resp, rp) {
    const challenge = checkClient(resp.clientDataJSON, 'webauthn.get', rp);
    if (!(await takeChallenge(challenge, 'login'))) throw new Error('passkey: challenge expired');
    const raw = await cmd('HGET', 'admin:passkeys', resp.id);
    if (!raw) throw new Error('passkey: not registered');
    const rec = JSON.parse(raw);
    const authData = fromB64u(resp.authenticatorData);
    const ad = parseAuthData(authData);
    if (!ad.rpIdHash.equals(sha256(rp.id))) throw new Error('passkey: wrong site');
    if (!ad.up || !ad.uv) throw new Error('passkey: fingerprint/face not confirmed');
    const signed = Buffer.concat([authData, sha256(fromB64u(resp.clientDataJSON))]);
    const key = createPublicKey({ key: rec.jwk, format: 'jwk' });
    const ok = cverify('sha256', signed, key, fromB64u(resp.signature));
    if (!ok) throw new Error('passkey: bad signature');
    // A counter that goes backwards means a cloned key. Synced passkeys report 0 — allowed.
    if (ad.counter !== 0 && ad.counter <= rec.counter) throw new Error('passkey: counter went backwards');
    rec.counter = ad.counter; rec.lastUsed = new Date().toISOString();
    await cmd('HSET', 'admin:passkeys', rec.id, JSON.stringify(rec));
    return rec;
}

/* --------------------------------------------------------------- Google */
export const googleReady = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.ADMIN_GOOGLE_EMAIL);

export function googleStart(rp, remember = false) {
    const state = b64u(randomBytes(16)), nonce = b64u(randomBytes(16)), verifier = b64u(randomBytes(32));
    const challenge = b64u(sha256(verifier));
    const redirect = `${rp.origin}/api/admin?action=google-callback`;
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: redirect, response_type: 'code',
        scope: 'openid email', state, nonce, code_challenge: challenge, code_challenge_method: 'S256',
        prompt: 'select_account', login_hint: process.env.ADMIN_GOOGLE_EMAIL,
    });
    return { url, flow: token('g', { state, nonce, verifier, redirect, remember }, 600) };
}

// The id_token comes straight from Google's token endpoint over TLS, so per OpenID Connect
// its signature need not be re-checked; the claims are still checked one by one.
export async function googleFinish(query, flowCookie) {
    const flow = readToken('g', flowCookie);
    if (!flow || !query.code || !safeEq(query.state || '', flow.state)) throw new Error('google: session expired, try again');
    const r = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code: query.code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: flow.redirect, grant_type: 'authorization_code', code_verifier: flow.verifier }),
    });
    if (!r.ok) throw new Error('google: sign-in was not completed');
    const { id_token } = await r.json();
    const claims = JSON.parse(fromB64u(String(id_token).split('.')[1]).toString('utf8'));
    const allowed = String(process.env.ADMIN_GOOGLE_EMAIL).toLowerCase().trim();
    if (!['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss)) throw new Error('google: wrong issuer');
    if (claims.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error('google: wrong audience');
    if (claims.exp * 1000 < Date.now()) throw new Error('google: expired');
    if (claims.nonce !== flow.nonce) throw new Error('google: replay');
    if (!claims.email_verified || String(claims.email).toLowerCase() !== allowed) throw new Error('google: that Google account is not allowed');
    return { email: claims.email, remember: Boolean(flow.remember) };
}
