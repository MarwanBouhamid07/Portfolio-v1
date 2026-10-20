/**
 * Admin Projects Manager Controller
 * Full CRUD, search, category filter, image upload + WebP compression,
 * multilingual tabs (EN/FR/AR), auto-slug generator, drag/up-down reordering.
 */

(function () {
  'use strict';

  let projectsList = [];
  let currentEditingId = null;
  let stagedImageFile = null;

  const gateway = window.PortfolioSupabase;

  function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  async function loadProjects() {
    if (!gateway) return;
    const supabase = gateway.getClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      projectsList = data || [];
      renderProjectsTable();
    } catch (err) {
      console.error('Error fetching projects:', err);
      window.adminToast.show('Failed to fetch projects.', 'error');
    }
  }

  function renderProjectsTable() {
    const tbody = document.getElementById('projects-table-body');
    const searchVal = (document.getElementById('project-search-input')?.value || '').toLowerCase();
    const filterCat = document.getElementById('project-category-filter')?.value || 'all';

    if (!tbody) return;

    const filtered = projectsList.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchVal) ||
        p.slug.toLowerCase().includes(searchVal) ||
        p.description_en.toLowerCase().includes(searchVal);
      const matchCat = filterCat === 'all' || p.category === filterCat;
      return matchSearch && matchCat;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: var(--space-xl);">No projects match criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((p, idx) => `
      <tr data-id="${p.id}">
        <td style="width: 60px;">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="moveProject('${p.id}', -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} title="Move Up" style="padding: 2px 6px; font-size: 10px;">▲</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="moveProject('${p.id}', 1)" ${idx === filtered.length - 1 ? 'disabled style="opacity:0.3;"' : ''} title="Move Down" style="padding: 2px 6px; font-size: 10px;">▼</button>
          </div>
        </td>
        <td style="width: 70px;">
          <img src="${p.image_url}" alt="${gateway.escapeHTML(p.title)}" class="table-thumb" onerror="this.onerror=null; this.src='../assets/images/profile-placeholder.png'">
        </td>
        <td>
          <strong>${gateway.escapeHTML(p.title)}</strong>
          <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-code);">${gateway.escapeHTML(p.slug)}</div>
        </td>
        <td>
          <span style="font-size: var(--fs-xs);">${gateway.escapeHTML(p.category_label_en || p.category)}</span>
        </td>
        <td>
          <button type="button" onclick="toggleFeatured('${p.id}')" class="badge-status ${p.featured ? 'badge-featured' : 'badge-draft'}" style="cursor: pointer; border: 1px solid var(--border-color);">
            ${p.featured ? '★ Featured' : '☆ Standard'}
          </button>
        </td>
        <td>
          <button type="button" onclick="toggleStatus('${p.id}')" class="badge-status ${p.status === 'published' ? 'badge-published' : 'badge-draft'}" style="cursor: pointer; border: 1px solid var(--border-color);">
            ${p.status}
          </button>
        </td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn btn-secondary btn-sm" onclick="editProject('${p.id}')" title="Edit">
              Edit
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="deleteProject('${p.id}')" style="color: var(--color-danger);" title="Delete">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // --- REORDERING ---
  window.moveProject = async function (id, direction) {
    const idx = projectsList.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= projectsList.length) return;

    const supabase = gateway.getClient();
    if (!supabase) return;

    // Swap sort_order
    const temp = projectsList[idx].sort_order;
    projectsList[idx].sort_order = projectsList[targetIdx].sort_order;
    projectsList[targetIdx].sort_order = temp;

    // Optimistic UI update
    const [moved] = projectsList.splice(idx, 1);
    projectsList.splice(targetIdx, 0, moved);
    renderProjectsTable();

    try {
      await Promise.all([
        supabase.from('projects').update({ sort_order: projectsList[idx].sort_order }).eq('id', projectsList[idx].id),
        supabase.from('projects').update({ sort_order: projectsList[targetIdx].sort_order }).eq('id', projectsList[targetIdx].id)
      ]);
      window.adminToast.show('Project order updated.', 'success');
    } catch (err) {
      window.adminToast.show('Failed to save project order.', 'error');
      loadProjects();
    }
  };

  // --- TOGGLE STATUS / FEATURED ---
  window.toggleStatus = async function (id) {
    const project = projectsList.find((p) => p.id === id);
    if (!project) return;
    const nextStatus = project.status === 'published' ? 'draft' : 'published';

    const supabase = gateway.getClient();
    if (!supabase) return;

    project.status = nextStatus;
    renderProjectsTable();

    try {
      const { error } = await supabase.from('projects').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      window.adminToast.show(`Status updated to ${nextStatus}`, 'success');
    } catch (err) {
      window.adminToast.show('Failed to update status', 'error');
      loadProjects();
    }
  };

  window.toggleFeatured = async function (id) {
    const project = projectsList.find((p) => p.id === id);
    if (!project) return;
    const nextFeatured = !project.featured;

    const supabase = gateway.getClient();
    if (!supabase) return;

    project.featured = nextFeatured;
    renderProjectsTable();

    try {
      const { error } = await supabase.from('projects').update({ featured: nextFeatured, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      window.adminToast.show(`Featured status updated`, 'success');
    } catch (err) {
      window.adminToast.show('Failed to update featured', 'error');
      loadProjects();
    }
  };

  // --- MODAL EDITOR ---
  window.openCreateProjectModal = function () {
    currentEditingId = null;
    stagedImageFile = null;
    document.getElementById('project-form').reset();
    document.getElementById('project-modal-title').textContent = 'Add New Project';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('image-preview').src = '';
    document.getElementById('project-id-field').value = '';
    switchLangTab('en');
    window.setFormDirty(false);
    openAdminModal('project-editor-modal');
  };

  window.editProject = function (id) {
    const p = projectsList.find((item) => item.id === id);
    if (!p) return;

    currentEditingId = id;
    stagedImageFile = null;

    document.getElementById('project-modal-title').textContent = `Edit Project: ${p.title}`;
    document.getElementById('project-id-field').value = p.id;
    document.getElementById('proj-title').value = p.title || '';
    document.getElementById('proj-slug').value = p.slug || '';
    document.getElementById('proj-category').value = p.category || 'fullstack';
    document.getElementById('proj-cat-label-en').value = p.category_label_en || '';
    document.getElementById('proj-cat-label-fr').value = p.category_label_fr || '';
    document.getElementById('proj-cat-label-ar').value = p.category_label_ar || '';

    document.getElementById('proj-desc-en').value = p.description_en || '';
    document.getElementById('proj-desc-fr').value = p.description_fr || '';
    document.getElementById('proj-desc-ar').value = p.description_ar || '';

    document.getElementById('proj-overview-en').value = p.detailed_overview_en || '';
    document.getElementById('proj-overview-fr').value = p.detailed_overview_fr || '';
    document.getElementById('proj-overview-ar').value = p.detailed_overview_ar || '';

    document.getElementById('proj-live-url').value = p.live_url || '';
    document.getElementById('proj-github-url').value = p.github_url || '';
    document.getElementById('proj-status').value = p.status || 'published';
    document.getElementById('proj-featured').checked = !!p.featured;

    const preview = document.getElementById('image-preview');
    if (p.image_url) {
      preview.src = p.image_url;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }

    switchLangTab('en');
    window.setFormDirty(false);
    openAdminModal('project-editor-modal');
  };

  window.deleteProject = function (id) {
    const p = projectsList.find((item) => item.id === id);
    if (!p) return;

    window.adminConfirm(
      'Delete Project',
      `Are you sure you want to delete "${p.title}"? This cannot be undone.`,
      async () => {
        const supabase = gateway.getClient();
        if (!supabase) return;

        try {
          const { error } = await supabase.from('projects').delete().eq('id', id);
          if (error) throw error;
          window.adminToast.show(`Project "${p.title}" deleted.`, 'success');
          loadProjects();
        } catch (err) {
          console.error('Delete error:', err);
          window.adminToast.show('Failed to delete project.', 'error');
        }
      }
    );
  };

  // --- LANGUAGE TABS ---
  function switchLangTab(lang) {
    document.querySelectorAll('.lang-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    document.querySelectorAll('.lang-tab-pane').forEach((pane) => {
      pane.classList.toggle('active', pane.getAttribute('data-lang') === lang);
    });
  }

  // --- FORM SUBMIT ---
  async function handleProjectSubmit(e) {
    e.preventDefault();
    const supabase = gateway.getClient();
    if (!supabase) return;

    const submitBtn = document.getElementById('save-project-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Saving...</span>';

    try {
      const title = document.getElementById('proj-title').value.trim();
      const slug = document.getElementById('proj-slug').value.trim() || slugify(title);
      const category = document.getElementById('proj-category').value;
      const category_label_en = document.getElementById('proj-cat-label-en').value.trim() || category;
      const category_label_fr = document.getElementById('proj-cat-label-fr').value.trim() || category_label_en;
      const category_label_ar = document.getElementById('proj-cat-label-ar').value.trim() || category_label_en;

      const description_en = document.getElementById('proj-desc-en').value.trim();
      const description_fr = document.getElementById('proj-desc-fr').value.trim() || description_en;
      const description_ar = document.getElementById('proj-desc-ar').value.trim() || description_en;

      const detailed_overview_en = document.getElementById('proj-overview-en').value.trim();
      const detailed_overview_fr = document.getElementById('proj-overview-fr').value.trim() || detailed_overview_en;
      const detailed_overview_ar = document.getElementById('proj-overview-ar').value.trim() || detailed_overview_en;

      const live_url = gateway.sanitizeUrl(document.getElementById('proj-live-url').value.trim(), null);
      const github_url = gateway.sanitizeUrl(document.getElementById('proj-github-url').value.trim(), null);
      const status = document.getElementById('proj-status').value;
      const featured = document.getElementById('proj-featured').checked;

      let image_url = null;
      const existingProject = currentEditingId ? projectsList.find((p) => p.id === currentEditingId) : null;
      if (existingProject) image_url = existingProject.image_url;

      // Handle image upload if a new file was staged
      if (stagedImageFile) {
        window.adminToast.show('Uploading compressed image...', 'info');
        const fileExt = stagedImageFile.type === 'image/svg+xml' ? 'svg' : 'webp';
        const filePath = `projects/${slug}-${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('portfolio-images')
          .upload(filePath, stagedImageFile, { upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from('portfolio-images').getPublicUrl(filePath);
        image_url = urlData.publicUrl;
      }

      if (!image_url) {
        image_url = 'assets/images/profile-placeholder.png';
      }

      const payload = {
        title,
        slug,
        category,
        category_label_en,
        category_label_fr,
        category_label_ar,
        description_en,
        description_fr,
        description_ar,
        detailed_overview_en,
        detailed_overview_fr,
        detailed_overview_ar,
        live_url,
        github_url,
        image_url,
        status,
        featured,
        updated_at: new Date().toISOString()
      };

      if (currentEditingId) {
        const { error } = await supabase.from('projects').update(payload).eq('id', currentEditingId);
        if (error) throw error;
        window.adminToast.show('Project updated successfully.', 'success');
      } else {
        payload.sort_order = projectsList.length + 1;
        const { error } = await supabase.from('projects').insert([payload]);
        if (error) throw error;
        window.adminToast.show('Project created successfully.', 'success');
      }

      window.setFormDirty(false);
      closeAdminModal('project-editor-modal');
      loadProjects();
    } catch (err) {
      console.error('Save project error:', err);
      window.adminToast.show(`Error: ${err.message || 'Failed to save project.'}`, 'error', 5000);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Save Project</span>';
    }
  }

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    loadProjects();

    // Multilingual tabs
    document.querySelectorAll('.lang-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchLangTab(btn.getAttribute('data-lang'));
      });
    });

    // Auto-slug on title input
    const titleInput = document.getElementById('proj-title');
    const slugInput = document.getElementById('proj-slug');
    if (titleInput && slugInput) {
      titleInput.addEventListener('input', () => {
        if (!currentEditingId) {
          slugInput.value = slugify(titleInput.value);
        }
        window.setFormDirty(true);
      });
    }

    // Unsaved changes track on inputs
    const projForm = document.getElementById('project-form');
    if (projForm) {
      projForm.addEventListener('input', () => window.setFormDirty(true));
      projForm.addEventListener('submit', handleProjectSubmit);
    }

    // Search and filter listeners
    document.getElementById('project-search-input')?.addEventListener('input', renderProjectsTable);
    document.getElementById('project-category-filter')?.addEventListener('change', renderProjectsTable);

    // Image upload zone
    const dropZone = document.getElementById('project-upload-zone');
    const fileInput = document.getElementById('project-file-input');
    const preview = document.getElementById('image-preview');

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
          processSelectedImage(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          processSelectedImage(e.target.files[0]);
        }
      });
    }

    async function processSelectedImage(file) {
      window.adminToast.show('Validating & compressing image...', 'info');
      try {
        const compressed = await window.compressImage(file, 1600, 0.85);
        stagedImageFile = compressed;
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(compressed);
        window.setFormDirty(true);
        window.adminToast.show(`Image ready (WebP, ${(compressed.size / 1024).toFixed(1)} KB)`, 'success');
      } catch (err) {
        window.adminToast.show(err.message, 'error');
      }
    }
  });
})();
