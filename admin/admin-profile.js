/**
 * Admin Profile & Settings Controller
 * Manages multilingual bio/titles/taglines, contact info, social links,
 * profile photo upload (WebP, max 2MB), and CV PDF upload (max 5MB).
 */

(function () {
  'use strict';

  let profileRecord = null;
  let socialLinksList = [];
  let stagedPhotoFile = null;
  let stagedCvFile = null;

  const gateway = window.PortfolioSupabase;

  async function loadProfileAndSettings() {
    if (!gateway) return;
    const supabase = gateway.getClient();
    if (!supabase) return;

    try {
      const [profRes, socialRes] = await Promise.all([
        supabase.from('profile').select('*').limit(1).maybeSingle(),
        supabase.from('social_links').select('*').order('sort_order', { ascending: true })
      ]);

      if (profRes.data) {
        profileRecord = profRes.data;
        populateProfileForm(profRes.data);
      }

      socialLinksList = socialRes.data || [];
      renderSocialLinksTable();
    } catch (err) {
      console.error('Failed to load profile settings:', err);
      window.adminToast.show('Failed to load profile data.', 'error');
    }
  }

  function populateProfileForm(p) {
    document.getElementById('prof-name').value = p.name || '';
    document.getElementById('prof-email').value = p.email || '';
    document.getElementById('prof-phone').value = p.phone || '';
    document.getElementById('prof-whatsapp').value = p.whatsapp || '';

    // Titles
    document.getElementById('prof-title-en').value = p.title_en || '';
    document.getElementById('prof-title-fr').value = p.title_fr || '';
    document.getElementById('prof-title-ar').value = p.title_ar || '';

    // Taglines
    document.getElementById('prof-tagline-en').value = p.tagline_en || '';
    document.getElementById('prof-tagline-fr').value = p.tagline_fr || '';
    document.getElementById('prof-tagline-ar').value = p.tagline_ar || '';

    // Locations
    document.getElementById('prof-location-en').value = p.location_en || '';
    document.getElementById('prof-location-fr').value = p.location_fr || '';
    document.getElementById('prof-location-ar').value = p.location_ar || '';

    // Bio Paragraphs
    document.getElementById('prof-bio-en-1').value = p.bio_en_p1 || '';
    document.getElementById('prof-bio-en-2').value = p.bio_en_p2 || '';
    document.getElementById('prof-bio-fr-1').value = p.bio_fr_p1 || '';
    document.getElementById('prof-bio-fr-2').value = p.bio_fr_p2 || '';
    document.getElementById('prof-bio-ar-1').value = p.bio_ar_p1 || '';
    document.getElementById('prof-bio-ar-2').value = p.bio_ar_p2 || '';

    // Photo Preview
    if (p.photo_url) {
      document.getElementById('profile-photo-preview').src = p.photo_url;
    }

    // CV Display
    if (p.cv_url) {
      const cvLink = document.getElementById('current-cv-link');
      if (cvLink) {
        cvLink.href = p.cv_url;
        cvLink.textContent = 'View Current CV (PDF) ↗';
      }
    }
  }

  function renderSocialLinksTable() {
    const tbody = document.getElementById('social-links-tbody');
    if (!tbody) return;

    if (socialLinksList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: var(--space-md);">No social links added yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = socialLinksList.map((link) => `
      <tr>
        <td><strong>${gateway.escapeHTML(link.label)}</strong></td>
        <td><a href="${gateway.escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer" style="color: var(--accent); font-size: var(--fs-xs);">${gateway.escapeHTML(link.url)}</a></td>
        <td><code>${gateway.escapeHTML(link.icon)}</code></td>
        <td>
          <button type="button" onclick="toggleSocialVisibility('${link.id}')" class="badge-status ${link.visible ? 'badge-published' : 'badge-draft'}" style="cursor: pointer; border: 1px solid var(--border-color);">
            ${link.visible ? 'Visible' : 'Hidden'}
          </button>
        </td>
        <td>
          <button type="button" class="btn btn-secondary btn-sm" onclick="deleteSocialLink('${link.id}')" style="color: var(--color-danger); padding: 4px 8px; font-size: 11px;">
            Delete
          </button>
        </td>
      </tr>
    `).join('');
  }

  // --- SOCIAL LINKS ACTIONS ---
  window.toggleSocialVisibility = async function (id) {
    const item = socialLinksList.find((l) => l.id === id);
    if (!item) return;

    const supabase = gateway.getClient();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('social_links').update({ visible: !item.visible }).eq('id', id);
      if (error) throw error;
      item.visible = !item.visible;
      renderSocialLinksTable();
      window.adminToast.show('Social link visibility updated.', 'success');
    } catch (err) {
      window.adminToast.show('Failed to toggle visibility.', 'error');
    }
  };

  window.deleteSocialLink = function (id) {
    const item = socialLinksList.find((l) => l.id === id);
    if (!item) return;

    window.adminConfirm(
      'Delete Social Link',
      `Delete link for "${item.label}"?`,
      async () => {
        const supabase = gateway.getClient();
        if (!supabase) return;

        try {
          const { error } = await supabase.from('social_links').delete().eq('id', id);
          if (error) throw error;
          window.adminToast.show('Social link deleted.', 'success');
          loadProfileAndSettings();
        } catch (err) {
          window.adminToast.show('Failed to delete social link.', 'error');
        }
      }
    );
  };

  window.openAddSocialModal = function () {
    document.getElementById('social-form').reset();
    openAdminModal('social-modal');
  };

  async function handleAddSocialSubmit(e) {
    e.preventDefault();
    const supabase = gateway.getClient();
    if (!supabase) return;

    const label = document.getElementById('social-label').value.trim();
    const url = gateway.sanitizeUrl(document.getElementById('social-url').value.trim());
    const icon = document.getElementById('social-icon').value.trim().toLowerCase();

    try {
      const { error } = await supabase.from('social_links').insert([
        {
          label,
          url,
          icon,
          sort_order: socialLinksList.length + 1,
          visible: true
        }
      ]);

      if (error) throw error;
      closeAdminModal('social-modal');
      window.adminToast.show('Social link added.', 'success');
      loadProfileAndSettings();
    } catch (err) {
      window.adminToast.show('Failed to add social link.', 'error');
    }
  }

  // --- SAVE PROFILE & UPLOADS ---
  async function handleProfileSubmit(e) {
    e.preventDefault();
    const supabase = gateway.getClient();
    if (!supabase) return;

    const saveBtn = document.getElementById('save-profile-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>Saving Changes...</span>';

    try {
      let photo_url = profileRecord ? profileRecord.photo_url : 'assets/images/profile.jpg';
      let cv_url = profileRecord ? profileRecord.cv_url : 'assets/Marwan_Bouhamid_CV.pdf';

      // 1. Upload new photo if selected
      if (stagedPhotoFile) {
        window.adminToast.show('Uploading profile photo...', 'info');
        const photoPath = `profile/avatar-${Date.now()}.webp`;
        const { error: photoErr } = await supabase.storage
          .from('portfolio-images')
          .upload(photoPath, stagedPhotoFile, { upsert: true });

        if (photoErr) throw photoErr;
        const { data: photoData } = supabase.storage.from('portfolio-images').getPublicUrl(photoPath);
        photo_url = photoData.publicUrl;
      }

      // 2. Upload new CV if selected (must be PDF, max 5MB)
      if (stagedCvFile) {
        window.adminToast.show('Uploading CV PDF...', 'info');
        if (stagedCvFile.size > 5 * 1024 * 1024) {
          throw new Error('CV exceeds maximum size limit of 5MB.');
        }
        if (stagedCvFile.type !== 'application/pdf') {
          throw new Error('CV must be an application/pdf document.');
        }

        const cvPath = `cv/Marwan_Bouhamid_CV_${Date.now()}.pdf`;
        const { error: cvErr } = await supabase.storage
          .from('portfolio-docs')
          .upload(cvPath, stagedCvFile, { upsert: true });

        if (cvErr) throw cvErr;
        const { data: cvData } = supabase.storage.from('portfolio-docs').getPublicUrl(cvPath);
        cv_url = cvData.publicUrl;
      }

      const payload = {
        name: document.getElementById('prof-name').value.trim(),
        email: document.getElementById('prof-email').value.trim(),
        phone: document.getElementById('prof-phone').value.trim(),
        whatsapp: document.getElementById('prof-whatsapp').value.trim(),

        title_en: document.getElementById('prof-title-en').value.trim(),
        title_fr: document.getElementById('prof-title-fr').value.trim(),
        title_ar: document.getElementById('prof-title-ar').value.trim(),

        tagline_en: document.getElementById('prof-tagline-en').value.trim(),
        tagline_fr: document.getElementById('prof-tagline-fr').value.trim(),
        tagline_ar: document.getElementById('prof-tagline-ar').value.trim(),

        location_en: document.getElementById('prof-location-en').value.trim(),
        location_fr: document.getElementById('prof-location-fr').value.trim(),
        location_ar: document.getElementById('prof-location-ar').value.trim(),

        bio_en_p1: document.getElementById('prof-bio-en-1').value.trim(),
        bio_en_p2: document.getElementById('prof-bio-en-2').value.trim(),
        bio_fr_p1: document.getElementById('prof-bio-fr-1').value.trim(),
        bio_fr_p2: document.getElementById('prof-bio-fr-2').value.trim(),
        bio_ar_p1: document.getElementById('prof-bio-ar-1').value.trim(),
        bio_ar_p2: document.getElementById('prof-bio-ar-2').value.trim(),

        photo_url,
        cv_url,
        updated_at: new Date().toISOString()
      };

      if (profileRecord && profileRecord.id) {
        const { error } = await supabase.from('profile').update(payload).eq('id', profileRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('profile').insert([payload]);
        if (error) throw error;
      }

      window.setFormDirty(false);
      window.adminToast.show('Profile & CV updated successfully! Changes reflect on public site.', 'success');
      loadProfileAndSettings();
    } catch (err) {
      console.error('Failed to update profile:', err);
      window.adminToast.show(`Save failed: ${err.message}`, 'error', 5000);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>Save All Profile Changes</span>';
    }
  }

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    loadProfileAndSettings();

    const profForm = document.getElementById('profile-form');
    if (profForm) {
      profForm.addEventListener('input', () => window.setFormDirty(true));
      profForm.addEventListener('submit', handleProfileSubmit);
    }

    const socialForm = document.getElementById('social-form');
    if (socialForm) socialForm.addEventListener('submit', handleAddSocialSubmit);

    // Multilingual tabs for profile
    document.querySelectorAll('.profile-lang-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        document.querySelectorAll('.profile-lang-tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.profile-lang-pane').forEach((p) => p.classList.toggle('active', p.getAttribute('data-lang') === lang));
      });
    });

    // Profile photo upload preview
    const photoInput = document.getElementById('profile-photo-input');
    if (photoInput) {
      photoInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
          try {
            const compressed = await window.compressImage(e.target.files[0], 800, 0.9);
            stagedPhotoFile = compressed;
            const reader = new FileReader();
            reader.onload = (ev) => {
              document.getElementById('profile-photo-preview').src = ev.target.result;
            };
            reader.readAsDataURL(compressed);
            window.setFormDirty(true);
            window.adminToast.show('New photo staged for saving (WebP compressed).', 'info');
          } catch (err) {
            window.adminToast.show(err.message, 'error');
          }
        }
      });
    }

    // CV file upload selection
    const cvInput = document.getElementById('profile-cv-input');
    if (cvInput) {
      cvInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (file.type !== 'application/pdf') {
            window.adminToast.show('Only PDF files are supported for CV.', 'error');
            cvInput.value = '';
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            window.adminToast.show('CV file must be under 5MB.', 'error');
            cvInput.value = '';
            return;
          }
          stagedCvFile = file;
          document.getElementById('staged-cv-name').textContent = `Staged: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
          window.setFormDirty(true);
          window.adminToast.show('New CV staged for saving.', 'info');
        }
      });
    }
  });
})();
