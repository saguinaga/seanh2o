# seanh2o

Personal site for Sean Aguinaga (GitHub Pages). Contains the Buy & Hold and Fix & Flip investor calculators plus supporting static assets.

## Local Development (solid dev env)

**See [LOCAL-DEV.md](./LOCAL-DEV.md) for full instructions.**

**Critical**: The `seanh2o/` folder *is* the site root that gets published to GitHub Pages. Edit the real files directly (`index.html`, `calculator.js`, `styles.css`, `flip-calculator.js`, etc.).

**Never** open `index.html` by double-clicking it in Explorer. Always use the local server (see LOCAL-DEV.md). Direct `file://` opens are the main source of "the calculator looks broken locally" confusion.

### Quick start (recommended)

```powershell
# From the repo root
cd seanh2o

# Best experience: live reload on HTML, CSS, and JS changes
npm run dev
```

- Opens http://localhost:3000 automatically.
- Edits to `calculator.js`, `styles.css`, or `index.html` will reload the browser (or inject CSS).
- Use this when iterating on the calculators.

### Other commands

```powershell
# Simple static server (no live reload, good fallback)
npm run serve

# Or the preview alias
npm run preview

# Quick syntax check on the JS modules (no browser needed)
npm run check
```

### Tips for working on the calculators

- The calculators are pure client-side. No build step required.
- Cache-busting in production still uses the `?v=NN` query strings in the `<script>` / `<link>` tags inside `index.html`. We bump those manually only when doing a real deploy.
- For now the site is intentionally minimal/static. We can add a proper bundler or more tooling later if the calculators grow.
- Hard-refresh (Ctrl+Shift+R) in your browser if something feels stale.
- All the historical `_push*`, `_mcp*`, `_chunk*`, `_test/`, etc. files are ignored by git (see `.gitignore`) so they won't pollute the repo or future deploys.

### When you're ready to ship changes

We keep the "don't push yet" discipline. When the calculator (or other section) is ready:
1. Bump the version numbers in the script/link tags in `index.html` (e.g. `calculator.js?v=25`).
2. We do a controlled push of only the changed files via the proper GitHub tools.
3. You hard-refresh the live site (`https://seanaguinaga.com`).

## Project layout (key files)

- `index.html` — main page + both calculators
- `calculator.js` — Buy & Hold (module)
- `styles.css` — calculator + site polish / responsive rules
- `flip-calculator.js` — Fix & Flip
- `CNAME` — custom domain for Pages
- `files/` + `uploads/` — theme assets and images
- `wealth-projection-chart-removed.js` — backup of the old chart code (for reference)

## Previous context

This was previously a very raw "vibe coded" playground. The Buy & Hold calculator is currently in a presentable, working state. Future work (new chart, more features, etc.) should happen through this local dev setup first.

---

Playground / experimental area for Sean Aguinaga.
