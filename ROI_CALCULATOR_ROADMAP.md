# ROI Calculator Development Roadmap

## Current Status (June 2026 — updated)
- Live on site with solid core functionality and Chart.js visuals
- Good for demo / personal branding
- Near-term wins implemented in this session (cash UX, exports, OC/HB presets, disclaimers, named save/load)

## Near-Term Wins (Completed this session)
- [x] Fix cash purchase UX (disable loan fields when selected + strong visual treatment, 100% equity indicator, label updates)
- [x] Add Export buttons: CSV + PDF (jsPDF via CDN, includes full inputs + key results + disclaimer)
- [x] Huntington Beach / Orange County quick-load presets (HB SFR, OC Condo/Townhome, HB All-Cash Target)
- [x] Improved disclaimers + risk warnings (prominent yellow callout box with detailed risks)
- [x] Named scenario save/load (localStorage, "HB Target Deal" style — Save/Load/Delete with dropdown)

## Medium-Term Enhancements
- [ ] Side-by-side scenario comparison (Base / Optimistic / Conservative)
- [ ] Shareable link via URL parameters (already has basic share + URL sync; enhance for full scenarios)

## Future / Advanced Ideas
- [ ] Interactive projections table (clickable years that highlight on chart)
- [ ] Short-term rental (Airbnb) toggle + different assumptions
- [ ] Tooltips / educational explanations for each metric
- Google Sheets export (or direct link)
- Market data quick links (Redfin/Zillow comps for the address/zip)
- Dark mode support (site + calculator)
- Animated counters on results
- User-submitted scenarios (if we add light backend later)
- Better PDF formatting / include the wealth chart image

## Workflow Reminder
1. Brainstorm on mobile (voice or chat) or here
2. Paste summary / priorities
3. Generate full code / diffs (leveraging local rig where possible for iteration)
4. Commit to `seanh2o` repo with clear message
5. Update this roadmap + test on http://localhost or the live domain

## Notes from latest session
- All changes made directly in `seanh2o/` (index.html, calculator.js, styles.css)
- Local python http.server can be used on rig: `cd seanh2o && python -m http.server 8787`
- Multiple cloudflared / Open WebUI available on the rig for any heavy local LLM-assisted coding if desired in future turns
- jsPDF is pulled from CDN for zero-dependency PDF export

Next priorities: side-by-side comparison or interactive table?
