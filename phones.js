/* ==========================================================================
   Infonet — phone and tablet catalogue
   --------------------------------------------------------------------------
   ONE source for two surfaces:
     · the homepage showcase   (index.html  → #phoneShowcase)
     · the Phones and Tablets categories (products.html → merged into `products`)

   Hand-written, like the laptop records in products.html. Not generated, and
   tools/apply-chrome.py never touches it. (The file is still called phones.js
   because three pages load it by that name.)

   Editing a model
     [name, storage, screen, note, overrides]
       storage  '128/256/512/1T'  → chips 128GB · 256GB · 512GB · 1TB
       screen   '6.1' or null     → '6.1" display' in the card line
       note     free text or null → appended to the card line
       overrides { year, conditions, conn, img, fold, tile, prices }

   Connectivity (tablets)
     A tablet line sets `conn` for all its models; a model can override it.
       ['Wi-Fi', 'Wi-Fi + Cellular'] → a third row of chips on the card
       ['Wi-Fi']                     → no chips, "Wi-Fi only" in the card line
     Phones have no `conn`.

   Prices
     Deliberately absent. The rate moves weekly and the shop quotes on WhatsApp.
     When you want a figure on the site, give the model a `prices` override:
       { prices: { 'UK-used': { '128GB': 450000, '256GB': 520000 },
                   'New':     { '256GB': 690000 } } }
     For a tablet, a cellular price goes under '<storage> <conn>':
       { prices: { 'New': { '128GB': 520000, '128GB Wi-Fi + Cellular': 610000 } } }
     (a bare '128GB' covers every connectivity that has no line of its own).
     Any option set that has a number shows it and gets an "Add to cart"
     button; every other one stays "Price on request".

   Photos
     Give a model `img: '/assets/img/phones/<slug>.webp'` (WebP, through
     tools/optimize.py) and the card shows the photo instead of the drawn tile.
     Real stock photographed on the counter beats any vendor render.

   Conditions
     Models from 2022 and earlier default to UK-used only — sealed stock of
     those has dried up. Override per model with `conditions`.
   ========================================================================== */
(() => {
    'use strict';

    const WA_NUMBER = '2349056467027';
    // Phones and tablets are sold at the Choba branch only — Garrison is laptops.
    const SHOP = 'At our Choba Junction shop';
    const USED_ONLY_BEFORE = 2023;   // year < this → UK-used only

    const WIFI = ['Wi-Fi'];
    const CELL = ['Wi-Fi', 'Wi-Fi + Cellular'];

    // brand: the word customers search for; sub: the filter chip on /products
    const LINES = [
        {
            key: 'iphone', brand: 'Apple', sub: 'iPhone', prefix: '', tab: 'iPhone',
            gens: [
                { title: 'iPhone 18 Pro & Duo', year: 2026, models: [
                    ['iPhone 18 Pro', '256/512/1T', '6.3'],
                    ['iPhone 18 Pro Max', '256/512/1T/2T', '6.9'],
                    ['iPhone Duo', '256/512/1T', null, 'Apple\'s first foldable', { fold: true }],
                ] },
                { title: 'iPhone 17 series', year: 2025, models: [
                    ['iPhone 17', '256/512', '6.3'],
                    ['iPhone Air', '256/512/1T', '6.5', 'Ultra-thin'],
                    ['iPhone 17 Pro', '256/512/1T', '6.3'],
                    ['iPhone 17 Pro Max', '256/512/1T/2T', '6.9'],
                    ['iPhone 17e', '256/512', '6.1', null, { year: 2026 }],
                ] },
                { title: 'iPhone 16 series', year: 2024, models: [
                    ['iPhone 16', '128/256/512', '6.1'],
                    ['iPhone 16 Plus', '128/256/512', '6.7'],
                    ['iPhone 16 Pro', '128/256/512/1T', '6.3'],
                    ['iPhone 16 Pro Max', '256/512/1T', '6.9'],
                    ['iPhone 16e', '128/256/512', '6.1', null, { year: 2025 }],
                ] },
                { title: 'iPhone 15 series', year: 2023, models: [
                    ['iPhone 15', '128/256/512', '6.1', 'USB-C'],
                    ['iPhone 15 Plus', '128/256/512', '6.7', 'USB-C'],
                    ['iPhone 15 Pro', '128/256/512/1T', '6.1', 'USB-C'],
                    ['iPhone 15 Pro Max', '256/512/1T', '6.7', 'USB-C'],
                ] },
                { title: 'iPhone 14 series', year: 2022, models: [
                    ['iPhone 14', '128/256/512', '6.1'],
                    ['iPhone 14 Plus', '128/256/512', '6.7'],
                    ['iPhone 14 Pro', '128/256/512/1T', '6.1'],
                    ['iPhone 14 Pro Max', '128/256/512/1T', '6.7'],
                ] },
                { title: 'iPhone 13 series', year: 2021, models: [
                    ['iPhone 13 mini', '128/256/512', '5.4'],
                    ['iPhone 13', '128/256/512', '6.1'],
                    ['iPhone 13 Pro', '128/256/512/1T', '6.1'],
                    ['iPhone 13 Pro Max', '128/256/512/1T', '6.7'],
                ] },
                { title: 'iPhone 12 series', year: 2020, models: [
                    ['iPhone 12 mini', '64/128/256', '5.4'],
                    ['iPhone 12', '64/128/256', '6.1'],
                    ['iPhone 12 Pro', '128/256/512', '6.1'],
                    ['iPhone 12 Pro Max', '128/256/512', '6.7'],
                ] },
                { title: 'iPhone 11 series', year: 2019, models: [
                    ['iPhone 11', '64/128/256', '6.1'],
                    ['iPhone 11 Pro', '64/256/512', '5.8'],
                    ['iPhone 11 Pro Max', '64/256/512', '6.5'],
                ] },
            ],
        },
        {
            key: 'galaxy-s', brand: 'Samsung', sub: 'Galaxy S', prefix: 'Samsung ', tab: 'Samsung',
            gens: [
                { title: 'Galaxy S26 series', year: 2026, models: [
                    ['Galaxy S26', '256/512', '6.3'],
                    ['Galaxy S26+', '256/512', '6.7'],
                    ['Galaxy S26 Ultra', '256/512/1T', '6.9', 'S Pen'],
                    ['Galaxy S26 FE', '128/256/512', '6.7'],
                ] },
                { title: 'Galaxy S25 series', year: 2025, models: [
                    ['Galaxy S25', '128/256/512', '6.2'],
                    ['Galaxy S25+', '256/512', '6.7'],
                    ['Galaxy S25 Ultra', '256/512/1T', '6.9', 'S Pen'],
                    ['Galaxy S25 Edge', '256/512', '6.7', 'Ultra-thin'],
                    ['Galaxy S25 FE', '128/256/512', '6.7'],
                ] },
                { title: 'Galaxy S24 series', year: 2024, models: [
                    ['Galaxy S24', '128/256/512', '6.2'],
                    ['Galaxy S24+', '256/512', '6.7'],
                    ['Galaxy S24 Ultra', '256/512/1T', '6.8', 'S Pen'],
                    ['Galaxy S24 FE', '128/256/512', '6.7'],
                ] },
                { title: 'Galaxy S23 series', year: 2023, models: [
                    ['Galaxy S23', '128/256/512', '6.1'],
                    ['Galaxy S23+', '256/512', '6.6'],
                    ['Galaxy S23 Ultra', '256/512/1T', '6.8', 'S Pen'],
                    ['Galaxy S23 FE', '128/256', '6.4'],
                ] },
                { title: 'Galaxy S22 series', year: 2022, models: [
                    ['Galaxy S22', '128/256', '6.1'],
                    ['Galaxy S22+', '128/256', '6.6'],
                    ['Galaxy S22 Ultra', '128/256/512/1T', '6.8', 'S Pen'],
                ] },
                { title: 'Galaxy S21 series', year: 2021, models: [
                    ['Galaxy S21', '128/256', '6.2'],
                    ['Galaxy S21+', '128/256', '6.7'],
                    ['Galaxy S21 Ultra', '128/256/512', '6.8'],
                    ['Galaxy S21 FE', '128/256', '6.4', null, { year: 2022 }],
                ] },
                { title: 'Galaxy S20 series', year: 2020, models: [
                    ['Galaxy S20', '128', '6.2'],
                    ['Galaxy S20+', '128/512', '6.7'],
                    ['Galaxy S20 Ultra', '128/512', '6.9'],
                    ['Galaxy S20 FE', '128/256', '6.5'],
                ] },
                { title: 'Galaxy S10 series', year: 2019, models: [
                    ['Galaxy S10e', '128/256', '5.8'],
                    ['Galaxy S10', '128/512', '6.1'],
                    ['Galaxy S10+', '128/512/1T', '6.4'],
                ] },
            ],
        },
        {
            key: 'galaxy-a', brand: 'Samsung', sub: 'Galaxy A', prefix: 'Samsung ', tab: 'Samsung',
            gens: [
                { title: 'Galaxy A07 – A57', year: 2025, models: [
                    ['Galaxy A07', '64/128', null, '4G & 5G versions'],
                    ['Galaxy A17', '128/256', null, '4G & 5G versions'],
                    ['Galaxy A27', '128/256', null, '5G', { year: 2026 }],
                    ['Galaxy A37', '128/256', null, '5G', { year: 2026 }],
                    ['Galaxy A57', '128/256', null, '5G', { year: 2026 }],
                ] },
                { title: 'Galaxy A06 – A56', year: 2024, models: [
                    ['Galaxy A06', '64/128', null, '4G & 5G versions'],
                    ['Galaxy A16', '128/256', null, '4G & 5G versions'],
                    ['Galaxy A26', '128/256', null, '5G', { year: 2025 }],
                    ['Galaxy A36', '128/256', null, '5G', { year: 2025 }],
                    ['Galaxy A56', '128/256', null, '5G', { year: 2025 }],
                ] },
                { title: 'Galaxy A05 – A55', year: 2023, models: [
                    ['Galaxy A05', '64/128', null, '4G'],
                    ['Galaxy A05s', '64/128', null, '4G'],
                    ['Galaxy A15', '128/256', null, '4G & 5G versions'],
                    ['Galaxy A25', '128/256', null, '5G'],
                    ['Galaxy A35', '128/256', null, '5G', { year: 2024 }],
                    ['Galaxy A55', '128/256', null, '5G', { year: 2024 }],
                ] },
            ],
        },
        {
            key: 'pixel', brand: 'Google', sub: 'Pixel', prefix: 'Google ', tab: 'Pixel',
            gens: [
                { title: 'Pixel 11 series', year: 2026, models: [
                    ['Pixel 11', '256/512', '6.3'],
                    ['Pixel 11 Pro', '256/512/1T', '6.3'],
                    ['Pixel 11 Pro XL', '256/512/1T', '6.8'],
                ] },
                { title: 'Pixel 10 series', year: 2025, models: [
                    ['Pixel 10', '128/256', '6.3'],
                    ['Pixel 10 Pro', '128/256/512/1T', '6.3'],
                    ['Pixel 10 Pro XL', '256/512/1T', '6.8'],
                    ['Pixel 10a', '128/256', '6.3', null, { year: 2026 }],
                ] },
                { title: 'Pixel 9 series', year: 2024, models: [
                    ['Pixel 9', '128/256', '6.3'],
                    ['Pixel 9 Pro', '128/256/512/1T', '6.3'],
                    ['Pixel 9 Pro XL', '128/256/512/1T', '6.8'],
                    ['Pixel 9a', '128/256', '6.3', null, { year: 2025 }],
                ] },
                { title: 'Pixel 8 series', year: 2023, models: [
                    ['Pixel 8', '128/256', '6.2'],
                    ['Pixel 8 Pro', '128/256/512/1T', '6.7'],
                    ['Pixel 8a', '128/256', '6.1', null, { year: 2024 }],
                ] },
                { title: 'Pixel 7 series', year: 2022, models: [
                    ['Pixel 7', '128/256', '6.3'],
                    ['Pixel 7 Pro', '128/256/512', '6.7'],
                    ['Pixel 7a', '128', '6.1', null, { year: 2023 }],
                ] },
                { title: 'Pixel 6 series', year: 2021, models: [
                    ['Pixel 6', '128/256', '6.4'],
                    ['Pixel 6 Pro', '128/256/512', '6.7'],
                    ['Pixel 6a', '128', '6.1', null, { year: 2022 }],
                ] },
            ],
        },
        {
            key: 'redmi', brand: 'Xiaomi', sub: 'Redmi', prefix: '', tab: 'Redmi',
            gens: [
                { title: 'Redmi Note 17 series', year: 2026, models: [
                    ['Redmi Note 17', '128/256', null, '7,700mAh battery'],
                    ['Redmi Note 17 Pro', '256/512'],
                    ['Redmi Note 17 Pro 5G', '256/512', null, '8,340mAh battery'],
                    ['Redmi Note 17 Pro Max 5G', '256/512', null, '10,000mAh battery'],
                ] },
                { title: 'Redmi Note 15 series', year: 2026, models: [
                    ['Redmi Note 15', '128/256', null, '6,000mAh battery'],
                    ['Redmi Note 15 Pro', '256/512'],
                    ['Redmi Note 15 Pro+ 5G', '256/512'],
                ] },
                { title: 'Redmi Note 14 series', year: 2025, models: [
                    ['Redmi Note 14', '128/256'],
                    ['Redmi Note 14 Pro', '256/512'],
                    ['Redmi Note 14 Pro+ 5G', '256/512'],
                ] },
                { title: 'Redmi Note 13 series', year: 2024, models: [
                    ['Redmi Note 13', '128/256'],
                    ['Redmi Note 13 Pro', '256/512'],
                    ['Redmi Note 13 Pro+ 5G', '256/512'],
                ] },
                { title: 'Redmi 13 – 17 & A5', year: 2024, models: [
                    ['Redmi 17', '128/256', null, '7,500mAh battery · 4G & 5G', { year: 2026 }],
                    ['Redmi 15', '128/256', null, '7,000mAh battery', { year: 2025 }],
                    ['Redmi 15C', '128/256', null, null, { year: 2025 }],
                    ['Redmi 14C', '128/256'],
                    ['Redmi 13', '128/256'],
                    ['Redmi A5', '64/128', null, null, { year: 2025 }],
                ] },
            ],
        },

        // ------------------------------------------------------------ tablets
        // From 2022 up, the year of the iPad 10th gen — Daniel's cut-off. Every iPad and
        // Galaxy Tab here was sold in a cellular version; Redmi Pads vary by model.
        {
            key: 'ipad', kind: 'tablet', brand: 'Apple', sub: 'iPad', prefix: '', conn: CELL,
            gens: [
                { title: 'iPad Pro', year: 2025, models: [
                    ['iPad Pro 13-inch (M5)', '256/512/1T/2T', '13', 'OLED'],
                    ['iPad Pro 11-inch (M5)', '256/512/1T/2T', '11', 'OLED'],
                    ['iPad Pro 13-inch (M4)', '256/512/1T/2T', '13', 'OLED', { year: 2024 }],
                    ['iPad Pro 11-inch (M4)', '256/512/1T/2T', '11', 'OLED', { year: 2024 }],
                    ['iPad Pro 12.9-inch (M2)', '128/256/512/1T/2T', '12.9', null, { year: 2022 }],
                    ['iPad Pro 11-inch (M2)', '128/256/512/1T/2T', '11', null, { year: 2022 }],
                ] },
                { title: 'iPad Air', year: 2026, models: [
                    ['iPad Air 13-inch (M4)', '128/256/512/1T', '13'],
                    ['iPad Air 11-inch (M4)', '128/256/512/1T', '11'],
                    ['iPad Air 13-inch (M3)', '128/256/512/1T', '13', null, { year: 2025 }],
                    ['iPad Air 11-inch (M3)', '128/256/512/1T', '11', null, { year: 2025 }],
                    ['iPad Air 13-inch (M2)', '128/256/512/1T', '13', null, { year: 2024 }],
                    ['iPad Air 11-inch (M2)', '128/256/512/1T', '11', null, { year: 2024 }],
                    ['iPad Air 5 (M1)', '64/256', '10.9', null, { year: 2022 }],
                ] },
                { title: 'iPad', year: 2025, models: [
                    ['iPad (A16)', '128/256/512', '11'],
                    ['iPad 10th gen', '64/256', '10.9', null, { year: 2022 }],
                ] },
                { title: 'iPad mini', year: 2026, models: [
                    ['iPad mini (A20 Pro)', '128/256/512', '8.5', 'OLED'],
                    ['iPad mini (A17 Pro)', '128/256/512', '8.3', null, { year: 2024 }],
                ] },
            ],
        },
        {
            key: 'galaxy-tab', kind: 'tablet', brand: 'Samsung', sub: 'Galaxy Tab', prefix: 'Samsung ', conn: CELL,
            gens: [
                { title: 'Galaxy Tab S12 series', year: 2026, models: [
                    ['Galaxy Tab S12 Ultra', '256/512/1T', '14.6', 'Works with S\u00a0Pen'],
                    ['Galaxy Tab S12+', '256/512', '12.6', 'Works with S\u00a0Pen'],
                ] },
                { title: 'Galaxy Tab S11 series', year: 2025, models: [
                    ['Galaxy Tab S11 Ultra', '256/512/1T', '14.6', 'Works with S\u00a0Pen'],
                    ['Galaxy Tab S11', '128/256/512', '11', 'Works with S\u00a0Pen'],
                ] },
                { title: 'Galaxy Tab S10 series', year: 2024, models: [
                    ['Galaxy Tab S10 Ultra', '256/512/1T', '14.6', 'Works with S\u00a0Pen'],
                    ['Galaxy Tab S10+', '256/512', '12.4', 'Works with S\u00a0Pen'],
                    ['Galaxy Tab S10 FE+', '128/256', '13.1', 'Works with S\u00a0Pen', { year: 2025 }],
                    ['Galaxy Tab S10 FE', '128/256', '10.9', 'Works with S\u00a0Pen', { year: 2025 }],
                    ['Galaxy Tab S10 Lite', '128/256', '10.9', 'Works with S\u00a0Pen', { year: 2025 }],
                ] },
                { title: 'Galaxy Tab S9 series', year: 2023, models: [
                    ['Galaxy Tab S9 Ultra', '256/512/1T', '14.6', 'Works with S\u00a0Pen'],
                    ['Galaxy Tab S9+', '256/512', '12.4', 'Works with S\u00a0Pen'],
                    ['Galaxy Tab S9', '128/256', '11', 'Works with S\u00a0Pen'],
                    ['Galaxy Tab S9 FE+', '128/256', '12.4', 'Works with S\u00a0Pen'],
                    ['Galaxy Tab S9 FE', '128/256', '10.9', 'Works with S\u00a0Pen'],
                ] },
                { title: 'Galaxy Tab S8 series', year: 2022, models: [
                    ['Galaxy Tab S8 Ultra', '128/256/512', '14.6', 'Works with S\u00a0Pen'],
                    ['Galaxy Tab S8+', '128/256', '12.4', 'Works with S\u00a0Pen'],
                    ['Galaxy Tab S8', '128/256', '11', 'Works with S\u00a0Pen'],
                ] },
                { title: 'Galaxy Tab A', year: 2023, models: [
                    ['Galaxy Tab A11+', '128/256', '11', null, { year: 2025 }],
                    ['Galaxy Tab A11', '64/128', '8.7', null, { year: 2025 }],
                    ['Galaxy Tab A9+', '64/128', '11'],
                    ['Galaxy Tab A9', '64/128', '8.7'],
                ] },
            ],
        },
        {
            key: 'redmi-pad', kind: 'tablet', brand: 'Xiaomi', sub: 'Redmi Pad', prefix: '', conn: WIFI,
            gens: [
                { title: 'Redmi Pad 2 series', year: 2025, models: [
                    ['Redmi Pad 2 Pro', '128/256', '12.1', '12,000mAh battery', { conn: CELL }],
                    ['Redmi Pad 2', '128/256', '11', null, { conn: CELL }],
                    ['Redmi Pad 2 9.7', '64/128', '9.7', null, { year: 2026, conn: CELL }],
                ] },
                { title: 'Redmi Pad Pro & SE', year: 2024, models: [
                    ['Redmi Pad Pro', '128/256', '12.1', null, { conn: CELL }],
                    ['Redmi Pad SE 8.7', '64/128', '8.7', null, { conn: CELL }],
                    ['Redmi Pad SE', '128/256', '11', null, { year: 2023 }],
                ] },
                { title: 'Redmi Pad', year: 2022, models: [
                    ['Redmi Pad', '64/128', '10.6'],
                ] },
            ],
        },
    ];

    // ------------------------------------------------------------ helpers
    const slug = (s) => String(s).toLowerCase().replace(/\+/g, '-plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const naira = (n) => '₦' + Math.round(n).toLocaleString('en-NG');
    const expandStorage = (s) => String(s).split('/').map((v) => (/T$/.test(v) ? v.replace('T', 'TB') : `${v}GB`));

    // Tile lettering: "Galaxy S23 Ultra" → top "Galaxy", big "S23", rest "Ultra"
    function tileParts(short, line) {
        if (line.key === 'ipad') {
            // "iPad Pro 13-inch (M5)" → iPad Pro · M5 · 13"    "iPad 10th gen" → iPad · 10th gen
            const [, family, tail] = short.match(/^(iPad(?: Pro| Air| mini)?)\s*(.*)$/);
            const chip = (tail.match(/\(([^)]+)\)/) || [])[1];
            const size = (tail.match(/([\d.]+)-inch/) || [])[1];
            const big = chip || tail.replace(/\s*\(.*\)/, '');
            return { top: family, big, rest: size ? `${size}"` : '' };
        }
        const TOP = { iphone: 'iPhone', pixel: 'Pixel', redmi: 'Redmi', 'galaxy-tab': 'Galaxy Tab', 'redmi-pad': 'Redmi Pad' };
        let top = TOP[line.key] || 'Galaxy';
        let rest = short.replace(new RegExp('^' + top + '\\s*'), '');
        if (line.key === 'redmi' && /^Note\s/.test(rest)) { top = 'Redmi Note'; rest = rest.replace(/^Note\s+/, ''); }
        if (!rest) return { top: 'Redmi', big: 'Pad', rest: '' };          // the plain "Redmi Pad"
        const [big, ...more] = rest.split(' ');
        return { top, big, rest: more.join(' ').replace(/^(\d+\.\d+)$/, '$1"') };
    }

    // ------------------------------------------------------------ records
    const records = [];
    LINES.forEach((line) => {
        line.count = 0;
        line.gens.forEach((gen) => {
            gen.records = gen.models.map(([short, storage, screen, note, o = {}]) => {
                const kind = line.kind || 'phone';
                const year = o.year || gen.year;
                const conditions = o.conditions || (year < USED_ONLY_BEFORE ? ['UK-used'] : ['New', 'UK-used']);
                const conn = o.conn || line.conn || null;
                const name = line.prefix + short;
                const bits = [String(year)];
                if (screen) bits.push(`${screen}" display`);
                if (note) bits.push(note);
                if (conn && conn.length === 1) bits.push(`${conn[0]} only`);
                const t = o.tile ? { top: o.tile[0], big: o.tile[1], rest: o.tile[2] || '' } : tileParts(short, line);
                const rec = {
                    // `phone` marks every record from this file — products.html renders
                    // anything with it through card() below, tablets included.
                    phone: true,
                    kind,
                    id: slug(name),
                    name,
                    short,
                    brand: line.brand,
                    line: line.key,
                    gen: gen.title,
                    year,
                    category: kind === 'tablet' ? 'Tablets' : 'Phones',
                    subcategory: line.sub,
                    desc: bits.join(' · '),
                    storage: expandStorage(storage),
                    conditions,
                    conn: conn && conn.length > 1 ? conn : null,
                    prices: o.prices || null,
                    img: o.img || '',
                    fold: !!o.fold,
                    tile: t,
                    // what the search box also matches on: "samsung", "xiaomi", "apple"…
                    keywords: `${line.brand} ${line.sub} ${gen.title} ${conditions.join(' ')} ${conn ? conn.join(' ') : ''} ${kind === 'tablet' ? 'tablet tab pad' : 'phone smartphone'}`.toLowerCase(),
                };
                records.push(rec);
                line.count += 1;
                return rec;
            });
        });
    });

    const priceOf = (p, storage, condition, conn) => {
        const row = p.prices && p.prices[condition];
        const v = row && ((conn && row[`${storage} ${conn}`]) || row[storage]);
        return Number.isFinite(+v) && +v > 0 ? +v : 0;
    };

    const optionLabel = (storage, conn, condition) => [storage, conn, condition].filter(Boolean).join(', ');

    function waLink(p, storage, condition, price, conn) {
        const spec = optionLabel(storage, conn, condition);
        // "iPad Air 11-inch (M4), 128GB, Wi-Fi, New" — no brackets inside brackets
        const what = /\)$/.test(p.name) ? `${p.name}, ${spec}` : `${p.name} (${spec})`;
        const text = price
            ? `Hello Infonet, I'm interested in the ${what} at ${naira(price)}. Is it in stock?`
            : `Hello Infonet, I'm interested in the ${what}. What's today's price, and is it in stock?`;
        return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
    }

    // ------------------------------------------------------------ drawn tile
    // A plain phone outline with the model lettered on its screen. Deliberately an
    // illustration, not a product render: it says "this model, in general" and is
    // replaced the moment a real photo of real stock is added (`img`).
    function tile(p) {
        const t = p.tile;
        if (p.kind === 'tablet') return tabletTile(t);
        const frame = p.fold ? 'aspect-[10/11] h-[78%]' : 'aspect-[9/19] h-[84%]';
        return `
                                <div class="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                                    <div class="phone-tile relative ${frame} rounded-[1.35rem] bg-slate-900 p-[5px] shadow-lift">
                                        <div class="relative flex h-full w-full flex-col items-center justify-center rounded-[1.05rem] bg-gradient-to-b from-brand-50 via-white to-white px-1.5 text-center">
                                            ${p.fold ? '<span class="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-slate-200"></span>' : '<span class="absolute top-[7px] left-1/2 h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-slate-900"></span>'}
                                            <span class="text-[9px] font-semibold uppercase tracking-[.14em] text-brand-600">${esc(t.top)}</span>
                                            <span class="mt-0.5 text-[26px] font-extrabold leading-none tracking-tight text-slate-900">${esc(t.big)}</span>
                                            ${t.rest ? `<span class="mt-1 text-[11px] font-semibold leading-tight text-slate-600">${esc(t.rest)}</span>` : ''}
                                        </div>
                                    </div>
                                </div>`;
    }

    // The tablet version: landscape, wider bezel, camera in the bezel.
    function tabletTile(t) {
        return `
                                <div class="absolute inset-0 flex items-center justify-center pt-[9%]" aria-hidden="true">
                                    <div class="phone-tile relative aspect-[10/7] h-[62%] rounded-[1.1rem] bg-slate-900 p-[7px] shadow-lift">
                                        <span class="absolute top-[2px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-slate-500"></span>
                                        <div class="relative flex h-full w-full flex-col items-center justify-center rounded-[0.75rem] bg-gradient-to-b from-brand-50 via-white to-white px-2 text-center">
                                            <span class="text-[10px] font-semibold uppercase tracking-[.14em] text-brand-600">${esc(t.top)}</span>
                                            <span class="mt-0.5 text-[28px] font-extrabold leading-none tracking-tight text-slate-900">${esc(t.big)}</span>
                                            ${t.rest ? `<span class="mt-1 text-[12px] font-semibold leading-tight text-slate-600">${esc(t.rest)}</span>` : ''}
                                        </div>
                                    </div>
                                </div>`;
    }

    // ------------------------------------------------------------ catalogue card
    // Same shell as the laptop card (product-card → hover lift, content-visibility),
    // plus storage, connectivity (tablets) and condition choices. The choices are radio
    // inputs styled with `peer-checked:` — the state lives in the DOM, the JS below
    // only rewrites links. `group` (st / cn / cd) is how the JS tells the rows apart.
    function chips(name, values, label, group) {
        return `
                                <div class="mt-3" role="radiogroup" aria-label="${label}">
                                    <span class="block text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">${label}</span>
                                    <div class="mt-1.5 flex flex-wrap gap-1.5">${values.map((v, i) => `
                                        <label class="cursor-pointer">
                                            <input type="radio" name="${name}" value="${esc(v)}"${i === 0 ? ' checked' : ''} data-phone-opt="${group}" class="peer sr-only">
                                            <span class="inline-flex h-11 min-w-[3.25rem] items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slate-700 transition hover:border-brand-400 peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500">${esc(v)}</span>
                                        </label>`).join('')}
                                    </div>
                                </div>`;
    }

    // What the cart and the order record call one chosen option set.
    const cartId = (p, storage, conn, condition) => `${p.id}-${slug(optionLabel(storage, conn, condition))}`;
    const cartName = (p, storage, conn, condition) => `${p.name} ${storage}${conn ? `, ${conn}` : ''} (${condition})`;

    function card(p) {
        const s0 = p.storage[0], c0 = p.conditions[0], n0 = p.conn ? p.conn[0] : '';
        const price = priceOf(p, s0, c0, n0);
        const uid = `${p.id}-${Math.random().toString(36).slice(2, 7)}`;
        const media = p.img
            ? `<img src="${esc(p.img)}" loading="lazy" decoding="async" onload="this.parentElement.classList.remove('skel')" onerror="this.onerror=null;this.parentElement.classList.remove('skel');this.src='/assets/img/product-placeholder.svg'" alt="${esc(p.name)}" class="w-full h-full object-contain p-5">`
            : tile(p);
        return `
                    <article class="product-card phone-card group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card fade-in" data-phone="${p.id}">
                            <div class="product-image${p.img ? ' skel' : ''} relative aspect-[4/3] overflow-hidden bg-slate-100">
                                ${media}
                                <span class="absolute left-3 top-3 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-brand-700 shadow-sm">${esc(p.subcategory)}</span>
                                <span class="absolute right-3 top-3 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[11px] font-semibold tabular text-slate-600 shadow-sm">${p.year}</span>
                            </div>
                            <div class="flex flex-1 flex-col p-5">
                                <h3 class="font-bold leading-snug text-slate-900">${esc(p.name)}</h3>
                                <p class="mt-1.5 text-sm text-slate-600">${esc(p.desc)}</p>
                                ${chips(`st-${uid}`, p.storage, 'Storage', 'st')}
                                ${p.conn ? chips(`cn-${uid}`, p.conn, 'Connectivity', 'cn') : ''}
                                ${chips(`cd-${uid}`, p.conditions, 'Condition', 'cd')}
                                <p class="mt-4 leading-tight">
                                    <span data-phone-price class="block text-lg font-bold text-slate-900 tabular">${price ? naira(price) : 'Price on request'}</span>
                                    <span data-phone-price-note class="block text-xs text-slate-500"${price ? ' hidden' : ''}>Moves with the market — we quote today's rate.</span>
                                </p>
                                <p class="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                    <svg class="w-3.5 h-3.5 text-brand-600 shrink-0"><use href="#i-pin"/></svg> ${esc(SHOP)}
                                </p>
                                <div class="mt-auto pt-4 grid gap-2">
                                    <button type="button" data-add-to-cart${price ? '' : ' hidden'}
                                            data-id="${cartId(p, s0, n0, c0)}"
                                            data-name="${esc(cartName(p, s0, n0, c0))}"
                                            data-desc="${esc(p.desc)}"
                                            data-price="${price}"
                                            data-img="${esc(p.img || '/assets/img/product-placeholder.svg')}"
                                            class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
                                        <svg class="w-4 h-4"><use href="#i-cart"/></svg> Add to cart
                                    </button>
                                    <a data-phone-wa href="${waLink(p, s0, c0, price, n0)}" target="_blank" rel="noopener"
                                       class="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${price ? 'border border-slate-300 text-slate-700 hover:border-slate-400' : 'bg-brand-600 text-white hover:bg-brand-700'}">
                                        <svg class="w-4 h-4 ${price ? 'text-whatsapp' : ''}"><use href="#i-whatsapp"/></svg>
                                        <span data-phone-wa-label>${price ? 'Ask about it' : 'Get today’s price'}</span>
                                    </a>
                                </div>
                            </div>
                        </article>
                    `;
    }

    const WA_PRIMARY = ['bg-brand-600', 'text-white', 'hover:bg-brand-700'];
    const WA_SECONDARY = ['border', 'border-slate-300', 'text-slate-700', 'hover:border-slate-400'];

    // An option changed → rewrite that one card's price, cart payload and link.
    document.addEventListener('change', (e) => {
        const input = e.target;
        if (!input.matches || !input.matches('[data-phone-opt]')) return;
        const art = input.closest('[data-phone]');
        const p = art && records.find((r) => r.id === art.dataset.phone);
        if (!p) return;
        const pick = (group, list) => {
            const on = art.querySelector(`[data-phone-opt="${group}"]:checked`);
            return on && list.includes(on.value) ? on.value : list[0];
        };
        const storage = pick('st', p.storage);
        const condition = pick('cd', p.conditions);
        const conn = p.conn ? pick('cn', p.conn) : '';
        const price = priceOf(p, storage, condition, conn);

        art.querySelector('[data-phone-price]').textContent = price ? naira(price) : 'Price on request';
        art.querySelector('[data-phone-price-note]').hidden = !!price;

        const cart = art.querySelector('[data-add-to-cart]');
        cart.hidden = !price;
        cart.dataset.id = cartId(p, storage, conn, condition);
        cart.dataset.name = cartName(p, storage, conn, condition);
        cart.dataset.price = String(price);

        // With a price on the card, "Add to cart" is the primary action and WhatsApp
        // steps down to the secondary style; without one, WhatsApp is the primary.
        const wa = art.querySelector('[data-phone-wa]');
        wa.href = waLink(p, storage, condition, price, conn);
        wa.classList.remove(...WA_PRIMARY, ...WA_SECONDARY);
        wa.classList.add(...(price ? WA_SECONDARY : WA_PRIMARY));
        wa.querySelector('svg').classList.toggle('text-whatsapp', !!price);
        wa.querySelector('[data-phone-wa-label]').textContent = price ? 'Ask about it' : 'Get today’s price';
    });

    // ------------------------------------------------------------ homepage showcase
    // Brand tabs → one card per generation, every model a link into the catalogue.
    // Replaces the static range list inside #phoneShowcase, which stays as the
    // no-JS / crawler fallback.
    const TABS = [
        { key: 'iphone', label: 'iPhone', lines: ['iphone'] },
        { key: 'samsung', label: 'Samsung', lines: ['galaxy-s', 'galaxy-a'] },
        { key: 'pixel', label: 'Google Pixel', short: 'Pixel', lines: ['pixel'] },
        { key: 'redmi', label: 'Redmi', lines: ['redmi'] },
        { key: 'tablets', label: 'Tablets', lines: ['ipad', 'galaxy-tab', 'redmi-pad'] },
    ];
    const byKey = Object.fromEntries(LINES.map((l) => [l.key, l]));
    const catalogueUrl = (kind, params) =>
        '/products?' + new URLSearchParams({ category: kind === 'tablet' ? 'tablets' : 'phones', ...params }).toString();

    // Inside an "iPad Pro" card, "iPad Pro 13-inch (M5)" reads as "13-inch (M5)";
    // inside a Galaxy Tab card, "Galaxy Tab S10 FE+" reads as "S10 FE+".
    function chipText(r, gen) {
        if (r.line === 'galaxy-tab') return r.short.replace(/^Galaxy Tab /, '');
        const rest = r.short.startsWith(gen.title + ' ') ? r.short.slice(gen.title.length + 1) : '';
        if (r.line !== 'ipad' || !/^(\d+(\.\d+)?-inch|\(|\d+(st|nd|rd|th) gen)/.test(rest)) return r.short;
        return rest.replace(/^\((.*)\)$/, '$1');
    }

    function yearSpan(gen) {
        const ys = gen.records.map((r) => r.year);
        const lo = Math.min(...ys), hi = Math.max(...ys);
        return lo === hi ? String(lo) : `${lo}–${String(hi).slice(2)}`;
    }

    function genCard(gen) {
        const conds = ['New', 'UK-used'].filter((c) => gen.records.some((r) => r.conditions.includes(c)));
        return `
                <div class="w-[84%] shrink-0 snap-start sm:w-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                    <div class="flex items-baseline justify-between gap-3">
                        <h4 class="font-semibold text-slate-900">${esc(gen.title)}</h4>
                        <span class="text-xs font-semibold tabular text-slate-500">${yearSpan(gen)}</span>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-1.5">${gen.records.map((r) => `
                        <a href="${catalogueUrl(r.kind, { q: r.short })}" class="inline-flex h-9 items-center rounded-lg bg-slate-100 px-2.5 text-[13px] font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">${esc(chipText(r, gen))}</a>`).join('')}
                    </div>
                    <div class="mt-4 flex flex-wrap gap-1.5">${conds.map((c) => `
                        <span class="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">${c}</span>`).join('')}
                    </div>
                </div>`;
    }

    function panel(tab) {
        const lines = tab.lines.map((k) => byKey[k]);
        const total = lines.reduce((n, l) => n + l.count, 0);
        const groups = lines.map((l) => `
            ${lines.length > 1 ? `<h3 class="mt-6 first:mt-0 mb-3 text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">${esc(l.sub)} · ${l.count} models</h3>` : ''}
            <div class="-mx-1 flex items-start gap-3 overflow-x-auto snap-x snap-mandatory px-1 pb-2 sm:mx-0 sm:items-stretch sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">${l.gens.map(genCard).join('')}
            </div>`).join('');
        const links = lines.map((l) => `
                <a href="${catalogueUrl(l.kind, { sub: l.sub })}" class="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:gap-3 transition-all">
                    See all ${l.count} ${esc(l.sub)} models <svg class="w-4 h-4"><use href="#i-arrow-right"/></svg>
                </a>`).join('');
        return { total, html: `${groups}<div class="mt-6 flex flex-wrap gap-x-8 gap-y-3">${links}</div>` };
    }

    function showcase(root) {
        if (!root) return;
        const built = TABS.map((t) => ({ ...t, ...panel(t) }));
        root.innerHTML = `
            <div role="tablist" aria-label="Phone brands and tablets" class="grid grid-cols-5 gap-0.5 sm:gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-card">${built.map((t, i) => `
                <button type="button" role="tab" id="ph-tab-${t.key}" aria-controls="ph-panel-${t.key}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"
                        class="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-lg px-0.5 sm:px-3 text-[11px] min-[360px]:text-[12px] min-[400px]:text-[13px] sm:text-sm font-semibold transition text-slate-600 hover:text-slate-900 aria-selected:bg-brand-600 aria-selected:text-white aria-selected:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                    ${t.short ? `<span class="sm:hidden">${esc(t.short)}</span><span class="hidden sm:inline">${esc(t.label)}</span>` : esc(t.label)}
                    <span class="hidden md:inline rounded-full bg-black/5 px-1.5 text-[11px] tabular">${t.total}</span>
                </button>`).join('')}
            </div>
            ${built.map((t, i) => `
            <div role="tabpanel" id="ph-panel-${t.key}" aria-labelledby="ph-tab-${t.key}" class="mt-6"${i === 0 ? '' : ' hidden'}>${t.html}
            </div>`).join('')}`;

        const tabs = [...root.querySelectorAll('[role="tab"]')];
        const select = (tab, focus) => {
            tabs.forEach((t) => {
                const on = t === tab;
                t.setAttribute('aria-selected', String(on));
                t.tabIndex = on ? 0 : -1;
                document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
            });
            if (focus) tab.focus();
        };
        tabs.forEach((t, i) => {
            t.addEventListener('click', () => select(t));
            t.addEventListener('keydown', (e) => {
                const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                if (step) { e.preventDefault(); select(tabs[(i + step + tabs.length) % tabs.length], true); }
                if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
                if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
            });
        });
    }

    window.InfonetPhones = { records, lines: LINES, card, showcase };

    const mount = () => showcase(document.getElementById('phoneShowcase'));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
})();
