/** Cash floor vs transfer-optimized travel value — household trip stretch
 * Updated for deploy consistency 20260701
 */

import { findCatalog, POINT_VALUES, pointsToUsd } from './catalog.js';
import { PROGRAMS, PARTNERS, TRANSFER_RULES } from './transfers.js';

export const DEFAULT_TRANSFER_BONUS_PCT = 25;

/** Named transfer plays families actually use */
export const TRANSFER_PLAYS = [
  {
    id: 'hyatt-lux',
    name: 'Chase → Hyatt nice hotel night',
    programs: ['chase_ur'],
    partner: 'hyatt',
    cpp: 0.02,
    pitch: '60k–100k UR → Hyatt Regency or Andaz. Great for a kid-free anniversary night or splurge hotel on a family trip.',
  },
  {
    id: 'southwest-cabo',
    name: 'Chase → Southwest beach hop',
    programs: ['chase_ur'],
    partner: 'southwest',
    cpp: 0.015,
    pitch: 'Domestic & Mexico flights for the whole crew — pair with Hyatt points for the hotel side of beach week.',
  },
  {
    id: 'flyingblue-europe',
    name: 'Amex → Flying Blue to visit family',
    programs: ['amex_mr', 'chase_ur', 'citi_ty'],
    partner: 'flyingblue',
    cpp: 0.014,
    pitch: 'Promo awards to Europe when you’re visiting relatives abroad. A transfer bonus stretches grocery-earned MR further.',
  },
  {
    id: 'mr-hilton',
    name: 'Amex → Hilton long stay',
    programs: ['amex_mr'],
    partner: 'hilton',
    cpp: 0.005,
    pitch: 'Hilton welcome-bonus points + MR top-off. Fifth night free on awards helps multi-night stays on trips like Italy or Germany.',
  },
  {
    id: 'household-pool',
    name: 'Two players → one loyalty account',
    programs: ['chase_ur', 'amex_mr', 'citi_ty', 'capone'],
    partner: null,
    cpp: null,
    pitch: 'You earn on one set of cards, partner earns on another, then both transfer into the same Hyatt / United / Marriott account for one family booking.',
  },
  {
    id: 'transfer-bonus',
    name: 'Wait for transfer bonuses',
    programs: ['amex_mr', 'citi_ty', 'capone'],
    partner: null,
    cpp: null,
    pitch: 'Periodic +25–30% bonuses turn 100k MR into 125k airline miles — worth holding big transfers until a promo hits.',
  },
];

export const HOUSEHOLD_VALUE_MATH = [
  { label: 'Cash floor (portal / statement credit)', detail: 'What we show as “$900 SUB” — honest, spendable dollars at ~1¢/pt if you cashed out simply.' },
  { label: 'Trip stretch (smart partners)', detail: 'Same points moved to Hyatt, Southwest, United, etc. Often 1.4–2.5¢/pt on San Francisco, Norway, Kenya, Germany or Italy.' },
  { label: 'Two-player household', detail: 'Separate 5/24 windows — Chase on one person, Amex on the other — roughly doubles card throughput over 18 months without rushing.' },
  { label: 'Everyday spend categories', detail: 'Groceries, Amazon, utilities, and school costs can fund MSRs when you pace one welcome bonus at a time.' },
  { label: 'What’s not included', detail: 'Taxes on awards, annual fees, failed apps, and cherry-picked luxury redemptions you see in social media.' },
];

/** @deprecated use HOUSEHOLD_VALUE_MATH */
export const INFLUENCER_MATH = HOUSEHOLD_VALUE_MATH;

export function bestPartnerForProgram(programId) {
  const rules = TRANSFER_RULES.filter((r) => r.from === programId);
  let best = null;
  rules.forEach((rule) => {
    const partner = PARTNERS[rule.to];
    if (!partner) return;
    if (!best || partner.cpp > best.cpp) {
      best = { ...partner, rule, cpp: partner.cpp };
    }
  });
  return best;
}

export function offerPoints(o) {
  if (o.subPoints) return o.subPoints;
  if (o.catalogId) {
    const c = findCatalog(o.catalogId);
    return c?.subPoints || 0;
  }
  return 0;
}

export function offerProgram(o) {
  if (o.program) return o.program;
  if (o.catalogId) return findCatalog(o.catalogId)?.program;
  return null;
}

/** Cash-like value (portal cpp / catalog defaults) */
export function offerCashValue(o) {
  if (o.valueUsd) return o.valueUsd;
  const pts = offerPoints(o);
  const prog = offerProgram(o);
  if (pts && prog) return pointsToUsd(pts, prog);
  if (o.catalogId) {
    const c = findCatalog(o.catalogId);
    if (c) return c.subCash || pointsToUsd(c.subPoints, c.program);
  }
  return 0;
}

/** Travel value if transferred to best partner (+ optional bonus %) */
export function offerTravelValue(o, transferBonusPct = 0) {
  const cash = offerCashValue(o);
  const pts = offerPoints(o);
  const prog = offerProgram(o);
  if (!pts || !prog) return cash;
  const meta = PROGRAMS[prog];
  if (!meta?.transferable) return cash;
  const val = programPointValue(prog, pts, transferBonusPct);
  return Math.max(cash, val.transferUsd);
}

export function programPointValue(programId, points, transferBonusPct = 0) {
  const pts = Math.max(0, Number(points) || 0);
  const meta = PROGRAMS[programId];
  const portalCpp = meta?.portalCpp || POINT_VALUES[programId] || 0.01;
  const best = bestPartnerForProgram(programId);
  const transferCpp = best?.cpp || portalCpp;
  const mult = 1 + (Math.max(0, transferBonusPct) / 100);
  const portalUsd = Math.round(pts * portalCpp);
  const transferUsd = Math.round(pts * transferCpp * mult);
  return {
    programId,
    points: pts,
    portalCpp,
    transferCpp,
    portalUsd,
    transferUsd,
    upliftUsd: Math.max(0, transferUsd - portalUsd),
    upliftPct: portalUsd > 0 ? Math.round(((transferUsd / portalUsd) - 1) * 100) : 0,
    bestPartner: best,
    transferable: !!meta?.transferable,
  };
}

export function valueQueuedOffers(offers, { transferBonusPct = 0, includeStatuses = ['idea', 'planned', 'ready', 'active', 'cooldown'] } = {}) {
  let cash = 0;
  let travel = 0;
  let points = 0;
  const byProgram = {};

  offers.filter((o) => includeStatuses.includes(o.status)).forEach((o) => {
    const c = offerCashValue(o);
    const t = offerTravelValue(o, transferBonusPct);
    cash += c;
    travel += t;
    const pts = offerPoints(o);
    const prog = offerProgram(o);
    if (pts && prog) {
      points += pts;
      byProgram[prog] = (byProgram[prog] || 0) + pts;
    }
  });

  return {
    cash,
    travel,
    uplift: Math.max(0, travel - cash),
    points,
    byProgram,
  };
}

export function valueCapturedOffers(offers, transferBonusPct = 0) {
  return valueQueuedOffers(offers, {
    transferBonusPct,
    includeStatuses: ['done'],
  });
}

/** Wallet line with portal + transfer columns */
export function enrichWalletLine(line, transferBonusPct = 0) {
  const val = programPointValue(line.program, line.total, transferBonusPct);
  return {
    ...line,
    portalUsd: val.portalUsd,
    transferUsd: val.transferUsd,
    upliftUsd: val.upliftUsd,
    bestPartner: val.bestPartner,
    transferCpp: val.transferCpp,
  };
}

export function planEstimates(entries, transferBonusPct = DEFAULT_TRANSFER_BONUS_PCT) {
  const fakeOffers = entries.map((entry, i) => {
    if (entry.catalogId) {
      const card = findCatalog(entry.catalogId);
      if (!card) return null;
      return {
        status: 'planned',
        catalogId: entry.catalogId,
        subPoints: card.subPoints,
        program: card.program,
        valueUsd: card.subCash || 0,
        type: 'cc',
      };
    }
    return {
      status: 'planned',
      type: entry.type,
      valueUsd: entry.valueUsd || 0,
    };
  }).filter(Boolean);

  const v = valueQueuedOffers(fakeOffers, { transferBonusPct });
  return { cash: v.cash, travel: v.travel, points: v.points };
}

export function suggestTransferRoute(programId, tripPartnerId) {
  const rule = TRANSFER_RULES.find((r) => r.from === programId && r.to === tripPartnerId);
  if (!rule) return null;
  return { rule, partner: PARTNERS[tripPartnerId] };
}