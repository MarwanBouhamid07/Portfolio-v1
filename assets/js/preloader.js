/**
 * Preloader: Terminal Reveal
 * Types "Marwan Bouhamid", slides away.
 * Max ~1.5s, skippable, shown once per session.
 */
(function() {
  const PRELOADER_KEY = 'portfolio_preloader_seen';
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  // Check if previously seen in this session or prefers reduced motion
  if (sessionStorage.getItem(PRELOADER_KEY) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    preloader.style.display = 'none';
    return;
  }

  const typedSpan = document.getElementById('term-typed-text');
  const targetText = "Marwan Bouhamid --fullstack";
  let charIndex = 0;
  let isDone = false;

  function endPreloader() {
    if (isDone) return;
    isDone = true;
    sessionStorage.setItem(PRELOADER_KEY, 'true');
    preloader.classList.add('fade-out');
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 600);
  }

  // Typewriter effect
  function typeChar() {
    if (charIndex < targetText.length && !isDone) {
      if (typedSpan) {
        typedSpan.textContent += targetText.charAt(charIndex);
      }
      charIndex++;
      setTimeout(typeChar, 35);
    } else {
      setTimeout(endPreloader, 400);
    }
  }

  // Auto start typing
  setTimeout(typeChar, 200);

  // Fallback safety timeout (ensure preloader ends in at most 1.5s)
  setTimeout(endPreloader, 1500);

  // Skippable via click
  preloader.addEventListener('click', endPreloader);

  // Skippable via ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') endPreloader();
  });
})();
