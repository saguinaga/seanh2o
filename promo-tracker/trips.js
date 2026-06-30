/** Optional vacation goals — motivation, not the core product */

import { findCatalog, pointsToUsd } from './catalog.js';
import { offerCashValue, offerTravelValue } from './valuation-engine.js';

export const DREAM_TRIPS = [
  { id: 'cabo', emoji: '🌅', name: 'Cabo weekend', cashPrice: 2200 },
  { id: 'disney', emoji: '🏰', name: 'Disney trip', cashPrice: 3200 },
  { id: 'hawaii', emoji: '🌺', name: 'Hawaii week', cashPrice: 4800 },
  { id: 'paris', emoji: '🗼', name: 'Paris weekend', cashPrice: 3600 },
  { id: 'japan', emoji: '🗾', name: 'Japan adventure', cashPrice: 5500 },
];

export function activeOffersValue(offers) {
  return offers
    .filter((o) => !['skip'].includes(o.status))
    .reduce((s, o) => {
      if (o.valueUsd) return s + o.valueUsd;
      if (o.subPoints && o.program) return s + pointsToUsd(o.subPoints, o.program);
      if (o.catalogId) {
        const c = findCatalog(o.catalogId);
        if (c) return s + (c.subCash || pointsToUsd(c.subPoints, c.program));
      }
      return s;
    }, 0);
}

export function tripsFundedByValue(valueUsd) {
  const v = Math.max(0, valueUsd || 0);
  return DREAM_TRIPS.map((trip) => {
    const pct = Math.min(100, Math.round((v / trip.cashPrice) * 100));
    let status = 'dream';
    if (pct >= 100) status = 'funded';
    else if (pct >= 50) status = 'almost';
    else if (pct >= 20) status = 'building';
    return { ...trip, fundedPct: pct, status, gap: Math.max(0, trip.cashPrice - v) };
  }).sort((a, b) => b.fundedPct - a.fundedPct);
}

export function cardTripPitch(card) {
  const fake = { catalogId: card.id, subPoints: card.subPoints, program: card.program, valueUsd: card.subCash };
  const cash = offerCashValue(fake);
  const travel = offerTravelValue(fake);
  if (travel > cash + 50) {
    return `~${fmtUsd(travel)} trip value (${fmtUsd(cash)} cash floor) — transfer partners`;
  }
  return `Est. ${fmtUsd(cash)} — verify live welcome bonus`;
}

function fmtUsd(n) {
  return n >= 1000 ? `$${Math.round(n).toLocaleString()}` : `$${n}`;
}