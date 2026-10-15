/**
 * GitHub Activity Controller
 * Fetches contributions and repository telemetry for MarwanBouhamid07.
 * Uses Promise.allSettled, localStorage caching (1-hr TTL), skeleton loading,
 * error recovery, staggered wave animation, and full a11y & i18n support.
 */

(function () {
  'use strict';

  // ── 1. Configuration ────────────────────────────────────────────────────────
  const GITHUB_CONFIG = {
    username: 'MarwanBouhamid07',
    contribApiUrl: 'https://github-contributions-api.jogruber.de/v4/MarwanBouhamid07',
    reposApiUrl: 'https://api.github.com/users/MarwanBouhamid07/repos?per_page=100',
    profileUrl: 'https://github.com/MarwanBouhamid07',
    cacheKey: 'portfolio_github_activity_cache',
    cacheTtlMs: 60 * 60 * 1000, // 1 hour
    fetchTimeoutMs: 10000        // 10 seconds timeout
  };

  const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // ── State ──────────────────────────────────────────────────────────────────
  let state = {
    loading: true,
    error: null,
    contributionData: {}, // { [year]: { days: { [dateStr]: { count, level } }, total: number } }
    repoData: {},         // { [year]: count }
    totalRepos: 0,
    availableYears: [],
    selectedYear: '',
    hasAnimatedWave: false,
    hoveredCell: null
  };

  // Helper: fetch with AbortController timeout
  async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  // ── 2. Cache Helpers (localStorage with try/catch) ──────────────────────────
  function getCachedData() {
    try {
      const raw = localStorage.getItem(GITHUB_CONFIG.cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < GITHUB_CONFIG.cacheTtlMs) {
        return parsed.data;
      }
    } catch (e) {
      console.warn('GitHub Activity cache read error:', e);
    }
    return null;
  }

  function setCachedData(data) {
    try {
      localStorage.setItem(
        GITHUB_CONFIG.cacheKey,
        JSON.stringify({ timestamp: Date.now(), data })
      );
    } catch (e) {
      console.warn('GitHub Activity cache write error:', e);
    }
  }

  // ── 3. Data Fetching (Promise.allSettled) ───────────────────────────────────
  async function fetchGitHubData(forceRefresh = false) {
    state.loading = true;
    state.error = null;
    render();

    // Check cache first if not forced
    if (!forceRefresh) {
      const cached = getCachedData();
      if (cached && cached.contributionData && Object.keys(cached.contributionData).length > 0) {
        state.contributionData = cached.contributionData;
        state.repoData = cached.repoData || {};
        state.totalRepos = cached.totalRepos || 0;
        state.availableYears = cached.availableYears || [];
        state.selectedYear = cached.availableYears[0] || new Date().getFullYear().toString();
        state.loading = false;
        render();
        initMobileScroll();
        return;
      }
    }

    try {
      const [contribResult, reposResult] = await Promise.allSettled([
        fetchWithTimeout(GITHUB_CONFIG.contribApiUrl, GITHUB_CONFIG.fetchTimeoutMs),
        fetchWithTimeout(GITHUB_CONFIG.reposApiUrl, GITHUB_CONFIG.fetchTimeoutMs)
      ]);

      let parsedContribs = {};
      let contribsSuccess = false;

      // Handle Contributions result
      if (contribResult.status === 'fulfilled' && contribResult.value.ok) {
        const contribJson = await contribResult.value.json();
        if (Array.isArray(contribJson.contributions)) {
          contribJson.contributions.forEach(day => {
            if (!day.date) return;
            const year = day.date.split('-')[0];
            if (!parsedContribs[year]) {
              parsedContribs[year] = { days: {}, total: 0 };
            }

            // Must fix: Use level field directly if provided by jogruber API; otherwise compute
            const level = typeof day.level === 'number'
              ? day.level
              : (day.count > 0 ? Math.min(Math.ceil(day.count / 2), 4) : 0);

            parsedContribs[year].days[day.date] = {
              count: day.count || 0,
              level: level
            };
            parsedContribs[year].total += (day.count || 0);
          });
          contribsSuccess = true;
        }
      }

      let parsedRepos = {};
      let totalPublic = 0;
      let reposSuccess = false;

      // Handle Repos result
      if (reposResult.status === 'fulfilled' && reposResult.value.ok) {
        const reposJson = await reposResult.value.json();
        if (Array.isArray(reposJson)) {
          totalPublic = reposJson.length;
          reposJson.forEach(repo => {
            if (repo.created_at) {
              const year = repo.created_at.split('-')[0];
              parsedRepos[year] = (parsedRepos[year] || 0) + 1;
            }
          });
          reposSuccess = true;
        }
      }

      // If both APIs failed and we have no cached data, trigger error state
      if (!contribsSuccess && !reposSuccess) {
        throw new Error('Both Contributions API and GitHub API requests were unfulfilled.');
      }

      // Compute available years (sorted newest first)
      const years = Object.keys(parsedContribs).sort().reverse();
      const currentYearStr = new Date().getFullYear().toString();
      const initialYear = years[0] || currentYearStr;

      state.contributionData = parsedContribs;
      state.repoData = parsedRepos;
      state.totalRepos = totalPublic;
      state.availableYears = years.length > 0 ? years : [currentYearStr];
      state.selectedYear = initialYear;
      state.loading = false;

      // Cache successful payload
      setCachedData({
        contributionData: parsedContribs,
        repoData: parsedRepos,
        totalRepos: totalPublic,
        availableYears: state.availableYears
      });

      render();
      initMobileScroll();

    } catch (err) {
      console.error('GitHub Activity loading error:', err);
      state.loading = false;
      state.error = err.message || 'Unable to connect to GitHub.';
      render();
    }
  }

  // ── 4. Heatmap Geometry & Metric Calculations ──────────────────────────────
  function computeHeatmapGrid(yearStr) {
    if (!yearStr) {
      return { gridCells: [], monthPositions: [], activeDaysCount: 0, maxDailyContributions: 0 };
    }

    const yearNum = parseInt(yearStr, 10);
    // Start at Jan 1st at midday to prevent DST timezone shifts
    const startDate = new Date(yearNum, 0, 1, 12, 0, 0);
    const dayOfWeek = startDate.getDay(); // 0 = Sunday

    const TOTAL_CELLS = 53 * 7; // 371 cells
    const curr = new Date(startDate);
    curr.setDate(curr.getDate() - dayOfWeek); // Rewind to first Sunday

    const cells = [];
    const months = [];
    let activeDays = 0;
    let maxCount = 0;

    const yearObj = state.contributionData[yearStr] || { days: {} };

    for (let i = 0; i < TOTAL_CELLS; i++) {
      const y = curr.getFullYear();
      const m = (curr.getMonth() + 1).toString().padStart(2, '0');
      const d = curr.getDate().toString().padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const isCorrectYear = (y === yearNum);

      let count = 0;
      let level = 0;

      if (isCorrectYear) {
        const dayEntry = yearObj.days[dateStr];
        if (dayEntry) {
          count = dayEntry.count;
          level = dayEntry.level;
          if (count > 0) {
            activeDays++;
            if (count > maxCount) maxCount = count;
          }
        }
      }

      const colIndex = Math.floor(i / 7);
      const rowIndex = i % 7;

      // Capture month labels for Sunday week columns within the target year
      if (rowIndex === 0 && isCorrectYear && curr.getDate() <= 7) {
        months.push({
          colIndex,
          label: MONTH_NAMES[curr.getMonth()]
        });
      }

      cells.push({
        id: `gh-cell-${i}`,
        dateStr,
        dayOfWeek: rowIndex,
        colIndex,
        isCorrectYear,
        count,
        level
      });

      curr.setDate(curr.getDate() + 1);
    }

    return {
      gridCells: cells,
      monthPositions: months,
      activeDaysCount: activeDays,
      maxDailyContributions: maxCount
    };
  }

  // ── 5. Number Count-Up Animation (Reduced-motion friendly) ──────────────────
  function animateNumber(element, targetValue, durationMs = 900) {
    if (!element) return;
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) {
      element.textContent = targetValue.toLocaleString();
      return;
    }

    const startVal = 0;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out quart
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(startVal + (targetValue - startVal) * ease);
      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = targetValue.toLocaleString();
      }
    }
    requestAnimationFrame(update);
  }

  // ── 6. Mobile Horizontal Scroll ────────────────────────────────────────────
  function initMobileScroll() {
    requestAnimationFrame(() => {
      const scrollBox = document.getElementById('gh-scroll-container');
      if (scrollBox && window.innerWidth < 768) {
        // Start scrolled to the most recent weeks (right-most)
        scrollBox.scrollLeft = scrollBox.scrollWidth - scrollBox.clientWidth;
      }
    });
  }

  // ── 7. Render Function ─────────────────────────────────────────────────────
  function render() {
    const root = document.getElementById('github-activity-root');
    if (!root) return;

    const currentLang = localStorage.getItem('portfolio_lang') || 'en';
    const dict = window.portfolioTranslations ? window.portfolioTranslations[currentLang] : {};

    // ── LOADING SKELETON ──
    if (state.loading) {
      root.innerHTML = `
        <div class="gh-loading-box">
          <div class="gh-spinner" aria-hidden="true"></div>
          <p class="gh-loading-text">${dict.github_loading || 'Fetching contributions and repositories from GitHub...'}</p>
        </div>
      `;
      return;
    }

    // ── ERROR STATE ──
    if (state.error) {
      root.innerHTML = `
        <div class="gh-error-card">
          <div class="gh-error-icon">⚠️</div>
          <h3 class="gh-error-title">${dict.github_error_title || 'Failed to Load Activity'}</h3>
          <p class="gh-error-desc">${dict.github_error_desc || 'Could not fetch data from GitHub. The API might be temporarily unavailable or rate-limited.'}</p>
          <div class="gh-error-actions">
            <button type="button" id="gh-retry-btn" class="btn btn-primary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              <span>${dict.github_retry || 'Retry'}</span>
            </button>
            <a href="${GITHUB_CONFIG.profileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              <span>${dict.github_view_profile || 'View GitHub Profile'}</span>
            </a>
          </div>
        </div>
      `;

      const retryBtn = document.getElementById('gh-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => fetchGitHubData(true));
      }
      return;
    }

    // ── MAIN CONTENT ──
    const selectedYear = state.selectedYear;
    const yearData = state.contributionData[selectedYear] || { total: 0 };
    const currentYearTotal = yearData.total || 0;
    const currentYearRepos = state.repoData[selectedYear] || 0;

    const {
      gridCells,
      monthPositions,
      activeDaysCount,
      maxDailyContributions
    } = computeHeatmapGrid(selectedYear);

    // Summary text for accessibility
    const summaryText = `${currentYearTotal} contributions in ${selectedYear}`;

    // Generate Year Buttons
    const yearTabsHTML = state.availableYears.map(yr => {
      const isSelected = (yr === selectedYear);
      return `
        <button
          type="button"
          class="gh-year-tab ${isSelected ? 'active' : ''}"
          role="tab"
          aria-pressed="${isSelected}"
          aria-selected="${isSelected}"
          data-year="${yr}"
        >
          ${yr}
        </button>
      `;
    }).join('');

    // Month labels HTML
    const monthLabelsHTML = monthPositions.map(m => {
      return `<span class="gh-month-label" style="left: ${m.colIndex * 15}px;">${m.label}</span>`;
    }).join('');

    // Cells HTML (staggered delay via column variable)
    const cellsHTML = gridCells.map(cell => {
      if (!cell.isCorrectYear) {
        return `<div class="gh-cell empty" aria-hidden="true"></div>`;
      }

      const countText = cell.count === 0
        ? (dict.github_no_contrib || 'No contributions')
        : `${cell.count} ${cell.count === 1 ? (dict.github_contrib_singular || 'contribution') : (dict.github_contrib_plural || 'contributions')}`;
      const cellLabel = `${countText} ${dict.github_on_date || 'on'} ${cell.dateStr}`;

      return `
        <div
          class="gh-cell level-${cell.level}"
          style="--col: ${cell.colIndex};"
          data-count="${cell.count}"
          data-date="${cell.dateStr}"
          data-label="${cellLabel}"
          tabindex="0"
          role="gridcell"
          aria-label="${cellLabel}"
        ></div>
      `;
    }).join('');

    // Metric Strings
    const inYearLabel = (dict.github_stat_in_year || 'In {year}').replace('{year}', selectedYear);
    const peakLabel = (dict.github_stat_peak || 'Peak day: {count} commits').replace('{count}', maxDailyContributions);
    const weeksLabel = (dict.github_weeks_display || 'Displaying 53 weeks ({year})').replace('{year}', selectedYear);

    root.innerHTML = `
      <div class="gh-activity-container">

        <!-- Top Controls: Year Tabs & External GitHub Profile Link -->
        <div class="gh-controls-bar">
          <div class="gh-year-tabs" role="tablist" aria-label="Contribution Years">
            ${yearTabsHTML}
          </div>

          <a href="${GITHUB_CONFIG.profileUrl}" target="_blank" rel="noopener noreferrer" class="gh-profile-btn" aria-label="Visit GitHub Profile for @MarwanBouhamid07">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            <span>github.com/${GITHUB_CONFIG.username}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
        </div>

        <!-- 4 Stats Cards Grid -->
        <div class="gh-stats-grid">
          <!-- Card 1: Contributions -->
          <div class="gh-stat-card">
            <div class="gh-stat-header">
              <span class="gh-stat-label">${dict.github_stat_contributions || 'Contributions'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><line x1="1.05" y1="12" x2="7" y2="12"></line><line x1="17.01" y1="12" x2="22.96" y2="12"></line></svg>
            </div>
            <div class="gh-stat-value" id="gh-stat-contrib-val">0</div>
            <div class="gh-stat-sub">${inYearLabel}</div>
          </div>

          <!-- Card 2: Repos Created -->
          <div class="gh-stat-card">
            <div class="gh-stat-header">
              <span class="gh-stat-label">${dict.github_stat_repos || 'Repos Created'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div class="gh-stat-value" id="gh-stat-repos-val">0</div>
            <div class="gh-stat-sub">${inYearLabel}</div>
          </div>

          <!-- Card 3: Total Public Repos -->
          <div class="gh-stat-card">
            <div class="gh-stat-header">
              <span class="gh-stat-label">${dict.github_stat_total_repos || 'Total Repos'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            </div>
            <div class="gh-stat-value" id="gh-stat-total-repos-val">0</div>
            <div class="gh-stat-sub">${dict.github_stat_all_time || 'All-time public'}</div>
          </div>

          <!-- Card 4: Active Days & Peak -->
          <div class="gh-stat-card">
            <div class="gh-stat-header">
              <span class="gh-stat-label">${dict.github_stat_active_days || 'Active Days'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div class="gh-stat-value" id="gh-stat-active-days-val">0</div>
            <div class="gh-stat-sub">${peakLabel}</div>
          </div>
        </div>

        <!-- Heatmap Card (Always dir="ltr") -->
        <div class="gh-heatmap-card" dir="ltr">
          <!-- Heatmap Header: Live Info & Summary -->
          <div class="gh-heatmap-header">
            <div class="gh-timeline-badge">
              <span class="gh-pulse-dot" aria-hidden="true"></span>
              <span>${selectedYear} ${dict.github_timeline_title || 'Contribution Timeline'}</span>
            </div>

            <div class="gh-live-tooltip" id="gh-live-tooltip-display" aria-live="polite">
              <span class="gh-tooltip-placeholder">${dict.github_hover_prompt || 'Hover or focus any square for details'}</span>
            </div>
          </div>

          <!-- Accessible Text Summary for Screen Readers & Fallback -->
          <p class="gh-sr-summary sr-only">${summaryText}</p>

          <!-- Scrollable Heatmap Canvas (Starts right on mobile) -->
          <div class="gh-scroll-container" id="gh-scroll-container" role="img" aria-label="${summaryText}">
            <div class="gh-grid-wrapper">
              <!-- Month labels row -->
              <div class="gh-months-row" aria-hidden="true">
                ${monthLabelsHTML}
              </div>

              <!-- Main Grid with Days of Week -->
              <div class="gh-grid-body">
                <!-- Day-of-week Column -->
                <div class="gh-days-col" aria-hidden="true">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                <!-- 53 x 7 CSS Grid of Cells -->
                <div class="gh-cells-grid" id="gh-cells-grid">
                  ${cellsHTML}
                </div>
              </div>
            </div>
          </div>

          <!-- Heatmap Footer: Legend & Note -->
          <div class="gh-heatmap-footer">
            <div class="gh-weeks-count">${weeksLabel}</div>

            <div class="gh-legend" aria-label="Activity Legend">
              <span>${dict.github_legend_less || 'Less'}</span>
              <div class="gh-legend-cells" aria-hidden="true">
                <span class="gh-cell level-0"></span>
                <span class="gh-cell level-1"></span>
                <span class="gh-cell level-2"></span>
                <span class="gh-cell level-3"></span>
                <span class="gh-cell level-4"></span>
              </div>
              <span>${dict.github_legend_more || 'More'}</span>
            </div>
          </div>
        </div>

        <!-- Small Disclaimer Note -->
        <p class="gh-disclaimer-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <span>${dict.github_disclaimer || "Counts reflect public data from GitHub and may differ from the rolling 'last 12 months' number on my GitHub profile."}</span>
        </p>

      </div>
    `;

    // Attach Event Listeners
    attachEventListeners();

    // Trigger Number Count-Up Animations
    animateNumber(document.getElementById('gh-stat-contrib-val'), currentYearTotal);
    animateNumber(document.getElementById('gh-stat-repos-val'), currentYearRepos);
    animateNumber(document.getElementById('gh-stat-total-repos-val'), state.totalRepos);
    animateNumber(document.getElementById('gh-stat-active-days-val'), activeDaysCount);
  }

  // ── 8. Event Listeners for Interactivity ───────────────────────────────────
  function attachEventListeners() {
    // Year Tab Clicks
    const yearTabs = document.querySelectorAll('.gh-year-tab');
    yearTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const yr = tab.getAttribute('data-year');
        if (yr && yr !== state.selectedYear) {
          state.selectedYear = yr;
          render();
          initMobileScroll();
        }
      });
    });

    // Tooltip Interaction for Cells
    const tooltipDisplay = document.getElementById('gh-live-tooltip-display');
    const cells = document.querySelectorAll('.gh-cell[data-label]');

    cells.forEach(cell => {
      const showCell = () => {
        if (!tooltipDisplay) return;
        const label = cell.getAttribute('data-label');
        tooltipDisplay.innerHTML = `<span class="gh-tooltip-active"><strong>${label}</strong></span>`;
      };

      const hideCell = () => {
        if (!tooltipDisplay) return;
        const currentLang = localStorage.getItem('portfolio_lang') || 'en';
        const dict = window.portfolioTranslations ? window.portfolioTranslations[currentLang] : {};
        tooltipDisplay.innerHTML = `<span class="gh-tooltip-placeholder">${dict.github_hover_prompt || 'Hover or focus any square for details'}</span>`;
      };

      cell.addEventListener('mouseenter', showCell);
      cell.addEventListener('mouseleave', hideCell);
      cell.addEventListener('focus', showCell);
      cell.addEventListener('blur', hideCell);
    });
  }

  // ── 9. Viewport Intersection Observer & Init ───────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('github');
    if (!section) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            obs.unobserve(entry.target);
            fetchGitHubData();
          }
        });
      }, { rootMargin: '200px 0px', threshold: 0.05 });

      observer.observe(section);
    } else {
      fetchGitHubData();
    }
  });

  // Re-render strings when language changes
  window.addEventListener('storage', (e) => {
    if (e.key === 'portfolio_lang') {
      render();
    }
  });

  // Hook into language switcher calls
  const origChangeLang = window.changeLanguage;
  if (typeof origChangeLang === 'function') {
    window.changeLanguage = function (lang) {
      origChangeLang(lang);
      if (!state.loading && !state.error) {
        render();
      }
    };
  }

})();
