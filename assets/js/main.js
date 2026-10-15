/**
 * Main Controller: Navigation, Scroll, Projects Rendering, Modal, Contact Form, Easter Egg
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
  const revealElements = document.querySelectorAll('.reveal');
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
    // Fallback if IntersectionObserver not supported
    revealElements.forEach(el => el.classList.add('active'));
  }

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

    // Close when clicking nav link
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
     4. PROJECTS RENDERING & DETAIL MODAL
     -------------------------------------------------------------------------- */
  const projectsGrid = document.querySelector('.projects-grid');
  const projectsData = window.portfolioProjects || [];

  function createProjectCardHTML(p) {
    const currentLang = localStorage.getItem('portfolio_lang') || 'en';
    const dict = window.portfolioTranslations ? window.portfolioTranslations[currentLang] : null;

    const liveDemoText = dict?.project_live_demo || "Live Demo";
    const githubText = dict?.project_github || "GitHub";
    const viewDetailsText = dict?.project_view_details || "View Details";

    // Build buttons - hide if URL is empty or null per specification
    const liveBtn = p.liveDemoUrl 
      ? `<!-- TODO: Replace placeholder URL when deployed -->
         <a href="${p.liveDemoUrl}" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
           <span>${liveDemoText}</span>
         </a>` 
      : '';

    const githubBtn = p.githubUrl 
      ? `<!-- TODO: Replace placeholder repository URL when published -->
         <a href="${p.githubUrl}" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
           <span>${githubText}</span>
         </a>` 
      : '';

    return `
      <article class="project-card reveal" data-category="${p.category}" id="project-${p.id}">
        <div class="project-card-glare"></div>
        <div class="project-media-wrapper" onclick="window.openProjectModal('${p.id}')" role="button" tabindex="0" aria-label="${p.title} - ${viewDetailsText}">
          <img src="${p.image}" alt="${p.title}" class="project-media" loading="lazy" onerror="this.onerror=null; this.src='${p.fallbackImage}'">
          <span class="project-category-badge">${p.categoryLabel}</span>
        </div>
        <div class="project-content">
          <h3 class="project-title" onclick="window.openProjectModal('${p.id}')">${p.title}</h3>
          <p class="project-desc">${p.description}</p>
          <div class="project-actions">
            <button type="button" class="btn btn-primary btn-sm" onclick="window.openProjectModal('${p.id}')">
              ${viewDetailsText}
            </button>
            ${liveBtn}
            ${githubBtn}
          </div>
        </div>
      </article>
    `;
  }

  // Render projects
  if (projectsGrid) {
    const isHomePage = document.body.classList.contains('page-home');
    const displayProjects = isHomePage ? projectsData.filter(p => p.featured) : projectsData;
    projectsGrid.innerHTML = displayProjects.map(createProjectCardHTML).join('');

    // Re-trigger reveal on dynamic cards
    projectsGrid.querySelectorAll('.reveal').forEach(el => {
      setTimeout(() => el.classList.add('active'), 50);
    });
  }

  // Filter Buttons on Projects Page
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

  // Project Modal Handler
  const projectModal = document.getElementById('project-modal');
  window.openProjectModal = function(projectId) {
    const p = projectsData.find(item => item.id === projectId);
    if (!p || !projectModal) return;

    const modalBody = projectModal.querySelector('.modal-body');
    if (!modalBody) return;

    const currentLang = localStorage.getItem('portfolio_lang') || 'en';
    const dict = window.portfolioTranslations ? window.portfolioTranslations[currentLang] : null;

    modalBody.innerHTML = `
      <div class="modal-img-wrap">
        <img src="${p.image}" alt="${p.title}" class="modal-img" onerror="this.onerror=null; this.src='${p.fallbackImage}'">
      </div>
      <div class="modal-header-info">
        <span class="project-category-badge" style="position:static; display:inline-block; margin-bottom: 0.8rem;">${p.categoryLabel}</span>
        <h2 style="font-size: var(--fs-2xl); margin-bottom: 0.5rem;">${p.title}</h2>
        <p style="font-size: var(--fs-base); color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.7;">${p.description}</p>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
          <h4 style="font-family: var(--font-code); font-size: var(--fs-xs); color: var(--accent); text-transform: uppercase; margin-bottom: 0.5rem;">Overview</h4>
          <p style="font-size: var(--fs-sm);">${p.detailedOverview}</p>
        </div>
        <div class="project-actions" style="border:none; padding:0;">
          ${p.liveDemoUrl ? `<!-- TODO: Add live demo URL --> <a href="${p.liveDemoUrl}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">${dict?.project_live_demo || "Live Demo"}</a>` : ''}
          ${p.githubUrl ? `<!-- TODO: Add github repo URL --> <a href="${p.githubUrl}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">${dict?.project_github || "GitHub Repo"}</a>` : ''}
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
     5. CONTACT FORM (NETLIFY WITH MAILTO FALLBACK)
     -------------------------------------------------------------------------- */
  const contactForm = document.getElementById('portfolio-contact-form');
  const formStatus = document.getElementById('form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentLang = localStorage.getItem('portfolio_lang') || 'en';
      const dict = window.portfolioTranslations ? window.portfolioTranslations[currentLang] : null;

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>${dict?.form_sending || "Sending..."}</span>`;

      const formData = new FormData(contactForm);
      const name = formData.get('name') || '';
      const email = formData.get('email') || '';
      const subject = formData.get('subject') || 'Portfolio Contact';
      const message = formData.get('message') || '';

      try {
        // Attempt fetch to Netlify Forms endpoint
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData).toString()
        });

        if (response.ok) {
          formStatus.className = 'form-status success';
          formStatus.textContent = dict?.form_success || "Thank you! Your message has been sent successfully.";
          contactForm.reset();
        } else {
          throw new Error('Form submission failed');
        }
      } catch (err) {
        // Mailto fallback if not hosted on Netlify or fetch fails
        formStatus.className = 'form-status error';
        formStatus.textContent = dict?.form_error || "Redirecting to your email client as fallback...";
        
        setTimeout(() => {
          const mailtoUri = `mailto:marwanbouhamid123@gmail.com?subject=${encodeURIComponent(subject + " - from " + name)}&body=${encodeURIComponent("Sender Email: " + email + "\n\n" + message)}`;
          window.location.href = mailtoUri;
        }, 1200);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  /* --------------------------------------------------------------------------
     6. PLAYFUL EASTER EGG ("Hello from Tanger")
     - Keyboard shortcut: Ctrl + B
     - Secret word typing: 'tanger'
     - Clicking on Location Pin in Hero
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

  // Ctrl + B listener
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      showEasterEggToast();
    }
  });

  // Keyword listener for typing "tanger"
  let typedBuffer = '';
  document.addEventListener('keypress', (e) => {
    typedBuffer += e.key.toLowerCase();
    if (typedBuffer.length > 10) typedBuffer = typedBuffer.slice(-10);
    if (typedBuffer.includes('tanger')) {
      showEasterEggToast();
      typedBuffer = '';
    }
  });

  // Click on location pin
  const locationPin = document.querySelector('.location-pin');
  if (locationPin) {
    locationPin.addEventListener('click', showEasterEggToast);
  }

  /* --------------------------------------------------------------------------
     7. PAGE TRANSITIONS (SMOOTH FADE)
     -------------------------------------------------------------------------- */
  const transitionOverlay = document.createElement('div');
  transitionOverlay.className = 'page-transition-overlay';
  document.body.appendChild(transitionOverlay);

  // Fade out overlay on page enter
  window.addEventListener('pageshow', () => {
    transitionOverlay.classList.remove('animating');
  });

  // Intercept local page links for smooth exit transition
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    // Only intercept local relative .html links
    if (href && (href.endsWith('.html') || href === '/' || href.startsWith('index') || href.startsWith('about') || href.startsWith('projects') || href.startsWith('contact')) && !href.startsWith('#') && !link.hasAttribute('target')) {
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
