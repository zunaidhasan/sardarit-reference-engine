# Sardar IT Reference Engine v3

**Production-ready Testing Dashboard, Portfolio Explorer & Automated Matching System**

Live: https://zunaidhasan.github.io/sardarit-reference-engine/

---

## Features

### AI Generator
Match client briefs against the local portfolio and draft proposals (local mode or Gemini).

### Portfolio Explorer
Browse ~1,700+ enriched references with filters: category, technology, quality, complexity, live status.

### Gap Analysis
- KPI overview + coverage bars
- Under-represented areas + expansion recommendations

### AI-Driven Gap Analysis (Phase 4)
- **Analyze with AI** — Gemini turns portfolio stats into a prioritized growth plan
- Priority gaps with HIGH/MED/LOW tags
- 30–60 day build list with stack + budget guidance
- Matching risk + quick data wins
- Freeform **Ask about portfolio gaps**

### Testing & Scoring
- 8 standardized test briefs + suite average scoreboard
- Custom brief scoring + match explanations

## Schema (v3 enriched)

Website URL · Project Name · Category · Sub Category · Main Technology · Used Stack · Website Features · Brief Description · Use Case · Target Audience · Keywords · Strengths · Quality (A/B/C) · Complexity · Is Live

## Setup

1. Open the live site (or serve this repo)
2. Settings → paste Google AI Studio (Gemini) API key
3. Gap Analysis → **Analyze with AI**

## Tech

- Pure client-side (HTML + CSS + Vanilla JS)
- jsDelivr + client-side enrichment for the full DB
- Optional Google Gemini Flash

## Roadmap

- [x] Phase 1 — UI upgrade
- [x] Phase 2 — Database enrichment
- [x] Phase 3 — Gap Analysis + Testing & Scoring
- [x] Phase 4 — AI-Driven Gap Analysis

**Previous version:** [Refactor-proposal-generator](https://github.com/zunaidhasan/Refactor-proposal-generator)
