/**
 * Admin Panel Common Controller
 * Handles Supabase session guards, auth state, toasts, confirm modals,
 * dark/light theme sync, sidebar responsiveness, and client-side image compression.
 */

(function () {
  'use strict';

  try {
    if (sessionStorage.getItem('admin_tab_ok') !== '1') {
      window.location.replace('/404.html');
      return;
    }
  } catch (e) {
    window.location.replace('/404.html');
    return;
  }

  // --- 1. TOAST NOTIFICATIONS ---
  const toastContainer = document.createElement('div');
  toastContainer.className = 'admin-toast-container';
  document.body.appendChild(toastContainer);

  window.adminToast = {
    show(message, type = 'info', duration = 3500) {
      const toast = document.createElement('div');
      toast.className = `admin-toast ${type}`;
      toast.innerHTML = `
        <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span>${message}</span>
      `;
      toastContainer.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  };

  // --- 2. CONFIRMATION MODAL ---
  let confirmCallback = null;
  const confirmBackdrop = document.createElement('div');
  confirmBackdrop.className = 'admin-modal-backdrop';
  confirmBackdrop.id = 'admin-confirm-modal';
  confirmBackdrop.innerHTML = `
    <div class="admin-modal-card" style="max-width: 440px; text-align: center;">
      <h3 id="confirm-title" style="margin-bottom: var(--space-sm); font-size: var(--fs-xl);">Are you sure?</h3>
      <p id="confirm-message" style="color: var(--text-secondary); margin-bottom: var(--space-xl);">This action cannot be undone.</p>
      <div style="display: flex; gap: var(--space-md); justify-content: center;">
        <button type="button" class="btn btn-secondary btn-sm" id="confirm-cancel-btn">Cancel</button>
        <button type="button" class="btn btn-danger btn-sm" id="confirm-action-btn" style="background: var(--color-danger); color: #fff; border: none;">Confirm Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmBackdrop);

  document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
    confirmBackdrop.classList.remove('active');
    confirmCallback = null;
  });

  document.getElementById('confirm-action-btn').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    confirmBackdrop.classList.remove('active');
    confirmCallback = null;
  });

  window.adminConfirm = function (title, message, onConfirm) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    confirmCallback = onConfirm;
    confirmBackdrop.classList.add('active');
  };

  // --- 3. MODAL CONTROLS ---
  window.openAdminModal = function (modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeAdminModal = function (modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // --- 4. UNSAVED CHANGES GUARD ---
  let isFormDirty = false;
  window.setFormDirty = function (dirty) {
    isFormDirty = dirty;
  };

  window.addEventListener('beforeunload', (e) => {
    if (isFormDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // --- 5. CLIENT-SIDE IMAGE COMPRESSION (Max 1600px, WebP) ---
  window.compressImage = function (file, maxWidth = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      // Validate file size limit on client (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        return reject(new Error('Image exceeds 2MB limit. Please select a smaller file.'));
      }

      // Check mime type
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowed.includes(file.type)) {
        return reject(new Error('Unsupported format. Allowed: JPG, PNG, WebP, SVG'));
      }

      // If SVG, skip raster compression
      if (file.type === 'image/svg+xml') {
        return resolve(file);
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Canvas compression failed'));
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '') + '.webp',
                { type: 'image/webp' }
              );
              resolve(compressedFile);
            },
            'image/webp',
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // --- 6. AUTHENTICATION & ROUTE GUARD ---
  async function checkAuth() {
    const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname.indexOf('studio-7x9k') !== -1;
    const gateway = window.PortfolioSupabase;

    if (!gateway) {
      console.warn('PortfolioSupabase gateway not loaded.');
      return;
    }

    const supabase = gateway.getClient();
    if (!supabase) {
      if (!isLoginPage) {
        window.adminToast.show('Supabase credentials not configured in supabase-config.js', 'error', 6000);
      }
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (isLoginPage) {
        if (session) {
          window.location.href = 'index.html';
        }
      } else {
        if (!session || error) {
          window.location.replace('/404.html');
          return;
        }

        // Render user info in topbar / sidebar
        const userEmailEl = document.getElementById('admin-user-email');
        if (userEmailEl && session.user) {
          userEmailEl.textContent = session.user.email;
        }
      }
    } catch (err) {
      console.error('Session verification error:', err);
      if (!isLoginPage) window.location.replace('/404.html');
    }
  }

  // --- 7. LOGOUT HANDLER ---
  window.adminLogout = async function () {
    const gateway = window.PortfolioSupabase;
    if (gateway) {
      const supabase = gateway.getClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    }
    try { sessionStorage.removeItem('admin_tab_ok'); } catch (e) {}
    window.location.href = '/';
  };

  // --- 8. SIDEBAR & THEME INIT ---
  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Theme sync & icon controller
    const savedTheme = localStorage.getItem('portfolio_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeToggle = document.getElementById('admin-theme-toggle');
    function updateAdminThemeIcon(theme) {
      if (!themeToggle) return;
      const icon = themeToggle.querySelector('.theme-icon') || themeToggle;
      themeToggle.setAttribute('aria-pressed', theme === 'light');
      if (theme === 'light') {
        icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      } else {
        icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
      }
    }

    if (themeToggle) {
      updateAdminThemeIcon(savedTheme);
      themeToggle.addEventListener('click', () => {
        const curr = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = curr === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('portfolio_theme', next);
        updateAdminThemeIcon(next);
      });
    }

    // Mobile sidebar drawer
    const sidebarCloseToggle = document.getElementById('admin-sidebar-toggle');
    const sidebarOpenToggle = document.getElementById('admin-sidebar-toggle-btn');
    const sidebar = document.querySelector('.admin-sidebar');

    if (sidebar) {
      // Close button inside sidebar (✕)
      if (sidebarCloseToggle) {
        sidebarCloseToggle.addEventListener('click', () => {
          sidebar.classList.remove('open');
        });
      }
      // Hamburger button in topbar (☰)
      if (sidebarOpenToggle) {
        sidebarOpenToggle.addEventListener('click', () => {
          sidebar.classList.add('open');
        });
      }

      // Close when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (
          sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          (!sidebarOpenToggle || (e.target !== sidebarOpenToggle && !sidebarOpenToggle.contains(e.target)))
        ) {
          sidebar.classList.remove('open');
        }
      });
    }

    // Active nav highlighting
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.admin-nav-item').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === currentPath || (currentPath === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  });
})();
