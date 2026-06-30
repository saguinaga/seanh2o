/** Transfer partners, cross-program pooling & household sharing */

import { findCatalog, POINT_VALUES } from './catalog.js';
import { DREAM_TRIPS } from './trips.js';
function programPointValue(programId, points, transferBonusPct = 0) {
  const pts = Math.max(0, Number(points) || 0);
  const meta = PROGRAMS[programId];
  const portalCpp = meta?.portalCpp || POINT_VALUES[programId] || 0.01;
  let bestCpp = portalCpp;
  TRANSFER_RULES.filter((r) => r.from === programId).forEach((r) => {
    const p = PARTNERS[r.to];
    if (p?.cpp > bestCpp) bestCpp = p.cpp;
  });
  const mult = 1 + (Math.max(0, transferBonusPct) / 100);
  return {
    portalCpp,
    transferCpp: bestCpp,
    portalUsd: Math.round(pts * portalCpp),
    transferUsd: Math.round(pts * bestCpp * mult),
  };
}

export const PROGRAMS = {
  chase_ur: {
    id: 'chase_ur',
    name: 'Chase Ultimate Rewards',
    short: 'Chase UR',
    issuer: 'Chase',
    color: '#1174CC',
    portalCpp: 0.015,
    transferable: true,
    poolable: false,
    note: 'Freedom + Sapphire points pool in one Chase login when cards are linked.',
  },
  amex_mr: {
    id: 'amex_mr',
    name: 'Amex Membership Rewards',
    short: 'Amex MR',
    issuer: 'Amex',
    color: '#006FCF',
    portalCpp: 0.01,
    transferable: true,
    poolable: false,
    note: 'MR from multiple Amex cards pools automatically. Cannot merge with Chase/Citi.',
  },
  citi_ty: {
    id: 'citi_ty',
    name: 'Citi ThankYou',
    short: 'Citi TY',
    issuer: 'Citi',
    color: '#003B70',
    portalCpp: 0.01,
    transferable: true,
    poolable: false,
    note: 'Needs a transferable card (Premier/Strata) to move points out.',
  },
  capone: {
    id: 'capone',
    name: 'Capital One Miles',
    short: 'Cap One',
    issuer: 'Capital One',
    color: '#D03027',
    portalCpp: 0.01,
    transferable: true,
    poolable: true,
    note: 'Transfer to partners or erase travel at 1¢/pt. Miles pool across Cap One cards.',
  },
  bofa: {
    id: 'bofa',
    name: 'BofA Travel Rewards',
    short: 'BofA',
    issuer: 'Bank of America',
    color: '#E31837',
    portalCpp: 0.01,
    transferable: false,
    poolable: false,
    note: 'No airline transfers — portal & statement credit only.',
  },
  usbank: {
    id: 'usbank',
    name: 'US Bank Rewards',
    short: 'US Bank',
    issuer: 'US Bank',
    color: '#0C2074',
    portalCpp: 0.0125,
    transferable: false,
    poolable: false,
    note: 'Primarily portal redemptions on Altitude cards.',
  },
  discover: {
    id: 'discover',
    name: 'Discover Cashback',
    short: 'Discover',
    issuer: 'Discover',
    color: '#FF6000',
    portalCpp: 0.01,
    transferable: false,
    poolable: false,
    note: 'Cashback Match — not a transferable points currency.',
  },
};

export const PARTNERS = {
  hyatt: { id: 'hyatt', name: 'World of Hyatt', type: 'hotel', emoji: '🛏️', cpp: 0.02 },
  marriott: { id: 'marriott', name: 'Marriott Bonvoy', type: 'hotel', emoji: '🏨', cpp: 0.008 },
  ihg: { id: 'ihg', name: 'IHG One Rewards', type: 'hotel', emoji: '🌙', cpp: 0.006 },
  hilton: { id: 'hilton', name: 'Hilton Honors', type: 'hotel', emoji: '🛎️', cpp: 0.005 },
  united: { id: 'united', name: 'United MileagePlus', type: 'airline', emoji: '✈️', cpp: 0.014 },
  southwest: { id: 'southwest', name: 'Southwest Rapid Rewards', type: 'airline', emoji: '💙', cpp: 0.015 },
  delta: { id: 'delta', name: 'Delta SkyMiles', type: 'airline', emoji: '🔺', cpp: 0.012 },
  american: { id: 'american', name: 'American AAdvantage', type: 'airline', emoji: '🦅', cpp: 0.014 },
  jetblue: { id: 'jetblue', name: 'JetBlue TrueBlue', type: 'airline', emoji: '🔵', cpp: 0.013 },
  flyingblue: { id: 'flyingblue', name: 'Air France / KLM Flying Blue', type: 'airline', emoji: '🇫🇷', cpp: 0.012 },
  virgin: { id: 'virgin', name: 'Virgin Atlantic Flying Club', type: 'airline', emoji: '🇬🇧', cpp: 0.014 },
  avios: { id: 'avios', name: 'British Airways Avios', type: 'airline', emoji: '👑', cpp: 0.013 },
  aeroplan: { id: 'aeroplan', name: 'Air Canada Aeroplan', type: 'airline', emoji: '🍁', cpp: 0.014 },
  singapore: { id: 'singapore', name: 'Singapore KrisFlyer', type: 'airline', emoji: '🇸🇬', cpp: 0.016 },
  turkish: { id: 'turkish', name: 'Turkish Miles&Smiles', type: 'airline', emoji: '🇹🇷', cpp: 0.015 },
  emirates: { id: 'emirates', name: 'Emirates Skywards', type: 'airline', emoji: '🇦🇪', cpp: 0.012 },
  wyndham: { id: 'wyndham', name: 'Wyndham Rewards', type: 'hotel', emoji: '🏩', cpp: 0.011 },
};

/** @type {Array<object>} */
export const TRANSFER_RULES = [
  { from: 'chase_ur', to: 'hyatt', ratio: 1, time: 'Instant', sweet: 'Best hotel transfer — 2¢+ per point at luxury properties' },
  { from: 'chase_ur', to: 'united', ratio: 1, time: 'Instant', sweet: 'Domestic flights & Star Alliance' },
  { from: 'chase_ur', to: 'southwest', ratio: 1, time: 'Instant', sweet: 'Cabo & domestic — watch for bonuses' },
  { from: 'chase_ur', to: 'ihg', ratio: 1, time: 'Instant', sweet: 'Pair with IHG card SUB for free nights' },
  { from: 'chase_ur', to: 'marriott', ratio: 1, time: 'Instant', sweet: '5th night free on awards' },
  { from: 'chase_ur', to: 'flyingblue', ratio: 1, time: 'Instant', sweet: 'Europe promo awards' },
  { from: 'chase_ur', to: 'virgin', ratio: 1, time: 'Instant', sweet: 'ANA & Delta partners' },
  { from: 'chase_ur', to: 'aeroplan', ratio: 1, time: 'Instant', sweet: 'Star Alliance & no fuel on some routes' },

  { from: 'amex_mr', to: 'delta', ratio: 1, time: 'Instant', sweet: 'No fuel surcharges on Delta metal' },
  { from: 'amex_mr', to: 'flyingblue', ratio: 1, time: 'Instant', sweet: 'Europe — transfer bonuses common' },
  { from: 'amex_mr', to: 'marriott', ratio: 1, time: 'Instant', sweet: 'Hotel + 5th night free' },
  { from: 'amex_mr', to: 'hilton', ratio: 1, time: 'Instant', sweet: '5th night free at Hilton' },
  { from: 'amex_mr', to: 'jetblue', ratio: 1, time: 'Instant', sweet: 'Caribbean & NYC' },
  { from: 'amex_mr', to: 'virgin', ratio: 1, time: 'Instant', sweet: 'Upper-class redemptions' },
  { from: 'amex_mr', to: 'singapore', ratio: 1, time: '1–2 days', sweet: 'Premium cabin sweet spots' },
  { from: 'amex_mr', to: 'aeroplan', ratio: 1, time: 'Instant', sweet: 'Star Alliance business class' },
  { from: 'amex_mr', to: 'emirates', ratio: 1, time: 'Instant', sweet: 'Aspirational — watch surcharges' },

  { from: 'citi_ty', to: 'american', ratio: 1, time: 'Instant', sweet: 'Oneworld flights' },
  { from: 'citi_ty', to: 'jetblue', ratio: 1, time: 'Instant', sweet: 'Domestic & Caribbean' },
  { from: 'citi_ty', to: 'turkish', ratio: 1, time: 'Instant', sweet: 'Star Alliance business' },
  { from: 'citi_ty', to: 'singapore', ratio: 1, time: 'Instant', sweet: 'Long-haul premium' },
  { from: 'citi_ty', to: 'wyndham', ratio: 1, time: 'Instant', sweet: 'Flat 15k/30k hotel nights' },
  { from: 'citi_ty', to: 'flyingblue', ratio: 1, time: 'Instant', sweet: 'Europe awards' },
  { from: 'citi_ty', to: 'virgin', ratio: 1, time: 'Instant', sweet: 'ANA partner awards' },

  { from: 'capone', to: 'wyndham', ratio: 1, time: 'Instant', sweet: 'Budget hotel nights' },
  { from: 'capone', to: 'jetblue', ratio: 1, time: 'Instant', sweet: 'TrueBlue transfers' },
  { from: 'capone', to: 'flyingblue', ratio: 1, time: 'Instant', sweet: 'Europe' },
  { from: 'capone', to: 'singapore', ratio: 1, time: 'Instant', sweet: 'Premium cabins' },
  { from: 'capone', to: 'turkish', ratio: 1, time: 'Instant', sweet: 'Star Alliance' },
  { from: 'capone', to: 'emirates', ratio: 1, time: 'Instant', sweet: 'Aspirational' },
  { from: 'capone', to: 'avios', ratio: 1, time: 'Instant', sweet: 'Avios family' },
];

export const HOUSEHOLD_PLAYBOOK = [
  {
    title: 'Two-player household (most common)',
    steps: [
      'Partner A opens Chase, Partner B opens Amex — UR and MR do not combine in one bank login.',
      'Each earns SUBs on normal household spend you already have (groceries, utilities, insurance).',
      'If redeeming for travel: transfer both to the same airline/hotel loyalty number.',
      'Track velocity separately — each person has their own 5/24 and inquiry counts.',
    ],
  },
  {
    title: 'Chase “player 1 + player 2”',
    steps: [
      'Only one person should hold Sapphire for UR pooling from Freedom cards.',
      'Player 2 can open their own Chase cards but UR does not auto-combine across people.',
      'Workaround: Player 2 transfers UR to Hyatt/United into Player 1’s loyalty account (allowed by Hyatt/United).',
    ],
  },
  {
    title: 'Amex authorized user vs. second account',
    steps: [
      'AU earns MR into the primary cardholder’s pool — great for one login.',
      'Separate Amex accounts = separate MR pools — need transfers to combine at redemption.',
      'Amex once-per-lifetime SUB means coordinate who opens which card.',
    ],
  },
  {
    title: 'What influencers skip',
    steps: [
      'Transfers are one-way — you cannot move Hyatt points back to Chase.',
      'Marriott, Hilton, IHG SUB points are already in hotel currency (no transfer needed).',
      'Taxes/fees on awards still hit your card (~$5–$150 domestic, more international).',
      'Transfer bonuses (20–30% extra) are periodic — worth waiting for big trips.',
    ],
  },
];

/** Trip-specific booking paths creators use */
export const TRIP_PLAYBOOKS = {
  cabo: {
    flight: { partner: 'southwest', program: 'chase_ur', estPoints: 28000, note: 'UR → Southwest or book via Chase portal' },
    hotel: { partner: 'hyatt', program: 'chase_ur', estPoints: 60000, note: 'UR → Hyatt all-inclusive or HR properties' },
    altHotel: { partner: 'marriott', program: 'amex_mr', estPoints: 70000, note: 'MR → Marriott if Hyatt unavailable' },
    caption: 'The Cabo reel is usually Southwest flights + Hyatt/Ziva on points.',
  },
  paris: {
    flight: { partner: 'flyingblue', program: 'chase_ur', estPoints: 55000, note: 'UR or MR → Flying Blue promo awards' },
    hotel: { partner: 'hyatt', program: 'chase_ur', estPoints: 80000, note: 'UR → Hyatt Paris properties' },
    altFlight: { partner: 'virgin', program: 'amex_mr', estPoints: 50000, note: 'MR → Virgin → Delta to CDG' },
    caption: 'Europe content = Flying Blue or Virgin transfers + Hyatt/Marriott night.',
  },
  hawaii: {
    flight: { partner: 'united', program: 'chase_ur', estPoints: 45000, note: 'UR → United Saver to HNL/OGG' },
    hotel: { partner: 'hyatt', program: 'chase_ur', estPoints: 90000, note: 'UR → Hyatt resorts (Regency, Andaz)' },
    altHotel: { partner: 'marriott', program: 'amex_mr', estPoints: 100000, note: 'MR → Marriott Wailea / Waikiki' },
    caption: 'Hawaii week = United flights + Hyatt/Marriott beach resort.',
  },
  disney: {
    flight: { partner: 'southwest', program: 'chase_ur', estPoints: 25000, note: 'Southwest Companion Pass is the holy grail' },
    hotel: { partner: 'ihg', program: 'chase_ur', estPoints: 80000, note: 'IHG SUB + UR for off-property or Swan/Dolphin strategy' },
    altHotel: { partner: 'marriott', program: 'amex_mr', estPoints: 85000, note: 'Marriott Springs / Swan adjacent' },
    caption: 'Disney moms stack portal tickets + nearby hotel on points.',
  },
  caribbean: {
    flight: { partner: 'jetblue', program: 'amex_mr', estPoints: 30000, note: 'MR → JetBlue to Caribbean' },
    hotel: { partner: 'hyatt', program: 'chase_ur', estPoints: 50000, note: 'UR → Hyatt Zilara/Ziva' },
    caption: 'Caribbean = JetBlue from East Coast + Hyatt all-inclusive.',
  },
  japan: {
    flight: { partner: 'virgin', program: 'amex_mr', estPoints: 90000, note: 'MR → Virgin → ANA business (aspirational)' },
    hotel: { partner: 'hyatt', program: 'chase_ur', estPoints: 120000, note: 'UR → Hyatt in Tokyo/Kyoto' },
    altFlight: { partner: 'united', program: 'chase_ur', estPoints: 70000, note: 'UR → United Star Alliance to NRT' },
    caption: 'Japan flex = ANA/United flights + Hyatt category 4–6 hotels.',
  },
  nyc: {
    flight: { partner: 'jetblue', program: 'citi_ty', estPoints: 15000, note: 'Short hop — TY → JetBlue or portal' },
    hotel: { partner: 'hyatt', program: 'chase_ur', estPoints: 45000, note: 'UR → Hyatt Manhattan' },
    caption: 'NYC weekend is a smaller points target — great first redemption.',
  },
  cruise: {
    flight: { partner: 'southwest', program: 'chase_ur', estPoints: 20000, note: 'Fly to port city' },
    hotel: { partner: 'wyndham', program: 'citi_ty', estPoints: 30000, note: 'Pre-cruise night — TY → Wyndham' },
    caption: 'Cruise fans use points for flights + pre-night hotel, pay cruise cash.',
  },
};

export function defaultPointsBalances() {
  return {
    chase_ur: 0,
    amex_mr: 0,
    citi_ty: 0,
    capone: 0,
    bofa: 0,
    usbank: 0,
    discover: 0,
  };
}

function n(v) { return Math.max(0, Number(v) || 0); }

/** Points from stack offers grouped by program */
export function stackPointsByProgram(offers) {
  const byProgram = {};
  offers.filter((o) => !['skip'].includes(o.status)).forEach((o) => {
    let program = o.program;
    let pts = o.subPoints || 0;
    if (!program && o.catalogId) {
      const card = findCatalog(o.catalogId);
      program = card?.program;
      pts = pts || card?.subPoints || 0;
    }
    if (!program || !pts) return;
    byProgram[program] = (byProgram[program] || 0) + pts;
  });
  return byProgram;
}

/** Full wallet: existing + partner + stack SUB */
export function pointsWallet(profile, offers, transferBonusPct = 0) {
  const existing = { ...defaultPointsBalances(), ...profile.existingPoints };
  const partner = { ...defaultPointsBalances(), ...profile.partnerPoints };
  const fromStack = stackPointsByProgram(offers);

  const programs = new Set([
    ...Object.keys(PROGRAMS),
    ...Object.keys(existing),
    ...Object.keys(fromStack),
  ]);

  const lines = [];
  let totalPoints = 0;
  let totalUsd = 0;

  programs.forEach((prog) => {
    const meta = PROGRAMS[prog];
    if (!meta) return;
    const yours = n(existing[prog]);
    const spouse = profile.poolHousehold !== false ? n(partner[prog]) : 0;
    const stack = n(fromStack[prog]);
    const total = yours + spouse + stack;
    if (total <= 0) return;

    const val = programPointValue(prog, total, transferBonusPct);
    totalPoints += total;
    totalUsd += val.portalUsd;

    const best = TRANSFER_RULES
      .filter((r) => r.from === prog)
      .map((r) => PARTNERS[r.to])
      .filter(Boolean)
      .sort((a, b) => b.cpp - a.cpp)[0];

    lines.push({
      program: prog,
      meta,
      yours,
      spouse,
      stack,
      total,
      usd: val.portalUsd,
      cpp: val.portalCpp,
      portalUsd: val.portalUsd,
      transferUsd: val.transferUsd,
      upliftUsd: Math.max(0, val.transferUsd - val.portalUsd),
      bestPartner: best || null,
      transferCpp: val.transferCpp,
    });
  });

  const totalTravelUsd = lines.reduce((s, l) => s + (l.transferUsd || l.usd), 0);

  return {
    lines: lines.sort((a, b) => b.total - a.total),
    totalPoints,
    totalUsd,
    totalTravelUsd,
    byProgram: Object.fromEntries(lines.map((l) => [l.program, l.total])),
    fromStack,
    existing,
    partner,
  };
}

export function transferPartnersFor(programId) {
  return TRANSFER_RULES
    .filter((r) => r.from === programId)
    .map((r) => ({
      ...r,
      partner: PARTNERS[r.to],
    }))
    .filter((r) => r.partner);
}

export function allTransferMatrix() {
  return Object.keys(PROGRAMS)
    .filter((p) => PROGRAMS[p].transferable)
    .map((programId) => ({
      program: PROGRAMS[programId],
      partners: transferPartnersFor(programId),
    }));
}

/** How to book a dream trip using pooled currencies */
export function tripTransferPlan(tripId, wallet) {
  const trip = DREAM_TRIPS.find((t) => t.id === tripId);
  const playbook = TRIP_PLAYBOOKS[tripId];
  if (!trip || !playbook) return null;

  const steps = [];
  const byProgram = wallet.byProgram || {};

  const allocate = (segment, label) => {
    if (!segment) return;
    const partner = PARTNERS[segment.partner];
    const prog = PROGRAMS[segment.program];
    const available = n(byProgram[segment.program]);
    const need = segment.estPoints || 0;
    const covered = available >= need;
    steps.push({
      label,
      partner,
      program: prog,
      estPoints: need,
      available,
      covered,
      ratio: '1:1',
      time: TRANSFER_RULES.find((r) => r.from === segment.program && r.to === segment.partner)?.time || 'Instant',
      note: segment.note,
      gap: covered ? 0 : need - available,
    });
  };

  allocate(playbook.flight, 'Flights');
  allocate(playbook.hotel, 'Hotel');
  if (playbook.altFlight) allocate(playbook.altFlight, 'Alt flights');
  if (playbook.altHotel) allocate(playbook.altHotel, 'Alt hotel');

  const totalNeed = steps.filter((s) => s.label === 'Flights' || s.label === 'Hotel').reduce((s, x) => s + x.estPoints, 0);
  const totalHave = wallet.totalPoints || 0;

  return {
    trip,
    playbook,
    steps,
    totalNeed,
    totalHave,
    feasible: steps.filter((s) => s.label === 'Flights' || s.label === 'Hotel').every((s) => s.covered),
    caption: playbook.caption,
  };
}

/** Suggest best trip given wallet */
export function bestTripsForWallet(wallet) {
  return DREAM_TRIPS.map((trip) => {
    const plan = tripTransferPlan(trip.id, wallet);
    if (!plan) return { trip, score: 0 };
    const flight = plan.steps.find((s) => s.label === 'Flights');
    const hotel = plan.steps.find((s) => s.label === 'Hotel');
    const flightPct = flight ? Math.min(100, Math.round((flight.available / flight.estPoints) * 100)) : 0;
    const hotelPct = hotel ? Math.min(100, Math.round((hotel.available / hotel.estPoints) * 100)) : 0;
    const score = Math.round((flightPct + hotelPct) / 2);
    return { trip, plan, score, flightPct, hotelPct };
  }).sort((a, b) => b.score - a.score);
}

export function crossProgramSummary(wallet) {
  const progs = wallet.lines.filter((l) => l.meta.transferable);
  if (progs.length < 2) {
    return progs.length
      ? `All ${progs[0].meta.short} points — transfer to one partner or use portal.`
      : 'Add cards to your stack to see cross-program options.';
  }
  const names = progs.map((p) => p.meta.short).join(' + ');
  const topPartners = ['hyatt', 'united', 'flyingblue', 'marriott'];
  const shared = topPartners.filter((pid) =>
    progs.every((p) => transferPartnersFor(p.program).some((t) => t.to === pid)),
  );
  if (shared.length) {
    const pnames = shared.map((id) => PARTNERS[id].name).join(', ');
    return `${names} don’t mix directly — but both transfer to ${pnames}. Pool at the loyalty account.`;
  }
  return `${names} power different partners — typical play: UR → hotel, MR → flights (or vice versa).`;
}