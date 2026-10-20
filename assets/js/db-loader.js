/**
 * Public Site Data Layer & Offline Fallback Engine
 * Fetches published content from Supabase, caches in localStorage (15m TTL),
 * and transparently falls back to local fallback JSON if network fails or DB is empty.
 * Never leaves the public site broken.
 */

(function () {
  'use strict';

  const CACHE_KEY = 'portfolio_public_db_cache';
  const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  let dataState = {
    loaded: false,
    fromCache: false,
    fromFallback: false,
    profile: null,
    social_links: [],
    skills: [],
    projects: [],
    certificates: []
  };

  function getCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data) {
        return parsed.data;
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
    return null;
  }

  function setCache(data) {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          data
        })
      );
    } catch (e) {
      console.warn('Cache write error:', e);
    }
  }

  async function loadFallbackData() {
    try {
      const res = await fetch('assets/data/fallback-data.json');
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch (err) {
      console.warn('Fallback JSON fetch failed, using window globals:', err);
    }

    // Secondary fallback using existing scripts (projectsData, certificatesData, etc.)
    return {
      profile: {
        name: 'Marwan Bouhamid',
        title_en: 'Full-Stack Web Developer',
        tagline_en: 'Make something good from you',
        photo_url: 'assets/images/profile.jpg',
        cv_url: 'assets/Marwan_Bouhamid_CV.pdf',
        email: 'marwanbouhamid123@gmail.com',
        phone: '0645905095',
        whatsapp: '212645905095',
        location_en: 'Tanger, Morocco'
      },
      social_links: [
        { label: 'GitHub', url: 'https://github.com/MarwanBouhamid07', icon: 'github', sort_order: 1, visible: true },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/marwan-bouhamid-784449375/', icon: 'linkedin', sort_order: 2, visible: true }
      ],
      skills: [],
      projects: window.portfolioProjects || [],
      certificates: window.portfolioCertificates || []
    };
  }

  async function fetchFromSupabase() {
    const gateway = window.PortfolioSupabase;
    if (!gateway || !gateway.isConfigured()) return null;

    const supabase = gateway.getClient();
    if (!supabase) return null;

    try {
      const [profRes, socialRes, skillsRes, projRes, certsRes] = await Promise.all([
        supabase.from('profile').select('*').limit(1).maybeSingle(),
        supabase.from('social_links').select('*').eq('visible', true).order('sort_order', { ascending: true }),
        supabase.from('skills').select('*').eq('visible', true).order('sort_order', { ascending: true }),
        supabase.from('projects').select('*').eq('status', 'published').order('sort_order', { ascending: true }),
        supabase.from('certificates').select('*').eq('visible', true).order('sort_order', { ascending: true })
      ]);

      // Check if project records were returned
      if (projRes.data && projRes.data.length > 0) {
        return {
          profile: profRes.data || null,
          social_links: socialRes.data || [],
          skills: skillsRes.data || [],
          projects: projRes.data || [],
          certificates: certsRes.data || []
        };
      }
    } catch (err) {
      console.warn('Supabase query error, reverting to fallback:', err);
    }

    return null;
  }

  async function initDataLoader() {
    // 1. Try cache
    const cached = getCache();
    if (cached && cached.projects && cached.projects.length > 0) {
      dataState = { ...cached, loaded: true, fromCache: true, fromFallback: false };
      dispatchDataReady();
      // Silently refresh in background
      refreshInBackground();
      return;
    }

    // 2. Try Supabase
    const dbData = await fetchFromSupabase();
    if (dbData) {
      dataState = { ...dbData, loaded: true, fromCache: false, fromFallback: false };
      setCache(dbData);
      dispatchDataReady();
      return;
    }

    // 3. Fallback to local JSON
    const fallback = await loadFallbackData();
    dataState = { ...fallback, loaded: true, fromCache: false, fromFallback: true };
    dispatchDataReady();
  }

  async function refreshInBackground() {
    try {
      const fresh = await fetchFromSupabase();
      if (fresh) {
        setCache(fresh);
      }
    } catch (e) {
      // Background refresh failure is safe to ignore
    }
  }

  function dispatchDataReady() {
    window.portfolioData = dataState;
    document.dispatchEvent(new CustomEvent('portfolio-data-ready', { detail: dataState }));
  }

  window.PortfolioDbLoader = {
    init: initDataLoader,
    getState: () => dataState,
    getProjects: () => dataState.projects || [],
    getSkills: () => dataState.skills || [],
    getCertificates: () => dataState.certificates || [],
    getProfile: () => dataState.profile || {},
    getSocialLinks: () => dataState.social_links || []
  };

  // Auto initialize on script execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDataLoader);
  } else {
    initDataLoader();
  }
})();
