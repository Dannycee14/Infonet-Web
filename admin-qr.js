// admin-qr.js — a small QR Code encoder (byte mode, error correction M, versions 1–10),
// written for the Google Authenticator setup on /admin. No library. Follows ISO/IEC 18004.
// window.qrSvg(text, px) → an <svg> string.
(function () {
    'use strict';
    const ECC = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];      // ecc codewords per block, level M
    const BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];             // number of blocks, level M

    const rawModules = (v) => {
        let r = (16 * v + 128) * v + 64;
        if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
        return r;
    };
    const dataCodewords = (v) => Math.floor(rawModules(v) / 8) - ECC[v] * BLOCKS[v];
    const alignPos = (v) => {
        if (v === 1) return [];
        const n = Math.floor(v / 7) + 2;
        const step = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
        const out = [6];
        for (let i = 0, pos = v * 4 + 10; i < n - 1; i++, pos -= step) out.splice(1, 0, pos);
        return out;
    };

    // GF(256) arithmetic for Reed–Solomon
    const mul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 255; };
    const rsDivisor = (deg) => {
        const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1;
        for (let i = 0; i < deg; i++) {
            for (let j = 0; j < deg; j++) { r[j] = mul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; }
            root = mul(root, 2);
        }
        return r;
    };
    const rsRemainder = (data, div) => {
        const r = div.map(() => 0);
        for (const b of data) {
            const f = b ^ r.shift(); r.push(0);
            div.forEach((c, i) => { r[i] ^= mul(c, f); });
        }
        return r;
    };

    function encode(text) {
        const bytes = Array.from(new TextEncoder().encode(text));
        let v = 1;
        for (; v <= 10; v++) if (4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= dataCodewords(v) * 8) break;
        if (v > 10) throw new Error('qr: text too long');
        // bit stream
        const bits = [];
        const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
        put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach((b) => put(b, 8));
        const cap = dataCodewords(v) * 8;
        put(0, Math.min(4, cap - bits.length));
        put(0, (8 - (bits.length % 8)) % 8);
        for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
        const data = [];
        for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
        // blocks + ECC, interleaved
        const nb = BLOCKS[v], ecLen = ECC[v], raw = Math.floor(rawModules(v) / 8);
        const shortLen = Math.floor(raw / nb), nShort = nb - (raw % nb);
        const div = rsDivisor(ecLen), blocks = [];
        for (let i = 0, k = 0; i < nb; i++) {
            const dat = data.slice(k, k + shortLen - ecLen + (i < nShort ? 0 : 1));
            k += dat.length;
            const ecc = rsRemainder(dat, div);
            if (i < nShort) dat.push(0);
            blocks.push(dat.concat(ecc));
        }
        const all = [];
        for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - ecLen || j >= nShort) all.push(b[i]); });

        const size = v * 4 + 17;
        const m = Array.from({ length: size }, () => new Array(size).fill(false));
        const fn = Array.from({ length: size }, () => new Array(size).fill(false));
        const set = (x, y, d) => { m[y][x] = d; fn[y][x] = true; };
        // timing
        for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
        // finders
        const finder = (cx, cy) => {
            for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
                const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
                if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
            }
        };
        finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
        // alignment
        const ap = alignPos(v), na = ap.length;
        for (let i = 0; i < na; i++) for (let j = 0; j < na; j++) {
            if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ap[i] + dx, ap[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
        const drawFormat = (mask) => {
            const d = (0 << 3) | mask;                       // level M = 00
            let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
            const b = ((d << 10) | r) ^ 0x5412;
            const bit = (i) => ((b >>> i) & 1) === 1;
            for (let i = 0; i <= 5; i++) set(8, i, bit(i));
            set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
            for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
            for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
            for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
            set(8, size - 8, true);
        };
        drawFormat(0);
        if (v >= 7) {
            let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
            const b = (v << 12) | r;
            for (let i = 0; i < 18; i++) { const d = ((b >>> i) & 1) === 1, a = size - 11 + (i % 3), c = Math.floor(i / 3); set(a, c, d); set(c, a, d); }
        }
        // data, zig-zag
        let i = 0;
        for (let right = size - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5;
            for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
                const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
                if (!fn[y][x] && i < all.length * 8) { m[y][x] = ((all[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; }
            }
        }
        // masks — pick the lowest penalty (runs, 2×2 blocks, balance)
        const maskFn = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
            (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
            (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0, (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0];
        const apply = (k) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && maskFn[k](x, y)) m[y][x] = !m[y][x]; };
        const penalty = () => {
            let p = 0, dark = 0;
            for (let a = 0; a < size; a++) {
                let rx = 1, ry = 1;
                for (let b = 1; b < size; b++) {
                    if (m[a][b] === m[a][b - 1]) { rx++; if (rx === 5) p += 3; else if (rx > 5) p++; } else rx = 1;
                    if (m[b][a] === m[b - 1][a]) { ry++; if (ry === 5) p += 3; else if (ry > 5) p++; } else ry = 1;
                }
            }
            for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3; }
            m.forEach((row) => row.forEach((c) => { if (c) dark++; }));
            return p + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
        };
        let best = 0, bestP = Infinity;
        for (let k = 0; k < 8; k++) { apply(k); drawFormat(k); const p = penalty(); if (p < bestP) { bestP = p; best = k; } apply(k); }
        apply(best); drawFormat(best);
        return m;
    }

    window.qrSvg = (text, px = 200) => {
        const m = encode(text), n = m.length, q = 4;
        let d = '';
        m.forEach((row, y) => row.forEach((c, x) => { if (c) d += `M${x + q} ${y + q}h1v1h-1z`; }));
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + q * 2} ${n + q * 2}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#0b1020"/></svg>`;
    };
})();
