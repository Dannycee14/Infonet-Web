/* ──────────────────────────────────────────────────────────────────────────
   POST /api/order — order confirmation mail.

   Called from the checkout receipt when the customer presses "Send order on
   WhatsApp", and only when they left an email address. Sends two messages:
   the customer's copy, and an internal copy to the shop — which is, for now,
   the only record of an order that lives anywhere but the buyer's browser.

   Zero dependencies on purpose. `package.json` is in `.vercelignore`, so this
   function ships alone; Node 20+ on Vercel has global `fetch`, and the Resend
   REST API is a POST with a bearer token. Nothing to install, nothing to
   bundle, nothing to keep in step with the static build.

   Environment: RESEND_API_KEY (Vercel → Settings → Environment Variables).
   Nothing else. No key, no send — and the checkout degrades quietly.
   ────────────────────────────────────────────────────────────────────────── */

const RESEND_URL = 'https://api.resend.com/emails';

const FROM      = 'Infonet Computers <info@infonet.ng>';
const SHOP      = 'info@infonet.ng';
const WA_NUMBER = '2349056467027';

const SITE  = 'https://infonet.ng';
const ADDR  = '6 Aguma St, Garrison, Port Harcourt 500101, Rivers State';
// Second shop, Nov 2026. Garrison stocks laptops only; Choba stocks everything. The customer's chosen
// pickup shop travels in `fulfil`, so the footer just lists both.
const ADDR_CHOBA = 'Shop 59, Everyday Supermarket Plaza, Choba Junction, Port Harcourt, Rivers State';
const PHONE = '0905 646 7027 · 0803 667 5119';

// Brand tokens, mirrored from tailwind.config.js. Email clients do not read
// our stylesheet, so every colour below is inlined at the point of use.
const NAVY  = '#0d1c45';
const BLUE  = '#1c5be4';
const TINT  = '#eef4ff';
const INK   = '#0f172a';
const MUTED = '#64748b';
const LINE  = '#e2e8f0';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_ITEMS = 60;

/* ───────────────────────────────────────────────────────────────── helpers */

// Everything below the line is customer-supplied and ends up inside HTML we
// send on Infonet's behalf. It gets escaped once, here, at the boundary.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// Control characters -- including the CR and LF that a header injection is
// made of -- become spaces. Written as a code-point test rather than a regex
// character class so that no control character ever has to live in this
// source file: embedded literally they make git treat it as a binary blob,
// and they are invisible to whoever edits it next.
function stripControl(v, keepNewlines) {
    let out = '';
    for (const ch of String(v ?? '')) {
        const code = ch.codePointAt(0);
        if (keepNewlines && code === 10) { out += ch; continue; }
        out += (code < 32 || code === 127) ? ' ' : ch;
    }
    return out;
}

// Single-line fields: no control characters at all, whitespace collapsed.
const clean = (v, max = 200) =>
    stripControl(v, false).replace(/\s+/g, ' ').trim().slice(0, max);

// Multi-line fields, where a newline is legitimate but a carriage return is not.
const cleanMulti = (v, max = 800) =>
    stripControl(v, true).trim().slice(0, max);

const money = (n) => '₦' + Math.round(Number(n) || 0).toLocaleString('en-NG');

const num = (v, max) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
};

/** Normalises whatever the browser posted into a shape we are willing to send. */
function parseOrder(body) {
    const items = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];
    if (!items.length) return { error: 'No items in the order.' };

    const lines = items.map((i) => ({
        name: clean(i && i.name, 140) || 'Item',
        qty: num(i && i.qty, 999) || 1,
        price: num(i && i.price, 100000000),
    }));

    const email = clean(body.email, 254).toLowerCase();
    if (!EMAIL_RE.test(email)) return { error: 'A valid email address is required.' };

    const no = clean(body.no, 32);
    if (!/^INF-\d{6}-\d{3}$/.test(no)) return { error: 'Malformed order number.' };

    const name = clean(body.name, 120);
    const phone = clean(body.phone, 40);
    if (!name || phone.replace(/\D/g, '').length < 10) return { error: 'Name and phone are required.' };

    // Recomputed here rather than trusted from the client: the totals in the
    // mail should agree with the line items in the same mail, whatever the
    // page sent.
    const subtotal = lines.reduce((s, i) => s + i.price * i.qty, 0);
    const count = lines.reduce((s, i) => s + i.qty, 0);

    return {
        no, name, phone, email, lines, subtotal, count,
        when: clean(body.when, 60) || new Date().toLocaleString('en-NG'),
        fulfil: clean(body.fulfil, 120) || 'Pickup at Choba — Shop 59, Everyday Supermarket Plaza, Choba Junction',
        address: clean(body.address, 300),
        note: cleanMulti(body.note, 800),
    };
}

/* ─────────────────────────────────────────────────────────── the mail body */

const waLink = (o) => 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(
    `Hello Infonet, about my order ${o.no}.`
);

function itemRows(o) {
    return o.lines.map((i) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${LINE};">
            <div style="font:600 15px/1.4 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">${esc(i.name)}</div>
            <div style="font:400 13px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${MUTED};margin-top:2px;">${i.qty} &times; ${money(i.price)}</div>
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid ${LINE};white-space:nowrap;font:700 15px/1.4 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">${money(i.price * i.qty)}</td>
        </tr>`).join('');
}

function detailRow(label, value) {
    if (!value) return '';
    return `
        <tr>
          <td style="padding:6px 16px 6px 0;font:400 13px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${MUTED};white-space:nowrap;vertical-align:top;">${esc(label)}</td>
          <td style="padding:6px 0;font:600 13px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">${esc(value)}</td>
        </tr>`;
}

function customerHtml(o) {
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Order ${esc(o.no)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Order ${esc(o.no)} — ${o.count} item(s), ${money(o.subtotal)}. Payment on collection.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${LINE};">

  <tr><td style="background:${NAVY};padding:28px 32px;">
    <div style="font:700 18px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:.22em;color:#ffffff;">INFONET</div>
    <div style="font:400 11px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:.18em;color:#93b0f5;margin-top:4px;">COMPUTERS LTD &middot; SINCE 2004</div>
  </td></tr>

  <tr><td style="padding:32px 32px 8px;">
    <div style="font:600 12px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${BLUE};">Order received</div>
    <h1 style="margin:10px 0 0;font:700 26px/1.25 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">Thank you, ${esc(o.name.split(' ')[0])}.</h1>
    <p style="margin:12px 0 0;font:400 15px/1.65 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#475569;">
      We have your order. Nothing has been charged — we confirm stock and the final amount with you on WhatsApp, and you pay when you collect.
    </p>
  </td></tr>

  <tr><td style="padding:24px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${TINT};border-radius:12px;">
      <tr><td style="padding:16px 20px;">
        <div style="font:400 12px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#4763a8;">Order number</div>
        <div style="font:700 22px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.06em;color:${NAVY};margin-top:6px;">${esc(o.no)}</div>
        <div style="font:400 13px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#4763a8;margin-top:6px;">${esc(o.when)} &middot; quote this number in the shop</div>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:28px 32px 0;">
    <div style="font:600 12px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${MUTED};padding-bottom:6px;">Your items</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows(o)}
      <tr>
        <td style="padding:16px 0 0;font:700 17px/1.3 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">Product total</td>
        <td align="right" style="padding:16px 0 0;font:700 19px/1.3 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};white-space:nowrap;">${money(o.subtotal)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:6px 0 0;font:400 13px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#b45309;">Any delivery cost is agreed on WhatsApp and is not included above.</td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:28px 32px 0;">
    <div style="font:600 12px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${MUTED};padding-bottom:6px;">Details</div>
    <table role="presentation" cellpadding="0" cellspacing="0">
      ${detailRow('Name', o.name)}
      ${detailRow('Phone', o.phone)}
      ${detailRow('Collection', o.fulfil)}
      ${detailRow('Address', o.address)}
      ${detailRow('Your note', o.note)}
    </table>
  </td></tr>

  <tr><td style="padding:28px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #bcd0ff;border-radius:12px;">
      <tr><td style="padding:18px 20px;">
        <div style="font:700 15px/1.4 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">Pay on collection</div>
        <div style="font:400 14px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#475569;margin-top:6px;">
          Cash, bank transfer or POS in the shop when you collect — or to the rider on delivery.
          Infonet will never email you asking for card details or a payment link.
        </div>
      </td></tr>
    </table>
  </td></tr>

  <tr><td align="center" style="padding:28px 32px 0;">
    <a href="${waLink(o)}" style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;font:600 15px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:15px 28px;border-radius:12px;">Chat with us about this order</a>
    <div style="font:400 13px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${MUTED};margin-top:12px;">or call ${PHONE}</div>
  </td></tr>

  <tr><td style="padding:28px 32px 32px;">
    <div style="border-top:1px solid ${LINE};padding-top:20px;font:400 12px/1.7 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${MUTED};">
      <strong style="color:${INK};">Infonet Computers LTD</strong><br>
      ${ADDR}<br>
      ${ADDR_CHOBA}<br>
      ${PHONE} &middot; <a href="mailto:${SHOP}" style="color:${BLUE};text-decoration:none;">${SHOP}</a> &middot; <a href="${SITE}" style="color:${BLUE};text-decoration:none;">infonet.ng</a><br>
      Mon–Wed &amp; Fri 09:00–18:00 &middot; Thu 10:00–18:00 &middot; Sat 10:00–17:00 &middot; Sun closed<br><br>
      This is an order acknowledgement, not a tax invoice. Stock is confirmed before collection.
      You are receiving it because this address was entered at checkout on infonet.ng.
    </div>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

/* Plain text. Not an afterthought: it is what a spam filter reads when it
   wants to know whether the HTML is lying, and what a feature phone shows. */
function customerText(o) {
    const lines = o.lines.map((i) => `  ${i.qty} x ${i.name} — ${money(i.price * i.qty)}`).join('\n');
    return [
        `INFONET COMPUTERS LTD`,
        ``,
        `Thank you, ${o.name.split(' ')[0]}. We have your order.`,
        ``,
        `Order:  ${o.no}`,
        `Date:   ${o.when}`,
        ``,
        lines,
        ``,
        `Items:         ${o.count}`,
        `Product total: ${money(o.subtotal)}`,
        `(Any delivery cost is agreed on WhatsApp and is not included.)`,
        ``,
        `Name:       ${o.name}`,
        `Phone:      ${o.phone}`,
        `Collection: ${o.fulfil}`,
        o.address ? `Address:    ${o.address}` : '',
        o.note ? `Note:       ${o.note}` : '',
        ``,
        `PAY ON COLLECTION — cash, bank transfer or POS in the shop.`,
        `Infonet will never email you asking for card details or a payment link.`,
        ``,
        `Chat with us: ${waLink(o)}`,
        ``,
        `${ADDR}`,
        `${ADDR_CHOBA}`,
        `${PHONE} · ${SHOP} · ${SITE}`,
        `Mon–Wed & Fri 09:00–18:00 · Thu 10:00–18:00 · Sat 10:00–17:00 · Sun closed`,
        ``,
        `This is an order acknowledgement, not a tax invoice.`,
    ].filter((l) => l !== '').join('\n');
}

/* The shop's copy. Deliberately plain — it is a work ticket, read on a phone
   at the bench, not a piece of marketing. */
function shopText(o) {
    const lines = o.lines.map((i) => `  ${i.qty} x ${i.name} — ${money(i.price * i.qty)}`).join('\n');
    return [
        `NEW WEB ORDER — ${o.no}`,
        `${o.when}`,
        ``,
        `${o.name}`,
        `${o.phone}   (tap to chat: https://wa.me/${o.phone.replace(/\D/g, '').replace(/^0/, '234')})`,
        `${o.email}`,
        ``,
        lines,
        ``,
        `Items: ${o.count}   Total: ${money(o.subtotal)}`,
        ``,
        `${o.fulfil}`,
        o.address ? `${o.address}` : '',
        o.note ? `Note: ${o.note}` : '',
        ``,
        `Customer has been emailed a confirmation and is expected to message on WhatsApp.`,
        `Confirm stock, then reply to them there.`,
    ].filter((l) => l !== '').join('\n');
}

/* ──────────────────────────────────────────────────────────────── transport */

async function send(payload, key, idempotencyKey) {
    const headers = {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
    };
    // Resend honours this for 24h, so a customer who taps the WhatsApp button
    // twice gets one email, not two.
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const r = await fetch(RESEND_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
        if (!r.ok) {
            const detail = await r.text().catch(() => '');
            throw new Error(`Resend ${r.status}: ${detail.slice(0, 300)}`);
        }
        return r.json();
    } finally {
        clearTimeout(timer);
    }
}

/* ────────────────────────────────────────────────────────────────── handler */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const key = process.env.RESEND_API_KEY;
    if (!key) {
        // Loud in the log, quiet to the customer: the checkout treats any
        // non-200 the same way and never blocks the WhatsApp handoff.
        console.error('[order] RESEND_API_KEY is not set — no mail sent.');
        return res.status(503).json({ error: 'Mail is not configured.' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = null; }
    }
    if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Expected a JSON order.' });
    }

    const order = parseOrder(body);
    if (order.error) return res.status(400).json({ error: order.error });

    const customer = {
        from: FROM,
        to: [order.email],
        reply_to: SHOP,
        subject: `Your Infonet order ${order.no}`,
        html: customerHtml(order),
        text: customerText(order),
        headers: { 'X-Entity-Ref-ID': order.no },
    };

    const shop = {
        from: FROM,
        to: [SHOP],
        reply_to: order.email,
        // Angle brackets out of the subject: harmless in plain text, but some
        // clients render a subject as HTML in the thread list, and a name is
        // whatever the customer typed.
        subject: `New web order ${order.no} — ${order.name.replace(/[<>]/g, '')} — ${money(order.subtotal)}`,
        text: shopText(order),
        headers: { 'X-Entity-Ref-ID': order.no + '-shop' },
    };

    // The customer's copy is the one this endpoint's status code is about.
    // The shop copy is fired alongside it and is allowed to fail on its own —
    // a bounced internal notice must never tell the buyer their order broke.
    const [toCustomer, toShop] = await Promise.allSettled([
        send(customer, key, `${order.no}:${order.email}`),
        send(shop, key, `${order.no}:shop`),
    ]);

    if (toShop.status === 'rejected') {
        console.error('[order] shop copy failed for', order.no, '—', toShop.reason?.message);
    }

    if (toCustomer.status === 'rejected') {
        console.error('[order] customer copy failed for', order.no, '—', toCustomer.reason?.message);
        return res.status(502).json({ error: 'The confirmation email could not be sent.' });
    }

    console.log('[order]', order.no, '→', order.email, '| shop copy:', toShop.status);
    return res.status(200).json({ ok: true, order: order.no, shopCopy: toShop.status === 'fulfilled' });
}
