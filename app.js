/* SardarIT bootstrap */
(function () {
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  async function boot() {
    var cores = [
      'https://cdn.jsdelivr.net/gh/zunaidhasan/sardarit-reference-engine@9174012f76/app.js',
      'https://raw.githubusercontent.com/zunaidhasan/sardarit-reference-engine/9174012f76/app.js'
    ];
    for (var i = 0; i < cores.length; i++) {
      try { await loadScript(cores[i]); console.log('[SardarIT] core', cores[i]); break; }
      catch (e) { console.warn(e); }
    }
    window.loadDatabaseFallback = async function () {
      if (typeof window.loadPolishedDatabase === 'function') {
        try {
          var d = await window.loadPolishedDatabase();
          if (d && d.length) return d;
        } catch (e) {}
      }
      var names = ['Polished%20database.csv', 'Polished database.csv'];
      var bases = [
        'https://cdn.jsdelivr.net/gh/zunaidhasan/sardarit-reference-engine@main/',
        'https://raw.githubusercontent.com/zunaidhasan/sardarit-reference-engine/main/'
      ];
      for (var n = 0; n < names.length; n++) {
        for (var b = 0; b < bases.length; b++) {
          try {
            var res = await fetch(bases[b] + names[n], { cache: 'no-store' });
            if (!res.ok) continue;
            var text = await res.text();
            if (!text || text.indexOf('Website URL') < 0) continue;
            var rows = text.split(/\r?\n/).filter(Boolean);
            var headers = rows[0].split(',').map(function (h) { return h.trim().replace(/^\uFEFF/, ''); });
            var data = [];
            for (var r = 1; r < rows.length; r++) {
              var cells = rows[r].split(',');
              if (!cells.length) continue;
              var obj = {};
              for (var h = 0; h < headers.length; h++) obj[headers[h]] = (cells[h] || '').trim();
              if (obj['Website URL']) data.push(obj);
            }
            if (data.length) { console.log('[SardarIT] CSV', data.length); return data; }
          } catch (e) {}
        }
      }
      return null;
    };
    var _apply = window.applyLoadedDB;
    if (typeof _apply === 'function') {
      window.applyLoadedDB = function (db) {
        try { _apply(db); } catch (e) { console.warn(e); }
        try {
          if (state && state.projects && state.projects.length) {
            state.filtered = state.projects.slice();
            if (typeof applyFilters === 'function') applyFilters();
            else if (typeof renderPortfolioGrid === 'function') {
              try { renderPortfolioGrid(true); } catch (e2) {
                var grid = document.getElementById('portfolio-grid');
                if (grid) {
                  grid.innerHTML = '';
                  state.projects.slice(0, 24).forEach(function (p) {
                    if (typeof createProjectCard === 'function') grid.appendChild(createProjectCard(p));
                  });
                }
              }
            }
          }
        } catch (e) { console.warn(e); }
      };
    }
    if (typeof state !== 'undefined' && (!state.projects || !state.projects.length)) {
      window.loadDatabaseFallback().then(function (data) {
        if (data && data.length && typeof applyLoadedDB === 'function') {
          window.PROJECT_DB = data;
          applyLoadedDB(data);
        }
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
