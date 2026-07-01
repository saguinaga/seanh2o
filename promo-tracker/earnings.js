/** Realistic offer earnings — pipeline, timing, net value + transfer upside */

import { findCatalog, pointsToUsd } from './catalog.js';
import {
  offerCashValue, offerTravelValue, valueQueuedOffers, valueCapturedOffers,
  DEFAULT_TRANSFER_BONUS_PCT, planEstimates,
} from './bb-value.js';

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
  { title: 'Use spend you already have', detail: 'Groceries, diapers, utilities, Amazon — redirect bills you pay anyway toward welcome bonuses, not new shopping.' },
  { title: 'Space hard pulls ~90 days', detail: 'Issuer velocity + inquiry aging. Rushing apps is the #1 reason household plans stall.' },
  { title: 'Hit the spend target with money you already spend', detail: 'Groceries, bills, Amazon — put what you were going to buy anyway toward the bonus requirement. One card at a time keeps your credit utilization reasonable.' },
  { title: 'Subtract annual fees', detail: 'A $900 SUB minus $95 AF is $805 net year one. Model it honestly before you pin the offer.' },
  { title: 'Mark offers done', detail: 'Updates velocity counters, last pull date, and captured $ so the roadmap stays accurate.' },
];

/** Realistic multi-month offer sequences */
export const OFFER_PLANS = [
  {
    id: 'conservative',
    name: 'Gentle start · ~6 months',
    hook: 'Low spend-target cards · minimal score dip',
    emoji: '🛡️',
    estValue: 1400,
    entries: [
      { catalogId: 'discover-it', priority: 1, status: 'planned', notes: 'Cashback Match year 1 — great for groceries & gas you already buy.' },
      { catalogId: 'chase-cfu', priority: 2, status: 'planned', notes: 'Only $500 spend needed. Wait ~90d after Discover if both are hard pulls.' },
      { catalogId: 'citi-custom', priority: 3, status: 'idea', notes: 'Small spend-target backup. Space 65d from prior Citi if applicable.' },
    ],
    caption: 'Low credit impact, steady cashback. Good if you’re mortgage-sensitive or new to pacing cards for the household.',
  },
  {
    id: 'balanced',
    name: 'Balanced · ~12 months',
    hook: 'Chase → Amex · family spend categories',
    emoji: '⚖️',
    estValue: 3200,
    entries: [
      { catalogId: 'chase-csp', priority: 1, status: 'planned', notes: 'Check 5/24 first. UR unlocks Hyatt & Southwest for trips.' },
      { catalogId: 'amex-gold', priority: 2, status: 'planned', notes: '~90d after Chase. Groceries & dining spend target — the stuff you buy anyway.' },
      { catalogId: 'chase-ihg', priority: 3, status: 'idea', notes: 'Hotel SUB for San Francisco or Germany city stays — only if still under 5/24 and 2/30.' },
    ],
    caption: 'The workhorse plan: ~$3k+ est. value over a year with disciplined spacing and real household spend.',
  },
  {
    id: 'everyday-cash',
    name: 'Everyday cash · ~4 months',
    hook: 'Portals & category bonuses only',
    emoji: '🛒',
    estValue: 900,
    entries: [
      { type: 'shopping', title: 'Grocery portal stack', issuer: 'Rakuten', valueUsd: 40, hardPull: false, minSpend: 0, status: 'planned', priority: 1, notes: 'Rakuten + grocery card on the weekly shop — no new account needed.' },
      { catalogId: 'discover-it', priority: 2, status: 'planned', notes: 'Rotate categories + Match year 1. One Discover card limit.' },
      { type: 'shopping', title: 'Amazon / Costco planned purchase', issuer: 'Other', valueUsd: 75, hardPull: false, minSpend: 0, status: 'idea', priority: 3, notes: 'Stack portal + 5% category on something the household needs anyway.' },
    ],
    caption: 'Extra cash from portals and cashback cards — minimal new credit applications.',
  },
  {
    id: 'household-stretch',
    name: 'Household stretch · ~18 months',
    hook: 'Two players · family trips · smart pacing',
    emoji: '🏡',
    estValue: 0,
    estTravelValue: 0,
    entries: [
      { catalogId: 'chase-csp', priority: 1, status: 'planned', owner: 'player1', notes: 'Player 1 · UR anchor. Transfer → Hyatt or Southwest for family trips.' },
      { catalogId: 'amex-gold', priority: 2, status: 'planned', owner: 'player2', notes: 'Player 2 · groceries & dining spend target while Player 1 works on Chase spend.' },
      { catalogId: 'chase-csr', priority: 3, status: 'planned', owner: 'player1', notes: 'Player 1 · ~90d after CSP. Portal 1.5¢ or Hyatt for nicer hotels.' },
      { catalogId: 'chase-ink-cash', priority: 4, status: 'planned', owner: 'player1', notes: 'Player 1 · business SUB — often outside 5/24 if you have a side gig.' },
      { catalogId: 'chase-ihg', priority: 5, status: 'idea', owner: 'player1', notes: 'Player 1 · IHG points for San Francisco or Italy hotels.' },
      { catalogId: 'amex-plat', priority: 6, status: 'planned', owner: 'player2', notes: 'Player 2 · ~90d after Gold. Lounge access helps long family travel days.' },
      { catalogId: 'amex-delta', priority: 7, status: 'idea', owner: 'player2', notes: 'Player 2 · SkyMiles land in airline currency — good for visiting grandparents.' },
      { catalogId: 'citi-premier', priority: 8, status: 'planned', owner: 'player2', notes: 'Player 2 · TY → Turkish / American for bigger family flights.' },
      { catalogId: 'capone-venture', priority: 9, status: 'idea', owner: 'player2', notes: 'Player 2 · flexible miles if you want one simple redemption path.' },
      { catalogId: 'chase-cfu', priority: 10, status: 'idea', owner: 'player1', notes: 'Player 1 · low spend-target UR top-off for groceries after bigger bonuses.' },
      { type: 'shopping', title: 'Portal stack — big household purchase', issuer: 'Rakuten', valueUsd: 120, hardPull: false, status: 'idea', priority: 11, owner: 'player1', notes: 'Furniture, appliances, or school gear — stack portal + category bonus.' },
    ],
    caption: 'Stay-at-home CFO special: pace cards across you + partner, pool points for San Francisco, Norway, Kenya, Germany or Italy — without chasing payroll bonuses.',
  },
];

// Pre-compute plan estimates for cards
OFFER_PLANS.forEach((plan) => {
  if (plan.entries?.length) {
    const est = planEstimates(plan.entries, DEFAULT_TRANSFER_BONUS_PCT);
    if (!plan.estValue) plan.estValue = est.cash;
    plan.estTravelValue = est.travel;
    plan.estPoints = est.points;
  }
});

export function offerValue(o) {
  return offerCashValue(o);
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
export function earningsProjection(offers, timeline, { transferBonusPct = 0 } = {}) {
  const pipeline = pipelineUsd(offers);
  const captured = capturedUsd(offers);
  const fees = annualFeesPending(offers);
  const netPipeline = Math.max(0, pipeline - fees);
  const total = captured + netPipeline;

  const queuedVal = valueQueuedOffers(offers, { transferBonusPct });
  const capturedVal = valueCapturedOffers(offers, transferBonusPct);
  const netTravelPipeline = Math.max(0, queuedVal.travel - fees);
  const travelTotal = capturedVal.travel + netTravelPipeline;

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
  const travelPerMonth = months > 0 ? Math.round(netTravelPipeline / months) : 0;
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
    travelPipeline: queuedVal.travel,
    travelCaptured: capturedVal.travel,
    netTravelPipeline,
    travelTotal,
    travelUplift: Math.max(0, queuedVal.travel - pipeline),
    travelUpliftWithBonus: Math.max(0, queuedVal.travel - pipeline),
    totalPoints: queuedVal.points + capturedVal.points,
    pointsQueued: queuedVal.points,
    byProgram: queuedVal.byProgram,
    months,
    perMonth,
    travelPerMonth,
    msr: msrExposure(offers),
    queued: queuedCount(offers),
    byType,
    transferBonusPct,
  };
}