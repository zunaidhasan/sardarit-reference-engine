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
      if (live === 'no' || live === 'false' || live === '0') obj['Is Live'] = false;
      else obj['Is Live'] = true;
      out.push(obj);
    });
    return out;
  }

  window.loadPolishedDatabase = async function () {
    if (window.__POLISHED_PARTS && window.__POLISHED_PARTS.length) {
      const data = dedupe(window.__POLISHED_PARTS);
      console.log('[SardarIT] Polished DB from JS parts →', data.length);
      return data;
    }
    return null;
  };
})();
