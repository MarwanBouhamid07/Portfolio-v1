/**
 * Admin Skills Manager Controller
 * CRUD, category grouping, level labels (NO percentage bars), visibility & marquee toggles, reordering.
 */

(function () {
  'use strict';

  let skillsList = [];
  let currentEditingId = null;
  const gateway = window.PortfolioSupabase;

  async function loadSkills() {
    if (!gateway) return;
    const supabase = gateway.getClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('category')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      skillsList = data || [];
      renderSkillsGroups();
    } catch (err) {
      console.error('Error fetching skills:', err);
      window.adminToast.show('Failed to fetch skills.', 'error');
    }
  }

  function renderSkillsGroups() {
    const container = document.getElementById('skills-groups-container');
    if (!container) return;

    if (skillsList.length === 0) {
      container.innerHTML = `<div class="admin-card" style="text-align: center; color: var(--text-muted); padding: var(--space-2xl);">No skills found. Click "+ Add Skill" to create one.</div>`;
      return;
    }

    const categories = [
      { id: 'backend', name: 'Backend', desc: 'Server & Database' },
      { id: 'frontend', name: 'Frontend', desc: 'UI & Interaction' },
      { id: 'tools', name: 'Tools & Workflow', desc: 'Version & Design' },
      { id: 'basic', name: 'Basic Level', desc: 'Foundational' }
    ];

    container.innerHTML = categories.map((cat) => {
      const catSkills = skillsList.filter((s) => s.category === cat.id);
      return `
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <h3 class="admin-card-title">${cat.name}</h3>
              <span style="font-size: var(--fs-xs); color: var(--accent); font-family: var(--font-code);">${cat.desc}</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="openCreateSkillModal('${cat.id}')">
              + Add to ${cat.name}
            </button>
          </div>

          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th style="width: 60px;">Order</th>
                  <th>Skill Name</th>
                  <th>Level Label</th>
                  <th>Marquee</th>
                  <th>Visibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${catSkills.length === 0 ? `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No skills in this category.</td></tr>` : catSkills.map((s, idx) => `
                  <tr>
                    <td>
                      <div style="display: flex; flex-direction: column; gap: 2px;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="moveSkill('${s.id}', -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} style="padding: 2px 6px; font-size: 10px;">▲</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="moveSkill('${s.id}', 1)" ${idx === catSkills.length - 1 ? 'disabled style="opacity:0.3;"' : ''} style="padding: 2px 6px; font-size: 10px;">▼</button>
                      </div>
                    </td>
                    <td><strong>${gateway.escapeHTML(s.name)}</strong></td>
                    <td><span style="font-size: var(--fs-xs); color: var(--text-secondary);">${gateway.escapeHTML(s.level_label || '—')}</span></td>
                    <td>
                      <button type="button" onclick="toggleSkillMarquee('${s.id}')" class="badge-status ${s.in_marquee ? 'badge-published' : 'badge-draft'}" style="cursor: pointer; border: 1px solid var(--border-color);">
                        ${s.in_marquee ? 'In Marquee' : 'Hidden'}
                      </button>
                    </td>
                    <td>
                      <button type="button" onclick="toggleSkillVisibility('${s.id}')" class="badge-status ${s.visible ? 'badge-published' : 'badge-draft'}" style="cursor: pointer; border: 1px solid var(--border-color);">
                        ${s.visible ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td>
                      <div class="table-actions">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="editSkill('${s.id}')">Edit</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="deleteSkill('${s.id}')" style="color: var(--color-danger);">Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- REORDER ---
  window.moveSkill = async function (id, direction) {
    const skill = skillsList.find((s) => s.id === id);
    if (!skill) return;

    const catSkills = skillsList.filter((s) => s.category === skill.category);
    const idx = catSkills.findIndex((s) => s.id === id);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= catSkills.length) return;

    const supabase = gateway.getClient();
    if (!supabase) return;

    const tempOrder = catSkills[idx].sort_order;
    catSkills[idx].sort_order = catSkills[targetIdx].sort_order;
    catSkills[targetIdx].sort_order = tempOrder;

    try {
      await Promise.all([
        supabase.from('skills').update({ sort_order: catSkills[idx].sort_order }).eq('id', catSkills[idx].id),
        supabase.from('skills').update({ sort_order: catSkills[targetIdx].sort_order }).eq('id', catSkills[targetIdx].id)
      ]);
      loadSkills();
    } catch (err) {
      window.adminToast.show('Failed to reorder skill.', 'error');
    }
  };

  // --- TOGGLES ---
  window.toggleSkillVisibility = async function (id) {
    const s = skillsList.find((item) => item.id === id);
    if (!s) return;
    const next = !s.visible;

    const supabase = gateway.getClient();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('skills').update({ visible: next }).eq('id', id);
      if (error) throw error;
      s.visible = next;
      renderSkillsGroups();
      window.adminToast.show('Visibility updated.', 'success');
    } catch (err) {
      window.adminToast.show('Failed to toggle visibility.', 'error');
    }
  };

  window.toggleSkillMarquee = async function (id) {
    const s = skillsList.find((item) => item.id === id);
    if (!s) return;
    const next = !s.in_marquee;

    const supabase = gateway.getClient();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('skills').update({ in_marquee: next }).eq('id', id);
      if (error) throw error;
      s.in_marquee = next;
      renderSkillsGroups();
      window.adminToast.show('Marquee setting updated.', 'success');
    } catch (err) {
      window.adminToast.show('Failed to toggle marquee.', 'error');
    }
  };

  // --- MODAL ---
  window.openCreateSkillModal = function (presetCat = 'backend') {
    currentEditingId = null;
    document.getElementById('skill-form').reset();
    document.getElementById('skill-category').value = presetCat;
    document.getElementById('skill-modal-title').textContent = 'Add New Skill';
    document.getElementById('skill-id-field').value = '';
    document.getElementById('skill-marquee').checked = true;
    document.getElementById('skill-visible').checked = true;
    openAdminModal('skill-editor-modal');
  };

  window.editSkill = function (id) {
    const s = skillsList.find((item) => item.id === id);
    if (!s) return;

    currentEditingId = id;
    document.getElementById('skill-modal-title').textContent = `Edit Skill: ${s.name}`;
    document.getElementById('skill-id-field').value = s.id;
    document.getElementById('skill-name').value = s.name || '';
    document.getElementById('skill-category').value = s.category || 'backend';
    document.getElementById('skill-level-label').value = s.level_label || '';
    document.getElementById('skill-marquee').checked = !!s.in_marquee;
    document.getElementById('skill-visible').checked = !!s.visible;

    openAdminModal('skill-editor-modal');
  };

  window.deleteSkill = function (id) {
    const s = skillsList.find((item) => item.id === id);
    if (!s) return;

    window.adminConfirm(
      'Delete Skill',
      `Delete skill "${s.name}"?`,
      async () => {
        const supabase = gateway.getClient();
        if (!supabase) return;

        try {
          const { error } = await supabase.from('skills').delete().eq('id', id);
          if (error) throw error;
          window.adminToast.show(`Skill "${s.name}" deleted.`, 'success');
          loadSkills();
        } catch (err) {
          window.adminToast.show('Failed to delete skill.', 'error');
        }
      }
    );
  };

  async function handleSkillSubmit(e) {
    e.preventDefault();
    const supabase = gateway.getClient();
    if (!supabase) return;

    const name = document.getElementById('skill-name').value.trim();
    const category = document.getElementById('skill-category').value;
    const level_label = document.getElementById('skill-level-label').value.trim() || null;
    const in_marquee = document.getElementById('skill-marquee').checked;
    const visible = document.getElementById('skill-visible').checked;

    const submitBtn = document.getElementById('save-skill-btn');
    submitBtn.disabled = true;

    try {
      const payload = {
        name,
        category,
        level_label,
        in_marquee,
        visible
      };

      if (currentEditingId) {
        const { error } = await supabase.from('skills').update(payload).eq('id', currentEditingId);
        if (error) throw error;
        window.adminToast.show('Skill updated successfully.', 'success');
      } else {
        payload.sort_order = skillsList.length + 1;
        const { error } = await supabase.from('skills').insert([payload]);
        if (error) throw error;
        window.adminToast.show('Skill created successfully.', 'success');
      }

      closeAdminModal('skill-editor-modal');
      loadSkills();
    } catch (err) {
      window.adminToast.show(`Failed to save: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadSkills();
    document.getElementById('skill-form')?.addEventListener('submit', handleSkillSubmit);
  });
})();
