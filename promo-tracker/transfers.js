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
    portalCpp: 0.0125, // Preferred baseline. Reserve upgrades to 1.5¢ via the playbook context.
    transferable: true,
    poolable: false,
    note: 'Freedom + Sapphire points pool in one Chase login when cards are linked. Portal is 1.25¢ (Preferred) or 1.5¢ (Reserve).',
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
    title: 'What easy to overlook',
    steps: [
      'Transfers are one-way — you cannot move Hyatt points back to Chase.',
      'Marriott, Hilton, IHG SUB points are already in hotel currency (no transfer needed).',
      'Taxes/fees on awards still hit your card (~$5–$150 domestic, more international).',
      'Transfer bonuses (20–30% extra) are periodic — worth waiting before booking a big family trip.',
    ],
  },
];

/** Trip-specific booking paths households use */
export const TRIP_PLAYBOOKS = {
  cabo: {
    flight: { partner: 'southwest', program: 'chase_ur', estPoints: 28000, note: 'UR → Southwest or book via Chase portal' },
    hotel: { partner: 'hyatt', program: 'chase_ur', estPoints: 60000, note: 'UR → Hyatt all-inclusive or HR properties' },
    altHotel: { partner: 'marriott', program: 'amex_mr', estPoints: 70000, note: 'MR → Marriott if Hyatt unavailable' },
    caption: 'Beach week = Southwest flights + Hyatt or Ziva/Zilara on points.',
  },
  paris: {
    flight: { partner: 'flyingblue', program: 'chase_ur', estPoints: 55000, note: 'UR or MR → Flying Blue promo awards' },
    hotel: { partner: 'hyatt', program: 'chase_ur', estPoints: 80000, note: 'UR → Hyatt Paris properties' },
    altFlight: { partner: 'virgin', program: 'amex_mr', estPoints: 50000, note: 'MR → Virgin → Delta to CDG' },
    caption: 'Europe with kids = Flying Blue or Virgin flights + Hyatt/Marriott for the hotel nights.',
  },
  hawaii: {
    flight: { partner: 'united', program: 'chase_ur', estPoints: 45000, note: 'UR → United Saver to HNL/OGG' },
    hotel: { partner: 'hyatt', program: 'chase_ur', estPoints: 90000, note: 'UR → Hyatt resorts (Regency, Andaz)' },
    altHotel: { partner: 'marriott', program: 'amex_mr', estPoints: 100000, note: 'MR → Marriott Wailea / Waikiki' },
    caption: 'Hawaii week = United flights + Hyatt/Marriott beach resort.',
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
  'san-francisco': {
    flight: { partner: 'southwest', program: 'chase_ur', estPoints: 20000, note: 'UR → Southwest or portal' },
    hotel: { partner: 'hyatt', program: 'chase_ur', estPoints: 50000, note: 'UR → Hyatt Regency SF or Fishermans Wharf' },
    caption: 'San Francisco = domestic flight + city hotel on points.',
  },
  norway: {
    flight: { partner: 'united', program: 'chase_ur', estPoints: 55000, note: 'UR → United or Star Alliance to Oslo' },
    hotel: { partner: 'hyatt', program: 'chase_ur', estPoints: 70000, note: 'UR → Hyatt in Oslo or Bergen' },
    altFlight: { partner: 'flyingblue', program: 'chase_ur', estPoints: 50000, note: 'Flying Blue to Scandinavia' },
    caption: 'Norway fjords = United/Star Alliance flights + Hyatt city stays.',
  },
  kenya: {
    flight: { partner: 'united', program: 'chase_ur', estPoints: 65000, note: 'UR → United to Nairobi via Europe or US' },
    hotel: { partner: 'hyatt', program: 'chase_ur', estPoints: 80000, note: 'UR → Hyatt or partner lodges' },
    caption: 'Kenya safari = long-haul flights + lodge stays (mix points + cash).',
  },
  germany: {
    flight: { partner: 'united', program: 'chase_ur', estPoints: 45000, note: 'UR → United to FRA/MUC' },
    hotel: { partner: 'hyatt', program: 'chase_ur', estPoints: 55000, note: 'UR → Hyatt in Berlin or Munich' },
    caption: 'Germany = Star Alliance flights + Hyatt city or castle hotels.',
  },
  italy: {
    flight: { partner: 'flyingblue', program: 'chase_ur', estPoints: 48000, note: 'UR → Flying Blue to Rome or Venice' },
    hotel: { partner: 'hyatt', program: 'chase_ur', estPoints: 65000, note: 'UR → Hyatt Rome, Florence or Venice' },
    caption: 'Italy escape = Flying Blue or United + Hyatt in major cities.',
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

/** Sapphire portal rates vs partner transfer upside */
export const CHASE_SAPPHIRE_PORTAL = {
  'chase-csp': { label: 'Sapphire Preferred', cpp: 0.0125, portalLabel: '1.25¢/pt' },
  'chase-csr': { label: 'Sapphire Reserve', cpp: 0.015, portalLabel: '1.5¢/pt' },
};

/** Chase UR → partner playbook for household travel (not portal-only) */
export const CHASE_UR_PLAYBOOK = {
  headline: 'Your Sapphire unlocks partner transfers — the portal is the floor, not the finish line.',
  subhead: 'Chase Travel pays a fixed cents-per-point rate. Transferring 1:1 to Hyatt, Southwest, or United often stretches the same points into a bigger family trip.',
  portalVsTransfer: [
    { points: 50000, partners: [
      { id: 'portal_csp', label: 'Chase portal (Preferred)', cpp: 0.0125 },
      { id: 'portal_csr', label: 'Chase portal (Reserve)', cpp: 0.015 },
      { id: 'hyatt', label: 'World of Hyatt', cpp: 0.02 },
      { id: 'southwest', label: 'Southwest', cpp: 0.015 },
      { id: 'united', label: 'United', cpp: 0.014 },
    ]},
  ],
  topPlays: [
    {
      partner: 'hyatt',
      title: 'Hyatt — the usual crown jewel',
      why: 'Category 1–4 hotels are often 12k–25k/night. A long weekend can beat portal value by 30–60%.',
      family: 'City hotels in San Francisco or Germany, or nice stays in Italy.',
      how: 'Chase → Ultimate Rewards → Transfer to World of Hyatt (instant, 1:1). Book at hyatt.com with your Hyatt account.',
    },
    {
      partner: 'southwest',
      title: 'Southwest — easy family flights',
      why: 'Domestic & Mexico hops; no change fees; bags often free. Strong when cash fares are high.',
      family: 'Beach week, visiting grandparents, or city trips like San Francisco or Norway.',
      how: 'Transfer UR → Southwest (instant). Book on southwest.com; taxes still on your card (~$5.60/domestic segment).',
    },
    {
      partner: 'united',
      title: 'United — Star Alliance & Hawaii',
      why: 'Saver awards to Hawaii or Europe when you find space; partners into United’s network.',
      family: 'Multi-city trips, lie-flat is aspirational — focus on economy saver for the household.',
      how: 'Transfer UR → United MileagePlus (instant). Search united.com; transfer only after you see award seats.',
    },
  ],
  steps: [
    'Earn on Freedom (or Sapphire categories) — all UR pools in one Chase login when cards are linked.',
    'Log in at chase.com → Ultimate Rewards → “Transfer points to partners”.',
    'Pick the partner (Hyatt / Southwest / United). Transfers are instant and one-way — no undo.',
    'Create a free loyalty account if needed; you can transfer to a spouse’s Hyatt/United number for one booking.',
    'Find award space first, then transfer the exact amount you need (never transfer “just because”).',
    'Book on the partner site/app. Pay taxes/fees on your card; points cover the room or fare.',
  ],
  portalOk: [
    'Small trips where award space is ugly and cash portal price is fine.',
    'You need simplicity more than max value (one login, done).',
    'Reserve travel credit / pay-yourself-back style redemptions on CSR.',
    'San Francisco or Germany city stays when portal price beats hunting awards.',
  ],
  avoid: [
    'Redeeming Freedom points as cash (1¢) while Sapphire is open — pool and transfer instead.',
    'Transferring before confirming hotel nights or flights exist — points are stuck on the partner side.',
    'Using Chase Travel for Hyatt-branded hotels — you’re paying portal rates when Hyatt points would be cheaper.',
    'Ignoring your Freedom pile — that 1.5% everyday spend is UR waiting for a Hyatt transfer.',
  ],
};

/** Build personalized Chase UR playbook context from owned catalog ids */
export function chaseUrPlaybookContext(ownedCards = []) {
  const ids = Array.isArray(ownedCards) ? ownedCards : [];
  const sapphire = ids.includes('chase-csr') ? 'chase-csr' : ids.includes('chase-csp') ? 'chase-csp' : null;
  const portal = sapphire ? CHASE_SAPPHIRE_PORTAL[sapphire] : { label: 'Sapphire (Preferred or Reserve)', cpp: 0.0125, portalLabel: '1.25–1.5¢/pt' };
  const hasFreedom = ids.some((id) => ['chase-cfu', 'chase-cff'].includes(id));
  const chaseRules = TRANSFER_RULES.filter((r) => r.from === 'chase_ur');
  const pts = 75000;
  const portalUsd = Math.round(pts * portal.cpp);
  const hyattUsd = Math.round(pts * (PARTNERS.hyatt?.cpp || 0.02));
  const uplift = hyattUsd - portalUsd;
  return {
    sapphire,
    portal,
    hasFreedom,
    chaseRules,
    examplePoints: pts,
    portalUsd,
    hyattUsd,
    uplift,
    unlocked: !!sapphire,
  };
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