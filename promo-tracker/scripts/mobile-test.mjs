#!/usr/bin/env node
/**
 * Mobile viewport smoke tests for Bonus Board.
 * Run: node scripts/mobile-test.mjs
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.mjs': 'text/javascript',
};

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
].filter(Boolean);

const TAB_IDS = [
  'dashboard', 'roadmap', 'inbox', 'plan', 'catalog',
  'transfers', 'baseline', 'gates', 'simulation',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667, mobile: true },
  { name: 'iPhone 14', width: 390, height: 844, mobile: true },
  { name: 'Pixel 7', width: 412, height: 915, mobile: true },
  { name: 'iPhone landscape', width: 844, height: 390, mobile: true },
];

function chromePath() {
  const hit = CHROME_PATHS.find((p) => existsSync(p));
  if (!hit) throw new Error('Chrome not found — set CHROME_PATH');
  return hit;
}

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const path = req.url?.split('?')[0] || '/';
        const filePath = join(ROOT, path === '/' ? 'index.html' : path.replace(/^\//, ''));
        const data = await readFile(filePath);
        const type = MIME[extname(filePath)] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type });
        res.end(data);
      } catch {
        res.writeHead(404).end('Not found');
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

async function assertNoOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 2) throw new Error(`${label}: horizontal overflow ${overflow}px`);
}

async function switchAllTabs(page) {
  for (const id of TAB_IDS) {
    await page.click(`.tab[data-tab="${id}"]`);
    await page.waitForFunction(
      (tabId) => {
        const panel = document.getElementById(`panel-${tabId}`);
        return panel && !panel.hidden;
      },
      { timeout: 5000 },
      id,
    );
  }
}

async function runScenario(page, viewport, base) {
  const results = [];
  const log = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'OK' : 'FAIL'} [${viewport.name}] ${name}${detail ? ` — ${detail}` : ''}`);
  };

  await page.setViewport({ width: viewport.width, height: viewport.height, isMobile: viewport.mobile, hasTouch: true });
  await page.goto(`${base}/index.html`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => { localStorage.clear(); location.reload(); });
  await page.waitForSelector('#mainTabs', { timeout: 15000 });
  await page.waitForFunction(() => typeof window.Chart !== 'undefined', { timeout: 15000 });

  try {
    await assertNoOverflow(page, 'initial load');
    log('no horizontal overflow on load', true);
  } catch (e) {
    log('no horizontal overflow on load', false, e.message);
  }

  try {
    await switchAllTabs(page);
    log('all tabs switch', true);
  } catch (e) {
    log('all tabs switch', false, e.message);
  }

  try {
    await page.click('.tab[data-tab="dashboard"]');
    await page.click('#loadConservative');
    await page.waitForSelector('#offerList .offer-card', { timeout: 8000 });
    const count = await page.$$eval('#offerList .offer-card', (els) => els.length);
    if (count < 1) throw new Error('no offers after load plan');
    log('load conservative plan', true, `${count} offers`);
  } catch (e) {
    log('load conservative plan', false, e.message);
  }

  try {
    await page.click('.tab[data-tab="roadmap"]');
    await page.waitForSelector('#roadmap .roadmap-row, #roadmap .empty', { timeout: 5000 });
    await page.click('#roadmapBaselineScore', { clickCount: 3 });
    await page.type('#roadmapBaselineScore', '820');
    await page.$eval('#roadmapBaselineScore', (el) => el.blur());
    await sleep(400);
    const score = await page.$eval('#baselineScore', (el) => el.value);
    if (score !== '820') throw new Error(`baseline sync failed: ${score}`);
    log('roadmap baseline score sync', true);
  } catch (e) {
    log('roadmap baseline score sync', false, e.message);
  }

  try {
    await page.click('.tab[data-tab="baseline"]');
    await page.click('#age', { clickCount: 3 });
    await page.type('#age', '36');
    await page.click('#cardsOpen', { clickCount: 3 });
    await page.type('#cardsOpen', '5');
    await page.$eval('#age', (el) => el.blur());
    await sleep(300);
    log('credit profile edit', true);
  } catch (e) {
    log('credit profile edit', false, e.message);
  }

  try {
    await page.click('.tab[data-tab="catalog"]');
    await page.waitForSelector('#catalogGrid .catalog-card', { timeout: 8000 });
    const cards = await page.$$eval('#catalogGrid .catalog-card', (els) => els.length);
    if (cards < 3) throw new Error(`only ${cards} catalog cards`);
    log('catalog renders', true, `${cards} cards`);
  } catch (e) {
    log('catalog renders', false, e.message);
  }

  try {
    await page.click('.tab[data-tab="inbox"]');
    await page.waitForSelector('#dealInbox', { timeout: 8000 });
    await page.type('#inboxSearch', 'Chase');
    await sleep(300);
    log('inbox search', true);
  } catch (e) {
    log('inbox search', false, e.message);
  }

  try {
    await page.click('.tab[data-tab="transfers"]');
    await page.waitForSelector('#walletOwnedGrid', { timeout: 5000 });
    log('transfers / wallet panel', true);
  } catch (e) {
    log('transfers / wallet panel', false, e.message);
  }

  try {
    await page.click('.tab[data-tab="gates"]');
    await page.waitForSelector('#issuerGrid .issuer-card', { timeout: 5000 });
    log('issuer gates grid', true);
  } catch (e) {
    log('issuer gates grid', false, e.message);
  }

  try {
    await page.click('.tab[data-tab="simulation"]');
    await page.waitForSelector('#scoreChart', { timeout: 5000 });
    const chartOk = await page.evaluate(() => {
      const c = document.getElementById('scoreChart');
      return c && c.offsetWidth > 0 && c.offsetHeight > 0;
    });
    if (!chartOk) throw new Error('score chart has zero size');
    log('score sim chart', true);
  } catch (e) {
    log('score sim chart', false, e.message);
  }

  try {
    await page.click('.tab[data-tab="dashboard"]');
    await page.evaluate(() => document.querySelector('#addOffer')?.scrollIntoView({ block: 'center' }));
    await page.tap('#addOffer');
    await page.waitForSelector('#offerModal:not([hidden]) .modal__sheet', { timeout: 5000 });
    await page.waitForSelector('#offerCancel', { visible: true, timeout: 3000 });
    await page.tap('#offerCancel');
    await page.waitForSelector('#offerModal[hidden]', { timeout: 3000 });
    log('offer modal open/close', true);
  } catch (e) {
    log('offer modal open/close', false, e.message);
  }

  try {
    await page.click('.tab[data-tab="dashboard"]');
    await page.evaluate(() => document.querySelector('#startWizard')?.scrollIntoView({ block: 'center' }));
    await page.tap('#startWizard');
    await page.waitForSelector('#wizardModal:not([hidden]) .wizard-sheet', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 300)); // let layout + animation settle
    await assertNoOverflow(page, 'wizard open');
    // ensure we can see the next button / footer (lenient for emulation + safe areas)
    const nextVisible = await page.evaluate(() => {
      const n = document.getElementById('wizardNext');
      if (!n) return false;
      const r = n.getBoundingClientRect();
      return r.height > 0 && r.bottom <= window.innerHeight + 50;
    });
    if (!nextVisible) throw new Error('wizard next button not fully visible');
    await page.tap('#wizardClose');
    await page.waitForSelector('#wizardModal[hidden]', { timeout: 3000 });
    log('wizard open/close no cutoff', true);
  } catch (e) {
    log('wizard open/close no cutoff', false, e.message);
  }

  try {
    const tips = await page.$$('.help-tip');
    if (tips.length) {
      await tips[0].tap();
      const open = await page.evaluate((el) => el.classList.contains('help-tip--open'), tips[0]);
      if (!open) throw new Error('help tip did not open on tap');
      await page.click('.panel h2');
      const closed = await page.evaluate((el) => !el.classList.contains('help-tip--open'), tips[0]);
      if (!closed) throw new Error('help tip did not close');
      log('help tip tap toggle', true);
    } else {
      log('help tip tap toggle', true, 'skipped — no tips on screen');
    }
  } catch (e) {
    log('help tip tap toggle', false, e.message);
  }

  try {
    const scrollable = await page.evaluate(() => {
      const tabs = document.getElementById('mainTabs');
      return tabs ? tabs.scrollWidth > tabs.clientWidth + 4 : false;
    });
    if (viewport.width <= 430 && !scrollable) {
      throw new Error('expected scrollable tab bar on narrow viewport');
    }
    log('tab bar scrollable', true, scrollable ? 'yes' : 'n/a wide');
  } catch (e) {
    log('tab bar scrollable', false, e.message);
  }

  try {
    await page.click('.tab[data-tab="dashboard"]');
    await page.evaluate(() => document.querySelector('#loadHousehold')?.scrollIntoView({ block: 'center' }));
    page.once('dialog', (d) => d.accept());
    await page.click('#loadHousehold');
    await page.waitForSelector('#offerList .offer-card', { timeout: 8000 });
    const hhCount = await page.$$eval('#offerList .offer-card', (els) => els.length);
    if (hhCount < 5) throw new Error(`household plan only loaded ${hhCount} offers`);
    log('load household stretch plan', true, `${hhCount} offers`);
  } catch (e) {
    log('load household stretch plan', false, e.message);
  }

  try {
    await page.select('#themeSelect', 'paper');
    await sleep(200);
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    if (theme !== 'paper') throw new Error(`theme is ${theme}`);
    await page.select('#themeSelect', 'cozy');
    log('theme picker', true);
  } catch (e) {
    log('theme picker', false, e.message);
  }

  try {
    await page.click('.tab[data-tab="dashboard"]');
    await page.waitForSelector('#dashboardTimeline [data-tab-jump="roadmap"]', { timeout: 5000 });
    await page.evaluate(() => document.querySelector('#dashboardTimeline [data-tab-jump="roadmap"]')?.scrollIntoView({ block: 'center' }));
    await page.click('#dashboardTimeline [data-tab-jump="roadmap"]');
    await page.waitForFunction(() => {
      const panel = document.getElementById('panel-roadmap');
      return panel && !panel.hidden;
    }, { timeout: 3000 });
    log('dashboard roadmap jump link', true);
  } catch (e) {
    log('dashboard roadmap jump link', false, e.message);
  }

  try {
    await assertNoOverflow(page, 'after interactions');
    log('no horizontal overflow after use', true);
  } catch (e) {
    log('no horizontal overflow after use', false, e.message);
  }

  const failed = results.filter((r) => !r.ok);
  return { viewport: viewport.name, failed: failed.length, total: results.length, results };
}

async function main() {
  const { server, base } = await startServer();
  console.log(`Serving ${ROOT} at ${base}`);
  console.log(`Chrome: ${chromePath()}`);

  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null,
  });

  const all = [];
  try {
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage();
      await page.emulate({
        viewport: { width: viewport.width, height: viewport.height, isMobile: viewport.mobile, hasTouch: true, deviceScaleFactor: 2 },
        userAgent: viewport.mobile
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      const summary = await runScenario(page, viewport, base);
      all.push(summary);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  const totalFail = all.reduce((s, x) => s + x.failed, 0);
  console.log('\n── Summary ──');
  all.forEach((s) => {
    console.log(`${s.viewport}: ${s.total - s.failed}/${s.total} passed`);
  });

  if (totalFail > 0) {
    console.error(`\n${totalFail} mobile test(s) failed`);
    process.exit(1);
  }
  console.log('\nAll mobile scenarios passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});