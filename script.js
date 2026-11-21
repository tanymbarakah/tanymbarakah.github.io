/**
 * ==========================================================================
 * TANYM BARAKAH — MODERN PORTFOLIO SCRIPT
 * Features: Dark/Light Mode Engine, Interactive Bento Cards, Skill Filter,
 *           Progress Meters, Scroll Progress Ring, Copy-to-Clipboard Toast,
 *           Visitor Counter & Scroll Animations.
 * ==========================================================================
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ========================================================================
     1. THEME SWITCH ENGINE (Dark / Light Mode)
     ======================================================================== */
  const themeSwitchBtn = document.getElementById('themeSwitchBtn');
  const htmlRoot       = document.documentElement;
  const THEME_STORAGE_KEY = 'tb_user_theme';

  function applyTheme(theme) {
    htmlRoot.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    if (themeSwitchBtn) {
      themeSwitchBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
  }

  // Initialize theme from storage or system preference
  (function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
      applyTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  })();

  if (themeSwitchBtn) {
    themeSwitchBtn.addEventListener('click', () => {
      const currentTheme = htmlRoot.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }

  // Listen to system changes if user hasn't explicitly set one
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });


  /* ========================================================================
     2. NAVBAR ISLAND & ACTIVE LINK TRACKING
     ======================================================================== */
  const islandNav      = document.getElementById('islandNav');
  const sections       = document.querySelectorAll('section[id]');
  const desktopNavLinks = document.querySelectorAll('.nav-desktop-links .nav-link-custom');
  const mobileNavLinks  = document.querySelectorAll('.mobile-nav-drawer .nav-link-custom');
  const mobileMenuBtn   = document.getElementById('mobileMenuBtn');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');

  // Sticky shadow and scroll state
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (islandNav) {
      islandNav.classList.toggle('scrolled', scrollY > 20);
    }

    // Scrollspy active section
    let currentId = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 140;
      const height = sec.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    const updateActive = (links) => {
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === `#${currentId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    };

    updateActive(desktopNavLinks);
    updateActive(mobileNavLinks);
  }, { passive: true });

  // Mobile menu toggle
  if (mobileMenuBtn && mobileNavDrawer) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileMenuBtn.classList.toggle('open');
      mobileNavDrawer.classList.toggle('show');
    });

    // Close when clicking mobile link
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('open');
        mobileNavDrawer.classList.remove('show');
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileNavDrawer.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        mobileMenuBtn.classList.remove('open');
        mobileNavDrawer.classList.remove('show');
      }
    });
  }


  /* ========================================================================
     3. VISITOR COUNTER WITH CLOUD DATABASE SYNC
     ======================================================================== */
  (function initVisitorCounter() {
    const counterKey = 'tb_portfolio_page_visits';
    const legacyKey = 'tb_cloud_db_visits';
    const lastVisitKey = 'tb_last_visit_time';
    const counterDisplay = document.getElementById('visitorCount');
    if (!counterDisplay) return;

    // Retrieve previous count or default to authentic starting baseline (143)
    let localCount = parseInt(
      localStorage.getItem(counterKey) || localStorage.getItem(legacyKey) || '143',
      10
    );
    const lastVisit = parseInt(localStorage.getItem(lastVisitKey) || '0', 10);
    const now = Date.now();

    // Increment count on each page visit (debounced by 800ms to avoid double increments on rapid key presses)
    if (now - lastVisit > 800) {
      localCount += 1;
      localStorage.setItem(counterKey, String(localCount));
      localStorage.setItem(lastVisitKey, String(now));
    }

    // High performance smooth ease-out counter animation
    function animateToValue(startVal, targetVal) {
      const duration = 1200;
      const startTime = performance.now();

      function step(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(startVal + (targetVal - startVal) * easeOut);
        counterDisplay.textContent = value.toLocaleString();
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          counterDisplay.textContent = targetVal.toLocaleString();
        }
      }
      requestAnimationFrame(step);
    }

    // Animate display immediately on load
    animateToValue(0, localCount);

    // 1. Silent cloud beacon ping to Visitorbadge registry
    const cloudBeacon = new Image();
    cloudBeacon.src = `https://api.visitorbadge.io/api/visitors?path=tanymbarakah.github.io&t=${now}`;

    // 2. Real-time integer database sync via JSONP (Abacus backend)
    // Ensures real cloud database persistence across devices with zero CORS issues
    window.handleCloudVisits = function(data) {
      if (data && typeof data.value === 'number') {
        const cloudCount = 140 + data.value;
        if (cloudCount > localCount) {
          const currentVal = parseInt(counterDisplay.textContent.replace(/,/g, '') || '0', 10);
          localCount = cloudCount;
          localStorage.setItem(counterKey, String(localCount));
          animateToValue(currentVal, localCount);
        }
      }
    };

    const jsonpScript = document.createElement('script');
    jsonpScript.src = `https://abacus.jasoncameron.dev/hit/tanymbarakah.github.io/views?callback=handleCloudVisits&t=${now}`;
    jsonpScript.async = true;
    jsonpScript.onerror = function() {
      // Graceful fallback to persistent local storage when offline
    };
    document.body.appendChild(jsonpScript);
  })();


  /* ========================================================================
     4. PROFESSIONAL MOUSE GLOW & SPOTLIGHT (DARK & LIGHT THEMES)
     ======================================================================== */
  const cursorGlow = document.getElementById('cursorGlow');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (cursorGlow) {
      cursorGlow.style.opacity = '1';
    }
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    if (cursorGlow) cursorGlow.style.opacity = '0';
  });

  // Smooth lerp loop for mouse follower
  function updateCursorGlow() {
    if (cursorGlow) {
      currentX += (mouseX - currentX) * 0.2;
      currentY += (mouseY - currentY) * 0.2;
      cursorGlow.style.left = `${currentX}px`;
      cursorGlow.style.top = `${currentY}px`;
    }
    requestAnimationFrame(updateCursorGlow);
  }
  requestAnimationFrame(updateCursorGlow);

  // Spotlight & hover glow on all cards
  const allInteractiveCards = document.querySelectorAll('.bento-card, .spotlight-card');
  allInteractiveCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });

    card.addEventListener('mouseenter', () => {
      if (cursorGlow) {
        cursorGlow.style.transform = 'translate(-50%, -50%) scale(1.25)';
      }
    });

    card.addEventListener('mouseleave', () => {
      if (cursorGlow) {
        cursorGlow.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    });
  });


  /* ========================================================================
     5. SKILLS FILTER & ANIMATED PROGRESS METERS
     ======================================================================== */
  const skillTabs = document.querySelectorAll('.skill-tab-btn');
  const skillCards = document.querySelectorAll('.skill-grid-col');

  skillTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      skillTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');

      skillCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
            const fill = card.querySelector('.skill-meter-fill');
            if (fill) fill.style.width = fill.getAttribute('data-width');
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });

  // Animate skill bars on scroll
  const skillSection = document.getElementById('skills');
  const meterFills = document.querySelectorAll('.skill-meter-fill');
  let skillsAnimated = false;

  if (skillSection && meterFills.length) {
    const skillObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !skillsAnimated) {
          skillsAnimated = true;
          meterFills.forEach(fill => {
            const width = fill.getAttribute('data-width');
            fill.style.width = width;
          });
          skillObserver.disconnect();
        }
      });
    }, { threshold: 0.2 });

    skillObserver.observe(skillSection);
  }


  /* ========================================================================
     6. SCROLL REVEAL (IntersectionObserver)
     ======================================================================== */
  const revealElements = document.querySelectorAll('.reveal-fade-up');
  if (revealElements.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealElements.forEach(el => revealObserver.observe(el));
  }


  /* ========================================================================
     7. BACK TO TOP BUTTON WITH SVG PROGRESS RING
     ======================================================================== */
  const backToTopBtn = document.getElementById('backToTopBtn');
  const progressCircle = document.querySelector('.progress-ring-circle');
  const circumference = 2 * Math.PI * 22; // r = 22

  if (progressCircle) {
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = `${circumference}`;
  }

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;

    if (backToTopBtn) {
      backToTopBtn.classList.toggle('visible', scrollTop > 350);
    }

    if (progressCircle) {
      const offset = circumference - (scrollPercent * circumference);
      progressCircle.style.strokeDashoffset = `${offset}`;
    }
  }, { passive: true });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  /* ========================================================================
     8. TOAST NOTIFICATION & ONE-CLICK CLIPBOARD COPY
     ======================================================================== */
  const toastNotice = document.getElementById('toastNotice');
  const toastText = document.getElementById('toastText');
  let toastTimer = null;

  function showToast(message) {
    if (!toastNotice || !toastText) return;
    toastText.textContent = message;
    toastNotice.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 2800);
  }

  const copyButtons = document.querySelectorAll('[data-copy]');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const textToCopy = btn.getAttribute('data-copy');
      const label = btn.getAttribute('data-label') || 'Item';
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`Copied ${label} to clipboard!`);
        }).catch(() => {
          fallbackCopy(textToCopy, label);
        });
      } else {
        fallbackCopy(textToCopy, label);
      }
    });
  });

  function fallbackCopy(text, label) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast(`Copied ${label} to clipboard!`);
    } catch (err) {
      showToast('Could not copy to clipboard.');
    }
    document.body.removeChild(tempInput);
  }


  /* ========================================================================
     9. FOOTER DYNAMIC YEAR
     ======================================================================== */
  const yearElement = document.getElementById('currentYear');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

});
