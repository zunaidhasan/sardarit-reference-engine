# Sardar IT Reference Engine v3

**Production-ready Testing Dashboard, Portfolio Explorer & Automated Matching System**

Live: https://zunaidhasan.github.io/sardarit-reference-engine/

---

## Phase 2 complete — Database enrichment

The engine loads the full portfolio (~1,800 unique projects) and **enriches every record client-side** into the v3 schema:

| Field | Source |
|-------|--------|
| Website URL | Original |
| Project Name | Generated from domain |
| Category | Original (cleaned) |
| Sub Category | Inferred from category + features |
| Main Technology | Normalized (Other reduced sharply) |
| Used Stack | Original |
| Website Features | Original |
| Brief Description | Original |
| Use Case | Original |
| Target Audience | Mapped from category |
| Keywords | Filled when empty |
| Strengths | Filled when empty |
| Quality | Normalized to **A / B / C** |
| Complexity | Inferred (Low / Medium / High) |
| Is Live | Default `true` |

Duplicates by URL are removed during enrichment.

## How it loads

1. Full legacy `database.js` from the previous project
2. `enrich.js` — transforms to v3 schema
3. `app.js` — UI + matching

## Tech

- Pure client-side (HTML + CSS + Vanilla JS)
- Google Gemini Flash for proposal generation (optional)
- No backend

## Roadmap

- [x] Phase 1 — UI upgrade
- [x] Phase 2 — Database enrichment (schema + normalization)
- [ ] Phase 3 — Gap Analysis + Testing & Scoring Dashboard

**Previous version:** [Refactor-proposal-generator](https://github.com/zunaidhasan/Refactor-proposal-generator)
