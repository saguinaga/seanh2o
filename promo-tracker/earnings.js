/** Realistic offer earnings — pipeline, timing, net value */

import { findCatalog, pointsToUsd } from './catalog.js';

const DAY = 86400000;

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(a, b) {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return null;
  return Math.floor((db - da) / DAY);
}

export const PLANNING_PRINCIPLES = [
  { title: 'Bank bonuses first', detail: 'Often no hard pull. Fund the pipeline while credit stays clean for card SUBs.' },
  { title: 'Space hard pulls ~90 days', detail: 'Issuer velocity + inquiry aging. Rushing apps is the #1 reason plans fail.' },
  { title: 'MSR is planned spend', detail: 'Redirect bills you already pay — not new shopping. Track each deadline.' },
  { title: 'Subtract annual fees', detail: 'A $900 SUB minus $95 AF is $805 net year one. Model it honestly.' },
  { title: 'Mark offers done', detail: 'Updates velocity counters, last pull date, and captured $ so the timeline stays accurate.' },
];

/** Realistic multi-month offer sequences */
export const OFFER_PLANS = [
  {
    id: 'conservative',
    name: 'Conservative · ~6 months',
    hook: 'Bank bonus + low-MSR cards',
    emoji: '🛡️',
    estValue: 1400,
    entries: [
      { type: 'bank', title: 'Checking bonus — $300', issuer: 'Other', valueUsd: 300, hardPull: false, minSpend: 1000, status: 'planned', priority: 1, notes: 'Direct deposit, keep open 90+ days. No hard pull.' },
      { catalogId: 'chase-cfu', priority: 2, status: 'planned', notes: 'MSR only $500. Wait until bank bonus requirements met.' },
      { catalogId: 'discover-it', priority: 3, status: 'planned', notes: 'Cashback Match year 1. One Discover card limit.' },
      { catalogId: 'citi-custom', priority: 4, status: 'idea', notes: 'Small MSR. Space 65d from prior Citi if applicable.' },
    ],
    caption: 'Lower credit impact, steady cash + cashback. Good if you’re mortgage-sensitive or new to this.',
  },
  {
    id: 'balanced',
    name: 'Balanced · ~12 months',
    hook: 'Bank → Chase → Amex spacing',
    emoji: '⚖️',
    estValue: 3200,
    entries: [
      { type: 'bank', title: 'Checking bonus — $300', issuer: 'Other', valueUsd: 300, hardPull: false, minSpend: 1000, status: 'planned', priority: 1, notes: 'Fund first — no inquiry hit.' },
      { catalogId: 'chase-csp', priority: 2, status: 'planned', notes: 'Check 5/24. ~90d after bank bonus complete.' },
      { catalogId: 'amex-gold', priority: 3, status: 'planned', notes: '~90d after Chase. Groceries/dining MSR over 6mo.' },
      { catalogId: 'chase-ihg', priority: 4, status: 'idea', notes: 'Hotel SUB — only if still under 5/24 and 2/30.' },
    ],
    caption: 'The workhorse plan: ~$3k+ est. value over a year with disciplined spacing.',
  },
  {
    id: 'bank-heavy',
    name: 'Bank-heavy · ~4 months',
    hook: 'Cash only, minimal credit apps',
    emoji: '🏦',
    estValue: 900,
    entries: [
      { type: 'bank', title: 'Checking bonus — $300', issuer: 'Other', valueUsd: 300, hardPull: false, minSpend: 1000, status: 'planned', priority: 1, notes: 'Account #1' },
      { type: 'bank', title: 'Savings / brokerage — $200', issuer: 'Other', valueUsd: 200, hardPull: false, minSpend: 500, status: 'planned', priority: 2, notes: 'Check fine print — some pull ChexSystems only.' },
      { type: 'shopping', title: 'Portal stack — planned purchase', issuer: 'Other', valueUsd: 75, hardPull: false, minSpend: 0, status: 'idea', priority: 3, notes: 'Rakuten + card category on something you need anyway.' },
    ],
    caption: 'Pure cash path when you want earnings without touching card velocity.',
  },
];

export function offerValue(o) {
  if (o.valueUsd) return o.valueUsd;
  if (o.subPoints && o.program) return pointsToUsd(o.subPoints, o.program);
  if (o.catalogId) {
    const c = findCatalog(o.catalogId);
    if (c) return c.subCash || pointsToUsd(c.subPoints, c.program);
  }
  return 0;
}

export function annualFeesPending(offers) {
  return offers
    .filter((o) => !['done', 'skip'].includes(o.status))
    .reduce((s, o) => {
      const card = o.catalogId ? findCatalog(o.catalogId) : null;
      return s + (o.annualFee ?? card?.annualFee ?? 0);
    }, 0);
}

export function msrExposure(offers) {
  return offers
    .filter((o) => !['done', 'skip'].includes(o.status))
    .reduce((s, o) => s + (o.minSpend || 0), 0);
}

export function queuedCount(offers) {
  return offers.filter((o) => !['done', 'skip'].includes(o.status)).length;
}

export function pipelineUsd(offers) {
  return offers
    .filter((o) => !['done', 'skip'].includes(o.status))
    .reduce((s, o) => s + offerValue(o), 0);
}

export function capturedUsd(offers) {
  return offers
    .filter((o) => o.status === 'done')
    .reduce((s, o) => s + offerValue(o), 0);
}

/** Months spanned by timeline + $/month run rate */
export function earningsProjection(offers, timeline) {
  const pipeline = pipelineUsd(offers);
  const captured = capturedUsd(offers);
  const fees = annualFeesPending(offers);
  const netPipeline = Math.max(0, pipeline - fees);
  const total = captured + netPipeline;

  let months = 6;
  if (timeline?.length >= 2) {
    const first = timeline[0]?.suggestedDate;
    const last = timeline[timeline.length - 1]?.suggestedDate;
    const days = daysBetween(first, last);
    if (days != null && days > 0) months = Math.max(1, Math.round(days / 30.4));
  } else if (timeline?.length === 1) {
    months = 3;
  }

  const perMonth = months > 0 ? Math.round(netPipeline / months) : 0;
  const byType = {};
  offers.filter((o) => !['skip'].includes(o.status)).forEach((o) => {
    const t = o.type || 'cc';
    byType[t] = (byType[t] || 0) + offerValue(o);
  });

  return {
    pipeline,
    captured,
    total,
    fees,
    netPipeline,
    months,
    perMonth,
    msr: msrExposure(offers),
    queued: queuedCount(offers),
    byType,
  };
}