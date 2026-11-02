/* Phase 3: Gap Analysis + Testing & Scoring */

function countBy(arr, keyFn) {
  const map = {};
  arr.forEach(item => {
    const k = keyFn(item) || 'Unknown';
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function renderBarList(el, entries, total, highlightLow = false) {
  if (!el) return;
  if (!entries.length) { el.innerHTML = '<p class="hint">No data</p>'; return; }
  const max = entries[0][1] || 1;
  el.innerHTML = entries.slice(0, 12).map(([label, count]) => {
    const pct = Math.round((count / total) * 100);
    const width = Math.round((count / max) * 100);
    let cls = '';
    if (highlightLow && pct < 5) cls = 'low';
    else if (highlightLow && pct < 12) cls = 'mid';
    return `<div class="bar-row">
      <span class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
      <span class="bar-count">${count}</span>
      <div class="bar-track"><div class="bar-fill ${cls}" style="width:${width}%"></div></div>
    </div>`;
  }).join('');
}

function runGapAnalysis() {
  const projects = state.projects;
  const total = projects.length || 1;
  const cats = new Set(projects.map(p => getField(p, 'Category')).filter(Boolean));
  const techs = new Set(projects.map(p => getField(p, 'Main Technology')).filter(Boolean));
  const qualityA = projects.filter(p => normalizeQuality(getField(p, 'Quality')) === 'A').length;
  const otherTech = projects.filter(p => getField(p, 'Main Technology') === 'Other').length;

  const kpi = document.getElementById('gaps-kpi');
  if (kpi) {
    kpi.innerHTML = `
      <div class="kpi-card accent"><div class="kpi-value">${total.toLocaleString()}</div><div class="kpi-label">Total Projects</div></div>
      <div class="kpi-card"><div class="kpi-value">${cats.size}</div><div class="kpi-label">Categories</div></div>
      <div class="kpi-card"><div class="kpi-value">${techs.size}</div><div class="kpi-label">Technologies</div></div>
      <div class="kpi-card ok"><div class="kpi-value">${Math.round(qualityA / total * 100)}%</div><div class="kpi-label">Quality A</div></div>
      <div class="kpi-card ${otherTech / total > 0.1 ? 'warn' : ''}"><div class="kpi-value">${otherTech}</div><div class="kpi-label">"Other" Tech</div></div>
    `;
  }

  renderBarList(document.getElementById('gaps-categories'), countBy(projects, p => getField(p, 'Category')), total, true);
  renderBarList(document.getElementById('gaps-tech'), countBy(projects, p => getField(p, 'Main Technology')), total, true);
  renderBarList(document.getElementById('gaps-quality'), countBy(projects, p => normalizeQuality(getField(p, 'Quality')) || 'Unknown'), total);
  renderBarList(document.getElementById('gaps-complexity'), countBy(projects, p => getField(p, 'Complexity') || 'Unknown'), total);

  const featureCounts = {};
  projects.forEach(p => {
    (getField(p, 'Website Features') || '').split(/[,/|]/).forEach(f => {
      const t = f.trim();
      if (t.length > 2) featureCounts[t] = (featureCounts[t] || 0) + 1;
    });
  });
  renderBarList(document.getElementById('gaps-features'), Object.entries(featureCounts).sort((a, b) => b[1] - a[1]), total);

  const underEl = document.getElementById('gaps-under');
  const under = [];
  countBy(projects, p => getField(p, 'Category')).forEach(([cat, n]) => {
    if (n / total < 0.05) under.push({ title: cat, detail: `Only ${n} projects (${Math.round(n/total*100)}%) — expand this category`, level: n / total < 0.02 ? 'critical' : 'warning' });
  });
  if (otherTech > 50) under.push({ title: 'Unclassified technology', detail: `${otherTech} projects still marked "Other" — re-tag for better matching`, level: 'warning' });
  ['SaaS', 'Education', 'Real Estate', 'Healthcare', 'Restaurant', 'Portfolio'].forEach(cat => {
    if (!cats.has(cat)) under.push({ title: `Missing: ${cat}`, detail: 'No projects in this category', level: 'critical' });
  });
  if (underEl) {
    underEl.innerHTML = under.slice(0, 10).map(u =>
      `<div class="gap-item ${u.level}"><strong>${escapeHtml(u.title)}</strong><span>${escapeHtml(u.detail)}</span></div>`
    ).join('') || '<p class="hint">No major gaps detected</p>';
  }

  const recs = [];
  if (otherTech > 50) recs.push(`<strong>Retag ${otherTech} "Other" projects</strong> — improve Main Technology labels to boost matching precision.`);
  const saas = projects.filter(p => getField(p, 'Category') === 'SaaS').length;
  if (saas < total * 0.05) recs.push(`<strong>Add more SaaS / web app references</strong> — only ${saas} SaaS projects; high demand on Fiverr/Upwork.`);
  const next = projects.filter(p => /next|react/i.test(getField(p, 'Main Technology'))).length;
  if (next < total * 0.08) recs.push(`<strong>Grow React / Next.js portfolio</strong> — ${next} projects; modern stack clients are rising.`);
  if (!recs.length) recs.push('<strong>Portfolio looks balanced.</strong> Focus on deeper niche coverage in top categories.');
  const recEl = document.getElementById('gaps-recommendations');
  if (recEl) recEl.innerHTML = recs.map(r => `<li>${r}</li>`).join('');
}

const TEST_BRIEFS = [
  { id: 'wp-basic', title: 'WordPress business site', expect: ['WordPress', 'Agency', 'General Business'], brief: 'Need a modern WordPress website with Elementor, contact form, blog, responsive design and basic SEO for a consulting firm.' },
  { id: 'shopify-store', title: 'Shopify online store', expect: ['Shopify', 'E-commerce'], brief: 'Client needs a Shopify store with product catalog, cart, payment gateway, and clean mobile shopping experience.' },
  { id: 'woo-store', title: 'WooCommerce store', expect: ['WordPress + WooCommerce', 'E-commerce'], brief: 'Build a WooCommerce shop on WordPress with product filters, checkout, and inventory management.' },
  { id: 'saas-dash', title: 'SaaS dashboard', expect: ['SaaS', 'React', 'Next'], brief: 'Looking for a custom SaaS web application with authentication, admin dashboard, and subscription billing.' },
  { id: 'healthcare', title: 'Clinic website', expect: ['Healthcare'], brief: 'Healthcare clinic website with appointment booking, doctor profiles, and patient information pages.' },
  { id: 'restaurant', title: 'Restaurant site', expect: ['Restaurant'], brief: 'Restaurant website with menu, online reservation system, location map and photo gallery.' },
  { id: 'realestate', title: 'Real estate listings', expect: ['Real Estate'], brief: 'Real estate agency site with property listings, search filters, agent profiles and contact forms.' },
  { id: 'redesign', title: 'Website redesign', expect: ['Agency', 'Portfolio'], brief: 'Professional redesign of an existing website focusing on speed, mobile UX and conversion rate optimization.' }
];

const testState = { scores: {}, lastResults: [] };

function scoreMatchAgainstExpect(matches, expect) {
  if (!matches.length) return 0;
  let hits = 0;
  matches.slice(0, 5).forEach(p => {
    const hay = [getField(p, 'Category'), getField(p, 'Sub Category'), getField(p, 'Main Technology'), getField(p, 'Used Stack'), getField(p, 'Keywords')].join(' ').toLowerCase();
    if (expect.some(e => hay.includes(e.toLowerCase()))) hits += 1;
  });
  const coverage = hits / Math.min(5, Math.max(1, expect.length + 2));
  return Math.round(Math.min(100, coverage * 100 + (matches.length >= 3 ? 10 : 0)));
}

function explainMatch(p, briefTokens) {
  const reasons = [];
  const cat = getField(p, 'Category');
  const tech = getField(p, 'Main Technology');
  const feats = getField(p, 'Website Features');
  if (briefTokens.some(t => cat.toLowerCase().includes(t))) reasons.push(`Category: ${cat}`);
  if (briefTokens.some(t => tech.toLowerCase().includes(t))) reasons.push(`Tech: ${tech}`);
  const featHits = (feats || '').split(/[,/|]/).map(s => s.trim()).filter(f => briefTokens.some(t => f.toLowerCase().includes(t)));
  if (featHits.length) reasons.push(`Features: ${featHits.slice(0, 3).join(', ')}`);
  if (!reasons.length) reasons.push(getField(p, 'Strengths') || 'Keyword relevance');
  return reasons.join(' · ');
}

function runSingleTest(test) {
  const matches = simpleLocalMatch(test.brief, 8);
  const tokens = test.brief.toLowerCase().split(/\W+/).filter(t => t.length > 3);
  const score = scoreMatchAgainstExpect(matches, test.expect || []);
  testState.scores[test.id] = score;
  return { test, matches, score, tokens };
}

function renderTestResults(payload) {
  const el = document.getElementById('test-results');
  const summary = document.getElementById('test-score-summary');
  if (!el) return;
  const { test, matches, score, tokens } = payload;
  if (summary) summary.textContent = `Score: ${score}/100 · ${matches.length} matches`;
  if (!matches.length) { el.innerHTML = '<div class="empty-state"><p>No matches found for this brief.</p></div>'; return; }
  el.innerHTML = `
    <div class="overall-score-banner">
      <div class="osb-value">${score}</div>
      <div class="osb-label"><strong>${escapeHtml(test.title)}</strong><br>Match quality score (0–100)</div>
    </div>
    ${matches.map((p, i) => `
      <div class="match-score-card">
        <div class="msc-top">
          <div class="msc-name"><a href="${getField(p, 'Website URL')}" target="_blank" rel="noopener">${escapeHtml(projectName(p))}</a></div>
          <div class="msc-score">#${i + 1}</div>
        </div>
        <div class="msc-meta">${escapeHtml(getField(p, 'Category'))} · ${escapeHtml(getField(p, 'Main Technology'))} · Q${escapeHtml(normalizeQuality(getField(p, 'Quality')) || '—')}</div>
        <div class="msc-why">${escapeHtml(explainMatch(p, tokens))}</div>
      </div>
    `).join('')}`;
}

function renderTestBriefList() {
  const list = document.getElementById('test-brief-list');
  if (!list) return;
  list.innerHTML = TEST_BRIEFS.map(t => {
    const sc = testState.scores[t.id];
    let scoreCls = '', scoreLabel = '—';
    if (sc !== undefined) { scoreLabel = sc; scoreCls = sc >= 70 ? 'good' : sc >= 40 ? 'mid' : 'bad'; }
    return `<button class="test-brief-item" data-id="${t.id}">
      <div><div class="tb-title">${escapeHtml(t.title)}</div><div class="tb-meta">${escapeHtml((t.expect || []).join(', '))}</div></div>
      <span class="tb-score ${scoreCls}">${scoreLabel}</span>
    </button>`;
  }).join('');
  list.querySelectorAll('.test-brief-item').forEach(btn => {
    btn.addEventListener('click', () => {
      list.querySelectorAll('.test-brief-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const test = TEST_BRIEFS.find(t => t.id === btn.dataset.id);
      if (test) { renderTestResults(runSingleTest(test)); renderTestBriefList(); renderScoreboard(); }
    });
  });
}

function renderScoreboard() {
  const board = document.getElementById('scoreboard');
  if (!board) return;
  const entries = TEST_BRIEFS.map(t => ({ title: t.title, score: testState.scores[t.id] })).filter(e => e.score !== undefined);
  if (!entries.length) {
    board.innerHTML = '<div class="empty-state" style="padding:24px"><p>Run the test suite to populate scores.</p></div>';
    return;
  }
  const avg = Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length);
  board.innerHTML = `
    <div class="score-tile ${avg >= 70 ? 'good' : avg >= 40 ? 'mid' : 'bad'}">
      <div class="st-title">Suite Average</div>
      <div class="st-score">${avg}</div>
      <div class="st-detail">${entries.length} / ${TEST_BRIEFS.length} tests run</div>
    </div>
    ${entries.map(e => `
      <div class="score-tile ${e.score >= 70 ? 'good' : e.score >= 40 ? 'mid' : 'bad'}">
        <div class="st-title">${escapeHtml(e.title)}</div>
        <div class="st-score">${e.score}</div>
      </div>
    `).join('')}`;
}

function runAllTests() {
  TEST_BRIEFS.forEach(t => runSingleTest(t));
  renderTestBriefList();
  renderScoreboard();
  renderTestResults(runSingleTest(TEST_BRIEFS[0]));
  const vals = Object.values(testState.scores);
  toast(`Suite complete · avg ${Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)}`);
}

function runCustomTest() {
  const brief = (document.getElementById('custom-test-brief')?.value || '').trim();
  if (!brief) return toast('Enter a custom brief first');
  const btn = document.getElementById('btn-run-custom-test');
  setButtonLoading(btn, true);
  setTimeout(() => {
    const test = { id: 'custom', title: 'Custom brief', expect: [], brief };
    const matches = simpleLocalMatch(brief, 8);
    const tokens = brief.toLowerCase().split(/\W+/).filter(t => t.length > 3);
    let hits = 0;
    matches.slice(0, 5).forEach(p => {
      const hay = [getField(p, 'Category'), getField(p, 'Main Technology'), getField(p, 'Keywords'), getField(p, 'Website Features')].join(' ').toLowerCase();
      tokens.forEach(t => { if (hay.includes(t)) hits += 1; });
    });
    const score = Math.min(100, Math.round((hits / Math.max(tokens.length, 1)) * 25 + (matches.length >= 3 ? 15 : 0)));
    renderTestResults({ test, matches, score, tokens });
    setButtonLoading(btn, false);
    toast(`Custom brief scored ${score}/100`);
  }, 150);
}

/* Bootstrap — wire into existing app */
(function () {
  const origSwitch = typeof switchView === 'function' ? switchView : function(){};
  window.switchView = function(view) {
    origSwitch(view);
    if (view === 'gaps') runGapAnalysis();
    if (view === 'testing') { renderTestBriefList(); renderScoreboard(); }
  };
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => window.switchView(btn.dataset.view));
  });
  const refreshGaps = document.getElementById('btn-refresh-gaps');
  if (refreshGaps) refreshGaps.addEventListener('click', () => { runGapAnalysis(); toast('Gap analysis refreshed'); });
  const runAll = document.getElementById('btn-run-all-tests');
  if (runAll) runAll.addEventListener('click', runAllTests);
  const runCustom = document.getElementById('btn-run-custom-test');
  if (runCustom) runCustom.addEventListener('click', runCustomTest);
  console.log('[Phase3] Gap Analysis + Testing ready');
})();
