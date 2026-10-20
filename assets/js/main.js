/**
 * Main Controller: Navigation, Scroll, Dynamic Database Rendering, Modal, Contact Form, Easter Egg
 * Completely integrates with PortfolioDbLoader and PortfolioSupabase.
 * Safe DOM rendering (no unchecked raw innerHTML), skeleton loading, and offline fallback.
 */

document.addEventListener('DOMContentLoaded', () => {
  /* --------------------------------------------------------------------------
     1. SCROLL PROGRESS & HEADER STATE
     -------------------------------------------------------------------------- */
  const scrollProgress = document.getElementById('scroll-progress');
  const siteHeader = document.querySelector('.site-header');

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
    if (scrollProgress) {
      scrollProgress.style.width = `${progress}%`;
    }

    if (siteHeader) {
      if (window.scrollY > 40) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
    }
  }, { passive: true });

  /* --------------------------------------------------------------------------
     2. REVEAL-ON-SCROLL (INTERSECTION OBSERVER)
     -------------------------------------------------------------------------- */
  function observeReveals() {
    const revealElements = document.querySelectorAll('.reveal:not(.active)');
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.15
      });

      revealElements.forEach(el => revealObserver.observe(el));
    } else {
      revealElements.forEach(el => el.classList.add('active'));
    }
  }

  observeReveals();

  /* --------------------------------------------------------------------------
     3. MOBILE NAVIGATION DRAWER
     -------------------------------------------------------------------------- */
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenuWrapper = document.querySelector('.nav-menu-wrapper');

  if (mobileToggle && navMenuWrapper) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navMenuWrapper.classList.toggle('open');
      mobileToggle.classList.toggle('active', isOpen);
      mobileToggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navMenuWrapper.querySelectorAll('.nav-item a').forEach(link => {
      link.addEventListener('click', () => {
        navMenuWrapper.classList.remove('open');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* --------------------------------------------------------------------------
     4. DATA LOADING & SAFE PROJECTS RENDERING
     -------------------------------------------------------------------------- */
  const projectsGrid = document.querySelector('.projects-grid');

  function getProjectsList() {
    if (window.PortfolioDbLoader) {
      const dbProjects = window.PortfolioDbLoader.getProjects();
      if (dbProjects && dbProjects.length > 0) return dbProjects;
    }
    return window.portfolioProjects || [];
  }

  function renderSkeletonProjects(count = 3) {
    if (!projectsGrid) return;
    projectsGrid.innerHTML = Array(count).fill(0).map(() => `
      <article class="project-card skeleton-card" style="opacity: 0.7; pointer-events: none;">
        <div class="project-media-wrapper" style="background: rgba(255,255,255,0.05); min-height: 220px; animation: pulse 1.5s infinite;"></div>
        <div class="project-content">
          <div style="height: 20px; background: rgba(255,255,255,0.08); border-radius: 4px; margin-bottom: 12px; width: 60%;"></div>
          <div style="height: 14px; background: rgba(255,255,255,0.04); border-radius: 4px; margin-bottom: 8px;"></div>
          <div style="height: 14px; background: rgba(255,255,255,0.04); border-radius: 4px; width: 80%;"></div>
        </div>
      </article>
    `).join('');
  }

  function createProjectCardHTML(p) {
    const currentLang = localStorage.getItem('portfolio_lang') || 'en';
    const dict = window.portfolioTranslations ? window.portfolioTranslations[currentLang] : null;

    const liveDemoText = dict?.project_live_demo || "Live Demo";
    const githubText = dict?.project_github || "GitHub";
    const viewDetailsText = dict?.project_view_details || "View Details";

    const sanitize = window.PortfolioSupabase?.sanitizeUrl || ((u) => u);
    const escape = window.PortfolioSupabase?.escapeHTML || ((s) => s);

    const title = escape(p.title || '');
    const pId = escape(p.slug || p.id || '');
    const category = escape(p.category || 'fullstack');
    const categoryLabel = escape(p[`category_label_${currentLang}`] || p.category_label_en || p.categoryLabel || category);
    const desc = escape(p[`description_${currentLang}`] || p.description_en || p.description || '');

    const imgUrl = sanitize(p.image_url || p.image || '');
    const fallbackImg = sanitize(p.fallback_image_url || p.fallbackImage || imgUrl);
    const liveUrl = sanitize(p.live_url || p.liveDemoUrl, null);
    const githubUrl = sanitize(p.github_url || p.githubUrl, null);

    const liveBtn = liveUrl && liveUrl !== '#'
      ? `<a href="${liveUrl}" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
           <span>${liveDemoText}</span>
         </a>`
      : '';

    const githubBtn = githubUrl && githubUrl !== '#'
      ? `<a href="${githubUrl}" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
           <span>${githubText}</span>
         </a>`
      : '';

    return `
      <article class="project-card reveal active" data-category="${category}" id="project-${pId}">
        <div class="project-card-glare"></div>
        <div class="project-media-wrapper" onclick="window.openProjectModal('${pId}')" role="button" tabindex="0" aria-label="${title} - ${viewDetailsText}">
          <img src="${imgUrl}" alt="${title}" class="project-media" loading="lazy" onerror="this.onerror=null; this.src='${fallbackImg}'">
          <span class="project-category-badge">${categoryLabel}</span>
        </div>
        <div class="project-content">
          <h3 class="project-title" onclick="window.openProjectModal('${pId}')">${title}</h3>
          <p class="project-desc">${desc}</p>
          <div class="project-actions">
            <button type="button" class="btn btn-primary btn-sm" onclick="window.openProjectModal('${pId}')">
              ${viewDetailsText}
            </button>
            ${liveBtn}
            ${githubBtn}
          </div>
        </div>
      </article>
    `;
  }

  function renderProjects() {
    if (!projectsGrid) return;
    const isHomePage = document.body.classList.contains('page-home');
    const allProjects = getProjectsList();
    const displayProjects = isHomePage ? allProjects.filter(p => p.featured) : allProjects;

    if (displayProjects.length === 0) {
      projectsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: var(--space-2xl);">No projects found.</div>`;
      return;
    }

    projectsGrid.innerHTML = displayProjects.map(createProjectCardHTML).join('');
    observeReveals();
  }

  // Initial skeleton render, then populate when data is ready
  if (projectsGrid) {
    const isHomePage = document.body.classList.contains('page-home');
    renderSkeletonProjects(isHomePage ? 3 : 6);
    renderProjects();
    document.addEventListener('portfolio-data-ready', renderProjects);
  }

  // Category filter on projects.html
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length > 0 && projectsGrid) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.getAttribute('data-filter');
        const cards = projectsGrid.querySelectorAll('.project-card');

        cards.forEach(card => {
          const cardCat = card.getAttribute('data-category');
          if (category === 'all' || cardCat === category) {
            card.style.display = 'flex';
            setTimeout(() => card.classList.add('active'), 30);
          } else {
            card.style.display = 'none';
            card.classList.remove('active');
          }
        });
      });
    });
  }

  /* --------------------------------------------------------------------------
     5. PROJECT DETAIL MODAL
     -------------------------------------------------------------------------- */
  const projectModal = document.getElementById('project-modal');
  window.openProjectModal = function(projectId) {
    const allProjects = getProjectsList();
    const p = allProjects.find(item => (item.slug === projectId || item.id === projectId));
    if (!p || !projectModal) return;

    const modalBody = projectModal.querySelector('.modal-body');
    if (!modalBody) return;

    const currentLang = localStorage.getItem('portfolio_lang') || 'en';
    const dict = window.portfolioTranslations ? window.portfolioTranslations[currentLang] : null;

    const sanitize = window.PortfolioSupabase?.sanitizeUrl || ((u) => u);
    const escape = window.PortfolioSupabase?.escapeHTML || ((s) => s);

    const title = escape(p.title || '');
    const categoryLabel = escape(p[`category_label_${currentLang}`] || p.category_label_en || p.categoryLabel || p.category || '');
    const desc = escape(p[`description_${currentLang}`] || p.description_en || p.description || '');
    const overview = escape(p[`detailed_overview_${currentLang}`] || p.detailed_overview_en || p.detailedOverview || desc);

    const imgUrl = sanitize(p.image_url || p.image || '');
    const fallbackImg = sanitize(p.fallback_image_url || p.fallbackImage || imgUrl);
    const liveUrl = sanitize(p.live_url || p.liveDemoUrl, null);
    const githubUrl = sanitize(p.github_url || p.githubUrl, null);

    modalBody.innerHTML = `
      <div class="modal-img-wrap">
        <img src="${imgUrl}" alt="${title}" class="modal-img" onerror="this.onerror=null; this.src='${fallbackImg}'">
      </div>
      <div class="modal-header-info">
        <span class="project-category-badge" style="position:static; display:inline-block; margin-bottom: 0.8rem;">${categoryLabel}</span>
        <h2 style="font-size: var(--fs-2xl); margin-bottom: 0.5rem;">${title}</h2>
        <p style="font-size: var(--fs-base); color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.7;">${desc}</p>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
          <h4 style="font-family: var(--font-code); font-size: var(--fs-xs); color: var(--accent); text-transform: uppercase; margin-bottom: 0.5rem;">Overview</h4>
          <p style="font-size: var(--fs-sm);">${overview}</p>
        </div>
        <div class="project-actions" style="border:none; padding:0;">
          ${liveUrl && liveUrl !== '#' ? `<a href="${liveUrl}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">${dict?.project_live_demo || "Live Demo"}</a>` : ''}
          ${githubUrl && githubUrl !== '#' ? `<a href="${githubUrl}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">${dict?.project_github || "GitHub Repo"}</a>` : ''}
        </div>
      </div>
    `;

    projectModal.classList.add('active');
    projectModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const closeBtn = projectModal.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.focus();
  };

  window.closeProjectModal = function() {
    if (!projectModal) return;
    projectModal.classList.remove('active');
    projectModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (projectModal) {
    projectModal.addEventListener('click', (e) => {
      if (e.target === projectModal || e.target.closest('.modal-close-btn')) {
        window.closeProjectModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && projectModal.classList.contains('active')) {
        window.closeProjectModal();
      }
    });
  }

  /* --------------------------------------------------------------------------
     6. CONTACT FORM (SUPABASE WITH HONEYPOT + THROTTLING + MAILTO FALLBACK)
     -------------------------------------------------------------------------- */
  const contactForm = document.getElementById('portfolio-contact-form');
  const formStatus = document.getElementById('form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentLang = localStorage.getItem('portfolio_lang') || 'en';
      const dict = window.portfolioTranslations ? window.portfolioTranslations[currentLang] : null;

      // 1. Honeypot check (anti-spam)
      const botField = contactForm.querySelector('input[name="bot-field"]')?.value;
      if (botField) {
        // Silently discard spam submission without revealing detection
        formStatus.className = 'form-status success';
        formStatus.textContent = dict?.form_success || "Thank you! Your message has been sent successfully.";
        contactForm.reset();
        return;
      }

      // 2. Client-side rate-limiting / throttling (30s minimum interval)
      const lastSent = localStorage.getItem('last_contact_sent_time');
      if (lastSent && Date.now() - parseInt(lastSent, 10) < 30000) {
        formStatus.className = 'form-status error';
        formStatus.textContent = "Please wait a moment before sending another message.";
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>${dict?.form_sending || "Sending..."}</span>`;

      const formData = new FormData(contactForm);
      const name = (formData.get('name') || '').toString().trim();
      const email = (formData.get('email') || '').toString().trim();
      const subject = (formData.get('subject') || 'Portfolio Contact').toString().trim();
      const message = (formData.get('message') || '').toString().trim();

      let submissionHandled = false;

      // 3. Try Supabase direct insertion if configured
      const gateway = window.PortfolioSupabase;
      if (gateway && gateway.isConfigured()) {
        const supabase = gateway.getClient();
        if (supabase) {
          try {
            const { error } = await supabase.from('contact_messages').insert([
              { name, email, subject, message }
            ]);
            if (!error) {
              submissionHandled = true;
              localStorage.setItem('last_contact_sent_time', Date.now().toString());
              formStatus.className = 'form-status success';
              formStatus.textContent = dict?.form_success || "Thank you! Your message has been sent successfully.";
              contactForm.reset();
            }
          } catch (err) {
            console.warn('Supabase message submission error, falling back:', err);
          }
        }
      }

      // 4. Fallback to Netlify Forms endpoint or mailto if not already handled
      if (!submissionHandled) {
        try {
          const response = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
          });

          if (response.ok) {
            localStorage.setItem('last_contact_sent_time', Date.now().toString());
            formStatus.className = 'form-status success';
            formStatus.textContent = dict?.form_success || "Thank you! Your message has been sent successfully.";
            contactForm.reset();
          } else {
            throw new Error('Netlify form submission failed');
          }
        } catch (err) {
          // Final fallback to mailto URI
          formStatus.className = 'form-status error';
          formStatus.textContent = dict?.form_error || "Redirecting to your email client as fallback...";
          setTimeout(() => {
            const mailtoUri = `mailto:marwanbouhamid123@gmail.com?subject=${encodeURIComponent(subject + " - from " + name)}&body=${encodeURIComponent("Sender Email: " + email + "\n\n" + message)}`;
            window.location.href = mailtoUri;
          }, 1200);
        }
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    });
  }

  /* --------------------------------------------------------------------------
     7. DYNAMIC PROFILE & CV PROPAGATION
     -------------------------------------------------------------------------- */
  function updateProfileElements() {
    if (!window.PortfolioDbLoader) return;
    const prof = window.PortfolioDbLoader.getProfile();
    if (!prof) return;

    // Update CV download links across all pages
    if (prof.cv_url) {
      document.querySelectorAll('a[href$="_CV.pdf"], a[data-i18n="nav_cv"], a[data-i18n="hero_cta_cv"]').forEach(link => {
        link.href = prof.cv_url;
      });
    }

    // Update Profile Photo if changed
    if (prof.photo_url) {
      document.querySelectorAll('.profile-photo, #hero-profile-img').forEach(img => {
        img.src = prof.photo_url;
      });
    }

    // Update WhatsApp link
    if (prof.whatsapp) {
      document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link => {
        link.href = `https://wa.me/${prof.whatsapp}`;
      });
    }

    // Update email links
    if (prof.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        if (!link.href.includes('subject')) {
          link.href = `mailto:${prof.email}`;
          link.textContent = prof.email;
        }
      });
    }
  }

  updateProfileElements();
  document.addEventListener('portfolio-data-ready', updateProfileElements);

  /* --------------------------------------------------------------------------
     8. PLAYFUL EASTER EGG ("Hello from Tanger")
     -------------------------------------------------------------------------- */
  function showEasterEggToast() {
    let toast = document.getElementById('easter-egg-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'easter-egg-toast';
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }

    const currentLang = localStorage.getItem('portfolio_lang') || 'en';
    const dict = window.portfolioTranslations ? window.portfolioTranslations[currentLang] : null;
    const msg = dict?.easter_egg_toast || "Hello from Tanger, Morocco! 🇲🇦 Welcome to my portfolio.";

    toast.innerHTML = `<span>📍</span> <span>${msg}</span>`;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  }

  // Keyboard shortcut Ctrl+B
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      showEasterEggToast();
    }
  });

  // Secret word "tanger"
  let typedBuffer = '';
  document.addEventListener('keypress', (e) => {
    typedBuffer += e.key.toLowerCase();
    if (typedBuffer.length > 10) typedBuffer = typedBuffer.slice(-10);
    if (typedBuffer.includes('tanger')) {
      showEasterEggToast();
      typedBuffer = '';
    }
  });

  // Location pin click
  const locationPin = document.querySelector('.location-pin');
  if (locationPin) {
    locationPin.addEventListener('click', showEasterEggToast);
  }

  /* --------------------------------------------------------------------------
     9. PAGE TRANSITIONS (SMOOTH FADE)
     -------------------------------------------------------------------------- */
  const transitionOverlay = document.createElement('div');
  transitionOverlay.className = 'page-transition-overlay';
  document.body.appendChild(transitionOverlay);

  window.addEventListener('pageshow', () => {
    transitionOverlay.classList.remove('animating');
  });

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (
      href &&
      (href.endsWith('.html') || href === '/' || href.startsWith('index') || href.startsWith('about') || href.startsWith('projects') || href.startsWith('contact')) &&
      !href.startsWith('#') &&
      !link.hasAttribute('target') &&
      !href.includes('/admin/')
    ) {
      link.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        transitionOverlay.classList.add('animating');
        setTimeout(() => {
          window.location.href = href;
        }, 300);
      });
    }
  });
});
