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
        fadeElements.forEach(element => {
            element.classList.add('opacity-0');
            observer.observe(element);
        });

        // Service form submission
        document.getElementById('serviceForm').addEventListener('submit', function(e) {
            e.preventDefault();
            // Get form values
            const email = document.getElementById('email').value;
            const fullname = document.getElementById('fullname').value;
            const service = document.getElementById('service').value;
            const issue = document.getElementById('issue').value;

            // Compose mailto link
            const subject = encodeURIComponent(`Service Request: ${service} from ${fullname}`);
            const body = encodeURIComponent(
                `Customer Name: ${fullname}\nEmail: ${email}\nService Needed: ${service}\n\nIssue Description:\n${issue}`
            );
            const mailto = `mailto:danielobialor121@gmail.com?subject=${subject}&body=${body}`;

            // Open mail client
            window.location.href = mailto;

            // Show success modal
            document.getElementById('successModal').classList.remove('hidden');
            this.reset();
        });

        // Modal close button
        document.getElementById('closeModalBtn').addEventListener('click', function() {
            document.getElementById('successModal').classList.add('hidden');
        });

        // Add review functionality for testimonials section
document.addEventListener('DOMContentLoaded', function () {
    const reviewForm = document.getElementById('reviewForm');
    const reviewSuccess = document.getElementById('reviewSuccess');
    const testimonialGrid = document.getElementById('testimonialGrid');

    if (reviewForm && testimonialGrid) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get form values
            const name = document.getElementById('reviewName').value.trim();
            const occupation = document.getElementById('reviewOccupation').value.trim();
            const text = document.getElementById('reviewText').value.trim();
            const rating = document.getElementById('reviewRating').value;

            // Create stars HTML
            let stars = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) {
                    stars += '<i class="fas fa-star text-yellow-400"></i>';
                } else {
                    stars += '<i class="far fa-star text-yellow-400"></i>';
                }
            }

            // Create new testimonial card
            const newTestimonial = document.createElement('div');
            newTestimonial.className = "bg-white p-8 rounded-lg shadow-md fade-in";
            newTestimonial.innerHTML = `
                <div class="flex items-center mb-4">
                    <div class="flex">${stars}</div>
                </div>
                <p class="text-gray-600 mb-6">"${text}"</p>
                <div class="flex items-center">
                    <img src="https://randomuser.me/api/portraits/lego/${Math.floor(Math.random()*10)}.jpg" alt="${name}" class="w-12 h-12 rounded-full mr-4">
                    <div>
                        <h4 class="font-bold text-gray-900">${name}</h4>
                        <p class="text-gray-500 text-sm">${occupation}</p>
                    </div>
                </div>
            `;

            // Add testimonial to grid
            testimonialGrid.appendChild(newTestimonial);

            // Show success message
            reviewSuccess.textContent = "Thank you for your review!";
            reviewSuccess.classList.remove('hidden');

            // Reset form
            reviewForm.reset();
        });
    }
});