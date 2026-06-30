/** Dream trips & influencer-style travel-hacking framing */

import { findCatalog, pointsToUsd } from './catalog.js';

export const DREAM_TRIPS = [
  {
    id: 'cabo',
    emoji: '🌅',
    name: 'Cabo long weekend',
    tagline: 'The pool photo every reel starts with',
    cashPrice: 2200,
    nights: 4,
    vibe: 'babymoon · girls trip · anniversary',
  },
  {
    id: 'disney',
    emoji: '🏰',
    name: 'Disney family trip',
    tagline: 'Matching ears, matching credit card apps',
    cashPrice: 3200,
    nights: 5,
    vibe: 'kids · park hopper · memory maker',
  },
  {
    id: 'hawaii',
    emoji: '🌺',
    name: 'Hawaii week',
    tagline: 'Sunset luau content bundle',
    cashPrice: 4800,
    nights: 7,
    vibe: 'honeymoon · milestone birthday',
  },
  {
    id: 'paris',
    emoji: '🗼',
    name: 'Paris long weekend',
    tagline: 'Croissants, Eiffel, “we paid $47 in points”',
    cashPrice: 3600,
    nights: 4,
    vibe: 'Europe · carry-on only',
  },
  {
    id: 'caribbean',
    emoji: '🏝️',
    name: 'Caribbean all-inclusive',
    tagline: 'Turquoise water, unlimited margaritas',
    cashPrice: 2600,
    nights: 5,
    vibe: 'resort · couples · no kids',
  },
  {
    id: 'japan',
    emoji: '🗾',
    name: 'Tokyo & Kyoto',
    tagline: 'Cherry blossoms or ramen — pick your personality',
    cashPrice: 5500,
    nights: 10,
    vibe: 'adventure · food · culture',
  },
  {
    id: 'nyc',
    emoji: '🎄',
    name: 'NYC holiday weekend',
    tagline: 'Rockefeller tree + Broadway flex',
    cashPrice: 1800,
    nights: 3,
    vibe: 'city break · shopping · shows',
  },
  {
    id: 'cruise',
    emoji: '🚢',
    name: 'Caribbean cruise',
    tagline: 'Balcony cabin humble brag',
    cashPrice: 2400,
    nights: 7,
    vibe: 'easy · food included · one bag',
  },
];

/** Pre-built stacks creators love to tease */
export const INFLUENCER_STACKS = [
  {
    id: 'babymoon-cabo',
    name: 'The “free” Cabo babymoon',
    hook: 'Two cards, one long weekend, 200k views',
    emoji: '🌅',
    catalogIds: ['chase-csp', 'amex-gold'],
    caption: 'Open Sapphire Preferred + Amex Gold, hit minimum spend on stuff you already buy, transfer points to Hyatt or book through Chase Travel. Influencers call it free — you’re really swapping organized spending for ~$2k in travel value.',
  },
  {
    id: 'europe-reel',
    name: 'Europe summer reel stack',
    hook: 'Paris hotel + flights narrative',
    emoji: '🗼',
    catalogIds: ['chase-csp', 'chase-ihg', 'amex-gold'],
    caption: 'The classic trifecta: Chase UR for flights, IHG SUB for hotel nights, Amex MR for dining abroad. Stagger apps ~90 days apart so you don’t trip issuer rules.',
  },
  {
    id: 'disney-mom',
    name: 'Disney mom starter pack',
    hook: 'Park tickets + on-property hotel',
    emoji: '🏰',
    catalogIds: ['chase-cfu', 'chase-csp', 'capone-venture'],
    caption: 'Freedom cards for everyday spend, Sapphire for portal redemption, Venture for price-drop protection. Real talk: MSR on three cards while buying Mickey pretzels takes planning.',
  },
  {
    id: 'honeymoon-flex',
    name: 'Honeymoon flex stack',
    hook: 'Overwater bungalow energy (on a budget)',
    emoji: '🌺',
    catalogIds: ['chase-csr', 'amex-plat', 'chase-ihg'],
    caption: 'Premium cards with big SUBs — higher annual fees, bigger aspirational redemptions. Best when your credit score has room to dip temporarily.',
  },
];

export const INFLUENCER_VS_REALITY = [
  {
    reel: '“We flew business class for FREE”',
    reality: 'Points covered the fare after $8k+ in minimum spend and $400–900 in annual fees. Taxes/fees still hit the card.',
  },
  {
    reel: '“Anyone can do this”',
    reality: 'You need good credit (usually 700+), organized spending, and patience between applications.',
  },
  {
    reel: '“Just open this one card”',
    reality: 'The screenshot is card #4 in a 12-month plan. Issuers have hidden velocity rules (5/24, 2/90, etc.).',
  },
  {
    reel: '“Zero dollars out of pocket”',
    reality: 'Minimum spend isn’t extra money if you redirect bills — but it’s not magic. Groceries, daycare, insurance still leave your bank account.',
  },
  {
    reel: '“Doesn’t hurt your credit”',
    reality: 'Each app is a hard pull. Score often dips 10–30+ pts temporarily; util spikes during MSR months.',
  },
];

export function activeOffersValue(offers) {
  return offers
    .filter((o) => !['skip'].includes(o.status))
    .reduce((s, o) => s + (o.valueUsd || 0), 0);
}

export function pipelineValue(offers) {
  return offers
    .filter((o) => !['done', 'skip'].includes(o.status))
    .reduce((s, o) => s + (o.valueUsd || 0), 0);
}

export function capturedValue(offers) {
  return offers
    .filter((o) => o.status === 'done')
    .reduce((s, o) => s + (o.valueUsd || 0), 0);
}

/** MSR + annual fees = real cash layout during the grind */
export function outOfPocketEstimate(offers) {
  let msr = 0;
  let fees = 0;
  offers.filter((o) => !['done', 'skip'].includes(o.status)).forEach((o) => {
    msr += o.minSpend || 0;
    const card = o.catalogId ? findCatalog(o.catalogId) : null;
    fees += o.annualFee ?? card?.annualFee ?? 0;
  });
  return { msr, fees, total: msr + fees, note: 'MSR is spend you were going to make anyway — not “lost” if planned' };
}

export function tripsFundedByValue(valueUsd) {
  const v = Math.max(0, valueUsd || 0);
  return DREAM_TRIPS.map((trip) => {
    const pct = Math.min(100, Math.round((v / trip.cashPrice) * 100));
    let status = 'dream';
    if (pct >= 100) status = 'funded';
    else if (pct >= 55) status = 'almost';
    else if (pct >= 25) status = 'building';
    return { ...trip, fundedPct: pct, status, gap: Math.max(0, trip.cashPrice - v) };
  }).sort((a, b) => b.fundedPct - a.fundedPct);
}

export function cardTripPitch(card) {
  const val = card.subCash || pointsToUsd(card.subPoints, card.program);
  const trips = tripsFundedByValue(val).filter((t) => t.fundedPct >= 40);
  if (trips.length) return `Could cover ~${Math.round(trips[0].fundedPct)}% of a ${trips[0].name}`;
  if (val >= 800) return 'Solid chunk of a weekend getaway';
  if (card.cashbackMatch) return 'Match doubles year-one cashback toward any trip';
  return 'Stack with other SUBs for bigger trips';
}

export function stackFromCatalog(stackId) {
  const stack = INFLUENCER_STACKS.find((s) => s.id === stackId);
  if (!stack) return null;
  return stack.catalogIds.map((id) => findCatalog(id)).filter(Boolean);
}

export function stackTotalValue(catalogIds) {
  return catalogIds.reduce((s, id) => {
    const c = findCatalog(id);
    if (!c) return s;
    return s + (c.subCash || pointsToUsd(c.subPoints, c.program));
  }, 0);
}