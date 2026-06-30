/** Card & bonus catalog — verify current offers before applying */

export const POINT_VALUES = {
  chase_ur: 0.015,
  amex_mr: 0.012,
  citi_ty: 0.014,
  capone: 0.01,
  discover: 0.01,
  bofa: 0.01,
  usbank: 0.012,
  wells: 0.01,
  pnc: 0.008,
  penfed: 0.009,
  navy: 0.008,
  dcu: 0.008,
  apple: 0.01,
  sofi: 0.01,
  sync: 0.01,
  regional: 0.008,
  default: 0.01,
};

export const CATALOG_CATEGORIES = {
  all: 'All categories',
  national: 'National banks',
  regional: 'Regional banks',
  cu: 'Credit unions',
  fintech: 'Fintech / neo-bank',
  store: 'Store & co-brand',
  business: 'Business',
  secured: 'Secured / rebuild',
};

export function pointsToUsd(points, program) {
  const cpp = POINT_VALUES[program] || POINT_VALUES.default;
  return Math.round(points * cpp);
}

/** @type {Array<object>} */
export const CARD_CATALOG = [
  // —— National ——
  { id: 'chase-csp', category: 'national', issuer: 'Chase', name: 'Sapphire Preferred', network: 'Visa', program: 'chase_ur', subPoints: 75000, subCash: 0, msr: 5000, msrMonths: 3, annualFee: 95, hardPull: true, creditLine: 10000, tags: ['travel', 'dining'] },
  { id: 'chase-csr', category: 'national', issuer: 'Chase', name: 'Sapphire Reserve', network: 'Visa', program: 'chase_ur', subPoints: 60000, subCash: 0, msr: 5000, msrMonths: 3, annualFee: 550, hardPull: true, creditLine: 15000, tags: ['travel', 'premium'] },
  { id: 'chase-cfu', category: 'national', issuer: 'Chase', name: 'Freedom Unlimited', network: 'Visa', program: 'chase_ur', subPoints: 20000, subCash: 0, msr: 500, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['cashback'] },
  { id: 'chase-cff', category: 'national', issuer: 'Chase', name: 'Freedom Flex', network: 'Mastercard', program: 'chase_ur', subPoints: 20000, subCash: 0, msr: 500, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['rotating'] },
  { id: 'chase-united', category: 'national', issuer: 'Chase', name: 'United Explorer', network: 'Visa', program: 'chase_ur', subPoints: 60000, subCash: 0, msr: 3000, msrMonths: 3, annualFee: 95, hardPull: true, creditLine: 10000, tags: ['airline'] },
  { id: 'chase-ihg', category: 'national', issuer: 'Chase', name: 'IHG One Rewards Premier', network: 'Mastercard', program: 'chase_ur', subPoints: 140000, subCash: 0, msr: 3000, msrMonths: 3, annualFee: 99, hardPull: true, creditLine: 10000, tags: ['hotel'] },
  { id: 'chase-amazon', category: 'store', issuer: 'Chase', name: 'Amazon Prime Visa', network: 'Visa', program: null, subPoints: 0, subCash: 150, msr: 0, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['store', 'amazon', 'cashback'] },

  { id: 'amex-gold', category: 'national', issuer: 'Amex', name: 'Gold Card', network: 'Amex', program: 'amex_mr', subPoints: 90000, subCash: 0, msr: 6000, msrMonths: 6, annualFee: 325, hardPull: true, creditLine: 0, charge: true, tags: ['dining', 'grocery'] },
  { id: 'amex-plat', category: 'national', issuer: 'Amex', name: 'Platinum', network: 'Amex', program: 'amex_mr', subPoints: 80000, subCash: 0, msr: 8000, msrMonths: 6, annualFee: 695, hardPull: true, creditLine: 0, charge: true, tags: ['travel', 'premium'] },
  { id: 'amex-bbp', category: 'business', issuer: 'Amex', name: 'Blue Business Plus', network: 'Amex', program: 'amex_mr', subPoints: 75000, subCash: 0, msr: 15000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 12000, tags: ['business', '2x'] },
  { id: 'amex-bcp', category: 'national', issuer: 'Amex', name: 'Blue Cash Preferred', network: 'Amex', program: null, subPoints: 0, subCash: 350, msr: 3000, msrMonths: 6, annualFee: 95, hardPull: true, creditLine: 8000, tags: ['cashback'] },
  { id: 'amex-delta', category: 'national', issuer: 'Amex', name: 'Delta Gold', network: 'Amex', program: 'amex_mr', subPoints: 70000, subCash: 0, msr: 3000, msrMonths: 6, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['airline'] },
  { id: 'amex-hilton', category: 'national', issuer: 'Amex', name: 'Hilton Honors Surpass', network: 'Amex', program: 'amex_mr', subPoints: 130000, subCash: 0, msr: 3000, msrMonths: 6, annualFee: 150, hardPull: true, creditLine: 8000, tags: ['hotel'] },

  { id: 'citi-premier', category: 'national', issuer: 'Citi', name: 'Strata Premier', network: 'Mastercard', program: 'citi_ty', subPoints: 60000, subCash: 0, msr: 4000, msrMonths: 3, annualFee: 95, hardPull: true, creditLine: 10000, tags: ['travel'] },
  { id: 'citi-custom', category: 'national', issuer: 'Citi', name: 'Custom Cash', network: 'Mastercard', program: 'citi_ty', subPoints: 20000, subCash: 0, msr: 1500, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['cashback'] },
  { id: 'citi-double', category: 'national', issuer: 'Citi', name: 'Double Cash', network: 'Mastercard', program: 'citi_ty', subPoints: 20000, subCash: 200, msr: 1500, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['2x'] },
  { id: 'citi-costco', category: 'store', issuer: 'Citi', name: 'Costco Anywhere Visa', network: 'Visa', program: null, subPoints: 0, subCash: 0, msr: 0, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 10000, tags: ['store', 'costco', 'gas', 'cashback'] },
  { id: 'citi-strata-premier', category: 'national', issuer: 'Citi', name: 'Strata Premier', network: 'Mastercard', program: 'citi_ty', subPoints: 60000, subCash: 0, msr: 4000, msrMonths: 3, annualFee: 95, hardPull: true, creditLine: 10000, tags: ['travel', 'transfer'] },

  { id: 'discover-it', category: 'national', issuer: 'Discover', name: 'it Cash Back', network: 'Discover', program: 'discover', subPoints: 0, subCash: 0, msr: 0, msrMonths: 12, annualFee: 0, hardPull: true, creditLine: 5000, cashbackMatch: true, tags: ['match', 'rotating'] },
  { id: 'discover-miles', category: 'national', issuer: 'Discover', name: 'it Miles', network: 'Discover', program: 'discover', subPoints: 0, subCash: 0, msr: 0, msrMonths: 12, annualFee: 0, hardPull: true, creditLine: 5000, cashbackMatch: true, tags: ['match'] },
  { id: 'discover-secured', category: 'secured', issuer: 'Discover', name: 'it Secured', network: 'Discover', program: 'discover', subPoints: 0, subCash: 0, msr: 0, msrMonths: 12, annualFee: 0, hardPull: true, creditLine: 500, tags: ['secured', 'rebuild'] },

  { id: 'capone-venture', category: 'national', issuer: 'Capital One', name: 'Venture', network: 'Visa', program: 'capone', subPoints: 75000, subCash: 0, msr: 4000, msrMonths: 3, annualFee: 95, hardPull: true, creditLine: 10000, tags: ['travel'] },
  { id: 'capone-savor', category: 'national', issuer: 'Capital One', name: 'SavorOne', network: 'Mastercard', program: 'capone', subPoints: 0, subCash: 200, msr: 500, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['dining'] },
  { id: 'capone-quicksilver', category: 'national', issuer: 'Capital One', name: 'Quicksilver', network: 'Mastercard', program: 'capone', subPoints: 20000, subCash: 0, msr: 500, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['1.5x'] },

  { id: 'bofa-premium', category: 'national', issuer: 'Bank of America', name: 'Premium Rewards', network: 'Visa', program: 'bofa', subPoints: 60000, subCash: 0, msr: 4000, msrMonths: 3, annualFee: 95, hardPull: true, creditLine: 12000, tags: ['travel'] },
  { id: 'bofa-customized', category: 'national', issuer: 'Bank of America', name: 'Customized Cash', network: 'Visa', program: 'bofa', subPoints: 0, subCash: 200, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 6000, tags: ['cashback'] },
  { id: 'bofa-unlimited', category: 'national', issuer: 'Bank of America', name: 'Unlimited Cash', network: 'Visa', program: 'bofa', subPoints: 0, subCash: 200, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 6000, tags: ['1.5x'] },

  { id: 'wf-autograph', category: 'national', issuer: 'Wells Fargo', name: 'Autograph', network: 'Visa', program: 'wells', subPoints: 20000, subCash: 0, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['travel', '3x'] },
  { id: 'wf-active-cash', category: 'national', issuer: 'Wells Fargo', name: 'Active Cash', network: 'Visa', program: 'wells', subPoints: 0, subCash: 200, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['2x'] },

  { id: 'usb-altitude', category: 'national', issuer: 'US Bank', name: 'Altitude Connect', network: 'Visa', program: 'usbank', subPoints: 50000, subCash: 0, msr: 2000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 10000, tags: ['travel'] },
  { id: 'usb-shopper', category: 'national', issuer: 'US Bank', name: 'Shopper Cash', network: 'Visa', program: 'usbank', subPoints: 0, subCash: 200, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['cashback'] },
  { id: 'usb-altitude-reserve', category: 'national', issuer: 'US Bank', name: 'Altitude Reserve', network: 'Visa', program: 'usbank', subPoints: 50000, subCash: 0, msr: 4500, msrMonths: 3, annualFee: 400, hardPull: true, creditLine: 15000, tags: ['travel', 'premium'] },

  { id: 'barc-jetblue', category: 'national', issuer: 'Barclays', name: 'JetBlue Plus', network: 'Mastercard', program: 'regional', subPoints: 60000, subCash: 0, msr: 1000, msrMonths: 3, annualFee: 99, hardPull: true, creditLine: 8000, tags: ['airline'] },
  { id: 'barc-wyndham', category: 'national', issuer: 'Barclays', name: 'Wyndham Earner Plus', network: 'Visa', program: 'regional', subPoints: 45000, subCash: 0, msr: 1000, msrMonths: 3, annualFee: 75, hardPull: true, creditLine: 8000, tags: ['hotel'] },

  // —— Regional ——
  { id: 'pnc-cash', category: 'regional', issuer: 'PNC', name: 'Cash Rewards Visa', network: 'Visa', program: 'pnc', subPoints: 0, subCash: 200, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['cashback'] },
  { id: 'pnc-points', category: 'regional', issuer: 'PNC', name: 'Points Visa', network: 'Visa', program: 'pnc', subPoints: 40000, subCash: 0, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['travel'] },

  { id: 'td-double', category: 'regional', issuer: 'TD Bank', name: 'Double Up', network: 'Visa', program: 'regional', subPoints: 0, subCash: 200, msr: 1500, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['2x'] },
  { id: 'td-target', category: 'store', issuer: 'TD Bank', name: 'Target RedCard Credit', network: 'Mastercard', program: 'regional', subPoints: 0, subCash: 0, msr: 0, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 3000, tags: ['store', 'target', '5pct'] },

  { id: 'truist-enjoy', category: 'regional', issuer: 'Truist', name: 'Enjoy Cash', network: 'Visa', program: 'regional', subPoints: 0, subCash: 200, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['cashback'] },
  { id: 'truist-travel', category: 'regional', issuer: 'Truist', name: 'Enjoy Travel', network: 'Visa', program: 'regional', subPoints: 30000, subCash: 0, msr: 3000, msrMonths: 3, annualFee: 89, hardPull: true, creditLine: 8000, tags: ['travel'] },

  { id: 'regions-explore', category: 'regional', issuer: 'Regions', name: 'Explore Visa', network: 'Visa', program: 'regional', subPoints: 30000, subCash: 0, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['travel'] },
  { id: 'regions-cash', category: 'regional', issuer: 'Regions', name: 'Cash Rewards', network: 'Visa', program: 'regional', subPoints: 0, subCash: 200, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['cashback'] },

  { id: '53-cash', category: 'regional', issuer: 'Fifth Third', name: '1% Cash Back', network: 'Mastercard', program: 'regional', subPoints: 0, subCash: 200, msr: 500, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['cashback'] },
  { id: 'huntington-voice', category: 'regional', issuer: 'Huntington', name: 'Voice Rewards', network: 'Mastercard', program: 'regional', subPoints: 0, subCash: 200, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['choice-category'] },
  { id: 'bmo-cashback', category: 'regional', issuer: 'BMO', name: 'CashBack Mastercard', network: 'Mastercard', program: 'regional', subPoints: 0, subCash: 200, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['cashback'] },

  // —— Credit unions ——
  { id: 'nfcu-more', category: 'cu', issuer: 'Navy Federal', name: 'More Rewards Amex', network: 'Amex', program: 'navy', subPoints: 20000, subCash: 0, msr: 2000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['cu', '3x'] },
  { id: 'nfcu-cash', category: 'cu', issuer: 'Navy Federal', name: 'cashRewards', network: 'Visa', program: 'navy', subPoints: 0, subCash: 250, msr: 2000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['cu', 'cashback'] },
  { id: 'nfcu-flagship', category: 'cu', issuer: 'Navy Federal', name: 'Flagship Rewards', network: 'Visa', program: 'navy', subPoints: 30000, subCash: 0, msr: 3000, msrMonths: 3, annualFee: 49, hardPull: true, creditLine: 10000, tags: ['cu', 'travel'] },

  { id: 'penfed-pathfinder', category: 'cu', issuer: 'PenFed', name: 'Pathfinder Rewards', network: 'Amex', program: 'penfed', subPoints: 50000, subCash: 0, msr: 3000, msrMonths: 3, annualFee: 95, hardPull: true, creditLine: 10000, tags: ['cu', 'travel'] },
  { id: 'penfed-power', category: 'cu', issuer: 'PenFed', name: 'Power Cash Rewards', network: 'Visa', program: 'penfed', subPoints: 0, subCash: 100, msr: 1500, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['cu', '2x'] },

  { id: 'dcu-platinum', category: 'cu', issuer: 'DCU', name: 'Visa Platinum', network: 'Visa', program: 'dcu', subPoints: 0, subCash: 0, msr: 0, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['cu', 'low-rate'] },
  { id: 'dcu-cash', category: 'cu', issuer: 'DCU', name: 'Visa Cash Back', network: 'Visa', program: 'dcu', subPoints: 0, subCash: 200, msr: 2000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['cu', 'cashback'] },

  { id: 'alliant-sig', category: 'cu', issuer: 'Alliant', name: 'Visa Signature Cashback', network: 'Visa', program: 'regional', subPoints: 0, subCash: 100, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['cu', '2.5x'] },
  { id: 'andrews-globe', category: 'cu', issuer: 'Andrews FCU', name: 'GlobeTrek Rewards', network: 'Visa', program: 'regional', subPoints: 30000, subCash: 0, msr: 3000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['cu', 'travel'] },

  // —— Fintech ——
  { id: 'apple-card', category: 'fintech', issuer: 'Goldman Sachs', name: 'Apple Card', network: 'Mastercard', program: 'apple', subPoints: 0, subCash: 0, msr: 0, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['fintech', 'daily-cash'] },
  { id: 'sofi-unlimited', category: 'fintech', issuer: 'SoFi', name: 'Unlimited 2%', network: 'Mastercard', program: 'sofi', subPoints: 0, subCash: 200, msr: 3000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['fintech', '2x'] },
  { id: 'sofi-essential', category: 'fintech', issuer: 'SoFi', name: 'Essential Card', network: 'Mastercard', program: 'sofi', subPoints: 0, subCash: 100, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['fintech'] },

  // —— Store & co-brand ——
  { id: 'sync-paypal', category: 'store', issuer: 'Synchrony', name: 'PayPal Cashback Mastercard', network: 'Mastercard', program: 'sync', subPoints: 0, subCash: 0, msr: 0, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['store', '2x'] },
  { id: 'sync-venmo', category: 'store', issuer: 'Synchrony', name: 'Venmo Credit Card', network: 'Visa', program: 'sync', subPoints: 0, subCash: 0, msr: 0, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['store', 'cashback'] },
  { id: 'sync-lowes', category: 'store', issuer: 'Synchrony', name: "Lowe's Advantage", network: 'Mastercard', program: 'sync', subPoints: 0, subCash: 0, msr: 0, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['store', '5pct'] },
  { id: 'sync-sams', category: 'store', issuer: 'Synchrony', name: "Sam's Club Mastercard", network: 'Mastercard', program: 'sync', subPoints: 0, subCash: 30, msr: 0, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['store', 'gas'] },

  { id: 'bread-bjs', category: 'store', issuer: 'Bread Financial', name: "BJ's One Mastercard", network: 'Mastercard', program: 'sync', subPoints: 0, subCash: 0, msr: 0, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['store', 'warehouse'] },
  { id: 'comenity-ulta', category: 'store', issuer: 'Comenity', name: 'Ultamate Rewards Mastercard', network: 'Mastercard', program: 'sync', subPoints: 0, subCash: 0, msr: 0, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 3000, tags: ['store', 'beauty'] },

  { id: 'elan-fidelity', category: 'cu', issuer: 'Elan', name: 'Fidelity Rewards Visa (Elan)', network: 'Visa', program: 'regional', subPoints: 0, subCash: 200, msr: 3000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 10000, tags: ['elan', '2x', 'invest'] },

  // —— Business ——
  { id: 'chase-ink-cash', category: 'business', issuer: 'Chase', name: 'Ink Business Cash', network: 'Visa', program: 'chase_ur', subPoints: 75000, subCash: 0, msr: 6000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 10000, tags: ['business', '5x'] },
  { id: 'chase-ink-unlimited', category: 'business', issuer: 'Chase', name: 'Ink Business Unlimited', network: 'Visa', program: 'chase_ur', subPoints: 75000, subCash: 0, msr: 6000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 10000, tags: ['business', '1.5x'] },
  { id: 'amex-bgr', category: 'business', issuer: 'Amex', name: 'Business Gold', network: 'Amex', program: 'amex_mr', subPoints: 100000, subCash: 0, msr: 15000, msrMonths: 3, annualFee: 375, hardPull: true, creditLine: 0, charge: true, tags: ['business'] },

  // —— Specialty / rebuild ——
  { id: 'fnbo-getaway', category: 'national', issuer: 'FNBO', name: 'Getaway Visa', network: 'Visa', program: 'regional', subPoints: 25000, subCash: 0, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['travel'] },
  { id: 'creditone-plat', category: 'secured', issuer: 'Credit One', name: 'Platinum Visa', network: 'Visa', program: 'regional', subPoints: 0, subCash: 0, msr: 0, msrMonths: 3, annualFee: 39, hardPull: true, creditLine: 500, tags: ['rebuild', 'fee-heavy'] },
  { id: 'firsttech-choice', category: 'cu', issuer: 'First Tech FCU', name: 'Choice Rewards', network: 'Visa', program: 'regional', subPoints: 20000, subCash: 0, msr: 2000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['cu'] },
];

export function catalogEntryToOffer(card, priority = 5) {
  const valueUsd = card.subCash || pointsToUsd(card.subPoints, card.program);
  const matchNote = card.cashbackMatch ? ' · Cashback Match year 1' : '';
  return {
    id: crypto.randomUUID(),
    catalogId: card.id,
    type: 'cc',
    title: `${card.name} — ${card.subPoints ? `${(card.subPoints / 1000).toFixed(0)}k pts` : `$${card.subCash}`}`,
    issuer: card.issuer,
    valueUsd,
    subPoints: card.subPoints,
    program: card.program,
    hardPull: card.hardPull,
    minSpend: card.msr,
    msrMonths: card.msrMonths,
    creditLine: card.creditLine,
    annualFee: card.annualFee,
    charge: card.charge,
    status: 'planned',
    priority,
    earliestDate: '',
    completedDate: '',
    notes: card.msr
      ? `Spend $${card.msr.toLocaleString()} in ${card.msrMonths} mo to earn bonus${matchNote}. Est. cash value uses ~${(POINT_VALUES[card.program] * 100).toFixed(1)}¢ per point.`
      : `No minimum spend${matchNote}. Est. cash value uses ~${(POINT_VALUES[card.program] * 100).toFixed(1)}¢ per point.`,
  };
}

export function findCatalog(id) {
  return CARD_CATALOG.find((c) => c.id === id);
}

export function filterCatalog(issuer = 'all', category = 'all') {
  let list = CARD_CATALOG;
  if (issuer && issuer !== 'all') list = list.filter((c) => c.issuer === issuer);
  if (category && category !== 'all') list = list.filter((c) => (c.category || 'national') === category);
  return list;
}