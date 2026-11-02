/* Polished database loader — sole data source (CSV parts) */
(function () {
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
    const headers = rows[0].map(h => h.trim());
    const out = [];
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      if (!cells || !cells.length) continue;
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = (cells[idx] || '').trim(); });
      let url = obj['Website URL'] || '';
      if (!url) continue;
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      obj['Website URL'] = url;
      const live = String(obj['Is Live'] || 'Yes').toLowerCase();
      obj['Is Live'] = !(live === 'no' || live === 'false' || live === '0');
      out.push(obj);
    }
    return out;
  }

  async function fetchCSV(path) {
    const bases = [
      '',
      './',
      'https://cdn.jsdelivr.net/gh/zunaidhasan/sardarit-reference-engine@main/',
      'https://raw.githubusercontent.com/zunaidhasan/sardarit-reference-engine/main/'
    ];
    for (const base of bases) {
      try {
        const res = await fetch(base + path, { cache: 'no-store' });
        if (!res.ok) continue;
        const text = await res.text();
        if (text && text.length > 50) return text;
      } catch (e) { /* try next */ }
    }
    return null;
  }

  window.loadPolishedDatabase = async function () {
    const parts = ['database-polished-part1.csv', 'database-polished-part2.csv'];
    const full = await fetchCSV('database-polished.csv');
    let all = [];
    if (full) {
      all = rowsToObjects(parseCSV(full));
    }
    if (!all.length) {
      for (const p of parts) {
        const text = await fetchCSV(p);
        if (!text) continue;
        all = all.concat(rowsToObjects(parseCSV(text)));
      }
    }
    const seen = new Set();
    const unique = [];
    all.forEach(obj => {
      const key = (obj['Website URL'] || '').replace(/\/$/, '').toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      unique.push(obj);
    });
    if (unique.length) {
      console.log('[SardarIT] Polished DB loaded →', unique.length, 'projects');
      return unique;
    }
    return null;
  };
})();
