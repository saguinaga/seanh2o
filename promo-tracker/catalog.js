/** Card & bonus catalog — verify current offers before applying */

export const POINT_VALUES = {
  chase_ur: 0.015,
  amex_mr: 0.012,
  citi_ty: 0.014,
  capone: 0.01,
  discover: 0.01,
  bofa: 0.01,
  usbank: 0.012,
  default: 0.01,
};

export function pointsToUsd(points, program) {
  const cpp = POINT_VALUES[program] || POINT_VALUES.default;
  return Math.round(points * cpp);
}

/** @type {Array<object>} */
export const CARD_CATALOG = [
  { id: 'chase-csp', issuer: 'Chase', name: 'Sapphire Preferred', network: 'Visa', program: 'chase_ur', subPoints: 75000, subCash: 0, msr: 5000, msrMonths: 3, annualFee: 95, hardPull: true, creditLine: 10000, tags: ['travel', 'dining'] },
  { id: 'chase-csr', issuer: 'Chase', name: 'Sapphire Reserve', network: 'Visa', program: 'chase_ur', subPoints: 60000, subCash: 0, msr: 5000, msrMonths: 3, annualFee: 550, hardPull: true, creditLine: 15000, tags: ['travel', 'premium'] },
  { id: 'chase-cfu', issuer: 'Chase', name: 'Freedom Unlimited', network: 'Visa', program: 'chase_ur', subPoints: 20000, subCash: 0, msr: 500, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['cashback'] },
  { id: 'chase-cff', issuer: 'Chase', name: 'Freedom Flex', network: 'Mastercard', program: 'chase_ur', subPoints: 20000, subCash: 0, msr: 500, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['rotating'] },
  { id: 'chase-united', issuer: 'Chase', name: 'United Explorer', network: 'Visa', program: 'chase_ur', subPoints: 60000, subCash: 0, msr: 3000, msrMonths: 3, annualFee: 95, hardPull: true, creditLine: 10000, tags: ['airline'] },
  { id: 'chase-ihg', issuer: 'Chase', name: 'IHG One Rewards Premier', network: 'Mastercard', program: 'chase_ur', subPoints: 140000, subCash: 0, msr: 3000, msrMonths: 3, annualFee: 99, hardPull: true, creditLine: 10000, tags: ['hotel'] },

  { id: 'amex-gold', issuer: 'Amex', name: 'Gold Card', network: 'Amex', program: 'amex_mr', subPoints: 90000, subCash: 0, msr: 6000, msrMonths: 6, annualFee: 325, hardPull: true, creditLine: 0, charge: true, tags: ['dining', 'grocery'] },
  { id: 'amex-plat', issuer: 'Amex', name: 'Platinum', network: 'Amex', program: 'amex_mr', subPoints: 80000, subCash: 0, msr: 8000, msrMonths: 6, annualFee: 695, hardPull: true, creditLine: 0, charge: true, tags: ['travel', 'premium'] },
  { id: 'amex-bbp', issuer: 'Amex', name: 'Blue Business Plus', network: 'Amex', program: 'amex_mr', subPoints: 75000, subCash: 0, msr: 15000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 12000, tags: ['business', '2x'] },
  { id: 'amex-bcp', issuer: 'Amex', name: 'Blue Cash Preferred', network: 'Amex', program: 'amex_mr', subPoints: 0, subCash: 350, msr: 3000, msrMonths: 6, annualFee: 95, hardPull: true, creditLine: 8000, tags: ['cashback'] },
  { id: 'amex-delta', issuer: 'Amex', name: 'Delta Gold', network: 'Amex', program: 'amex_mr', subPoints: 70000, subCash: 0, msr: 3000, msrMonths: 6, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['airline'] },

  { id: 'citi-premier', issuer: 'Citi', name: 'Strata Premier', network: 'Mastercard', program: 'citi_ty', subPoints: 60000, subCash: 0, msr: 4000, msrMonths: 3, annualFee: 95, hardPull: true, creditLine: 10000, tags: ['travel'] },
  { id: 'citi-custom', issuer: 'Citi', name: 'Custom Cash', network: 'Mastercard', program: 'citi_ty', subPoints: 20000, subCash: 0, msr: 1500, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['cashback'] },
  { id: 'citi-double', issuer: 'Citi', name: 'Double Cash', network: 'Mastercard', program: 'citi_ty', subPoints: 20000, subCash: 200, msr: 1500, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 8000, tags: ['2x'] },

  { id: 'discover-it', issuer: 'Discover', name: 'it Cash Back', network: 'Discover', program: 'discover', subPoints: 0, subCash: 0, msr: 0, msrMonths: 12, annualFee: 0, hardPull: true, creditLine: 5000, cashbackMatch: true, tags: ['match', 'rotating'] },
  { id: 'discover-miles', issuer: 'Discover', name: 'it Miles', network: 'Discover', program: 'discover', subPoints: 0, subCash: 0, msr: 0, msrMonths: 12, annualFee: 0, hardPull: true, creditLine: 5000, cashbackMatch: true, tags: ['match'] },

  { id: 'capone-venture', issuer: 'Capital One', name: 'Venture', network: 'Visa', program: 'capone', subPoints: 75000, subCash: 0, msr: 4000, msrMonths: 3, annualFee: 95, hardPull: true, creditLine: 10000, tags: ['travel'] },
  { id: 'capone-savor', issuer: 'Capital One', name: 'SavorOne', network: 'Mastercard', program: 'capone', subPoints: 0, subCash: 200, msr: 500, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['dining'] },

  { id: 'bofa-premium', issuer: 'Bank of America', name: 'Premium Rewards', network: 'Visa', program: 'bofa', subPoints: 60000, subCash: 0, msr: 4000, msrMonths: 3, annualFee: 95, hardPull: true, creditLine: 12000, tags: ['travel'] },
  { id: 'bofa-customized', issuer: 'Bank of America', name: 'Customized Cash', network: 'Visa', program: 'bofa', subPoints: 0, subCash: 200, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 6000, tags: ['cashback'] },

  { id: 'usb-altitude', issuer: 'US Bank', name: 'Altitude Connect', network: 'Visa', program: 'usbank', subPoints: 50000, subCash: 0, msr: 2000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 10000, tags: ['travel'] },
  { id: 'usb-shopper', issuer: 'US Bank', name: 'Shopper Cash', network: 'Visa', program: 'usbank', subPoints: 0, subCash: 200, msr: 1000, msrMonths: 3, annualFee: 0, hardPull: true, creditLine: 5000, tags: ['cashback'] },
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
    status: 'planned',
    priority,
    earliestDate: '',
    completedDate: '',
    notes: `MSR $${card.msr?.toLocaleString() || 0} / ${card.msrMonths}mo${matchNote}. Est. ${(POINT_VALUES[card.program] * 100).toFixed(1)}¢/pt.`,
  };
}

export function findCatalog(id) {
  return CARD_CATALOG.find((c) => c.id === id);
}

export function filterCatalog(issuer) {
  if (!issuer || issuer === 'all') return CARD_CATALOG;
  return CARD_CATALOG.filter((c) => c.issuer === issuer);
}