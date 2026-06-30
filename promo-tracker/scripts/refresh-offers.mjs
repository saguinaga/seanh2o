#!/usr/bin/env node
/**
 * Refresh promo-tracker/data/offers-feed.json
 * Sources: CARD_CATALOG, Doctor of Credit RSS, curated bank/portal/transfer seeds.
 * Run: node promo-tracker/scripts/refresh-offers.mjs
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CARD_CATALOG, pointsToUsd } from '../catalog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../data/offers-feed.json');

const OFFICIAL_URLS = {
  'chase-csp': 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred',
  'chase-csr': 'https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve',
  'chase-cfu': 'https://creditcards.chase.com/cash-back-credit-cards/freedom/unlimited',
  'chase-cff': 'https://creditcards.chase.com/cash-back-credit-cards/freedom/flex',
  'amex-gold': 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
  'amex-plat': 'https://www.americanexpress.com/us/credit-cards/card/platinum/',
  'citi-premier': 'https://www.citi.com/credit-cards/citi-strata-premier-credit-card',
  'discover-it': 'https://www.discover.com/credit-cards/cash-back/it-card.html',
};

const BANK_SEEDS = [
  { feedId: 'bank-chase-300', type: 'bank', issuer: 'Chase', title: 'Chase checking — est. $300', valueUsd: 300, minSpend: 1000, hardPull: false, tags: ['checking', 'direct-deposit'], source: 'curated', sourceUrl: 'https://www.doctorofcredit.com/chase-bank-bonus/', notes: 'Verify DD requirements on DOC.' },
  { feedId: 'bank-bofa-200', type: 'bank', issuer: 'Bank of America', title: 'BofA checking — est. $200', valueUsd: 200, minSpend: 1000, hardPull: false, tags: ['checking'], source: 'curated', sourceUrl: 'https://www.doctorofcredit.com/best-bank-account-bonuses/', notes: 'Amount varies by promo period.' },
  { feedId: 'bank-capone-400', type: 'bank', issuer: 'Capital One', title: 'Capital One 360 — est. $400', valueUsd: 400, minSpend: 0, hardPull: false, tags: ['savings'], source: 'curated', sourceUrl: 'https://www.doctorofcredit.com/capital-one-bank-bonus-360-checking360-savings/', notes: 'Often requires large deposit.' },
];

const PORTAL_SEEDS = [
  { feedId: 'portal-rakuten', type: 'shopping', issuer: 'Rakuten', title: 'Rakuten — stack portal + card', valueUsd: 50, hardPull: false, tags: ['portal', 'stack'], source: 'curated', sourceUrl: 'https://www.rakuten.com/', notes: 'Rate varies by merchant; stack with category bonus.' },
  { feedId: 'portal-topcashback', type: 'shopping', issuer: 'TopCashback', title: 'TopCashback portal', valueUsd: 40, hardPull: false, tags: ['portal'], source: 'curated', sourceUrl: 'https://www.topcashback.com/', notes: 'Compare vs Rakuten before large purchases.' },
];

const TRANSFER_BONUS_SEEDS = [
  { feedId: 'xfer-amex-airline', type: 'transfer_bonus', issuer: 'Amex', title: 'Amex MR → airline transfer bonus (watch)', valueUsd: 0, bonusPct: 30, programs: ['amex_mr'], partners: ['delta', 'virgin', 'aeroplan'], source: 'curated', sourceUrl: 'https://www.doctorofcredit.com/american-express-membership-rewards-transfer-bonuses/', notes: 'Periodic 20–30% bonuses — wait before large transfers.' },
  { feedId: 'xfer-chase-hyatt', type: 'transfer_bonus', issuer: 'Chase', title: 'Chase UR → Hyatt (no bonus, high cpp)', valueUsd: 0, bonusPct: 0, programs: ['chase_ur'], partners: ['hyatt'], source: 'curated', sourceUrl: 'https://www.doctorofcredit.com/chase-ultimate-rewards-transfer-partners/', notes: 'Often best value without a promo.' },
];

function parseRssItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const title = decodeXml(block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] || '');
    const link = decodeXml(block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '');
    const pub = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
    const desc = decodeXml(block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1] || '').slice(0, 280);
    if (title) items.push({ title, link, pubDate: pub, description: desc });
  }
  return items;
}

function decodeXml(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#039;/g, "'").trim();
}

function classifyDocItem(item) {
  const t = item.title.toLowerCase();
  if (t.includes('transfer bonus') || (t.includes('transfer') && t.includes('bonus'))) {
    return 'transfer_bonus';
  }
  if (t.includes('bank bonus') || t.includes('checking bonus') || t.includes('savings bonus') || (t.includes('checking') && t.includes('bonus'))) {
    return 'bank';
  }
  if (t.includes('rakuten') || t.includes('portal') || t.includes('cashback monitor')) {
    return 'shopping';
  }
  if (t.includes('credit card') || t.includes('sub') || t.includes('signup') || t.includes('sign-up')
    || ['chase', 'amex', 'american express', 'citi', 'discover', 'capital one'].some((k) => t.includes(k))) {
    return 'cc';
  }
  return null;
}

function guessIssuer(title) {
  const t = title.toLowerCase();
  if (t.includes('chase')) return 'Chase';
  if (t.includes('amex') || t.includes('american express')) return 'Amex';
  if (t.includes('citi')) return 'Citi';
  if (t.includes('discover')) return 'Discover';
  if (t.includes('capital one')) return 'Capital One';
  if (t.includes('wells fargo')) return 'Wells Fargo';
  if (t.includes('us bank')) return 'US Bank';
  return 'Other';
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
}

async function fetchDocAlerts() {
  try {
    const res = await fetch('https://www.doctorofcredit.com/feed/', {
      headers: { 'User-Agent': 'seanh2o-promo-feed/1.0 (educational; github.com/saguinaga/seanh2o)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return parseRssItems(xml)
      .slice(0, 40)
      .map((item) => {
        const type = classifyDocItem(item);
        if (!type) return null;
        return {
          feedId: `doc-${slug(item.title)}`,
          type,
          issuer: guessIssuer(item.title),
          title: item.title,
          valueUsd: 0,
          hardPull: type === 'cc',
          source: 'doctor_of_credit',
          sourceUrl: item.link,
          pubDate: item.pubDate,
          description: item.description,
          tags: ['doc-rss'],
        };
      })
      .filter(Boolean);
  } catch (e) {
    console.warn('DOC RSS fetch failed:', e.message);
    return [];
  }
}

function buildCardEntries() {
  const now = new Date().toISOString();
  return CARD_CATALOG.map((card) => ({
    feedId: `card-${card.id}`,
    catalogId: card.id,
    type: 'cc',
    issuer: card.issuer,
    name: card.name,
    title: `${card.name} — ${card.subPoints ? `${Math.round(card.subPoints / 1000)}k pts` : card.subCash ? `$${card.subCash}` : 'offer'}`,
    subPoints: card.subPoints,
    subCash: card.subCash,
    program: card.program,
    valueUsd: card.subCash || pointsToUsd(card.subPoints, card.program),
    msr: card.msr,
    msrMonths: card.msrMonths,
    annualFee: card.annualFee,
    creditLine: card.creditLine,
    hardPull: card.hardPull,
    tags: card.tags || [],
    source: 'catalog',
    sourceUrl: OFFICIAL_URLS[card.id] || null,
    docUrl: 'https://www.doctorofcredit.com/',
    updatedAt: now,
  }));
}

function contentHash(payload) {
  const slim = {
    cards: payload.cards.map((c) => [c.catalogId, c.subPoints, c.valueUsd]),
    doc: payload.docAlerts.map((d) => d.feedId).sort(),
    banks: payload.banks.map((b) => b.feedId),
    transfers: payload.transferBonuses.map((t) => t.feedId),
  };
  return createHash('sha256').update(JSON.stringify(slim)).digest('hex').slice(0, 16);
}

async function main() {
  const now = new Date().toISOString();
  const cards = buildCardEntries();
  const docAlerts = await fetchDocAlerts();
  const banks = BANK_SEEDS.map((b) => ({ ...b, updatedAt: now }));
  const portals = PORTAL_SEEDS.map((p) => ({ ...p, updatedAt: now }));
  const transferBonuses = TRANSFER_BONUS_SEEDS.map((t) => ({ ...t, updatedAt: now }));

  let prevHash = null;
  if (existsSync(OUT)) {
    try {
      prevHash = JSON.parse(readFileSync(OUT, 'utf8'))?.meta?.hash;
    } catch { /* noop */ }
  }

  const payload = {
    meta: {
      version: 1,
      generatedAt: now,
      hash: '',
      previousHash: prevHash,
      sources: ['catalog', 'doctor_of_credit_rss', 'curated_banks', 'curated_portals', 'curated_transfers'],
      docFeedUrl: 'https://www.doctorofcredit.com/feed/',
      refreshNote: 'Auto-refreshed weekly via GitHub Actions. Verify amounts on official issuer pages before applying.',
    },
    cards,
    banks,
    portals,
    transferBonuses,
    docAlerts,
  };

  payload.meta.hash = contentHash(payload);

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${OUT}`);
  console.log(`  cards: ${cards.length}, doc: ${docAlerts.length}, banks: ${banks.length}, hash: ${payload.meta.hash}`);
  if (prevHash && prevHash !== payload.meta.hash) console.log('  ⚡ Content changed since last run');
}

main();