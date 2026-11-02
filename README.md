# Sardar IT Reference Engine v3

**Production-ready Testing Dashboard, Portfolio Explorer & Automated Matching System**

Live: https://zunaidhasan.github.io/sardarit-reference-engine/

---

## Features

### AI Generator
Match client briefs against the local portfolio and draft proposals (local mode or Gemini).

### Portfolio Explorer
Browse ~1,700+ enriched references with filters: category, technology, quality, complexity, live status.

### Gap Analysis (Phase 3)
- KPI overview (totals, categories, tech, quality mix)
- Coverage bars for categories, technologies, quality, complexity
- Feature frequency
- Under-represented areas
- Expansion recommendations

### Testing & Scoring (Phase 3)
- 8 standardized test briefs (WordPress, Shopify, SaaS, Healthcare, etc.)
- Per-brief match quality score (0–100)
- Suite average scoreboard
- Custom brief scoring
- Match explanations (why each project ranked)

## Schema (v3 enriched)

Website URL · Project Name · Category · Sub Category · Main Technology · Used Stack · Website Features · Brief Description · Use Case · Target Audience · Keywords · Strengths · Quality (A/B/C) · Complexity · Is Live

## Tech

- Pure client-side (HTML + CSS + Vanilla JS)
- Loads full legacy DB via jsDelivr + client-side enrichment
- Optional Google Gemini Flash for proposals

## Roadmap

- [x] Phase 1 — UI upgrade
- [x] Phase 2 — Database enrichment
- [x] Phase 3 — Gap Analysis + Testing & Scoring

**Previous version:** [Refactor-proposal-generator](https://github.com/zunaidhasan/Refactor-proposal-generator)
