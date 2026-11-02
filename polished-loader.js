/* Polished database loader — sole data source */
(function () {
  function parseCSV(text) {
    const rows = [];
    let i = 0, field = '', row = [], inQuotes = false;
    const pushField = () => { row.push(field); field = ''; };
    const pushRow = () => {
      if (row.length) rows.push(row);
      row = [];
    };
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
    const seen = new Set();
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      if (!cells || !cells.length) continue;
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = (cells[idx] || '').trim(); });
      let url = obj['Website URL'] || '';
      if (!url) continue;
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      obj['Website URL'] = url;
      const key = url.replace(/\/$/, '').toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const live = String(obj['Is Live'] || 'Yes').toLowerCase();
      obj['Is Live'] = !(live === 'no' || live === 'false' || live === '0');
      out.push(obj);
    }
    return out;
  }

  window.loadPolishedDatabase = async function () {
    const urls = [
      'database-polished.csv',
      './database-polished.csv',
      'https://cdn.jsdelivr.net/gh/zunaidhasan/sardarit-reference-engine@main/database-polished.csv',
      'https://raw.githubusercontent.com/zunaidhasan/sardarit-reference-engine/main/database-polished.csv'
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const text = await res.text();
        if (!text || text.length < 100) continue;
        const data = rowsToObjects(parseCSV(text));
        if (data.length) {
          console.log('[SardarIT] Polished DB loaded from', url, '→', data.length, 'projects');
          return data;
        }
      } catch (e) {
        console.warn('[SardarIT] polished load failed', url, e);
      }
    }
    return null;
  };
})();
