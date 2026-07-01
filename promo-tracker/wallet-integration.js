/** Owned-card stack → transfer unlockers, earn routing, keep/cancel guidance */

import { findCatalog } from './catalog.js';
import { PROGRAMS, TRANSFER_RULES, PARTNERS } from './transfers.js';

/** Per-card wallet semantics (catalog id → behavior) */
export const WALLET_META = {
  'chase-csp': {
    rewardType: 'transferable',
    program: 'chase_ur',
    role: 'unlocker',
    unlocksTransfers: true,
    transferRatio: 1,
    hyattRatio: '1:1',
    earnSummary: '3× dining/streaming, 2× travel — unlocks all pooled UR transfers at 1:1',
    verdict: 'keep',
    verdictWhy: 'Your Chase transfer key. World of Hyatt is the headline partner.',
  },
  'chase-csr': {
    rewardType: 'transferable',
    program: 'chase_ur',
    role: 'unlocker',
    unlocksTransfers: true,
    transferRatio: 1,
    hyattRatio: '1:1',
    earnSummary: '3× dining/travel, 1.5¢ Chase portal — full 1:1 Hyatt transfers',
    verdict: 'keep',
    verdictWhy: 'Premium Chase unlocker; best Hyatt transfer ratio in the ecosystem.',
  },
  'chase-cfu': {
    rewardType: 'pooled_ur',
    program: 'chase_ur',
    role: 'earner',
    needsUnlocker: 'chase_ur',
    earnSummary: '1.5% everything — points pool to Sapphire, transfer out via Sapphire',
    verdict: 'keep',
    verdictWhy: 'Strong everyday Chase earner. Only valuable while Sapphire stays open.',
  },
  'chase-cff': {
    rewardType: 'pooled_ur',
    program: 'chase_ur',
    role: 'earner',
    needsUnlocker: 'chase_ur',
    earnSummary: '5% rotating categories, 3% drugstores/dining — pools to Sapphire',
    verdict: 'keep',
    verdictWhy: 'Category booster in the Chase trifecta.',
  },
  'chase-amazon': {
    rewardType: 'cashback',
    program: null,
    role: 'earner',
    earnSummary: '5% Amazon & Whole Foods, 2% restaurants/gas/transit — cash back only',
    verdict: 'keep_if_using',
    verdictWhy: 'Does NOT earn or pool Ultimate Rewards. Keep only if Amazon spend is heavy.',
  },
  'amex-gold': {
    rewardType: 'transferable',
    program: 'amex_mr',
    role: 'unlocker',
    unlocksTransfers: true,
    transferRatio: 1,
    earnSummary: '4× restaurants & U.S. supermarkets — unlocks MR transfers',
    verdict: 'keep',
    verdictWhy: 'Amex transfer key + strong category earn.',
  },
  'amex-plat': {
    rewardType: 'transferable',
    program: 'amex_mr',
    role: 'unlocker',
    unlocksTransfers: true,
    transferRatio: 1,
    earnSummary: '5× flights & hotels via Amex Travel — unlocks MR transfers',
    verdict: 'evaluate_fee',
    verdictWhy: 'Keep if lounge/airline/hotel credits beat the annual fee; otherwise downgrade.',
  },
  'amex-bbp': {
    rewardType: 'transferable',
    program: 'amex_mr',
    role: 'unlocker',
    unlocksTransfers: true,
    transferRatio: 1,
    earnSummary: '2× everything (up to $50k/yr) — no annual fee MR unlocker',
    verdict: 'keep',
    verdictWhy: 'Free MR transfer unlocker; pairs with any other Amex MR card.',
  },
  'amex-bcp': {
    rewardType: 'cashback',
    program: null,
    role: 'earner',
    earnSummary: '6% U.S. supermarkets (up to $6k/yr), 6% streaming, 3% gas/transit — cash back, not transferable MR',
    verdict: 'keep',
    verdictWhy: 'Best-in-class grocery earner. Max the $6k cap yearly — that alone often beats the $95 annual fee.',
    groceryCap: 6000,
  },
  'amex-delta': {
    rewardType: 'airline',
    program: null,
    role: 'co_brand',
    earnSummary: 'Delta SkyMiles — separate from Membership Rewards',
    verdict: 'keep_if_flying_delta',
    verdictWhy: 'Airline miles, not MR. Keep if you fly Delta; otherwise reconsider.',
  },
  'amex-hilton': {
    rewardType: 'hotel',
    program: null,
    role: 'co_brand',
    earnSummary: 'Hilton Honors points — separate from Membership Rewards',
    verdict: 'keep_if_staying_hilton',
    verdictWhy: 'Hotel points, not MR.',
  },
  'citi-double': {
    rewardType: 'ty_earn',
    program: 'citi_ty',
    role: 'earner',
    transferRatio: 0.7,
    canTransferAlone: true,
    needsUnlocker: 'citi_ty_premier',
    earnSummary: '2% on everything (pay-to-earn) — transfers at 70% alone, 100% with Strata Premier',
    verdict: 'keep',
    verdictWhy: 'Best flat-rate earner in your stack. Add Strata Premier when ready for 1:1 transfers.',
  },
  'citi-costco': {
    rewardType: 'cashback',
    program: null,
    role: 'earner',
    earnSummary: '4% gas (cap), 3% travel/restaurants, 2% Costco — cash back only',
    verdict: 'keep_if_using',
    verdictWhy: 'Does not earn transferable ThankYou points. Great if you live at Costco.',
  },
  'citi-strata': {
    rewardType: 'transferable',
    program: 'citi_ty',
    role: 'unlocker',
    unlocksTransfers: true,
    transferRatio: 0.7,
    earnSummary: 'No-fee Citi TY card — transfers at 70% ratio',
    verdict: 'upgrade_path',
    verdictWhy: 'Unlocks TY transfers cheaply but at a haircut; Premier is better for travel.',
  },
  'citi-strata-premier': {
    rewardType: 'transferable',
    program: 'citi_ty',
    role: 'unlocker',
    unlocksTransfers: true,
    transferRatio: 1,
    earnSummary: '3× travel/gas/restaurants — 1:1 transfers incl. American Airlines',
    verdict: 'add_when_ready',
    verdictWhy: 'Big unlock for Double Cash points + unique AA transfer partner.',
  },
};

/** Quick-load presets */
export const WALLET_PRESETS = {
  'starter-six': {
    label: 'My 6-card stack',
    hint: 'Sapphire + Freedom + Amazon + Blue Cash Preferred + Double Cash + Costco',
    cards: ['chase-csp', 'chase-cfu', 'chase-amazon', 'amex-bcp', 'citi-double', 'citi-costco'],
  },
};

/** Category → card routing for a mixed cash + transferable stack */
const ROUTING_RULES = [
  { category: 'U.S. supermarkets', icon: '🛒', priority: ['amex-bcp', 'chase-cfu', 'citi-double'], note: 'BCP 6% up to $6k/yr — then switch to Freedom (transfer upside) or Double Cash (2%)' },
  { category: 'Streaming', icon: '📺', priority: ['amex-bcp', 'chase-cfu'], note: 'BCP 6% on select streaming' },
  { category: 'Gas', icon: '⛽', priority: ['citi-costco', 'amex-bcp', 'chase-cfu'], note: 'Costco 4% at eligible warehouses; BCP 3% elsewhere' },
  { category: 'Costco warehouse', icon: '🏪', priority: ['citi-costco'], note: '2% in-store; separate from ThankYou' },
  { category: 'Amazon & Whole Foods', icon: '📦', priority: ['chase-amazon'], note: '5% — does not pool with Chase UR' },
  { category: 'Dining & travel', icon: '✈️', priority: ['chase-csp', 'chase-cfu', 'citi-costco'], note: 'Sapphire 3× dining/travel; pool UR for Hyatt transfers' },
  { category: 'Everything else', icon: '💳', priority: ['chase-cfu', 'citi-double', 'chase-csp'], note: 'Freedom UR → Sapphire often beats 2% cash when you transfer (not redeem as cash)' },
];

const CHASE_UNLOCKERS = new Set(['chase-csp', 'chase-csr']);
const CITI_UNLOCKERS_FULL = new Set(['citi-strata-premier', 'citi-strata-elite']);
const CITI_UNLOCKERS_PARTIAL = new Set(['citi-strata', 'citi-double']);
const AMEX_UNLOCKERS = new Set(['amex-gold', 'amex-plat', 'amex-bbp', 'amex-bgr', 'amex-green']);

export function walletMeta(catalogId) {
  return WALLET_META[catalogId] || null;
}

export function ownedCardRows(catalogIds) {
  return (catalogIds || [])
    .map((id) => {
      const card = findCatalog(id);
      const meta = walletMeta(id);
      if (!card) return null;
      return { id, card, meta };
    })
    .filter(Boolean);
}

function topPartners(programId, limit = 3) {
  return TRANSFER_RULES
    .filter((r) => r.from === programId)
    .map((r) => ({ ...r, partner: PARTNERS[r.to] }))
    .filter((r) => r.partner)
    .sort((a, b) => (b.partner.cpp || 0) - (a.partner.cpp || 0))
    .slice(0, limit)
    .map((r) => r.partner.name);
}

function ecosystemStatus(rows, issuer, unlockerIds, programId) {
  const owned = rows.filter((r) => r.card.issuer === issuer);
  const unlockers = owned.filter((r) => unlockerIds.has(r.id));
  const earners = owned.filter((r) => r.meta?.program === programId && !unlockerIds.has(r.id));
  const cashback = owned.filter((r) => r.meta?.rewardType === 'cashback');
  const coBrand = owned.filter((r) => ['airline', 'hotel'].includes(r.meta?.rewardType));

  let transferStatus = 'none';
  let transferDetail = '';
  if (unlockers.length) {
    const best = unlockers.find((u) => u.meta?.transferRatio === 1) || unlockers[0];
    transferStatus = best.meta?.transferRatio === 1 ? 'full' : 'partial';
    transferDetail = unlockers.map((u) => u.card.name).join(', ');
  } else if (owned.some((r) => r.meta?.canTransferAlone)) {
    transferStatus = 'partial';
    transferDetail = 'Double Cash can transfer alone at 70%';
  } else if (earners.length) {
    transferStatus = 'locked';
    transferDetail = 'You earn points but lack a transfer-unlocker card';
  }

  return { owned, unlockers, earners, cashback, coBrand, transferStatus, transferDetail, programId };
}

/** Full analysis for owned catalog ids */
export function analyzeWallet(catalogIds) {
  const rows = ownedCardRows(catalogIds);
  const chase = ecosystemStatus(rows, 'Chase', CHASE_UNLOCKERS, 'chase_ur');
  const amex = ecosystemStatus(rows, 'Amex', AMEX_UNLOCKERS, 'amex_mr');
  const citi = ecosystemStatus(rows, 'Citi', new Set([...CITI_UNLOCKERS_FULL, ...CITI_UNLOCKERS_PARTIAL]), 'citi_ty');

  const actions = [];
  const plays = [];

  if (chase.transferStatus === 'full') {
    plays.push({
      program: 'chase_ur',
      emoji: '🔑',
      title: 'Chase UR is unlocked',
      body: `Pool Freedom + Sapphire in one login. Top transfers: ${topPartners('chase_ur').join(', ')}. Hyatt is the crown jewel — book aspirational hotels.`,
    });
    if (chase.earners.length) {
      actions.push({
        priority: 'high',
        type: 'route',
        title: 'Route everyday spend on Freedom',
        detail: 'Use Freedom Unlimited for 1.5% base; move points to Sapphire before transferring to Hyatt/United.',
      });
    }
  } else if (chase.transferStatus === 'locked') {
    actions.push({
      priority: 'critical',
      type: 'add',
      title: 'Add a Sapphire or Ink Preferred',
      detail: 'Freedom points are trapped at ~1¢ portal value without a Chase transfer card.',
    });
  }

  if (chase.cashback.some((r) => r.id === 'chase-amazon')) {
    actions.push({
      priority: 'low',
      type: 'route',
      title: 'Amazon card = separate cash back',
      detail: 'Amazon Prime Visa does not pool with Ultimate Rewards. Use it only at Amazon/Whole Foods (5%).',
    });
  }

  if (amex.transferStatus === 'full') {
    plays.push({
      program: 'amex_mr',
      emoji: '💳',
      title: 'Amex MR is unlocked',
      body: `Top transfers: ${topPartners('amex_mr').join(', ')}. Watch for transfer bonuses (often 20–30% to airlines).`,
    });
  } else if (amex.cashback.some((r) => r.id === 'amex-bcp')) {
    plays.push({
      program: 'amex_cash',
      emoji: '🛒',
      title: 'Blue Cash Preferred = grocery king',
      body: '6% at U.S. supermarkets (cap $6k/yr) is hard to beat. This is cash back — keep it for groceries even if you add transfer cards later.',
    });
    actions.push({
      priority: 'high',
      type: 'route',
      title: 'Track the $6k grocery cap',
      detail: 'After $6k/yr on BCP, move supermarkets to Freedom (UR transfer path) or Double Cash (2%). Don’t waste 1% spend on BCP.',
    });
    actions.push({
      priority: 'high',
      type: 'add',
      title: 'Add Blue Business Plus — don’t replace BCP',
      detail: 'No annual fee MR card unlocks a whole Amex transfer lane. You keep BCP for 6% groceries; BBP earns 2× MR on other spend.',
    });
    actions.push({
      priority: 'medium',
      type: 'stack',
      title: 'Clip Amex Offers on BCP',
      detail: 'Stack statement credits on top of 6% — check Offers tab in the Amex app before grocery runs.',
    });
  } else if (amex.coBrand.length || amex.cashback.length) {
    actions.push({
      priority: 'medium',
      type: 'add',
      title: 'Add Blue Business Plus for MR transfers',
      detail: 'BBP has no annual fee and unlocks transfers without replacing your cash-back Amex.',
    });
  } else if (amex.transferStatus === 'locked') {
    actions.push({
      priority: 'high',
      type: 'add',
      title: 'Add an MR transfer card',
      detail: 'Gold, Platinum, or Blue Business Plus unlocks Membership Rewards partner transfers.',
    });
  }

  if (citi.transferStatus === 'full') {
    plays.push({
      program: 'citi_ty',
      emoji: '✈️',
      title: 'Citi TY at full 1:1 transfers',
      body: `Top transfers: ${topPartners('citi_ty').join(', ')}. Citi → American Airlines is unique among bank currencies.`,
    });
  } else if (citi.transferStatus === 'partial') {
    plays.push({
      program: 'citi_ty',
      emoji: '⚠️',
      title: 'Citi TY transfers at 70%',
      body: 'Double Cash can transfer but you lose 30% vs a Strata Premier. Still beats cash for AA/LifeMiles sweet spots.',
    });
    actions.push({
      priority: 'medium',
      type: 'add',
      title: 'Consider Citi Strata Premier',
      detail: 'Unlocks 1:1 transfers from Double Cash + 3× travel/gas/dining. Only if you will use AA or LifeMiles.',
    });
  } else if (rows.some((r) => r.id === 'citi-double')) {
    actions.push({
      priority: 'medium',
      type: 'add',
      title: 'Double Cash needs a TY unlocker',
      detail: 'Link cards in ThankYou; add Strata or Premier to move points to American or Avianca.',
    });
  }

  if (citi.cashback.some((r) => r.id === 'citi-costco')) {
    actions.push({
      priority: 'low',
      type: 'route',
      title: 'Costco card = cash back lane',
      detail: 'Use for Costco warehouses & eligible gas. Points do not merge with Double Cash TY balance.',
    });
  }

  actions.push({
    priority: 'high',
    type: 'strategy',
    title: 'Transfers are the big-ticket move',
    detail: 'A single Hyatt suite or ANA business class via partner transfer can beat $1k+ in cash-back. Time transfers with bonuses.',
  });

  const cardVerdicts = rows.map((row) => {
    const m = row.meta;
    const verdict = m?.verdict || 'keep';
    const why = m?.verdictWhy || 'Review annual fee vs earn categories.';
    let cancelNote = null;
    if (verdict === 'keep_if_using' && m?.rewardType === 'cashback') {
      cancelNote = 'No annual fee harm in keeping — cancel only to simplify or if unused 12+ months.';
    }
    if (verdict === 'evaluate_fee') {
      cancelNote = 'Run the credits math before canceling; downgrading beats closing for credit age.';
    }
    return {
      id: row.id,
      name: row.card.name,
      issuer: row.card.issuer,
      earnSummary: m?.earnSummary || row.card.tags?.join(', ') || '',
      verdict,
      why,
      cancelNote,
      rewardType: m?.rewardType || 'unknown',
    };
  });

  const transferablePrograms = [chase, amex, citi]
    .filter((e) => e.transferStatus === 'full' || e.transferStatus === 'partial')
    .map((e) => PROGRAMS[e.programId]?.short || e.programId);

  const spendRouting = buildSpendRouting(rows);
  const nextCards = buildNextCards(rows, chase, amex, citi);

  return {
    rows,
    ecosystems: { chase, amex, citi },
    plays,
    actions: actions.sort((a, b) => {
      const rank = { critical: 0, high: 1, medium: 2, low: 3 };
      return (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
    }),
    cardVerdicts,
    transferablePrograms,
    spendRouting,
    nextCards,
    summary: buildSummary(chase, amex, citi, rows),
  };
}

function buildSpendRouting(rows) {
  const owned = new Set(rows.map((r) => r.id));
  const byId = Object.fromEntries(rows.map((r) => [r.id, r.card.name]));

  return ROUTING_RULES.map((rule) => {
    const pick = rule.priority.find((id) => owned.has(id));
    const fallback = rule.priority.find((id) => findCatalog(id));
    const cardId = pick || null;
    const cardName = cardId ? byId[cardId] : (fallback ? findCatalog(fallback)?.name : null);
    return {
      category: rule.category,
      icon: rule.icon,
      cardId,
      cardName: cardName || '—',
      active: Boolean(pick),
      note: rule.note,
    };
  });
}

function buildNextCards(rows, chase, amex, citi) {
  const owned = new Set(rows.map((r) => r.id));
  const picks = [];

  if (!owned.has('amex-bbp') && !amex.unlockers.length) {
    picks.push({
      catalogId: 'amex-bbp',
      title: 'Amex Blue Business Plus',
      why: 'Opens Amex transfer partners with $0 annual fee. Pairs perfectly with BCP — keep 6% groceries, earn MR elsewhere.',
      upside: 'Transfer bonuses to airlines; ANA via Virgin Atlantic sweet spots',
    });
  }
  if (!owned.has('citi-strata-premier') && !owned.has('citi-premier') && citi.transferStatus !== 'full' && owned.has('citi-double')) {
    picks.push({
      catalogId: 'citi-strata-premier',
      title: 'Citi Strata Premier',
      why: 'Upgrades Double Cash from 70% → 100% transfer ratio. Only bank card that transfers to American Airlines.',
      upside: 'AA domestic + international Oneworld awards',
    });
  }
  if (chase.transferStatus === 'full' && !owned.has('chase-cff') && owned.has('chase-cfu')) {
    picks.push({
      catalogId: 'chase-cff',
      title: 'Chase Freedom Flex',
      why: '5% rotating categories + 3% dining/drugstores can beat 1.5% Unlimited in bonus quarters.',
      upside: 'More UR pooled to Sapphire for Hyatt',
    });
  }

  return picks;
}

function buildSummary(chase, amex, citi, rows) {
  const parts = [];
  if (rows.length === 0) return 'Add the cards you already hold to see how they fit together.';
  if (chase.transferStatus === 'full') parts.push('Chase UR unlocked');
  else if (chase.earners.length) parts.push('Chase UR locked');
  if (amex.transferStatus === 'full') parts.push('Amex MR unlocked');
  else if (amex.owned.length) parts.push('Amex needs MR unlocker');
  if (citi.transferStatus === 'full') parts.push('Citi TY 1:1');
  else if (citi.transferStatus === 'partial') parts.push('Citi TY at 70%');
  else if (citi.owned.length) parts.push('Citi TY locked');
  const cb = rows.filter((r) => r.meta?.rewardType === 'cashback').length;
  if (cb) parts.push(`${cb} cash-back lane${cb > 1 ? 's' : ''}`);
  return parts.join(' · ') || 'Select your cards below.';
}

export function walletCardsForPicker() {
  return Object.keys(WALLET_META)
    .map((id) => findCatalog(id))
    .filter(Boolean)
    .sort((a, b) => a.issuer.localeCompare(b.issuer) || a.name.localeCompare(b.name));
}