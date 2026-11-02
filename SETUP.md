# Setup Instructions

## 1. Add the full database (1,846 projects)

The current `database.js` is a small starter. To use the full dataset:

```bash
# From your machine
git clone https://github.com/zunaidhasan/sardarit-reference-engine.git
cd sardarit-reference-engine

# Copy the full database from the previous project
curl -o database.js https://raw.githubusercontent.com/zunaidhasan/Refactor-proposal-generator/main/database.js

git add database.js
git commit -m "Add full 1846-project database"
git push
```

## 2. Enable GitHub Pages

1. Go to https://github.com/zunaidhasan/sardarit-reference-engine/settings/pages
2. Source → Deploy from a branch
3. Branch: `main` / folder: `/ (root)`
4. Save

Live URL will be: **https://zunaidhasan.github.io/sardarit-reference-engine/**

## 3. Local testing

Just open `index.html` in a browser (or use Live Server). The app runs fully client-side.

## Phase roadmap

- **Phase 1 (done)**: Modern UI, schema-forward cards & filters
- **Phase 2**: Polish database (Project Name, Sub Category, Target Audience, Complexity, Is Live, A/B/C quality)
- **Phase 3**: Gap Analysis + Testing & Scoring Dashboard
