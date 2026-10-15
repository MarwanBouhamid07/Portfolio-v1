/**
 * Internationalization (i18n) Controller
 * English (default), French, Arabic (RTL)
 */
(function() {
  const LANG_KEY = 'portfolio_lang';
  const validLangs = ['en', 'fr', 'ar'];

  function getSavedLang() {
    const saved = localStorage.getItem(LANG_KEY);
    if (validLangs.includes(saved)) return saved;
    // Default to 'en'
    return 'en';
  }

  function setLanguage(lang) {
    if (!validLangs.includes(lang)) lang = 'en';
    localStorage.setItem(LANG_KEY, lang);

    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    const dict = window.portfolioTranslations ? window.portfolioTranslations[lang] : null;
    if (!dict) return;

    // Translate all standard text nodes with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.innerHTML = dict[key];
      }
    });

    // Translate placeholder attributes with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    // Update active state in language dropdown
    document.querySelectorAll('.lang-option').forEach(opt => {
      const optLang = opt.getAttribute('data-lang');
      opt.classList.toggle('active', optLang === lang);
    });

    // Update current lang label in nav
    const currentLangLabel = document.querySelector('.current-lang-code');
    if (currentLangLabel) {
      currentLangLabel.textContent = lang.toUpperCase();
    }
  }

  window.changeLanguage = function(lang) {
    setLanguage(lang);
    // Close dropdown
    const dropdown = document.querySelector('.lang-dropdown');
    if (dropdown) dropdown.classList.remove('open');
  };

  document.addEventListener('DOMContentLoaded', () => {
    const currentLang = getSavedLang();
    setLanguage(currentLang);

    // Language dropdown button toggle
    const langBtn = document.querySelector('.btn-lang-toggle');
    const langDropdown = document.querySelector('.lang-dropdown');

    if (langBtn && langDropdown) {
      langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (!langDropdown.contains(e.target) && e.target !== langBtn) {
          langDropdown.classList.remove('open');
        }
      });
    }

    document.querySelectorAll('.lang-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const lang = opt.getAttribute('data-lang');
        window.changeLanguage(lang);
      });
    });
  });
})();
