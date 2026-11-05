---
version: 1.0
name: Infonet-Computers-design-system
description: A bright, high-trust commercial interface for Infonet Computers LTD, a computer sales and repair business in Port Harcourt. The system anchors on a white canvas with slate body copy, a single brand blue (#1c5be4) carrying every primary action, and deep navy (#0d1c45) bands for hero and footer. Brand voltage comes from the blue-on-white/navy rhythm — deliberately clear and unfussy, because the job is to get a stranger to call, WhatsApp, or walk into a shop on Aguma Street. Type is the system sans stack at every size; no webfont ships for text. Weight and size carry hierarchy, never a display face.

colors:
  primary: "#1c5be4"
  primary-hover: "#1747bb"
  primary-focus-ring: "#3465f2"
  primary-soft: "#eef4ff"
  primary-soft-border: "#bcd0ff"
  primary-on-dark: "#8eb0ff"
  ink: "#0f172a"
  body: "#334155"
  body-strong: "#1e293b"
  muted: "#64748b"
  muted-soft: "#94a3b8"
  hairline: "#e2e8f0"
  hairline-strong: "#cbd5e1"
  canvas: "#ffffff"
  surface-soft: "#f8fafc"
  surface-card: "#f1f5f9"
  surface-dark: "#0d1c45"
  surface-dark-elevated: "#152f6f"
  surface-dark-deep: "#020617"
  on-primary: "#ffffff"
  on-dark: "#ffffff"
  on-dark-soft: "#dbe6ff"
  on-dark-muted: "#cbd5e1"
  whatsapp: "#25d366"
  success: "#059669"
  success-soft: "#ecfdf5"
  success-soft-border: "#a7f3d0"
  warning: "#d97706"
  warning-soft: "#fffbeb"
  rating: "#facc15"
  error: "#dc2626"

typography:
  display-xl:
    fontFamily: "{font.sans}"
    fontSize: 52px
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: -0.025em
  display-lg:
    fontFamily: "{font.sans}"
    fontSize: 48px
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: -0.025em
  display-md:
    fontFamily: "{font.sans}"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.025em
  display-sm:
    fontFamily: "{font.sans}"
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.025em
  title-lg:
    fontFamily: "{font.sans}"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.025em
  title-md:
    fontFamily: "{font.sans}"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: 0
  title-sm:
    fontFamily: "{font.sans}"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: 0
  body-lg:
    fontFamily: "{font.sans}"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: 0
  body-md:
    fontFamily: "{font.sans}"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "{font.sans}"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "{font.sans}"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0
  caption-xs:
    fontFamily: "{font.sans}"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0
  eyebrow:
    fontFamily: "{font.sans}"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0.12em
    textTransform: uppercase
  button:
    fontFamily: "{font.sans}"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "{font.sans}"
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0

font:
  sans: "ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji"
  icons: "Font Awesome 6 Brands / Free (subset, brand marks only)"

rounded:
  lg: 8px
  xl: 12px
  2xl: 16px
  3xl: 32px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 40px
  section: 64px
  section-lg: 96px

shadow:
  card: "0 1px 2px rgba(16,24,40,.04), 0 4px 16px -4px rgba(16,24,40,.08)"
  lift: "0 14px 34px -10px rgba(16,24,40,.22)"
  brand-glow: "shadow-brand-950/30"

motion:
  duration-base: 150ms
  duration-card: 250ms
  duration-reveal: 800ms
  easing: "cubic-bezier(.4, 0, .2, 1)"
  reveal: "fadeIn — opacity 0→1, translateY(20px)→0, .8s ease-out forwards"
  stagger: ".delay-1 / .delay-2 / .delay-3 / .delay-4 at 100ms increments"
  reduced-motion: "required — .fade-in and .slide-track animations disabled, scroll-behavior forced auto"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    padding: 14px 24px
    height: 48px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline-strong}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    padding: 14px 24px
    height: 48px
  button-secondary-on-dark:
    backgroundColor: "rgba(255,255,255,.10)"
    borderColor: "rgba(255,255,255,.25)"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
  button-whatsapp:
    backgroundColor: "{colors.whatsapp}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    size: 56px
  text-link:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
  top-nav:
    backgroundColor: "rgba(255,255,255,.95)"
    backdropBlur: 8px
    textColor: "{colors.body}"
    typography: "{typography.nav-link}"
    borderBottomColor: "{colors.hairline}"
    height: 72px
  hero-mesh:
    background: "radial-gradient(60rem 30rem at 12% -10%, rgba(52,101,242,.55), transparent 60%), radial-gradient(48rem 28rem at 95% 15%, rgba(28,91,228,.38), transparent 65%), linear-gradient(160deg, #0d1c45 0%, #152f6f 55%, #0d1c45 100%)"
    textColor: "{colors.on-dark}"
    typography: "{typography.display-xl}"
  service-card:
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.hairline}"
    textColor: "{colors.body}"
    typography: "{typography.title-md}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.xl}"
    shadow: "{shadow.card}"
  service-card-hover:
    transform: "translateY(-4px)"
    shadow: "{shadow.lift}"
  product-card:
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.lg}"
    imageAspect: "4/3"
    shadow: "{shadow.card}"
  trust-strip:
    backgroundColor: "{colors.surface-soft}"
    borderColor: "{colors.hairline}"
    textColor: "{colors.muted}"
    typography: "{typography.caption}"
  stat-tile:
    backgroundColor: "rgba(255,255,255,.05)"
    borderColor: "rgba(255,255,255,.15)"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.lg}"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline-strong}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 12px 16px
    height: 48px
  text-input-focused:
    borderColor: "{colors.primary-focus-ring}"
    ring: "2px {colors.primary-focus-ring}"
  choice-card:
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.xl}"
    checkedBackgroundColor: "{colors.primary-soft}"
    checkedBorderColor: "{colors.primary}"
  badge-pill:
    backgroundColor: "{colors.primary-soft}"
    borderColor: "{colors.primary-soft-border}"
    textColor: "{colors.primary}"
    typography: "{typography.caption-xs}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  badge-success:
    backgroundColor: "{colors.success-soft}"
    borderColor: "{colors.success-soft-border}"
    textColor: "{colors.success}"
    typography: "{typography.caption-xs}"
    rounded: "{rounded.pill}"
  cart-badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    minWidth: 20px
  footer:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark-soft}"
    typography: "{typography.body-sm}"
    padding: "{spacing.section}"

icons:
  system: "Inline SVG sprite at the top of each page — <symbol id=\"i-*\" viewBox=\"0 0 24 24\">, referenced with <use>. fill=none, stroke=currentColor, round caps and joins."
  stroke-default: 1.6
  stroke-arrow: 1.8
  stroke-menu: 1.8
  stroke-chevron: 2
  stroke-check: 2.2
  set: "i-check, i-arrow-right, i-phone, i-pin, i-clock, i-mail, i-shield, i-bolt, i-badge, i-store, i-chat, i-cpu, i-laptop, i-chevron, i-menu"
  brand-marks: "Font Awesome subset only — fa-whatsapp, fa-facebook-f, fa-instagram, fa-linkedin-in, fa-x-twitter. Never use Font Awesome for UI icons."

layout:
  container: "max-w-7xl (80rem) mx-auto"
  gutter: "px-4 / sm:px-6 / lg:px-8"
  section-padding: "py-12 / py-14 / py-16, lg:py-16 / lg:py-24"
  grid: "12-column at lg (lg:grid-cols-12); feature rows use lg:grid-cols-3 / lg:grid-cols-4"

---

# Infonet Computers — Design System

## What this site is for

Infonet Computers LTD sells laptops, desktops, printers and accessories — and, since November 2026 on the site, phones (iPhone, Samsung Galaxy, Google Pixel, Redmi; new and UK-used) — and repairs phones, computers, inverters and UPS units. Two shops: **6 Aguma St, Garrison** (the original, since 2004 — laptop sales and repairs plus inverter and UPS repair; the address on the Google Business Profile) and **Shop 59, Everyday Supermarket Plaza, Choba Junction** (everything). Same phone numbers and hours at both.

The site has one job: convert a stranger searching "laptop repair Port Harcourt" into a phone call, a WhatsApp message, or a walk-in. Every design decision below is downstream of that. Clarity beats atmosphere. A visitor should be able to find the phone number, the address, the opening hours and the price range in under five seconds, on a mid-range Android phone, on a slow connection.

That constraint — **real customers, real phones, real Nigerian bandwidth** — is the system's spine. It is why there is no webfont for body text, no CDN, no animation library, and no hero image that isn't a WebP the build step already squeezed.

## Design language

**White ground, slate type, one blue, navy bands.**

The page is white. Body copy is `{colors.body}` slate. Every primary action — every button that matters, every inline link, every focus ring — is the single brand blue `{colors.primary}` (#1c5be4), which is also the site's `theme-color` ancestor and the accent color on form controls. There is exactly one blue and exactly one scale of it (`brand-50` → `brand-950`); a second blue is a bug.

Against that, two navy moments carry the weight: the **hero mesh** at the top of the homepage and the **footer** at the bottom. Both sit on `{colors.surface-dark}` (#0d1c45). The page therefore reads as navy → white → navy: a dark band to establish authority, a long bright middle to do the selling, a dark band to close with contact details.

Structure comes from hairlines and soft shadows, not from heavy borders or color blocks. `{shadow.card}` is barely visible and that is the point; `{shadow.lift}` appears only on hover.

## Color

| Role | Token | Value | Notes |
|---|---|---|---|
| Canvas | `{colors.canvas}` | `#ffffff` | The default. Sections alternate white and `{colors.surface-soft}`. |
| Alt surface | `{colors.surface-soft}` | `#f8fafc` | `slate-50`. Used to separate consecutive light bands. |
| Card fill | `{colors.surface-card}` | `#f1f5f9` | `slate-100`. Inert chips, file-input buttons, quiet fills. |
| Body text | `{colors.body}` | `#334155` | `slate-700`. Set on `<body>`; inherit rather than restate. |
| Headings | `{colors.ink}` | `#0f172a` | `slate-900`. |
| Muted | `{colors.muted}` | `#64748b` | `slate-500`. Captions, meta, opening hours. |
| Hairline | `{colors.hairline}` | `#e2e8f0` | `slate-200`. The default border and divider. |
| Primary | `{colors.primary}` | `#1c5be4` | `brand-600`. Buttons, links, active states, `accent-brand-600`. |
| Primary hover | `{colors.primary-hover}` | `#1747bb` | `brand-700`. |
| Focus ring | `{colors.primary-focus-ring}` | `#3465f2` | `brand-500`, at `ring-2`. |
| Primary tint | `{colors.primary-soft}` | `#eef4ff` | `brand-50`. Badge fills, checked choice cards, ghost-button hover. |
| Dark ground | `{colors.surface-dark}` | `#0d1c45` | `brand-950`. Hero mesh base, footer, `<meta name="theme-color">`. |
| Dark elevated | `{colors.surface-dark-elevated}` | `#152f6f` | `brand-900`. The mid-stop of the hero gradient. |
| On-dark text | `{colors.on-dark-soft}` | `#dbe6ff` | `brand-100`, usually at 70–90% alpha for secondary copy on navy. |
| WhatsApp | `{colors.whatsapp}` | `#25d366` | The float button and WhatsApp CTAs only. Never a generic green. |

**Semantics** are borrowed straight from Tailwind and used sparingly: emerald for success and in-stock, amber for warnings and the "open now" caution state, `yellow-400` for review stars, `red-600` for errors and destructive text.

**On dark surfaces**, borders and fills are white-at-alpha — `border-white/15`, `border-white/25`, `bg-white/5`, `bg-white/10` — never a lighter navy. This keeps the navy reading as one continuous ground rather than a stack of panels.

### The one legacy exception

`.hero-gradient` in `assets/site.css` is `linear-gradient(135deg, #1c5be4 0%, #691eaf 100%)` — the only violet anywhere in the system. It is still load-bearing on `services.html` and `products.html`. Treat it as **legacy**: do not extend it, do not sample that purple for anything new, and if those two heroes are ever rebuilt, retire it in favour of `{component.hero-mesh}`.

## Typography

There is no webfont for text. Type is `font-sans` — the Tailwind system stack — at every size. This is a deliberate performance choice, not an oversight: it removes a render-blocking request and a layout shift on exactly the devices Infonet's customers use.

Hierarchy therefore comes from **size, weight and tracking only**:

- Display headlines run 700–800 weight with `tracking-tight` (−0.025em) and tight leading (`leading-[1.06]` / `leading-[1.08]` on the hero, `leading-tight` elsewhere). The negative tracking is what keeps a system sans from looking like an unstyled document.
- Section headings sit at `{typography.display-md}` / `{typography.display-sm}`, 700.
- Card titles are 600, never 700 — the weight step is the hierarchy.
- Body is 400 at 16px with `leading-relaxed`-ish line height; long-form paragraphs get `{typography.body-lg}` at 18px.
- **Eyebrows** are the system's one flourish: 12px, 600, uppercase, `tracking-[.12em]` or `tracking-[.14em]`, usually in `{colors.primary}` or `{colors.muted}`. They label a section without spending a heading level.
- `text-balance` on headlines, `max-w-2xl` / `max-w-3xl` on paragraphs. Never let a line run the full 80rem container.

Monospace appears only where the browser default applies (`code`, `kbd`, `pre`). No code blocks ship in the marketing surface.

## Radius

| Token | Value | Used for |
|---|---|---|
| `{rounded.lg}` | 8px | Small controls, file-input buttons, inline chips |
| `{rounded.xl}` | 12px | Buttons, inputs, choice cards |
| `{rounded.2xl}` | 16px | Service cards, product cards, stat tiles — the workhorse |
| `{rounded.3xl}` | 32px | Large hero panels and full-bleed feature containers only |
| `{rounded.pill}` | 9999px | Badges, tags, the WhatsApp float button |

## Photography and imagery

Real photographs of real stock and real bench work. This is a local business; generic stock imagery actively damages trust with a customer deciding whether to hand over a laptop.

- **Format is WebP**, always. `hero-laptop.webp` is preloaded on the homepage with `fetchpriority="high"` as the LCP element — if the hero image changes, that preload tag changes with it.
- Product images sit in a `4/3` aspect box with `object-contain` on white, so a laptop shot against any background still reads as catalogue.
- Lifestyle and bench photography uses `object-cover` and fills its container.
- `img` and `video` inherit `max-width:100%; height:auto` from the Tailwind preflight — never set a fixed pixel width on an image.
- Every image carries meaningful `alt`. For products, that means the model name, not "laptop".
- The OG card is a fixed 1200×630 PNG at `/assets/img/og-card.png`.

**No AI-generated product renders.** A photographed disassembled machine on the bench is the asset; a render of one is a liability, both for page weight and for credibility.

## Components

### Navigation

**`top-nav`** — Sticky bar at `bg-white/95` with `backdrop-blur`, a `{colors.hairline}` bottom border, and `z-50`. Carries the Infonet mark and wordmark at left, horizontal menu centre-right in `{typography.nav-link}`, and a right-hand cluster: cart icon with `{component.cart-badge}`, then a `{component.button-primary}`. The link row shows from `lg`; below that it collapses to `i-menu` (the WhatsApp button stays in the bar from `md`). The phone number joins the cluster at `xl`. The row needs ~990px with seven links — at `md` it used to overflow and scroll the whole page sideways on tablets.

**`cart-badge`** — Small blue counter pinned to the cart icon at `-top-0.5 -right-0.5`, `min-w-[20px]`, `rounded-full`, 11px type. Hidden at zero via the `hidden` class (safelisted).

### Buttons

**`button-primary`** — The blue CTA that carries every important action: "Book a repair", "Add to cart", "Send". `{colors.primary}` fill, white text, `{rounded.xl}`, 48px tall, 600 weight. Hover darkens to `{colors.primary-hover}`. Minimum 48px height is non-negotiable — these get tapped with a thumb.

**`button-secondary`** — White fill, `{colors.hairline-strong}` border, ink text, identical geometry to primary. Hover shifts the border to `{colors.primary}` and the text with it. Used for the second action in a pair ("Browse laptops" next to "Book a repair").

**`button-secondary-on-dark`** — The same shape over the hero mesh: `bg-white/10`, `border-white/25`, white text. Hover goes to `bg-white/10`→`white/20` or `hover:bg-white` with dark text where a strong second action is wanted. Never invert to a solid white button unless it is *the* primary action in that band.

**`button-whatsapp`** — 56px circular float, fixed `bottom-8 right-6` (`sm:right-8`), `{colors.whatsapp}` fill, white glyph, `shadow-lg`. Present on every page. This is frequently the highest-converting element on the site; do not relocate it behind a menu, and do not let another fixed element overlap it.

**`text-link`** — Inline links in `{colors.primary}`, hover `{colors.primary-hover}`. Arrow links use `i-arrow-right` with a `group-hover:gap-3` nudge — the gap opens, the arrow does not translate independently.

### Hero

**`hero-mesh`** — The homepage hero ground: a deep navy base with two soft brand-blue radial lights, composed entirely in CSS. No image request, no CDN, no canvas. Carries `{typography.display-xl}` in white with `text-balance`, a sub-headline in `{colors.on-dark-soft}` at ~85% alpha, a button pair, and a row of `{component.stat-tile}`. Right side holds the preloaded WebP at `h-72` → `sm:h-[380px]` → `lg:h-[440px]`.

**`stat-tile`** — Glass tiles over the mesh: `bg-white/5`, `border-white/15`, `{rounded.2xl}`. Number in `{typography.title-lg}` white, label in `{colors.on-dark-soft}` at 70%. Used for "Since 2004", "24hr turnaround", "30-day warranty".

**`.hero-gradient`** — *Legacy.* The blue→violet linear gradient still backing the `services.html` and `products.html` heroes. Do not use for new work; see the legacy note in the Color section.

### Cards

**`service-card`** — The 3-up repair/service grid. White fill, `{colors.hairline}` border, `{rounded.2xl}`, `{spacing.xl}` padding, `{shadow.card}`. Icon from the sprite at top in `{colors.primary}`, `{typography.title-md}` heading, body copy, optional `{component.text-link}`. Hover lifts `-4px` over 250ms into `{shadow.lift}` — the one hover transform in the system.

**`product-card`** — Catalogue tile. White fill, hairline border, `{rounded.2xl}`, a `4/3` `object-contain` image box, model name in `{typography.title-sm}`, price in 700 ink, stock state as `{component.badge-success}`, and an "Add to cart" `{component.button-primary}` at `mt-auto` so buttons align across a ragged row.

**`trust-strip`** — Thin `{colors.surface-soft}` band with hairline top and bottom, carrying the proof points: years trading, warranty, turnaround, payment methods accepted. Sits directly under the hero. Muted caption type with `i-check` / `i-shield` glyphs.

**`phone-card`** — The `product-card` shell for a phone or tablet record, built by `phones.js` → `card()`. Adds two radio rows — **Storage** and **Condition** (New / UK-used) — plus a **Connectivity** row (Wi-Fi / Wi-Fi + Cellular) on tablets that come in both, as 44px `rounded-lg` chips styled with `peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700`. The radios hold the state; the only JS rewrites that card's WhatsApp link, price line and cart payload on `change`. With no price for the picked pair, the WhatsApp **Get today's price** button is the primary and "Add to cart" is hidden; with a price, the cart button is primary and WhatsApp steps down to secondary. With no photo, the image box draws a plain handset with the model lettered on its screen (`.phone-tile`; tablets get a landscape slate with a wider bezel) — an illustration, not a render, and replaced by `img` the moment real stock is photographed.

**`phone-showcase`** — Homepage `#phones`: a `{rounded.3xl}` slate-50 panel inside the white shop band (so the white / slate alternation is untouched). Left column, sticky at `lg`: heading, New vs UK-used explainer, the at-the-counter checklist, two CTAs. Right column: five tabs — iPhone, Samsung, Pixel, Redmi, Tablets (`role="tablist"`, arrow-key navigation, `aria-selected:` styling) — over one card per generation (per family for iPad); each model is a link into `/products?category=phones&q=…` or `?category=tablets&q=…`. Below `sm` the generation cards become a horizontal snap scroller. Rendered from `phones.js`; the static range list inside `#phoneShowcase` is the no-JS fallback.

**`choice-card`** — Radio-backed selection card used in the repair booking and checkout flows. `has-[:checked]:border-brand-600` and `has-[:checked]:bg-brand-50` do the state — no JavaScript. The entire card is the label and therefore the tap target.

### Forms

**`text-input`** — White fill, `{colors.hairline-strong}` border, `{rounded.xl}`, 48px tall, 16px type. **16px is a hard floor** — anything smaller triggers iOS zoom-on-focus and wrecks the booking form on the phones most visitors are using.

**`text-input-focused`** — `focus:border-brand-500` plus `focus:ring-2 focus:ring-brand-500`, with `outline-none`. Every interactive element must have a visible focus state; the ring is it.

File inputs use the `file:` variants — `file:bg-slate-100`, `file:rounded-lg`, `file:text-slate-700` — so the picker button matches the system without a wrapper.

### Badges

**`badge-pill`** — `{colors.primary-soft}` fill, `{colors.primary-soft-border}` border, blue text, 13px / 500, `{rounded.pill}`. Category and feature tags.

**`badge-success`** — Emerald equivalent for "In stock", "Warranty included", "Repair complete".

Amber variants carry caution ("Closing soon", "Low stock"). Never use red as a badge fill; red is for error text only.

### Footer

**`footer`** — `{colors.surface-dark}` navy closing every page, `{spacing.section}` vertical padding. Column one is the business identity: mark, wordmark, one-line description, social row using the Font Awesome brand subset. Remaining columns are Shop / Services / Company links. The **NAP block — name, address, phone — is the load-bearing element**: it must match the `ComputerStore` JSON-LD and the Google Business Profile character for character, because local SEO reads all three. Body copy in `{colors.on-dark-soft}`, links hover to white.

## Do's and Don'ts

### Do

- Keep the page white and let `{colors.primary}` mark the path. If a visitor cannot tell what to tap, the design has failed regardless of how it looks.
- Put a phone number, a WhatsApp link and the Aguma Street address within reach on every page.
- Use the inline SVG sprite for UI icons. Add a new `<symbol>` to the sprite rather than reaching for an icon library.
- Keep the blue-on-navy and blue-on-white contrast honest — check any new pairing against WCAG AA at 4.5:1 for body text.
- Alternate white and `{colors.surface-soft}` between consecutive light sections so bands stay legible.
- Give every interactive element a visible `focus:ring-2 focus:ring-brand-500`.
- Set button and input heights at 48px so they survive a thumb on a bus.
- Write real copy about real services. "Data recovery" beats "Solutions tailored to you."

### Don't

- Don't introduce a second brand color. One blue, one scale. The violet in `.hero-gradient` is a legacy debt, not a licence.
- Don't add a webfont for body text. The system stack is a decision, not a default to be fixed.
- Don't add a CDN link or a third-party JS library. Everything ships from `/assets`, built by `build.js`.
- Don't rename a class in `assets/site.css` without grepping `index.html`, `services.html` and `products.html` — those names are load-bearing and there is no CSS-in-JS safety net.
- Don't add hover-only affordances. Half the traffic has no hover; hover is decoration, never information.
- Don't use Font Awesome for UI icons. It is subset down to brand marks and adding a glyph means growing a webfont.
- Don't animate anything that ignores `prefers-reduced-motion`.
- Don't ship an image that isn't WebP and hasn't been through `tools/optimize.py`.
- Don't let a marketing claim outrun the JSON-LD. If the FAQ schema says 24-hour turnaround, the page says 24-hour turnaround.

## Motion

Restrained and cheap. Three patterns, all CSS:

1. **`fadeIn`** — opacity 0→1 with a 20px rise, `.8s ease-out forwards`. Applied as `.fade-in` on section entrances, staggered with `.delay-1` through `.delay-4` at 100ms steps.
2. **`service-card` hover** — `translateY(-4px)` and a shadow swap over 250ms.
3. **Tailwind `transition`** — 150ms `cubic-bezier(.4,0,.2,1)` on color, border, opacity, shadow and transform for everything else.

`@media (prefers-reduced-motion: reduce)` disables `.fade-in` and `.slide-track` and forces `scroll-behavior: auto`. Any new animation must be added to that block in the same commit.

## Responsive behaviour

Mobile is the primary surface, not the fallback. Most visitors arrive from a phone search for a repair.

### Breakpoints

| Name | Width | Key changes |
|---|---|---|
| Mobile | < 640px | Hamburger nav; hero h1 drops to `text-4xl`; hero image below copy at `h-72`; all grids 1-up; stat tiles 2-up; footer columns stack; gutter `px-4` |
| `sm` | ≥ 640px | Button pairs go `flex-row`; feature grids 2-up; stat tiles 4-up; hero image `h-[380px]`; gutter `px-6` |
| `md` | ≥ 768px | WhatsApp button joins the nav bar; service grid 3-up |
| `lg` | ≥ 1024px | Horizontal nav appears, hamburger hides; 12-column grid engages; hero splits 6/6 or 8/4; product grid 4-up; sticky order summary in cart and checkout (`lg:sticky lg:top-28`); section padding to `lg:py-24`; hero h1 to `lg:text-[3.25rem]`; gutter `px-8` |
| `xl` | ≥ 1280px | Product grid 4-up confirmed; content caps at `max-w-7xl` (80rem) with growing outer margin |

### Touch targets

- Buttons and inputs: 48px minimum height.
- WhatsApp float: 56px.
- Nav and icon buttons: 44px minimum tap area, even where the glyph is 20px.
- Product and choice cards are tappable in full, well over the 44px floor.

### Collapsing strategy

- Nav collapses to a sheet below `lg`; the WhatsApp CTA stays visible in the bar from `md` rather than moving inside the menu.
- The hero's `lg:grid-cols-12` split stacks to copy-then-image. Copy always leads.
- Grids reduce column count; cards keep their padding rather than shrinking.
- Cart and checkout summaries unstick and move below the line items on mobile.
- Long tables (spec sheets, price lists) scroll horizontally inside their own container; the page body never scrolls sideways.

## Build and constraints

This is a static site with a build step. Understand it before editing styles.

- **Tailwind 3.4.19**, configured in `tailwind.config.js`. `content` is scoped to the five shipping pages plus `script.js` and `phones.js` (whose card and showcase classes exist nowhere else) — `testing.html` and `testing2.html` are scratch and deliberately excluded, so a class used only there will be purged.
- **`build.js`** concatenates compiled Tailwind, the Font Awesome subset, and the hand-written overrides into `assets/site.css`. Pages link that one file. Editing `assets/site.css` directly is editing a build artifact — change the source and rebuild.
- **`safelist`** currently carries `opacity-0`, `opacity-100`, `visible`, `invisible`, `hidden`, `cursor-pointer`. Any class toggled only from `script.js` must be added there or it will be purged.
- **`tools/optimize.py`** handles image squeezing; **`tools/verify.mjs`** checks the build; **`tools/serve.js`** is the local server.
- Hosting is **Vercel**; DNS and email routing are **Cloudflare**; analytics is **PostHog**; contact-form delivery is **Resend** via `/api/contact.js`. Speed Insights is wired in `speed-insights.js`.
- **Structured data is part of the design.** `index.html` carries `ComputerStore`, `WebSite` and `FAQPage` JSON-LD. Changing opening hours, phone, address or the FAQ copy on the page means changing the schema in the same commit.

## Iteration guide

1. Work one component at a time and name it by its key — `{component.service-card}`, `{component.hero-mesh}`.
2. Variants are separate entries (`-hover`, `-focused`, `-on-dark`), not prose caveats.
3. Reference tokens, never inline hex. If a value isn't in the token table, add it there first and justify it.
4. Before adding a color, prove the existing scale can't do the job. `brand-50` through `brand-950` is eleven steps.
5. When in doubt about emphasis: more size or more weight before more color.
6. New animation ships with its `prefers-reduced-motion` entry in the same change.
7. Any new class toggled from JavaScript gets safelisted in the same change.
8. Check the result at 360px wide on a throttled connection before calling it done.

## Known gaps

- **Dark mode is not implemented** and is not currently planned. The navy bands are compositional, not a theme.
- **Form validation states** beyond focus aren't specified — error and success styling for the repair booking and checkout forms needs to be defined once Resend delivery is confirmed end to end.
- **The job-ticket success animation** for the Services form (thermal-receipt concept) is designed but not built, and is blocked on that same delivery confirmation.
- **`.hero-gradient`** remains as legacy debt on two pages; retiring it is a tracked cleanup, not a style choice.
- **`testing.html` / `testing2.html`** are outside the Tailwind content globs and outside this document. Nothing there is canon.
- **Email and signature design** — the `info@` / `daniel@` signature block, and any BIMI mark — are governed by the same brand tokens but are not specified here.
- **Photography inventory is thin.** Real bench and storefront photographs for the Google Business Profile and the hero remain the highest-value outstanding asset, and several components above assume images that do not exist yet.

## Repair quote, swap and shop pages (Nov 2026)

- `/repair`, `/swap`, `/choba` and `/garrison` are generated whole by `tools/apply-chrome.py`. Edit the copy there.
- The forms in `forms.js` write a WhatsApp message and open it. Nothing is posted to the server.
- The `/repair` device list (`REPAIR_DEVICES`) carries the shop split. Phone and desktop repairs can only go to Choba.
- `TURNAROUND` stays empty until there are real figures. The table only renders when it has rows.
- The shop pages reuse the `#business` and `#choba` entities read out of `index.html`, so the copies stay identical.
- Every WhatsApp hand-off is tracked in `analytics.js`, as a `WhatsApp click` event plus a `/whatsapp/<page>/<section>` page view. Add `data-wa-source="…"` to a wrapper to name a placement.

## Cache-busting (Nov 2026)

`site.css` and `script.js` are cached for an hour. So `npm run build` stamps every page's link with a content hash, for example `/assets/site.css?v=1c31258177`, and a changed file gets a new URL. Always run the build after `tools/apply-chrome.py`, because the generator writes unstamped links.

## Product pages (Nov 2026)

- `/laptops/<slug>` pages are generated from `PRODUCT_PAGES` in `tools/apply-chrome.py`: a gallery with thumbnails, options with a live price, buy buttons, a specs table, and `Product` + `BreadcrumbList` schema. The social preview uses the product's own photo.
- These pages are only for machines that are really in the shop, with their own photos. Set `status: 'sold'` to keep a page up with an "ask for something similar" button instead of buying.
- In `products.html`, a record with `url` and `photo: true` links to its page, and its photo fills the card.
