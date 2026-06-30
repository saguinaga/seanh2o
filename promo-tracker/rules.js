/** Credit gates, profile v2, sequencing — educational, not financial advice */
import { evaluateIssuerGates } from './issuers.js';
import { findCatalog, catalogEntryToOffer } from './catalog.js';

export const ISSUERS = [
  'Chase', 'Amex', 'Citi', 'Discover', 'Capital One', 'Bank of America', 'Wells Fargo', 'US Bank', 'Barclays', 'Other',
];

export const OFFER_TYPES = {
  cc: { label: 'Credit card SUB', icon: '💳', defaultCooldown: 90 },
  bank: { label: 'Bank bonus', icon: '🏦', defaultCooldown: 365 },
  shopping: { label: 'Portal / stack', icon: '🛒', defaultCooldown: 0 },
  travel: { label: 'Travel promo', icon: '✈️', defaultCooldown: 365 },
};

export const STATUS = {
  idea: { label: 'Idea', order: 0 },
  planned: { label: 'Planned', order: 1 },
  ready: { label: 'Ready', order: 2 },
  active: { label: 'In progress', order: 3 },
  done: { label: 'Done', order: 4 },
  cooldown: { label: 'Cooling down', order: 5 },
  skip: { label: 'Skipped', order: 6 },
};

const DAY = 86400000;

export function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function daysBetween(a, b) {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return null;
  return Math.floor((db - da) / DAY);
}

export function addDays(dateStr, days) {
  const d = parseDate(dateStr) || new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function defaultProfile() {
  return {
    age: 34,
    baselineScore: 745,
    scoreBand: '720-759',
    oldestAccountYears: 10,
    creditHistoryYears: 10,
    aaoaYears: 4.5,
    cardsOpen: 4,
    personalCards24mo: 2,
    cards24mo: 2,
    totalCreditLimit: 32000,
    totalBalances: 3800,
    utilizationPct: 12,
    inquiries6mo: 1,
    inquiries12mo: 2,
    inquiries24mo: 3,
    recentAccounts12mo: 1,
    latePayments24mo: 0,
    hasMortgage: false,
    hasAutoLoan: true,
    hasStudentLoan: false,
    mortgageSensitive: false,
    mortgagePlannedDate: '',
    lastHardPull: '',
    chaseCards30d: 0,
    amexCards90d: 0,
    amexCardsTotal: 1,
    citiCards8d: 0,
    citiCards65d: 0,
    discoverCardsTotal: 0,
    capOneCards6mo: 0,
    capOneCardsTotal: 0,
    bofaCards2mo: 0,
    bofaCards12mo: 0,
    bofaCards24mo: 0,
    wfCards6mo: 0,
    usbCards12mo: 0,
    barcCards6mo: 0,
    existingPoints: {
      chase_ur: 0, amex_mr: 0, citi_ty: 0, capone: 0, bofa: 0, usbank: 0, discover: 0,
    },
    partnerPoints: {
      chase_ur: 0, amex_mr: 0, citi_ty: 0, capone: 0,
    },
    partnerLabel: 'Partner',
    poolHousehold: true,
    notes: '',
  };
}

export function defaultState() {
  return {
    version: 2,
    profile: defaultProfile(),
    offers: [],
    updatedAt: new Date().toISOString(),
  };
}

/** Migrate v1 localStorage / imports */
export function migrateState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;

  const profile = { ...defaultProfile(), ...raw.profile };
  if (raw.version < 2) {
    profile.personalCards24mo = profile.personalCards24mo ?? profile.cards24mo ?? 0;
    profile.baselineScore = profile.baselineScore ?? scoreBandToMid(profile.scoreBand);
    profile.oldestAccountYears = profile.oldestAccountYears ?? profile.creditHistoryYears ?? profile.aaoaYears ?? 4;
    profile.creditHistoryYears = profile.creditHistoryYears ?? profile.oldestAccountYears;
    if (!profile.totalCreditLimit && profile.cardsOpen) {
      profile.totalCreditLimit = profile.cardsOpen * 8000;
    }
    if (!profile.totalBalances && profile.utilizationPct) {
      profile.totalBalances = Math.round(profile.totalCreditLimit * profile.utilizationPct / 100);
    }
    profile.existingPoints = { ...defaultProfile().existingPoints, ...profile.existingPoints };
    profile.partnerPoints = { ...defaultProfile().partnerPoints, ...profile.partnerPoints };
    if (profile.poolHousehold === undefined) profile.poolHousehold = true;
    if (!profile.partnerLabel) profile.partnerLabel = 'Partner';
  }

  return {
    ...base,
    ...raw,
    version: 2,
    profile,
    offers: Array.isArray(raw.offers) ? raw.offers : [],
  };
}

function scoreBandToMid(band) {
  const map = { '680-719': 700, '720-759': 740, '760-799': 780, '800+': 820 };
  return map[band] ?? 740;
}

export function evaluateOffer(offer, profile, allOffers) {
  const warnings = [];
  const blockers = [];
  const today = new Date().toISOString().slice(0, 10);

  if (offer.catalogId) {
    const card = findCatalog(offer.catalogId);
    if (card && !offer.creditLine) offer = { ...offer, creditLine: card.creditLine, msrMonths: card.msrMonths };
  }

  if (offer.type === 'cc' && offer.hardPull && offer.issuer && offer.issuer !== 'Other') {
    const gates = evaluateIssuerGates(profile, offer.issuer);
    gates.blocked.forEach((g) => blockers.push(`${offer.issuer} ${g.id}: ${g.detail}`));
    gates.results.filter((g) => g.caution).forEach((g) => warnings.push(`${offer.issuer}: ${g.detail}`));
  }

  if (offer.type === 'cc' && offer.hardPull) {
    if (profile.inquiries6mo >= 3) {
      warnings.push('3+ inquiries in 6 months — many issuers get picky.');
    }
    if (profile.inquiries12mo >= 6) {
      blockers.push('6+ inquiries in 12 months — high rejection risk.');
    }
    if (profile.mortgageSensitive && profile.mortgagePlannedDate) {
      const daysToMortgage = daysBetween(today, profile.mortgagePlannedDate);
      if (daysToMortgage !== null && daysToMortgage >= 0 && daysToMortgage < 180) {
        warnings.push(`Mortgage planned in ${daysToMortgage}d — consider pausing apps 6+ months before closing.`);
      }
    }
    const last = parseDate(profile.lastHardPull);
    if (last) {
      const since = daysBetween(profile.lastHardPull, today);
      if (since !== null && since < 45) {
        warnings.push(`Last hard pull was ${since}d ago — many churners wait 90d between apps.`);
      }
    }
    const sameIssuer = allOffers.filter(
      (o) => o.id !== offer.id && o.status === 'done' && o.issuer === offer.issuer && o.hardPull,
    );
    if (sameIssuer.length) {
      const recent = sameIssuer.sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''))[0];
      if (recent?.completedDate) {
        const gap = daysBetween(recent.completedDate, today);
        if (gap !== null && gap < 90) {
          warnings.push(`${offer.issuer}: last card ${gap}d ago — common 90d spacing.`);
        }
      }
    }
  }

  const util = profile.totalCreditLimit > 0
    ? (profile.totalBalances / profile.totalCreditLimit) * 100
    : profile.utilizationPct;
  if (util > 30) {
    warnings.push(`Utilization ${Math.round(util)}% — pay down before new apps if possible.`);
  }
  if (profile.aaoaYears < 2 && offer.type === 'cc' && offer.hardPull) {
    warnings.push('AAoA under 2y — premium cards harder; consider bank bonuses first.');
  }
  if (profile.baselineScore && profile.baselineScore < 680 && offer.type === 'cc' && offer.hardPull) {
    warnings.push('Baseline under 680 — premium SUB cards may deny; start with no-AF cards.');
  }

  if (offer.earliestDate && offer.earliestDate > today) {
    blockers.push(`Earliest date: ${offer.earliestDate}`);
  }

  const score = blockers.length ? 'blocked' : warnings.length ? 'caution' : 'clear';
  return { score, warnings, blockers };
}

/** Bump profile counters when an offer is marked done */
export function bumpProfileOnApproval(profile, offer) {
  const p = { ...profile };
  if (offer.type !== 'cc' || !offer.hardPull) return p;

  p.personalCards24mo = n(p.personalCards24mo ?? p.cards24mo) + 1;
  p.cards24mo = p.personalCards24mo;
  p.cardsOpen = n(p.cardsOpen) + 1;
  p.recentAccounts12mo = n(p.recentAccounts12mo) + 1;
  p.inquiries6mo = n(p.inquiries6mo) + 1;
  p.inquiries12mo = n(p.inquiries12mo) + 1;
  p.inquiries24mo = n(p.inquiries24mo) + 1;

  const line = n(offer.creditLine) || 8000;
  p.totalCreditLimit = n(p.totalCreditLimit) + line;
  const prevAaoa = n(p.aaoaYears);
  p.aaoaYears = prevAaoa * (p.cardsOpen - 1) / p.cardsOpen;

  const issuer = offer.issuer;
  if (issuer === 'Chase') p.chaseCards30d = n(p.chaseCards30d) + 1;
  if (issuer === 'Amex') {
    p.amexCards90d = n(p.amexCards90d) + 1;
    p.amexCardsTotal = n(p.amexCardsTotal) + 1;
  }
  if (issuer === 'Citi') {
    p.citiCards8d = n(p.citiCards8d) + 1;
    p.citiCards65d = n(p.citiCards65d) + 1;
  }
  if (issuer === 'Discover') p.discoverCardsTotal = n(p.discoverCardsTotal) + 1;
  if (issuer === 'Capital One') {
    p.capOneCards6mo = n(p.capOneCards6mo) + 1;
    p.capOneCardsTotal = n(p.capOneCardsTotal) + 1;
  }
  if (issuer === 'Bank of America') {
    p.bofaCards2mo = n(p.bofaCards2mo) + 1;
    p.bofaCards12mo = n(p.bofaCards12mo) + 1;
    p.bofaCards24mo = n(p.bofaCards24mo) + 1;
  }
  if (issuer === 'Wells Fargo') p.wfCards6mo = n(p.wfCards6mo) + 1;
  if (issuer === 'US Bank') p.usbCards12mo = n(p.usbCards12mo) + 1;
  if (issuer === 'Barclays') p.barcCards6mo = n(p.barcCards6mo) + 1;

  return p;
}

function n(v) { return Math.max(0, Number(v) || 0); }

export function suggestTimeline(offers, profile) {
  const pending = offers
    .filter((o) => !['done', 'skip'].includes(o.status))
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));

  const timeline = [];
  let cursor = profile.lastHardPull || new Date().toISOString().slice(0, 10);
  const p524 = n(profile.personalCards24mo ?? profile.cards24mo);

  pending.forEach((o) => {
    if (o.type === 'cc' && o.hardPull) {
      let wait = 90;
      if (o.issuer === 'Chase') wait = p524 >= 4 ? 120 : 90;
      if (o.issuer === 'Amex') wait = 45;
      if (o.issuer === 'Citi') wait = 65;
      if (o.issuer === 'Capital One') wait = 180;
      const earliest = addDays(cursor, wait);
      const chosen = o.earliestDate && o.earliestDate > earliest ? o.earliestDate : earliest;
      timeline.push({
        offerId: o.id,
        title: o.title,
        issuer: o.issuer,
        suggestedDate: chosen,
        reason: `${wait}d spacing (${o.issuer || 'card'} velocity)`,
      });
      cursor = chosen;
    } else {
      timeline.push({
        offerId: o.id,
        title: o.title,
        issuer: o.issuer,
        suggestedDate: o.earliestDate || cursor,
        reason: 'No hard pull — flexible',
      });
    }
  });

  return timeline;
}

const INFLUENCER_STACK_ENTRIES = {
  'babymoon-cabo': [
    { catalogId: 'chase-csp', priority: 1, status: 'planned', notes: 'Card 1 — book flights or Hyatt transfer. Check 5/24 first.' },
    { catalogId: 'amex-gold', priority: 2, status: 'planned', notes: 'Card 2 — groceries & dining MSR. Wait ~90d after Chase.' },
  ],
  'europe-reel': [
    { catalogId: 'chase-csp', priority: 1, status: 'planned', notes: 'Flights via Chase Travel or transfer partners.' },
    { catalogId: 'chase-ihg', priority: 2, status: 'planned', notes: 'Hotel nights — IHG SUB is huge for Europe reels.' },
    { catalogId: 'amex-gold', priority: 3, status: 'idea', notes: 'Dining abroad + MR stash.' },
  ],
  'disney-mom': [
    { catalogId: 'chase-cfu', priority: 1, status: 'planned', notes: 'Everyday spend — pairs with Sapphire later.' },
    { catalogId: 'chase-csp', priority: 2, status: 'planned', notes: 'Portal redemption for park hotel.' },
    { catalogId: 'capone-venture', priority: 3, status: 'idea', notes: 'Flexible miles backup.' },
  ],
};

export function seedOffers() {
  return seedInfluencerStack('babymoon-cabo');
}

/** Stacks that travel creators tease — educational examples */
export function seedInfluencerStack(stackId) {
  const entries = INFLUENCER_STACK_ENTRIES[stackId] || INFLUENCER_STACK_ENTRIES['babymoon-cabo'];
  return entries.map((entry) => {
    const card = findCatalog(entry.catalogId);
    if (!card) return null;
    const offer = catalogEntryToOffer(card, entry.priority);
    offer.status = entry.status || 'planned';
    offer.notes = entry.notes || offer.notes;
    return offer;
  }).filter(Boolean);
}