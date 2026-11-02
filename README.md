# Sardar IT Reference Engine v3

**Production-ready Testing Dashboard, Portfolio Explorer & Automated Matching System**

Live (after deploy): `https://zunaidhasan.github.io/sardarit-reference-engine/`

---

## Purpose

- Validate matching accuracy of portfolio references against client briefs
- Identify portfolio gaps (missing categories, stacks, features, quality tiers)
- Generate high-quality proposals using local project intelligence + Gemini
- Browse and filter a large curated database of real-world projects

## Target Schema (Phase 2 ready)

| Field | Status |
|-------|--------|
| Website URL | ✅ Existing |
| Project Name | 🔄 New |
| Category | ✅ Existing |
| Sub Category | 🔄 New |
| Main Technology | ✅ Existing |
| Used Stack | ✅ Existing |
| Website Features | ✅ Existing |
| Brief Description | ✅ Existing |
| Use Case | ✅ Existing |
| Target Audience | 🔄 New |
| Keywords | ✅ Existing |
| Strengths | ✅ Existing |
| Quality | ✅ Existing (will normalize to A/B/C) |
| Complexity | 🔄 New |
| Is Live | 🔄 New |

## Tech Stack

- Pure client-side (HTML + CSS + Vanilla JS)
- Local JSON database
- Google Gemini Flash API (optional, for generation)
- No backend required

## Development Roadmap

### Phase 1 — UI Upgrade (Current)
- Modern full-tab dashboard layout
- Improved Portfolio Explorer with advanced filters
- Schema-forward project cards
- Better dark/light theme
- Cleaner navigation & hierarchy

### Phase 2 — Database Polish
- Add missing fields (Project Name, Sub Category, Target Audience, Complexity, Is Live)
- Normalize Quality → A / B / C
- Fill empty Strengths & Keywords
- Clean “Other” Main Technology values

### Phase 3 — Testing & Scoring Dashboard
- Run test briefs and measure match quality
- Automated gap detection
- Scoring transparency

---

**Previous version:** [Refactor-proposal-generator](https://github.com/zunaidhasan/Refactor-proposal-generator)
