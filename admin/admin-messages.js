/**
 * Admin Messages Inbox Controller
 * View, filter, mark read/unread, and delete incoming contact messages.
 */

(function () {
  'use strict';

  let messagesList = [];
  const gateway = window.PortfolioSupabase;

  async function loadMessages() {
    if (!gateway) return;
    const supabase = gateway.getClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      messagesList = data || [];
      renderMessagesTable();
    } catch (err) {
      console.error('Error fetching messages:', err);
      window.adminToast.show('Failed to fetch contact messages.', 'error');
    }
  }

  function renderMessagesTable() {
    const tbody = document.getElementById('messages-table-body');
    const filter = document.getElementById('message-filter')?.value || 'all';
    if (!tbody) return;

    const filtered = messagesList.filter((m) => {
      if (filter === 'unread') return !m.read;
      if (filter === 'read') return m.read;
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: var(--space-2xl);">No messages match current filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((m) => `
      <tr style="${!m.read ? 'font-weight: 600; background: rgba(0, 240, 255, 0.02);' : ''}">
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${!m.read ? '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--accent);" title="Unread"></span>' : '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:transparent;"></span>'}
            <strong>${gateway.escapeHTML(m.name)}</strong>
          </div>
          <div style="font-size: 11px; color: var(--text-muted);">${gateway.escapeHTML(m.email)}</div>
        </td>
        <td>${gateway.escapeHTML(m.subject || 'No Subject')}</td>
        <td style="font-size: var(--fs-xs);">${new Date(m.created_at).toLocaleString()}</td>
        <td>
          <button type="button" onclick="toggleMessageRead('${m.id}')" class="badge-status ${m.read ? 'badge-verified' : 'badge-unverified'}" style="cursor: pointer; border: 1px solid var(--border-color);">
            ${m.read ? 'Read' : '● Unread'}
          </button>
        </td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn btn-secondary btn-sm" onclick="viewMessage('${m.id}')">
              View
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="deleteMessage('${m.id}')" style="color: var(--color-danger);">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.toggleMessageRead = async function (id) {
    const m = messagesList.find((item) => item.id === id);
    if (!m) return;
    const next = !m.read;

    const supabase = gateway.getClient();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('contact_messages').update({ read: next }).eq('id', id);
      if (error) throw error;
      m.read = next;
      renderMessagesTable();
    } catch (err) {
      window.adminToast.show('Failed to update read status.', 'error');
    }
  };

  window.viewMessage = async function (id) {
    const m = messagesList.find((item) => item.id === id);
    if (!m) return;

    // Automatically mark read if unread
    if (!m.read) {
      const supabase = gateway.getClient();
      if (supabase) {
        supabase.from('contact_messages').update({ read: true }).eq('id', id).then(() => {
          m.read = true;
          renderMessagesTable();
        });
      }
    }

    document.getElementById('msg-detail-sender').textContent = m.name;
    document.getElementById('msg-detail-email').textContent = m.email;
    document.getElementById('msg-detail-email').href = `mailto:${encodeURIComponent(m.email)}?subject=Re: ${encodeURIComponent(m.subject || 'Portfolio Inquiry')}`;
    document.getElementById('msg-detail-subject').textContent = m.subject || 'No Subject';
    document.getElementById('msg-detail-date').textContent = new Date(m.created_at).toLocaleString();
    document.getElementById('msg-detail-body').textContent = m.message;

    openAdminModal('message-view-modal');
  };

  window.deleteMessage = function (id) {
    const m = messagesList.find((item) => item.id === id);
    if (!m) return;

    window.adminConfirm(
      'Delete Message',
      `Delete message from "${m.name}"?`,
      async () => {
        const supabase = gateway.getClient();
        if (!supabase) return;

        try {
          const { error } = await supabase.from('contact_messages').delete().eq('id', id);
          if (error) throw error;
          window.adminToast.show('Message deleted.', 'success');
          loadMessages();
        } catch (err) {
          window.adminToast.show('Failed to delete message.', 'error');
        }
      }
    );
  };

  document.addEventListener('DOMContentLoaded', () => {
    loadMessages();
    document.getElementById('message-filter')?.addEventListener('change', renderMessagesTable);
  });
})();
