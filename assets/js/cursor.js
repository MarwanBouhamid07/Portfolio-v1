/**
 * Custom Cursor (Desktop Only)
 * Dot + trailing ring that expands on interactive elements and displays "View" over project cards.
 */
(function() {
  // Disable immediately on touch or reduced-motion
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches || 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';

  const follower = document.createElement('div');
  follower.className = 'custom-cursor-follower';

  document.body.appendChild(cursor);
  document.body.appendChild(follower);

  let mouseX = -100;
  let mouseY = -100;
  let followerX = -100;
  let followerY = -100;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  });

  // Smooth lerp animation for the trailing ring
  function animateFollower() {
    followerX += (mouseX - followerX) * 0.18;
    followerY += (mouseY - followerY) * 0.18;
    follower.style.transform = `translate(${followerX}px, ${followerY}px)`;
    requestAnimationFrame(animateFollower);
  }
  requestAnimationFrame(animateFollower);

  // Event delegation for hover states
  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    const projectCard = target.closest('.project-card') || target.closest('.project-media-wrapper');
    const interactive = target.closest('a') || target.closest('button') || target.closest('.interactive') || target.closest('.filter-btn');

    if (projectCard) {
      follower.classList.add('view-project');
      follower.textContent = 'VIEW';
    } else if (interactive) {
      follower.classList.add('hovering');
      follower.textContent = '';
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target;
    const projectCard = target.closest('.project-card') || target.closest('.project-media-wrapper');
    const interactive = target.closest('a') || target.closest('button') || target.closest('.interactive') || target.closest('.filter-btn');

    if (projectCard) {
      follower.classList.remove('view-project');
      follower.textContent = '';
    }
    if (interactive) {
      follower.classList.remove('hovering');
    }
  });

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    follower.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    follower.style.opacity = '1';
  });
})();
