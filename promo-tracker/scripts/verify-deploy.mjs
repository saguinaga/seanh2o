#!/usr/bin/env node
/** Smoke-test production module URLs for Bonus Board */
const BASE = process.env.DEPLOY_URL || 'https://seanaguinaga.com/promo-tracker';
const REQUIRED = [
  'index.html',
  'board.js',
  'bb-labels.js',
  'bb-value.js',
  'rules.js',
  'issuers.js',
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

const index = await (await fetch(`${BASE}/index.html`)).text();
if (!index.includes('board.js?v=20260630a')) {
  console.log('FAIL index.html missing board.js entry');
  failed += 1;
} else {
  console.log('OK index.html loads board.js');
}

const board = await (await fetch(`${BASE}/board.js?v=20260630a`)).text();
if (!board.includes('bb-labels.js') || !board.includes('bb-value.js')) {
  console.log('FAIL board.js missing bb-labels/bb-value imports');
  failed += 1;
} else {
  console.log('OK board.js import paths');
}

process.exit(failed ? 1 : 0);