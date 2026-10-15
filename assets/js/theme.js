/**
 * Theme Controller: Dark / Light Mode
 * Respects system preference, saves to localStorage, with smooth animated transition
 */
(function() {
  const THEME_KEY = 'portfolio_theme';
  const html = document.documentElement;

  // Determine initial theme
  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme, animate = false) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    // Update toggle button icon/state
    const toggles = document.querySelectorAll('.theme-toggle');
    toggles.forEach(toggle => {
      toggle.setAttribute('aria-pressed', theme === 'light');
      const icon = toggle.querySelector('.theme-icon');
      if (icon) {
        if (theme === 'light') {
          icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        } else {
          icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        }
      }
    });
  }

  // Initial apply without animation
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme, false);

  // Expose toggle function
  window.toggleTheme = function(e) {
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';

    // Support circular reveal if View Transition API is available
    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && e) {
      const x = e.clientX ?? window.innerWidth / 2;
      const y = e.clientY ?? 0;
      const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      const transition = document.startViewTransition(() => {
        applyTheme(next, true);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 450,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      });
    } else {
      applyTheme(next, true);
    }
  };

  // System theme change listener
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? 'light' : 'dark', true);
    }
  });

  // Attach click listener on load
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getPreferredTheme(), false);
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => window.toggleTheme(e));
    });
  });
})();
