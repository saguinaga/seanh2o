# Local Development (The "Local Version")

**STOP — Do not double-click or open `index.html` directly in your browser.**

Opening the raw `.html` file (via `file:///` protocol) is the #1 source of confusion with this project. Many features (especially the ES module `calculator.js`, relative asset paths, and live behavior) behave differently or break compared to the real production site.

Always use a local web server. This gives you a true "local version" that closely matches production (https://seanaguinaga.com).

## Recommended: Use the built-in dev server (with live reload)

**Fastest ways to launch the correct local version:**

### Option 1: PowerShell script (easiest on Windows)
Just double-click `start-local.ps1` in File Explorer, or run from a terminal in the `seanh2o` folder:

```powershell
.\start-local.ps1
```

### Option 2: npm (works everywhere)
```powershell
cd seanh2o
npm run dev
```

- This starts **browser-sync** on http://localhost:3000
- It automatically opens your browser **straight to the #buy-hold-calculator section**.
- **Live reload**: Edit `calculator.js`, `styles.css`, `index.html`, or `flip-calculator.js` → browser updates almost instantly.
- Perfect for working on the Buy & Hold calculator without touching prod.

Other useful commands (run after `cd seanh2o`):

```powershell
npm run preview     # Same server, slightly different flags
npm run serve       # Lightweight alternative using `serve` (no live reload)
npm run check       # Quick syntax check on the JS files
npm start           # Alias for `npm run dev`
```

Other useful commands:

```powershell
npm run preview     # Same server, slightly different flags
npm run serve       # Lightweight alternative using `serve` (no live reload)
npm run check       # Quick syntax check on the JS files
```

After starting the server, go to:

- http://localhost:3000/                     → full site
- http://localhost:3000/#buy-hold-calculator → jump straight to the calculator

## Why this matters

- Production (and GitHub Pages) serves everything over **http/https**.
- Direct file open uses **file://** protocol → breaks or behaves weirdly for:
  - `<script type="module">`
  - Some relative paths + query strings like `?v=24`
  - Future features (fetch, etc.)
- The `?v=NN` cache-busters you see in the HTML are only for production deploys. Locally the server handles freshness.

## Alternative quick options (if npm isn't convenient)

1. **VS Code "Live Server" extension** (very popular for this exact use case):
   - Install "Live Server" by Ritwick Dey
   - Right-click `index.html` → "Open with Live Server"
   - It will serve on localhost with reload.

2. **Any static server**:
   ```powershell
   npx serve . -p 3000
   # or
   npx http-server . -p 3000 -c-1
   ```

3. **Python** (if you have it):
   ```powershell
   python -m http.server 3000
   ```

## Workflow for future work

1. Always start with `npm run dev` (or Live Server).
2. Make changes to the real files in this folder (`calculator.js`, `styles.css`, etc.).
3. Test the **local version** at localhost until it feels solid.
4. Only when ready: we will bump the version numbers in the `<script>`/`<link>` tags and do a controlled update to prod (you said leave prod alone for now).

## Common gotchas

- "The calculator looks different / broken locally" → You probably opened the file directly instead of via the server. Close that tab and use localhost.
- Stale assets → Hard refresh (Ctrl+Shift+R) or just rely on the live-reload server.
- The `v=24` / `v=21` numbers in the HTML are intentional for prod cache busting. Don't worry about them while developing locally.
- External CDNs (Chart.js, jsPDF) are loaded from the internet — they work the same locally and in prod.

## Current state reminder

- The Buy & Hold calculator is considered "presentable".
- No changes are being pushed to production.
- All future iteration happens here, viewed through this local server setup.

If the dev server feels off, or you want a different tool (e.g. just plain `serve`, Vite for future, a custom watch script, etc.), tell me exactly what would feel solid for you.

Happy local hacking! 🚀
