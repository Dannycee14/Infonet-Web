#!/usr/bin/env python3
"""One-shot source transform: CDN removal, asset rewrite, SEO heads, link normalisation.

Run once against the original pages. After this, the HTML is the source of truth
and this script is kept only as a record of what changed.
"""
import json, pathlib, re, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://infonet.ng"
MANIFEST = json.loads((ROOT / "assets/img/manifest.json").read_text())

RENAME = {
    "Infonet_main.html": "index.html",
    "Services.html": "services.html",
    "product_page.html": "products.html",
}
# old href -> new href (order matters: longest first)
LINKS = [
    ("Infonet_main.html", "/"),
    ("Services.html", "/services"),
    ("product_page.html", "/products"),
    ("produt_page.html", "/products"),   # typo on the homepage
]

ORG_LD = {
    "@context": "https://schema.org",
    "@type": "ComputerStore",
    "@id": f"{SITE}/#business",
    "name": "Infonet Computers",
    "description": "Computer sales, repairs and IT support in Port Harcourt, Rivers State. "
                   "Laptops, desktops, accessories, data recovery and networking since 2004.",
    "url": SITE + "/",
    "telephone": "+2349056467027",
    "email": "danielobialor121@gmail.com",
    "image": f"{SITE}/assets/img/infonet-logo-05.webp",
    "logo": f"{SITE}/assets/img/infonet-logo-05.webp",
    "priceRange": "₦₦",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "6 Aguma Street, Garrison",
        "addressLocality": "Port Harcourt",
        "postalCode": "500101",
        "addressRegion": "Rivers State",
        "addressCountry": "NG",
    },
    "areaServed": {"@type": "City", "name": "Port Harcourt"},
    "sameAs": [
        "https://www.facebook.com/share/1GDwLvtaSJ/",
        "https://www.instagram.com/infonet_computers",
    ],
    "openingHoursSpecification": [
        {"@type": "OpeningHoursSpecification",
         "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
         "opens": "09:00", "closes": "18:00"},
        {"@type": "OpeningHoursSpecification",
         "dayOfWeek": ["Saturday"], "opens": "10:00", "closes": "17:00"},
    ],
}

PAGES = {
    "index.html": dict(
        path="/",
        title="Infonet Computers | Laptop Sales & Computer Repair in Port Harcourt",
        desc="Buy laptops, desktops and accessories, or book a computer repair in Port Harcourt. "
             "Infonet Computers, 6 Aguma St, Garrison — sales, repairs, data recovery and "
             "networking since 2004.",
        ld=ORG_LD,
    ),
    "services.html": dict(
        path="/services",
        title="Computer Repair & IT Services in Port Harcourt | Infonet Computers",
        desc="Laptop and desktop repair, virus removal, data recovery, upgrades and network setup "
             "in Port Harcourt. Request a service and we respond the same working day.",
        ld={"@context": "https://schema.org", "@type": "WebPage",
            "name": "Computer Repair & IT Services",
            "url": f"{SITE}/services",
            "about": {"@id": f"{SITE}/#business"}},
    ),
    "products.html": dict(
        path="/products",
        title="Laptops, Desktops & Accessories for Sale | Infonet Computers Port Harcourt",
        desc="Browse laptops, desktops, monitors, printers and accessories in stock at Infonet "
             "Computers, Port Harcourt. Prices in naira — message us on WhatsApp to reserve.",
        ld={"@context": "https://schema.org", "@type": "CollectionPage",
            "name": "Products", "url": f"{SITE}/products",
            "about": {"@id": f"{SITE}/#business"}},
    ),
}

HEAD_TMPL = """<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{desc}">
    <link rel="canonical" href="{canonical}">
    <meta name="theme-color" content="#1c5be4">
    <meta name="geo.region" content="NG-RI">
    <meta name="geo.placename" content="Port Harcourt">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Infonet Computers">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{desc}">
    <meta property="og:url" content="{canonical}">
    <meta property="og:image" content="{site}/assets/img/infonet-logo-05.webp">
    <meta property="og:locale" content="en_NG">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{desc}">
    <meta name="twitter:image" content="{site}/assets/img/infonet-logo-05.webp">

    <link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">
    <link rel="icon" href="/assets/img/infonet-logo-05.webp" sizes="any" type="image/webp">
    <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
{preconnect}    <link rel="stylesheet" href="/assets/site.css">
{preload}
    <script type="application/ld+json">{ld}</script>
</head>"""


def build_head(name, cfg, extra_preconnect=(), preload=""):
    pre = "".join(f'    <link rel="preconnect" href="{h}" crossorigin>\n' for h in extra_preconnect)
    return HEAD_TMPL.format(
        title=cfg["title"], desc=cfg["desc"], canonical=SITE + cfg["path"], site=SITE,
        preconnect=pre, preload=preload,
        ld=json.dumps(cfg["ld"], ensure_ascii=False, separators=(",", ":")),
    )


def rewrite_links(html):
    for old, new in LINKS:
        html = html.replace(f'href="{old}#', f'href="{new}#')
        html = html.replace(f'href="{old}?', f'href="{new}?')
        html = html.replace(f'href="{old}"', f'href="{new}"')
    return html


IMG_RE = re.compile(r"<img\b[^>]*?>", re.S)
SRC_RE = re.compile(r'src="([^"]+)"')


def rewrite_images(html, lazy_from_pct):
    total = len(html)

    def repl(m):
        tag = m.group(0)
        s = SRC_RE.search(tag)
        if not s:
            return tag
        src = s.group(1)
        key = src.replace("%20", " ")
        pct = m.start() * 100 // total
        lazy = pct >= lazy_from_pct
        if key in MANIFEST:
            info = MANIFEST[key]
            tag = tag.replace(f'src="{src}"', 'src="/{}"'.format(info["path"]))
            if "width=" not in tag:
                tag = tag[:-1].rstrip() + f' width="{info["w"]}" height="{info["h"]}">'
        if "loading=" not in tag and "${" not in src:
            attrs = 'loading="lazy" decoding="async"' if lazy else 'decoding="async"'
            tag = tag[:-1].rstrip() + f" {attrs}>"
        return tag

    return IMG_RE.sub(repl, html)


def strip_cdn(html):
    html = re.sub(r'\s*<script src="https://cdn\.tailwindcss\.com"></script>', "", html)
    html = re.sub(r'\s*<script src="https://kit\.fontawesome\.com/[^"]+"></script>', "", html)
    html = re.sub(r'\s*<link rel="stylesheet" href="https://cdnjs\.cloudflare\.com/[^"]*font-awesome[^"]*">', "", html)
    html = re.sub(r'\s*<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>', "", html)
    html = re.sub(r'\s*<link rel="stylesheet" href="styles\.css">', "", html)
    return html


def contactify(html):
    """Phone numbers and emails become tappable. Mobile-first market; this is conversion, not polish."""
    html = html.replace(
        '<p class="text-gray-600">(+234) 905 646 7027</p>',
        '<p class="text-gray-600"><a href="tel:+2349056467027" class="hover:text-blue-600">(+234) 905 646 7027</a></p>')
    html = html.replace(
        '<p class="text-gray-600">(+234) 803 667 5119</p>',
        '<p class="text-gray-600"><a href="tel:+2348036675119" class="hover:text-blue-600">(+234) 803 667 5119</a></p>')
    html = html.replace(
        '<p class="text-gray-600">danielobialor121@gmail.com</p>',
        '<p class="text-gray-600"><a href="mailto:danielobialor121@gmail.com" class="hover:text-blue-600">danielobialor121@gmail.com</a></p>')
    html = html.replace(
        '<span>(+234) 905 646 7027</span>\n                            <span>(+234) 803 667 5119</span>',
        '<span><a href="tel:+2349056467027" class="hover:text-white">(+234) 905 646 7027</a>, '
        '<a href="tel:+2348036675119" class="hover:text-white">(+234) 803 667 5119</a></span>')
    html = html.replace(
        '<span>danielobialor121@gmail.com</span>',
        '<span><a href="mailto:danielobialor121@gmail.com" class="hover:text-white">danielobialor121@gmail.com</a></span>')
    return html


def process(old_name, new_name):
    html = (ROOT / old_name).read_text()
    cfg = PAGES[new_name]

    head_start = html.index("<head>")
    head_end = html.index("</head>") + len("</head>")

    extra_pre, preload = (), ""
    if new_name == "index.html":
        extra_pre = ("https://images.unsplash.com",)
        preload = ('    <link rel="preload" as="image" fetchpriority="high"\n'
                   '        href="https://images.unsplash.com/photo-1519389950473-47ba0277781c'
                   '?auto=format&amp;fit=crop&amp;w=1400&amp;q=70">\n')

    body = html[head_end:]
    body = strip_cdn(body)
    body = rewrite_links(body)
    body = rewrite_images(body, lazy_from_pct=22 if new_name == "index.html" else 8)
    body = contactify(body)

    # Homepage hero: smaller source, explicit box, highest priority (this is the LCP element)
    body = body.replace(
        'src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1500&q=80"',
        'src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=70"\n'
        '                width="1400" height="933" fetchpriority="high"')
    body = body.replace(
        'src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"',
        'src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=70"\n'
        '                width="800" height="533"')

    # Products page: hotlinked vendor images fail silently instead of showing a broken icon
    body = body.replace(
        '<img src="${p.img}"',
        '<img src="${p.img}" loading="lazy" decoding="async" '
        'onerror="this.onerror=null;this.src=\'/assets/img/product-placeholder.svg\'"')

    out = html[:head_start] + build_head(new_name, cfg, extra_pre, preload) + body
    (ROOT / new_name).write_text(out)
    if old_name != new_name:
        (ROOT / old_name).unlink()
    print(f"{old_name} -> {new_name}  {len(html)}B -> {len(out)}B")


if __name__ == "__main__":
    for old, new in RENAME.items():
        process(old, new)
