// Vercel Web Analytics for the static site: page views, plus every WhatsApp hand-off.
import { inject, track } from '@vercel/analytics';

inject({ debug: false, mode: 'production' });

// ---------------------------------------------------------------- WhatsApp clicks
// Every chat the site starts goes through here, labelled by where it came from:
//   where — "/products#catalogue", "/repair:repair-form", "/:floating-button" …
//   item  — the first line of the pre-filled message after the greeting, which names the
//           product ("…interested in the HP EliteBook 840 G5…") or the request.
//
// It is recorded twice, because Vercel only stores custom events on the Pro plan:
//   1. track('WhatsApp click', …)  → Analytics › Events (Pro and up)
//   2. a page view of /whatsapp/<page>/<section> → Analytics › Pages, on every plan.
// The second one does add to the page-view total; every such path starts /whatsapp/ so it
// is easy to filter out. Drop it if the account moves to Pro.
function label(text) {
    return (text || '')
        .replace(/^Hello Infonet,?\s*/i, '')
        .split('\n').find((l) => l.trim()) // first non-empty line
        ?.trim().slice(0, 120) || '';
}

function slugify(s) {
    return (s || 'page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page';
}

function record(where, text) {
    try {
        const item = label(text);
        track('WhatsApp click', { where, item });
        const [page, section] = where.split(/[#:]/);
        const path = `/whatsapp/${slugify(page === '/' ? 'home' : page)}/${slugify(section || 'page')}`;
        window.va?.('pageview', { route: '/whatsapp/[page]/[section]', path });
    } catch { /* analytics must never break the hand-off */ }
}

// For hand-offs that call window.open themselves (floating button, checkout, forms).
window.infonetWA = (source, text) => record(`${location.pathname}:${source}`, text);

// Every <a href="https://wa.me/…">, including cards rendered after load.
document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href*="wa.me/"]');
    if (!a) return;
    let text = '';
    try { text = new URL(a.href).searchParams.get('text') || ''; } catch {}
    const where = a.closest('[data-wa-source]')?.dataset.waSource
        || (a.closest('nav') ? 'nav' : a.closest('footer') ? 'footer' : '')
        || a.parentElement?.closest('[id]')?.id
        || 'page';
    record(`${location.pathname}#${where}`, text);
}, { capture: true });
