/**
 * TANYM BARAKAH — PORTFOLIO SCRIPT
 * Features: Dark/Light mode, Visitor counter, Scroll animations,
 *           Skill bar animation, Back-to-top, Active nav tracking
 */

'use strict';

/* ============================================================
   1. THEME TOGGLE — Dark / Light Mode
   ============================================================ */
// Select all toggle buttons (mobile + desktop)
const themeToggles = document.querySelectorAll('.theme-toggle-btn');
const htmlEl       = document.documentElement;

/**
 * Apply the given theme and persist the preference.
 * @param {'dark'|'light'} theme
 */
function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  localStorage.setItem('tb-theme', theme);
}

// On first load, honour saved preference (or system preference)
(function initTheme() {
  const saved  = localStorage.getItem('tb-theme');
  const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  applyTheme(saved || system);
})();

themeToggles.forEach(btn => {
  btn.addEventListener('click', () => {
    const current = htmlEl.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
});


/* ============================================================
   2. VISITOR COUNTER
   Stored in localStorage — resets when storage is cleared.
   ============================================================ */
(function initCounter() {
  const key   = 'tb-visitor-count';
  // Increment count each time the page loads in a new session
  const sessionKey = 'tb-counted-this-session';

  let count = parseInt(localStorage.getItem(key) || '0', 10);

  if (!sessionStorage.getItem(sessionKey)) {
    count += 1;
    localStorage.setItem(key, String(count));
    sessionStorage.setItem(sessionKey, '1');
  }

  // Animate the counter from 0 to count
  const el = document.getElementById('visitorCount');
  if (!el) return;

  let current = 0;
  const duration = 1800;   // ms
  const start    = performance.now();

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    current        = Math.round(eased * count);
    el.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
})();


/* ============================================================
   3. NAVBAR — scroll behaviour & active-link tracking
   ============================================================ */
const navbar   = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

window.addEventListener('scroll', () => {
  // Navbar shadow on scroll
  if (window.scrollY > 40) {
    navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.25)';
  } else {
    navbar.style.boxShadow = 'none';
  }

  // Active section highlight
  let current = '';
  sections.forEach(sec => {
    const top = sec.offsetTop - 100;
    if (window.scrollY >= top) current = sec.id;
  });

  navLinks.forEach(link => {
    link.classList.toggle(
      'active',
      link.getAttribute('href') === `#${current}`
    );
  });

  // Back-to-top visibility
  document.getElementById('backToTop').classList.toggle(
    'visible',
    window.scrollY > 400
  );
}, { passive: true });

// Close mobile menu after clicking a link
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    const collapse = document.getElementById('navbarNav');
    if (collapse && collapse.classList.contains('show')) {
      collapse.classList.remove('show');
    }
  });
});


/* ============================================================
   4. BACK-TO-TOP BUTTON
   ============================================================ */
document.getElementById('backToTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


/* ============================================================
   5. SCROLL REVEAL ANIMATION
   ============================================================ */
(function initReveal() {
  const revealEls = document.querySelectorAll('.reveal');

  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Unobserve once revealed for performance
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealEls.forEach(el => observer.observe(el));
})();


/* ============================================================
   6. SKILL BAR ANIMATION
   Triggered when the #skills section enters the viewport.
   ============================================================ */
(function initSkillBars() {
  const skillSection = document.getElementById('skills');
  const bars         = document.querySelectorAll('.skill-bar');

  if (!skillSection || !bars.length) return;

  let animated = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          bars.forEach(bar => {
            const target = bar.getAttribute('data-width');
            // Small delay to let the reveal animation settle
            setTimeout(() => { bar.style.width = target; }, 150);
          });
          observer.disconnect();
        }
      });
    },
    { threshold: 0.25 }
  );

  observer.observe(skillSection);
})();


/* ============================================================
   7. DYNAMIC COPYRIGHT YEAR
   ============================================================ */
const yearEl = document.getElementById('currentYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();


/* ============================================================
   8. SMOOTH SCROLL — polyfill anchor clicks
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80; // navbar height
    const top    = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
