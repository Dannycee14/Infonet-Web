
// Mobile menu toggle
document.getElementById('mobile-menu-button').addEventListener('click', function () {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
});

// Back to top button
const backToTopButton = document.getElementById('backToTop');
backToTopButton.classList.add('cursor-pointer'); // Add pointer cursor for better UX

window.addEventListener('scroll', function () {
    if (window.pageYOffset > 300) {
        backToTopButton.classList.remove('opacity-0', 'invisible');
        backToTopButton.classList.add('opacity-100', 'visible');
    } else {
        backToTopButton.classList.remove('opacity-100', 'visible');
        backToTopButton.classList.add('opacity-0', 'invisible');
    }
});

backToTopButton.addEventListener('click', function () {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// WhatsApp button show/hide after hero section
const whatsappBtn = document.getElementById('whatsappBtn');
window.addEventListener('scroll', function () {
    const heroSection = document.getElementById('home');
    const heroBottom = heroSection.getBoundingClientRect().bottom + window.scrollY;
    if (window.scrollY > heroBottom - 100) {
        whatsappBtn.classList.remove('opacity-0', 'invisible');
        whatsappBtn.classList.add('opacity-100', 'visible');
    } else {
        whatsappBtn.classList.remove('opacity-100', 'visible');
        whatsappBtn.classList.add('opacity-0', 'invisible');
    }
});

whatsappBtn.addEventListener('click', function () {
    window.open('https://wa.me/2349056467027?text=Hello%20Infonet%2C%20I%20need%20help%20with%20a%20service%20request.', '_blank');
});

// Form submission
document.getElementById('contactForm').addEventListener('submit', function (e) {
    e.preventDefault();

    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    // Here you would typically send this data to a server
    // For this example, we'll just show an alert
    alert(`Thank you, ${name}! Your message has been received. We'll contact you at ${email} soon.`);

    // Reset form
    this.reset();
});

// Add fade-in class to elements when they come into view
const fadeElements = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1
});

fadeElements.forEach(element => {
    element.classList.add('opacity-0');
    observer.observe(element);
});
