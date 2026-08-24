// Shared behaviour for index.html and services.html.
// Every hook is optional: the same file is loaded by pages that only have some of these
// elements. (Previously this file threw a TypeError on the first missing element, which
// silently killed every listener defined after it.)

const $ = (id) => document.getElementById(id);

/* ---------------------------------------------------------------- navigation */
const menuButton = $('mobile-menu-button');
const mobileMenu = $('mobile-menu');
if (menuButton && mobileMenu) {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.addEventListener('click', () => {
        const open = !mobileMenu.classList.toggle('hidden');
        menuButton.setAttribute('aria-expanded', String(open));
    });
}

/* ------------------------------------------------------- scroll-linked buttons */
const backToTopButton = $('backToTop');
const whatsappBtn = $('whatsappBtn');
const heroSection = $('home');

const show = (el) => {
    el.classList.remove('opacity-0', 'invisible');
    el.classList.add('opacity-100', 'visible');
};
const hide = (el) => {
    el.classList.remove('opacity-100', 'visible');
    el.classList.add('opacity-0', 'invisible');
};

if (backToTopButton) {
    backToTopButton.classList.add('cursor-pointer');
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
        window.open(
            'https://wa.me/2349056467027?text=' +
            encodeURIComponent('Hello Infonet, I need help with a service request.'),
            '_blank',
            'noopener'
        );
    });
}

if (backToTopButton || whatsappBtn) {
    // One passive listener, one rAF-throttled read. Two unthrottled scroll handlers each
    // calling getBoundingClientRect() was forcing layout on every scroll event.
    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            if (backToTopButton) (window.scrollY > 300 ? show : hide)(backToTopButton);
            if (whatsappBtn) {
                const past = heroSection
                    ? window.scrollY > heroSection.offsetTop + heroSection.offsetHeight - 100
                    : window.scrollY > 300;
                (past ? show : hide)(whatsappBtn);
            }
            ticking = false;
        });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/* --------------------------------------------------------------- contact form */
// Was: alert() and discard. A form that thanks a customer and throws the enquiry away is
// worse than no form. Now it hands the enquiry to the mail client, matching the service form.
const contactForm = $('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = $('name')?.value.trim() || '';
        const email = $('email')?.value.trim() || '';
        const phone = $('phone')?.value.trim() || '';
        const service = $('service')?.value.trim() || 'General enquiry';
        const message = $('message')?.value.trim() || '';
        const subject = encodeURIComponent(`Website enquiry: ${service} — ${name}`);
        const body = encodeURIComponent(
            `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\n\n${message}`
        );
        window.location.href = `mailto:info@infonet.ng?subject=${subject}&body=${body}`;
        const note = $('contactSuccess');
        if (note) {
            note.textContent = "Opening your mail app — send the message and we'll reply shortly.";
            note.classList.remove('hidden');
        }
        this.reset();
    });
}

/* --------------------------------------------------------------- service form */
const serviceForm = $('serviceForm');
if (serviceForm) {
    serviceForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = $('email')?.value || '';
        const fullname = $('fullname')?.value || '';
        const service = $('service')?.value || '';
        const issue = $('issue')?.value || '';
        const subject = encodeURIComponent(`Service Request: ${service} from ${fullname}`);
        const body = encodeURIComponent(
            `Customer Name: ${fullname}\nEmail: ${email}\nService Needed: ${service}\n\n` +
            `Issue Description:\n${issue}`
        );
        window.location.href = `mailto:info@infonet.ng?subject=${subject}&body=${body}`;
        // Was: reveal #successModal — an element that does not exist on services.html, so
        // submitting opened the mail client and the page said nothing at all.
        const note = $('formSuccess');
        if (note) {
            note.textContent = "Opening your mail app — send the message and we'll reply the same working day.";
            note.classList.remove('hidden');
        }
        $('successModal')?.classList.remove('hidden');
        this.reset();
    });
}

$('closeModalBtn')?.addEventListener('click', () => {
    $('successModal')?.classList.add('hidden');
});

/* ------------------------------------------------------------- fade-in on view */
const fadeElements = document.querySelectorAll('.fade-in');
if (fadeElements.length) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    fadeElements.forEach((el) => {
        el.classList.add('opacity-0');
        observer.observe(el);
    });
}

/* ------------------------------------------------------------------- reviews */
// Client-side only: a review added here survives until the page reloads. It is not stored
// or sent anywhere. Persisting reviews is Phase 3 (database) in the roadmap.
const reviewForm = $('reviewForm');
const reviewSuccess = $('reviewSuccess');
const testimonialGrid = $('testimonialGrid');

if (reviewForm && testimonialGrid) {
    reviewForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = $('reviewName')?.value.trim() || 'Customer';
        const occupation = $('reviewOccupation')?.value.trim() || '';
        const text = $('reviewText')?.value.trim() || '';
        const rating = Number($('reviewRating')?.value || 5);

        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="${i <= rating ? 'fas' : 'far'} fa-star text-yellow-400"></i>`;
        }
        const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

        const card = document.createElement('div');
        card.className = 'bg-white p-8 rounded-lg shadow-md fade-in';
        card.innerHTML = `
            <div class="flex items-center mb-4"><div class="flex">${stars}</div></div>
            <p class="text-gray-600 mb-6 js-text"></p>
            <div class="flex items-center">
                <div class="w-12 h-12 rounded-full mr-4 bg-blue-600 text-white flex items-center justify-center font-bold">${initials}</div>
                <div>
                    <h4 class="font-bold text-gray-900 js-name"></h4>
                    <p class="text-gray-500 text-sm js-occupation"></p>
                </div>
            </div>`;
        // textContent, not innerHTML — a review is untrusted input, and the old version
        // interpolated it straight into markup.
        card.querySelector('.js-text').textContent = `"${text}"`;
        card.querySelector('.js-name').textContent = name;
        card.querySelector('.js-occupation').textContent = occupation;

        testimonialGrid.appendChild(card);
        if (reviewSuccess) {
            reviewSuccess.textContent = 'Thank you for your review!';
            reviewSuccess.classList.remove('hidden');
        }
        reviewForm.reset();
    });
}

/* ------------------------------------------------------- animated brand mesh */
// A slow flowing gradient in the brand blues, painted into a 220×220 canvas and
// stretched by the GPU. Cheap: ~30fps, five radial fills a frame, paused when
// off-screen. `.hero-mesh` in styles.css is the CSS ground underneath, so the
// surface is never bare — with JS off, or reduced motion, that is what shows.
(() => {
    const canvases = document.querySelectorAll('canvas.mesh-canvas');
    if (!canvases.length) return;

    const SIZE = 220;                       // internal resolution, not CSS pixels
    const BASE = '#0b1a3e';
    // x/y follow two sine waves at different rates, so the loop never repeats visibly
    // Weighted right: the headline sits on the left, so the bright pools drift
    // over the image side and the left stays dark enough for white type.
    const BLOBS = [
        { color: '30,110,250', alpha: 0.52, r: 0.62, x: [0.68, 0.16, 0.00021], y: [0.30, 0.16, 0.00017] },
        { color: '1,129,250', alpha: 0.38, r: 0.46, x: [0.82, 0.14, 0.00015], y: [0.62, 0.20, 0.00024] },
        { color: '23,60,150', alpha: 0.55, r: 0.80, x: [0.40, 0.20, 0.00011], y: [0.72, 0.16, 0.00013] },
        { color: '77,155,255', alpha: 0.22, r: 0.34, x: [0.30, 0.12, 0.00027], y: [0.24, 0.18, 0.00019] },
        { color: '10,28,78', alpha: 0.72, r: 0.70, x: [0.12, 0.10, 0.00019], y: [0.45, 0.14, 0.00022] },
    ];

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const live = new Set();

    const paint = (ctx, t) => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = BASE;
        ctx.fillRect(0, 0, SIZE, SIZE);

        ctx.globalCompositeOperation = 'lighter';
        for (const b of BLOBS) {
            const cx = (b.x[0] + Math.sin(t * b.x[2]) * b.x[1]) * SIZE;
            const cy = (b.y[0] + Math.cos(t * b.y[2]) * b.y[1]) * SIZE;
            const r = b.r * SIZE;
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            g.addColorStop(0, `rgba(${b.color},${b.alpha})`);
            g.addColorStop(0.55, `rgba(${b.color},${b.alpha * 0.35})`);
            g.addColorStop(1, `rgba(${b.color},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Vignette last, so the corners stay dark enough to carry white type.
        ctx.globalCompositeOperation = 'source-over';
        const v = ctx.createRadialGradient(SIZE / 2, SIZE * 0.42, SIZE * 0.12, SIZE / 2, SIZE * 0.5, SIZE * 0.78);
        v.addColorStop(0, 'rgba(8,18,48,0)');
        v.addColorStop(1, 'rgba(8,18,48,0.62)');
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, SIZE, SIZE);
    };

    const contexts = [];
    canvases.forEach((c) => {
        c.width = SIZE;
        c.height = SIZE;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        contexts.push({ canvas: c, ctx });
        paint(ctx, 0);
        requestAnimationFrame(() => c.classList.add('is-live'));
    });
    if (!contexts.length) return;

    // Only animate what is actually on screen.
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => (e.isIntersecting ? live.add(e.target) : live.delete(e.target)));
        }, { threshold: 0 });
        contexts.forEach(({ canvas }) => io.observe(canvas));
    } else {
        contexts.forEach(({ canvas }) => live.add(canvas));
    }

    let last = 0;
    let running = false;
    const loop = (now) => {
        if (reduced.matches) { running = false; return; }
        if (now - last > 33) {                       // ~30fps is plenty for this
            last = now;
            contexts.forEach(({ canvas, ctx }) => {
                if (live.has(canvas)) paint(ctx, now);
            });
        }
        requestAnimationFrame(loop);
    };

    const start = () => {
        if (running || reduced.matches) return;      // never stack two rAF loops
        running = true;
        requestAnimationFrame(loop);
    };
    start();
    // Someone can turn reduced motion on mid-visit; respect it without a reload.
    reduced.addEventListener?.('change', (e) => {
        if (e.matches) contexts.forEach(({ ctx }) => paint(ctx, 0));
        else start();
    });
})();

/* ============================================================== cart store ==
 * An order pad, not a till. Items live in localStorage on the customer's own
 * device; nothing is sent anywhere until they press the WhatsApp button at the
 * end of checkout. No payment is taken on this site — see checkout.html.
 * ========================================================================== */
const Cart = (() => {
    const KEY = 'infonet.cart.v1';
    const listeners = new Set();

    // Every read is defensive: private mode throws on access, and a hand-edited
    // or half-written value must never take the whole page down with it.
    const read = () => {
        try {
            const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
            if (!Array.isArray(raw)) return [];
            return raw
                .filter((i) => i && typeof i.id === 'string' && Number.isFinite(+i.price))
                .map((i) => ({
                    id: String(i.id),
                    name: String(i.name || 'Item'),
                    desc: String(i.desc || ''),
                    img: String(i.img || ''),
                    price: Math.max(0, Math.round(+i.price)),
                    qty: Math.min(99, Math.max(1, Math.round(+i.qty) || 1)),
                }));
        } catch { return []; }
    };

    const write = (items) => {
        try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* private mode */ }
        listeners.forEach((fn) => fn(items));
        paintBadges(items);
    };

    const count = (items = read()) => items.reduce((s, i) => s + i.qty, 0);
    const total = (items = read()) => items.reduce((s, i) => s + i.price * i.qty, 0);

    function paintBadges(items = read()) {
        const n = count(items);
        document.querySelectorAll('[data-cart-count]').forEach((el) => {
            el.textContent = n > 99 ? '99+' : String(n);
            el.hidden = n === 0;
        });
    }

    const api = {
        read, count, total,
        onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

        add(item, qty = 1) {
            const items = read();
            const found = items.find((i) => i.id === item.id);
            if (found) found.qty = Math.min(99, found.qty + qty);
            else items.push({ ...item, price: Math.round(+item.price) || 0, qty });
            write(items);
            return count(items);
        },

        setQty(id, qty) {
            const items = read().map((i) => (i.id === id ? { ...i, qty: Math.min(99, Math.max(0, qty)) } : i))
                                .filter((i) => i.qty > 0);
            write(items);
        },

        remove(id) { write(read().filter((i) => i.id !== id)); },
        clear() { write([]); },

        naira: (n) => '₦' + Number(n || 0).toLocaleString('en-NG'),
        // "₦350,000" -> 350000. The catalogue stores prices as display strings.
        parse: (s) => Math.round(Number(String(s).replace(/[^\d.]/g, '')) || 0),
        slug: (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    };

    paintBadges();
    // A second tab is the same cart. Keep the badge honest across both.
    window.addEventListener('storage', (e) => {
        if (e.key === KEY) { const items = read(); paintBadges(items); listeners.forEach((fn) => fn(items)); }
    });

    return api;
})();
window.Cart = Cart;

/* ------------------------------------------------------------ add-to-cart */
// One delegated listener for every [data-add-to-cart] on the page, so buttons
// rendered later by the catalogue's own JS are picked up without re-binding.
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    e.preventDefault();

    Cart.add({
        id: btn.dataset.id || Cart.slug(btn.dataset.name || ''),
        name: btn.dataset.name || 'Item',
        desc: btn.dataset.desc || '',
        img: btn.dataset.img || '',
        price: Cart.parse(btn.dataset.price),
    });

    const original = btn.dataset.label || btn.innerHTML;
    btn.dataset.label = original;
    btn.innerHTML = '<i class="fas fa-check"></i> Added';
    btn.classList.add('is-added');
    clearTimeout(btn._t);
    btn._t = setTimeout(() => {
        btn.innerHTML = btn.dataset.label;
        btn.classList.remove('is-added');
    }, 1400);
});
