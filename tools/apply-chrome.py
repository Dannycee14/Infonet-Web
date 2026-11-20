#!/usr/bin/env python3
"""Give services.html and products.html the homepage's chrome and design language.

The shared blocks (icon sprite, announcement bar, nav, footer, CTA band, floating
buttons) are read out of index.html at run time rather than copy-pasted, so the three
pages cannot drift apart. Change the homepage chrome, re-run this, rebuild:

    python3 tools/apply-chrome.py && npm run build

Two different behaviours, and the difference matters:

  services.html  is GENERATED WHOLE from this file. Edit the copy here, not the HTML —
                 a hand edit to services.html is destroyed on the next run.

  products.html  is PATCHED IN PLACE, because it carries 110 hand-written product
                 records this script must not touch. The patches match the ORIGINAL
                 markup, so it is one-shot: run it against a clean checkout
                 (`git checkout products.html` first) or the patterns find nothing and
                 it exits non-zero rather than half-updating the page.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
home = (ROOT / 'index.html').read_text(encoding='utf-8')


def grab(pattern: str) -> str:
    m = re.search(pattern, home, re.S)
    if not m:
        sys.exit(f'✖ could not find block in index.html: {pattern[:40]}')
    return m.group(1)


SPRITE = grab(r'(    <!-- =+ icon sprite.*?</svg>\n)')
ANNOUNCE = grab(r'(    <!-- =+ announcement -->.*?\n    </div>\n)')
FOOTER = grab(r'(    <!-- =+ footer -->.*?</footer>\n)')
CTA = grab(r'(    <!-- =+ CTA band -->.*?\n    </section>\n)')

WA = ('https://wa.me/2349056467027?text=Hello%20Infonet%2C%20I%20have%20an%20enquiry.')

SITE = 'https://infonet.ng'
BUSINESS = f'{SITE}/#business'          # the one entity every page points back at — the Garrison shop
CHOBA = f'{SITE}/#choba'                # the Choba Junction branch (parentOrganization: BUSINESS)
# Two shops since Nov 2026. Garrison: laptop sales and repairs, plus inverter & UPS repair. Choba:
# everything — phones, laptops, desktops, accessories, and every repair. Same phones, same hours.
GARRISON_ADDR = '6 Aguma St, Garrison'
CHOBA_ADDR = 'Shop 59, Everyday Supermarket Plaza, Choba Junction'
CHOBA_MAP = ('https://www.google.com/maps/search/?api=1&amp;query='
             'Everyday%20Supermarket%20Plaza%2C%20Choba%20Junction%2C%20Port%20Harcourt')
WEBSITE = f'{SITE}/#website'
OG_IMAGE = f'{SITE}/assets/img/og-card.png'


def jsonld(obj) -> str:
    """One compact <script> per graph object. Separate blocks, not one @graph —
    easier to read in Rich Results Test and to delete individually."""
    import json
    return ('    <script type="application/ld+json">'
            + json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
            + '</script>')


def breadcrumbs(trail) -> dict:
    """trail: [(name, path), …] — path None for the current page."""
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'name': name,
             **({'item': f'{SITE}{path}'} if path else {})}
            for i, (name, path) in enumerate(trail)
        ],
    }


def head(title: str, desc: str, path: str, *, robots: str = 'index, follow',
         preload: str = '', schema=()) -> str:
    """The <head> every page shares. Order: identity, then indexing, then place,
    then social, then icons, then resources, then structured data."""
    og_type = 'website'
    schema_html = ('\n' + '\n'.join(jsonld(o) for o in schema)) if schema else ''
    preload_html = (f'\n    <link rel="preload" as="image" fetchpriority="high" '
                    f'href="{preload}" type="image/webp">') if preload else ''
    return f"""<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>{title}</title>
    <meta name="description" content="{desc}">
    <link rel="canonical" href="{SITE}{path}">
    <meta name="robots" content="{robots}">

    <meta name="author" content="Infonet Computers LTD">
    <meta name="theme-color" content="#0d1c45">
    <meta name="geo.region" content="NG-RI">
    <meta name="geo.placename" content="Port Harcourt">

    <meta property="og:type" content="{og_type}">
    <meta property="og:site_name" content="Infonet Computers LTD">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{desc}">
    <meta property="og:url" content="{SITE}{path}">
    <meta property="og:image" content="{OG_IMAGE}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Infonet Computers LTD">
    <meta property="og:locale" content="en_NG">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{desc}">
    <meta name="twitter:image" content="{OG_IMAGE}">

    <link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">
    <link rel="icon" href="/assets/img/infonet-mark.webp" sizes="any" type="image/webp">
    <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
    <link rel="stylesheet" href="/assets/site.css">{preload_html}{schema_html}
</head>"""

FLOATING = """    <!-- Back to Top Button -->
    <button id="backToTop" title="Back to top" aria-label="Back to top"
            class="fixed bottom-8 right-6 sm:right-8 bg-slate-900 text-white w-12 h-12 rounded-full max-sm:!hidden flex items-center justify-center shadow-lift hover:bg-slate-800 transition opacity-0 invisible cursor-pointer z-40">
        <i class="fas fa-arrow-up"></i>
    </button>

    <!-- WhatsApp Button -->
    <button id="whatsappBtn" title="Chat with us on WhatsApp" aria-label="Chat with us on WhatsApp"
            class="fixed bottom-5 right-4 sm:bottom-24 sm:right-8 bg-whatsapp text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lift hover:brightness-95 transition opacity-0 invisible cursor-pointer z-40">
        <i class="fab fa-whatsapp text-2xl"></i>
    </button>
"""

SCRIPTS = """    <script src="/script.js" defer></script>
    <!-- Vercel Speed Insights -->
    <script src="/dist/speed-insights.bundle.js" defer></script>
    <!-- Vercel Web Analytics -->
    <script src="/dist/analytics.bundle.js" defer></script>
"""


def nav(active: str) -> str:
    """active is one of: home, laptops, products, services.

    Breakpoints (Nov 2026): the link row needs ~990px, so it shows from lg and the
    hamburger covers everything below; the phone number joins at xl. At md the old
    row overflowed by ~200px and scrolled the whole page sideways on tablets.
    index.html carries the same classes in its hand-written nav — change both."""
    items = [
        ('home', 'Home', '/'),
        ('laptops', 'Laptops', '/products?category=laptops'),
        # Off the homepage, Phones goes straight to the filtered catalogue; on the
        # homepage itself (hand-written nav in index.html) it scrolls to #phones.
        ('phones', 'Phones', '/products?category=phones'),
        ('products', 'Products', '/products'),
        ('services', 'Repairs', '/services'),
        ('about', 'About', '/#about'),
        ('contact', 'Contact', '/#contact'),
    ]
    def cls(key, mobile=False):
        on = key == active
        if mobile:
            return ('block rounded-lg px-3 py-2.5 text-base font-medium '
                    + ('text-brand-600 bg-brand-50' if on else 'text-slate-800 hover:bg-slate-50'))
        return ('px-3.5 py-2 text-sm transition '
                + ('font-semibold text-brand-600' if on else 'font-medium text-slate-700 hover:text-brand-600'))

    desktop = '\n'.join(
        f'                    <a href="{href}" class="{cls(key)}">{label}</a>' for key, label, href in items)
    mobile = '\n'.join(
        f'                <a href="{href}" class="{cls(key, True)}">{label}</a>' for key, label, href in items)

    return f"""    <!-- ========================================================== navigation -->
    <nav class="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16 lg:h-20">
                <a href="/" class="flex items-center gap-3 shrink-0">
                    <img src="/assets/img/infonet-mark-96.webp" alt="Infonet Computers logo" class="h-9 w-9 lg:h-10 lg:w-10" width="96" height="96" decoding="async">
                    <span class="leading-tight">
                        <span class="block text-lg font-extrabold tracking-[.02em] text-slate-900">INFONET</span>
                        <span class="block text-[11px] uppercase tracking-[.14em] text-slate-500">Computers LTD</span>
                    </span>
                </a>

                <div class="hidden lg:flex items-center gap-1">
{desktop}
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
                    <a href="{WA}" target="_blank" rel="noopener"
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
{mobile}
                <div class="pt-3 pb-1 flex gap-3">
                    <a href="tel:+2349056467027" class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-900">
                        <svg class="w-4 h-4 text-brand-600"><use href="#i-phone"/></svg> Call
                    </a>
                    <a href="{WA}" target="_blank" rel="noopener"
                       class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
                        <svg class="w-4 h-4"><use href="#i-whatsapp"/></svg> WhatsApp
                    </a>
                </div>
            </div>
        </div>
    </nav>
"""


def page_hero(eyebrow: str, title: str, sub: str, chips: list, ctas: str = '') -> str:
    chip_html = '\n'.join(f"""                <div class="flex items-start gap-3">
                    <span class="mt-0.5 flex items-center justify-center w-9 h-9 shrink-0 rounded-lg border border-white/20 text-brand-200">
                        <svg class="w-[18px] h-[18px]"><use href="#i-{icon}"/></svg>
                    </span>
                    <span class="text-sm leading-tight">
                        <span class="block font-semibold text-white">{head}</span>
                        <span class="hidden sm:block text-brand-100/70">{sub_}</span>
                    </span>
                </div>""" for icon, head, sub_ in chips)

    return f"""    <!-- =============================================================== hero -->
    <section id="home" class="relative overflow-hidden hero-mesh text-white">
        <canvas class="mesh-canvas" aria-hidden="true"></canvas>
        <div class="absolute inset-0 hero-grid" aria-hidden="true"></div>

        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10 sm:pt-14 sm:pb-12 lg:pt-16 lg:pb-14">
            <div class="max-w-3xl fade-in">
                <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium tracking-wide text-brand-100">
                    <span class="w-1.5 h-1.5 rounded-full bg-whatsapp"></span>
                    {eyebrow}
                </span>
                <h1 class="mt-5 sm:mt-6 text-[2rem] sm:text-5xl font-bold tracking-tight leading-[1.08] text-balance">{title}</h1>
                <p class="mt-4 sm:mt-5 text-base sm:text-lg text-brand-100/90">{sub}</p>
{ctas}
            </div>

            <div class="mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-5 border-t border-white/15 pt-6 sm:pt-7">
{chip_html}
            </div>
        </div>
    </section>
"""


# ─────────────────────────────────────────────────────────────── services.html
services_hero_ctas = f"""
                <div class="mt-8 flex flex-wrap gap-3">
                    <a href="/repair" class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-brand-900 shadow-lg shadow-brand-950/30 hover:bg-brand-50 transition">
                        Get a repair quote
                        <svg class="w-4 h-4"><use href="#i-arrow-right"/></svg>
                    </a>
                    <a href="{WA}" target="_blank" rel="noopener"
                       class="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-white/10 transition">
                        <svg class="w-5 h-5"><use href="#i-whatsapp"/></svg>
                        Ask a question first
                    </a>
                </div>"""

# (id, icon, title, description, bullets[, where])
# icon: a Font Awesome solid name from the subset (assets/fa-subset.css), or 'sprite:<id>'
# for a symbol in the inline sprite. New icons go in the sprite: a new FA glyph means
# regenerating the webfont subset.
# where: 'choba' for work only the Choba branch does — badge on the card, schema provider
# CHOBA. Everything else is unbadged; the two-shop note under the grid covers it.
SERVICES = [
    ('computer-repair', 'laptop-medical', 'Computer repair',
     'Screens, boards, batteries, keyboards, charging and power faults — laptops and desktops.',
     ['Screen and hinge replacement', 'Battery and charging faults', 'Keyboard and trackpad', 'No-power and board-level diagnosis']),
    ('phone-repair', 'sprite:smartphone', 'Phone repair',
     'Cracked screens, tired batteries, charging and power faults — iPhone, Samsung, Pixel, Redmi, Tecno, Infinix and most Android phones.',
     ['Cracked screen replacement', 'Battery replacement', 'Charging port, speaker and microphone',
      'Water damage and no-power diagnosis', 'Software restore and data transfer'],
     'choba'),
    ('inverter-repair', 'sprite:battery', 'Inverter &amp; UPS repair',
     'Home and office inverters and UPS units that will not charge, will not switch over, or beep and shut down.',
     ['Not charging the batteries', 'No changeover when the power goes', 'Overload, beeping and shutdown faults',
      'Battery testing and replacement', 'Office UPS units']),
    ('data-recovery', 'database', 'Data backup &amp; recovery',
     'Dead drives, deleted files, corrupted partitions — and a backup set up so it does not happen twice.',
     ['Failed and failing drives', 'Deleted or corrupted files', 'External and cloud backup setup', 'Migration to a new machine']),
    ('virus-removal', 'shield-alt', 'Security &amp; virus removal',
     'Malware, ransomware and browser hijacks cleaned out, then hardened so they stay out.',
     ['Malware and ransomware removal', 'Antivirus installation', 'Clean Windows rebuild', 'CCTV installation']),
    ('network-setup', 'network-wired', 'Network setup',
     'Office LAN, Wi-Fi that reaches the whole floor, routers, switches and shared printers.',
     ['Wi-Fi coverage and dead spots', 'Router and switch configuration', 'Shared printers and drives', 'Small-office cabling']),
    ('maintenance', 'tools', 'Maintenance &amp; upgrades',
     'The cheap work that prevents the expensive work — cleaning, servicing and the upgrades that actually help.',
     ['SSD and RAM upgrades', 'Thermal paste and fan cleaning', 'Windows updates and tuning', 'Pre-purchase health checks']),
    ('tech-support', 'headset', 'Tech support',
     'Someone who picks up, understands the problem, and tells you what it costs before starting.',
     ['Remote assistance', 'On-site support in Port Harcourt', 'Setup for homes and offices', 'Same-working-day response']),
]

def svc_icon(icon: str) -> str:
    if icon.startswith('sprite:'):
        return f'<svg class="w-6 h-6"><use href="#i-{icon[7:]}"/></svg>'
    return f'<i class="fas fa-{icon} text-lg"></i>'


def svc_bullets(bullets) -> str:
    return '\n'.join(f'''                        <li class="flex items-start gap-2.5">
                            <svg class="w-4 h-4 mt-0.5 text-emerald-500 shrink-0"><use href="#i-check"/></svg>
                            {b}
                        </li>''' for b in bullets)


def svc_card(sid, icon, title, desc, bullets, where=None) -> str:
    badge = ('\n                    <span class="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand-100 '
             'bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">'
             '<svg class="w-3.5 h-3.5"><use href="#i-pin"/></svg> At our Choba shop</span>'
             if where == 'choba' else '')
    return f"""                <div id="{sid}" class="service-card scroll-mt-32 rounded-2xl border border-slate-200 bg-white p-7 shadow-card fade-in">
                    <span class="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white mb-5">
                        {svc_icon(icon)}
                    </span>
                    <h2 class="text-lg font-bold text-slate-900">{title}</h2>{badge}
                    <p class="mt-2 text-sm text-slate-600">{desc}</p>
                    <ul class="mt-5 space-y-2.5 text-sm text-slate-700">
{svc_bullets(bullets)}
                    </ul>
                </div>"""


svc_cards = '\n'.join(svc_card(*s) for s in SERVICES)

SERVICE_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Phone, computer and inverter repair and IT services — Infonet Computers LTD',
    'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'item': {
            '@type': 'Service',
            'name': re.sub(r'&amp;', 'and', title),
            'serviceType': re.sub(r'&amp;', 'and', title),
            'url': f'{SITE}/services#{sid}',
            'description': re.sub(r'&amp;', 'and', desc),
            'provider': {'@id': CHOBA if where == ['choba'] else BUSINESS},
            'areaServed': {'@type': 'City', 'name': 'Port Harcourt'},
        }}
        for i, (sid, _icon, title, desc, _b, *where) in enumerate(SERVICES)
    ],
}

SERVICES_PAGE_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': f'{SITE}/services#webpage',
    'name': 'Phone, Computer & Inverter Repair, IT Services',
    'url': f'{SITE}/services',
    'isPartOf': {'@id': WEBSITE},
    'about': {'@id': BUSINESS},
    'primaryImageOfPage': OG_IMAGE,
}

services_html = f"""<!DOCTYPE html>
<html lang="en">
{head(
    'Phone, Computer &amp; Inverter Repair in Port Harcourt | Infonet Computers',
    'Phone, laptop, desktop, inverter and UPS repair, plus data recovery, virus removal, upgrades '
    'and network setup in Port Harcourt — shops in Garrison and at Choba Junction. Free '
    'diagnostics, 30-day warranty, same-day service on most faults.',
    '/services',
    schema=(SERVICES_PAGE_SCHEMA, SERVICE_SCHEMA,
            breadcrumbs([('Home', '/'), ('Repairs & IT services', None)])),
)}
<body class="font-sans bg-white text-slate-700 antialiased">

{SPRITE}
{ANNOUNCE}
{nav('services')}
{page_hero(
    'Garrison &amp; Choba Junction · Bench open Mon–Sat',
    'Bring it in. We will tell you honestly what it needs.',
    'Free diagnosis before any work starts, a price you approve first, and most faults back in your hands the same day. Twenty-two years of doing it the same way.',
    [('badge', 'Certified technicians', 'Trained and experienced'),
     ('cpu', 'Free diagnostics', 'An estimate before we start'),
     ('shield', '30-day warranty', 'On every repair we do'),
     ('bolt', 'Same-day service', 'On most repairs')],
    services_hero_ctas,
)}
    <!-- =========================================================== services -->
    <section id="services" class="py-16 lg:py-24 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="max-w-2xl mb-10 fade-in">
                <span class="text-sm font-semibold uppercase tracking-[.14em] text-brand-600">What we do</span>
                <h2 class="mt-2 text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Everything the bench handles</h2>
                <p class="mt-3 text-lg text-slate-600">If it plugs in and misbehaves, start here. If you are not sure which one you need, message us and describe it in your own words.</p>
            </div>

            <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
{svc_cards}
            </div>

            <div class="mt-8 grid md:grid-cols-2 gap-4 text-sm">
                <div class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <svg class="w-5 h-5 mt-0.5 text-brand-600 shrink-0"><use href="#i-pin"/></svg>
                    <p class="text-slate-600"><span class="font-semibold text-slate-900">Garrison</span> — {GARRISON_ADDR}. Laptop sales and repairs, plus inverter and UPS repair.</p>
                </div>
                <div class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <svg class="w-5 h-5 mt-0.5 text-brand-600 shrink-0"><use href="#i-pin"/></svg>
                    <p class="text-slate-600"><span class="font-semibold text-slate-900">Choba Junction</span> — {CHOBA_ADDR}. Everything on this page, phones included. <a href="{CHOBA_MAP}" target="_blank" rel="noopener" class="font-semibold text-brand-600 hover:text-brand-700">Directions</a></p>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== how it works -->
    <section class="py-16 lg:py-24 bg-slate-50 border-y border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="max-w-2xl mb-10 fade-in">
                <span class="text-sm font-semibold uppercase tracking-[.14em] text-brand-600">How it works</span>
                <h2 class="mt-2 text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Three steps, no surprises</h2>
            </div>

            <ol class="grid md:grid-cols-3 gap-6">
                <li class="rounded-2xl border border-slate-200 bg-white p-7 shadow-card fade-in delay-1">
                    <span class="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600 font-bold mb-5 tabular">1</span>
                    <h3 class="text-lg font-bold text-slate-900">Tell us what it is doing</h3>
                    <p class="mt-2 text-sm text-slate-600">Walk it into the shop, or message us on WhatsApp first if you would rather describe it before making the trip.</p>
                </li>
                <li class="rounded-2xl border border-slate-200 bg-white p-7 shadow-card fade-in delay-2">
                    <span class="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600 font-bold mb-5 tabular">2</span>
                    <h3 class="text-lg font-bold text-slate-900">We diagnose it free</h3>
                    <p class="mt-2 text-sm text-slate-600">You get the actual fault and a price before anything is opened up. If it is not worth repairing, we say so.</p>
                </li>
                <li class="rounded-2xl border border-slate-200 bg-white p-7 shadow-card fade-in delay-3">
                    <span class="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600 font-bold mb-5 tabular">3</span>
                    <h3 class="text-lg font-bold text-slate-900">You approve, we fix</h3>
                    <p class="mt-2 text-sm text-slate-600">Most repairs go back the same day, with a 30-day warranty. Complex jobs take longer and we keep you posted.</p>
                </li>
            </ol>
        </div>
    </section>

    <!-- ============================================================ request -->
    <!-- The old mail-app form lived here. Repairs now start on /repair, which writes the
         WhatsApp message; id="request" stays so existing /services#request links still land. -->
    <section id="request" class="py-16 lg:py-24 bg-white scroll-mt-24">
        <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center fade-in">
            <span class="text-sm font-semibold uppercase tracking-[.14em] text-brand-600">Book it</span>
            <h2 class="mt-2 text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Ready to get it fixed?</h2>
            <p class="mt-3 text-lg text-slate-600">Pick the device and the fault, and we reply on WhatsApp with a price.</p>
            <a href="/repair"
               class="mt-8 inline-flex items-center justify-center gap-3 rounded-2xl bg-brand-600 px-10 py-5 text-lg font-semibold text-white shadow-lift hover:bg-brand-700 transition w-full sm:w-auto">
                Get a repair quote
                <svg class="w-5 h-5"><use href="#i-arrow-right"/></svg>
            </a>
        </div>
    </section>

{CTA}
{FOOTER}
{FLOATING}
{SCRIPTS}</body>
</html>
"""

(ROOT / 'services.html').write_text(services_html, encoding='utf-8')
print('✅ services.html rewritten')


# ─────────────────────────────────────────────────────────────── products.html
prod = (ROOT / 'products.html').read_text(encoding='utf-8')


def sub1(pattern, repl, text, label, flags=re.S):
    """Replace exactly once, or fail loudly — silent no-ops are how pages half-update."""
    out, n = re.subn(pattern, lambda _: repl, text, flags=flags)
    if n != 1:
        sys.exit(f'✖ products.html: {label} matched {n} times, expected 1')
    return out


PRODUCTS_PAGE_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': f'{SITE}/products#webpage',
    'name': 'Products',
    'url': f'{SITE}/products',
    'isPartOf': {'@id': WEBSITE},
    'about': {'@id': BUSINESS},
    'primaryImageOfPage': OG_IMAGE,
    # Deliberately no Product/Offer entities. Prices here move with the market and
    # stock is confirmed on WhatsApp, so publishing price + availability as
    # structured data would be asserting something the site cannot stand behind.
}

prod = sub1(
    r'<head>.*?</head>',
    head('Laptops, Phones, Tablets &amp; Accessories in Port Harcourt | Infonet Computers',
         'Browse laptops, phones (iPhone, Samsung Galaxy, Google Pixel, Redmi — new and UK-used), '
         'tablets (iPad, Galaxy Tab, Redmi Pad), PlayStation 5 and PS4 consoles, '
         'desktops, monitors, printers, UPS and accessories at Infonet Computers — Garrison and '
         'Choba Junction, Port Harcourt. Ask us to confirm today\'s stock and price.',
         '/products',
         schema=(PRODUCTS_PAGE_SCHEMA,
                 breadcrumbs([('Home', '/'), ('Products', None)]))),
    prod, 'head')

prod = prod.replace('danielobialor121@gmail.com', 'info@infonet.ng')

prod = prod.replace('<body class="font-sans bg-gray-50">',
                    '<body class="font-sans bg-white text-slate-700 antialiased">')

CARD = """<article class="product-card group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card fade-in">
                            <div class="product-image skel relative aspect-[4/3] overflow-hidden bg-slate-100">
                                <img src="${p.img}" loading="lazy" decoding="async" onload="this.parentElement.classList.remove('skel')" onerror="this.onerror=null;this.parentElement.classList.remove('skel');this.src='/assets/img/product-placeholder.svg'" alt="${p.name}" class="w-full h-full ${p.photo ? 'object-cover' : 'object-contain p-5'}">
                                ${p.url ? `<a href="${p.url}" class="absolute inset-0" aria-label="${p.name.replace(/"/g, '&quot;')} — full specs"></a>` : ''}
                                <span class="absolute left-3 top-3 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-brand-700 shadow-sm">${p.subcategory || p.category}</span>
                            </div>
                            <div class="flex flex-1 flex-col p-5">
                                <h3 class="font-bold leading-snug text-slate-900">${p.url ? `<a href="${p.url}" class="hover:text-brand-700">${p.name}</a>` : p.name}</h3>
                                <p class="mt-1.5 text-sm text-slate-600">${p.desc}</p>
                                <p class="mt-4 text-lg font-bold text-slate-900 tabular">${p.price}</p>
                                <div class="mt-auto pt-4 grid gap-2">
                                    <button type="button" data-add-to-cart
                                            data-id="${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}"
                                            data-name="${p.name.replace(/"/g, '&quot;')}"
                                            data-desc="${(p.desc || '').replace(/"/g, '&quot;')}"
                                            data-price="${p.price}"
                                            data-img="${p.img}"
                                            class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
                                        <svg class="w-4 h-4"><use href="#i-cart"/></svg> Add to cart
                                    </button>
                                    <a href="https://wa.me/2349056467027?text=${encodeURIComponent(`Hello Infonet, I'm interested in the ${p.name} (${p.price}). Is it in stock?`)}"
                                       target="_blank" rel="noopener"
                                       class="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
                                        <i class="fab fa-whatsapp text-whatsapp"></i> Ask about it
                                    </a>
                                    ${p.url ? `<a href="${p.url}" class="text-center text-sm font-semibold text-brand-600 hover:text-brand-700 py-1">See full specs &amp; photos →</a>` : ''}
                                </div>
                            </div>
                        </article>"""

PRODUCTS_HERO = page_hero(
    'Garrison &amp; Choba Junction · Walk-in shops',
    'Everything we stock, in one place.',
    'Stock moves weekly and prices move with the market, so treat this as the catalogue rather than the shelf — message us to confirm what is in today and what it costs.',
    [('store', 'Buy in person', 'See it before you pay'),
     ('badge', 'Tested before it leaves', 'Set up and checked'),
     ('chat', 'Ask on WhatsApp', 'A human replies'),
     ('shield', 'We service what we sell', '30-day repair warranty')],
)

# products.html is PATCHED IN PLACE, not generated: 110 hand-written product records
# live in it and there is no other copy of them. Steps 1–9 below are the one-shot
# migration off the pre-redesign markup. They ran once, in Phase 1.6b, and their output
# is what is committed — so on every run since, step 1 has matched zero times and killed
# the script before cart.html and checkout.html were reached. `git checkout products.html`
# does not help: git holds the migrated file too.
#
# So detect the migrated state and skip the migration. What must keep running is
# everything below the guard: the head (canonical NAP and schema live there), and the
# card template and grid skeletons, which are written to be idempotent.
ALREADY_MIGRATED = '<div id="productGrid" class="grid gap-6' in prod

if not ALREADY_MIGRATED:
    # 1. sprite + announcement + nav replace the old nav
    prod = sub1(r'    <!-- Navigation -->.*?</nav>\n',
                f'{SPRITE}\n{ANNOUNCE}\n{nav("products")}', prod, 'nav')

    # 2. page hero + toolbar replace the old heading / search / filter block
    old_head = r'    <!-- Products Section -->.*?<div id="subcategoryFilter"[^>]*></div>\n'
    new_head = PRODUCTS_HERO + """
        <!-- =========================================================== catalogue -->
        <section id="products" class="pt-12 pb-16 lg:pt-14 lg:pb-24 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="max-w-2xl mb-8 fade-in">
                    <span class="text-sm font-semibold uppercase tracking-[.14em] text-brand-600">Catalogue</span>
                    <h2 class="mt-2 text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Browse the range</h2>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6 mb-8">
                    <label for="productSearch" class="sr-only">Search products</label>
                    <div class="relative max-w-md">
                        <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg class="w-5 h-5"><use href="#i-search"/></svg>
                        </span>
                        <input id="productSearch" type="text" placeholder="Search by name or spec&hellip;"
                               class="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500">
                    </div>

                    <div class="mt-5 flex flex-wrap gap-2">
                        <button class="category-btn rounded-full border px-4 py-2 text-sm font-medium transition bg-brand-600 text-white border-brand-600" data-category="All">All</button>
                        <button class="category-btn rounded-full border px-4 py-2 text-sm font-medium transition bg-white text-slate-700 border-slate-300 hover:border-brand-400 hover:text-brand-700" data-category="Laptops">Laptops</button>
                        <button class="category-btn rounded-full border px-4 py-2 text-sm font-medium transition bg-white text-slate-700 border-slate-300 hover:border-brand-400 hover:text-brand-700" data-category="Desktops">Desktops</button>
                        <button class="category-btn rounded-full border px-4 py-2 text-sm font-medium transition bg-white text-slate-700 border-slate-300 hover:border-brand-400 hover:text-brand-700" data-category="Monitors">Monitors</button>
                        <button class="category-btn rounded-full border px-4 py-2 text-sm font-medium transition bg-white text-slate-700 border-slate-300 hover:border-brand-400 hover:text-brand-700" data-category="Accessories">Accessories</button>
                        <button class="category-btn rounded-full border px-4 py-2 text-sm font-medium transition bg-white text-slate-700 border-slate-300 hover:border-brand-400 hover:text-brand-700" data-category="Printers">Printers</button>
                        <button class="category-btn rounded-full border px-4 py-2 text-sm font-medium transition bg-white text-slate-700 border-slate-300 hover:border-brand-400 hover:text-brand-700" data-category="UPS">UPS</button>
                    </div>

                    <div id="subcategoryFilter" class="mt-3 flex flex-wrap gap-2"></div>
                </div>

                <p id="resultCount" class="mb-6 text-sm text-slate-500" aria-live="polite"></p>
    """
    prod = sub1(old_head, new_head, prod, 'header/toolbar')

    # 3. CTA band + footer replace the old footer
    prod = sub1(r'    <!-- Footer -->.*?</footer>\n', f'{CTA}\n{FOOTER}', prod, 'footer')

    # 4. floating buttons
    prod = sub1(r'    <!-- Back to Top Button -->.*?</button>\n', FLOATING, prod, 'floating buttons')

    # 5. script.js replaces the hand-rolled duplicates of handlers it already owns
    prod = sub1(r'    <script>\n        // Mobile menu toggle.*?window\.scrollTo\(\{ top: 0, behavior: \'smooth\' \}\);\n        \}\);\n',
                '    <script src="/script.js" defer></script>\n\n    <script>\n', prod, 'inline handler removal')

    # 6. product card markup, both templates (grid render and search render)
    prod, n = re.subn(
        r'<div class="bg-white rounded-lg shadow-lg p-6 product-card fade-in">.*?Enquire on WhatsApp</a>\s*</div>',
        lambda _: CARD, prod, flags=re.S)
    if n != 2:
        sys.exit(f'✖ products.html: card template matched {n} times, expected 2')

    # 7. filter chips: the JS swaps hard-coded class names, so they have to move with the
    #    markup. One active triple and one inactive triple, applied everywhere, then asserted —
    #    a missed pair leaves a chip that never lights up, and .replace() fails silently.
    ACTIVE_OLD, INACTIVE_OLD = "'bg-blue-600', 'text-white'", "'bg-gray-200', 'text-gray-800'"
    ACTIVE_NEW = "'bg-brand-600', 'text-white', 'border-brand-600'"
    INACTIVE_NEW = "'bg-white', 'text-slate-700', 'border-slate-300'"

    prod = prod.replace(ACTIVE_OLD, ACTIVE_NEW).replace(INACTIVE_OLD, INACTIVE_NEW)

    prod = prod.replace('btn.className = "subcategory-btn bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition";',
                        'btn.className = "subcategory-btn rounded-full border px-3 py-1.5 text-xs font-medium transition bg-brand-600 text-white border-brand-600";')
    prod = prod.replace('btn.className = "subcategory-btn bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-blue-600 hover:text-white transition";',
                        'btn.className = "subcategory-btn rounded-full border px-3 py-1.5 text-xs font-medium transition bg-white text-slate-700 border-slate-300 hover:border-brand-400 hover:text-brand-700";')

    for stale in ('bg-blue-600', 'bg-gray-200', 'text-gray-800'):
        if stale in prod:
            line = next(l.strip() for l in prod.splitlines() if stale in l)
            sys.exit(f'✖ products.html: stale class {stale!r} survived — {line[:90]}')

    # 8. a live count, so "no results" is never a silent empty grid
    prod = prod.replace("            document.getElementById('productGrid').innerHTML = html;\n        }",
                        """            const grid = document.getElementById('productGrid');
                grid.innerHTML = html || emptyState();
                setCount(html ? countOf(html) : 0);
            }""", 1)

    prod = prod.replace("""            document.getElementById('productGrid').innerHTML = html;
                // If search is cleared, show all products for current category/subcategory""",
                        """            const grid = document.getElementById('productGrid');
                grid.innerHTML = html || emptyState();
                setCount(html ? countOf(html) : 0);
                // If search is cleared, show all products for current category/subcategory""")

    prod = prod.replace("        function renderProducts(category = \"All\", subcategory = \"All\") {",
                        """        const countOf = (html) => (html.match(/<article/g) || []).length;
            const setCount = (n) => {
                const el = document.getElementById('resultCount');
                if (el) el.textContent = `${n} of ${products.length} item${products.length === 1 ? '' : 's'}`;
            };
            const emptyState = () => `
                <div class="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                    <p class="font-semibold text-slate-900">Nothing here matches that.</p>
                    <p class="mt-1 text-sm text-slate-600">Stock changes weekly — ask us on WhatsApp and we will tell you what is in.</p>
                    <a href="https://wa.me/2349056467027?text=Hello%20Infonet%2C%20do%20you%20have%20this%20in%20stock%3F" target="_blank" rel="noopener"
                       class="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
                       <i class="fab fa-whatsapp"></i> Ask about stock</a>
                </div>`;

            function renderProducts(category = "All", subcategory = "All") {""")

    # 9. grid spacing to match the homepage cards
    prod = prod.replace('<div id="productGrid" class="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">',
                        '<div id="productGrid" class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">')
else:
    print('   products.html already migrated — one-shot steps skipped')

# 10. shared chrome, re-applied on every run. Each block was written into products.html
#     under the same comment banner grab() used to lift it out of index.html, so it can
#     find itself and be replaced by the current version. This is what keeps products.html
#     in step with the other four pages now that the one-shot migration above is skipped —
#     without it, a footer or address change lands on every page except this one.
for _label, _pattern, _block in (
    ('sprite',       r'    <!-- =+ icon sprite.*?</svg>\n',            SPRITE),
    ('announcement', r'    <!-- =+ announcement -->.*?\n    </div>\n', ANNOUNCE),
    ('navigation',   r'    <!-- =+ navigation -->.*?</nav>\n',         nav('products')),
    ('hero',         r'    <!-- =+ hero -->.*?\n    </section>\n',     PRODUCTS_HERO),
    ('CTA band',     r'    <!-- =+ CTA band -->.*?\n    </section>\n', CTA),
    ('footer',       r'    <!-- =+ footer -->.*?</footer>\n',          FOOTER),
):
    prod = sub1(_pattern, _block, prod, f'{_label} refresh')

# 11. card template, re-applied on every run. Matches its own output, so it is safe to
#     run repeatedly and is the one place the card markup is defined.
prod, n = re.subn(r'<article class="product-card group.*?</article>', lambda _: CARD, prod, flags=re.S)
if n != 2:
    sys.exit(f'✖ products.html: card template matched {n} times, expected 2')

# 9b. skeleton cards. renderProducts() runs on DOMContentLoaded and overwrites the
#     grid wholesale, so these are only ever seen before the catalogue is on screen —
#     which is exactly the moment the column is otherwise blank. They are plain <div>s
#     on purpose: countOf() counts <article>, and a skeleton is not a result.
SKELETON_CARD = """
                <div class="skel-block flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card" aria-hidden="true">
                    <div class="skel aspect-[4/3]"></div>
                    <div class="flex flex-1 flex-col p-5">
                        <div class="skel skel-line" style="width:78%"></div>
                        <div class="skel skel-line mt-3" style="width:92%"></div>
                        <div class="skel skel-line mt-2" style="width:60%"></div>
                        <div class="skel skel-line mt-5" style="width:40%;height:1rem"></div>
                        <div class="mt-auto pt-4 grid gap-2">
                            <div class="skel rounded-xl h-10"></div>
                            <div class="skel rounded-xl h-10"></div>
                        </div>
                    </div>
                </div>"""

if 'skel-block' not in prod:
    prod, n = re.subn(r'[ \t]*<!-- Product cards will be injected here by JS -->',
                      lambda _: (SKELETON_CARD * 8).lstrip('\n'), prod)
    if n != 1:
        sys.exit(f'✖ products.html: grid placeholder comment matched {n} times, expected 1')

(ROOT / 'products.html').write_text(prod, encoding='utf-8')
print('✅ products.html restyled')


# ═════════════════════════════════════════════════════ cart.html / checkout.html
# Both are generated whole, like services.html. They share a light page header
# rather than the navy hero — a cart is a working surface, not a landing page.

def page_head(eyebrow: str, title: str, sub: str) -> str:
    return f"""    <!-- ======================================================== page header -->
    <section class="border-b border-slate-200 bg-slate-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <span class="text-sm font-semibold uppercase tracking-[.14em] text-brand-600">{eyebrow}</span>
            <h1 class="mt-2 text-[2rem] sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p class="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 max-w-2xl">{sub}</p>
        </div>
    </section>
"""


def shell(title: str, desc: str, path: str, active: str, body: str,
          extra_scripts: str = '', schema=()) -> str:
    # Cart and checkout are working surfaces, not landing pages: noindex, but
    # follow, so the links out of them still pass through.
    return f"""<!DOCTYPE html>
<html lang="en">
{head(title, desc, path, robots='noindex, follow', schema=schema)}
<body class="font-sans bg-white text-slate-700 antialiased">

{SPRITE}
{ANNOUNCE}
{nav(active)}
{body}
{FOOTER}
{SCRIPTS}{extra_scripts}</body>
</html>
"""


# ─────────────────────────────────────────────────────────────────── cart.html
cart_body = page_head(
    'Your selection',
    'Your cart.',
    'Check the list before you send it over. Nothing is charged here — you confirm '
    'stock and settle up with us directly.',
) + """
    <section class="py-12 lg:py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid lg:grid-cols-3 gap-8 items-start">

                <div class="lg:col-span-2">
                    <!-- Skeleton rows. render() runs on DOMContentLoaded and replaces the
                         whole container, so these live only for the frame or two before
                         the cart has been read out of localStorage. -->
                    <div id="cartLines" class="space-y-4">
                        <div class="skel-block rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-card" aria-hidden="true">
                            <div class="flex gap-4 sm:gap-5">
                                <div class="skel w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl"></div>
                                <div class="min-w-0 flex-1">
                                    <div class="skel skel-line" style="width:55%"></div>
                                    <div class="skel skel-line mt-3" style="width:80%"></div>
                                    <div class="skel skel-line mt-2" style="width:35%"></div>
                                    <div class="skel rounded-full mt-5 h-10" style="width:9rem"></div>
                                </div>
                            </div>
                        </div>
                        <div class="skel-block rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-card" aria-hidden="true">
                            <div class="flex gap-4 sm:gap-5">
                                <div class="skel w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl"></div>
                                <div class="min-w-0 flex-1">
                                    <div class="skel skel-line" style="width:45%"></div>
                                    <div class="skel skel-line mt-3" style="width:70%"></div>
                                    <div class="skel skel-line mt-2" style="width:30%"></div>
                                    <div class="skel rounded-full mt-5 h-10" style="width:9rem"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="cartEmpty" hidden class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                        <span class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white border border-slate-200 text-slate-400">
                            <svg class="w-7 h-7"><use href="#i-cart"/></svg>
                        </span>
                        <p class="mt-5 text-lg font-bold text-slate-900">Your cart is empty.</p>
                        <p class="mt-2 text-sm text-slate-600">Nothing added yet. The catalogue is the place to start.</p>
                        <a href="/products" class="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition">
                            Browse products <svg class="w-4 h-4"><use href="#i-arrow-right"/></svg>
                        </a>
                    </div>
                </div>

                <aside class="lg:sticky lg:top-28">
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
                        <h2 class="text-sm font-semibold uppercase tracking-[.14em] text-slate-500">Summary</h2>

                        <dl class="mt-5 space-y-3 text-sm">
                            <div class="flex justify-between">
                                <dt class="text-slate-600">Subtotal</dt>
                                <dd class="font-semibold text-slate-900 tabular" data-cart-subtotal>₦0</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-slate-600">Items</dt>
                                <dd class="font-semibold text-slate-900 tabular" data-cart-items>0</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-slate-600">Delivery</dt>
                                <dd class="font-semibold text-amber-600">Confirmed with you</dd>
                            </div>
                        </dl>

                        <div class="mt-5 pt-5 border-t border-slate-200 flex items-baseline justify-between">
                            <span class="text-lg font-bold text-slate-900">Order total</span>
                            <span class="text-xl font-bold text-slate-900 tabular" data-cart-total>₦0</span>
                        </div>

                        <a href="/checkout" id="toCheckout"
                           class="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white hover:bg-brand-700 transition">
                            Continue to checkout <svg class="w-4 h-4"><use href="#i-arrow-right"/></svg>
                        </a>
                        <a href="/products" class="mt-3 w-full inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3.5 font-semibold text-slate-900 hover:border-slate-400 transition">
                            Keep shopping
                        </a>

                        <p class="mt-5 text-xs text-slate-500">
                            Stock and the final amount are confirmed with Infonet on WhatsApp before you pay.
                            Payment is on collection — cash, transfer or POS in store.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    </section>
"""

cart_script = """
    <script>
    // script.js is deferred, so Cart does not exist yet at parse time. Deferred
    // scripts all execute before DOMContentLoaded, so this waits for that.
    document.addEventListener('DOMContentLoaded', () => {
        const lines = document.getElementById('cartLines');
        const empty = document.getElementById('cartEmpty');
        const toCheckout = document.getElementById('toCheckout');
        if (!lines) return;

        const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

        function render() {
            const items = Cart.read();
            empty.hidden = items.length > 0;
            toCheckout.classList.toggle('pointer-events-none', items.length === 0);
            toCheckout.classList.toggle('opacity-40', items.length === 0);

            lines.innerHTML = items.map((i) => `
                <article class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-card">
                    <div class="flex gap-4 sm:gap-5">
                        <div class="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl bg-slate-100 overflow-hidden">
                            <img src="${esc(i.img)}" alt="" loading="lazy" decoding="async"
                                 onerror="this.onerror=null;this.src='/assets/img/product-placeholder.svg'"
                                 class="w-full h-full object-contain p-2">
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-start justify-between gap-4">
                                <h3 class="font-bold text-slate-900 leading-snug">${esc(i.name)}</h3>
                                <span class="font-bold text-slate-900 tabular whitespace-nowrap">${Cart.naira(i.price * i.qty)}</span>
                            </div>
                            <p class="mt-1 text-sm text-slate-600">${esc(i.desc)}</p>
                            <p class="mt-1 text-xs text-slate-500 tabular">${Cart.naira(i.price)} each</p>

                            <div class="mt-4 flex items-center gap-4">
                                <div class="inline-flex items-center rounded-full border border-slate-300 p-1">
                                    <button type="button" data-dec="${esc(i.id)}" aria-label="One fewer ${esc(i.name)}"
                                            class="w-8 h-8 rounded-full text-slate-700 hover:bg-slate-100 transition">&minus;</button>
                                    <span class="w-9 text-center text-sm font-semibold tabular">${i.qty}</span>
                                    <button type="button" data-inc="${esc(i.id)}" aria-label="One more ${esc(i.name)}"
                                            class="w-8 h-8 rounded-full text-slate-700 hover:bg-slate-100 transition">+</button>
                                </div>
                                <button type="button" data-remove="${esc(i.id)}"
                                        class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 transition">
                                    <svg class="w-4 h-4"><use href="#i-trash"/></svg> Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </article>`).join('');

            const sub = Cart.total(items);
            document.querySelectorAll('[data-cart-subtotal]').forEach((el) => el.textContent = Cart.naira(sub));
            document.querySelectorAll('[data-cart-total]').forEach((el) => el.textContent = Cart.naira(sub));
            document.querySelectorAll('[data-cart-items]').forEach((el) => el.textContent = Cart.count(items));
        }

        lines.addEventListener('click', (e) => {
            const b = e.target.closest('button[data-inc], button[data-dec], button[data-remove]');
            if (!b) return;
            const items = Cart.read();
            if (b.dataset.remove) Cart.remove(b.dataset.remove);
            else {
                const id = b.dataset.inc || b.dataset.dec;
                const it = items.find((i) => i.id === id);
                if (it) Cart.setQty(id, it.qty + (b.dataset.inc ? 1 : -1));
            }
        });

        Cart.onChange(render);
        render();
    });
    </script>
"""

(ROOT / 'cart.html').write_text(
    shell('Your cart | Infonet Computers',
          'Review the items you have selected before sending the order to Infonet Computers, Port Harcourt.',
          '/cart', 'products', cart_body, cart_script), encoding='utf-8')
print('✅ cart.html written')


# ─────────────────────────────────────────────────────────────── checkout.html
checkout_body = page_head(
    'Almost there',
    'Checkout.',
    'Tell us who you are and how you want it. We confirm stock, the final amount and '
    'any delivery cost with you on WhatsApp before anything is paid.',
) + """
    <section class="py-12 lg:py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <div id="checkoutStage" class="grid lg:grid-cols-3 gap-8 items-start">
                <form id="orderForm" class="lg:col-span-2 space-y-6" novalidate>

                    <fieldset class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card">
                        <legend class="text-sm font-semibold uppercase tracking-[.14em] text-brand-600">Customer</legend>
                        <h2 class="mt-2 text-xl font-bold text-slate-900">Your details</h2>

                        <div class="mt-6 grid sm:grid-cols-2 gap-5">
                            <div>
                                <label for="coName" class="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                                <input type="text" id="coName" name="name" required autocomplete="name"
                                       class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition">
                            </div>
                            <div>
                                <label for="coPhone" class="block text-sm font-medium text-slate-700 mb-1.5">Phone / WhatsApp number</label>
                                <input type="tel" id="coPhone" name="phone" required autocomplete="tel" inputmode="tel"
                                       class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition">
                            </div>
                            <div class="sm:col-span-2">
                                <label for="coEmail" class="block text-sm font-medium text-slate-700 mb-1.5">Email address <span class="font-normal text-slate-500">(optional)</span></label>
                                <input type="email" id="coEmail" name="email" autocomplete="email" inputmode="email" placeholder="you@example.com"
                                       class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition">
                                <p class="mt-1.5 text-xs text-slate-500">Leave it here and we email you a copy of this order, from info@infonet.ng, the moment you send it over on WhatsApp.</p>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card">
                        <legend class="text-sm font-semibold uppercase tracking-[.14em] text-brand-600">Collection</legend>
                        <h2 class="mt-2 text-xl font-bold text-slate-900">How do you want it?</h2>
                        <p class="mt-2 text-sm text-slate-600">Delivery cost inside Port Harcourt is agreed with you on WhatsApp — it depends where you are.</p>

                        <!-- Choba is checked by default: it stocks everything; Garrison stocks laptops only (it repairs inverters and UPS units, but does not sell them). -->
                        <div class="mt-6 grid sm:grid-cols-3 gap-4">
                            <label class="flex items-start gap-3 rounded-xl border border-slate-300 p-4 cursor-pointer has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 transition">
                                <input type="radio" name="fulfil" value="Pickup at Garrison — 6 Aguma St, Garrison" class="mt-1 accent-brand-600">
                                <span class="leading-snug">
                                    <span class="block font-semibold text-slate-900">Pick up in Garrison</span>
                                    <span class="block text-sm text-slate-600">6 Aguma St · laptops only</span>
                                </span>
                            </label>
                            <label class="flex items-start gap-3 rounded-xl border border-slate-300 p-4 cursor-pointer has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 transition">
                                <input type="radio" name="fulfil" value="Pickup at Choba — Shop 59, Everyday Supermarket Plaza, Choba Junction" checked class="mt-1 accent-brand-600">
                                <span class="leading-snug">
                                    <span class="block font-semibold text-slate-900">Pick up at Choba</span>
                                    <span class="block text-sm text-slate-600">Shop 59, Everyday Supermarket Plaza</span>
                                </span>
                            </label>
                            <label class="flex items-start gap-3 rounded-xl border border-slate-300 p-4 cursor-pointer has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 transition">
                                <input type="radio" name="fulfil" value="Delivery" class="mt-1 accent-brand-600">
                                <span class="leading-snug">
                                    <span class="block font-semibold text-slate-900">Deliver it</span>
                                    <span class="block text-sm text-slate-600">Within Port Harcourt</span>
                                </span>
                            </label>
                        </div>

                        <div id="deliveryFields" hidden class="mt-5 space-y-5">
                            <div>
                                <label for="coArea" class="block text-sm font-medium text-slate-700 mb-1.5">Area</label>
                                <input type="text" id="coArea" name="area" placeholder="e.g. GRA Phase 2, Rumuola"
                                       class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition">
                            </div>
                            <div>
                                <label for="coAddress" class="block text-sm font-medium text-slate-700 mb-1.5">Full delivery address</label>
                                <textarea id="coAddress" name="address" rows="3" placeholder="House number, street, landmark&hellip;"
                                          class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"></textarea>
                            </div>
                        </div>

                        <div class="mt-5">
                            <label for="coNote" class="block text-sm font-medium text-slate-700 mb-1.5">Order note <span class="font-normal text-slate-500">(optional)</span></label>
                            <textarea id="coNote" name="note" rows="3" placeholder="Anything we should know?"
                                      class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"></textarea>
                        </div>
                    </fieldset>

                    <fieldset class="rounded-2xl border border-brand-200 bg-brand-50 p-6 sm:p-8">
                        <legend class="text-sm font-semibold uppercase tracking-[.14em] text-brand-700">Payment</legend>
                        <h2 class="mt-2 text-xl font-bold text-slate-900">Pay on collection</h2>
                        <p class="mt-2 text-sm text-slate-700">
                            Nothing is charged on this website and we never ask for card details here.
                            Pay in the shop by cash, bank transfer or POS when you collect — or when the
                            rider hands it over, if we are delivering.
                        </p>
                    </fieldset>

                    <div>
                        <button type="submit" id="placeOrder"
                                class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-4 text-base font-semibold text-white hover:bg-brand-700 transition">
                            Place order &amp; print receipt
                            <svg class="w-5 h-5"><use href="#i-printer"/></svg>
                        </button>
                        <p id="orderError" hidden class="mt-3 text-sm font-medium text-red-600"></p>
                        <p class="mt-3 text-xs text-slate-500">
                            This creates an order number and a receipt. Your details stay on this device until
                            you send the order to us.
                        </p>
                    </div>
                </form>

                <aside class="lg:sticky lg:top-28">
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
                        <h2 class="text-sm font-semibold uppercase tracking-[.14em] text-slate-500">Order summary</h2>
                        <div id="coSummary" class="mt-5 space-y-4">
                            <div class="skel-block flex gap-3" aria-hidden="true">
                                <div class="skel w-14 h-14 shrink-0 rounded-lg"></div>
                                <div class="flex-1">
                                    <div class="skel skel-line" style="width:70%"></div>
                                    <div class="skel skel-line mt-2" style="width:40%"></div>
                                </div>
                            </div>
                            <div class="skel-block flex gap-3" aria-hidden="true">
                                <div class="skel w-14 h-14 shrink-0 rounded-lg"></div>
                                <div class="flex-1">
                                    <div class="skel skel-line" style="width:55%"></div>
                                    <div class="skel skel-line mt-2" style="width:35%"></div>
                                </div>
                            </div>
                        </div>

                        <dl class="mt-5 pt-5 border-t border-slate-200 space-y-3 text-sm">
                            <div class="flex justify-between">
                                <dt class="text-slate-600">Subtotal</dt>
                                <dd class="font-semibold text-slate-900 tabular" data-cart-subtotal>₦0</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-slate-600">Delivery</dt>
                                <dd class="font-semibold text-amber-600">To be confirmed</dd>
                            </div>
                        </dl>

                        <div class="mt-5 pt-5 border-t border-slate-200 flex items-baseline justify-between">
                            <span class="text-lg font-bold text-slate-900">Product total</span>
                            <span class="text-xl font-bold text-slate-900 tabular" data-cart-total>₦0</span>
                        </div>

                        <p class="mt-4 text-xs text-slate-500">Any delivery cost is agreed on WhatsApp and is not included above.</p>
                        <a href="/cart" class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition">
                            &larr; Back to cart
                        </a>
                    </div>
                </aside>
            </div>

            <!-- ------------------------------------------------------- receipt -->
            <div id="receiptStage" hidden class="max-w-2xl mx-auto">
                <div class="text-center mb-8">
                    <span class="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-sm font-semibold text-emerald-700">
                        <svg class="w-4 h-4"><use href="#i-check"/></svg> Order created
                    </span>
                    <h2 class="mt-4 text-3xl font-bold tracking-tight text-slate-900">Here is your receipt.</h2>
                    <p class="mt-3 text-slate-600">
                        Send it to us on WhatsApp so we can confirm stock and set it aside.
                        Keep the order number — it is how we find your order in the shop.
                    </p>
                </div>

                <div class="rp-stage" id="printer">
                    <div class="rp-shell">
                        <div class="rp-display">
                            <span class="rp-dot" aria-hidden="true"></span>
                            <span id="rpStatus">Ready</span>
                        </div>
                        <div class="rp-slot"></div>
                    </div>

                    <div class="rp-feed rp-print">
                        <article class="rp-paper" id="rpPaper"></article>
                        <div id="rpTear" aria-hidden="true"></div>
                    </div>

                    <div id="rpActions" hidden class="w-[min(340px,100%)] mt-6 grid gap-2.5">
                        <button type="button" id="rpWhatsapp"
                                class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-6 py-3.5 font-semibold text-white hover:brightness-95 transition">
                            <svg class="w-5 h-5"><use href="#i-whatsapp"/></svg> Send order on WhatsApp
                        </button>
                        <button type="button" id="rpPrint"
                                class="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 font-semibold text-slate-100 hover:bg-white/10 transition">
                            <svg class="w-5 h-5"><use href="#i-printer"/></svg> Print receipt
                        </button>
                        <a href="/products"
                           class="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-slate-300 hover:text-white transition">
                            Start a new order
                        </a>
                    </div>

                    <p id="rpMailNote" hidden class="w-[min(340px,100%)] mt-4 text-center text-xs text-slate-400"></p>
                </div>

                <p class="mt-6 text-center text-xs text-slate-500">
                    Print sends this to an 80mm till roll, or to A4 on an office printer.
                </p>
            </div>
        </div>
    </section>
"""

checkout_script = r"""
    <script>
    // Same reason as cart.html: wait for the deferred script.js to have run.
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('orderForm');
        if (!form) return;

        const $ = (id) => document.getElementById(id);
        const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

        /* ------------------------------------------------------------ summary */
        function renderSummary() {
            const items = Cart.read();
            $('coSummary').innerHTML = items.map((i) => `
                <div class="flex gap-3">
                    <div class="w-14 h-14 shrink-0 rounded-lg bg-white border border-slate-200 overflow-hidden">
                        <img src="${esc(i.img)}" alt="" loading="lazy" decoding="async"
                             onerror="this.onerror=null;this.src='/assets/img/product-placeholder.svg'"
                             class="w-full h-full object-contain p-1">
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-semibold text-slate-900 leading-snug">${esc(i.name)}</p>
                        <p class="text-xs text-slate-500">Qty ${i.qty}</p>
                        <p class="text-sm font-bold text-slate-900 tabular">${Cart.naira(i.price * i.qty)}</p>
                    </div>
                </div>`).join('') ||
                '<p class="text-sm text-slate-500">Your cart is empty. <a href="/products" class="font-semibold text-brand-600">Browse products</a>.</p>';

            const sub = Cart.total(items);
            document.querySelectorAll('[data-cart-subtotal]').forEach((el) => el.textContent = Cart.naira(sub));
            document.querySelectorAll('[data-cart-total]').forEach((el) => el.textContent = Cart.naira(sub));
        }
        Cart.onChange(renderSummary);
        renderSummary();

        /* --------------------------------------------------- delivery toggle */
        const deliveryFields = $('deliveryFields');
        form.addEventListener('change', (e) => {
            if (e.target.name !== 'fulfil') return;
            const delivering = e.target.value === 'Delivery';
            deliveryFields.hidden = !delivering;
            $('coAddress').required = delivering;
        });

        /* ---------------------------------------------------- order numbers */
        // Sequential per day and kept on this device, so two orders in one
        // afternoon can never print the same number.
        function nextOrderNo(now) {
            const day = now.toISOString().slice(2, 10).replace(/-/g, '');
            try {
                const k = 'infonet.orderseq.' + day;
                const seq = (parseInt(localStorage.getItem(k) || '0', 10) || 0) + 1;
                localStorage.setItem(k, String(seq));
                return `INF-${day}-${String(seq).padStart(3, '0')}`;
            } catch {
                return `INF-${day}-${String(now.getTime() % 1000).padStart(3, '0')}`;
            }
        }

        /* --------------------------------------------------------- printing */
        const printer = $('printer');
        const setState = (cls, label) => {
            printer.classList.remove('is-processing', 'is-printing', 'is-done');
            if (cls) printer.classList.add(cls);
            $('rpStatus').textContent = label;
        };
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let order = null;

        const TEAR = `<svg class="rp-tear" viewBox="0 0 340 11" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 0 L0 11 L8.5 0 L17 11 L25.5 0 L34 11 L42.5 0 L51 11 L59.5 0 L68 11 L76.5 0 L85 11
                     L93.5 0 L102 11 L110.5 0 L119 11 L127.5 0 L136 11 L144.5 0 L153 11 L161.5 0 L170 11
                     L178.5 0 L187 11 L195.5 0 L204 11 L212.5 0 L221 11 L229.5 0 L238 11 L246.5 0 L255 11
                     L263.5 0 L272 11 L280.5 0 L289 11 L297.5 0 L306 11 L314.5 0 L323 11 L331.5 0 L340 11
                     L340 0 Z" fill="#fbfaf7"/></svg>`;

        function buildReceipt(data) {
            const rows = data.items.map((i) => `
                <div class="rp-row" style="margin-top:7px"><span>${esc(i.name)}</span></div>
                <div class="rp-row rp-small" style="color:#57534e">
                    <span>${i.qty} &times; ${Cart.naira(i.price)}</span>
                    <span class="r">${Cart.naira(i.price * i.qty)}</span>
                </div>`).join('');

            $('rpPaper').innerHTML = `
                <img class="rp-logo" src="/assets/img/infonet-mark-print.png" alt="" aria-hidden="true" width="320" height="320">
                <div class="rp-center rp-brand">INFONET</div>
                <div class="rp-center rp-small">COMPUTERS LTD</div>
                <div class="rp-center rp-small">6 Aguma St, Garrison<br>Shop 59, Everyday Supermarket Plaza, Choba Jn<br>Port Harcourt, Rivers State<br>0905 646 7027 &middot; 0803 667 5119<br>info@infonet.ng &middot; infonet.ng</div>
                <hr>
                <div class="rp-row rp-small"><span>ORDER</span><span class="r">${esc(data.no)}</span></div>
                <div class="rp-row rp-small"><span>DATE</span><span class="r">${esc(data.when)}</span></div>
                <div class="rp-row rp-small"><span>CUSTOMER</span><span class="r">${esc(data.name)}</span></div>
                <div class="rp-row rp-small"><span>PHONE</span><span class="r">${esc(data.phone)}</span></div>
                ${data.email ? `<div class="rp-small" style="word-break:break-all">EMAIL ${esc(data.email)}</div>` : ''}
                <hr>
                ${rows}
                <hr>
                <div class="rp-row"><span>Items</span><span class="r">${data.count}</span></div>
                <div class="rp-row rp-grand"><span>TOTAL</span><span class="r">${Cart.naira(data.subtotal)}</span></div>
                <hr>
                <div class="rp-small">${esc(data.fulfil.toUpperCase())}</div>
                ${data.address ? `<div class="rp-small">${esc(data.address)}</div>` : ''}
                <div class="rp-small">DELIVERY COST NOT INCLUDED</div>
                <div class="rp-small">PAYMENT ON COLLECTION</div>
                <div class="rp-small">Cash &middot; transfer &middot; POS in store</div>
                ${data.note ? `<hr><div class="rp-small">NOTE: ${esc(data.note)}</div>` : ''}
                <hr>
                <div class="rp-center rp-small">Not a tax invoice.<br>Stock is confirmed on WhatsApp<br>before collection.</div>
                <div class="rp-center rp-small" style="margin-top:8px">Thank you.</div>
                <div class="rp-barcode" aria-hidden="true"></div>
                <div class="rp-center rp-small" style="letter-spacing:.18em">${esc(data.no)}</div>`;
            $('rpTear').innerHTML = TEAR;
        }

        /* ----------------------------------------------------------- submit */
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const err = $('orderError');
            const items = Cart.read();

            const fail = (msg) => { err.textContent = msg; err.hidden = false; };
            err.hidden = true;

            if (!items.length) return fail('Your cart is empty — add something first.');
            const name = $('coName').value.trim();
            const phone = $('coPhone').value.trim();
            if (!name) return fail('Please tell us your name.');
            if (phone.replace(/\D/g, '').length < 10) return fail('Please enter a phone number we can reach you on.');

            // Email is optional. If it is there it has to be usable, because a
            // typo means a confirmation that silently goes nowhere.
            const email = $('coEmail').value.trim();
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
                return fail('That email address does not look right. Check it, or clear the field and carry on without one.');
            }

            const fulfil = form.querySelector('input[name="fulfil"]:checked').value;
            const delivering = fulfil === 'Delivery';
            const address = delivering
                ? [$('coArea').value.trim(), $('coAddress').value.trim()].filter(Boolean).join(' — ')
                : '';
            if (delivering && !address) return fail('Please add the delivery address.');

            const now = new Date();
            order = {
                no: nextOrderNo(now),
                when: now.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }),
                name, phone, email,
                fulfil: delivering ? 'Delivery in Port Harcourt' : fulfil,
                address,
                note: $('coNote').value.trim(),
                items,
                subtotal: Cart.total(items),
                count: Cart.count(items),
            };

            buildReceipt(order);
            $('checkoutStage').hidden = true;
            $('receiptStage').hidden = false;
            window.scrollTo({ top: 0, behavior: 'smooth' });

            setState('is-processing', 'Processing');
            setTimeout(() => {
                setState('is-printing', 'Printing');
                setTimeout(() => {
                    setState('is-done', 'Complete');
                    $('rpActions').hidden = false;
                    // The order is on paper now; the cart has done its job.
                    Cart.clear();
                }, reduced ? 0 : 2400);
            }, reduced ? 0 : 1100);
        });

        $('rpPrint').addEventListener('click', () => window.print());

        /* ------------------------------------------------- email confirmation */
        // Fired on the WhatsApp handoff, never on "Place order": the order is
        // only real once the customer sends it to us. The send is deliberately
        // non-blocking — if /api/order is down, or the key is missing, or the
        // network drops on the way, the receipt and the WhatsApp message are
        // untouched. Email is the paper trail here, not the channel.
        const mailNote = $('rpMailNote');
        let mailSent = false;

        const say = (text) => { mailNote.textContent = text; mailNote.hidden = !text; };

        function sendConfirmation() {
            if (mailSent || !order || !order.email) return;
            mailSent = true;
            say('Emailing your copy to ' + order.email + '…');

            fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order),
                keepalive: true,
            })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
                .then(() => say('A copy of order ' + order.no + ' is on its way to ' + order.email + '.'))
                .catch(() => {
                    mailSent = false;   // let them try again from the same button
                    say('We could not email your copy just now — WhatsApp still has the order, and you can print the receipt above.');
                });
        }

        $('rpWhatsapp').addEventListener('click', () => {
            if (!order) return;
            const lines = order.items
                .map((i) => `• ${i.qty} × ${i.name} — ${Cart.naira(i.price * i.qty)}`).join('\n');
            const msg =
                `Hello Infonet, I placed an order on the website.\n\n` +
                `Order: ${order.no}\n${order.when}\n\n${lines}\n\n` +
                `Total: ${Cart.naira(order.subtotal)}\n${order.fulfil}` +
                (order.address ? `\n${order.address}` : '') +
                (order.note ? `\n\nNote: ${order.note}` : '') +
                `\n\nName: ${order.name}\nPhone: ${order.phone}` +
                (order.email ? `\nEmail: ${order.email}` : '') + `\n\n` +
                `Please confirm these are in stock.`;

            // window.open must be the synchronous first act of the click, or a
            // popup blocker eats the handoff. The mail goes out after it.
            window.infonetWA?.('checkout-order', `Order ${order.no}`);
            window.open('https://wa.me/2349056467027?text=' + encodeURIComponent(msg), '_blank', 'noopener');
            sendConfirmation();
        });
    });
    </script>
"""

(ROOT / 'checkout.html').write_text(
    shell('Checkout | Infonet Computers',
          'Send your order to Infonet Computers, Port Harcourt. Stock and any delivery cost are confirmed on WhatsApp; payment is on collection.',
          '/checkout', 'products', checkout_body, checkout_script), encoding='utf-8')
print('✅ checkout.html written')


# ═══════════════════════════════════════ repair.html · swap.html · choba.html · garrison.html
# Four public pages, generated whole like services.html. The two form pages hand off to
# WhatsApp (forms.js builds the message); the two shop pages are the "website" link for each
# Google Business Profile. Nothing here may state a price, a turnaround or a policy Daniel
# has not confirmed — the confirmed facts are in claude/infonet-shops-and-services.md.

def public_page(title: str, desc: str, path: str, active: str, body: str, *,
                schema=(), extra_scripts: str = '', cta: str = None) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
{head(title, desc, path, schema=schema)}
<body class="font-sans bg-white text-slate-700 antialiased">

{SPRITE}
{ANNOUNCE}
{nav(active)}
{body}
{CTA if cta is None else cta}
{FOOTER}
{FLOATING}
{SCRIPTS}{extra_scripts}</body>
</html>
"""


def webpage(path: str, name: str, about: str) -> dict:
    return {'@context': 'https://schema.org', '@type': 'WebPage', '@id': f'{SITE}{path}#webpage',
            'name': name, 'url': f'{SITE}{path}', 'isPartOf': {'@id': WEBSITE},
            'about': {'@id': about}, 'inLanguage': 'en-NG'}


def home_entity(at_id: str) -> dict:
    """The shop entity exactly as index.html publishes it, so the two copies cannot disagree."""
    import json
    for m in re.finditer(r'<script type="application/ld\+json">(\{.*?\})</script>', home):
        obj = json.loads(m.group(1))
        if obj.get('@id') == at_id:
            return obj
    sys.exit(f'✖ no {at_id} entity in index.html')


INPUT = ('w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 '
         'focus:ring-brand-500 focus:border-brand-500 outline-none transition')
LABEL = 'block text-sm font-medium text-slate-700 mb-1.5'


def pill(name: str, value: str, label: str, kind: str = 'checkbox', checked: bool = False,
         extra: str = '') -> str:
    """A checkbox/radio drawn as a pill. The input stays in the DOM (keyboard + screen
    readers); the span carries the look via peer-checked."""
    chk = ' checked' if checked else ''
    return (f'<label class="relative cursor-pointer"{extra}>'
            f'<input type="{kind}" name="{name}" value="{value}" class="peer sr-only"{chk}>'
            f'<span class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3.5 py-2 '
            f'text-sm font-medium text-slate-700 transition hover:border-brand-400 '
            f'peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700 '
            f'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 '
            f'peer-disabled:cursor-not-allowed peer-disabled:opacity-40">{label}</span></label>')


def promise_strip() -> str:
    items = [('cpu', 'Free diagnosis', 'Before any work starts'),
             ('check', 'You approve the price', 'Nothing is done without it'),
             ('shield', '30-day warranty', 'On every repair'),
             ('bolt', 'Same day', 'Except board, BIOS and inverter work')]
    return '\n'.join(f"""                    <li class="flex items-start gap-3">
                        <span class="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-50 text-brand-600 shrink-0"><svg class="w-[18px] h-[18px]"><use href="#i-{i}"/></svg></span>
                        <span class="text-sm leading-tight"><span class="block font-semibold text-slate-900">{h}</span><span class="block text-slate-500">{s}</span></span>
                    </li>""" for i, h, s in items)


# ─────────────────────────────────────────────────────────────────── repair.html
# Device → faults. Which shop can take it comes from the confirmed split: Garrison repairs
# laptops, inverters and UPS units; Choba repairs everything. Tablets are left out until
# Daniel confirms Choba repairs them.
REPAIR_DEVICES = [
    # (value, label, shops, faults)
    ('Phone', 'Phone', ['Choba'],
     ['Cracked screen', 'Battery drains fast', "Won't charge", 'Water damage', 'Camera',
      'Speaker or microphone', "Won't turn on", 'Stuck or software problem']),
    ('Laptop', 'Laptop', ['Garrison', 'Choba'],
     ['Screen', 'Keyboard', "Battery or won't charge", "Won't turn on", 'Slow or overheating',
      'Virus or software', 'Lost files (data recovery)', 'Upgrade (RAM / SSD)']),
    ('Desktop', 'Desktop or all-in-one', ['Choba'],
     ["Won't turn on", 'Slow or overheating', 'Virus or software', 'Lost files (data recovery)',
      'Upgrade (RAM / SSD)', 'No display']),
    ('Inverter or UPS', 'Inverter or UPS', ['Garrison', 'Choba'],
     ['Not charging batteries', "Won't power on", 'Beeping or alarm', 'Switches off under load',
      'Battery replacement']),
]

# Typical turnaround, as Daniel gave it on 2026-11-05: every repair is same day except
# board-level repairs, BIOS repairs and inverters. Do not add per-job times he has not given.
TURNAROUND = [
    ('Phone repairs — screens, batteries, charging ports, speakers, cameras', 'Same day'),
    ('Laptop and desktop repairs — screens, keyboards, batteries, upgrades, software', 'Same day'),
    ('Board-level repairs', 'Longer'),
    ('BIOS repairs', 'Longer'),
    ('Inverter and UPS repairs', 'Longer'),
]

repair_device_pills = '\n'.join(
    '                                    ' + pill('device', v, l, 'radio', i == 0)
    for i, (v, l, _s, _f) in enumerate(REPAIR_DEVICES))

repair_fault_groups = '\n'.join(
    f"""                                <div data-faults-for="{v}" class="flex flex-wrap gap-2"{'' if i == 0 else ' hidden'}>
{chr(10).join('                                    ' + pill('fault', f, f) for f in faults)}
                                    {pill('fault', 'Something else', 'Something else')}
                                </div>""" for i, (v, _l, _s, faults) in enumerate(REPAIR_DEVICES))

import json as _json
repair_shops_json = _json.dumps({v: s for v, _l, s, _f in REPAIR_DEVICES})

turnaround_html = ''
if TURNAROUND:
    rows = '\n'.join(f'                        <tr class="border-t border-slate-200"><td class="py-3 pr-4 text-slate-800">{j}</td><td class="py-3 font-semibold text-slate-900 tabular">{t}</td></tr>'
                     for j, t in TURNAROUND)
    turnaround_html = f"""
    <!-- ========================================================= turnaround -->
    <section id="turnaround" class="py-16 lg:py-20 bg-slate-50 border-y border-slate-200">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <span class="text-sm font-semibold uppercase tracking-[.14em] text-brand-600">How long</span>
            <h2 class="mt-2 text-3xl font-bold tracking-tight text-slate-900">Typical turnaround</h2>
            <p class="mt-3 text-slate-600">From when we have the device and you have approved the price. For the longer jobs, we give you a timeline with the quote, before we start.</p>
            <table class="mt-6 w-full text-sm">
                <tbody>
{rows}
                </tbody>
            </table>
        </div>
    </section>
"""

repair_body = page_head(
    'Repair quote',
    'Tell us what is wrong. We reply with a price.',
    'Pick the device and the fault, and WhatsApp opens with the message written for you. '
    'Diagnosis is free and nothing is fixed until you approve the price.',
) + f"""
    <section class="py-12 lg:py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-8">
            <div class="lg:col-span-3">
                <form id="repairForm" class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card" novalidate
                      data-shops='{repair_shops_json}'>
                    <fieldset>
                        <legend class="text-base font-bold text-slate-900">1. What needs fixing?</legend>
                        <div class="mt-3 flex flex-wrap gap-2">
{repair_device_pills}
                        </div>
                    </fieldset>

                    <div class="mt-6">
                        <label for="rqModel" class="{LABEL}">Brand and model</label>
                        <input type="text" id="rqModel" autocomplete="off" placeholder="e.g. HP EliteBook 840 G5, iPhone 13" class="{INPUT}">
                    </div>

                    <fieldset class="mt-6">
                        <legend class="text-base font-bold text-slate-900">2. What is it doing? <span class="font-normal text-sm text-slate-500">Pick all that apply</span></legend>
                        <div class="mt-3">
{repair_fault_groups}
                        </div>
                        <p id="rqFaultError" class="hidden mt-2 text-sm text-rose-600">Pick at least one, or choose “Something else” and describe it below.</p>
                    </fieldset>

                    <div class="mt-6">
                        <label for="rqDetails" class="{LABEL}">Anything else we should know? <span class="font-normal text-slate-500">(optional)</span></label>
                        <textarea id="rqDetails" rows="3" placeholder="When it started, what happened before — dropped, got wet, after an update…" class="{INPUT}"></textarea>
                    </div>

                    <fieldset class="mt-6">
                        <legend class="text-base font-bold text-slate-900">3. Which shop?</legend>
                        <div class="mt-3 flex flex-wrap gap-2">
                            {pill('shop', 'Choba', 'Choba Junction', 'radio', True)}
                            {pill('shop', 'Garrison', 'Garrison', 'radio')}
                        </div>
                        <p id="rqShopNote" class="mt-2 text-sm text-slate-500"></p>
                        <p id="rqTimeNote" class="hidden mt-1 text-sm text-slate-500">Inverter and UPS repairs take longer than a day — we give you the timeline with the quote.</p>
                    </fieldset>

                    <div class="mt-6">
                        <label for="rqName" class="{LABEL}">Your name <span class="font-normal text-slate-500">(optional)</span></label>
                        <input type="text" id="rqName" autocomplete="name" class="{INPUT}">
                    </div>

                    <button type="submit" class="mt-8 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-6 py-3.5 font-semibold text-white shadow-sm hover:brightness-95 transition">
                        <svg class="w-5 h-5"><use href="#i-whatsapp"/></svg>
                        Get my quote on WhatsApp
                    </button>
                    <p class="mt-3 text-sm text-slate-500">Got a photo of the damage? Send it in the chat once WhatsApp opens — it helps us quote faster.</p>
                </form>
            </div>

            <aside class="lg:col-span-2 space-y-6">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
                    <h2 class="text-lg font-bold text-slate-900">How it works</h2>
                    <ul class="mt-5 space-y-4">
{promise_strip()}
                    </ul>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                    <h2 class="text-lg font-bold text-slate-900">Where to bring it</h2>
                    <p class="mt-3 text-sm text-slate-600"><a href="/choba" class="font-semibold text-slate-900 hover:text-brand-600">Choba Junction</a> repairs everything: phones, laptops, desktops, inverters and UPS units.</p>
                    <p class="mt-2 text-sm text-slate-600"><a href="/garrison" class="font-semibold text-slate-900 hover:text-brand-600">Garrison</a> repairs laptops, inverters and UPS units.</p>
                    <p class="mt-4 text-sm text-slate-500">Mon–Wed &amp; Fri 9:00–6:00 · Thu 10:00–6:00 · Sat 10:00–5:00 · Sun closed</p>
                </div>
            </aside>
        </div>
    </section>
{turnaround_html}"""

(ROOT / 'repair.html').write_text(public_page(
    'Repair Quote — Phones, Laptops, Inverters | Infonet Computers, Port Harcourt',
    'Get a repair quote on WhatsApp for your phone, laptop, desktop, inverter or UPS. Free diagnosis, '
    'you approve the price first, 30-day warranty. Choba Junction and Garrison, Port Harcourt.',
    '/repair', 'services', repair_body,
    schema=(webpage('/repair', 'Repair quote', BUSINESS),
            breadcrumbs([('Home', '/'), ('Repairs', '/services'), ('Repair quote', None)])),
    extra_scripts='    <script src="/forms.js" defer></script>\n'), encoding='utf-8')
print('✅ repair.html written')


# ───────────────────────────────────────────────────────────────────── swap.html
swap_body = page_head(
    'Swap / trade-in',
    'Swap your old device for a better one.',
    'Tell us what you have and what you want. We reply on WhatsApp with what we can offer for yours '
    'and the difference to pay.',
) + f"""
    <section class="py-12 lg:py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-8">
            <div class="lg:col-span-3">
                <form id="swapForm" class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card" novalidate>
                    <fieldset>
                        <legend class="text-base font-bold text-slate-900">1. What do you have?</legend>
                        <div class="mt-3 flex flex-wrap gap-2">
                            {pill('have', 'Phone', 'Phone', 'radio', True)}
                            {pill('have', 'Tablet', 'Tablet', 'radio')}
                            {pill('have', 'Laptop', 'Laptop', 'radio')}
                            {pill('have', 'Desktop', 'Desktop', 'radio')}
                            {pill('have', 'Console', 'PlayStation', 'radio')}
                            {pill('have', 'Other device', 'Something else', 'radio')}
                        </div>
                    </fieldset>

                    <div class="mt-5 grid sm:grid-cols-2 gap-5">
                        <div class="sm:col-span-2">
                            <label for="swModel" class="{LABEL}">Brand and model</label>
                            <input type="text" id="swModel" list="swModels" autocomplete="off" required placeholder="e.g. iPhone 12 Pro" class="{INPUT}">
                            <p id="swModelError" class="hidden mt-1.5 text-sm text-rose-600">Tell us the model so we can price it.</p>
                        </div>
                        <div>
                            <label for="swStorage" class="{LABEL}">Storage <span class="font-normal text-slate-500">(optional)</span></label>
                            <input type="text" id="swStorage" placeholder="e.g. 128GB" class="{INPUT}">
                        </div>
                        <div data-phone-only>
                            <label for="swBattery" class="{LABEL}">Battery health <span class="font-normal text-slate-500">(optional)</span></label>
                            <input type="text" id="swBattery" inputmode="numeric" placeholder="e.g. 86%" class="{INPUT}">
                        </div>
                    </div>
                    <p data-phone-only class="mt-2 text-xs text-slate-500">On an iPhone: Settings → Battery → Battery Health.</p>

                    <fieldset class="mt-6">
                        <legend class="text-sm font-medium text-slate-700">Condition</legend>
                        <div class="mt-2 flex flex-wrap gap-2">
                            {pill('cond', 'Like new', 'Like new', 'radio')}
                            {pill('cond', 'Light scratches', 'Light scratches', 'radio', True)}
                            {pill('cond', 'Visible wear or dents', 'Visible wear or dents', 'radio')}
                            {pill('cond', 'Cracked or faulty', 'Cracked or faulty', 'radio')}
                        </div>
                    </fieldset>

                    <fieldset class="mt-5">
                        <legend class="text-sm font-medium text-slate-700">Comes with</legend>
                        <div class="mt-2 flex flex-wrap gap-2">
                            {pill('extras', 'Box', 'Box')}
                            {pill('extras', 'Charger', 'Charger')}
                            {pill('extras', 'Controller', 'Controller', extra=' data-console-only')}
                        </div>
                    </fieldset>

                    <h2 class="mt-8 pt-6 border-t border-slate-200 text-base font-bold text-slate-900">2. What do you want?</h2>
                    <div class="mt-3">
                        <label for="swWant" class="{LABEL}">The device you want</label>
                        <input type="text" id="swWant" list="swModels" autocomplete="off" required placeholder="e.g. iPhone 15 Pro Max, 256GB" class="{INPUT}">
                        <p id="swWantError" class="hidden mt-1.5 text-sm text-rose-600">Tell us what you want to swap up to.</p>
                        <datalist id="swModels"></datalist>
                    </div>

                    <fieldset class="mt-6">
                        <legend class="text-sm font-medium text-slate-700">Which shop?</legend>
                        <div class="mt-2 flex flex-wrap gap-2">
                            {pill('swshop', 'Choba', 'Choba Junction', 'radio', True)}
                            {pill('swshop', 'Garrison', 'Garrison', 'radio')}
                        </div>
                    </fieldset>

                    <div class="mt-5">
                        <label for="swName" class="{LABEL}">Your name <span class="font-normal text-slate-500">(optional)</span></label>
                        <input type="text" id="swName" autocomplete="name" class="{INPUT}">
                    </div>

                    <button type="submit" class="mt-8 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-6 py-3.5 font-semibold text-white shadow-sm hover:brightness-95 transition">
                        <svg class="w-5 h-5"><use href="#i-whatsapp"/></svg>
                        Get my swap offer on WhatsApp
                    </button>
                    <p class="mt-3 text-sm text-slate-500">Photos of the front, back and sides help — send them in the chat once WhatsApp opens.</p>
                </form>
            </div>

            <aside class="lg:col-span-2 space-y-6">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
                    <h2 class="text-lg font-bold text-slate-900">How a swap works</h2>
                    <ol class="mt-5 space-y-4 text-sm">
                        <li class="flex gap-3"><span class="flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-brand-600 tabular shrink-0">1</span><span class="text-slate-600"><span class="font-semibold text-slate-900">Send the details.</span> This form writes the WhatsApp message for you.</span></li>
                        <li class="flex gap-3"><span class="flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-brand-600 tabular shrink-0">2</span><span class="text-slate-600"><span class="font-semibold text-slate-900">Get an offer.</span> We reply with what we can give for yours and the difference to pay.</span></li>
                        <li class="flex gap-3"><span class="flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-brand-600 tabular shrink-0">3</span><span class="text-slate-600"><span class="font-semibold text-slate-900">Bring it in.</span> We check your device at the counter, you test the new one, and you pay the difference by cash, transfer or POS.</span></li>
                    </ol>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-sm">
                    <h2 class="text-lg font-bold text-slate-900">Before you come</h2>
                    <ul class="mt-4 space-y-2.5 text-slate-600">
                        <li class="flex gap-2.5"><svg class="w-4 h-4 mt-0.5 text-emerald-500 shrink-0"><use href="#i-check"/></svg>Back up your photos and chats</li>
                        <li class="flex gap-2.5"><svg class="w-4 h-4 mt-0.5 text-emerald-500 shrink-0"><use href="#i-check"/></svg>Sign out of iCloud or your Google account</li>
                        <li class="flex gap-2.5"><svg class="w-4 h-4 mt-0.5 text-emerald-500 shrink-0"><use href="#i-check"/></svg>Bring the box and charger if you have them</li>
                    </ul>
                    <p class="mt-5 text-slate-500">Swap at either shop: <a href="/choba" class="font-semibold text-slate-900 hover:text-brand-600">Choba Junction</a> or <a href="/garrison" class="font-semibold text-slate-900 hover:text-brand-600">Garrison</a>.</p>
                </div>
            </aside>
        </div>
    </section>
"""

(ROOT / 'swap.html').write_text(public_page(
    'Swap Your Phone, Tablet, Laptop or PlayStation | Infonet Computers, Port Harcourt',
    'Trade in your old phone, tablet, laptop, desktop or PlayStation and swap up at Infonet Computers — Choba Junction '
    'or Garrison, Port Harcourt. Send the details on WhatsApp and get an offer.',
    '/swap', 'phones', swap_body,
    schema=(webpage('/swap', 'Swap / trade-in', BUSINESS),
            breadcrumbs([('Home', '/'), ('Swap / trade-in', None)])),
    extra_scripts='    <script src="/phones.js" defer></script>\n    <script src="/forms.js" defer></script>\n'),
    encoding='utf-8')
print('✅ swap.html written')


# ─────────────────────────────────────────────────────────────── shop pages
HOURS_ROWS = [('Monday', '9:00 AM – 6:00 PM'), ('Tuesday', '9:00 AM – 6:00 PM'),
              ('Wednesday', '9:00 AM – 6:00 PM'), ('Thursday', '10:00 AM – 6:00 PM'),
              ('Friday', '9:00 AM – 6:00 PM'), ('Saturday', '10:00 AM – 5:00 PM'),
              ('Sunday', 'Closed')]


def hours_table() -> str:
    # data-day lets forms.js highlight today; the table reads fine without it.
    return '\n'.join(
        f'                            <tr data-day="{i}" class="border-t border-slate-200 first:border-0">'
        f'<td class="py-2 pr-4 text-slate-600">{d}</td><td class="py-2 text-right font-medium text-slate-900 tabular">{h}</td></tr>'
        for i, (d, h) in enumerate(HOURS_ROWS))


def tick_list(items) -> str:
    return '\n'.join(f'                        <li class="flex items-start gap-2.5"><svg class="w-4 h-4 mt-0.5 text-emerald-500 shrink-0"><use href="#i-check"/></svg><span>{t}</span></li>'
                     for t in items)


def shop_page(*, key, path, name, eyebrow, title, sub, address_html, map_url, map_label,
              sells, repairs, note, ctas, review_html='') -> str:
    return f"""    <!-- =============================================================== hero -->
    <section id="home" class="relative overflow-hidden hero-mesh text-white">
        <canvas class="mesh-canvas" aria-hidden="true"></canvas>
        <div class="absolute inset-0 hero-grid" aria-hidden="true"></div>
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10 sm:pt-14 sm:pb-12 lg:pt-16 lg:pb-14">
            <div class="max-w-3xl fade-in">
                <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium tracking-wide text-brand-100">
                    <span class="w-1.5 h-1.5 rounded-full bg-whatsapp"></span>
                    {eyebrow}
                </span>
                <h1 class="mt-5 sm:mt-6 text-[2rem] sm:text-5xl font-bold tracking-tight leading-[1.08] text-balance">{title}</h1>
                <p class="mt-4 sm:mt-5 text-base sm:text-lg text-brand-100/90">{sub}</p>
                <div class="mt-8 flex flex-wrap gap-3">
                    <a href="{map_url}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-brand-900 shadow-lg shadow-brand-950/30 hover:bg-brand-50 transition">
                        <svg class="w-4 h-4"><use href="#i-pin"/></svg> Get directions
                    </a>
                    <a href="tel:+2349056467027" class="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-white/10 transition">
                        <svg class="w-4 h-4"><use href="#i-phone"/></svg> Call 0905 646 7027
                    </a>
                </div>
            </div>
        </div>
    </section>

    <section class="py-14 lg:py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-6">
            <div class="rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
                <span class="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600"><svg class="w-5 h-5"><use href="#i-store"/></svg></span>
                <h2 class="mt-5 text-xl font-bold text-slate-900">What we sell here</h2>
                <ul class="mt-4 space-y-2.5 text-sm text-slate-700">
{tick_list(sells)}
                </ul>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
                <span class="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600"><svg class="w-5 h-5"><use href="#i-cpu"/></svg></span>
                <h2 class="mt-5 text-xl font-bold text-slate-900">What we repair here</h2>
                <ul class="mt-4 space-y-2.5 text-sm text-slate-700">
{tick_list(repairs)}
                </ul>
                <p class="mt-5 text-sm text-slate-500">Free diagnosis, you approve the price first, and a 30-day warranty on every repair.</p>
            </div>
            <div id="visit" class="rounded-2xl border border-slate-200 bg-slate-50 p-7">
                <span class="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-slate-200 text-brand-600"><svg class="w-5 h-5"><use href="#i-pin"/></svg></span>
                <h2 class="mt-5 text-xl font-bold text-slate-900">Visit</h2>
                <p class="mt-3 text-sm text-slate-700">{address_html}</p>
                <a href="{map_url}" target="_blank" rel="noopener" class="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">{map_label} <svg class="w-4 h-4"><use href="#i-arrow-right"/></svg></a>
                <table class="mt-5 w-full text-sm" aria-label="Opening hours">
                    <tbody>
{hours_table()}
                    </tbody>
                </table>
                <p class="mt-5 text-sm text-slate-600 tabular">
                    <a href="tel:+2349056467027" class="hover:text-brand-600">(+234) 905 646 7027</a> ·
                    <a href="tel:+2348036675119" class="hover:text-brand-600">(+234) 803 667 5119</a>
                </p>
                <p class="mt-1 text-sm text-slate-500">Pay by cash, bank transfer or POS.</p>
            </div>
        </div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                <svg class="w-5 h-5 mt-0.5 text-brand-600 shrink-0"><use href="#i-store"/></svg>
                <p>{note}</p>
            </div>
        </div>
    </section>

    <section class="pb-16 lg:pb-24 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
{ctas}
            </div>
{review_html}
        </div>
    </section>
"""


def cta_card(href, icon, title, text, external=False) -> str:
    tgt = ' target="_blank" rel="noopener"' if external else ''
    return f"""                <a href="{href}"{tgt} class="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card hover:border-brand-300 transition">
                    <span class="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600 shrink-0"><svg class="w-5 h-5"><use href="#i-{icon}"/></svg></span>
                    <span><span class="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-brand-700">{title} <svg class="w-4 h-4 transition group-hover:translate-x-0.5"><use href="#i-arrow-right"/></svg></span>
                    <span class="mt-1 block text-sm text-slate-600">{text}</span></span>
                </a>"""


GBP_GARRISON = 'https://share.google/cOpfwMZcM60pnfCzO'

choba_body = shop_page(
    key='choba', path='/choba', name='Choba Junction',
    eyebrow='Shop 59, Everyday Supermarket Plaza · Choba Junction',
    title='Infonet Computers at Choba Junction',
    sub='Phones, tablets, laptops and accessories, brand new or UK-used — and a repair bench for '
        'phones, computers, inverters and UPS units. Test any phone at the counter before you pay.',
    address_html='Shop 59, Everyday Supermarket Plaza,<br>Choba Junction, Port Harcourt, Rivers State',
    map_url=CHOBA_MAP, map_label='Open in Google Maps',
    sells=['Phones: iPhone, Samsung Galaxy, Google Pixel and Redmi, new and UK-used',
           'Tablets: iPad, Galaxy Tab and Redmi Pad',
           'PlayStation: PS5 Pro, Slim and the original, PS4, DualSense controllers and games',
           'Laptops, desktops and all-in-ones',
           'Monitors, printers, UPS units and accessories'],
    repairs=['Phones: screens, batteries, charging ports, water damage',
             'Laptops and desktops',
             'Inverters and UPS units',
             'Data recovery, virus removal and network setup'],
    note='Our main shop is at <a href="/garrison" class="font-semibold text-slate-900 hover:text-brand-600">6 Aguma St, Garrison</a> — '
         'laptops, plus inverter and UPS repair. Phones, tablets and consoles are at Choba only.',
    ctas='\n'.join([
        cta_card('/products?category=phones', 'smartphone', 'Browse phones', 'iPhone, Galaxy, Pixel and Redmi — ask for today’s price.'),
        cta_card('/swap', 'chat', 'Swap your device', 'Trade in what you have against something newer.'),
        cta_card('/repair', 'cpu', 'Get a repair quote', 'Pick the fault and send it on WhatsApp.'),
    ]),
)

garrison_body = shop_page(
    key='garrison', path='/garrison', name='Garrison',
    eyebrow='6 Aguma St, Garrison · Our main shop since 2004',
    title='Infonet Computers, Garrison',
    sub='Where Infonet started in 2004. Laptops to buy, brand new and UK-used, and a bench '
        'that repairs laptops, inverters and UPS units.',
    address_html='6 Aguma St, Garrison,<br>Port Harcourt 500101, Rivers State',
    map_url=GBP_GARRISON, map_label='Open our Google listing',
    sells=['Laptops, brand new and UK-used'],
    repairs=['Laptops: screens, hinges, batteries, keyboards, charging and power faults',
             'Inverters and UPS units that won’t charge, won’t change over, or beep and shut down'],
    note='Looking for a phone, a tablet, a PlayStation or a phone repair? Those are at our '
         '<a href="/choba" class="font-semibold text-slate-900 hover:text-brand-600">Choba Junction shop</a>, '
         'which stocks and repairs everything.',
    ctas='\n'.join([
        cta_card('/products?category=laptops', 'laptop', 'Browse laptops', 'Brand new and UK-used, with prices.'),
        cta_card('/repair', 'cpu', 'Get a repair quote', 'Pick the fault and send it on WhatsApp.'),
        cta_card('/swap', 'chat', 'Swap your device', 'Trade in your old laptop or phone against a better one.'),
    ]),
    review_html=f"""
            <div class="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div class="flex items-center gap-3">
                    <span class="flex items-center gap-0.5 text-amber-400"><svg class="w-5 h-5"><use href="#i-star"/></svg><svg class="w-5 h-5"><use href="#i-star"/></svg><svg class="w-5 h-5"><use href="#i-star"/></svg><svg class="w-5 h-5"><use href="#i-star"/></svg><svg class="w-5 h-5 opacity-40"><use href="#i-star"/></svg></span>
                    <span class="text-sm text-slate-700"><span class="font-bold text-slate-900 tabular">4.5</span> on Google, from real customers</span>
                </div>
                <a href="{GBP_GARRISON}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">Read the reviews <svg class="w-4 h-4"><use href="#i-arrow-right"/></svg></a>
            </div>""",
)

for slug, body, title, desc, at_id, crumb in [
    ('choba', choba_body,
     'Phone & Laptop Shop at Choba Junction, Port Harcourt | Infonet Computers',
     'Infonet Computers at Shop 59, Everyday Supermarket Plaza, Choba Junction: iPhone, Samsung, Pixel '
     'and Redmi phones, tablets, PlayStation consoles and laptops, new and UK-used, plus phone, laptop, inverter and UPS repair.',
     CHOBA, 'Choba Junction shop'),
    ('garrison', garrison_body,
     'Laptop Shop & Repairs in Garrison, Port Harcourt | Infonet Computers',
     'Infonet Computers, 6 Aguma St, Garrison, Port Harcourt, since 2004: laptops new and UK-used, '
     'laptop repair, and inverter and UPS repair.',
     BUSINESS, 'Garrison shop'),
]:
    (ROOT / f'{slug}.html').write_text(public_page(
        title, desc, f'/{slug}', 'about', body,
        schema=(home_entity(at_id), webpage(f'/{slug}', crumb, at_id),
                breadcrumbs([('Home', '/'), (crumb, None)])),
        extra_scripts='    <script src="/forms.js" defer></script>\n'), encoding='utf-8')
    print(f'✅ {slug}.html written')


# ═════════════════════════════════════════════════════ phone pages (/phones/<slug>)
# One page so far: the iPhone Duo. The buy box is the model's own catalogue card from
# phones.js (rendered bare), so storage, condition, price and the WhatsApp message have one
# source. Apple's imagery, supplied by Daniel; originals in Images/phones. Facts checked against
# apple.com/iphone-duo (Nov 2026) — the wording is ours.

def duo_highlights() -> str:
    P = '/assets/img/phones/'
    def srcset(k): return f'{P}duo-{k}-800.webp 800w, {P}duo-{k}-1600.webp 1600w'
    sizes = '(min-width: 1024px) 720px, (min-width: 640px) 72vw, 86vw'
    slides = [
        ('design-white', 'Thin and light, open or folded.', 'Star White or Night Sky.',
         'Three iPhone Duo in Star White: folded, fully open, and half open for a photo'),
        ('display', 'The biggest screen on any iPhone.', '7.6 inches open, 5.4 inches folded.',
         'iPhone Duo fully open in landscape, its 7.6-inch screen showing the lock screen'),
        ('modes', 'Stand it, open it, prop it up.', 'A bedside clock, two apps side by side, or a workout hands-free.',
         'Three iPhone Duo set up three ways: as a standing clock, open like a book, and propped open like a laptop'),
        ('camera', 'Two 48MP cameras.', 'Shoot from the front or the back — the outer screen shows your subject the shot.',
         'Hands holding an open iPhone Duo with its two rear cameras facing out and a portrait on the outer screen'),
        ('titanium', 'Titanium frame and hinge.', 'Grade 5 titanium, Ceramic Shield front and back, IP68.',
         'Side view of an open iPhone Duo, showing its titanium frame, hinge and buttons'),
        ('siri', 'Siri AI, built in.', 'Ask it things, plan your day, get things done in your apps. English only for now.',
         'iPhone Duo screen where Siri has added a tennis match to the calendar'),
    ]
    n = len(slides)
    sw = ('class="relative w-7 h-7 rounded-full ring-1 ring-slate-300 ring-offset-2 aria-[pressed=true]:ring-2 '
          'aria-[pressed=true]:ring-slate-900 before:absolute before:-inset-2 before:content-[\'\']"')
    lis = []
    for i, (k, h, sub, alt) in enumerate(slides):
        extra = scope = imgattr = ''
        if k == 'design-white':
            scope, imgattr = ' data-swatch-scope', ' data-swatch-img'
            extra = f"""
                                <div class="mt-3 flex justify-center gap-4" data-swatches role="group" aria-label="Finish">
                                    <button type="button" aria-pressed="true" aria-label="Star White" title="Star White" {sw} style="background:#e9e6e1"
                                            data-src="{P}duo-design-white-800.webp" data-srcset="{srcset('design-white')}" data-alt="{alt}"></button>
                                    <button type="button" aria-pressed="false" aria-label="Night Sky" title="Night Sky" {sw} style="background:#2b3a52"
                                            data-src="{P}duo-design-blue-800.webp" data-srcset="{srcset('design-blue')}" data-alt="Three iPhone Duo in Night Sky: folded, fully open, and half open for a photo"></button>
                                </div>"""
        lis.append(f"""                    <li class="snap-start shrink-0 w-[86%] sm:w-[72%] lg:w-[60%] flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white" role="group" aria-roledescription="slide" aria-label="{i + 1} of {n}"{scope}>
                        <div class="px-5 pt-6 sm:px-8 sm:pt-8 text-center">
                            <h3 class="text-lg sm:text-2xl font-semibold tracking-tight text-slate-900 text-balance">{h}</h3>
                            <p class="mt-1 text-sm sm:text-base text-slate-500 text-balance">{sub}</p>{extra}
                        </div>
                        <img src="{P}duo-{k}-800.webp" srcset="{srcset(k)}" sizes="{sizes}"
                             alt="{alt}" width="1600" height="1000" loading="lazy" decoding="async" draggable="false"{imgattr}
                             class="mt-auto w-full aspect-[16/10] object-contain">
                    </li>""")
    dot = ("relative h-2 rounded-full bg-slate-300 transition-all w-2 before:absolute before:-inset-y-3 "
           "before:-inset-x-1.5 before:content-[''] aria-[current=true]:w-6 aria-[current=true]:bg-slate-900")
    dots = '\n'.join(f'                <button type="button" data-carousel-dot="{i}" aria-label="Highlight {i + 1}" class="{dot}"></button>'
                     for i in range(n))
    arrow = ('flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-900 '
             'hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-default')
    nl = '\n'
    return f"""    <!-- Highlights, after Apple's "Get the highlights" strip. A native scroll-snap strip: swipe works
         without JS; script.js adds the arrows, dots and the Star White / Night Sky swap. -->
    <section class="py-12 lg:py-16 bg-slate-50 border-y border-slate-200" aria-labelledby="duo-hl">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-carousel aria-roledescription="carousel" aria-label="iPhone Duo highlights">
            <div class="mb-5 flex items-end justify-between gap-4">
                <h2 id="duo-hl" class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Get the highlights.</h2>
                <div class="hidden sm:flex gap-2">
                    <button type="button" data-carousel-prev aria-label="Previous highlight" class="{arrow}"><svg class="w-5 h-5 rotate-180"><use href="#i-arrow-right"/></svg></button>
                    <button type="button" data-carousel-next aria-label="Next highlight" class="{arrow}"><svg class="w-5 h-5"><use href="#i-arrow-right"/></svg></button>
                </div>
            </div>
            <ul data-carousel-track tabindex="0"
                class="-mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-0 sm:scroll-px-0 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&amp;::-webkit-scrollbar]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-3xl">
{nl.join(lis)}
            </ul>
            <div class="mt-5 flex justify-center gap-3">
{dots}
            </div>
        </div>
    </section>
"""


DUO_SPECS = [
    ('Screens', '7.6-inch folding Super Retina XDR inside, with a nano-texture finish · 5.4-inch Super Retina XDR outside'),
    ('Chip', 'A20 Pro, vapour-cooled'),
    ('Rear cameras', '48MP Fusion Main and 48MP Fusion Ultra Wide · up to 2x optical-quality zoom · 4K video at up to 120 fps'),
    ('Front camera', '12MP Center Stage, under the display'),
    ('Battery', 'Dual-battery system'),
    ('Build', 'Grade 5 titanium frame and hinge cover · Ceramic Shield front and back · IP68 water and dust resistance'),
    ('Storage', '256GB, 512GB or 1TB'),
    ('Finishes', 'Star White and Night Sky'),
    ('Siri', 'Siri AI with Apple Intelligence (English)'),
]

duo_body = f"""    <!-- ======================================================== product header -->
    <section class="bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 lg:pt-10 lg:pb-16">
            <nav aria-label="Breadcrumb" class="text-sm text-slate-500">
                <ol class="flex flex-wrap items-center gap-1.5">
                    <li><a href="/" class="hover:text-brand-600">Home</a></li>
                    <li aria-hidden="true">/</li>
                    <li><a href="/products?category=phones" class="hover:text-brand-600">Phones</a></li>
                    <li aria-hidden="true">/</li>
                    <li><a href="/products?category=phones&amp;sub=iPhone" class="hover:text-brand-600">iPhone</a></li>
                    <li aria-hidden="true">/</li>
                    <li aria-current="page" class="text-slate-900 font-medium">iPhone Duo</li>
                </ol>
            </nav>
            <div class="mt-6 grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                <div class="lg:col-span-7 min-w-0">
                    <p class="text-sm font-semibold uppercase tracking-[.14em] text-brand-600">New · Apple's first foldable</p>
                    <h1 class="mt-2 text-[2.25rem] sm:text-5xl font-bold tracking-tight text-slate-900">iPhone Duo</h1>
                    <p class="mt-3 text-base sm:text-lg text-slate-600 max-w-xl">A phone when it's folded, a 7.6-inch screen when it's open. At our Choba Junction shop, brand new or <span class="whitespace-nowrap">UK-used</span>.</p>
                    <div class="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                        <video data-inview-play muted loop playsinline preload="metadata" poster="/assets/video/iphone-duo-poster.webp"
                               width="800" height="660" class="w-full object-cover" aria-label="An iPhone Duo being unfolded, used open, then closed">
                            <source src="/assets/video/iphone-duo.mp4" type="video/mp4">
                        </video>
                    </div>
                </div>
                <!-- The buy box: phones.js renders the Duo's catalogue card into #duoBuy. The link below is
                     what shows without JS. -->
                <div class="lg:col-span-5 lg:sticky lg:top-28">
                    <div id="duoBuy" class="min-h-[22rem]">
                        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                            <p class="text-lg font-bold text-slate-900">Price on request</p>
                            <p class="text-xs text-slate-500">Moves with the market — we quote today's rate.</p>
                            <a href="https://wa.me/2349056467027?text=Hello%20Infonet%2C%20I%27m%20interested%20in%20the%20iPhone%20Duo.%20What%27s%20today%27s%20price%2C%20and%20is%20it%20in%20stock%3F" target="_blank" rel="noopener"
                               class="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                                <svg class="w-4 h-4"><use href="#i-whatsapp"/></svg> Get today’s price
                            </a>
                        </div>
                    </div>
                    <a href="/swap?have=Phone&amp;want=iPhone%20Duo" class="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm hover:border-brand-300 transition">
                        <svg class="w-5 h-5 text-brand-600 shrink-0"><use href="#i-chat"/></svg>
                        <span><span class="font-semibold text-slate-900">Swap your old phone towards it.</span> <span class="text-slate-600">Tell us what you have and we'll make an offer.</span></span>
                        <svg class="ml-auto w-4 h-4 text-slate-400 shrink-0"><use href="#i-arrow-right"/></svg>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== intro, after Apple's "Foldable design" opener.
         Facts from apple.com/iphone-duo; the wording is ours. The darker phrases are the facts. -->
    <section class="py-16 sm:py-24 lg:py-28 bg-white" aria-labelledby="duo-intro">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p class="text-base sm:text-xl font-semibold text-slate-900">Foldable design</p>
            <h2 id="duo-intro" class="mt-3 sm:mt-4 text-[2.75rem] leading-[1.05] sm:text-6xl lg:text-[5.5rem] font-bold tracking-tight text-slate-900 text-balance">An iPhone that opens up.</h2>
            <p class="mt-6 sm:mt-8 text-lg sm:text-xl lg:text-2xl leading-relaxed text-slate-500 text-balance">
                iPhone Duo is the first iPhone that folds. Open it and you get
                <span class="text-slate-900">the biggest screen ever on an iPhone — about half as big again as the iPhone 18 Pro Max's</span>,
                on <span class="text-slate-900">the thinnest iPhone yet</span>. Close it and the outer screen still gives you
                <span class="text-slate-900">over 90 percent of an iPhone 18 Pro's screen area</span>.
                Stand it up, open it like a book or prop it on a table — iOS rearranges itself to suit.
            </p>
        </div>
    </section>

{duo_highlights()}
    <!-- ======================================================== key facts -->
    <section class="py-12 lg:py-16 bg-white" aria-labelledby="duo-specs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="duo-specs" class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Key facts.</h2>
            <dl class="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 border-t border-slate-200">
{chr(10).join(f'                <div class="border-b border-slate-200 py-4"><dt class="text-sm font-semibold text-slate-900">{k}</dt><dd class="mt-1 text-sm text-slate-600">{v}</dd></div>' for k, v in DUO_SPECS)}
            </dl>
            <p class="mt-4 text-xs text-slate-500">From Apple's published specifications. The finish and storage in stock vary — ask us before you come.</p>
        </div>
    </section>
"""

DUO_SCRIPT = """    <script src="/phones.js" defer></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const P = window.InfonetPhones, box = document.getElementById('duoBuy');
            const p = P && P.records.find((r) => r.page === '/phones/iphone-duo');
            if (p && box) box.innerHTML = P.card(p, { bare: true });
        });
    </script>
"""

(ROOT / 'phones').mkdir(exist_ok=True)
(ROOT / 'phones' / 'iphone-duo.html').write_text(public_page(
    'iPhone Duo — New and UK-used, Port Harcourt | Infonet Computers',
    "Buy Apple's foldable iPhone Duo at Infonet Computers, Choba Junction, Port Harcourt: 256GB, 512GB or 1TB, "
    'brand new or UK-used. 7.6-inch inner screen, two 48MP cameras, titanium frame. Get today\'s price on WhatsApp.',
    '/phones/iphone-duo', 'phones', duo_body,
    schema=(webpage('/phones/iphone-duo', 'iPhone Duo', CHOBA),
            breadcrumbs([('Home', '/'), ('Phones', '/products?category=phones'), ('iPhone Duo', None)])),
    extra_scripts=DUO_SCRIPT), encoding='utf-8')
print('✅ phones/iphone-duo.html written')


# ═════════════════════════════════════════════════════ game pages (/games/<slug>)
# GTA VI, laid out after its PlayStation Store page (Daniel's screenshots): key art across the
# top, a buy panel overlapping it, the game's details beside it, then the trailers. The image
# carousel on the Store is replaced by Rockstar's trailers (supplied by Daniel), which open in
# script.js's full-screen player. Each ends as the GTA VI logo fades out (Rockstar end cards cut). Price, cart id and art match the homepage GTA card and the
# catalogue record in phones.js — change all three together.

GTA_CART = dict(id='grand-theft-auto-vi-ps5-disc-new', name='Grand Theft Auto VI — PS5 disc (New)',
                desc='2026 · Official disc, sealed', price='150000',
                img='/assets/img/consoles/gta-vi-key-art-768.webp')
GTA_WA = ('https://wa.me/2349056467027?text=Hello%20Infonet%2C%20I%27d%20like%20to%20reserve%20Grand%20Theft%20Auto%20VI'
          '%20for%20PS5%20at%20%E2%82%A6150%2C000.%20Is%20it%20in%20stock%20at%20Choba%3F')
GTA_TRAILERS = [   # (file number, duration, spoken duration, what the thumbnail shows)
    (3, '1:21', '1 minute 21 seconds', 'Lucia and Jason in a red convertible'),
    (1, '2:42', '2 minutes 42 seconds', 'A man on a motorbike swinging at a low-flying plane'),
    (2, '1:25', '1 minute 25 seconds', 'Vice City beach from the air'),
]


def gta_feature(icon_path: str, text: str) -> str:
    return f"""                        <li class="flex items-start gap-3">
                            <svg class="mt-0.5 w-6 h-6 shrink-0 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{icon_path}</svg>
                            <span>{text}</span>
                        </li>"""


GTA_ICONS = {
    'bag': '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    'offline': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    'player': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    'remote': '<path d="M7 9h10a4 4 0 0 1 4 4l.6 4.2a2 2 0 0 1-3.6 1.5L16 16H8l-2 2.7a2 2 0 0 1-3.6-1.5L3 13a4 4 0 0 1 4-4Z"/><path d="M12 3v3"/>',
    'pro': '<rect x="8" y="2.5" width="8" height="19" rx="2"/><path d="M12 6v12"/>',
    'pad': '<path d="M7 9h10a4 4 0 0 1 4 4l.6 4.2a2 2 0 0 1-3.6 1.5L16 16H8l-2 2.7a2 2 0 0 1-3.6-1.5L3 13a4 4 0 0 1 4-4Z"/><path d="M8 12v2M7 13h2M16 12.5h.01M15 14h.01"/>',
}


def gta_trailers() -> str:
    cards = []
    for n, dur, spoken, shows in GTA_TRAILERS:
        cards.append(f"""                <li class="snap-start shrink-0 w-[78%] sm:w-auto">
                    <button type="button" data-video-open
                            data-src="/assets/video/gta6-trailer-{n}.mp4" data-poster="/assets/video/gta6-trailer-{n}-poster.webp"
                            data-title="Grand Theft Auto VI — official trailer ({dur})"
                            aria-label="Play the official trailer, {spoken}, full screen"
                            class="group block w-full text-left focus:outline-none">
                        <span class="relative block aspect-video overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 transition group-hover:ring-white/40 group-focus-visible:ring-2 group-focus-visible:ring-white">
                            <img src="/assets/video/gta6-trailer-{n}-thumb.webp" alt="{shows}" width="640" height="360" loading="lazy" decoding="async"
                                 class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]">
                            <span class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" aria-hidden="true"></span>
                            <span class="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lift transition group-hover:scale-110" aria-hidden="true">
                                <svg class="ml-1 h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>
                            </span>
                            <span class="absolute bottom-2.5 right-2.5 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-semibold tabular text-white">{dur}</span>
                        </span>
                        <span class="mt-3 block text-sm font-semibold text-white">Official trailer</span>
                        <span class="block text-xs text-white/55">Rockstar Games · {dur}</span>
                    </button>
                </li>""")
    return '\n'.join(cards)


_m = re.search(r'<h2 id="gta-promo-title"[^>]*><span class="sr-only">Grand Theft Auto VI</span>(<svg .*?</svg>)</h2>', home, re.S)
if not _m:
    sys.exit('✖ GTA title SVG not found in index.html')
# same drawing, sized for the panel: full width of the panel up to 24rem, with the hard drop shadow
GTA_TITLE_SVG = re.sub(r'class="[^"]*"', 'class="block h-auto w-full max-w-[24rem] drop-shadow-[0_3px_0_rgba(0,0,0,.55)]"', _m.group(1), count=1)

GTA_PRICE_SVG = (ROOT / 'tools' / 'svg' / 'gta-vi-price.svg').read_text(encoding='utf-8').strip().replace(
    '<svg ', '<svg class="block h-auto w-[11.5rem] sm:w-[13rem] drop-shadow-[0_3px_0_rgba(0,0,0,.55)]" ', 1)

# On the GTA page the "Need a machine today…" band gives way to the homepage PS4 → PS5 trade-in
# card (Daniel, 2026-11-20), lifted from index.html so the two stay identical, on the page's dark ground.
_m = re.search(r'(    <!-- =+ PS4 → PS5 -->.*?\n    </section>\n)', home, re.S)
if not _m:
    sys.exit('✖ PS4 → PS5 trade-in section not found in index.html')
GTA_TRADE_IN = _m.group(1).replace('class="pb-16 lg:pb-24 bg-white" aria-labelledby="ps-upgrade-title"',
                                   'class="pb-16 lg:pb-24 bg-[#0d0c12]" aria-labelledby="ps-upgrade-title"', 1)
if 'bg-[#0d0c12]' not in GTA_TRADE_IN:
    sys.exit('✖ trade-in section class changed in index.html — update GTA_TRADE_IN')

GTA_BADGE = 'rounded-[3px] border border-white/80 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white'

gta_body = f"""    <div class="bg-[#0d0c12] text-white">
    <!-- ======================================================== hero + buy panel -->
    <section class="relative">
        <div class="relative h-[62vw] max-h-[640px] min-h-[230px] overflow-hidden sm:h-[50vw] lg:h-[600px]">
            <img src="/assets/img/consoles/gta-vi-jason-lucia-1280.webp"
                 srcset="/assets/img/consoles/gta-vi-jason-lucia-768.webp 768w, /assets/img/consoles/gta-vi-jason-lucia-1280.webp 1280w, /assets/img/consoles/gta-vi-jason-lucia-1920.webp 1920w"
                 sizes="100vw" alt="Grand Theft Auto VI key art: Lucia and Jason in front of the Vice City skyline at sunset"
                 width="1920" height="1080" fetchpriority="high" decoding="async"
                 class="absolute inset-0 h-full w-full object-cover object-[62%_30%]">
            <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0d0c12] to-transparent" aria-hidden="true"></div>
        </div>

        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-24 lg:-mt-56 pb-12 lg:pb-16">
            <div class="grid lg:grid-cols-12 gap-10 lg:gap-12">
                <!-- Buy panel. The cart button is the same item as the homepage GTA card and the catalogue card. -->
                <div class="lg:col-span-5 rounded-2xl bg-[#1d1b25]/95 p-6 sm:p-8 lg:p-10 shadow-lift ring-1 ring-white/10 backdrop-blur">
                    <nav aria-label="Breadcrumb" class="text-xs text-white/55">
                        <ol class="flex flex-wrap items-center gap-1.5">
                            <li><a href="/" class="hover:text-white">Home</a></li><li aria-hidden="true">/</li>
                            <li><a href="/products?category=consoles" class="hover:text-white">PlayStation</a></li><li aria-hidden="true">/</li>
                            <li aria-current="page" class="text-white/80">Grand Theft Auto VI</li>
                        </ol>
                    </nav>
                    <!-- Title in Pricedown Black, the same outlines as the homepage GTA card (lifted from
                         index.html by GTA_TITLE_SVG, so the two cannot drift). The font itself is
                         desktop-licensed and never served; screen readers get the sr-only text. -->
                    <h1 class="mt-5 text-white"><span class="sr-only">Grand Theft Auto VI</span>{GTA_TITLE_SVG}</h1>
                    <p class="mt-3 text-sm font-semibold text-white/90">Rockstar Games</p>
                    <p class="mt-3 flex flex-wrap gap-1.5">
                        <span class="{GTA_BADGE}">PS5</span><span class="{GTA_BADGE}">Standard edition</span><span class="{GTA_BADGE}">PS5 Pro Enhanced</span><span class="{GTA_BADGE}">Disc</span>
                    </p>

                    <!-- Price in Pricedown too: tools/svg/gta-vi-price.svg, drawn by tools/render-heading.py
                         ("₦150,000" — the naira sign is the font's N with two bars). Redraw it when the price changes. -->
                    <p class="mt-7 text-white"><span class="sr-only">₦150,000</span>{GTA_PRICE_SVG}</p>
                    <p class="mt-1 text-sm text-white/60">The official PS5 disc, sealed.</p>

                    <div class="mt-6 grid gap-3">
                        <button type="button" data-add-to-cart
                                data-id="{GTA_CART['id']}" data-name="{GTA_CART['name']}" data-desc="{GTA_CART['desc']}"
                                data-price="{GTA_CART['price']}" data-img="{GTA_CART['img']}"
                                class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-base font-semibold text-slate-900 transition hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1d1b25]">
                            <svg class="w-5 h-5"><use href="#i-cart"/></svg> Add to cart
                        </button>
                        <a href="{GTA_WA}" target="_blank" rel="noopener"
                           class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/35 px-6 text-sm font-semibold text-white transition hover:bg-white/10">
                            <svg class="w-4 h-4 text-whatsapp"><use href="#i-whatsapp"/></svg> Reserve on WhatsApp
                        </a>
                    </div>

                    <ul class="mt-6 space-y-2.5 text-sm text-white/70">
                        <li class="flex gap-2.5"><svg class="w-4 h-4 mt-0.5 shrink-0 text-white/50"><use href="#i-pin"/></svg>At our Choba Junction shop — pick it up, or we deliver.</li>
                        <li class="flex gap-2.5"><svg class="w-4 h-4 mt-0.5 shrink-0 text-white/50"><use href="#i-check"/></svg>Plays on every PS5. A Digital Edition or PS5 Pro needs the disc drive attached.</li>
                    </ul>
                    <div class="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-sm font-semibold">
                        <a href="/products?category=consoles" class="inline-flex items-center gap-1.5 text-white/80 hover:text-white">No PS5 yet? See consoles <svg class="w-4 h-4"><use href="#i-arrow-right"/></svg></a>
                        <a href="/swap?have=Console&amp;model=PlayStation%204&amp;want=PlayStation%205%20Slim" class="inline-flex items-center gap-1.5 text-white/80 hover:text-white">Trade in your PS4 <svg class="w-4 h-4"><use href="#i-arrow-right"/></svg></a>
                    </div>
                </div>

                <!-- The game's details, as listed on its PlayStation Store page. -->
                <div class="lg:col-span-7 lg:pt-60 grid gap-8 sm:grid-cols-3 text-[15px] text-white/90">
                    <ul class="space-y-4">
{gta_feature(GTA_ICONS['bag'], 'In-game purchases optional')}
{gta_feature(GTA_ICONS['offline'], 'Offline play enabled')}
{gta_feature(GTA_ICONS['player'], '1 player')}
{gta_feature(GTA_ICONS['remote'], 'Remote Play supported')}
                    </ul>
                    <div>
                        <p class="font-semibold text-white">PS5 version</p>
                        <ul class="mt-3 space-y-4">
{gta_feature(GTA_ICONS['pro'], 'PS5 Pro Enhanced')}
{gta_feature(GTA_ICONS['pad'], 'Vibration and trigger effects on the DualSense controller')}
                        </ul>
                    </div>
                    <div>
                        <p class="flex items-center gap-3">
                            <span class="flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-sm border-2 border-white text-white" aria-hidden="true">
                                <span class="text-xl font-black leading-none">M</span><span class="mt-0.5 text-[9px] font-bold leading-none">17+</span>
                            </span>
                            <span class="font-semibold text-white">Mature 17+ <span class="block text-xs font-normal text-white/55">ESRB rating</span></span>
                        </p>
                        <p class="mt-3 text-sm text-white/70">Blood and gore, intense violence, mature humour, nudity, strong language, strong sexual content, use of drugs and alcohol. In-game purchases.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== trailers -->
    <!-- Where the PlayStation Store has an image carousel. Each thumbnail opens the trailer full
         screen with controls and a Back button (script.js). Files are 720p H.264, preload none:
         nothing downloads until a trailer is tapped. -->
    <section class="border-t border-white/10 py-12 lg:py-16" aria-labelledby="gta-trailers">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-end justify-between gap-4">
                <h2 id="gta-trailers" class="text-2xl sm:text-3xl font-light tracking-tight">Trailers</h2>
                <p class="text-sm text-white/55">Tap to watch full screen</p>
            </div>
            <ul class="mt-6 -mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-0 flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&amp;::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:overflow-visible">
{gta_trailers()}
            </ul>
        </div>
    </section>
    </div>

    <!-- Full-screen player (script.js). Hidden until a trailer is tapped. -->
    <div id="videoPlayer" hidden class="fixed inset-0 z-[100] bg-black" role="dialog" aria-modal="true" aria-labelledby="videoPlayerTitle">
        <video controls playsinline preload="none" class="absolute inset-0 h-full w-full bg-black object-contain"></video>
        <div class="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-3 bg-gradient-to-b from-black/75 to-transparent px-3 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-5">
            <button type="button" data-video-back
                    class="pointer-events-auto inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white/15 pl-3 pr-4 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <svg class="w-5 h-5 rotate-180"><use href="#i-arrow-right"/></svg> Back
            </button>
            <p id="videoPlayerTitle" data-video-title class="min-w-0 truncate text-sm font-medium text-white/85"></p>
        </div>
    </div>
"""

GTA_PRODUCT = {
    '@context': 'https://schema.org', '@type': 'Product', '@id': f'{SITE}/games/gta-vi#product',
    'name': 'Grand Theft Auto VI — PS5 disc', 'brand': {'@type': 'Brand', 'name': 'Rockstar Games'},
    'image': f'{SITE}/assets/img/consoles/gta-vi-jason-lucia-1280.webp',
    'description': 'Grand Theft Auto VI for PlayStation 5, the official disc, sealed.',
    'offers': {'@type': 'Offer', 'price': '150000', 'priceCurrency': 'NGN', 'availability': 'https://schema.org/InStock',
               'itemCondition': 'https://schema.org/NewCondition', 'url': f'{SITE}/games/gta-vi', 'seller': {'@id': CHOBA}},
}

(ROOT / 'games').mkdir(exist_ok=True)
(ROOT / 'games' / 'gta-vi.html').write_text(public_page(
    'Grand Theft Auto VI for PS5 — ₦150,000, Port Harcourt | Infonet Computers',
    'Buy Grand Theft Auto VI for PS5 at Infonet Computers, Choba Junction, Port Harcourt: the official disc, sealed, '
    '₦150,000. Pick it up or we deliver. Watch the trailers.',
    '/games/gta-vi', 'phones', gta_body, cta=GTA_TRADE_IN,
    schema=(GTA_PRODUCT, webpage('/games/gta-vi', 'Grand Theft Auto VI', CHOBA),
            breadcrumbs([('Home', '/'), ('PlayStation', '/products?category=consoles'), ('Grand Theft Auto VI', None)]))),
    encoding='utf-8')
print('✅ games/gta-vi.html written')



# ═════════════════════════════════════════════════════ product pages (/laptops/<slug>)
# Moved to Node, Nov 2026: data/stock.json → api/_lib/render.mjs, run by `npm run build`
# (tools/stock.mjs) and by the admin on save. Nothing to do here.
