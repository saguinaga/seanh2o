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
  { feedId: 'bank-wf-325', type: 'bank', issuer: 'Wells Fargo', title: 'Wells Fargo checking — est. $325', valueUsd: 325, minSpend: 1000, hardPull: false, tags: ['checking'], source: 'curated', sourceUrl: 'https://www.doctorofcredit.com/wells-fargo-checking-bonus/', notes: 'Promo varies; may require DD.' },
  { feedId: 'bank-pnc-400', type: 'bank', issuer: 'PNC', title: 'PNC Virtual Wallet — est. $400', valueUsd: 400, minSpend: 5000, hardPull: false, tags: ['checking'], source: 'curated', sourceUrl: 'https://www.doctorofcredit.com/pnc-bank-bonus/', notes: 'Often tiered by deposit + DD.' },
  { feedId: 'bank-td-300', type: 'bank', issuer: 'TD Bank', title: 'TD Beyond checking — est. $300', valueUsd: 300, minSpend: 2500, hardPull: false, tags: ['checking'], source: 'curated', sourceUrl: 'https://www.doctorofcredit.com/td-bank-bonus/', notes: 'East-coast availability.' },
  { feedId: 'bank-truist-400', type: 'bank', issuer: 'Truist', title: 'Truist checking — est. $400', valueUsd: 400, minSpend: 1000, hardPull: false, tags: ['checking'], source: 'curated', sourceUrl: 'https://www.doctorofcredit.com/truist-bank-bonus/', notes: 'Verify regional eligibility.' },
  { feedId: 'bank-nfcu-250', type: 'bank', issuer: 'Navy Federal', title: 'Navy Federal checking — est. $250', valueUsd: 250, minSpend: 0, hardPull: false, tags: ['checking', 'cu'], source: 'curated', sourceUrl: 'https://www.doctorofcredit.com/navy-federal-credit-union-bonus/', notes: 'Membership required.' },
  { feedId: 'bank-dcu-100', type: 'bank', issuer: 'DCU', title: 'DCU checking — est. $100', valueUsd: 100, minSpend: 500, hardPull: false, tags: ['checking', 'cu'], source: 'curated', sourceUrl: 'https://www.doctorofcredit.com/dcu-bonus/', notes: 'CU membership required.' },
  { feedId: 'bank-sofi-300', type: 'bank', issuer: 'SoFi', title: 'SoFi checking + savings — est. $300', valueUsd: 300, minSpend: 5000, hardPull: false, tags: ['checking', 'fintech'], source: 'curated', sourceUrl: 'https://www.doctorofcredit.com/sofi-money-bonus/', notes: 'Direct deposit tiers change often.' },
  { feedId: 'bank-ally-200', type: 'bank', issuer: 'Other', title: 'Ally savings — est. promo', valueUsd: 200, minSpend: 0, hardPull: false, tags: ['savings', 'online'], source: 'curated', sourceUrl: 'https://www.doctorofcredit.com/best-bank-account-bonuses/', notes: 'Online banks rotate offers.' },
  { feedId: 'bank-schwab-100', type: 'bank', issuer: 'Other', title: 'Schwab brokerage referral — est. $100', valueUsd: 100, minSpend: 0, hardPull: false, tags: ['brokerage'], source: 'curated', sourceUrl: 'https://www.doctorofcredit.com/best-brokerage-bonuses-and-free-trades/', notes: 'Referral / transfer promos.' },
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

const ISSUER_PATTERNS = [
  ['Chase', ['chase', 'sapphire', 'freedom flex', 'freedom unlimited', 'ink business', 'united mileageplus', 'ihg']],
  ['Amex', ['amex', 'american express', 'membership rewards', 'delta skymiles', 'hilton honors', 'marriott bonvoy']],
  ['Citi', ['citi', 'costco anywhere', 'strata', 'thankyou', 'aadvantage']],
  ['Discover', ['discover it', 'discover card', 'discover miles']],
  ['Capital One', ['capital one', 'venture x', 'venture rewards', 'savorone', 'quicksilver']],
  ['Bank of America', ['bank of america', 'bofa', 'premium rewards']],
  ['Wells Fargo', ['wells fargo', 'autograph', 'active cash', 'bilt']], // bilt is WF-backed
  ['US Bank', ['us bank', 'u.s. bank', 'altitude connect', 'altitude reserve']],
  ['Barclays', ['barclays', 'jetblue', 'wyndham', 'aadvantage aviator']],
  ['PNC', ['pnc bank', 'pnc cash', 'virtual wallet']],
  ['TD Bank', ['td bank', 'target redcard']],
  ['Truist', ['truist', 'suntrust', 'bb&t']],
  ['Regions', ['regions bank', 'regions explore']],
  ['Fifth Third', ['fifth third', '5/3', '53 bank']],
  ['Huntington', ['huntington bank', 'huntington voice']],
  ['BMO', ['bmo harris', 'bmo bank']],
  ['Navy Federal', ['navy federal', 'nfcu']],
  ['PenFed', ['penfed', 'pentagon federal']],
  ['DCU', ['dcu', 'digital federal credit union']],
  ['Alliant', ['alliant credit union', 'alliant cu']],
  ['Andrews FCU', ['andrews federal', 'andrews fcu']],
  ['Goldman Sachs', ['apple card', 'goldman sachs', 'apple pay later']],
  ['SoFi', ['sofi credit', 'sofi card', 'sofi money']],
  ['Synchrony', ['synchrony', 'paypal cashback', 'venmo credit', "sam's club mastercard", "lowe's advantage", 'amazon store card']],
  ['Bread Financial', ['bread financial', 'bread cashback', "bj's one", 'comenity capital']],
  ['Comenity', ['comenity', 'ultamate rewards']],
  ['Elan', ['elan financial', 'fidelity rewards visa']],
  ['Credit One', ['credit one']],
  ['FNBO', ['fnbo', 'first national bank of omaha', 'getaway visa']],
  ['First Tech FCU', ['first tech', 'first tech federal']],
  ['Mercury', ['mercury credit', 'mercury io']],
  ['Brex', ['brex card', 'brex 30']],
];

const CC_KEYWORDS = [
  'credit card', 'sub', 'signup', 'sign-up', 'sign up bonus', 'welcome bonus',
  'intro bonus', 'new cardmember', 'prequalified', 'pre-approved',
  ...ISSUER_PATTERNS.flatMap(([, keys]) => keys),
];

function classifyDocItem(item) {
  const t = item.title.toLowerCase();
  if (t.includes('transfer bonus') || (t.includes('transfer') && t.includes('bonus'))) {
    return 'transfer_bonus';
  }
  if (t.includes('bank bonus') || t.includes('checking bonus') || t.includes('savings bonus')
    || t.includes('brokerage bonus') || t.includes('credit union bonus')
    || (t.includes('checking') && t.includes('bonus'))
    || (t.includes('direct deposit') && t.includes('bonus'))) {
    return 'bank';
  }
  if (t.includes('rakuten') || t.includes('portal') || t.includes('cashback monitor')
    || t.includes('befrugal') || t.includes('shopback')) {
    return 'shopping';
  }
  if (CC_KEYWORDS.some((k) => t.includes(k))) {
    return 'cc';
  }
  return null;
}

function guessIssuer(title) {
  const t = title.toLowerCase();
  for (const [issuer, keys] of ISSUER_PATTERNS) {
    if (keys.some((k) => t.includes(k))) return issuer;
  }
  if (t.includes('credit union') || t.includes(' fcU') || t.includes('federal credit')) return 'Other';
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
    tags: [...(card.tags || []), card.category].filter(Boolean),
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