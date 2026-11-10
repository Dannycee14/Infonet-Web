/* ──────────────────────────────────────────────────────────────────────────
   Stock renderer — the ONE place product pages are made.

   Used twice, with the same output:
     · tools/stock.mjs, from `npm run build` on a laptop, and
     · api/admin.mjs, when a product is saved from infonet.ng/admin. Vercel serves
       the repo as-is (no build step), so the admin commits the finished HTML.

   Input is data/stock.json (plain text; everything is escaped here). The shared
   chrome (sprite, announcement bar, CTA band, footer) is lifted out of index.html
   at render time, exactly as tools/apply-chrome.py does, so it can't drift.
   ────────────────────────────────────────────────────────────────────────── */

export const SITE = 'https://infonet.ng';
const BUSINESS = `${SITE}/#business`;
const WEBSITE = `${SITE}/#website`;
const WA_NUMBER = '2349056467027';
const WA = 'https://wa.me/2349056467027?text=Hello%20Infonet%2C%20I%20have%20an%20enquiry.';

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const naira = (n) => `₦${Number(n).toLocaleString('en-NG')}`;
export const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const jsonld = (o) => `    <script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

/* ------------------------------------------------------------------- chrome */
function grab(home, re, label) {
    const m = home.match(re);
    if (!m) throw new Error(`render: could not find the ${label} block in index.html`);
    return m[1];
}

export function chromeFrom(home) {
    const stamp = (path) => (home.match(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\?v=([0-9a-f]+)`)) || [])[1];
    return {
        sprite: grab(home, /(    <!-- =+ icon sprite[\s\S]*?<\/svg>\n)/, 'icon sprite'),
        announce: grab(home, /(    <!-- =+ announcement -->[\s\S]*?\n    <\/div>\n)/, 'announcement'),
        footer: grab(home, /(    <!-- =+ footer -->[\s\S]*?<\/footer>\n)/, 'footer'),
        cta: grab(home, /(    <!-- =+ CTA band -->[\s\S]*?\n    <\/section>\n)/, 'CTA band'),
        css: stamp('/assets/site.css'),
        js: stamp('/script.js'),
    };
}

function nav(active) {
    const items = [['home', 'Home', '/'], ['laptops', 'Laptops', '/products?category=laptops'],
        ['phones', 'Phones', '/products?category=phones'], ['products', 'Products', '/products'],
        ['services', 'Repairs', '/services'], ['about', 'About', '/#about'], ['contact', 'Contact', '/#contact']];
    const cls = (k, mobile) => mobile
        ? 'block rounded-lg px-3 py-2.5 text-base font-medium ' + (k === active ? 'text-brand-600 bg-brand-50' : 'text-slate-800 hover:bg-slate-50')
        : 'px-3.5 py-2 text-sm transition ' + (k === active ? 'font-semibold text-brand-600' : 'font-medium text-slate-700 hover:text-brand-600');
    const desktop = items.map(([k, l, h]) => `                    <a href="${h}" class="${cls(k)}">${l}</a>`).join('\n');
    const mobile = items.map(([k, l, h]) => `                <a href="${h}" class="${cls(k, true)}">${l}</a>`).join('\n');
    return `    <!-- ========================================================== navigation -->
    <nav class="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-20">
                <a href="/" class="flex items-center gap-3 shrink-0">
                    <img src="/assets/img/infonet-mark.webp" alt="Infonet Computers logo" class="h-10 w-10" width="512" height="512" decoding="async">
                    <span class="leading-tight">
                        <span class="block text-lg font-extrabold tracking-[.02em] text-slate-900">INFONET</span>
                        <span class="block text-[11px] uppercase tracking-[.14em] text-slate-500">Computers LTD</span>
                    </span>
                </a>

                <div class="hidden lg:flex items-center gap-1">
${desktop}
                </div>

                <div class="flex items-center gap-2 md:gap-3">
                    <a href="tel:+2349056467027" class="hidden xl:inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-brand-600 transition">
                        <svg class="w-4 h-4 text-brand-600"><use href="#i-phone"/></svg>
                        <span class="tabular">0905 646 7027</span>
                    </a>
                    <a href="/cart" aria-label="Cart"
                       class="relative inline-flex items-center justify-center w-11 h-11 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-brand-600 transition">
                        <svg class="w-6 h-6"><use href="#i-cart"/></svg>
                        <span data-cart-count hidden
                              class="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-brand-600 text-white text-[11px] font-bold tabular flex items-center justify-center">0</span>
                    </a>
                    <a href="${WA}" target="_blank" rel="noopener"
                       class="hidden md:inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition">
                        <svg class="w-4 h-4"><use href="#i-whatsapp"/></svg>
                        WhatsApp
                    </a>
                    <button id="mobile-menu-button" type="button" aria-label="Toggle menu" aria-controls="mobile-menu"
                            class="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-slate-700 hover:bg-slate-100 transition">
                        <svg class="w-6 h-6"><use href="#i-menu"/></svg>
                    </button>
                </div>
            </div>
        </div>

        <div id="mobile-menu" class="hidden lg:hidden border-t border-slate-200 bg-white">
            <div class="px-4 py-3 space-y-0.5">
${mobile}
                <div class="pt-3 pb-1 flex gap-3">
                    <a href="tel:+2349056467027" class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-900">
                        <svg class="w-4 h-4 text-brand-600"><use href="#i-phone"/></svg> Call
                    </a>
                    <a href="${WA}" target="_blank" rel="noopener"
                       class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
                        <svg class="w-4 h-4"><use href="#i-whatsapp"/></svg> WhatsApp
                    </a>
                </div>
            </div>
        </div>
    </nav>
`;
}

const FLOATING = `    <!-- Back to Top Button -->
    <button id="backToTop" title="Back to top" aria-label="Back to top"
            class="fixed bottom-8 right-6 sm:right-8 bg-slate-900 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lift hover:bg-slate-800 transition opacity-0 invisible cursor-pointer z-40">
        <i class="fas fa-arrow-up"></i>
    </button>

    <!-- WhatsApp Button -->
    <button id="whatsappBtn" title="Chat with us on WhatsApp" aria-label="Chat with us on WhatsApp"
            class="fixed bottom-24 right-6 sm:right-8 bg-whatsapp text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lift hover:brightness-95 transition opacity-0 invisible cursor-pointer z-40">
        <i class="fab fa-whatsapp text-2xl"></i>
    </button>
`;

function head({ title, desc, path, image, imageW, imageH, imageAlt, schema, chrome }) {
    const v = (x) => (x ? `?v=${x}` : '');
    return `<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}">
    <link rel="canonical" href="${SITE}${path}">
    <meta name="robots" content="index, follow">

    <meta name="author" content="Infonet Computers LTD">
    <meta name="theme-color" content="#0d1c45">
    <meta name="geo.region" content="NG-RI">
    <meta name="geo.placename" content="Port Harcourt">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Infonet Computers LTD">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(desc)}">
    <meta property="og:url" content="${SITE}${path}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="${imageW}">
    <meta property="og:image:height" content="${imageH}">
    <meta property="og:image:alt" content="${esc(imageAlt)}">
    <meta property="og:locale" content="en_NG">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(desc)}">
    <meta name="twitter:image" content="${image}">

    <link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">
    <link rel="icon" href="/assets/img/infonet-mark.webp" sizes="any" type="image/webp">
    <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
    <link rel="stylesheet" href="/assets/site.css${v(chrome.css)}">
${schema.map(jsonld).join('\n')}
</head>`;
}

/* ------------------------------------------------------------ product page */
const photoSrc = (ph, w) => `${ph.base}-${w}.${ph.ext || 'webp'}`;
export const pagePath = (p) => `/${p.section}/${p.slug}`;

export function productPage(p, chrome) {
    const n = p.photos.length;
    const sold = p.status === 'sold';
    const label = p.option_label || 'Option';
    const opts = p.options.length ? p.options : [{ label: '', price: 0 }];
    const first = opts[0];
    const firstName = first.label ? `${p.name} (${first.label} ${label})` : p.name;

    const slides = p.photos.map((ph, i) => `                        <li class="snap-start shrink-0 w-full h-full" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${n}">
                            <img src="${esc(photoSrc(ph, 640))}"
                                 srcset="${esc(photoSrc(ph, 640))} 640w, ${esc(photoSrc(ph, 1080))} 1080w"
                                 sizes="(min-width: 1024px) 600px, 100vw"
                                 alt="${esc(ph.alt || p.name)}" width="1080" height="1350" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"
                                 class="w-full h-full object-cover" draggable="false">
                        </li>`).join('\n');
    const dots = p.photos.map((_, i) => `                        <button type="button" data-carousel-dot="${i}" aria-label="Photo ${i + 1}" class="h-2 rounded-full bg-white/50 transition-all w-2 aria-[current=true]:w-5 aria-[current=true]:bg-white"></button>`).join('\n');
    const thumbs = p.photos.map((ph, i) => `                    <button type="button" data-carousel-dot="${i}" aria-label="Show photo ${i + 1}" class="shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 border-transparent aria-[current=true]:border-brand-600 transition">
                        <img src="${esc(photoSrc(ph, 640))}" alt="" width="64" height="80" loading="lazy" decoding="async" class="w-full h-full object-cover">
                    </button>`).join('\n');
    const optHtml = first.label ? `                <fieldset class="mt-7">
                    <legend class="text-xs uppercase tracking-wide text-slate-500">${esc(label)}</legend>
                    <div class="mt-2 flex flex-wrap gap-2">
${opts.map((o, i) => `                            <label class="cursor-pointer"><input type="radio" name="${esc(p.slug)}-opt" value="${esc(o.label)}" data-price="${naira(o.price)}" class="peer sr-only"${i === 0 ? ' checked' : ''}${sold ? ' disabled' : ''}><span class="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-400 peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500">${esc(o.label)}</span></label>`).join('\n')}
                    </div>
                </fieldset>
` : '';
    const highlights = p.highlights.map((h) => `                        <li class="flex items-start gap-2.5"><svg class="w-4 h-4 mt-0.5 text-emerald-500 shrink-0"><use href="#i-check"/></svg>${esc(h)}</li>`).join('\n');
    const specRows = p.specs.map(([k, v]) => `                        <tr class="border-t border-slate-200 first:border-0"><th scope="row" class="py-3 pr-6 text-left font-medium text-slate-500 align-top w-40">${esc(k)}</th><td class="py-3 text-slate-900">${esc(v)}</td></tr>`).join('\n');

    const waText = `Hello Infonet, I'm interested in the ${p.name} (${p.condition})${first.label ? `, ${first.label} ${label}` : ''} (${naira(first.price)}). Is it in stock?`;
    const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`;
    const waSimilar = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hello Infonet, I saw the ${p.name} on your site is sold. Do you have something similar?`)}`;
    // cart line: "Direct UK · 8GB RAM · Intel Core i5…" — script.js swaps the option part on change
    const firstDesc = [p.condition, first.label && `${first.label} ${label}`, ...p.highlights].filter(Boolean).join(' · ');
    const warrantyShort = String(p.warranty || '').replace(/ days$/, '-day');

    const buy = sold ? `                    <div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        This one has sold. We get similar machines in regularly.
                    </div>
                    <a href="${esc(waSimilar)}" target="_blank" rel="noopener"
                       class="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 font-semibold text-white hover:bg-brand-700 transition">
                        <svg class="w-5 h-5"><use href="#i-whatsapp"/></svg> Ask for something similar
                    </a>` : `                    <div class="mt-4 grid sm:grid-cols-2 gap-2">
                        <button type="button" data-add-to-cart
                                data-id="${esc(p.slug)}${first.label ? `-${esc(first.label.toLowerCase())}` : ''}"
                                data-name="${esc(firstName)}"
                                data-desc="${esc(firstDesc)}"
                                data-price="${naira(first.price)}"
                                data-img="${esc(p.photos[0] ? photoSrc(p.photos[0], 640) : '')}"
                                class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 font-semibold text-white shadow-sm hover:bg-brand-700 transition">
                            <svg class="w-5 h-5"><use href="#i-cart"/></svg> Add to cart
                        </button>
                        <a data-variant-wa href="${esc(wa)}" target="_blank" rel="noopener"
                           class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3.5 font-semibold text-slate-800 hover:border-slate-400 transition">
                            <svg class="w-5 h-5 text-whatsapp"><use href="#i-whatsapp"/></svg> Ask about it
                        </a>
                    </div>`;

    const body = `    <!-- ========================================================= breadcrumb -->
    <nav aria-label="Breadcrumb" class="border-b border-slate-200 bg-slate-50">
        <ol class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <li><a href="/" class="hover:text-brand-600">Home</a></li>
            <li aria-hidden="true">/</li>
            <li><a href="/products?category=${esc(p.section)}" class="hover:text-brand-600">${esc(cap(p.section))}</a></li>
            <li aria-hidden="true">/</li>
            <li class="font-medium text-slate-900" aria-current="page">${esc(p.name)}</li>
        </ol>
    </nav>

    <!-- ============================================================ product -->
    <section class="py-10 lg:py-14 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div class="min-w-0" data-carousel aria-roledescription="carousel" aria-label="${esc(p.name)} photos">
                <div class="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                    <ul data-carousel-track tabindex="0"
                        class="flex aspect-[4/5] overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&amp;::-webkit-scrollbar]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500">
${slides}
                    </ul>
                    <button type="button" data-carousel-prev aria-label="Previous photo"
                            class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full bg-white/90 text-slate-900 shadow-card hover:bg-white transition disabled:opacity-0">
                        <svg class="w-5 h-5 rotate-180"><use href="#i-arrow-right"/></svg>
                    </button>
                    <button type="button" data-carousel-next aria-label="Next photo"
                            class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full bg-white/90 text-slate-900 shadow-card hover:bg-white transition disabled:opacity-0">
                        <svg class="w-5 h-5"><use href="#i-arrow-right"/></svg>
                    </button>
                    <div class="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden">
${dots}
                    </div>
                    <span data-carousel-count class="absolute right-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-semibold text-white tabular">1 / ${n}</span>
                </div>
                <div class="mt-3 hidden sm:flex gap-2 overflow-x-auto [scrollbar-width:none] [&amp;::-webkit-scrollbar]:hidden">
${thumbs}
                </div>
            </div>

            <div class="min-w-0" data-variants data-condition="${esc(p.condition)}" data-option-label="${esc(label)}">
                <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">${esc(p.condition)}</span>
                    ${sold ? '<span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Sold</span>' : '<span class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">In stock</span>'}
                </div>
                <h1 class="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">${esc(p.name)}</h1>
                <p class="mt-3 text-lg text-slate-600">${esc(p.summary)}</p>

                <ul class="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[15px] text-slate-700">
${highlights}
                </ul>

${optHtml}
                <div class="mt-6">
                    <span class="block text-xs uppercase tracking-wide text-slate-500">Price</span>
                    <span data-variant-price class="block text-4xl font-bold text-slate-900 tabular${sold ? ' line-through decoration-slate-400 text-slate-400' : ''}" aria-live="polite">${naira(first.price)}</span>
${buy}
                </div>

                <ul class="mt-8 grid sm:grid-cols-3 gap-3 text-sm">
                    <li class="rounded-xl border border-slate-200 bg-slate-50 p-4"><span class="block font-semibold text-slate-900">${esc(warrantyShort)} warranty</span><span class="block text-slate-600">Bring it back if it misbehaves</span></li>
                    <li class="rounded-xl border border-slate-200 bg-slate-50 p-4"><span class="block font-semibold text-slate-900">In the box</span><span class="block text-slate-600">${esc(p.in_box)}</span></li>
                    <li class="rounded-xl border border-slate-200 bg-slate-50 p-4"><span class="block font-semibold text-slate-900">Test it first</span><span class="block text-slate-600">At ${esc(p.shops)}</span></li>
                </ul>
                <p class="mt-4 text-sm text-slate-500">Pay by cash, bank transfer or POS. Got an old ${p.section === 'laptops' ? 'laptop' : 'device'}? <a href="/swap" class="font-semibold text-brand-600 hover:text-brand-700">Swap it towards this one</a>.</p>
            </div>
        </div>
    </section>

    <!-- ============================================================== specs -->
    <section id="specs" class="py-12 lg:py-16 bg-slate-50 border-y border-slate-200">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Full specs</h2>
            <div class="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-2 shadow-card">
                <table class="w-full text-sm">
                    <tbody>
${specRows}
                    </tbody>
                </table>
            </div>
        </div>
    </section>
`;

    const url = `${SITE}${pagePath(p)}`;
    const avail = sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock';
    const used = !/brand new|^new$/i.test(p.condition || '');
    const schema = [{
        '@context': 'https://schema.org', '@type': 'Product', '@id': `${url}#product`,
        name: p.name, brand: { '@type': 'Brand', name: p.brand || p.name.split(' ')[0] },
        description: p.summary, url,
        image: p.photos.map((ph) => `${SITE}${photoSrc(ph, 1080)}`),
        offers: opts.map((o) => ({
            '@type': 'Offer', name: o.label ? `${p.name}, ${o.label} ${label}` : p.name,
            price: String(o.price), priceCurrency: 'NGN', availability: avail,
            itemCondition: used ? 'https://schema.org/UsedCondition' : 'https://schema.org/NewCondition',
            url, seller: { '@id': BUSINESS },
        })),
    }, {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
            { '@type': 'ListItem', position: 2, name: cap(p.section), item: `${SITE}/products?category=${p.section}` },
            { '@type': 'ListItem', position: 3, name: p.name },
        ],
    }];

    const lo = Math.min(...opts.map((o) => o.price));
    const title = `${p.name} (${p.condition}) — ${opts.length > 1 ? 'from ' : ''}${naira(lo)} | Infonet Computers, Port Harcourt`;
    const metaDesc = `${p.name}, ${p.condition}: ${p.highlights.join(', ')}. ${p.in_box} included, ${p.warranty} warranty. Test it at ${p.shops}, Port Harcourt.`;
    const v = (x) => (x ? `?v=${x}` : '');

    return `<!DOCTYPE html>
<html lang="en">
${head({ title, desc: metaDesc, path: pagePath(p), image: p.photos[0] ? `${SITE}${photoSrc(p.photos[0], 1080)}` : `${SITE}/assets/img/og-card.png`,
        imageW: p.photos[0] ? 1080 : 1200, imageH: p.photos[0] ? 1350 : 630, imageAlt: p.name, schema, chrome })}
<body class="font-sans bg-white text-slate-700 antialiased">

${chrome.sprite}
${chrome.announce}
${nav(p.section)}
${body}
${chrome.cta}
${chrome.footer}
${FLOATING}
    <script src="/script.js${v(chrome.js)}" defer></script>
    <!-- Vercel Speed Insights -->
    <script src="/dist/speed-insights.bundle.js" defer></script>
    <!-- Vercel Web Analytics -->
    <script src="/dist/analytics.bundle.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------ /products records + sitemap */
const START = '// <stock:start> — generated from data/stock.json; edit in /admin, not here';
const END = '// <stock:end>';

export function productsRecords(stock) {
    const rows = [];
    for (const p of stock.products) {
        if (p.status === 'sold') continue;              // the page stays up; the card goes
        const opts = p.options.length ? p.options : [{ label: '', price: 0 }];
        for (const o of opts) {
            const label = p.option_label || 'Option';
            rows.push({
                name: o.label ? `${p.name} (${o.label} ${label})` : p.name,
                desc: `${p.condition}. ${[o.label && `${o.label} ${label}`, ...p.highlights].filter(Boolean).join(', ')}`,
                price: naira(o.price),
                img: p.photos[0] ? photoSrc(p.photos[0], 640) : '',
                photo: true,
                url: pagePath(p),
                category: cap(p.section),
                subcategory: p.subcategory || cap(p.section),
            });
        }
    }
    const body = rows.map((r) => '            ' + JSON.stringify(r).replace(/</g, '\\u003c') + ',').join('\n');
    return `            ${START}\n${body}${body ? '\n' : ''}            ${END}`;
}

export function patchProducts(html, stock) {
    const block = productsRecords(stock);
    const re = /[ \t]*\/\/ <stock:start>[\s\S]*?\/\/ <stock:end>/;
    if (re.test(html)) return html.replace(re, block);
    const anchor = '        const products = [\n';
    if (!html.includes(anchor)) throw new Error('render: products array not found in products.html');
    return html.replace(anchor, `${anchor}${block}\n`);
}

export function patchSitemap(xml, stock, today) {
    const re = /[ \t]*<!-- stock:start -->[\s\S]*?<!-- stock:end -->\n?/;
    const entries = stock.products.map((p) => `  <url>
    <loc>${SITE}${pagePath(p)}</loc>
    <lastmod>${esc(p.updated || today)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.status === 'sold' ? '0.3' : '0.8'}</priority>
  </url>`).join('\n');
    const block = `  <!-- stock:start -->\n${entries}${entries ? '\n' : ''}  <!-- stock:end -->\n`;
    let out = xml.replace(re, '');
    // drop any hand-written entry for a stock page, then add the generated block
    for (const p of stock.products) {
        out = out.replace(new RegExp(`  <url>\\s*<loc>${(SITE + pagePath(p)).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}</loc>[\\s\\S]*?</url>\\n`), '');
    }
    return out.replace('</urlset>', `${block}</urlset>`);
}

/* --------------------------------------------------------------- validation */
const str = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

export function cleanProduct(raw) {
    const p = {
        slug: slugify(raw.slug || raw.name),
        section: ['laptops'].includes(raw.section) ? raw.section : 'laptops',
        name: str(raw.name, 90),
        brand: str(raw.brand, 40),
        condition: str(raw.condition, 40) || 'Direct UK',
        status: raw.status === 'sold' ? 'sold' : 'in_stock',
        summary: str(raw.summary, 300),
        subcategory: str(raw.subcategory, 40) || 'Notebook Laptops',
        photos: (Array.isArray(raw.photos) ? raw.photos : []).slice(0, 12).map((ph) => ({
            base: str(ph.base, 120), ext: ph.ext === 'jpg' ? 'jpg' : 'webp', alt: str(ph.alt, 160),
        })).filter((ph) => /^\/assets\/img\/[a-z0-9-]+$/.test(ph.base)),
        option_label: str(raw.option_label, 20) || 'RAM',
        options: (Array.isArray(raw.options) ? raw.options : []).slice(0, 6).map((o) => ({
            label: str(o.label, 30), price: Math.round(Number(String(o.price).replace(/[^\d.]/g, ''))) || 0,
        })).filter((o) => o.price > 0),
        highlights: (Array.isArray(raw.highlights) ? raw.highlights : []).map((h) => str(h, 80)).filter(Boolean).slice(0, 12),
        specs: (Array.isArray(raw.specs) ? raw.specs : []).map((r) => [str(r[0], 40), str(r[1], 200)]).filter((r) => r[0] && r[1]).slice(0, 30),
        in_box: str(raw.in_box, 120),
        warranty: str(raw.warranty, 40),
        shops: ['Garrison or Choba Junction', 'Choba Junction', 'Garrison'].includes(raw.shops) ? raw.shops : 'Garrison or Choba Junction',
        updated: str(raw.updated, 10),
    };
    const problems = [];
    if (!p.name) problems.push('a name');
    if (!p.slug) problems.push('a name we can make a web address from');
    if (!p.options.length) problems.push('at least one price');
    if (!p.photos.length) problems.push('at least one photo');
    return { product: p, problems };
}
