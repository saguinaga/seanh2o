# ROI Calculator Development Roadmap

## Current Status (June 2026 — updated)
- Live on site with solid core functionality and Chart.js visuals
- Strong Indiana (Marion County / Indy area) focus with realistic local presets
- Key outcome metrics now appear inline with the sliders themselves so users immediately feel the cause-and-effect as they drag
- Near-term wins implemented (cash UX, exports, Indiana-first presets, disclaimers, named save/load)

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

## Notes from latest session (Indiana + inline dynamics focus)
- Shifted primary presets to Indiana markets: Marion County (default value play), Indy Turnkey 3/2, Lafayette/College Town. Coastal CA presets kept but de-emphasized under "Compare".
- Added prominent "Live impact of rent & expenses" block directly under the Income & Expenses sliders showing Monthly Cash Flow, Annual NOI, and Cash-on-Cash updating in real time.
- Added tiny "Loan amount / Monthly P&I" readouts right next to the purchase price + financing controls.
- This makes the dynamics visceral — drag rent or maintenance and the cash flow number right there in the form reacts instantly.
- Updated scenario name example to "Indy Duplex Deal".
- All changes in `seanh2o/` + pushed. Refresh local server (`python -m http.server 8787` in the folder) or wait for GitHub Pages.

Next priorities: side-by-side scenario comparison or interactive yearly projections table?

---

## Remote Collaboration Test (via webui.seanaguinaga.com)

**Silly small idea to test the "away from desk" workflow:**

**"Hoosier Luck Factor" / Silly Mode**

A lightweight, toggleable fun mode that leans hard into the Indiana theme without touching the serious math.

Core elements:
- New checkbox or prominent button near the presets: "Embrace the Hoosier Spirit" (or "Silly Mode 🌽").
- When enabled:
  - Applies a small random "Indiana Luck Factor" (e.g. -0.8% to +2.5%) that affects displayed Cash-on-Cash or Total ROI. It re-rolls every time the calculator updates.
  - Playful label swaps on 2-3 key metrics (example: "Monthly Cash Flow" → "Monthly Corn Money", "Cash-on-Cash" → "Cash-on-Corn").
  - Adds a tiny rotating silly verdict/joke line + emoji in the results area (Indiana State Fair, Indy 500, corn, basketball, etc.).
  - One new ridiculous preset button: "The Old Barn by the Speedway" or "Corn Maze Flip".
- Easy to turn off completely. The real numbers are still accurate underneath.

This is deliberately tiny (mostly cosmetic + one small random element in the calculate flow) so we can test the full remote loop quickly:
1. You go to webui.seanaguinaga.com (on your phone or away).
2. Paste a prompt (I'll give you one) and chat with your local models to brainstorm exact jokes, how the random factor should work, UI placement, etc.
3. Bring the best ideas/summary back here.
4. I implement the real code changes on the rig, test, commit, and push.

Perfect low-stakes test of using the exposed Open WebUI for creative work when you're not at the desk.
