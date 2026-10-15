/**
 * Certificates Data & Lightbox Controller
 */
const certificatesData = [
  {
    id: "work-smarter-with-ai",
    title: "Work smarter with AI",
    issuer: "Verified Certificate",
    year: "2025",
    image: "assets/certificates/work-smarter-with-ai.svg",
    fallbackImage: "assets/certificates/work-smarter-with-ai.jpg",
    description: "Certification covering generative AI workflows, automated problem solving, prompt engineering, and intelligent developer productivity."
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = certificatesData;
} else {
  window.portfolioCertificates = certificatesData;
}

// Lightbox helper
function openCertificateLightbox(certId) {
  const cert = (window.portfolioCertificates || certificatesData).find(c => c.id === certId);
  if (!cert) return;

  const modal = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-img');
  const modalCaption = document.getElementById('lightbox-caption');

  if (!modal || !modalImg) return;

  modalImg.src = cert.image;
  modalImg.alt = cert.title;
  modalImg.onerror = function() {
    this.onerror = null;
    this.src = cert.fallbackImage;
  };

  if (modalCaption) {
    modalCaption.innerHTML = `<strong>${cert.title}</strong> — ${cert.issuer} (${cert.year})<p class="lightbox-desc">${cert.description}</p>`;
  }

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const closeBtn = modal.querySelector('.lightbox-close');
  if (closeBtn) closeBtn.focus();
}

function closeCertificateLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// Global click & keyboard listeners
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.lightbox-close')) {
      closeCertificateLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeCertificateLightbox();
    }
  });
});
