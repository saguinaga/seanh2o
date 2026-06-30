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

const app = await (await fetch(`${BASE}/app.js`)).text();
if (!app.includes('plain-labels.js')) {
  console.log('FAIL app.js missing plain-labels import (stale deploy)');
  failed += 1;
} else {
  console.log('OK app.js import paths');
}

process.exit(failed ? 1 : 0);