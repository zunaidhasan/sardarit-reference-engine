/* -- Sardar IT Reference Engine v3 - Polished ------------------- */

const state = {
  view: 'generator',
  projects: [],
  filtered: [],
  offset: 0,
  limit: 24,
  search: '',
  category: '',
  tech: '',
  quality: '',
  complexity: '',
  live: '',
  layout: 'grid',
  loading: false
};

function getField(p, ...keys) {
  for (const k of keys) {
    if (p[k] !== undefined && p[k] !== null && String(p[k]).trim() !== '') return p[k];
  }
  return '';
}

function projectName(p) {
  const name = getField(p, 'Project Name', 'project_name');
  if (name) return name;
  try {
    const host = new URL(getField(p, 'Website URL', 'website_url')).hostname.replace(/^www\./, '');
    return host.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  } catch {
    return 'Untitled Project';
  }
}

function normalizeQuality(q) {
  if (!q) return '';
  const v = String(q).toLowerCase();
  if (v === 'high' || v === 'a') return 'A';
  if (v === 'medium' || v === 'b') return 'B';
  if (v === 'low' || v === 'c') return 'C';
  return q;
}

function isLiveValue(p) {
  const v = getField(p, 'Is Live', 'is_live');
  if (v === '' || v === undefined || v === null) return true;
  if (v === false || v === 'No' || v === 'no' || v === '0' || v === 0) return false;
  return true;
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2400);
}

function setButtonLoading(btn, loading) {
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
  const spinner = btn.querySelector('.btn-spinner');
  if (spinner) spinner.hidden = !loading;
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('active', v.id === `view-${view}`);
  });

  const titles = {
    generator: ['AI Generator', 'Match briefs against the local reference database and draft proposals'],
    portfolio: ['Portfolio Explorer', 'Browse, filter and inspect every reference project'],
    gaps: ['Gap Analysis', 'Identify missing coverage in categories, stacks and features'],
    testing: ['Testing & Scoring', 'Validate matching accuracy with controlled briefs'],
    settings: ['Settings', 'API key, model and signature configuration']
  };
  const [title, sub] = titles[view] || ['', ''];
  document.getElementById('page-title').textContent = title;
  document.getElementById('page-subtitle').textContent = sub;

  if (view === 'portfolio') applyPortfolioFilters(true);
  lucide.createIcons();
}

function updateActiveFilterChips() {
  const bar = document.getElementById('active-filters');
  const clearBtn = document.getElementById('btn-clear-filters');
  const chips = [];

  if (state.search) chips.push({ key: 'search', label: `Search: "${state.search.slice(0, 24)}${state.search.length > 24 ? '…' : ''}"` });
  if (state.category) chips.push({ key: 'category', label: state.category });
  if (state.tech) chips.push({ key: 'tech', label: state.tech });
  if (state.quality) chips.push({ key: 'quality', label: `Quality: ${state.quality}` });
  if (state.complexity) chips.push({ key: 'complexity', label: `Complexity: ${state.complexity}` });
  if (state.live) chips.push({ key: 'live', label: state.live === 'yes' ? 'Live only' : 'Offline only' });

  if (!chips.length) {
    bar.hidden = true;
    bar.innerHTML = '';
    clearBtn.hidden = true;
    return;
  }

  bar.hidden = false;
  clearBtn.hidden = false;
  bar.innerHTML = chips.map(c => `
    <span class="filter-chip" data-key="${c.key}">
      ${c.label}
      <button type="button" aria-label="Remove"><i data-lucide="x"></i></button>
    </span>
  `).join('');
  lucide.createIcons();

  bar.querySelectorAll('.filter-chip').forEach(chip => {
    chip.querySelector('button').addEventListener('click', () => {
      const key = chip.dataset.key;
      if (key === 'search') {
        state.search = '';
        document.getElementById('portfolio-search').value = '';
        document.getElementById('search-clear').hidden = true;
      } else if (key === 'category') {
        state.category = '';
        document.getElementById('filter-category').value = '';
      } else if (key === 'tech') {
        state.tech = '';
        document.getElementById('filter-tech').value = '';
      } else if (key === 'quality') {
        state.quality = '';
        document.getElementById('filter-quality').value = '';
      } else if (key === 'complexity') {
        state.complexity = '';
        document.getElementById('filter-complexity').value = '';
      } else if (key === 'live') {
        state.live = '';
        document.getElementById('filter-live').value = '';
      }
      applyPortfolioFilters(true);
    });
  });
}

function clearAllFilters() {
  state.search = state.category = state.tech = state.quality = state.complexity = state.live = '';
  document.getElementById('portfolio-search').value = '';
  document.getElementById('search-clear').hidden = true;
  document.getElementById('filter-category').value = '';
  document.getElementById('filter-tech').value = '';
  document.getElementById('filter-quality').value = '';
  document.getElementById('filter-complexity').value = '';
  document.getElementById('filter-live').value = '';
  applyPortfolioFilters(true);
}

function applyPortfolioFilters(reset = false) {
  if (reset) state.offset = 0;

  const q = state.search.toLowerCase();
  state.filtered = state.projects.filter(p => {
    if (state.category && getField(p, 'Category') !== state.category) return false;
    if (state.tech) {
      const stack = (getField(p, 'Used Stack', 'Main Technology') || '').toLowerCase();
      if (!stack.includes(state.tech.toLowerCase())) return false;
    }
    if (state.quality) {
      const qv = normalizeQuality(getField(p, 'Quality'));
      const want = normalizeQuality(state.quality);
      if (qv !== want && getField(p, 'Quality') !== state.quality) return false;
    }
    if (state.complexity) {
      const c = getField(p, 'Complexity');
      if (c && c !== state.complexity) return false;
    }
    if (state.live === 'yes' && !isLiveValue(p)) return false;
    if (state.live === 'no' && isLiveValue(p)) return false;

    if (q) {
      const hay = [
        getField(p, 'Website URL'),
        projectName(p),
        getField(p, 'Category'),
        getField(p, 'Sub Category'),
        getField(p, 'Main Technology'),
        getField(p, 'Used Stack'),
        getField(p, 'Website Features'),
        getField(p, 'Brief Description'),
        getField(p, 'Use Case', 'Use_Case'),
        getField(p, 'Target Audience'),
        getField(p, 'Keywords'),
        getField(p, 'Strengths')
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  document.getElementById('portfolio-count').textContent = state.filtered.length.toLocaleString();
  updateActiveFilterChips();
  renderPortfolioGrid(reset);
}

function renderPortfolioGrid(reset = false) {
  const grid = document.getElementById('portfolio-grid');
  const empty = document.getElementById('portfolio-empty');
  const moreBtn = document.getElementById('btn-load-more');

  if (reset) {
    grid.innerHTML = '';
    state.offset = 0;
  }

  if (!state.filtered.length) {
    grid.innerHTML = '';
    empty.hidden = false;
    moreBtn.hidden = true;
    return;
  }
  empty.hidden = true;

  const slice = state.filtered.slice(state.offset, state.offset + state.limit);
  slice.forEach((p, i) => {
    const card = createProjectCard(p);
    card.style.animationDelay = `${Math.min(i * 0.03, 0.3)}s`;
    grid.appendChild(card);
  });

  state.offset += slice.length;
  moreBtn.hidden = state.offset >= state.filtered.length;
  lucide.createIcons();
}

function createProjectCard(p) {
  const url = getField(p, 'Website URL', 'website_url');
  const name = projectName(p);
  const category = getField(p, 'Category') || 'Uncategorized';
  const sub = getField(p, 'Sub Category');
  const mainTech = getField(p, 'Main Technology') || '—';
  const quality = getField(p, 'Quality') || '';
  const nq = normalizeQuality(quality);
  const complexity = getField(p, 'Complexity');
  const desc = getField(p, 'Brief Description') || '';
  const strengths = getField(p, 'Strengths') || '';
  const features = getField(p, 'Website Features') || '';
  const audience = getField(p, 'Target Audience') || '';
  const keywords = (getField(p, 'Keywords') || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 5);
  const live = isLiveValue(p);

  const qualityClass = nq === 'A' || quality === 'High' ? 'quality-a' :
                       nq === 'B' || quality === 'Medium' ? 'quality-b' :
                       nq === 'C' ? 'quality-c' : '';

  const card = document.createElement('article');
  card.className = 'project-card';

  card.innerHTML = `
    <div class="card-body">
      <div class="card-top">
        <div class="card-title">
          <a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a>
        </div>
        <div class="card-badges">
          ${quality ? `<span class="badge ${qualityClass}">${escapeHtml(nq || quality)}</span>` : ''}
          ${complexity ? `<span class="badge">${escapeHtml(complexity)}</span>` : ''}
          ${!live ? `<span class="badge offline">Offline</span>` : ''}
        </div>
      </div>
      <div class="card-meta">
        <span>${escapeHtml(category)}${sub ? ' · ' + escapeHtml(sub) : ''}</span>
        <span class="dot">·</span>
        <span>${escapeHtml(mainTech)}</span>
        ${audience ? `<span class="dot">·</span><span>${escapeHtml(audience)}</span>` : ''}
      </div>
      ${desc ? `<p class="card-desc">${escapeHtml(desc)}</p>` : ''}
      ${features ? `<p class="card-features">${escapeHtml(features)}</p>` : ''}
      ${keywords.length ? `<div class="card-tags">${keywords.map(k => `<span class="tag">${escapeHtml(k)}</span>`).join('')}</div>` : ''}
      ${strengths ? `<div class="card-strengths"><strong>Strengths:</strong> ${escapeHtml(strengths)}</div>` : ''}
    </div>
    <div class="card-footer">
      <a class="card-link" href="${url}" target="_blank" rel="noopener noreferrer">
        Visit site <i data-lucide="external-link"></i>
      </a>
    </div>
  `;
  return card;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function populateFilters() {
  const cats = [...new Set(state.projects.map(p => getField(p, 'Category')).filter(Boolean))].sort();
  const catSelect = document.getElementById('filter-category');
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    catSelect.appendChild(opt);
  });

  const techSet = new Set();
  state.projects.forEach(p => {
    const stack = getField(p, 'Used Stack', 'Main Technology') || '';
    stack.split(',').forEach(t => {
      const clean = t.trim();
      if (clean && clean.length > 1 && clean.length < 30) techSet.add(clean);
    });
  });
  const techSelect = document.getElementById('filter-tech');
  [...techSet].sort().slice(0, 80).forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    techSelect.appendChild(opt);
  });
}

function simpleLocalMatch(brief, limit = 6) {
  const tokens = brief.toLowerCase().split(/\W+/).filter(t => t.length > 3);
  const scored = state.projects.map(p => {
    const hay = [
      getField(p, 'Category'),
      getField(p, 'Sub Category'),
      getField(p, 'Main Technology'),
      getField(p, 'Used Stack'),
      getField(p, 'Website Features'),
      getField(p, 'Keywords'),
      getField(p, 'Brief Description'),
      getField(p, 'Use Case', 'Use_Case'),
      getField(p, 'Strengths'),
      getField(p, 'Target Audience')
    ].join(' ').toLowerCase();

    let score = 0;
    tokens.forEach(t => { if (hay.includes(t)) score += 1; });
    const q = normalizeQuality(getField(p, 'Quality'));
    if (q === 'A' || getField(p, 'Quality') === 'High') score += 0.5;
    return { p, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.p);
}

function renderMatchResults(matches) {
  const out = document.getElementById('output-content');
  if (!matches.length) {
    out.innerHTML = `<div class="empty-state"><p>No strong matches found. Try a more specific brief.</p></div>`;
    return;
  }

  let html = `Top matches for your brief\n\n`;
  matches.forEach((p, i) => {
    const name = projectName(p);
    const url = getField(p, 'Website URL');
    const cat = getField(p, 'Category');
    const tech = getField(p, 'Main Technology');
    const strengths = getField(p, 'Strengths');
    html += `${i + 1}. ${name}\n   ${url}\n   ${cat} · ${tech}\n`;
    if (strengths) html += `   Strengths: ${strengths}\n`;
    html += `\n`;
  });
  out.textContent = html;
  document.getElementById('btn-copy').disabled = false;
}

async function handleMatch() {
  const brief = document.getElementById('brief-input').value.trim();
  if (!brief) return toast('Please enter a brief first');
  const btn = document.getElementById('btn-match');
  setButtonLoading(btn, true);
  await new Promise(r => setTimeout(r, 180));
  try {
    const matches = simpleLocalMatch(brief, 8);
    renderMatchResults(matches);
    toast(`Found ${matches.length} matches`);
  } finally {
    setButtonLoading(btn, false);
  }
}

async function handleProposal() {
  const brief = document.getElementById('brief-input').value.trim();
  if (!brief) return toast('Please enter a brief first');

  const btn = document.getElementById('btn-proposal');
  setButtonLoading(btn, true);
  const key = localStorage.getItem('gemini_key');
  const matches = simpleLocalMatch(brief, 3);

  try {
    if (!key) {
      await new Promise(r => setTimeout(r, 200));
      let text = `Hello,\n\nI've reviewed your requirements carefully.\n\n`;
      text += `I can deliver a solution that matches the scope you described. Below are highly relevant past projects that demonstrate similar work:\n\n`;
      matches.forEach((p, i) => {
        text += `${i + 1}. ${projectName(p)}\n   ${getField(p, 'Website URL')}\n`;
      });
      text += `\nI'm confident I can meet your expectations on quality, timeline and communication.\n\n`;
      text += localStorage.getItem('signature') || 'Best regards,\nSardar IT';
      document.getElementById('output-content').textContent = text;
      document.getElementById('btn-copy').disabled = false;
      toast('Draft created (local mode — add Gemini key for full AI)');
      return;
    }

    document.getElementById('output-content').innerHTML = `<div class="empty-state"><p>Generating with Gemini…</p></div>`;
    const model = localStorage.getItem('default_model') || 'gemini-2.0-flash';
    const dbSnippet = matches.map(p => ({
      url: getField(p, 'Website URL'),
      name: projectName(p),
      category: getField(p, 'Category'),
      tech: getField(p, 'Main Technology'),
      strengths: getField(p, 'Strengths')
    }));

    const prompt = `You are a professional freelance proposal writer for Sardar IT.
Write a concise, high-converting Fiverr/Upwork style proposal for this brief.
Use only these portfolio references (do not invent URLs):
${JSON.stringify(dbSnippet, null, 2)}

Client brief:
${brief}

Rules:
- Address the client politely
- Show understanding of the brief
- Mention the 3 portfolio links naturally
- Keep it under 220 words
- End with a clear next step
- No markdown headings`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 800 }
        })
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Generation failed.';
    document.getElementById('output-content').textContent = text;
    document.getElementById('btn-copy').disabled = false;
    toast('Proposal generated');
  } catch (err) {
    document.getElementById('output-content').textContent = 'Error calling Gemini. Check your API key.';
    toast('Gemini error');
  } finally {
    setButtonLoading(btn, false);
  }
}

function loadSettings() {
  document.getElementById('settings-api-key').value = localStorage.getItem('gemini_key') || '';
  document.getElementById('settings-model').value = localStorage.getItem('default_model') || 'gemini-2.0-flash';
  document.getElementById('settings-signature').value = localStorage.getItem('signature') || 'Best regards,\nZunaid Hasan\nSardar IT';
}

function saveSettings() {
  localStorage.setItem('gemini_key', document.getElementById('settings-api-key').value.trim());
  localStorage.setItem('default_model', document.getElementById('settings-model').value);
  localStorage.setItem('signature', document.getElementById('settings-signature').value);
  toast('Settings saved');
}

function init() {
  const statusDot = document.getElementById('status-dot');
  statusDot.classList.add('loading');

  if (typeof PROJECT_DB !== 'undefined' && Array.isArray(PROJECT_DB)) {
    state.projects = PROJECT_DB;
    statusDot.classList.remove('loading');
    statusDot.classList.add('ready');
    document.getElementById('db-status-text').textContent = 'Database ready';
    document.getElementById('stat-count').textContent = PROJECT_DB.length.toLocaleString();
    document.getElementById('info-total').textContent = PROJECT_DB.length.toLocaleString();
    const cats = new Set(PROJECT_DB.map(p => getField(p, 'Category')).filter(Boolean));
    document.getElementById('info-categories').textContent = cats.size;
    populateFilters();
  } else {
    statusDot.classList.remove('loading');
    document.getElementById('db-status-text').textContent = 'No database found';
  }

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.getElementById('theme-toggle').addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    lucide.createIcons();
  });
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

  document.getElementById('btn-match').addEventListener('click', handleMatch);
  document.getElementById('btn-proposal').addEventListener('click', handleProposal);
  document.getElementById('brief-input').addEventListener('input', e => {
    const words = e.target.value.trim().split(/\s+/).filter(Boolean).length;
    document.getElementById('word-count').textContent = words;
  });
  document.getElementById('brief-input').addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') handleProposal();
  });
  document.getElementById('situation-chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (chip) {
      document.getElementById('brief-input').value = chip.dataset.fill;
      document.getElementById('word-count').textContent = chip.dataset.fill.split(/\s+/).length;
    }
  });
  document.getElementById('btn-copy').addEventListener('click', () => {
    const text = document.getElementById('output-content').innerText;
    navigator.clipboard.writeText(text).then(() => toast('Copied'));
  });

  const searchInput = document.getElementById('portfolio-search');
  const searchClear = document.getElementById('search-clear');
  searchInput.addEventListener('input', e => {
    state.search = e.target.value;
    searchClear.hidden = !e.target.value;
    applyPortfolioFilters(true);
  });
  searchClear.addEventListener('click', () => {
    state.search = '';
    searchInput.value = '';
    searchClear.hidden = true;
    applyPortfolioFilters(true);
  });

  document.getElementById('filter-category').addEventListener('change', e => {
    state.category = e.target.value;
    applyPortfolioFilters(true);
  });
  document.getElementById('filter-tech').addEventListener('change', e => {
    state.tech = e.target.value;
    applyPortfolioFilters(true);
  });
  document.getElementById('filter-quality').addEventListener('change', e => {
    state.quality = e.target.value;
    applyPortfolioFilters(true);
  });
  document.getElementById('filter-complexity').addEventListener('change', e => {
    state.complexity = e.target.value;
    applyPortfolioFilters(true);
  });
  document.getElementById('filter-live').addEventListener('change', e => {
    state.live = e.target.value;
    applyPortfolioFilters(true);
  });

  document.getElementById('btn-clear-filters').addEventListener('click', clearAllFilters);
  document.getElementById('btn-empty-clear').addEventListener('click', clearAllFilters);

  document.getElementById('btn-load-more').addEventListener('click', () => {
    const btn = document.getElementById('btn-load-more');
    setButtonLoading(btn, true);
    setTimeout(() => {
      renderPortfolioGrid(false);
      setButtonLoading(btn, false);
    }, 120);
  });

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.layout = btn.dataset.layout;
      const grid = document.getElementById('portfolio-grid');
      grid.classList.toggle('list-layout', state.layout === 'list');
    });
  });

  loadSettings();
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);

  lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', init);
