/** Live offers feed loader, inbox, compare vs queue */

const FEED_URL = './data/offers-feed.json';
const FEED_HASH_KEY = 'promo_feed_hash_seen';
const FEED_FETCHED_KEY = 'promo_feed_fetched_at';

let cachedFeed = null;

export async function loadOffersFeed(force = false) {
  if (cachedFeed && !force) return cachedFeed;
  const url = force ? `${FEED_URL}?t=${Date.now()}` : FEED_URL;
  const res = await fetch(url, { cache: force ? 'no-store' : 'default' });
  if (!res.ok) throw new Error(`Feed load failed (${res.status})`);
  cachedFeed = await res.json();
  localStorage.setItem(FEED_FETCHED_KEY, new Date().toISOString());
  return cachedFeed;
}

export function feedHasUpdates(feed) {
  const seen = localStorage.getItem(FEED_HASH_KEY);
  return !!(feed?.meta?.hash && feed.meta.hash !== seen);
}

export function markFeedSeen(feed) {
  if (feed?.meta?.hash) localStorage.setItem(FEED_HASH_KEY, feed.meta.hash);
}

export function allFeedDeals(feed) {
  if (!feed) return [];
  return [
    ...(feed.cards || []).map((d) => ({ ...d, feedKind: 'card' })),
    ...(feed.banks || []).map((d) => ({ ...d, feedKind: 'bank' })),
    ...(feed.portals || []).map((d) => ({ ...d, feedKind: 'portal' })),
    ...(feed.transferBonuses || []).map((d) => ({ ...d, feedKind: 'transfer' })),
    ...(feed.docAlerts || []).map((d) => ({ ...d, feedKind: 'doc' })),
  ];
}

export function filterFeedDeals(deals, { type = 'all', issuer = 'all', search = '' } = {}) {
  const q = search.trim().toLowerCase();
  return deals.filter((d) => {
    if (type !== 'all' && d.type !== type) return false;
    if (issuer !== 'all' && d.issuer !== issuer) return false;
    if (q && !`${d.title} ${d.issuer} ${d.name || ''}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** Compare live feed cards to queued offers */
export function compareFeedToQueue(feed, offers) {
  const queuedByCatalog = Object.fromEntries(
    offers.filter((o) => o.catalogId).map((o) => [o.catalogId, o]),
  );
  const queuedIds = new Set(offers.map((o) => o.catalogId).filter(Boolean));

  const upgraded = [];
  const inQueue = [];
  const available = [];

  (feed?.cards || []).forEach((card) => {
    const queued = queuedByCatalog[card.catalogId];
    if (!queued) {
      available.push({ ...card, compare: 'new' });
      return;
    }
    const qVal = queued.valueUsd || 0;
    const fVal = card.valueUsd || 0;
    if (fVal > qVal + 25) {
      upgraded.push({ feed: card, queued, delta: fVal - qVal, compare: 'upgraded' });
    } else {
      inQueue.push({ feed: card, queued, compare: 'queued' });
    }
  });

  const staleQueued = offers.filter(
    (o) => o.catalogId && o.status !== 'done' && !feed?.cards?.some((c) => c.catalogId === o.catalogId),
  );

  return { upgraded, inQueue, available, staleQueued };
}

export function feedEntryToOffer(entry, priority = 5) {
  if (entry.catalogId) {
    return null;
  }
  return {
    id: crypto.randomUUID(),
    feedId: entry.feedId,
    type: entry.type === 'transfer_bonus' ? 'travel' : entry.type,
    title: entry.title,
    issuer: entry.issuer || 'Other',
    valueUsd: entry.valueUsd || 0,
    hardPull: entry.hardPull ?? false,
    minSpend: entry.msr || entry.minSpend || 0,
    msrMonths: entry.msrMonths || 3,
    creditLine: entry.creditLine || 0,
    annualFee: entry.annualFee || 0,
    status: 'planned',
    priority,
    earliestDate: '',
    completedDate: '',
    notes: [entry.notes, entry.sourceUrl ? `Source: ${entry.sourceUrl}` : ''].filter(Boolean).join(' · '),
    sourceUrl: entry.sourceUrl,
  };
}

export function formatFeedAge(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}