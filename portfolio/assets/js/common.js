/**
 * common.js — shared behaviors for every business template in this portfolio.
 * Covers: sticky nav, mobile menu, smooth scroll, scroll-reveal animation,
 * FAQ accordion, contact form validation, and back-to-top button.
 * Each site's own script.js should call TemplateCore.init() on DOMContentLoaded.
 *
 * PERF NOTES (2026-08 pass):
 * - All scroll handlers are wrapped in rafThrottle() so work happens at most
 *   once per animation frame instead of once per scroll event (scroll events
 *   can fire 60-120+ times/sec on trackpads/high-refresh phones).
 * - Sticky nav no longer changes `height` on scroll (that's a layout/reflow
 *   trigger). Height is fixed in CSS; only background/box-shadow/padding
 *   should change in the .is-scrolled state. See the accompanying CSS notes.
 */
const TemplateCore = (function () {
  // Run fn at most once per animation frame, always with the latest args.
  function rafThrottle(fn) {
    let ticking = false;
    let lastArgs = null;
    return function throttled(...args) {
      lastArgs = args;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          fn.apply(null, lastArgs);
          ticking = false;
        });
      }
    };
  }

  function initStickyNav() {
    const nav = document.querySelector('[data-nav]');
    if (!nav) return;
    const trigger = 40;
    const onScroll = rafThrottle(() => {
      const shouldBeScrolled = window.scrollY > trigger;
      // Avoid needless classList writes (each one can trigger style recalc).
      if (shouldBeScrolled === nav.classList.contains('is-scrolled')) return;
      nav.classList.toggle('is-scrolled', shouldBeScrolled);
    });
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initMobileMenu() {
    const toggle = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-menu]');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.classList.toggle('is-active', isOpen);
      document.body.classList.toggle('no-scroll', isOpen);
    });
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.classList.remove('is-active');
        document.body.classList.remove('no-scroll');
      });
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const navHeight = document.querySelector('[data-nav]')?.offsetHeight || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  function initScrollReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach((el) => observer.observe(el));
  }

  function initFaqAccordion() {
    document.querySelectorAll('[data-faq-item]').forEach((item) => {
      const question = item.querySelector('[data-faq-question]');
      if (!question) return;
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        item.closest('[data-faq-list]')
          ?.querySelectorAll('[data-faq-item]')
          .forEach((sibling) => sibling.classList.remove('is-open'));
        if (!isOpen) item.classList.add('is-open');
      });
    });
  }

  function initBackToTop() {
    const btn = document.querySelector('[data-back-to-top]');
    if (!btn) return;
    const onScroll = rafThrottle(() => {
      const shouldShow = window.scrollY > 600;
      if (shouldShow === btn.classList.contains('is-visible')) return;
      btn.classList.toggle('is-visible', shouldShow);
    });
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function validateField(field) {
    const errorEl = field.parentElement.querySelector('[data-error]');
    let message = '';
    const value = field.value.trim();

    if (field.hasAttribute('required') && !value) {
      message = 'This field is required.';
    } else if (field.type === 'email' && value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) message = 'Enter a valid email address.';
    } else if (field.type === 'tel' && value) {
      const phonePattern = /^[0-9+\-\s()]{7,}$/;
      if (!phonePattern.test(value)) message = 'Enter a valid phone number.';
    }

    field.classList.toggle('is-invalid', Boolean(message));
    if (errorEl) errorEl.textContent = message;
    return !message;
  }

  function initContactForm() {
    const form = document.querySelector('[data-contact-form]');
    if (!form) return;
    const fields = form.querySelectorAll('input[required], textarea[required], input[type="email"], input[type="tel"]');
    const status = form.querySelector('[data-form-status]');

    fields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      fields.forEach((field) => {
        if (!validateField(field)) valid = false;
      });

      if (!valid) {
        if (status) {
          status.textContent = 'Please fix the highlighted fields and try again.';
          status.className = 'form-status form-status--error';
        }
        return;
      }

      if (status) {
        status.textContent = "Thanks — that's a demo form, so nothing was sent, but this is where a confirmation would appear.";
        status.className = 'form-status form-status--success';
      }
      form.reset();
    });
  }

  function init() {
    initStickyNav();
    initMobileMenu();
    initSmoothScroll();
    initScrollReveal();
    initFaqAccordion();
    initBackToTop();
    initContactForm();
  }

  return { init, validateField };
})();
