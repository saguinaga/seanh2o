import {
  OFFER_TYPES, STATUS, ISSUERS, defaultState, defaultProfile,
  evaluateOffer, suggestTimeline, seedOffers, seedOfferPlan, migrateState, bumpProfileOnApproval,
} from './rules.js';
import { allIssuerDashboard, issuerRulesMeta, ISSUER_LIST } from './issuers.js';
import {
  CARD_CATALOG, catalogEntryToOffer, filterCatalog, pointsToUsd, POINT_VALUES,
} from './catalog.js';
import { simulateCreditPlan, WEIGHTS, FACTOR_LABELS } from './score-sim.js';
import { DREAM_TRIPS, activeOffersValue, tripsFundedByValue, cardTripPitch } from './trips.js';
import {
  OFFER_PLANS, PLANNING_PRINCIPLES, earningsProjection,
} from './earnings.js';
import {
  PROGRAMS, PARTNERS, TRANSFER_RULES, HOUSEHOLD_PLAYBOOK,
  pointsWallet, transferPartnersFor, crossProgramSummary,
  tripTransferPlan, bestTripsForWallet, defaultPointsBalances,
} from './transfers.js';
import {
  loadOffersFeed, feedHasUpdates, markFeedSeen, allFeedDeals, filterFeedDeals,
  compareFeedToQueue, feedEntryToOffer, formatFeedAge,
} from './feed.js';
import {
  defaultHousehold, householdWallet, optimalHouseholdSplit, tripSplitPlan,
  poolingMatrixRows, activeTransferBonuses, getOfferOwner, setOfferOwner,
} from './household.js';

const STORAGE_KEY = 'promo_tracker_v3';
const LEGACY_KEY = 'promo_tracker_v1';

const COUNTER_FIELDS = [
  { id: 'chaseCards30d', label: 'Chase cards (30d)' },
  { id: 'amexCards90d', label: 'Amex cards (90d)' },
  { id: 'amexCardsTotal', label: 'Amex cards total' },
  { id: 'citiCards8d', label: 'Citi cards (8d)' },
  { id: 'citiCards65d', label: 'Citi cards (65d)' },
  { id: 'discoverCardsTotal', label: 'Discover cards' },
  { id: 'capOneCards6mo', label: 'Cap One (6mo)' },
  { id: 'capOneCardsTotal', label: 'Cap One total' },
  { id: 'bofaCards2mo', label: 'BofA (2mo)' },
  { id: 'bofaCards12mo', label: 'BofA (12mo)' },
  { id: 'bofaCards24mo', label: 'BofA (24mo)' },
  { id: 'wfCards6mo', label: 'Wells Fargo (6mo)' },
  { id: 'usbCards12mo', label: 'US Bank (12mo)' },
  { id: 'barcCards6mo', label: 'Barclays (6mo)' },
];

let state = load();
let scoreChart = null;
let offersFeed = null;

function load() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) raw = localStorage.getItem('promo_tracker_v2');
    if (!raw) raw = localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const s = migrateState(JSON.parse(raw));
      if (!s.household) s.household = defaultHousehold();
      return s;
    }
  } catch { /* noop */ }
  const s = defaultState();
  s.household = defaultHousehold();
  return s;
}

function ensureHousehold() {
  if (!state.household) state.household = defaultHousehold();
  return state.household;
}

function save() {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return [...document.querySelectorAll(sel)]; }

function fmtMoney(n) {
  return Number.isFinite(n) ? `$${n.toLocaleString()}` : '—';
}

function fmtPts(n) {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(Math.round(n));
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.type === 'checkbox') el.checked = !!value;
  else el.value = value ?? '';
}

function readVal(id) {
  const el = document.getElementById(id);
  if (!el) return undefined;
  if (el.type === 'checkbox') return el.checked;
  if (el.type === 'number') return Number(el.value) || 0;
  return el.value;
}

function renderProfile() {
  const p = state.profile;
  const fields = [
    'age', 'baselineScore', 'scoreBand', 'latePayments24mo',
    'oldestAccountYears', 'creditHistoryYears', 'aaoaYears', 'recentAccounts12mo',
    'cardsOpen', 'personalCards24mo', 'totalCreditLimit', 'totalBalances',
    'utilizationPct', 'lastHardPull',
    'inquiries6mo', 'inquiries12mo', 'inquiries24mo',
    'hasMortgage', 'hasAutoLoan', 'mortgageSensitive', 'mortgagePlannedDate',
    'profileNotes',
  ];
  fields.forEach((f) => setVal(f, p[f]));

  const counterEl = $('#issuerCounters');
  if (counterEl) {
    counterEl.innerHTML = COUNTER_FIELDS.map(({ id, label }) => `
      <label>${label}
        <input type="number" id="${id}" data-profile data-counter min="0" value="${p[id] ?? 0}">
      </label>
    `).join('');
  }
}

function readProfile() {
  const p = state.profile;
  state.profile = {
    ...p,
    age: readVal('age'),
    baselineScore: readVal('baselineScore'),
    scoreBand: readVal('scoreBand'),
    latePayments24mo: readVal('latePayments24mo'),
    oldestAccountYears: readVal('oldestAccountYears'),
    creditHistoryYears: readVal('creditHistoryYears'),
    aaoaYears: readVal('aaoaYears'),
    recentAccounts12mo: readVal('recentAccounts12mo'),
    cardsOpen: readVal('cardsOpen'),
    personalCards24mo: readVal('personalCards24mo'),
    cards24mo: readVal('personalCards24mo'),
    totalCreditLimit: readVal('totalCreditLimit'),
    totalBalances: readVal('totalBalances'),
    utilizationPct: readVal('utilizationPct'),
    lastHardPull: readVal('lastHardPull'),
    inquiries6mo: readVal('inquiries6mo'),
    inquiries12mo: readVal('inquiries12mo'),
    inquiries24mo: readVal('inquiries24mo'),
    hasMortgage: readVal('hasMortgage'),
    hasAutoLoan: readVal('hasAutoLoan'),
    hasStudentLoan: p.hasStudentLoan,
    mortgageSensitive: readVal('mortgageSensitive'),
    mortgagePlannedDate: readVal('mortgagePlannedDate'),
    notes: readVal('profileNotes'),
    chaseCards30d: readVal('chaseCards30d') ?? p.chaseCards30d ?? 0,
    amexCards90d: readVal('amexCards90d') ?? p.amexCards90d ?? 0,
    amexCardsTotal: readVal('amexCardsTotal') ?? p.amexCardsTotal ?? 0,
    citiCards8d: readVal('citiCards8d') ?? p.citiCards8d ?? 0,
    citiCards65d: readVal('citiCards65d') ?? p.citiCards65d ?? 0,
    discoverCardsTotal: readVal('discoverCardsTotal') ?? p.discoverCardsTotal ?? 0,
    capOneCards6mo: readVal('capOneCards6mo') ?? p.capOneCards6mo ?? 0,
    capOneCardsTotal: readVal('capOneCardsTotal') ?? p.capOneCardsTotal ?? 0,
    bofaCards2mo: readVal('bofaCards2mo') ?? p.bofaCards2mo ?? 0,
    bofaCards12mo: readVal('bofaCards12mo') ?? p.bofaCards12mo ?? 0,
    bofaCards24mo: readVal('bofaCards24mo') ?? p.bofaCards24mo ?? 0,
    wfCards6mo: readVal('wfCards6mo') ?? p.wfCards6mo ?? 0,
    usbCards12mo: readVal('usbCards12mo') ?? p.usbCards12mo ?? 0,
    barcCards6mo: readVal('barcCards6mo') ?? p.barcCards6mo ?? 0,
    existingPoints: readPointsGrid('existing'),
    partnerPoints: readPointsGrid('partner'),
    poolHousehold: readVal('poolHousehold'),
    partnerLabel: p.partnerLabel || 'Partner',
  };

  if (state.profile.totalCreditLimit > 0) {
    state.profile.utilizationPct = Math.round(
      (state.profile.totalBalances / state.profile.totalCreditLimit) * 1000,
    ) / 10;
    setVal('utilizationPct', state.profile.utilizationPct);
  }

  save();
  renderAll();
}

function readPointsGrid(prefix, profile = state.profile) {
  const src = prefix === 'existing' ? profile.existingPoints : profile.partnerPoints;
  const base = { ...defaultPointsBalances(), ...src };
  ['chase_ur', 'amex_mr', 'citi_ty', 'capone'].forEach((prog) => {
    const el = document.getElementById(`${prefix}_${prog}`);
    if (el) base[prog] = Number(el.value) || 0;
  });
  return base;
}

function renderStats(sim, projection) {
  const proj = projection || earningsProjection(state.offers, []);

  $('#statPipeline').textContent = fmtMoney(proj.netPipeline);
  $('#statCaptured').textContent = fmtMoney(proj.captured);
  $('#statPerMonth').textContent = proj.perMonth > 0 ? fmtMoney(proj.perMonth) : '$0';
  $('#statQueued').textContent = String(proj.queued);
  if (sim) {
    $('#statMaxDrop').textContent = sim.summary.maxDrop > 0 ? `−${sim.summary.maxDrop}` : '0';
    $('#statMaxDrop').style.color = sim.summary.maxDrop >= 20 ? 'var(--rose)' : 'var(--green)';
  } else {
    $('#statMaxDrop').textContent = '—';
  }
}

function renderDashboardTimeline(timeline) {
  const el = $('#dashboardTimeline');
  if (!el) return;
  const pending = (timeline || []).slice(0, 4);
  if (!pending.length) {
    el.innerHTML = '<p class="empty">Load a plan or add offers to see pacing.</p>';
    return;
  }
  el.innerHTML = pending.map((row, i) => `
    <div class="timeline-row">
      <span class="timeline-step">${i + 1}</span>
      <div>
        <strong>${escapeHtml(row.title)}</strong>
        <span class="timeline-date">${row.suggestedDate}</span>
        <p class="timeline-reason">${escapeHtml(row.reason)}</p>
      </div>
    </div>
  `).join('');
}

function renderDashboard(sim, timeline) {
  const proj = earningsProjection(state.offers, timeline);
  renderStats(sim, proj);

  const snap = $('#earningsSnapshot');
  if (snap) {
    const typeRows = Object.entries(proj.byType).map(([t, v]) => {
      const label = { cc: 'Card SUBs', bank: 'Bank bonuses', shopping: 'Shopping/stacks', travel: 'Travel promos' }[t] || t;
      return `<div class="sim-summary__row"><span>${label}</span><strong>${fmtMoney(v)}</strong></div>`;
    }).join('');

    snap.innerHTML = `
      <div class="sim-summary">
        <div class="sim-summary__row"><span>Gross pipeline</span><strong>${fmtMoney(proj.pipeline)}</strong></div>
        <div class="sim-summary__row"><span>Less annual fees (pending)</span><strong>−${fmtMoney(proj.fees)}</strong></div>
        <div class="sim-summary__row"><span>Net still to earn</span><strong>${fmtMoney(proj.netPipeline)}</strong></div>
        <div class="sim-summary__row"><span>Already captured</span><strong>${fmtMoney(proj.captured)}</strong></div>
        <div class="sim-summary__row"><span>MSR exposure (queued)</span><strong>${fmtMoney(proj.msr)}</strong></div>
        <div class="sim-summary__row"><span>Plan horizon</span><strong>~${proj.months} mo</strong></div>
        ${typeRows}
        ${sim ? `<div class="sim-summary__row ${sim.summary.maxDrop >= 15 ? 'sim-summary__row--warn' : ''}">
          <span>Est. max score drop</span><strong>−${sim.summary.maxDrop} pts</strong>
        </div>` : ''}
      </div>
      <p class="hint" style="margin-top:12px">Mark offers <strong>Done</strong> when bonuses post — captured $ and gates update automatically.</p>
    `;
  }

  renderDashboardTimeline(timeline);

  const planGrid = $('#planGrid');
  if (planGrid) {
    planGrid.innerHTML = OFFER_PLANS.map((p) => `
      <article class="stack-card">
        <header class="stack-card__head">
          <span class="stack-card__emoji">${p.emoji}</span>
          <div>
            <h3>${escapeHtml(p.name)}</h3>
            <p class="stack-card__hook">${escapeHtml(p.hook)}</p>
          </div>
          <strong class="stack-card__val">~${fmtMoney(p.estValue)}</strong>
        </header>
        <p class="stack-card__caption">${escapeHtml(p.caption)}</p>
        <button type="button" class="btn-sm btn" data-plan="${p.id}">Load plan</button>
      </article>
    `).join('');

    planGrid.querySelectorAll('[data-plan]').forEach((btn) => {
      btn.addEventListener('click', () => loadPlan(btn.dataset.plan));
    });
  }

  const tripGrid = $('#tripGrid');
  if (tripGrid && state.offers.length) {
    const tripVal = activeOffersValue(state.offers);
    tripGrid.innerHTML = tripsFundedByValue(tripVal).slice(0, 5).map((t) => `
      <article class="trip-card trip-card--${t.status} trip-card--compact">
        <div class="trip-card__emoji">${t.emoji}</div>
        <div class="trip-card__body">
          <h3>${escapeHtml(t.name)}</h3>
          <div class="trip-card__bar"><div class="trip-card__fill" style="width:${t.fundedPct}%"></div></div>
          <p class="trip-card__meta">${t.fundedPct}% of ~${fmtMoney(t.cashPrice)} if redeemed for travel</p>
        </div>
      </article>
    `).join('');
  } else if (tripGrid) {
    tripGrid.innerHTML = '<p class="empty">Add offers to see optional travel redemption stretch goals.</p>';
  }
}

function loadPlan(planId) {
  if (state.offers.length && !confirm('Replace your offer queue with this plan template?')) return;
  state.offers = seedOfferPlan(planId);
  save();
  renderAll();
  switchTab('plan');
}

function updateFeedBadge() {
  const badge = $('#feedBadge');
  if (!badge || !offersFeed) return;
  badge.hidden = !feedHasUpdates(offersFeed);
}

async function refreshFeedNow() {
  const btn = $('#refreshFeed');
  if (btn) btn.disabled = true;
  try {
    offersFeed = await loadOffersFeed(true);
    updateFeedBadge();
    renderDealInbox();
    renderCatalog();
  } catch (e) {
    alert(`Could not refresh feed: ${e.message}`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function addFromFeed(deal) {
  if (deal.catalogId) {
    const card = CARD_CATALOG.find((c) => c.id === deal.catalogId);
    if (!card) return;
    const offer = catalogEntryToOffer(card, state.offers.length + 1);
    offer.feedId = deal.feedId;
    offer.valueUsd = deal.valueUsd ?? offer.valueUsd;
    offer.subPoints = deal.subPoints ?? offer.subPoints;
    offer.notes = `Feed ${formatFeedAge(deal.updatedAt)}${deal.sourceUrl ? ` · ${deal.sourceUrl}` : ''}`;
    state.offers.push(offer);
  } else {
    const offer = feedEntryToOffer(deal, state.offers.length + 1);
    if (offer) state.offers.push(offer);
  }
  save();
  renderAll();
}

function renderFeedCompare() {
  const el = $('#feedCompare');
  if (!el || !offersFeed) {
    if (el) el.innerHTML = '<p class="empty">Load feed to compare live deals with your queue.</p>';
    return;
  }
  const cmp = compareFeedToQueue(offersFeed, state.offers);
  el.innerHTML = `
    <div class="compare-grid">
      <div class="compare-card compare-card--up">
        <strong>${cmp.upgraded.length}</strong>
        <span>Better SUB than queued</span>
        ${cmp.upgraded.slice(0, 3).map((u) => `<p class="hint">${escapeHtml(u.feed.name)} +${fmtMoney(u.delta)}</p>`).join('') || '<p class="hint">—</p>'}
      </div>
      <div class="compare-card">
        <strong>${cmp.available.length}</strong>
        <span>New in feed</span>
      </div>
      <div class="compare-card">
        <strong>${cmp.inQueue.length}</strong>
        <span>Matches queue</span>
      </div>
      <div class="compare-card compare-card--warn">
        <strong>${cmp.staleQueued.length}</strong>
        <span>Queued, not in feed — verify</span>
      </div>
    </div>
  `;
}

function renderDealInbox() {
  const meta = $('#feedMeta');
  if (meta) {
    if (!offersFeed) {
      meta.textContent = 'Feed not loaded — click Check for updates.';
    } else {
      const changed = offersFeed.meta?.previousHash && offersFeed.meta.hash !== offersFeed.meta.previousHash;
      meta.textContent = `Updated ${formatFeedAge(offersFeed.meta?.generatedAt)} · hash ${offersFeed.meta?.hash || '—'}${changed ? ' · content changed this refresh' : ''}`;
    }
  }

  renderFeedCompare();

  const list = $('#dealInbox');
  if (!list) return;
  if (!offersFeed) {
    list.innerHTML = '<p class="empty">Click <strong>Check for updates</strong> to load the latest deals.</p>';
    return;
  }

  const type = $('#inboxType')?.value || 'all';
  const issuer = $('#inboxIssuer')?.value || 'all';
  const search = $('#inboxSearch')?.value || '';
  const deals = filterFeedDeals(allFeedDeals(offersFeed), { type, issuer, search });
  const queuedFeedIds = new Set(state.offers.map((o) => o.feedId).filter(Boolean));
  const queuedCatalog = new Set(state.offers.map((o) => o.catalogId).filter(Boolean));

  if (!deals.length) {
    list.innerHTML = '<p class="empty">No deals match filters.</p>';
    return;
  }

  list.innerHTML = deals.map((d) => {
    const inQ = queuedFeedIds.has(d.feedId) || (d.catalogId && queuedCatalog.has(d.catalogId));
    const val = d.valueUsd ? fmtMoney(d.valueUsd) : d.bonusPct ? `${d.bonusPct}% bonus` : 'See link';
    const src = d.source === 'doctor_of_credit' ? 'DOC' : d.source === 'catalog' ? 'Catalog' : d.source || '';
    return `
      <article class="inbox-card ${inQ ? 'inbox-card--queued' : ''}">
        <header>
          <span class="inbox-card__type">${escapeHtml(d.type)}</span>
          <strong>${escapeHtml(d.title || d.name)}</strong>
          <span class="inbox-card__val">${val}</span>
        </header>
        <p class="hint">${escapeHtml(d.issuer || '')} · ${src}${d.pubDate ? ` · ${d.pubDate.slice(0, 16)}` : ''}</p>
        ${d.description ? `<p class="inbox-card__desc">${escapeHtml(d.description)}</p>` : ''}
        <div class="inbox-card__actions">
          ${d.sourceUrl ? `<a href="${escapeHtml(d.sourceUrl)}" target="_blank" rel="noopener" class="btn-sm btn-ghost">Source</a>` : ''}
          <button type="button" class="btn-sm ${inQ ? 'btn-ghost' : 'btn'}" data-feed-add="${d.feedId}" ${inQ ? 'disabled' : ''}>
            ${inQ ? 'In queue' : '+ Add to queue'}
          </button>
        </div>
      </article>
    `;
  }).join('');

  const dealMap = Object.fromEntries(allFeedDeals(offersFeed).map((d) => [d.feedId, d]));
  list.querySelectorAll('[data-feed-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const deal = dealMap[btn.dataset.feedAdd];
      if (deal) addFromFeed(deal);
    });
  });
}

function renderHouseholdUI() {
  const hh = ensureHousehold();
  const p2g = $('#player2Grid');
  if (p2g && !p2g.dataset.bound) {
    const p2 = hh.player2Profile;
    p2g.innerHTML = `
      <label>${escapeHtml(hh.player2Label)} label
        <input type="text" id="hh_player2Label" data-household value="${escapeHtml(hh.player2Label)}">
      </label>
      <label>5/24 (personal cards, 24mo)
        <input type="number" id="hh_p2_524" data-household min="0" value="${p2.personalCards24mo ?? 0}">
      </label>
      <label>Inquiries (6mo)
        <input type="number" id="hh_p2_inq6" data-household min="0" value="${p2.inquiries6mo ?? 0}">
      </label>
      <label>Chase cards (30d)
        <input type="number" id="hh_p2_chase30" data-household min="0" value="${p2.chaseCards30d ?? 0}">
      </label>
      <label>Amex cards (90d)
        <input type="number" id="hh_p2_amex90" data-household min="0" value="${p2.amexCards90d ?? 0}">
      </label>
    `;
    p2g.dataset.bound = '1';
  }

  const loyalty = $('#sharedLoyaltyGrid');
  if (loyalty && !loyalty.dataset.bound) {
    loyalty.innerHTML = ['hyatt', 'united', 'marriott', 'delta', 'southwest'].map((k) => `
      <label>${PARTNERS[k]?.emoji || ''} ${PARTNERS[k]?.name || k} member #
        <input type="text" id="hh_loyalty_${k}" data-household value="${escapeHtml(hh.sharedLoyalty?.[k] || '')}" placeholder="Shared account ID">
      </label>
    `).join('');
    loyalty.dataset.bound = '1';
  }

  readHouseholdFromDom();

  const split = $('#householdSplit');
  if (split) {
    const opt = optimalHouseholdSplit(state.profile, hh, state.offers);
    split.innerHTML = `
      <p class="hint">${escapeHtml(hh.player1Label)} est. <strong>${fmtMoney(opt.p1Val)}</strong> · ${escapeHtml(hh.player2Label)} est. <strong>${fmtMoney(opt.p2Val)}</strong></p>
      <ul class="split-list">${opt.assignments.slice(0, 6).map((a) => `
        <li><strong>${escapeHtml(a.title)}</strong> → ${a.suggestedOwner === 'player2' ? escapeHtml(hh.player2Label) : escapeHtml(hh.player1Label)}
          <span class="hint">${escapeHtml(a.reason)}</span></li>
      `).join('') || '<li class="hint">Queue offers to see split suggestions.</li>'}</ul>
    `;
  }

  const matrix = $('#poolingMatrix');
  if (matrix) {
    matrix.innerHTML = poolingMatrixRows().map((r) => `
      <article class="pooling-row">
        <h4>${PROGRAMS[r.program]?.short || r.program}</h4>
        <p>${escapeHtml(r.summary)}</p>
        <div class="pooling-flags">
          <span class="tag">${r.poolsSamePersonCards ? 'Pools own cards' : 'No pool'}</span>
          <span class="tag">${r.authorizedUserEarns ? 'AU earns' : 'AU no earn'}</span>
          <span class="tag">${r.canTransferToPartnerLoyalty ? '→ shared loyalty OK' : ''}</span>
        </div>
      </article>
    `).join('');
  }

  const xfer = $('#transferBonusFeed');
  if (xfer) {
    const bonuses = activeTransferBonuses(offersFeed);
    xfer.innerHTML = bonuses.length
      ? bonuses.map((b) => `
        <div class="inbox-card">
          <strong>${escapeHtml(b.title)}</strong>
          <p class="hint">${escapeHtml(b.notes || b.description || '')}</p>
          ${b.sourceUrl ? `<a href="${escapeHtml(b.sourceUrl)}" target="_blank" rel="noopener">Details</a>` : ''}
        </div>
      `).join('')
      : '<p class="empty">No transfer promos in current feed.</p>';
  }
}

function readHouseholdFromDom() {
  const hh = ensureHousehold();
  const label = document.getElementById('hh_player2Label');
  if (label) hh.player2Label = label.value || 'Partner';
  const p2 = { ...hh.player2Profile };
  const g = (id, key) => {
    const el = document.getElementById(id);
    if (el) p2[key] = Number(el.value) || 0;
  };
  g('hh_p2_524', 'personalCards24mo');
  g('hh_p2_inq6', 'inquiries6mo');
  g('hh_p2_chase30', 'chaseCards30d');
  g('hh_p2_amex90', 'amexCards90d');
  p2.cards24mo = p2.personalCards24mo;
  hh.player2Profile = p2;
  hh.sharedLoyalty = hh.sharedLoyalty || {};
  ['hyatt', 'united', 'marriott', 'delta', 'southwest'].forEach((k) => {
    const el = document.getElementById(`hh_loyalty_${k}`);
    if (el) hh.sharedLoyalty[k] = el.value.trim();
  });
  state.household = hh;
}

function renderTransfers() {
  renderHouseholdUI();
  const hh = ensureHousehold();
  const hw = householdWallet(state.profile, hh, state.offers);
  const wallet = {
    lines: [...hw.player1.lines, ...hw.player2.lines],
    totalPoints: hw.player1.totalPoints + hw.player2.totalPoints,
    totalUsd: hw.player1.totalUsd + hw.player2.totalUsd,
    byProgram: hw.combinedByProgram,
  };

  const summaryEl = $('#crossProgramSummary');
  if (summaryEl) summaryEl.textContent = crossProgramSummary(wallet);

  const walletEl = $('#pointsWallet');
  if (walletEl) {
    if (!wallet.lines.length) {
      walletEl.innerHTML = '<p class="empty">Load a card stack to see pooled points by program.</p>';
    } else {
      walletEl.innerHTML = wallet.lines.map((line) => `
        <article class="wallet-card" style="border-left-color:${line.meta.color}">
          <header class="wallet-card__head">
            <strong>${escapeHtml(line.meta.short)}</strong>
            <span>${fmtPts(line.total)} pts · ~${fmtMoney(line.usd)}</span>
          </header>
          <div class="wallet-card__breakdown">
            ${line.stack ? `<span>Stack SUB <strong>${fmtPts(line.stack)}</strong></span>` : ''}
            ${line.yours ? `<span>Yours <strong>${fmtPts(line.yours)}</strong></span>` : ''}
            ${line.spouse ? `<span>${escapeHtml(state.profile.partnerLabel || 'Partner')} <strong>${fmtPts(line.spouse)}</strong></span>` : ''}
          </div>
          ${line.meta.transferable
    ? `<p class="wallet-card__xfer">→ ${transferPartnersFor(line.program).slice(0, 4).map((t) => PARTNERS[t.to]?.name).filter(Boolean).join(', ')}…</p>`
    : `<p class="wallet-card__xfer wallet-card__xfer--muted">${escapeHtml(line.meta.note)}</p>`}
        </article>
      `).join('');
    }
  }

  const ptsGrid = $('#existingPointsGrid');
  if (ptsGrid && !ptsGrid.dataset.bound) {
    const progs = ['chase_ur', 'amex_mr', 'citi_ty', 'capone'];
    ptsGrid.innerHTML = progs.flatMap((prog) => {
      const m = PROGRAMS[prog];
      return [
        `<label>${m.short} (yours)
          <input type="number" id="existing_${prog}" data-profile data-points min="0" step="1000" value="${state.profile.existingPoints?.[prog] ?? 0}">
        </label>`,
        `<label>${m.short} (${state.profile.partnerLabel || 'partner'})
          <input type="number" id="partner_${prog}" data-profile data-points min="0" step="1000" value="${state.profile.partnerPoints?.[prog] ?? 0}">
        </label>`,
      ];
    }).join('');
    ptsGrid.dataset.bound = '1';
  } else {
    ['chase_ur', 'amex_mr', 'citi_ty', 'capone'].forEach((prog) => {
      setVal(`existing_${prog}`, state.profile.existingPoints?.[prog] ?? 0);
      setVal(`partner_${prog}`, state.profile.partnerPoints?.[prog] ?? 0);
    });
  }

  setVal('poolHousehold', state.profile.poolHousehold !== false);

  const tripSel = $('#playbookTrip');
  if (tripSel && !tripSel.dataset.bound) {
    DREAM_TRIPS.forEach((t) => {
      const o = document.createElement('option');
      o.value = t.id;
      o.textContent = `${t.emoji} ${t.name}`;
      tripSel.appendChild(o);
    });
    tripSel.dataset.bound = '1';
    tripSel.addEventListener('change', renderTripPlaybook);
  }

  renderTripPlaybook();

  const progSel = $('#transferProgram');
  if (progSel && !progSel.dataset.bound) {
    Object.values(PROGRAMS).filter((p) => p.transferable).forEach((p) => {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.name;
      progSel.appendChild(o);
    });
    progSel.dataset.bound = '1';
  }
  renderTransferTable($('#transferProgram')?.value || 'all');

  const householdEl = $('#householdGrid');
  if (householdEl) {
    householdEl.innerHTML = HOUSEHOLD_PLAYBOOK.map((block) => `
      <article class="household-card">
        <h3>${escapeHtml(block.title)}</h3>
        <ol>${block.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
      </article>
    `).join('');
  }
}

function renderTripPlaybook() {
  const tripId = $('#playbookTrip')?.value || DREAM_TRIPS[0]?.id;
  const hh = ensureHousehold();
  const { plan, steps } = tripSplitPlan(tripId, state.profile, hh, state.offers);
  const el = $('#tripPlaybook');
  if (!el || !plan) return;

  const combinedWallet = { byProgram: householdWallet(state.profile, hh, state.offers).combinedByProgram, totalPoints: 0 };
  const best = bestTripsForWallet(combinedWallet).slice(0, 3);
  const planSteps = steps || plan?.steps || [];

  el.innerHTML = `
    <p class="playbook-caption">${escapeHtml(plan?.caption || '')}</p>
    <div class="playbook-steps">
      ${planSteps.map((step) => `
        <div class="playbook-step ${step.covered ? 'playbook-step--ok' : 'playbook-step--gap'}">
          <div class="playbook-step__head">
            <span>${step.partner?.emoji || '✈️'} ${escapeHtml(step.label)}</span>
            <span class="gate-pill gate-pill--${step.covered ? 'clear' : 'caution'}">${step.covered ? 'Covered' : `Need ${fmtPts(step.gap)} more`}</span>
          </div>
          <p><strong>${escapeHtml(step.program?.short || '')}</strong> → <strong>${escapeHtml(step.partner?.name || '')}</strong> · ${step.ratio} · ${escapeHtml(step.time)}</p>
          <p class="playbook-step__pts">${fmtPts(step.available)} available / ${fmtPts(step.estPoints)} est. needed</p>
          <p class="hint">${escapeHtml(step.note || '')}${step.sharedAccount ? ` · Account: ${escapeHtml(step.sharedAccount)}` : ''}</p>
        </div>
      `).join('')}
    </div>
    <p class="playbook-verdict ${plan?.feasible ? 'playbook-verdict--yes' : ''}">
      ${plan?.feasible
    ? `✓ Combined household points can cover this ${plan.trip.emoji} trip on paper.`
    : `Need ~${fmtPts(Math.max(0, (plan?.totalNeed || 0) - (plan?.totalHave || 0)))} more points — add offers or wait for transfer bonuses.`}
    </p>
    ${best.length ? `<p class="hint" style="margin-top:10px">Best fit from your wallet: ${best.map((b) => `${b.trip.emoji} ${b.trip.name} (${b.score}%)`).join(' · ')}</p>` : ''}
  `;
}

function renderTransferTable(programFilter) {
  const tbody = $('#transferTable tbody');
  if (!tbody) return;

  let rules = TRANSFER_RULES;
  if (programFilter && programFilter !== 'all') {
    rules = rules.filter((r) => r.from === programFilter);
  }

  tbody.innerHTML = rules.map((r) => {
    const from = PROGRAMS[r.from];
    const to = PARTNERS[r.to];
    if (!from || !to) return '';
    return `
      <tr>
        <td><span class="xfer-from" style="color:${from.color}">${escapeHtml(from.short)}</span></td>
        <td>${to.emoji} ${escapeHtml(to.name)}</td>
        <td>${r.ratio}:1</td>
        <td>${escapeHtml(r.time)}</td>
        <td class="xfer-sweet">${escapeHtml(r.sweet || '')}</td>
      </tr>
    `;
  }).join('');
}

function renderQuickGates() {
  const p = state.profile;
  const p524 = p.personalCards24mo ?? p.cards24mo;
  const el = $('#quickGates');
  if (!el) return;
  el.innerHTML = `
    <span>Chase 5/24:</span>
    <span class="gate-pill gate-pill--${p524 >= 5 ? 'blocked' : p524 >= 4 ? 'caution' : 'clear'}">${p524}/5</span>
    <span>Inquiries (6mo):</span>
    <span class="gate-pill gate-pill--${p.inquiries6mo >= 3 ? 'caution' : 'clear'}">${p.inquiries6mo}</span>
    <span>Utilization:</span>
    <span class="gate-pill gate-pill--${p.utilizationPct > 30 ? 'caution' : 'clear'}">${p.utilizationPct}%</span>
    <span>AAoA:</span>
    <span class="gate-pill gate-pill--${p.aaoaYears < 2 ? 'caution' : 'clear'}">${p.aaoaYears}y</span>
  `;
}

function renderIssuerGrid() {
  const meta = issuerRulesMeta();
  const dash = allIssuerDashboard(state.profile);
  const el = $('#issuerGrid');
  if (!el) return;

  el.innerHTML = dash.map((d) => {
    const m = meta[d.issuer] || {};
    const rules = d.results.length
      ? d.results.map((r) => `
        <li>
          <span>${r.id}</span>
          <span class="gate-pill gate-pill--${r.pass ? 'clear' : 'blocked'}">${r.detail}</span>
        </li>
      `).join('')
      : '<li><span>No velocity rules modeled</span></li>';

    return `
      <article class="issuer-card issuer-card--${d.status}">
        <header class="issuer-card__head">
          <h3 style="color:${m.color || 'inherit'}">${escapeHtml(d.issuer)}</h3>
          <span class="gate-pill gate-pill--${d.status === 'blocked' ? 'blocked' : d.status === 'caution' ? 'caution' : 'clear'}">${d.status}</span>
        </header>
        <ul class="issuer-card__rules">${rules}</ul>
      </article>
    `;
  }).join('');
}

function renderCatalog() {
  const issuer = $('#catalogIssuer')?.value || 'all';
  const cards = filterCatalog(issuer);
  const feedCards = offersFeed?.cards ? Object.fromEntries(offersFeed.cards.map((c) => [c.catalogId, c])) : {};
  const el = $('#catalogGrid');
  if (!el) return;

  el.innerHTML = cards.map((card) => {
    const live = feedCards[card.id];
    const liveVal = live?.valueUsd;
    const ev = evaluateOffer({ type: 'cc', issuer: card.issuer, hardPull: true, catalogId: card.id }, state.profile, state.offers);
    const blocked = ev.score === 'blocked';
    const estVal = liveVal ?? (card.subCash || pointsToUsd(card.subPoints, card.program));
    const bonus = card.subPoints
      ? `${(card.subPoints / 1000).toFixed(0)}k pts (~${fmtMoney(estVal)})`
      : card.subCash ? `$${card.subCash} cash` : card.cashbackMatch ? 'Cashback Match' : 'Varies';
    const liveTag = live ? '<span class="tag tag--live">Feed</span>' : '';

    const inPlan = state.offers.some((o) => o.catalogId === card.id && !['done', 'skip'].includes(o.status));

    return `
      <article class="catalog-card ${blocked ? 'catalog-card--blocked' : ''}">
        <div class="catalog-card__head">
          <div>
            <span class="catalog-card__issuer">${escapeHtml(card.issuer)}</span>
            <h3>${escapeHtml(card.name)}</h3>
          </div>
          ${liveTag}
          ${blocked ? '<span class="gate-pill gate-pill--blocked">Gate</span>' : ''}
        </div>
        <div class="catalog-card__bonus">${bonus}</div>
        ${live?.sourceUrl ? `<a class="hint" href="${escapeHtml(live.sourceUrl)}" target="_blank" rel="noopener">Official offer page</a>` : ''}
        <div class="catalog-card__facts">
          ${card.msr ? `<span>MSR ${fmtMoney(card.msr)} / ${card.msrMonths}mo</span>` : ''}
          <span>AF ${card.annualFee ? fmtMoney(card.annualFee) : '$0'}</span>
          ${card.creditLine ? `<span>~${fmtMoney(card.creditLine)} line</span>` : card.charge ? '<span>Charge card</span>' : ''}
        </div>
        <p class="catalog-card__trip">${escapeHtml(cardTripPitch(card))}</p>
        ${PROGRAMS[card.program]?.transferable
    ? `<p class="catalog-card__xfer">Transfer → ${transferPartnersFor(card.program).slice(0, 3).map((t) => PARTNERS[t.to]?.name).filter(Boolean).join(', ')}</p>`
    : ''}
        <div class="catalog-card__tags">${(card.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}</div>
        ${ev.blockers.length ? `<ul class="offer-alerts offer-alerts--block">${ev.blockers.slice(0, 2).map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : ''}
        <button type="button" class="btn-sm ${inPlan ? 'btn-ghost' : 'btn'}" data-catalog="${card.id}" ${inPlan ? 'disabled' : ''}>
          ${inPlan ? 'In plan' : '+ Add to plan'}
        </button>
      </article>
    `;
  }).join('');

  el.querySelectorAll('[data-catalog]').forEach((btn) => {
    btn.addEventListener('click', () => addFromCatalog(btn.dataset.catalog));
  });
}

function addFromCatalog(catalogId) {
  const card = CARD_CATALOG.find((c) => c.id === catalogId);
  if (!card) return;
  const offer = catalogEntryToOffer(card, state.offers.length + 1);
  state.offers.push(offer);
  save();
  renderAll();
  switchTab('plan');
}

function offerCard(o) {
  const meta = OFFER_TYPES[o.type] || OFFER_TYPES.cc;
  const st = STATUS[o.status] || STATUS.idea;
  const ev = evaluateOffer(o, state.profile, state.offers);
  const badge = ev.score;

  return `
    <article class="offer-card offer-card--${badge}" data-id="${o.id}">
      <header class="offer-card__head">
        <span class="offer-card__icon">${meta.icon}</span>
        <div>
          <h3>${escapeHtml(o.title)}</h3>
          <p class="offer-card__meta">${meta.label} · ${escapeHtml(o.issuer)} · ${fmtMoney(o.valueUsd)}</p>
        </div>
        <span class="offer-card__status">${st.label}</span>
      </header>
      <dl class="offer-card__facts">
        ${o.hardPull ? '<div><dt>Credit</dt><dd>Hard pull</dd></div>' : '<div><dt>Credit</dt><dd>Soft / none</dd></div>'}
        ${o.minSpend ? `<div><dt>MSR</dt><dd>${fmtMoney(o.minSpend)}${o.msrMonths ? ` / ${o.msrMonths}mo` : ''}</dd></div>` : ''}
        ${o.creditLine ? `<div><dt>Est. line</dt><dd>${fmtMoney(o.creditLine)}</dd></div>` : ''}
        ${o.earliestDate ? `<div><dt>Earliest</dt><dd>${o.earliestDate}</dd></div>` : ''}
        ${o.completedDate ? `<div><dt>Done</dt><dd>${o.completedDate}</dd></div>` : ''}
      </dl>
      ${ev.blockers.length ? `<ul class="offer-alerts offer-alerts--block">${ev.blockers.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : ''}
      ${ev.warnings.length ? `<ul class="offer-alerts offer-alerts--warn">${ev.warnings.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : ''}
      ${o.notes ? `<p class="offer-notes">${escapeHtml(o.notes)}</p>` : ''}
      ${o.feedId ? `<p class="offer-notes">Feed: ${escapeHtml(o.feedId)}</p>` : ''}
      <div class="offer-card__actions">
        <select class="offer-owner-select" data-id="${o.id}" aria-label="Household owner">
          <option value="player1" ${getOfferOwner(ensureHousehold(), o.id) === 'player1' ? 'selected' : ''}>${escapeHtml(ensureHousehold().player1Label)}</option>
          <option value="player2" ${getOfferOwner(ensureHousehold(), o.id) === 'player2' ? 'selected' : ''}>${escapeHtml(ensureHousehold().player2Label)}</option>
        </select>
        <select class="offer-status-select" data-id="${o.id}" aria-label="Status">
          ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v.label}</option>`).join('')}
        </select>
        <button type="button" class="btn-ghost offer-edit" data-id="${o.id}">Edit</button>
        <button type="button" class="btn-ghost offer-del" data-id="${o.id}">Remove</button>
      </div>
    </article>
  `;
}

function renderOffers() {
  const list = $('#offerList');
  if (!list) return;
  if (!state.offers.length) {
    list.innerHTML = '<p class="empty">No offers queued — load a plan from the Dashboard or add from the Catalog.</p>';
    return;
  }
  const sorted = [...state.offers].sort((a, b) => (a.priority || 99) - (b.priority || 99));
  list.innerHTML = sorted.map(offerCard).join('');

  list.querySelectorAll('.offer-owner-select').forEach((sel) => {
    sel.addEventListener('change', () => {
      state.household = setOfferOwner(ensureHousehold(), sel.dataset.id, sel.value);
      save();
      renderAll();
    });
  });
  list.querySelectorAll('.offer-status-select').forEach((sel) => {
    sel.addEventListener('change', () => {
      const o = state.offers.find((x) => x.id === sel.dataset.id);
      if (!o) return;
      const wasDone = o.status === 'done';
      o.status = sel.value;
      if (o.status === 'done' && !o.completedDate) {
        o.completedDate = new Date().toISOString().slice(0, 10);
        if (o.hardPull) {
          state.profile.lastHardPull = o.completedDate;
          state.profile = bumpProfileOnApproval(state.profile, o);
        }
      }
      if (wasDone && o.status !== 'done') {
        o.completedDate = '';
      }
      save();
      renderAll();
    });
  });
  list.querySelectorAll('.offer-edit').forEach((btn) => btn.addEventListener('click', () => openForm(btn.dataset.id)));
  list.querySelectorAll('.offer-del').forEach((btn) => btn.addEventListener('click', () => {
    if (!confirm('Remove this offer?')) return;
    state.offers = state.offers.filter((x) => x.id !== btn.dataset.id);
    save();
    renderAll();
  }));
}

function renderTimeline() {
  const tl = suggestTimeline(state.offers, state.profile);
  const el = $('#timeline');
  if (!el) return;
  if (!tl.length) {
    el.innerHTML = '<p class="empty">Add planned offers to see issuer-aware spacing.</p>';
    return;
  }
  el.innerHTML = tl.map((row, i) => `
    <div class="timeline-row">
      <span class="timeline-step">${i + 1}</span>
      <div>
        <strong>${escapeHtml(row.title)}</strong>
        <span class="timeline-date">${row.suggestedDate}</span>
        <p class="timeline-reason">${escapeHtml(row.issuer || '')} · ${escapeHtml(row.reason)}</p>
      </div>
    </div>
  `).join('');
  return tl;
}

function renderSimulation(timeline) {
  const sim = simulateCreditPlan(state.profile, state.offers, timeline || []);

  const summaryEl = $('#simSummary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="sim-summary">
        <div class="sim-summary__row"><span>Baseline</span><strong>${sim.summary.startScore}</strong></div>
        <div class="sim-summary__row"><span>After plan</span><strong>${sim.summary.endScore}</strong></div>
        <div class="sim-summary__row ${sim.summary.maxDrop >= 15 ? 'sim-summary__row--warn' : ''}">
          <span>Max drop</span><strong>−${sim.summary.maxDrop} pts</strong>
        </div>
        <div class="sim-summary__row"><span>CC applications</span><strong>${sim.summary.totalApplications}</strong></div>
        ${sim.summary.mortgageRisk ? '<p class="offer-alerts offer-alerts--warn">Mortgage/refi planned soon — consider pausing new applications.</p>' : ''}
        <p class="hint" style="margin-top:10px">Score typically recovers as inquiries age and MSR balances clear.</p>
      </div>
    `;
  }

  const weightsEl = $('#factorWeights');
  if (weightsEl) {
    weightsEl.innerHTML = Object.entries(WEIGHTS).map(([k, w]) => `
      <div class="factor-bar">
        <span>${FACTOR_LABELS[k]}</span>
        <div class="factor-bar__track"><div class="factor-bar__fill" style="width:${w * 100}%"></div></div>
        <span>${Math.round(w * 100)}%</span>
      </div>
    `).join('');
  }

  const tbody = $('#simTable tbody');
  if (tbody) {
    tbody.innerHTML = sim.steps.map((step) => {
      const deltaCls = step.delta < 0 ? 'delta-neg' : step.delta > 0 ? 'delta-pos' : '';
      const events = step.events?.map((e) => e.detail || e.label).join('; ') || '—';
      return `
        <tr>
          <td><strong>${escapeHtml(step.label)}</strong>${step.date ? `<br><small>${step.date}</small>` : ''}</td>
          <td>${step.score}</td>
          <td class="${deltaCls}">${step.delta > 0 ? '+' : ''}${step.delta || '—'}</td>
          <td>${step.utilizationPct?.toFixed?.(1) ?? step.utilizationPct ?? '—'}%</td>
          <td>${step.inquiries6mo ?? '—'}</td>
          <td>${step.aaoaYears?.toFixed?.(1) ?? '—'}y</td>
          <td><ul class="sim-events">${step.events?.map((e) => `<li>${escapeHtml(e.detail || e.label)}</li>`).join('') || '<li>—</li>'}</ul></td>
        </tr>
      `;
    }).join('');
  }

  updateScoreChart(sim);
  return sim;
}

function updateScoreChart(sim) {
  const canvas = $('#scoreChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = sim.steps.map((s) => s.label.length > 22 ? `${s.label.slice(0, 20)}…` : s.label);
  const data = sim.steps.map((s) => s.score);

  const chartData = {
    labels,
    datasets: [{
      label: 'Projected score',
      data,
      borderColor: '#38bdf8',
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: data.map((v, i) => (i === 0 ? '#4ade80' : v === Math.min(...data) ? '#fb7185' : '#38bdf8')),
    }],
  };

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterLabel(ctx) {
            const step = sim.steps[ctx.dataIndex];
            return step?.delta ? `Δ ${step.delta > 0 ? '+' : ''}${step.delta}` : '';
          },
        },
      },
    },
    scales: {
      y: {
        min: Math.max(300, Math.min(...data) - 25),
        max: Math.min(850, Math.max(...data) + 15),
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#94a3b8' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', maxRotation: 45 },
      },
    },
  };

  if (scoreChart) {
    scoreChart.data = chartData;
    scoreChart.options = opts;
    scoreChart.update('active');
  } else {
    scoreChart = new Chart(canvas, { type: 'line', data: chartData, options: opts });
  }
}

function renderPrinciples() {
  const el = $('#principlesList');
  if (!el) return;
  el.innerHTML = PLANNING_PRINCIPLES.map((p) => `
    <li><strong>${escapeHtml(p.title)}</strong> — ${escapeHtml(p.detail)}</li>
  `).join('');
}

function renderAll() {
  renderProfile();
  renderQuickGates();
  renderPrinciples();
  renderIssuerGrid();
  renderCatalog();
  const timeline = renderTimeline();
  renderOffers();
  const sim = renderSimulation(timeline);
  renderDashboard(sim, timeline);
  renderTransfers();
  renderDealInbox();
}

function switchTab(name) {
  $all('.tab').forEach((t) => {
    t.classList.toggle('tab--active', t.dataset.tab === name);
  });
  $all('.tab-panel').forEach((p) => {
    const on = p.id === `panel-${name}`;
    p.classList.toggle('tab-panel--active', on);
    p.hidden = !on;
  });
  if (name === 'inbox' && offersFeed) {
    markFeedSeen(offersFeed);
    updateFeedBadge();
  }
}

function populateIssuerSelects() {
  const offerIssuer = $('#offerIssuer');
  const catalogIssuer = $('#catalogIssuer');
  if (offerIssuer && !offerIssuer.options.length) {
    ISSUERS.forEach((i) => {
      const o = document.createElement('option');
      o.value = o.textContent = i;
      offerIssuer.appendChild(o);
    });
  }
  if (catalogIssuer) {
    const current = catalogIssuer.value;
    catalogIssuer.innerHTML = '<option value="all">All issuers</option>';
    ISSUER_LIST.filter((i) => i !== 'Other').forEach((i) => {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = i;
      catalogIssuer.appendChild(o);
    });
    catalogIssuer.value = current || 'all';
  }
}

function openForm(id) {
  const modal = $('#offerModal');
  const o = id ? state.offers.find((x) => x.id === id) : null;
  $('#offerModalTitle').textContent = o ? 'Edit offer' : 'Add offer';
  $('#offerId').value = o?.id || '';
  $('#offerCatalogId').value = o?.catalogId || '';
  $('#offerTitle').value = o?.title || '';
  $('#offerType').value = o?.type || 'cc';
  $('#offerIssuer').value = o?.issuer || 'Chase';
  $('#offerValue').value = o?.valueUsd ?? '';
  $('#offerMinSpend').value = o?.minSpend ?? '';
  $('#offerMsrMonths').value = o?.msrMonths ?? 3;
  $('#offerCreditLine').value = o?.creditLine ?? '';
  $('#offerHardPull').checked = o?.hardPull ?? true;
  $('#offerPriority').value = o?.priority ?? 5;
  $('#offerEarliest').value = o?.earliestDate || '';
  $('#offerNotes').value = o?.notes || '';
  modal.hidden = false;
}

function closeForm() {
  $('#offerModal').hidden = true;
}

function saveOffer(e) {
  e.preventDefault();
  const id = $('#offerId').value || crypto.randomUUID();
  const existing = state.offers.find((x) => x.id === id);
  const payload = {
    id,
    catalogId: $('#offerCatalogId').value || existing?.catalogId || '',
    type: $('#offerType').value,
    title: $('#offerTitle').value.trim(),
    issuer: $('#offerIssuer').value,
    valueUsd: Number($('#offerValue').value) || 0,
    minSpend: Number($('#offerMinSpend').value) || 0,
    msrMonths: Number($('#offerMsrMonths').value) || 3,
    creditLine: Number($('#offerCreditLine').value) || 0,
    hardPull: $('#offerHardPull').checked,
    priority: Number($('#offerPriority').value) || 5,
    earliestDate: $('#offerEarliest').value,
    notes: $('#offerNotes').value.trim(),
    status: existing?.status || 'planned',
    completedDate: existing?.completedDate || '',
    subPoints: existing?.subPoints,
    program: existing?.program,
  };
  if (!payload.title) return;
  if (existing) Object.assign(existing, payload);
  else state.offers.push(payload);
  save();
  closeForm();
  renderAll();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `promo-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = migrateState(JSON.parse(reader.result));
      if (!state.household) state.household = defaultHousehold();
      save();
      renderAll();
    } catch {
      alert('Could not read that file — need a promo-tracker JSON export.');
    }
  };
  reader.readAsText(file);
}

function populateInboxIssuers() {
  const sel = $('#inboxIssuer');
  if (!sel || sel.dataset.bound) return;
  ISSUERS.forEach((i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = i;
    sel.appendChild(o);
  });
  sel.dataset.bound = '1';
}

async function init() {
  populateIssuerSelects();
  populateInboxIssuers();

  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-profile]')) readProfile();
    if (e.target.matches('[data-household]')) {
      readHouseholdFromDom();
      save();
      renderAll();
    }
    if (e.target.matches('#inboxType, #inboxIssuer')) renderDealInbox();
  });
  document.addEventListener('input', (e) => {
    if (e.target.matches('#inboxSearch')) renderDealInbox();
  });
  document.addEventListener('blur', (e) => {
    if (e.target.matches('[data-profile]')) readProfile();
    if (e.target.matches('[data-household]')) {
      readHouseholdFromDom();
      save();
    }
  }, true);

  $all('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  $('#catalogIssuer')?.addEventListener('change', renderCatalog);
  $('#transferProgram')?.addEventListener('change', (e) => renderTransferTable(e.target.value));


  $('#addOffer')?.addEventListener('click', () => openForm(null));
  $('#loadSeed')?.addEventListener('click', () => loadPlan('balanced'));
  $('#loadBalanced')?.addEventListener('click', () => loadPlan('balanced'));
  $('#loadConservative')?.addEventListener('click', () => loadPlan('conservative'));
  $('#exportBtn')?.addEventListener('click', exportJson);
  $('#importBtn')?.addEventListener('click', () => $('#importFile').click());
  $('#importFile')?.addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (f) importJson(f);
    e.target.value = '';
  });
  $('#offerForm')?.addEventListener('submit', saveOffer);
  $('#offerCancel')?.addEventListener('click', closeForm);
  $('#offerModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'offerModal') closeForm();
  });

  $('#refreshFeed')?.addEventListener('click', refreshFeedNow);

  try {
    offersFeed = await loadOffersFeed();
    updateFeedBadge();
  } catch (e) {
    console.warn('Initial feed load:', e.message);
  }

  renderAll();
}

init();