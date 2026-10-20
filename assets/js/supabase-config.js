/**
 * Supabase Client Configuration & Security Gateway
 * Pinned library version: @supabase/supabase-js@2.49.1
 * ONLY public "anon" key is permitted here. NEVER use or commit the "service_role" key!
 */

(function () {
  'use strict';

  // Default configuration (Replace with your actual Supabase URL & public anon key)
  // These can also be overridden via window.PORTFOLIO_SUPABASE_CONFIG if injected by build/server
  const DEFAULT_CONFIG = {
    url: 'https://aqrezdicrgiujawhxyei.supabase.co',
    anonKey: 'sb_publishable_MgEgdsWiNsvXhaYhqQxoNg_KIZhQI1w'
  };

  const storedConfig = window.PORTFOLIO_SUPABASE_CONFIG || DEFAULT_CONFIG;

  let supabaseClient = null;

  function isConfigured() {
    return (
      storedConfig.url &&
      storedConfig.url.startsWith('https://') &&
      !storedConfig.url.includes('xyzcompany.supabase.co') &&
      storedConfig.anonKey &&
      !storedConfig.anonKey.includes('placeholder')
    );
  }

  function getClient() {
    if (supabaseClient) return supabaseClient;

    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(storedConfig.url, storedConfig.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'portfolio_admin_auth'
        }
      });
      return supabaseClient;
    }

    return null;
  }

  /**
   * Strict URL Sanitizer for XSS prevention
   * Only allows valid https, mailto, tel, relative, or placeholder hash URLs.
   * Completely blocks javascript:, vbscript:, data:, and all dangerous protocols.
   */
  function sanitizeUrl(rawUrl, fallback = '#') {
    if (!rawUrl || typeof rawUrl !== 'string') return fallback;
    const trimmed = rawUrl.trim();
    if (trimmed === '#' || trimmed === '') return '#';
    if (trimmed.startsWith('/') || trimmed.startsWith('assets/')) return trimmed;

    try {
      const parsed = new URL(trimmed, window.location.origin);
      if (['https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
        return trimmed;
      }
    } catch (e) {
      // If URL parsing fails, reject
    }
    return fallback;
  }

  /**
   * Escape HTML entities helper (extra protection when constructing text)
   */
  function escapeHTML(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Export globally
  window.PortfolioSupabase = {
    config: storedConfig,
    isConfigured,
    getClient,
    sanitizeUrl,
    escapeHTML
  };
})();
