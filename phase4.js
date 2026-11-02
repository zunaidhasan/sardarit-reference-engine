/* Phase 4: AI-Driven Gap Analysis
 * Builds a portfolio snapshot and asks Gemini for strategic growth insights.
 */

function buildPortfolioSnapshot() {
  const projects = state.projects || [];
  const total = projects.length || 1;
  const byCat = {}, byTech = {}, byQuality = {}, byComplexity = {}, features = {};

  projects.forEach(p => {
    const c = getField(p, 'Category') || 'Unknown';
    const t = getField(p, 'Main Technology') || 'Unknown';
    const q = normalizeQuality(getField(p, 'Quality')) || 'Unknown';
    const cx = getField(p, 'Complexity') || 'Unknown';
    byCat[c] = (byCat[c] || 0) + 1;
    byTech[t] = (byTech[t] || 0) + 1;
    byQuality[q] = (byQuality[q] || 0) + 1;
    byComplexity[cx] = (byComplexity[cx] || 0) + 1;
    (getField(p, 'Website Features') || '').split(/[,/|]/).forEach(f => {
      const x = f.trim();
      if (x.length > 2) features[x] = (features[x] || 0) + 1;
    });
  });

  const top = (obj, n = 10) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n)
      .map(([k, v]) => `${k}: ${v} (${Math.round(v / total * 100)}%)`);

  return {
    total,
    categories: top(byCat, 12),
    technologies: top(byTech, 12),
    quality: top(byQuality, 5),
    complexity: top(byComplexity, 5),
    topFeatures: top(features, 15),
    otherTechCount: byTech['Other'] || 0,
    qualityAPct: Math.round(((byQuality['A'] || 0) / total) * 100)
  };
}

function formatAiHtml(text) {
  let html = escapeHtml(text);
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[HIGH\]/gi, '<span class="priority-tag high">HIGH</span>');
  html = html.replace(/\[MED\]/gi, '<span class="priority-tag med">MED</span>');
  html = html.replace(/\[MEDIUM\]/gi, '<span class="priority-tag med">MED</span>');
  html = html.replace(/\[LOW\]/gi, '<span class="priority-tag low">LOW</span>');
  const lines = html.split('\n');
  let out = [], inList = false;
  lines.forEach(line => {
    const m = line.match(/^\s*[-•*]\s+(.+)/);
    if (m) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push('<li>' + m[1] + '</li>');
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      if (line.trim()) out.push(line.trim().startsWith('<h3') ? line : '<p>' + line + '</p>');
    }
  });
  if (inList) out.push('</ul>');
  return out.join('\n');
}

async function callGemini(prompt, maxTokens = 1200) {
  const key = localStorage.getItem('gemini_key');
  if (!key) throw new Error('NO_KEY');
  const model = localStorage.getItem('default_model') || 'gemini-2.0-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens }
      })
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Gemini API error');
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

function strategicGapPrompt(snapshot) {
  return `You are a senior freelance strategy advisor for a web agency (Sardar IT) selling on Fiverr and Upwork.

Portfolio snapshot (${snapshot.total} live reference projects):
CATEGORIES:
${snapshot.categories.join('\n')}

TECHNOLOGIES:
${snapshot.technologies.join('\n')}

QUALITY MIX: ${snapshot.quality.join(', ')} (Quality A = ${snapshot.qualityAPct}%)
COMPLEXITY: ${snapshot.complexity.join(', ')}
TOP FEATURES: ${snapshot.topFeatures.slice(0, 10).join(', ')}
"Other" technology count: ${snapshot.otherTechCount}

Task: Produce an actionable AI-driven gap analysis for portfolio growth.

Structure your answer exactly like this:

## Priority Gaps
List 4–6 gaps with [HIGH], [MED], or [LOW] tags. Each item: what is missing + why it matters for freelance demand.

## Build Next (30–60 days)
3 concrete project types or demo sites to add, with suggested stack and ideal client budget range.

## Matching Risk
Where the current reference engine may fail (thin categories, vague tech labels, quality skew).

## Quick Wins
2–3 data-cleanup or tagging actions that improve matching without building new sites.

Rules:
- Be specific to this data, not generic advice
- Freelance marketplace context (Fiverr/Upwork web development)
- Keep under 350 words
- Use markdown headings and bullet lists only`;
}

function askGapPrompt(snapshot, question) {
  return `You are advising Sardar IT, a freelance web agency with this portfolio:

Total projects: ${snapshot.total}
Top categories: ${snapshot.categories.slice(0, 6).join('; ')}
Top technologies: ${snapshot.technologies.slice(0, 6).join('; ')}
Quality A rate: ${snapshot.qualityAPct}%

User question: ${question}

Answer in under 180 words. Be concrete and actionable. Use short bullets if helpful.`;
}

async function runAiGapAnalysis() {
  const out = document.getElementById('ai-gap-output');
  const btn = document.getElementById('btn-ai-gaps');
  if (!out) return;
  if (!state.projects || !state.projects.length) { toast('Load the database first'); return; }

  setButtonLoading(btn, true);
  out.innerHTML = `<div class="ai-loading"><span class="btn-spinner"></span> Analyzing portfolio with Gemini…</div>`;

  try {
    const snapshot = buildPortfolioSnapshot();
    const text = await callGemini(strategicGapPrompt(snapshot));
    out.innerHTML = formatAiHtml(text) +
      `<div class="ai-meta">Generated from ${snapshot.total.toLocaleString()} projects · model ${localStorage.getItem('default_model') || 'gemini-2.0-flash'}</div>`;
    toast('AI gap analysis ready');
  } catch (err) {
    if (err.message === 'NO_KEY') {
      out.innerHTML = `<div class="empty-state" style="padding:20px"><p>Add your <strong>Gemini API key</strong> in Settings to unlock AI-driven gap analysis.</p></div>`;
      toast('Gemini API key required');
    } else {
      out.innerHTML = `<div class="empty-state" style="padding:20px"><p>AI analysis failed: ${escapeHtml(err.message)}</p></div>`;
      toast('AI analysis failed');
    }
  } finally {
    setButtonLoading(btn, false);
  }
}

async function askAiAboutGaps() {
  const input = document.getElementById('ai-gap-question');
  const out = document.getElementById('ai-gap-output');
  const btn = document.getElementById('btn-ai-ask');
  const question = (input?.value || '').trim();
  if (!question) return toast('Type a question first');
  if (!state.projects?.length) return toast('Load the database first');

  setButtonLoading(btn, true);
  out.innerHTML = `<div class="ai-loading"><span class="btn-spinner"></span> Thinking…</div>`;

  try {
    const snapshot = buildPortfolioSnapshot();
    const text = await callGemini(askGapPrompt(snapshot, question), 700);
    out.innerHTML = `<h3>Answer</h3>` + formatAiHtml(text) +
      `<div class="ai-meta">Q: ${escapeHtml(question)}</div>`;
  } catch (err) {
    if (err.message === 'NO_KEY') {
      out.innerHTML = `<div class="empty-state" style="padding:20px"><p>Add your Gemini API key in Settings first.</p></div>`;
      toast('Gemini API key required');
    } else {
      out.innerHTML = `<div class="empty-state" style="padding:20px"><p>${escapeHtml(err.message)}</p></div>`;
      toast('Ask failed');
    }
  } finally {
    setButtonLoading(btn, false);
  }
}

(function () {
  function bind() {
    const btn = document.getElementById('btn-ai-gaps');
    if (btn && !btn.dataset.phase4) {
      btn.dataset.phase4 = '1';
      btn.addEventListener('click', runAiGapAnalysis);
    }
    const ask = document.getElementById('btn-ai-ask');
    if (ask && !ask.dataset.phase4) {
      ask.dataset.phase4 = '1';
      ask.addEventListener('click', askAiAboutGaps);
    }
    const q = document.getElementById('ai-gap-question');
    if (q && !q.dataset.phase4) {
      q.dataset.phase4 = '1';
      q.addEventListener('keydown', e => { if (e.key === 'Enter') askAiAboutGaps(); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
  setTimeout(bind, 500);
  console.log('[Phase4] AI-Driven Gap Analysis ready');
})();
