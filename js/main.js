document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Navigation ---
    const navToggle = document.getElementById('navToggle');
    const sidebar = document.getElementById('sidebar');
    const navOverlay = document.getElementById('navOverlay');

    function openNav() {
        sidebar.classList.add('active');
        navToggle.classList.add('active');
        navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        sidebar.classList.remove('active');
        navToggle.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            sidebar.classList.contains('active') ? closeNav() : openNav();
        });
    }

    if (navOverlay) {
        navOverlay.addEventListener('click', closeNav);
    }

    // Close nav on link click (mobile)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeNav();
        });
    });

    // --- Active Section Highlighting ---
    const sections = document.querySelectorAll('.section[id]');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.dataset.section === id);
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));

    // --- Project Gallery ---
    const galleryTrack = document.getElementById('galleryTrack');
    const galleryDots = document.getElementById('galleryDots');

    if (galleryTrack) {
        const slides = galleryTrack.querySelectorAll('.gallery-slide');
        const prevBtn = document.querySelector('.gallery-prev');
        const nextBtn = document.querySelector('.gallery-next');
        let currentSlide = 0;
        let autoplayTimer;

        // Create dots
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = `gallery-dot${i === 0 ? ' active' : ''}`;
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => goToSlide(i));
            galleryDots.appendChild(dot);
        });

        function goToSlide(index) {
            currentSlide = ((index % slides.length) + slides.length) % slides.length;
            galleryTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
            document.querySelectorAll('.gallery-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
            resetAutoplay();
        }

        function resetAutoplay() {
            clearInterval(autoplayTimer);
            autoplayTimer = setInterval(() => goToSlide(currentSlide + 1), 4000);
        }

        if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));

        resetAutoplay();

        // Pause on hover
        galleryTrack.closest('.projects-gallery').addEventListener('mouseenter', () => clearInterval(autoplayTimer));
        galleryTrack.closest('.projects-gallery').addEventListener('mouseleave', resetAutoplay);
    }

    // --- Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // --- Reveal animations on scroll ---
    const revealElements = document.querySelectorAll('.game-card, .blog-card, .about-card');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        revealObserver.observe(el);
    });
});
