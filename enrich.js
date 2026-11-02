/* Phase 2: Client-side database enrichment
 * Transforms legacy PROJECT_DB records into the v3 schema.
 */
(function () {
  function domainName(url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      const name = host.split('.')[0].replace(/[-_]/g, ' ');
      return name.replace(/\b\w/g, c => c.toUpperCase());
    } catch {
      return 'Untitled';
    }
  }

  function cleanTech(mainTech, usedStack) {
    const mt = (mainTech || '').trim();
    const stack = (usedStack || '').toLowerCase();
    if (mt && mt !== 'Other') {
      const map = {
        'Shopify Advanced': 'Shopify',
        'WordPress + WooCommerce': 'WordPress + WooCommerce',
        'Mixed (WordPress + React)': 'WordPress + React',
        'React / Next.js Custom': 'React / Next.js',
        'Laravel / Custom PHP': 'Laravel / PHP'
      };
      return map[mt] || mt;
    }
    if (stack.includes('shopify')) return 'Shopify';
    if (stack.includes('woocommerce') || (stack.includes('wordpress') && stack.includes('woo')))
      return 'WordPress + WooCommerce';
    if (stack.includes('wordpress') && (stack.includes('react') || stack.includes('next')))
      return 'WordPress + React';
    if (stack.includes('wordpress') || stack.includes('elementor')) return 'WordPress';
    if (stack.includes('next')) return 'React / Next.js';
    if (stack.includes('react')) return 'React';
    if (stack.includes('webflow')) return 'Webflow';
    if (stack.includes('laravel')) return 'Laravel / PHP';
    if (stack.includes('squarespace')) return 'Squarespace';
    if (stack.includes('wix')) return 'Wix';
    if (stack.includes('vue')) return 'Vue.js';
    return 'Other';
  }

  function subCategory(cat, features, stack) {
    const f = (features || '').toLowerCase();
    const s = (stack || '').toLowerCase();
    cat = cat || '';
    if (s.includes('shopify') || s.includes('woocommerce') || f.includes('shopping cart') || f.includes('payment')) {
      if (cat === 'E-commerce') return 'Online Store';
      if (cat === 'SaaS') return 'Commerce SaaS';
      return 'E-commerce Store';
    }
    if (f.includes('booking') || f.includes('appointment')) {
      if (cat === 'Healthcare') return 'Clinic / Appointment Booking';
      if (cat === 'Restaurant') return 'Reservation System';
      if (cat === 'Real Estate') return 'Property Viewing Booking';
      return 'Booking System';
    }
    if (f.includes('membership') || f.includes('authentication') || f.includes('login')) {
      if (cat === 'Education') return 'Course / Membership Platform';
      if (cat === 'SaaS') return 'Authenticated SaaS App';
      return 'Member Portal';
    }
    const map = {
      'Agency': 'Agency / Studio Site',
      'Portfolio': 'Personal / Creative Portfolio',
      'Healthcare': 'Healthcare Practice Site',
      'Education': 'Education / Training Site',
      'Real Estate': 'Property Listing Site',
      'Restaurant': 'Restaurant / Food Service',
      'SaaS': 'SaaS Product Site',
      'E-commerce': 'Online Store',
      'Blog/News': 'Blog / News Publication',
      'General Business': 'Corporate Business Site'
    };
    return map[cat] || cat || 'General';
  }

  function targetAudience(cat) {
    const map = {
      'E-commerce': 'Online shoppers & store owners',
      'Healthcare': 'Patients & healthcare providers',
      'Blog/News': 'Readers & content consumers',
      'Restaurant': 'Diners & restaurant visitors',
      'Agency': 'Businesses seeking design/dev services',
      'Education': 'Students, parents & educators',
      'Portfolio': 'Clients & employers',
      'General Business': 'Business clients & prospects',
      'Real Estate': 'Home buyers, sellers & renters',
      'SaaS': 'Software users & decision makers'
    };
    return map[cat] || 'General website visitors';
  }

  function complexity(features, stack) {
    const f = (features || '').toLowerCase();
    const s = (stack || '').toLowerCase();
    let score = 0;
    ['payment', 'shopping cart', 'booking', 'authentication', 'membership', 'multilingual', 'dashboard', 'marketplace']
      .forEach(sig => { if (f.includes(sig) || s.includes(sig)) score += 2; });
    ['blog', 'search', 'newsletter', 'contact form'].forEach(sig => { if (f.includes(sig)) score += 1; });
    if (s.includes('shopify') || s.includes('woocommerce') || s.includes('next') || s.includes('laravel')) score += 1;
    if (s.includes('react') || s.includes('vue')) score += 1;
    if (score >= 5) return 'High';
    if (score >= 2) return 'Medium';
    return 'Low';
  }

  function normalizeQuality(q) {
    const v = String(q || '').toLowerCase();
    if (v === 'high' || v === 'a') return 'A';
    if (v === 'medium' || v === 'b') return 'B';
    if (v === 'low' || v === 'c') return 'C';
    return 'B';
  }

  function fillKeywords(existing, cat, mainTech, features, stack) {
    const kws = new Set();
    if (existing) existing.split(',').forEach(k => { const t = k.trim().toLowerCase(); if (t) kws.add(t); });
    if (cat) kws.add(cat.toLowerCase());
    if (mainTech) kws.add(mainTech.toLowerCase().replace(/\s*\/\s*/g, ' ').replace(/\+/g, ' '));
    (features || '').split(/[,/|]/).forEach(t => { const x = t.trim().toLowerCase(); if (x.length > 2) kws.add(x); });
    (stack || '').split(',').forEach(t => { const x = t.trim().toLowerCase(); if (x.length > 1) kws.add(x); });
    return [...kws].slice(0, 12).join(', ');
  }

  function fillStrengths(existing, mainTech, features, quality) {
    if (existing && String(existing).trim()) return String(existing).trim();
    const parts = [];
    const f = (features || '').toLowerCase();
    const mt = mainTech || '';
    if (mt.includes('Shopify')) parts.push('Shopify e-commerce storefront');
    if (mt.includes('WordPress')) parts.push('WordPress CMS foundation');
    if (mt.includes('WooCommerce')) parts.push('WooCommerce product catalog');
    if (mt.includes('React') || mt.includes('Next')) parts.push('Modern React frontend');
    if (f.includes('booking')) parts.push('Booking / appointment flow');
    if (f.includes('payment') || f.includes('shopping cart')) parts.push('Checkout & payments');
    if (f.includes('multilingual') || f.includes('multi-language')) parts.push('Multilingual support');
    if (f.includes('search')) parts.push('Search functionality');
    if (quality === 'A' || quality === 'High') parts.push('Polished production design');
    if (!parts.length) parts.push('Clean professional web presence');
    return parts.slice(0, 4).join(' | ');
  }

  function enrichRecord(p) {
    if (p['Project Name'] && p['Sub Category'] && p['Target Audience'] && p['Complexity'] !== undefined && (p['Quality'] === 'A' || p['Quality'] === 'B' || p['Quality'] === 'C')) {
      return p;
    }
    const url = p['Website URL'] || p.website_url || '';
    const cat = (p.Category || 'General Business').trim();
    const stack = p['Used Stack'] || '';
    const features = p['Website Features'] || '';
    const main = cleanTech(p['Main Technology'] || 'Other', stack);
    const quality = normalizeQuality(p.Quality);
    const desc = (p['Brief Description'] || '').trim() || (cat + ' website built with ' + main + '.');
    const useCase = (p.Use_Case || p['Use Case'] || '').trim() || (cat + ' platform for end users.');

    return {
      'Website URL': url,
      'Project Name': p['Project Name'] || domainName(url),
      'Category': cat,
      'Sub Category': p['Sub Category'] || subCategory(cat, features, stack),
      'Main Technology': main,
      'Used Stack': stack.trim(),
      'Website Features': features.trim(),
      'Brief Description': desc,
      'Use Case': useCase,
      'Target Audience': p['Target Audience'] || targetAudience(cat),
      'Keywords': fillKeywords(p.Keywords, cat, main, features, stack),
      'Strengths': fillStrengths(p.Strengths, main, features, quality),
      'Quality': quality,
      'Complexity': p.Complexity || complexity(features, stack),
      'Is Live': p['Is Live'] !== undefined ? p['Is Live'] : true
    };
  }

  function enrichDatabase(db) {
    if (!Array.isArray(db)) return [];
    const seen = new Set();
    const out = [];
    for (const p of db) {
      const url = (p['Website URL'] || '').replace(/\/$/, '').toLowerCase();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push(enrichRecord(p));
    }
    return out;
  }

  window.enrichDatabase = enrichDatabase;
  window.enrichRecord = enrichRecord;

  if (typeof PROJECT_DB !== 'undefined' && Array.isArray(PROJECT_DB)) {
    window.PROJECT_DB = enrichDatabase(PROJECT_DB);
  }
})();
