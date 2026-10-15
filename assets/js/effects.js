/**
 * Visual Effects: Particle Canvas, Magnetic Buttons, 3D Tilt, Parallax
 * Disabled or gracefully simplified on mobile/touch and prefers-reduced-motion.
 */
(function() {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  /* --------------------------------------------------------------------------
     1. SUBTLE PARTICLE CANVAS BACKGROUND
     -------------------------------------------------------------------------- */
  const canvas = document.getElementById('canvas-bg');
  if (canvas && !isReducedMotion) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // Minimal count of soft ambient particles
    const particleCount = isTouchDevice ? 15 : 35;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        color: i % 2 === 0 ? 'rgba(0, 240, 255, ' : 'rgba(59, 130, 246, '
      });
    }

    let mousePos = { x: -1000, y: -1000 };
    if (!isTouchDevice) {
      window.addEventListener('mousemove', (e) => {
        mousePos.x = e.clientX;
        mousePos.y = e.clientY;
      });
    }

    function renderParticles() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '0.5)';
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Slight reaction to mouse on desktop
        if (!isTouchDevice) {
          const mouseDist = Math.hypot(p.x - mousePos.x, p.y - mousePos.y);
          if (mouseDist < 120) {
            const angle = Math.atan2(p.y - mousePos.y, p.x - mousePos.x);
            p.x += Math.cos(angle) * 0.8;
            p.y += Math.sin(angle) * 0.8;
          }
        }
      }

      requestAnimationFrame(renderParticles);
    }
    requestAnimationFrame(renderParticles);
  }

  /* --------------------------------------------------------------------------
     2. MAGNETIC BUTTONS (DESKTOP ONLY)
     -------------------------------------------------------------------------- */
  if (!isTouchDevice && !isReducedMotion) {
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.28}px, ${y * 0.28}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0px, 0px)';
      });
    });
  }

  /* --------------------------------------------------------------------------
     3. 3D CARD TILT WITH LIGHT REFLECTION
     -------------------------------------------------------------------------- */
  if (!isTouchDevice && !isReducedMotion) {
    function setupTilt(card) {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -7;
        const rotateY = ((x - centerX) / centerX) * 7;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;

        // Update glare coordinates
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${glareX}%`);
        card.style.setProperty('--mouse-y', `${glareY}%`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    }

    document.querySelectorAll('.project-card').forEach(setupTilt);

    // Observer to attach tilt to dynamically filtered cards
    const grid = document.querySelector('.projects-grid');
    if (grid) {
      const observer = new MutationObserver(() => {
        grid.querySelectorAll('.project-card').forEach(setupTilt);
      });
      observer.observe(grid, { childList: true });
    }
  }

  /* --------------------------------------------------------------------------
     4. PARALLAX EFFECT ON HERO PHOTO & DECORATIVE BADGES
     -------------------------------------------------------------------------- */
  if (!isReducedMotion) {
    const heroPhoto = document.querySelector('.photo-frame-wrapper');
    if (heroPhoto) {
      window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        if (scrolled < 800) {
          heroPhoto.style.transform = `translateY(${scrolled * 0.08}px)`;
        }
      }, { passive: true });
    }
  }
})();
