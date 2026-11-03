/* Polished database loader — sole data source */
(function () {
  function dedupe(list) {
    const seen = new Set();
    const out = [];
    (list || []).forEach(obj => {
      let url = (obj && obj['Website URL']) || '';
      if (!url) return;
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      obj['Website URL'] = url;
      const key = url.replace(/\/$/, '').toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      const live = String(obj['Is Live'] !== undefined ? obj['Is Live'] : 'Yes').toLowerCase();
      obj['Is Live'] = !(live === 'no' || live === 'false' || live === '0');
      out.push(obj);
    });
    return out;
  }

  function parseCSV(text) {
    const rows = [];
    let i = 0, field = '', row = [], inQuotes = false;
    const pushField = () => { row.push(field); field = ''; };
    const pushRow = () => { if (row.length) rows.push(row); row = []; };
    while (i < text.length) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { pushField(); i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { pushField(); pushRow(); i++; continue; }
      field += c; i++;
    }
    if (field.length || row.length) { pushField(); pushRow(); }
    return rows;
  }

  function rowsToObjects(rows) {
    if (!rows.length) return [];
    const headers = rows[0].map(h => (h || '').trim().replace(/^\uFEFF/, ''));
    const out = [];
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      if (!cells || !cells.length) continue;
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = (cells[idx] || '').trim(); });
      out.push(obj);
    }
    return out;
  }

  async function fetchText(path) {
    const bases = [
      'https://cdn.jsdelivr.net/gh/zunaidhasan/sardarit-reference-engine@main/',
      'https://raw.githubusercontent.com/zunaidhasan/sardarit-reference-engine/main/',
      '',
      './'
    ];
    for (const b of bases) {
      try {
        const url = b + path;
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const t = await res.text();
          if (t && t.length > 100 && (t.includes('Website URL') || t.includes('Project Name'))) {
            console.log('[SardarIT] fetched', url, t.length, 'bytes');
            return t;
          }
        }
      } catch (e) {
        console.warn('[SardarIT] fetch failed', b + path, e.message);
      }
    }
    return null;
  }

  window.loadPolishedDatabase = async function () {
    if (window.__POLISHED_PARTS && window.__POLISHED_PARTS.length) {
      const data = dedupe(window.__POLISHED_PARTS);
      console.log('[SardarIT] Polished DB from JS parts →', data.length);
      return data;
    }

    // Uploaded filename has a space: "Polished database.csv"
    const candidates = [
      'Polished%20database.csv',
      'Polished database.csv',
      'database-polished.csv',
      'polished-database.csv'
    ];

    for (const name of candidates) {
      const text = await fetchText(name);
      if (!text) continue;
      const data = dedupe(rowsToObjects(parseCSV(text)));
      if (data.length) {
        console.log('[SardarIT] Polished DB from', name, '→', data.length);
        return data;
      }
    }
    console.error('[SardarIT] No polished CSV found');
    return null;
  };

  window.loadDatabaseFallback = window.loadPolishedDatabase;

  function hydrate() {
    window.loadPolishedDatabase().then(data => {
      if (!data || !data.length) {
        const status = document.getElementById('db-status-text');
        if (status && (status.textContent || '').includes('Loading')) {
          status.textContent = 'No database found';
        }
        return;
      }
      if (typeof applyLoadedDB === 'function') {
        applyLoadedDB(data);
        return;
      }
      if (typeof state !== 'undefined') {
        state.projects = (typeof enrichDatabase === 'function') ? enrichDatabase(data) : data;
        const el = document.getElementById('stat-count');
        if (el) el.textContent = state.projects.length.toLocaleString();
        const status = document.getElementById('db-status-text');
        if (status) status.textContent = 'Database ready';
        const dot = document.getElementById('status-dot');
        if (dot) { dot.classList.remove('loading'); dot.classList.add('ready'); }
        if (typeof populateFilters === 'function') populateFilters();
        if (typeof toast === 'function') toast(state.projects.length + ' polished projects loaded');
      }
    }).catch(err => {
      console.error('[SardarIT] hydrate error', err);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(hydrate, 100));
  } else {
    setTimeout(hydrate, 100);
  }
})();
