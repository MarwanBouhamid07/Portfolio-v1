/**
 * Admin Dashboard Controller
 * Fetches dashboard metrics, lists recent items, and handles complete JSON backup export.
 */

(function () {
  'use strict';

  async function loadDashboardData() {
    const gateway = window.PortfolioSupabase;
    if (!gateway) return;

    const supabase = gateway.getClient();
    if (!supabase) return;

    try {
      // 1. Fetch counts
      const [projRes, skillsRes, certsRes, msgRes, profileRes] = await Promise.all([
        supabase.from('projects').select('id, title, category, status, updated_at', { count: 'exact' }),
        supabase.from('skills').select('id', { count: 'exact' }),
        supabase.from('certificates').select('id', { count: 'exact' }),
        supabase.from('contact_messages').select('id, name, email, subject, created_at, read', { count: 'exact' }).order('created_at', { ascending: false }),
        supabase.from('profile').select('*').limit(1).maybeSingle()
      ]);

      // Populate counts
      const projCountEl = document.getElementById('stat-projects-count');
      const skillsCountEl = document.getElementById('stat-skills-count');
      const certsCountEl = document.getElementById('stat-certs-count');
      const msgCountEl = document.getElementById('stat-messages-count');
      const navMsgBadge = document.getElementById('nav-unread-badge');

      if (projCountEl && projRes.data) {
        projCountEl.textContent = projRes.data.length;
      }
      if (skillsCountEl && skillsRes.data) {
        skillsCountEl.textContent = skillsRes.data.length;
      }
      if (certsCountEl && certsRes.data) {
        certsCountEl.textContent = certsRes.data.length;
      }

      if (msgRes.data) {
        const unreadCount = msgRes.data.filter((m) => !m.read).length;
        if (msgCountEl) msgCountEl.textContent = unreadCount;
        if (navMsgBadge) {
          if (unreadCount > 0) {
            navMsgBadge.style.display = 'inline-block';
            navMsgBadge.textContent = unreadCount;
          } else {
            navMsgBadge.style.display = 'none';
          }
        }
      }

      // Populate recent projects table
      const recentProjectsTable = document.getElementById('recent-projects-tbody');
      if (recentProjectsTable && projRes.data) {
        if (projRes.data.length === 0) {
          recentProjectsTable.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: var(--space-xl);">No projects found in database. Run the seed script to populate.</td></tr>`;
        } else {
          recentProjectsTable.innerHTML = projRes.data.slice(0, 5).map((p) => `
            <tr>
              <td><strong>${window.PortfolioSupabase.escapeHTML(p.title)}</strong></td>
              <td><span class="badge-status ${p.status === 'published' ? 'badge-published' : 'badge-draft'}">${p.status}</span></td>
              <td>${window.PortfolioSupabase.escapeHTML(p.category)}</td>
              <td>
                <a href="projects.html" class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 12px;">Edit</a>
              </td>
            </tr>
          `).join('');
        }
      }

      // Populate recent messages table
      const recentMessagesTable = document.getElementById('recent-messages-tbody');
      if (recentMessagesTable && msgRes.data) {
        if (msgRes.data.length === 0) {
          recentMessagesTable.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: var(--space-xl);">No contact messages yet.</td></tr>`;
        } else {
          recentMessagesTable.innerHTML = msgRes.data.slice(0, 5).map((m) => `
            <tr>
              <td>
                ${!m.read ? '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--accent); margin-right:6px;"></span>' : ''}
                <strong>${window.PortfolioSupabase.escapeHTML(m.name)}</strong>
              </td>
              <td>${window.PortfolioSupabase.escapeHTML(m.subject || 'No Subject')}</td>
              <td>${new Date(m.created_at).toLocaleDateString()}</td>
              <td>
                <a href="messages.html" class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 12px;">View</a>
              </td>
            </tr>
          `).join('');
        }
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      window.adminToast.show('Error connecting to database. Please check configuration.', 'error');
    }
  }

  // --- JSON BACKUP EXPORT ---
  async function downloadFullBackup() {
    const gateway = window.PortfolioSupabase;
    if (!gateway) return;

    const supabase = gateway.getClient();
    if (!supabase) return;

    window.adminToast.show('Exporting database backup...', 'info');

    try {
      const [prof, social, skills, proj, certs, msgs] = await Promise.all([
        supabase.from('profile').select('*'),
        supabase.from('social_links').select('*'),
        supabase.from('skills').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('certificates').select('*'),
        supabase.from('contact_messages').select('*')
      ]);

      const backup = {
        exported_at: new Date().toISOString(),
        author: 'Marwan Bouhamid Portfolio CMS',
        data: {
          profile: prof.data || [],
          social_links: social.data || [],
          skills: skills.data || [],
          projects: proj.data || [],
          certificates: certs.data || [],
          contact_messages: msgs.data || []
        }
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      window.adminToast.show('Database backup exported successfully!', 'success');
    } catch (err) {
      console.error('Backup export failed:', err);
      window.adminToast.show('Failed to export backup.', 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();

    const exportBtn = document.getElementById('btn-download-backup');
    if (exportBtn) {
      exportBtn.addEventListener('click', downloadFullBackup);
    }
  });
})();
