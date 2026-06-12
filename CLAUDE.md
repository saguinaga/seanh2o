# CLAUDE.md — Sean Aguinaga Site (seanh2o)

**Project**: Static GitHub Pages site (saguinaga/seanh2o) for Sean Aguinaga (he/him), Product in Real Estate Tech at Auction.com. Primary value is two investor calculators.

## Current Goals (Inferred + Explicit)
- Maintain a clean, professional personal site that showcases real estate tech product work + practical investor tools.
- Keep the **Buy & Hold Calculator** as the flagship feature: live-updating, trustworthy math (Marion County, IN defaults first), responsive across mobile/tablet/desktop, shareable, savable scenarios, exports (CSV/PDF), presets, sensitivity, benchmarks.
- The Fix & Flip analyzer is secondary but should stay functional.
- **No new features** unless explicitly requested. Focus on polish, reliability, and "presentable" state.
- Lowest-token / minimal viable changes preferred. Avoid over-engineering.
- The Wealth Projection chart (Chart.js) was extremely problematic (exploded to 30k+ px canvas heights due to responsive + container sizing bugs). It was intentionally removed with a comment in the HTML. The original code is preserved in `wealth-projection-chart-removed.js` for "start from scratch later" if desired. Do **not** reintroduce or touch it.

## Development Rules (Critical)
- **Always work on the local version first.** Never edit while looking at raw `file:///` index.html — this is the main source of confusion and broken calculator behavior (ES modules, paths, and live updates behave differently).
- Use the local dev server:
  - Preferred: `npm run dev` (browser-sync with live reload, auto-opens to `#buy-hold-calculator`)
  - Easy launcher: double-click or run `start-local.ps1`
  - Fallbacks: `npm run serve` or VS Code Live Server extension.
- See `LOCAL-DEV.md` for full local workflow.
- **Do not push to production** (the live site at seanaguinaga.com) without explicit instruction. User has said "leave my site alone for now on prod" and "don't push any more changes right now."
- When a change is approved for prod:
  1. Bump the `?v=NN` cache-buster on the relevant `<script>` / `<link>` tags in `index.html`.
  2. Use controlled, full-content pushes via the proper tools (never placeholder strings).
  3. User will hard-refresh the live site.

## Key Files (Site Root = seanh2o/)
- `index.html` — Main page + both calculators (hero, about, mission, vibe coding section, Buy & Hold, Fix & Flip, contact).
- `calculator.js` — Core Buy & Hold logic (IIFE, DEFAULTS/PRESETS, fullCalc, bindings, live metrics, scenarios via localStorage, share links, exports, sensitivity, benchmarks). Currently the priority.
- `styles.css` — All calculator styling + responsive rules + some site polish.
- `flip-calculator.js` — Fix & Flip tool.
- `CNAME` — Points to seanaguinaga.com.
- `wealth-projection-chart-removed.js` — Backup of the removed chart code (computeYearlySeries + updateWealthChart) + restore instructions. Do not integrate.
- `files/` + `uploads/` — Theme assets and images (do not modify unless asked).
- Artifacts (`_*`, `_test/`, etc.) — Historical debugging junk. They are gitignored.

## Repo Hygiene
- `.gitignore` aggressively ignores all `_push*`, `_mcp*`, `_chunk*`, `_test/`, node_modules, OS junk, etc.
- Keep the repo clean. Do not reintroduce temp files.

## User Preferences
- Pronouns: he/him.
- Communication: Direct, low fluff. "Lowest tokens" when possible.
- Frustration history: Previous work on the chart caused repeated breakage, bad deploys (site showing literal placeholder text), and high token waste. Prioritize safety, minimal diffs, and proper local testing.
- The Buy & Hold calculator is currently considered "presentable." Future work should be incremental and safe.

## When Editing the Calculator
- Changes must keep it fully working (sliders ↔ displays ↔ all 8+ metrics, cash toggle, presets, saved scenarios, share, exports, verdict, breakdown table, sensitivity, benchmarks).
- Responsive rules live in styles.css (`@media max-900`, `max-500`, pointer:coarse, etc.). Metrics grid becomes static below 900px.
- Version bumps and cache strategy are manual via the `?v=` attributes.
- Test via the local dev server only.

## Responsive Breakthrough (Avoid Repeating This Again)
The 2026 viewport work (on the phase0-professional-calculator-upgrade branch) made the Buy & Hold calculator (and supporting elements) look *amazing* and professional across every size after painful full-screen/tablet/mobile breakage:

- Wide/full-screen + ultra-wide: `grid-template-columns: minmax(0, 680px) 480px` (capped left track) + tighter `max-width: 1200px` in 1600px+ media on the buy-hold .calc-grid. This eliminates giant empty space between left (input-panels) and right (results-panel) widgets — the separation is now *just* the small gap (20-28px). Never use bare `auto`/`1fr` for the content side on wide containers.
- Scope desktop-only constraints (e.g. `.input-panels { max-width: 680px }`, specific gaps/paddings) *inside* `@media (min-width: 901px)` (and narrower like 1100-1399). Do **not** let them live at base level or they leak into tablet/mobile and cause squished/capped/stacked garbage.
- Tablet + mobile (max-900px, 701-900, max-768, max-500, max-380, pointer:coarse): Explicitly force `#buy-hold-calculator .calc-grid { grid-template-columns: 1fr; }`, panels `max-width: 100%`, `.metrics-grid { position: static; }` (the sticky positioning from desktop causes overlap/scroll/jank when stacked), plus tuned paddings, fonts, gaps, and touch targets (e.g. range thumbs 28px on coarse). The 2-col metrics become 2-col or full-width first card as appropriate.
- Added scoped Tailwind via CDN (with `corePlugins: { preflight: false }` + custom `xs`/`tablet` screens) for the calculator section only. This makes new UI (toolbar, modals, comparisons) responsive easily without fighting the existing custom `.calc-*` / metrics CSS.
- Test *everything* locally: run dev server, browser resize + DevTools device toolbar emulation across *all* breakpoints (iPhone SE 375px, 380px, 500px, tablet 701-900 portrait/landscape, mid 901-1100, 1100-1399, 1600+, 1920+ full screen). Previous "polish" attempts failed on the side-by-side widget layout.

**Add to this section** any time new UI or breakpoints are touched. This is now the memory of the breakthrough that finally made views look professional everywhere.

## Future Notes
- Chart rebuild: Only if user explicitly says to restart from the backup file.
- Keep things simple and maintainable. The site is intentionally "vibe-coded" but the underwriting math should feel real and defensible.
- Responsive is now a first-class parallel priority in all phases — never ship without the above testing and scoping.

## Future Notes
- Chart rebuild: Only if user explicitly says to restart from the backup file.
- Keep things simple and maintainable. The site is intentionally "vibe-coded" but the underwriting math should feel real and defensible.

This file should be updated whenever major goals, constraints, or workflow change.