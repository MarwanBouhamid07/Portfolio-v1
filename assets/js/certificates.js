/**
 * Certificates Data & Lightbox Controller
 * Integrates with database loader, renders certificates gallery dynamically on about.html,
 * and handles high-resolution enlarged preview lightbox.
 */

const fallbackCertificatesData = [
  {
    id: "work-smarter-with-ai",
    title: "Work smarter with AI",
    issuer: "Verified Certificate",
    year: "2025",
    image: "assets/certificates/work-smarter-with-ai.svg",
    fallbackImage: "assets/certificates/work-smarter-with-ai.jpg",
    verify_url: "https://solicode.co/",
    description: "Certification covering generative AI workflows, automated problem solving, prompt engineering, and intelligent developer productivity."
  },
  {
    id: "technical-support-fundamentals",
    title: "Technical Support Fundamentals",
    issuer: "Verified Certificate",
    year: "2024",
    image: "assets/certificates/certificate1.png",
    fallbackImage: "assets/certificates/certificate1.png",
    verify_url: null,
    description: "Technical support fundamentals covering computer hardware, networking, operating systems, and troubleshooting."
  }
];

function getCertificates() {
  if (window.PortfolioDbLoader) {
    const list = window.PortfolioDbLoader.getCertificates();
    if (list && list.length > 0) return list;
  }
  return window.portfolioCertificates || fallbackCertificatesData;
}

// Render dynamic certificate gallery on about.html if gallery container exists
function renderCertificatesGallery() {
  const gallery = document.querySelector('.certificate-gallery');
  if (!gallery) return;

  const certs = getCertificates();
  const currentLang = localStorage.getItem('portfolio_lang') || 'en';
  const dict = window.portfolioTranslations ? window.portfolioTranslations[currentLang] : null;
  const verifiedBadgeText = dict?.cert_badge || "Verified Certificate";

  gallery.innerHTML = certs.map((cert) => {
    const isVerified = cert.verify_url && cert.verify_url.trim().length > 0;
    const certImg = cert.image_url || cert.image;
    const certFallback = cert.fallback_image_url || cert.fallbackImage || certImg;
    const certId = cert.id || cert.slug;
    const title = cert.title;

    return `
      <div class="certificate-card" onclick="openCertificateLightbox('${certId}')" role="button" tabindex="0" aria-label="Open ${title} Certificate">
        <div class="certificate-preview-wrapper">
          <img src="${certImg}" alt="${title} certificate" class="certificate-img" onerror="this.onerror=null; this.src='${certFallback}'">
        </div>
        <div class="certificate-info">
          ${isVerified ? `<span class="project-category-badge" style="position:static; display:inline-block; margin-bottom:4px;" data-i18n="cert_badge">${verifiedBadgeText}</span>` : `<span class="project-category-badge" style="position:static; display:inline-block; margin-bottom:4px; opacity:0.8;">Certificate</span>`}
          <h4 style="font-size: var(--fs-lg);">${title}</h4>
          <p style="font-size: var(--fs-xs); color: var(--text-muted); margin-top: 4px;">Click to expand certificate</p>
        </div>
      </div>
    `;
  }).join('');
}

// Lightbox helper
function openCertificateLightbox(certId) {
  const certs = getCertificates();
  const cert = certs.find((c) => (c.id === certId || c.slug === certId));
  if (!cert) return;

  const modal = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-img');
  const modalCaption = document.getElementById('lightbox-caption');

  if (!modal || !modalImg) return;

  modalImg.src = cert.image_url || cert.image;
  modalImg.alt = cert.title;
  modalImg.onerror = function () {
    this.onerror = null;
    this.src = cert.fallback_image_url || cert.fallbackImage || cert.image;
  };

  const currentLang = localStorage.getItem('portfolio_lang') || 'en';
  const desc = cert[`description_${currentLang}`] || cert.description_en || cert.description || '';
  const verifyLink = cert.verify_url ? `<br><a href="${cert.verify_url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent); font-size:12px; margin-top:6px; display:inline-block;">Verify Credential ↗</a>` : '';

  if (modalCaption) {
    modalCaption.innerHTML = `<strong>${cert.title}</strong> — ${cert.issuer} (${cert.year})<p class="lightbox-desc">${desc}</p>${verifyLink}`;
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
  renderCertificatesGallery();

  document.addEventListener('portfolio-data-ready', () => {
    renderCertificatesGallery();
  });

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
