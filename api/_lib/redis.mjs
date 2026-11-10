/* Upstash Redis over its REST API — no client library. Vercel's Upstash integration sets
   KV_REST_API_URL / KV_REST_API_TOKEN (older) or UPSTASH_REDIS_REST_URL / _TOKEN (newer).

   INFONET_DEV_MEMORY=1 swaps in an in-process store for local tests ONLY; it is refused
   when running on Vercel, so production can never silently lose its data to it. */

// Whatever prefix the Vercel integration was given: KV_ (asked for), STORAGE_ (its example), or Upstash's own.
const env = (suffix) => ['KV', 'STORAGE', 'UPSTASH_REDIS'].map((p) => process.env[`${p}_${suffix}`]).find(Boolean);
const URL_ = env('REST_API_URL') || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = env('REST_API_TOKEN') || process.env.UPSTASH_REDIS_REST_TOKEN;
const DEV = process.env.INFONET_DEV_MEMORY === '1' && !process.env.VERCEL;

export const redisReady = () => Boolean((URL_ && TOKEN) || DEV);

/* pipeline([[cmd, ...args], ...]) → array of results (throws on transport error) */
export async function pipeline(cmds) {
    if (!cmds.length) return [];
    if (DEV) return cmds.map((c) => mem(c.map(String)));
    if (!URL_ || !TOKEN) throw new Error('redis-not-configured');
    const r = await fetch(`${URL_.replace(/\/$/, '')}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(cmds.map((c) => c.map(String))),
    });
    if (!r.ok) throw new Error(`redis-${r.status}`);
    const out = await r.json();
    return out.map((x) => (x.error ? null : x.result));
}
export const cmd = async (...c) => (await pipeline([c]))[0];

/* ----------------------------------------------------- local test store */
const store = globalThis.__infonetMem || (globalThis.__infonetMem = new Map());
const exp = globalThis.__infonetExp || (globalThis.__infonetExp = new Map());
function live(k) { const e = exp.get(k); if (e && e < Date.now()) { store.delete(k); exp.delete(k); } return store.get(k); }
function mem([op, k, ...a]) {
    op = op.toUpperCase();
    const v = live(k);
    switch (op) {
        case 'GET': return typeof v === 'string' ? v : null;
        case 'SET': {
            if (a.includes('NX') && v !== undefined) return null;
            store.set(k, a[0]);
            const i = a.indexOf('EX'); if (i >= 0) exp.set(k, Date.now() + Number(a[i + 1]) * 1000); else exp.delete(k);
            return 'OK';
        }
        case 'DEL': return [k, ...a].reduce((n, x) => n + (store.delete(x) ? 1 : 0), 0);
        case 'GETDEL': store.delete(k); return typeof v === 'string' ? v : null;
        case 'INCR': case 'INCRBY': { const n = Number(v || 0) + Number(op === 'INCR' ? 1 : a[0]); store.set(k, String(n)); return n; }
        case 'EXPIRE': if (v === undefined) return 0; exp.set(k, Date.now() + Number(a[0]) * 1000); return 1;
        case 'HSET': { const h = v instanceof Map ? v : new Map(); for (let i = 0; i < a.length; i += 2) h.set(a[i], a[i + 1]); store.set(k, h); return 1; }
        case 'HGET': return v instanceof Map ? v.get(a[0]) ?? null : null;
        case 'HDEL': return v instanceof Map ? a.filter((f) => v.delete(f)).length : 0;
        case 'HGETALL': return v instanceof Map ? [...v].flat() : [];
        case 'HINCRBY': { const h = v instanceof Map ? v : new Map(); h.set(a[0], String(Number(h.get(a[0]) || 0) + Number(a[1]))); store.set(k, h); return Number(h.get(a[0])); }
        case 'PFADD': { const s = v instanceof Set ? v : new Set(); const n = s.size; a.forEach((x) => s.add(x)); store.set(k, s); return s.size > n ? 1 : 0; }
        case 'PFCOUNT': return [k, ...a].reduce((u, x) => { const s = live(x); if (s instanceof Set) s.forEach((y) => u.add(y)); return u; }, new Set()).size;
        case 'ZINCRBY': { const z = v instanceof Map ? v : new Map(); z.set(a[1], Number(z.get(a[1]) || 0) + Number(a[0])); store.set(k, z); return z.get(a[1]); }
        case 'ZADD': { const z = v instanceof Map ? v : new Map(); for (let i = 0; i < a.length; i += 2) z.set(a[i + 1], Number(a[i])); store.set(k, z); return 1; }
        case 'ZREMRANGEBYSCORE': { if (!(v instanceof Map)) return 0; let n = 0; for (const [m, s] of v) if (s >= Number(a[0]) && s <= Number(a[1])) { v.delete(m); n++; } return n; }
        case 'ZCARD': return v instanceof Map ? v.size : 0;
        case 'ZREVRANGE': {
            if (!(v instanceof Map)) return [];
            const sorted = [...v].sort((x, y) => y[1] - x[1]).slice(Number(a[0]), Number(a[1]) + 1);
            return a.includes('WITHSCORES') ? sorted.flatMap(([m, s]) => [m, String(s)]) : sorted.map(([m]) => m);
        }
        case 'LPUSH': { const l = Array.isArray(v) ? v : []; l.unshift(...a.reverse()); store.set(k, l); return l.length; }
        case 'LTRIM': { if (!Array.isArray(v)) return 'OK'; store.set(k, v.slice(Number(a[0]), Number(a[1]) + 1)); return 'OK'; }
        case 'LRANGE': return Array.isArray(v) ? v.slice(Number(a[0]), Number(a[1]) + 1) : [];
        default: throw new Error(`dev-redis: ${op} not implemented`);
    }
}
