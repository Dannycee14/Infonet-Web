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

FLOATING = """    <!-- Back to Top Button -->
    <button id="backToTop" title="Back to top" aria-label="Back to top"
            class="fixed bottom-8 right-6 sm:right-8 bg-slate-900 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lift hover:bg-slate-800 transition opacity-0 invisible cursor-pointer z-40">
        <i class="fas fa-arrow-up"></i>
    </button>

    <!-- WhatsApp Button -->
    <button id="whatsappBtn" title="Chat with us on WhatsApp" aria-label="Chat with us on WhatsApp"
            class="fixed bottom-24 right-6 sm:right-8 bg-whatsapp text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lift hover:brightness-95 transition opacity-0 invisible cursor-pointer z-40">
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
    """active is one of: home, laptops, products, services."""
    items = [
        ('home', 'Home', '/'),
        ('laptops', 'Laptops', '/products?category=laptops'),
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
            <div class="flex items-center justify-between h-20">
                <a href="/" class="flex items-center gap-3 shrink-0">
                    <img src="/assets/img/infonet-mark.webp" alt="Infonet Computers logo" class="h-10 w-10" width="512" height="512" decoding="async">
                    <span class="leading-tight">
                        <span class="block text-lg font-extrabold tracking-[.02em] text-slate-900">INFONET</span>
                        <span class="block text-[11px] uppercase tracking-[.14em] text-slate-500">Computers LTD</span>
                    </span>
                </a>

                <div class="hidden md:flex items-center gap-1">
{desktop}
                </div>

                <div class="hidden md:flex items-center gap-3">
                    <a href="tel:+2349056467027" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-brand-600 transition">
                        <svg class="w-4 h-4 text-brand-600"><use href="#i-phone"/></svg>
                        <span class="tabular">0905 646 7027</span>
                    </a>
                    <a href="{WA}" target="_blank" rel="noopener"
                       class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition">
                        <svg class="w-4 h-4"><use href="#i-whatsapp"/></svg>
                        WhatsApp
                    </a>
                </div>

                <button id="mobile-menu-button" type="button" aria-label="Toggle menu" aria-controls="mobile-menu"
                        class="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-slate-700 hover:bg-slate-100 transition">
                    <svg class="w-6 h-6"><use href="#i-menu"/></svg>
                </button>
            </div>
        </div>

        <div id="mobile-menu" class="hidden md:hidden border-t border-slate-200 bg-white">
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
                        <span class="block text-brand-100/70">{sub_}</span>
                    </span>
                </div>""" for icon, head, sub_ in chips)

    return f"""    <!-- =============================================================== hero -->
    <section id="home" class="relative overflow-hidden hero-mesh text-white">
        <canvas class="mesh-canvas" aria-hidden="true"></canvas>
        <div class="absolute inset-0 hero-grid" aria-hidden="true"></div>

        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12 lg:pt-16 lg:pb-14">
            <div class="max-w-3xl fade-in">
                <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium tracking-wide text-brand-100">
                    <span class="w-1.5 h-1.5 rounded-full bg-whatsapp"></span>
                    {eyebrow}
                </span>
                <h1 class="mt-6 text-4xl sm:text-5xl font-bold tracking-tight leading-[1.08] text-balance">{title}</h1>
                <p class="mt-5 text-lg text-brand-100/90">{sub}</p>
{ctas}
            </div>

            <div class="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5 border-t border-white/15 pt-7">
{chip_html}
            </div>
        </div>
    </section>
"""


# ─────────────────────────────────────────────────────────────── services.html
services_hero_ctas = f"""
                <div class="mt-8 flex flex-wrap gap-3">
                    <a href="#request" class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-brand-900 shadow-lg shadow-brand-950/30 hover:bg-brand-50 transition">
                        Book a repair
                        <svg class="w-4 h-4"><use href="#i-arrow-right"/></svg>
                    </a>
                    <a href="{WA}" target="_blank" rel="noopener"
                       class="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-white/10 transition">
                        <svg class="w-5 h-5"><use href="#i-whatsapp"/></svg>
                        Ask a question first
                    </a>
                </div>"""

SERVICES = [
    ('computer-repair', 'laptop-medical', 'Computer repair',
     'Screens, boards, batteries, keyboards, charging and power faults — laptops and desktops.',
     ['Screen and hinge replacement', 'Battery and charging faults', 'Keyboard and trackpad', 'No-power and board-level diagnosis']),
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

svc_cards = '\n'.join(f"""                <div id="{sid}" class="service-card scroll-mt-32 rounded-2xl border border-slate-200 bg-white p-7 shadow-card fade-in">
                    <span class="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white mb-5">
                        <i class="fas fa-{icon} text-lg"></i>
                    </span>
                    <h2 class="text-lg font-bold text-slate-900">{title}</h2>
                    <p class="mt-2 text-sm text-slate-600">{desc}</p>
                    <ul class="mt-5 space-y-2.5 text-sm text-slate-700">
{chr(10).join(f'''                        <li class="flex items-start gap-2.5">
                            <svg class="w-4 h-4 mt-0.5 text-emerald-500 shrink-0"><use href="#i-check"/></svg>
                            {b}
                        </li>''' for b in bullets)}
                    </ul>
                </div>""" for sid, icon, title, desc, bullets in SERVICES)

services_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Computer Repair &amp; IT Services in Port Harcourt | Infonet Computers</title>
    <meta name="description" content="Laptop and desktop repair, virus removal, data recovery, upgrades and network setup in Port Harcourt. Free diagnostics, 30-day warranty, same-day service on most faults.">
    <link rel="canonical" href="https://infonet.ng/services">
    <meta name="theme-color" content="#0d1c45">
    <meta name="geo.region" content="NG-RI">
    <meta name="geo.placename" content="Port Harcourt">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Infonet Computers LTD">
    <meta property="og:title" content="Computer Repair &amp; IT Services in Port Harcourt | Infonet Computers">
    <meta property="og:description" content="Laptop and desktop repair, virus removal, data recovery, upgrades and network setup in Port Harcourt. Free diagnostics, 30-day warranty, same-day service on most faults.">
    <meta property="og:url" content="https://infonet.ng/services">
    <meta property="og:image" content="https://infonet.ng/assets/img/og-card.png">
    <meta property="og:locale" content="en_NG">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Computer Repair &amp; IT Services in Port Harcourt | Infonet Computers">
    <meta name="twitter:description" content="Laptop and desktop repair, virus removal, data recovery, upgrades and network setup in Port Harcourt. Free diagnostics, 30-day warranty, same-day service on most faults.">
    <meta name="twitter:image" content="https://infonet.ng/assets/img/og-card.png">

    <link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">
    <link rel="icon" href="/assets/img/infonet-mark.webp" sizes="any" type="image/webp">
    <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
    <link rel="stylesheet" href="/assets/site.css">

    <script type="application/ld+json">{{"@context":"https://schema.org","@type":"WebPage","name":"Computer Repair & IT Services","url":"https://infonet.ng/services","about":{{"@id":"https://infonet.ng/#business"}}}}</script>
</head>
<body class="font-sans bg-white text-slate-700 antialiased">

{SPRITE}
{ANNOUNCE}
{nav('services')}
{page_hero(
    'Nkpogu, Port Harcourt · Bench open Mon–Sat',
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

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
{svc_cards}
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
    <section id="request" class="py-16 lg:py-24 bg-white scroll-mt-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="max-w-2xl mb-10 fade-in">
                <span class="text-sm font-semibold uppercase tracking-[.14em] text-brand-600">Book it</span>
                <h2 class="mt-2 text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Request a service</h2>
                <p class="mt-3 text-lg text-slate-600">The fastest route is WhatsApp. The form below opens your mail app with the details filled in.</p>
            </div>

            <div class="grid lg:grid-cols-5 gap-8">
                <div class="lg:col-span-2 fade-in">
                    <div class="h-full rounded-2xl border border-slate-200 bg-slate-50 p-8">
                        <h3 class="text-lg font-bold text-slate-900">What to bring</h3>
                        <ul class="mt-5 space-y-3 text-sm text-slate-700">
                            <li class="flex items-start gap-2.5">
                                <svg class="w-4 h-4 mt-0.5 text-emerald-500 shrink-0"><use href="#i-check"/></svg>
                                The machine and its charger
                            </li>
                            <li class="flex items-start gap-2.5">
                                <svg class="w-4 h-4 mt-0.5 text-emerald-500 shrink-0"><use href="#i-check"/></svg>
                                Any password needed to log in
                            </li>
                            <li class="flex items-start gap-2.5">
                                <svg class="w-4 h-4 mt-0.5 text-emerald-500 shrink-0"><use href="#i-check"/></svg>
                                When the fault started, and what you were doing
                            </li>
                        </ul>

                        <div class="mt-8 pt-6 border-t border-slate-200 space-y-5 text-sm">
                            <div class="flex items-start gap-4">
                                <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-brand-600 shrink-0">
                                    <svg class="w-5 h-5"><use href="#i-pin"/></svg>
                                </span>
                                <div>
                                    <h4 class="font-semibold text-slate-900">The bench</h4>
                                    <p class="mt-1 text-slate-600">6 Chief Aguma St, Nkpogu,<br>Port Harcourt 500101, Rivers State</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-4">
                                <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-brand-600 shrink-0">
                                    <svg class="w-5 h-5"><use href="#i-clock"/></svg>
                                </span>
                                <div>
                                    <h4 class="font-semibold text-slate-900">Open</h4>
                                    <p class="mt-1 text-slate-600">Mon–Fri 9:00 AM – 6:00 PM<br>Sat 10:00 AM – 5:00 PM · Sun closed</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-4">
                                <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-brand-600 shrink-0">
                                    <svg class="w-5 h-5"><use href="#i-phone"/></svg>
                                </span>
                                <div>
                                    <h4 class="font-semibold text-slate-900">Phone</h4>
                                    <p class="mt-1 text-slate-600 tabular">
                                        <a href="tel:+2349056467027" class="hover:text-brand-600">(+234) 905 646 7027</a><br>
                                        <a href="tel:+2348036675119" class="hover:text-brand-600">(+234) 803 667 5119</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-3 fade-in delay-2">
                    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
                        <h3 class="text-lg font-bold text-slate-900 mb-6">Submit your request</h3>
                        <form id="serviceForm">
                            <div class="grid sm:grid-cols-2 gap-5">
                                <div>
                                    <label for="fullname" class="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                                    <input type="text" id="fullname" required
                                           class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition">
                                </div>
                                <div>
                                    <label for="email" class="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                                    <input type="email" id="email" required
                                           class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition">
                                </div>
                            </div>

                            <div class="mt-5">
                                <label for="service" class="block text-sm font-medium text-slate-700 mb-1.5">Service needed</label>
                                <select id="service" required
                                        class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition">
                                    <option value="">Select a service</option>
                                    <option value="Computer Repair">Computer repair</option>
                                    <option value="Data Backup and Recovery">Data backup &amp; recovery</option>
                                    <option value="Security and Virus Removal">Security &amp; virus removal</option>
                                    <option value="Network Setup">Network setup</option>
                                    <option value="Maintenance and Upgrades">Maintenance &amp; upgrades</option>
                                    <option value="Tech Support">Tech support</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div class="mt-5">
                                <label for="issue" class="block text-sm font-medium text-slate-700 mb-1.5">Describe the fault</label>
                                <textarea id="issue" rows="5" required placeholder="What is it doing, and when did it start?"
                                          class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"></textarea>
                            </div>

                            <div class="mt-5">
                                <label for="attachment" class="block text-sm font-medium text-slate-700 mb-1.5">Attach a photo or document <span class="font-normal text-slate-500">(optional)</span></label>
                                <input type="file" id="attachment" accept="image/*,.pdf,.doc,.docx"
                                       class="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700">
                                <p class="mt-1.5 text-xs text-slate-500">The file is not sent by the form — attach it in your mail app after clicking submit, or send it on WhatsApp.</p>
                            </div>

                            <div class="mt-6 flex flex-wrap items-center gap-3">
                                <button type="submit"
                                        class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white hover:bg-brand-700 transition">
                                    Send request <i class="fas fa-paper-plane"></i>
                                </button>
                                <a href="https://wa.me/2349056467027?text=Hello%20Infonet%2C%20I%20need%20help%20with%20a%20service%20request."
                                   target="_blank" rel="noopener"
                                   class="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-6 py-3.5 font-semibold text-slate-900 hover:border-slate-400 transition">
                                    <svg class="w-5 h-5 text-whatsapp"><use href="#i-whatsapp"/></svg>
                                    Or send it on WhatsApp
                                </a>
                            </div>
                            <p class="mt-3 text-xs text-slate-500">The form opens your mail app with the details already filled in.</p>
                        </form>
                        <p id="formSuccess" class="hidden mt-4 text-emerald-600 font-medium"></p>
                    </div>
                </div>
            </div>
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


prod = prod.replace('<meta name="theme-color" content="#1c5be4">',
                    '<meta name="theme-color" content="#0d1c45">')
prod = prod.replace('<body class="font-sans bg-gray-50">',
                    '<body class="font-sans bg-white text-slate-700 antialiased">')

# 1. sprite + announcement + nav replace the old nav
prod = sub1(r'    <!-- Navigation -->.*?</nav>\n',
            f'{SPRITE}\n{ANNOUNCE}\n{nav("products")}', prod, 'nav')

# 2. page hero + toolbar replace the old heading / search / filter block
old_head = r'    <!-- Products Section -->.*?<div id="subcategoryFilter"[^>]*></div>\n'
new_head = page_hero(
    'Nkpogu, Port Harcourt · Walk-in store',
    'Everything we stock, in one place.',
    'Stock moves weekly and prices move with the market, so treat this as the catalogue rather than the shelf — message us to confirm what is in today and what it costs.',
    [('store', 'Buy in person', 'See it before you pay'),
     ('badge', 'Tested before it leaves', 'Set up and checked'),
     ('chat', 'Ask on WhatsApp', 'A human replies'),
     ('shield', 'We service what we sell', '30-day repair warranty')],
) + """
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
CARD = """<article class="product-card group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card fade-in">
                            <div class="product-image relative aspect-[4/3] overflow-hidden bg-slate-100">
                                <img src="${p.img}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='/assets/img/product-placeholder.svg'" alt="${p.name}" class="w-full h-full object-contain p-5">
                                <span class="absolute left-3 top-3 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-brand-700 shadow-sm">${p.subcategory || p.category}</span>
                            </div>
                            <div class="flex flex-1 flex-col p-5">
                                <h3 class="font-bold leading-snug text-slate-900">${p.name}</h3>
                                <p class="mt-1.5 text-sm text-slate-600">${p.desc}</p>
                                <p class="mt-4 text-lg font-bold text-slate-900 tabular">${p.price}</p>
                                <a href="https://wa.me/2349056467027?text=${encodeURIComponent(`Hello Infonet, I'm interested in the ${p.name} (${p.price}). Is it in stock?`)}"
                                   target="_blank" rel="noopener"
                                   class="mt-auto pt-4 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white">
                                   <span class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 transition hover:bg-brand-700">
                                       <i class="fab fa-whatsapp"></i> Enquire on WhatsApp
                                   </span></a>
                            </div>
                        </article>"""
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

(ROOT / 'products.html').write_text(prod, encoding='utf-8')
print('✅ products.html restyled')
