#!/usr/bin/env node
/** Smoke-test production module URLs for Bonus Board */
const BASE = process.env.DEPLOY_URL || 'https://seanaguinaga.com/promo-tracker';
const REQUIRED = [
  'index.html',
  'app.js',
  'rules.js',
  'issuers.js',
  'plain-labels.js',
  'valuation-engine.js',
  'themes.js',
  'wallet-integration.js',
  'earnings.js',
  'trips.js',
  'transfers.js',
  'catalog.js',
  'feed.js',
  'data/offers-feed.json',
];

let failed = 0;
for (const path of REQUIRED) {
  const url = `${BASE}/${path}`;
  const res = await fetch(url, { method: 'HEAD' });
  const ok = res.status === 200;
  console.log(`${ok ? 'OK' : 'FAIL'} ${res.status} ${path}`);
  if (!ok) failed += 1;
}

const appUrl = `${BASE}/app.js?v=deploy-fix-v2`;
const app = await (await fetch(appUrl)).text();
if (!app.includes('plain-labels.js') || !app.includes('valuation-engine.js')) {
  console.log('FAIL cached app.js missing plain-labels/valuation-engine imports');
  failed += 1;
} else {
  console.log('OK app.js import paths (cache-busted entry)');
}

for (const legacy of ['help.js', 'valuation.js', 'valuation-engine.js', 'plain-labels.js']) {
  const res = await fetch(`${BASE}/${legacy}`, { method: 'HEAD' });
  if (res.status !== 200) {
    console.log(`FAIL ${res.status} ${legacy}`);
    failed += 1;
  }
}

process.exit(failed ? 1 : 0);