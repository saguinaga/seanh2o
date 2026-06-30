/** Credit gates & sequencing heuristics — educational, not financial advice */
export const ISSUERS = [
  'Chase', 'Amex', 'Citi', 'Capital One', 'Bank of America', 'Wells Fargo', 'US Bank', 'Other',
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
    scoreBand: '720-759',
    cardsOpen: 4,
    cards24mo: 2,
    aaoaYears: 4.5,
    utilizationPct: 12,
    inquiries6mo: 1,
    inquiries12mo: 2,
    inquiries24mo: 3,
    lastHardPull: '',
    notes: '',
  };
}

export function defaultState() {
  return {
    version: 1,
    profile: defaultProfile(),
    offers: [],
    updatedAt: new Date().toISOString(),
  };
}

export function evaluateOffer(offer, profile, allOffers) {
  const warnings = [];
  const blockers = [];
  const today = new Date().toISOString().slice(0, 10);

  if (offer.type === 'cc' && offer.hardPull) {
    if (profile.inquiries6mo >= 3) {
      warnings.push('3+ inquiries in 6 months — many issuers get picky.');
    }
    if (profile.inquiries12mo >= 6) {
      blockers.push('6+ inquiries in 12 months — high rejection risk.');
    }
    if (offer.issuer === 'Chase' && profile.cards24mo >= 5) {
      blockers.push('Chase 5/24: 5+ personal cards in 24 months.');
    }
    if (offer.issuer === 'Amex' && profile.cards24mo >= 2) {
      warnings.push('Amex 2/90 style rule — max ~2 cards / 90 days (issuer discretion).');
    }
    const last = parseDate(profile.lastHardPull);
    if (last) {
      const since = daysBetween(profile.lastHardPull, today);
      if (since !== null && since < 45) {
        warnings.push(`Last hard pull was ${since}d ago — many churners wait 90d between apps.`);
      }
    }
    const sameIssuer = allOffers.filter(
      (o) => o.id !== offer.id && o.status === 'done' && o.issuer === offer.issuer && o.hardPull
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

  if (profile.utilizationPct > 30) {
    warnings.push(`Utilization ${profile.utilizationPct}% — pay down before new apps if possible.`);
  }
  if (profile.aaoaYears < 2 && offer.type === 'cc' && offer.hardPull) {
    warnings.push('AAoA under 2y — premium cards harder; consider bank bonuses first.');
  }

  if (offer.earliestDate && offer.earliestDate > today) {
    blockers.push(`Earliest date: ${offer.earliestDate}`);
  }

  const score = blockers.length ? 'blocked' : warnings.length ? 'caution' : 'clear';
  return { score, warnings, blockers };
}

export function suggestTimeline(offers, profile) {
  const pending = offers
    .filter((o) => !['done', 'skip'].includes(o.status))
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));

  const timeline = [];
  let cursor = profile.lastHardPull || new Date().toISOString().slice(0, 10);

  pending.forEach((o) => {
    if (o.type === 'cc' && o.hardPull) {
      const wait = o.issuer === 'Chase' && profile.cards24mo >= 4 ? 120 : 90;
      const earliest = addDays(cursor, wait);
      timeline.push({
        offerId: o.id,
        title: o.title,
        suggestedDate: o.earliestDate && o.earliestDate > earliest ? o.earliestDate : earliest,
        reason: `${wait}d spacing after prior hard pull`,
      });
      cursor = o.earliestDate && o.earliestDate > earliest ? o.earliestDate : earliest;
    } else {
      timeline.push({
        offerId: o.id,
        title: o.title,
        suggestedDate: o.earliestDate || cursor,
        reason: 'No hard pull — flexible',
      });
    }
  });

  return timeline;
}

export function seedOffers() {
  const y = new Date().toISOString().slice(0, 10);
  return [
    {
      id: crypto.randomUUID(),
      type: 'bank',
      title: 'Checking bonus — $300',
      issuer: 'Other',
      valueUsd: 300,
      hardPull: false,
      minSpend: 1000,
      status: 'planned',
      priority: 1,
      earliestDate: y,
      completedDate: '',
      notes: 'Direct deposit + keep open 90d',
    },
    {
      id: crypto.randomUUID(),
      type: 'cc',
      title: 'Travel card SUB — 60k pts',
      issuer: 'Chase',
      valueUsd: 900,
      hardPull: true,
      minSpend: 4000,
      status: 'idea',
      priority: 2,
      earliestDate: '',
      completedDate: '',
      notes: 'Check 5/24 before applying',
    },
    {
      id: crypto.randomUUID(),
      type: 'shopping',
      title: 'Portal stack — electronics',
      issuer: 'Other',
      valueUsd: 45,
      hardPull: false,
      minSpend: 0,
      status: 'ready',
      priority: 3,
      earliestDate: y,
      completedDate: '',
      notes: 'Rakuten + card category bonus',
    },
  ];
}