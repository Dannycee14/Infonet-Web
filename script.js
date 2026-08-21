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
        window.location.href = `mailto:danielobialor121@gmail.com?subject=${subject}&body=${body}`;
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
        window.location.href = `mailto:danielobialor121@gmail.com?subject=${subject}&body=${body}`;
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
