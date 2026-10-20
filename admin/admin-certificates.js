/**
 * Admin Certificates Manager Controller
 * CRUD, verification URL badge logic, image upload to Supabase storage, multilingual description.
 */

(function () {
  'use strict';

  let certificatesList = [];
  let currentEditingId = null;
  let stagedImageFile = null;

  const gateway = window.PortfolioSupabase;

  async function loadCertificates() {
    if (!gateway) return;
    const supabase = gateway.getClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      certificatesList = data || [];
      renderCertificatesTable();
    } catch (err) {
      console.error('Error fetching certificates:', err);
      window.adminToast.show('Failed to fetch certificates.', 'error');
    }
  }

  function renderCertificatesTable() {
    const tbody = document.getElementById('certs-table-body');
    if (!tbody) return;

    if (certificatesList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: var(--space-xl);">No certificates found. Click "+ Add Certificate" to create one.</td></tr>`;
      return;
    }

    tbody.innerHTML = certificatesList.map((c, idx) => {
      const isVerified = c.verify_url && c.verify_url.trim().length > 0;
      return `
        <tr>
          <td style="width: 60px;">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="moveCert('${c.id}', -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} style="padding: 2px 6px; font-size: 10px;">▲</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="moveCert('${c.id}', 1)" ${idx === certificatesList.length - 1 ? 'disabled style="opacity:0.3;"' : ''} style="padding: 2px 6px; font-size: 10px;">▼</button>
            </div>
          </td>
          <td style="width: 70px;">
            <img src="${c.image_url}" alt="${gateway.escapeHTML(c.title)}" class="table-thumb" onerror="this.onerror=null; this.src='../assets/images/profile-placeholder.png'">
          </td>
          <td>
            <strong>${gateway.escapeHTML(c.title)}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">${gateway.escapeHTML(c.issuer)} (${gateway.escapeHTML(c.year)})</div>
          </td>
          <td>
            <span class="badge-status ${isVerified ? 'badge-verified' : 'badge-unverified'}">
              ${isVerified ? '✓ Verified' : 'Standard'}
            </span>
            ${isVerified ? `<a href="${gateway.escapeHTML(c.verify_url)}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; margin-left: 6px; color: var(--accent);">Link ↗</a>` : ''}
          </td>
          <td>
            <button type="button" onclick="toggleCertVisibility('${c.id}')" class="badge-status ${c.visible ? 'badge-published' : 'badge-draft'}" style="cursor: pointer; border: 1px solid var(--border-color);">
              ${c.visible ? 'Visible' : 'Hidden'}
            </button>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn btn-secondary btn-sm" onclick="editCert('${c.id}')">Edit</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="deleteCert('${c.id}')" style="color: var(--color-danger);">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- REORDER ---
  window.moveCert = async function (id, direction) {
    const idx = certificatesList.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= certificatesList.length) return;

    const supabase = gateway.getClient();
    if (!supabase) return;

    const temp = certificatesList[idx].sort_order;
    certificatesList[idx].sort_order = certificatesList[targetIdx].sort_order;
    certificatesList[targetIdx].sort_order = temp;

    try {
      await Promise.all([
        supabase.from('certificates').update({ sort_order: certificatesList[idx].sort_order }).eq('id', certificatesList[idx].id),
        supabase.from('certificates').update({ sort_order: certificatesList[targetIdx].sort_order }).eq('id', certificatesList[targetIdx].id)
      ]);
      loadCertificates();
    } catch (err) {
      window.adminToast.show('Failed to reorder certificate.', 'error');
    }
  };

  // --- TOGGLE VISIBILITY ---
  window.toggleCertVisibility = async function (id) {
    const c = certificatesList.find((item) => item.id === id);
    if (!c) return;
    const next = !c.visible;

    const supabase = gateway.getClient();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('certificates').update({ visible: next }).eq('id', id);
      if (error) throw error;
      c.visible = next;
      renderCertificatesTable();
      window.adminToast.show('Visibility updated.', 'success');
    } catch (err) {
      window.adminToast.show('Failed to update visibility.', 'error');
    }
  };

  // --- MODAL EDITOR ---
  window.openCreateCertModal = function () {
    currentEditingId = null;
    stagedImageFile = null;
    document.getElementById('cert-form').reset();
    document.getElementById('cert-modal-title').textContent = 'Add New Certificate';
    document.getElementById('cert-preview').style.display = 'none';
    document.getElementById('cert-preview').src = '';
    document.getElementById('cert-id-field').value = '';
    document.getElementById('cert-year').value = new Date().getFullYear().toString();
    document.getElementById('cert-visible').checked = true;
    openAdminModal('cert-editor-modal');
  };

  window.editCert = function (id) {
    const c = certificatesList.find((item) => item.id === id);
    if (!c) return;

    currentEditingId = id;
    stagedImageFile = null;

    document.getElementById('cert-modal-title').textContent = `Edit Certificate: ${c.title}`;
    document.getElementById('cert-id-field').value = c.id;
    document.getElementById('cert-title').value = c.title || '';
    document.getElementById('cert-issuer').value = c.issuer || '';
    document.getElementById('cert-year').value = c.year || '';
    document.getElementById('cert-verify-url').value = c.verify_url || '';
    document.getElementById('cert-desc-en').value = c.description_en || '';
    document.getElementById('cert-desc-fr').value = c.description_fr || '';
    document.getElementById('cert-desc-ar').value = c.description_ar || '';
    document.getElementById('cert-visible').checked = !!c.visible;

    const preview = document.getElementById('cert-preview');
    if (c.image_url) {
      preview.src = c.image_url;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }

    openAdminModal('cert-editor-modal');
  };

  window.deleteCert = function (id) {
    const c = certificatesList.find((item) => item.id === id);
    if (!c) return;

    window.adminConfirm(
      'Delete Certificate',
      `Delete "${c.title}"?`,
      async () => {
        const supabase = gateway.getClient();
        if (!supabase) return;

        try {
          const { error } = await supabase.from('certificates').delete().eq('id', id);
          if (error) throw error;
          window.adminToast.show(`Certificate "${c.title}" deleted.`, 'success');
          loadCertificates();
        } catch (err) {
          window.adminToast.show('Failed to delete certificate.', 'error');
        }
      }
    );
  };

  async function handleCertSubmit(e) {
    e.preventDefault();
    const supabase = gateway.getClient();
    if (!supabase) return;

    const submitBtn = document.getElementById('save-cert-btn');
    submitBtn.disabled = true;

    try {
      const title = document.getElementById('cert-title').value.trim();
      const issuer = document.getElementById('cert-issuer').value.trim();
      const year = document.getElementById('cert-year').value.trim();
      const rawVerifyUrl = document.getElementById('cert-verify-url').value.trim();
      const verify_url = rawVerifyUrl ? gateway.sanitizeUrl(rawVerifyUrl, null) : null;

      const description_en = document.getElementById('cert-desc-en').value.trim();
      const description_fr = document.getElementById('cert-desc-fr').value.trim() || description_en;
      const description_ar = document.getElementById('cert-desc-ar').value.trim() || description_en;
      const visible = document.getElementById('cert-visible').checked;

      let image_url = null;
      const existing = currentEditingId ? certificatesList.find((c) => c.id === currentEditingId) : null;
      if (existing) image_url = existing.image_url;

      // Image upload
      if (stagedImageFile) {
        window.adminToast.show('Uploading certificate image...', 'info');
        const fileExt = stagedImageFile.type === 'image/svg+xml' ? 'svg' : 'webp';
        const filePath = `certificates/cert-${Date.now()}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('portfolio-images')
          .upload(filePath, stagedImageFile, { upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from('portfolio-images').getPublicUrl(filePath);
        image_url = urlData.publicUrl;
      }

      if (!image_url) {
        image_url = 'assets/certificates/work-smarter-with-ai.svg';
      }

      const payload = {
        title,
        issuer,
        year,
        verify_url,
        description_en,
        description_fr,
        description_ar,
        image_url,
        visible
      };

      if (currentEditingId) {
        const { error } = await supabase.from('certificates').update(payload).eq('id', currentEditingId);
        if (error) throw error;
        window.adminToast.show('Certificate updated successfully.', 'success');
      } else {
        payload.sort_order = certificatesList.length + 1;
        const { error } = await supabase.from('certificates').insert([payload]);
        if (error) throw error;
        window.adminToast.show('Certificate created successfully.', 'success');
      }

      closeAdminModal('cert-editor-modal');
      loadCertificates();
    } catch (err) {
      window.adminToast.show(`Failed to save: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadCertificates();

    const certForm = document.getElementById('cert-form');
    if (certForm) certForm.addEventListener('submit', handleCertSubmit);

    // Image upload zone
    const dropZone = document.getElementById('cert-upload-zone');
    const fileInput = document.getElementById('cert-file-input');
    const preview = document.getElementById('cert-preview');

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => fileInput.click());

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });

      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processCertImage(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          processCertImage(e.target.files[0]);
        }
      });
    }

    async function processCertImage(file) {
      try {
        const compressed = await window.compressImage(file, 1600, 0.85);
        stagedImageFile = compressed;
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(compressed);
        window.adminToast.show(`Certificate image ready (WebP, ${(compressed.size / 1024).toFixed(1)} KB)`, 'success');
      } catch (err) {
        window.adminToast.show(err.message, 'error');
      }
    }
  });
})();
