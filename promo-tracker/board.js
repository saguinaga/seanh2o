import {
  OFFER_TYPES, STATUS, ISSUERS, defaultState, defaultProfile,
  evaluateOffer, suggestTimeline, seedOffers, seedOfferPlan, migrateState, bumpProfileOnApproval,
} from './rules.js';
import { allIssuerDashboard, issuerRulesMeta, ISSUER_LIST, ISSUER_GROUPS } from './issuers.js';
import {
  CARD_CATALOG, catalogEntryToOffer, filterCatalog, pointsToUsd, POINT_VALUES, CATALOG_CATEGORIES,
} from './catalog.js';
import { simulateCreditPlan, WEIGHTS, FACTOR_LABELS } from './score-sim.js';
import { DREAM_TRIPS, activeOffersValue, tripsFundedByValue, cardTripPitch } from './trips.js';
import {
  OFFER_PLANS, PLANNING_PRINCIPLES, earningsProjection,
} from './earnings.js';
import {
  DEFAULT_TRANSFER_BONUS_PCT, INFLUENCER_MATH, TRANSFER_PLAYS,
} from './bb-value.js';
import {
  PROGRAMS, PARTNERS, TRANSFER_RULES, HOUSEHOLD_PLAYBOOK,
  chaseUrPlaybookContext,
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
import {
  helpTip, labelWithTip, ruleLabelHtml, issuerStatusLabel, gatePassLabel,
  glossaryHtml, formatWelcomeBonus, formatSpendReq,
} from './bb-labels.js';
import { THEMES, DEFAULT_THEME, applyTheme, chartColors } from './themes.js';
import {
  analyzeWallet, walletCardsForPicker, WALLET_PRESETS,
} from './wallet-integration.js';
import {
  initVanity, dismissWelcomeSplash, showToast, showToastWithUndo,
  celebrateOfferDone, celebratePin, celebratePlanLoad, celebrateThemeChange,
  animateStats, checkMilestones, tabSwitchSparkle,
  updateCfoLevel, animateCreditScores, flairCreditPanel,
} from './vanity.js';

const STORAGE_KEY = 'promo_tracker_v3';
const LEGACY_KEY = 'promo_tracker_v1';

const COUNTER_FIELDS = [
  { id: 'chaseCards30d', label: 'Chase cards opened (last 30 days)', tip: '2/30' },
  { id: 'amexCards90d', label: 'Amex cards opened (last 90 days)', tip: '2/90' },
  { id: 'amexCardsTotal', label: 'Amex credit cards total', tip: '5-card' },
  { id: 'citiCards8d', label: 'Citi cards opened (last 8 days)', tip: '8/65' },
  { id: 'citiCards65d', label: 'Citi cards opened (last 65 days)', tip: '2/65' },
  { id: 'discoverCardsTotal', label: 'Discover cards you hold', tip: '1card' },
  { id: 'capOneCards6mo', label: 'Capital One cards (last 6 months)', tip: '1/6' },
  { id: 'capOneCardsTotal', label: 'Capital One personal cards total', tip: '2/3' },
  { id: 'bofaCards2mo', label: 'BofA cards (last 2 months)', tip: '2/3/4' },
  { id: 'bofaCards12mo', label: 'BofA cards (last 12 months)', tip: 'bofa12' },
  { id: 'bofaCards24mo', label: 'BofA cards (last 24 months)', tip: 'bofa24' },
  { id: 'wfCards6mo', label: 'Wells Fargo cards (last 6 months)', tip: '1/6wf' },
  { id: 'usbCards12mo', label: 'US Bank cards (last 12 months)', tip: 'usbank1' },
  { id: 'barcCards6mo', label: 'Barclays cards (last 6 months)', tip: 'barc6' },
  { id: 'pncCards6mo', label: 'PNC cards (last 6 months)', tip: 'pnc6' },
  { id: 'tdCards6mo', label: 'TD Bank cards (last 6 months)', tip: 'td6' },
  { id: 'truistCards6mo', label: 'Truist cards (last 6 months)', tip: 'truist6' },
  { id: 'regionsCards6mo', label: 'Regions cards (last 6 months)', tip: 'regions6' },
  { id: 'fifthThirdCards12mo', label: 'Fifth Third cards (last 12 months)', tip: '53_12' },
  { id: 'huntingtonCards6mo', label: 'Huntington cards (last 6 months)', tip: 'hunt6' },
  { id: 'bmoCards6mo', label: 'BMO cards (last 6 months)', tip: 'bmo6' },
  { id: 'nfcuCards90d', label: 'Navy Federal cards (last 90 days)', tip: 'nfcu90' },
  { id: 'penfedCards6mo', label: 'PenFed cards (last 6 months)', tip: 'penfed6' },
  { id: 'dcuCards6mo', label: 'DCU cards (last 6 months)', tip: 'dcu6' },
  { id: 'alliantCards6mo', label: 'Alliant cards (last 6 months)', tip: 'alliant6' },
  { id: 'andrewsCards6mo', label: 'Andrews FCU cards (last 6 months)', tip: 'andrews6' },
  { id: 'goldmanCardsTotal', label: 'Goldman / Apple cards you hold', tip: 'apple1' },
  { id: 'sofiCards6mo', label: 'SoFi cards (last 6 months)', tip: 'sofi6' },
  { id: 'syncCards6mo', label: 'Synchrony cards (last 6 months)', tip: 'sync6' },
  { id: 'breadCards6mo', label: 'Bread Financial cards (last 6 months)', tip: 'bread6' },
  { id: 'elanCards6mo', label: 'Elan-brand cards (last 6 months)', tip: 'elan6' },
  { id: 'fnboCards6mo', label: 'FNBO cards (last 6 months)', tip: 'fnbo6' },
  { id: 'firstTechCards6mo', label: 'First Tech cards (last 6 months)', tip: 'ftfcu6' },
];

let state = load();
applyTheme(state.theme || DEFAULT_THEME);
let scoreChart = null;
let roadmapScoreChart = null;
let offersFeed = null;
let transferBonusPct = DEFAULT_TRANSFER_BONUS_PCT;

let lastRemovedOffer = null;
let undoTimer = null;

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

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function scoreBandForScore(score) {
  const s = Number(score) || 0;
  if (s >= 800) return '800+';
  if (s >= 760) return '760-799';
  if (s >= 720) return '720-759';
  if (s >= 680) return '680-719';
  return '680-719';
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
  setVal('roadmapBaselineScore', p.baselineScore);

  const counterEl = $('#issuerCounters');
  if (counterEl) {
    counterEl.innerHTML = COUNTER_FIELDS.map(({ id, label, tip }) => `
      <label><span class="label-with-tip">${label}${tip ? helpTip(tip) : ''}</span>
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
    baselineScore: readVal('roadmapBaselineScore') || readVal('baselineScore'),
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
    pncCards6mo: readVal('pncCards6mo') ?? p.pncCards6mo ?? 0,
    tdCards6mo: readVal('tdCards6mo') ?? p.tdCards6mo ?? 0,
    truistCards6mo: readVal('truistCards6mo') ?? p.truistCards6mo ?? 0,
    regionsCards6mo: readVal('regionsCards6mo') ?? p.regionsCards6mo ?? 0,
    fifthThirdCards12mo: readVal('fifthThirdCards12mo') ?? p.fifthThirdCards12mo ?? 0,
    huntingtonCards6mo: readVal('huntingtonCards6mo') ?? p.huntingtonCards6mo ?? 0,
    bmoCards6mo: readVal('bmoCards6mo') ?? p.bmoCards6mo ?? 0,
    nfcuCards90d: readVal('nfcuCards90d') ?? p.nfcuCards90d ?? 0,
    penfedCards6mo: readVal('penfedCards6mo') ?? p.penfedCards6mo ?? 0,
    dcuCards6mo: readVal('dcuCards6mo') ?? p.dcuCards6mo ?? 0,
    alliantCards6mo: readVal('alliantCards6mo') ?? p.alliantCards6mo ?? 0,
    andrewsCards6mo: readVal('andrewsCards6mo') ?? p.andrewsCards6mo ?? 0,
    goldmanCardsTotal: readVal('goldmanCardsTotal') ?? p.goldmanCardsTotal ?? 0,
    sofiCards6mo: readVal('sofiCards6mo') ?? p.sofiCards6mo ?? 0,
    syncCards6mo: readVal('syncCards6mo') ?? p.syncCards6mo ?? 0,
    breadCards6mo: readVal('breadCards6mo') ?? p.breadCards6mo ?? 0,
    elanCards6mo: readVal('elanCards6mo') ?? p.elanCards6mo ?? 0,
    fnboCards6mo: readVal('fnboCards6mo') ?? p.fnboCards6mo ?? 0,
    firstTechCards6mo: readVal('firstTechCards6mo') ?? p.firstTechCards6mo ?? 0,
    existingPoints: readPointsGrid('existing'),
    partnerPoints: readPointsGrid('partner'),
    poolHousehold: readVal('poolHousehold'),
    partnerLabel: p.partnerLabel || 'Partner',
    ownedCards: readOwnedCards(),
  };

  if (state.profile.totalCreditLimit > 0) {
    state.profile.utilizationPct = Math.round(
      (state.profile.totalBalances / state.profile.totalCreditLimit) * 1000,
    ) / 10;
    setVal('utilizationPct', state.profile.utilizationPct);
  }

  if (state.profile.baselineScore) {
    state.profile.scoreBand = scoreBandForScore(state.profile.baselineScore);
    setVal('scoreBand', state.profile.scoreBand);
    setVal('baselineScore', state.profile.baselineScore);
    setVal('roadmapBaselineScore', state.profile.baselineScore);
  }

  save();
  renderAll();
}

function readOwnedCards() {
  return $all('[data-owned-card]:checked').map((el) => el.value);
}

function renderWalletIntegration() {
  const owned = state.profile.ownedCards || [];
  const analysis = analyzeWallet(owned);

  const summaryEl = $('#walletSummary');
  if (summaryEl) summaryEl.textContent = analysis.summary;

  const gridEl = $('#walletOwnedGrid');
  if (gridEl && !gridEl.dataset.bound) {
    const cards = walletCardsForPicker();
    const byIssuer = {};
    cards.forEach((c) => {
      if (!byIssuer[c.issuer]) byIssuer[c.issuer] = [];
      byIssuer[c.issuer].push(c);
    });
    gridEl.innerHTML = Object.entries(byIssuer).map(([issuer, list]) => `
      <fieldset class="wallet-issuer-group">
        <legend>${escapeHtml(issuer)}</legend>
        <div class="wallet-check-grid">
          ${list.map((c) => `
            <label class="wallet-check">
              <input type="checkbox" value="${c.id}" data-owned-card>
              <span>${escapeHtml(c.name)}</span>
            </label>
          `).join('')}
        </div>
      </fieldset>
    `).join('');
    gridEl.dataset.bound = '1';
    gridEl.addEventListener('change', (e) => {
      if (e.target.matches('[data-owned-card]')) {
        state.profile.ownedCards = readOwnedCards();
        save();
        renderWalletIntegration();
      }
    });
  }

  $all('[data-owned-card]').forEach((el) => {
    el.checked = owned.includes(el.value);
  });

  const playsEl = $('#walletPlays');
  if (playsEl) {
    playsEl.innerHTML = analysis.plays.length
      ? analysis.plays.map((p) => `
        <article class="wallet-play">
          <span class="wallet-play__emoji">${p.emoji}</span>
          <div>
            <strong>${escapeHtml(p.title)}</strong>
            <p>${escapeHtml(p.body)}</p>
          </div>
        </article>
      `).join('')
      : '';
  }

  const actionsEl = $('#walletActions');
  if (actionsEl) {
    actionsEl.innerHTML = analysis.actions.length
      ? `<h3 class="subhead">Smart moves</h3><ol class="wallet-action-list">${analysis.actions.map((a) => `
        <li class="wallet-action wallet-action--${a.priority}">
          <strong>${escapeHtml(a.title)}</strong>
          <span>${escapeHtml(a.detail)}</span>
        </li>
      `).join('')}</ol>`
      : '';
  }

  const routingEl = $('#walletRouting');
  if (routingEl) {
    routingEl.innerHTML = analysis.spendRouting?.length
      ? `<h3 class="subhead">Where to swipe (your stack)</h3>
        <div class="wallet-routing-grid">${analysis.spendRouting.map((r) => `
          <article class="wallet-route ${r.active ? 'wallet-route--active' : 'wallet-route--gap'}">
            <span class="wallet-route__icon">${r.icon}</span>
            <div>
              <strong>${escapeHtml(r.category)}</strong>
              <span class="wallet-route__card">${r.active ? escapeHtml(r.cardName) : 'Add a card'}</span>
              <p>${escapeHtml(r.note)}</p>
            </div>
          </article>
        `).join('')}</div>`
      : '';
  }

  const nextEl = $('#walletNextCards');
  if (nextEl) {
    nextEl.innerHTML = analysis.nextCards?.length
      ? `<h3 class="subhead">Next cards to maximize (not replacements)</h3>
        <div class="wallet-next-grid">${analysis.nextCards.map((n) => `
          <article class="wallet-next">
            <strong>${escapeHtml(n.title)}</strong>
            <p>${escapeHtml(n.why)}</p>
            <span class="wallet-next__upside">Upside: ${escapeHtml(n.upside)}</span>
            <button type="button" class="btn-sm btn-ghost" data-queue-catalog="${escapeHtml(n.catalogId)}">Pin to queue</button>
          </article>
        `).join('')}</div>`
      : '<p class="hint">Your stack covers the main lanes — focus on welcome bonuses and transfer timing.</p>';
    nextEl.querySelectorAll('[data-queue-catalog]').forEach((btn) => {
      btn.addEventListener('click', () => addFromCatalog(btn.dataset.queueCatalog));
    });
  }

  const verdictsEl = $('#walletVerdicts');
  if (verdictsEl) {
    verdictsEl.innerHTML = analysis.cardVerdicts.length
      ? `<h3 class="subhead">Card-by-card</h3><div class="wallet-verdict-grid">${analysis.cardVerdicts.map((v) => `
        <article class="wallet-verdict wallet-verdict--${v.verdict}">
          <header>
            <strong>${escapeHtml(v.name)}</strong>
            <span class="wallet-verdict__tag">${verdictLabel(v.verdict)}</span>
          </header>
          <p class="wallet-verdict__earn">${escapeHtml(v.earnSummary)}</p>
          <p class="wallet-verdict__why">${escapeHtml(v.why)}</p>
          ${v.cancelNote ? `<p class="wallet-verdict__cancel">${escapeHtml(v.cancelNote)}</p>` : ''}
        </article>
      `).join('')}</div>`
      : '<p class="empty">Check the cards you hold above.</p>';
  }
}

function verdictLabel(v) {
  const map = {
    keep: 'Keep',
    keep_if_using: 'Keep if using',
    evaluate_fee: 'Check annual fee',
    add_when_ready: 'Add later',
    upgrade_path: 'Upgrade path',
  };
  return map[v] || 'Review';
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
  const proj = projection || earningsProjection(state.offers, [], { transferBonusPct });

  const tripVal = fmtMoney(proj.netTravelPipeline || proj.netPipeline);
  const cashVal = fmtMoney(proj.netPipeline);
  const capturedVal = fmtMoney(proj.captured);
  const perMo = proj.travelPerMonth > 0 ? fmtMoney(proj.travelPerMonth) : '$0';
  const ptsVal = proj.pointsQueued ? fmtPts(proj.pointsQueued) : '0';
  const dropVal = sim && sim.summary.maxDrop > 0 ? `−${sim.summary.maxDrop}` : '—';

  const dip = sim && sim.summary.maxDrop > 0 ? sim.summary.maxDrop : 0;
  const tripForDip = proj.netTravelPipeline || proj.netPipeline || 0;
  const valPerDip = dip > 0 ? fmtMoney(Math.round(tripForDip / dip)) + '/pt' : '—';

  animateStats([
    { id: 'statPipeline', text: tripVal, pulse: true },
    { id: 'statCashFloor', text: cashVal },
    { id: 'statCaptured', text: capturedVal, pulse: proj.captured > 0 },
    { id: 'statPerMonth', text: perMo },
    { id: 'statPoints', text: ptsVal },
    { id: 'statQueued', text: String(proj.queued) },
    { id: 'statMaxDrop', text: dropVal },
    { id: 'statValuePerDip', text: valPerDip },
  ]);

  const heroEl = $('#statPipeline');
  if (heroEl) {
    heroEl.title = `If redeemed for cash/portal: ${cashVal}. Transfer partners usually give higher (trip) value.`;
  }
  if (sim) {
    const el = $('#statMaxDrop');
    if (el) {
      el.style.color = sim.summary.maxDrop >= 20 ? 'var(--rose)' : 'var(--green)';
      el.title = `Modeled max drop from this plan's hard pulls + spend. See the Credit score panel below or the Roadmap tab for details and recovery path.`;
    }
    const vpd = $('#statValuePerDip');
    if (vpd && dip > 0) {
      vpd.title = `${fmtMoney(Math.round(tripForDip / dip))} trip value per point of score dip. Higher is better (more upside per credit point degraded).`;
    }
  }
}

function renderCreditImpact(sim) {
  const container = $('#dashboardCreditImpact');
  const numbers = $('#creditImpactNumbers');
  const note = $('#creditImpactNote');
  if (!container || !numbers) return;

  if (!sim || !state.offers.length) {
    const baseline = state.profile?.baselineScore || 740;
    numbers.innerHTML = `
      <div>
        <span class="num">${baseline}</span>
        <span class="label">Your current baseline • Load a plan or start the guide to model the full path</span>
      </div>
    `;
    if (note) note.innerHTML = 'The model looks at hard pulls, the extra utilization while hitting spend targets, and normal inquiry aging. Spacing applications responsibly keeps the impact small and temporary.';
    return;
  }

  const s = sim.summary;
  const start = s.startScore;
  const end = s.endScore;
  const low = s.minScore;
  const drop = s.maxDrop;

  const dropHtml = drop > 0 
    ? `<span class="dip">−${drop} at lowest</span>` 
    : '<span class="recovery">No dip</span>';

  const net = end - start;
  const netHtml = net > 0 
    ? `<span class="recovery">+${net} net</span>` 
    : (net < 0 ? `<span class="dip">${net} net</span>` : '');

  numbers.innerHTML = `
    <div>
      <span class="num">${start}</span>
      <span class="label">Starting (your baseline)</span>
    </div>
    <div>
      <span class="num">${low}</span>
      <span class="label">Lowest during plan ${dropHtml}</span>
    </div>
    <div>
      <span class="num">${end}</span>
      <span class="label">Projected at end ${netHtml}</span>
    </div>
  `;

  if (note) {
    const apps = s.totalApplications || 0;
    note.innerHTML = `Hard pulls (${apps} modeled) + short-term spend on new cards cause the dip. We deliberately space things ~3–4 months apart using only money you already spend, so inquiries age and utilization drops back down. This is a conservative FICO-style model.`;
  }

  // Color the whole card lightly based on risk
  if (drop >= 25) {
    container.style.borderColor = 'var(--rose)';
  } else if (drop >= 15) {
    container.style.borderColor = 'var(--amber, #a66b00)';
  } else {
    container.style.borderColor = 'var(--accent-soft)';
  }

  flairCreditPanel(sim);
  animateCreditScores();
}

function renderDashboardTimeline(timeline) {
  const el = $('#dashboardTimeline');
  if (!el) return;
  const pending = (timeline || []).slice(0, 4);
  if (!pending.length) {
    el.innerHTML = '<p class="empty">Load a plan or add offers to see pacing.</p>';
    return;
  }
  el.innerHTML = `${pending.map((row, i) => `
    <div class="timeline-row">
      <span class="timeline-step">${i + 1}</span>
      <div>
        <strong>${escapeHtml(row.title)}</strong>
        <span class="timeline-date">${row.suggestedDate}</span>
        <p class="timeline-reason">${escapeHtml(row.reason)}</p>
      </div>
    </div>
  `).join('')}
    <p style="margin-top:10px"><button type="button" class="btn-sm btn-ghost" data-tab-jump="roadmap">Full roadmap &amp; score impact →</button></p>`;
}

function renderDashboard(sim, timeline) {
  const proj = earningsProjection(state.offers, timeline, { transferBonusPct });
  renderStats(sim, proj);
  renderCreditImpact(sim);
  checkMilestones(proj, sim);
  updateCfoLevel(proj);

  const snap = $('#earningsSnapshot');
  if (snap) {
    const typeRows = Object.entries(proj.byType).map(([t, v]) => {
      const label = {
        cc: 'Card welcome bonuses', bank: 'Bank bonuses', shopping: 'Shopping/stacks', travel: 'Travel promos',
      }[t] || t;
      return `<div class="sim-summary__row"><span>${label}</span><strong>${fmtMoney(v)} cash</strong></div>`;
    }).join('');

    const bonusNote = transferBonusPct > 0
      ? `Includes +${transferBonusPct}% transfer bonus assumption on airline/hotel moves.`
      : 'Transfer partner value without a promo bonus.';

    snap.innerHTML = `
      <div class="sim-summary">
        <div class="sim-summary__row sim-summary__row--highlight">
          <span>${labelWithTip('Travel upside (transfer partners)', 'travel_upside')}</span>
          <strong>${fmtMoney(proj.netTravelPipeline)}</strong>
        </div>
        <div class="sim-summary__row">
          <span>${labelWithTip('Cash floor (portal / cash)', 'cash_floor')}</span>
          <strong>${fmtMoney(proj.netPipeline)}</strong>
        </div>
        <div class="sim-summary__row sim-summary__row--up">
          <span>Transfer uplift</span>
          <strong>+${fmtMoney(proj.travelUplift)}</strong>
        </div>
        <div class="sim-summary__row"><span>${labelWithTip('Less annual fees (pending)', 'af')}</span><strong>−${fmtMoney(proj.fees)}</strong></div>
        <div class="sim-summary__row"><span>${labelWithTip('Already captured', 'captured')}</span><strong>${fmtMoney(proj.captured)}</strong></div>
        <div class="sim-summary__row"><span>Points in queue</span><strong>${fmtPts(proj.pointsQueued)}</strong></div>
        <div class="sim-summary__row"><span>${labelWithTip('Total MSR spend needed (Minimum Spend Requirement)', 'msr')}</span><strong>${fmtMoney(proj.msr)}</strong></div>
        <div class="sim-summary__row"><span>Plan horizon</span><strong>~${proj.months} mo</strong></div>
        ${typeRows}
      </div>
      <p class="hint" style="margin-top:10px">${bonusNote}</p>
      <p class="hint">Mark offers <strong>Done</strong> when bonuses post — captured value and gates update automatically.</p>
    `;
  }

  renderTransferUpside(proj);

  renderDashboardTimeline(timeline);

  const planGrid = $('#planGrid');
  if (planGrid) {
    planGrid.innerHTML = OFFER_PLANS.map((p) => `
      <article class="stack-card ${p.id === 'household-stretch' ? 'stack-card--household' : ''}">
        <header class="stack-card__head">
          <span class="stack-card__emoji">${p.emoji}</span>
          <div>
            <h3>${escapeHtml(p.name)}</h3>
            <p class="stack-card__hook">${escapeHtml(p.hook)}</p>
          </div>
          <div class="stack-card__vals">
            <strong class="stack-card__val">~${fmtMoney(p.estTravelValue || p.estValue)}</strong>
            <span class="stack-card__val-sub">trip value</span>
            <span class="stack-card__val-floor">${fmtMoney(p.estValue)} cash</span>
          </div>
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
  const hadOffers = state.offers.length > 0;
  const plan = OFFER_PLANS.find((p) => p.id === planId);
  state.offers = seedOfferPlan(planId);
  const hh = ensureHousehold();
  hh.offerOwner = {};
  state.offers.forEach((o) => {
    if (o.ownerHint) {
      state.household = setOfferOwner(hh, o.id, o.ownerHint);
    }
  });
  if (planId === 'household-stretch' || planId === 'creator-stack') {
    transferBonusPct = DEFAULT_TRANSFER_BONUS_PCT;
    const bonusEl = $('#transferBonusToggle');
    if (bonusEl) bonusEl.checked = true;
  }
  save();
  renderAll();
  celebratePlanLoad(plan?.name || 'Starter plan', { replaced: hadOffers });
  switchTab('plan');
}

function renderTransferUpside(proj) {
  const el = $('#transferUpside');
  if (!el) return;

  const hh = ensureHousehold();
  const hw = householdWallet(state.profile, hh, state.offers, transferBonusPct);
  const combinedTravel = (hw.player1.totalTravelUsd || hw.player1.totalUsd)
    + (hw.player2.totalTravelUsd || hw.player2.totalUsd);

  const programRows = hw.player1.lines.length || hw.player2.lines.length
    ? [...hw.player1.lines, ...hw.player2.lines]
      .reduce((acc, line) => {
        const existing = acc.find((x) => x.program === line.program);
        if (existing) {
          existing.total += line.total;
          existing.portalUsd += line.portalUsd || line.usd;
          existing.transferUsd += line.transferUsd || line.usd;
        } else {
          acc.push({ ...line });
        }
        return acc;
      }, [])
      .sort((a, b) => (b.transferUsd || 0) - (a.transferUsd || 0))
      .map((line) => `
        <div class="upside-row">
          <div>
            <strong style="color:${line.meta.color}">${escapeHtml(line.meta.short)}</strong>
            <span class="hint">${fmtPts(line.total)} pts queued</span>
          </div>
          <div class="upside-row__vals">
            <span>${fmtMoney(line.portalUsd || line.usd)} cash</span>
            <span class="upside-row__arrow">→</span>
            <strong>${fmtMoney(line.transferUsd || line.usd)}</strong>
            ${line.bestPartner ? `<span class="hint">via ${escapeHtml(line.bestPartner.name)}</span>` : ''}
          </div>
        </div>
      `).join('')
    : '<p class="empty">Load a plan to see how transfers change the math.</p>';

  const plays = TRANSFER_PLAYS.slice(0, 4).map((p) => `
    <article class="play-card">
      <h4>${escapeHtml(p.name)}</h4>
      <p class="hint">${escapeHtml(p.pitch)}</p>
    </article>
  `).join('');

  el.innerHTML = `
    <div class="upside-hero">
      <div>
        <p class="upside-hero__label">Household travel value (transfer partners)</p>
        <p class="upside-hero__val">~${fmtMoney(combinedTravel)}</p>
        <p class="hint">Cash floor ~${fmtMoney(hw.player1.totalUsd + hw.player2.totalUsd)} · +${fmtMoney(Math.max(0, combinedTravel - (hw.player1.totalUsd + hw.player2.totalUsd)))} from smart transfers</p>
      </div>
      <label class="upside-toggle form-row-check">
        <input type="checkbox" id="transferBonusToggle" ${transferBonusPct > 0 ? 'checked' : ''}>
        Assume +${DEFAULT_TRANSFER_BONUS_PCT}% transfer bonus on airline moves
      </label>
    </div>
    <div class="upside-programs">${programRows}</div>
    <h3 class="subhead">How the same points stretch into bigger trips</h3>
    <div class="play-grid">${plays}</div>
  `;

  const toggle = $('#transferBonusToggle');
  if (toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = '1';
    toggle.addEventListener('change', (e) => {
      transferBonusPct = e.target.checked ? DEFAULT_TRANSFER_BONUS_PCT : 0;
      renderAll();
    });
  }
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
    showToast(`Could not refresh feed: ${e.message}`);
    console.warn('Feed refresh issue (likely network or local file):', e);
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
        <span>Better welcome bonus than queued</span>
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
      <label><span class="label-with-tip">Personal cards opened (24 mo)${helpTip('five24')}</span>
        <input type="number" id="hh_p2_524" data-household min="0" value="${p2.personalCards24mo ?? 0}">
      </label>
      <label><span class="label-with-tip">Hard inquiries (6 mo)${helpTip('inquiries')}</span>
        <input type="number" id="hh_p2_inq6" data-household min="0" value="${p2.inquiries6mo ?? 0}">
      </label>
      <label><span class="label-with-tip">Chase cards opened (30 days)${helpTip('2/30')}</span>
        <input type="number" id="hh_p2_chase30" data-household min="0" value="${p2.chaseCards30d ?? 0}">
      </label>
      <label><span class="label-with-tip">Amex cards opened (90 days)${helpTip('2/90')}</span>
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

function renderChaseUrPlaybook() {
  const el = $('#chaseUrPlaybook');
  if (!el) return;

  const ctx = chaseUrPlaybookContext(state.profile.ownedCards || []);

  // Pull the user's actual Chase UR balance if available
  const hh = ensureHousehold();
  const hw = householdWallet(state.profile, hh, state.offers, transferBonusPct);
  const chaseLine = (hw.player1.lines || []).concat(hw.player2.lines || [])
    .find(l => l.program === 'chase_ur');
  const userChasePts = chaseLine ? chaseLine.total : ctx.examplePoints;

  const preferredCpp = 0.0125;
  const reserveCpp = 0.015;

  // Determine effective portal cpp from owned cards
  const hasReserve = (state.profile.ownedCards || []).includes('chase-csr');
  const effectivePortalCpp = hasReserve ? reserveCpp : (ctx.unlocked ? preferredCpp : 0.01);

  const pb = {
    headline: 'Chase UR decision tool',
    subhead: 'Portal vs transfer comparison (using local fallback data)',
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

  // Build comparison using user's actual points
  const portalUsd = Math.round(userChasePts * effectivePortalCpp);
  const hyattCpp = PARTNERS.hyatt?.cpp || 0.02;
  const hyattUsd = Math.round(userChasePts * hyattCpp);
  const swCpp = PARTNERS.southwest?.cpp || 0.015;
  const swUsd = Math.round(userChasePts * swCpp);
  const upliftHyatt = hyattUsd - portalUsd;

  const plays = pb.topPlays.map((play) => {
    const partner = PARTNERS[play.partner];
    return `
      <article class="chase-play">
        <header class="chase-play__head">
          <span class="chase-play__emoji">${partner?.emoji || '✈️'}</span>
          <strong>${escapeHtml(play.title)}</strong>
        </header>
        <p>${escapeHtml(play.why)}</p>
        <p class="chase-play__family"><strong>Household angle:</strong> ${escapeHtml(play.family)}</p>
        <p class="chase-play__how"><strong>How:</strong> ${escapeHtml(play.how)}</p>
      </article>
    `;
  }).join('');

  el.innerHTML = `
    <h2>Chase UR: Portal vs Transfer — which actually makes sense?</h2>
    <p class="hint chase-playbook__sub">${escapeHtml(pb.subhead)}</p>

    ${ctx.unlocked
    ? `<p class="chase-playbook__unlock">✅ You have a <strong>${hasReserve ? 'Sapphire Reserve' : 'Sapphire Preferred / equivalent'}</strong> — transfers are unlocked at ${ (effectivePortalCpp*100).toFixed(2) }¢/pt on the portal.</p>`
    : `<p class="chase-playbook__warn">⚠️ Add a Sapphire (Preferred or Reserve) in "My card stack" above to unlock transfers. Freedom points alone are stuck at 1¢.</p>`}

    <div class="chase-cmp" style="margin: 12px 0;">
      <div style="display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap;">
        <div>
          <label style="font-size:0.8rem; display:block;">Your Chase UR points</label>
          <input type="number" id="chaseUrTestPoints" value="${userChasePts}" style="width:140px; font-size:1.1rem; padding:4px 8px;">
        </div>
        <div>
          <label style="font-size:0.8rem; display:block;">Sapphire level</label>
          <select id="chaseUrSapphireLevel" style="padding:4px 8px;">
            <option value="0.0125" ${!hasReserve ? 'selected' : ''}>Preferred (1.25¢ portal)</option>
            <option value="0.015" ${hasReserve ? 'selected' : ''}>Reserve (1.5¢ portal)</option>
          </select>
        </div>
        <button type="button" class="btn-sm" id="recalcChaseUr">Recalculate</button>
      </div>

      <div class="chase-cmp__table-wrap" style="margin-top:10px;">
        <table class="chase-cmp__table">
          <thead><tr><th>Path</th><th>¢/pt</th><th>Value of your points</th><th>Uplift vs Portal</th></tr></thead>
          <tbody id="chaseUrCmpBody">
            <tr class="chase-cmp__row--portal">
              <td>Chase Travel Portal</td>
              <td>${(effectivePortalCpp*100).toFixed(2)}¢</td>
              <td><strong>${fmtMoney(portalUsd)}</strong></td>
              <td>—</td>
            </tr>
            <tr class="chase-cmp__row--best">
              <td>→ Transfer to Hyatt (best for most people)</td>
              <td>2.0¢</td>
              <td><strong>${fmtMoney(hyattUsd)}</strong></td>
              <td style="color:var(--green); font-weight:600;">+${fmtMoney(upliftHyatt)} (${Math.round((upliftHyatt / Math.max(1,portalUsd)) * 100)}%)</td>
            </tr>
            <tr>
              <td>Southwest</td>
              <td>1.5¢</td>
              <td><strong>${fmtMoney(swUsd)}</strong></td>
              <td>${swUsd > portalUsd ? '+' + fmtMoney(swUsd - portalUsd) : 'Similar to portal'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="hint" style="margin-top:6px;">
        <strong>Rule of thumb:</strong> Transfer usually wins if you can beat ~1.6–1.7¢/pt (Hyatt frequently does). Portal wins on pure simplicity or when award space is poor.
      </p>
    </div>

    <h3 class="subhead">When to transfer vs stay in portal</h3>
    <div class="grid-2 chase-playbook__cols" style="margin-top:6px;">
      <div>
        <strong>Transfer (usually bigger win)</strong>
        <ul class="chase-bullets">
          <li>Hyatt award nights (often the highest value)</li>
          <li>International business class or good Star Alliance space</li>
          <li>You have a specific high-value trip in mind</li>
          <li>Transfer bonuses are running (extra 20-30%)</li>
        </ul>
      </div>
      <div>
        <strong>Portal is perfectly fine</strong>
        <ul class="chase-bullets">
          <li>Domestic trips where cash prices are reasonable</li>
          <li>You want zero hassle / one login</li>
          <li>Using the CSR $300 travel credit</li>
          <li>No good award space on the dates you need</li>
        </ul>
      </div>
    </div>

    <h3 class="subhead">Top household plays (skip the portal)</h3>
    <div class="chase-play-grid">${plays}</div>

    <details style="margin-top:10px;">
      <summary>How to actually transfer (and common mistakes)</summary>
      <div class="grid-2 chase-playbook__cols">
        <div>
          <ol class="chase-steps">${pb.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
        </div>
        <div>
          <strong>Common mistakes</strong>
          <ul class="chase-bullets chase-bullets--warn">${pb.avoid.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
        </div>
      </div>
    </details>
  `;

  // Wire up the interactive calculator
  setTimeout(() => {
    const ptsInput = $('#chaseUrTestPoints');
    const levelSel = $('#chaseUrSapphireLevel');
    const recalcBtn = $('#recalcChaseUr');
    const tbody = $('#chaseUrCmpBody');

    function recalc() {
      if (!ptsInput || !levelSel || !tbody) return;
      const pts = Math.max(0, parseInt(ptsInput.value, 10) || userChasePts);
      const cpp = parseFloat(levelSel.value) || effectivePortalCpp;

      const pUsd = Math.round(pts * cpp);
      const hUsd = Math.round(pts * 0.02);
      const sUsd = Math.round(pts * 0.015);

      tbody.innerHTML = `
        <tr class="chase-cmp__row--portal">
          <td>Chase Travel Portal</td>
          <td>${(cpp*100).toFixed(2)}¢</td>
          <td><strong>${fmtMoney(pUsd)}</strong></td>
          <td>—</td>
        </tr>
        <tr class="chase-cmp__row--best">
          <td>→ Transfer to Hyatt (best for most)</td>
          <td>2.0¢</td>
          <td><strong>${fmtMoney(hUsd)}</strong></td>
          <td style="color:var(--green);font-weight:600;">+${fmtMoney(hUsd - pUsd)} (${Math.round(((hUsd - pUsd) / Math.max(1,pUsd)) * 100)}%)</td>
        </tr>
        <tr>
          <td>Southwest</td>
          <td>1.5¢</td>
          <td><strong>${fmtMoney(sUsd)}</strong></td>
          <td>${sUsd > pUsd ? '+' + fmtMoney(sUsd - pUsd) : 'About the same'}</td>
        </tr>
      `;
    }

    if (recalcBtn) recalcBtn.onclick = recalc;
    if (ptsInput) ptsInput.oninput = recalc;
    if (levelSel) levelSel.onchange = recalc;
  }, 50);
}

function renderTransfers() {
  renderWalletIntegration();
  renderChaseUrPlaybook();
  renderHouseholdUI();
  const hh = ensureHousehold();
  const hw = householdWallet(state.profile, hh, state.offers, transferBonusPct);
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
            <span>${fmtPts(line.total)} pts</span>
          </header>
          <div class="wallet-card__value-row">
            <span>${fmtMoney(line.portalUsd || line.usd)} cash</span>
            <span class="wallet-card__arrow">→</span>
            <strong>${fmtMoney(line.transferUsd || line.usd)} trip</strong>
            ${line.bestPartner ? `<span class="hint">best: ${escapeHtml(line.bestPartner.name)}</span>` : ''}
          </div>
          <div class="wallet-card__breakdown">
            ${line.stack ? `<span>Planned bonus <strong>${fmtPts(line.stack)}</strong></span>` : ''}
            ${line.yours ? `<span>Yours <strong>${fmtPts(line.yours)}</strong></span>` : ''}
            ${line.spouse ? `<span>${escapeHtml(state.profile.partnerLabel || 'Partner')} <strong>${fmtPts(line.spouse)}</strong></span>` : ''}
          </div>
          ${line.meta.transferable
    ? `<p class="wallet-card__xfer">Transfer → ${transferPartnersFor(line.program).slice(0, 4).map((t) => PARTNERS[t.to]?.name).filter(Boolean).join(', ')}… · pool both players into one loyalty #</p>`
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

  const mathEl = $('#householdMath');
  if (mathEl) {
    mathEl.innerHTML = INFLUENCER_MATH.map((row) => `
      <div class="math-row">
        <strong>${escapeHtml(row.label)}</strong>
        <p class="hint">${escapeHtml(row.detail)}</p>
      </div>
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
    <span class="quick-gate__label">${labelWithTip('Chase new cards (24 mo)', 'five24')}</span>
    <span class="gate-pill gate-pill--${p524 >= 5 ? 'blocked' : p524 >= 4 ? 'caution' : 'clear'}" title="${p524} of 5 allowed">${p524} of 5</span>
    <span class="quick-gate__label">${labelWithTip('Hard inquiries (6 mo)', 'inquiries')}</span>
    <span class="gate-pill gate-pill--${p.inquiries6mo >= 3 ? 'caution' : 'clear'}">${p.inquiries6mo}</span>
    <span class="quick-gate__label">${labelWithTip('Utilization', 'utilization')}</span>
    <span class="gate-pill gate-pill--${p.utilizationPct > 30 ? 'caution' : 'clear'}">${p.utilizationPct}%</span>
    <span class="quick-gate__label">${labelWithTip('Avg account age', 'aaoa')}</span>
    <span class="gate-pill gate-pill--${p.aaoaYears < 2 ? 'caution' : 'clear'}">${p.aaoaYears} yrs</span>
  `;
}

function renderIssuerGrid() {
  const meta = issuerRulesMeta();
  const dash = allIssuerDashboard(state.profile);
  const el = $('#issuerGrid');
  if (!el) return;

  el.innerHTML = dash.map((d) => {
    const m = meta[d.issuer] || {};
    const refRules = (m.rules || []).map((r) => `
      <li class="issuer-card__ref">
        <span class="issuer-card__ref-name">${escapeHtml(r.name)}</span>
        <span class="issuer-card__ref-desc">${escapeHtml(r.desc)}</span>
      </li>
    `).join('');

    const checks = d.results.length
      ? d.results.map((r) => `
        <li class="issuer-card__check">
          <span class="issuer-card__check-label">${ruleLabelHtml(r.id)}</span>
          <span class="gate-pill gate-pill--${r.pass ? 'clear' : 'blocked'}" title="${escapeHtml(r.detail)}">${gatePassLabel(r.pass)}</span>
          <p class="issuer-card__check-detail">${escapeHtml(r.detail)}</p>
        </li>
      `).join('')
      : '';

    return `
      <article class="issuer-card issuer-card--${d.status}">
        <header class="issuer-card__head">
          <h3 style="color:${m.color || 'inherit'}">${escapeHtml(d.issuer)}</h3>
          <span class="gate-pill gate-pill--${d.status === 'blocked' ? 'blocked' : d.status === 'caution' ? 'caution' : 'clear'}">${issuerStatusLabel(d.status)}</span>
        </header>
        ${checks ? `<p class="issuer-card__section">Your profile</p><ul class="issuer-card__rules">${checks}</ul>` : ''}
        ${refRules ? `<p class="issuer-card__section">What they watch for</p><ul class="issuer-card__rules issuer-card__rules--ref">${refRules}</ul>` : '<p class="hint">No velocity rules modeled for this issuer.</p>'}
      </article>
    `;
  }).join('');
}

function renderCatalog() {
  const issuer = $('#catalogIssuer')?.value || 'all';
  const category = $('#catalogCategory')?.value || 'all';
  const cards = filterCatalog(issuer, category);
  const feedCards = offersFeed?.cards ? Object.fromEntries(offersFeed.cards.map((c) => [c.catalogId, c])) : {};
  const el = $('#catalogGrid');
  if (!el) return;

  // Continuity hint: show current queue count right in catalog
  const hint = $('#catalogQueueHint');
  if (hint) {
    const activeCount = state.offers.filter(o => !['done','skip'].includes(o.status)).length;
    hint.textContent = activeCount ? `${activeCount} in your plan — you can add or remove from here` : 'Browse and pin offers to build your plan';
  }

  el.innerHTML = cards.map((card) => {
    const live = feedCards[card.id];
    const liveVal = live?.valueUsd;
    const ev = evaluateOffer({ type: 'cc', issuer: card.issuer, hardPull: true, catalogId: card.id }, state.profile, state.offers);
    const blocked = ev.score === 'blocked';
    const estVal = liveVal ?? (card.subCash || pointsToUsd(card.subPoints, card.program));
    const bonus = formatWelcomeBonus(card, estVal, fmtMoney);
    const liveTag = live 
      ? `<span class="tag tag--live" data-go-inbox title="This deal is in the Live Deal Inbox — click to view latest">Live in Inbox</span>` 
      : '';

    const queued = state.offers.find((o) => o.catalogId === card.id && !['done', 'skip'].includes(o.status));
    const inPlan = !!queued;

    const actionHtml = inPlan
      ? `<button type="button" class="btn-sm btn-ghost" data-remove-catalog="${card.id}">Remove from plan</button>`
      : `<button type="button" class="btn-sm btn" data-catalog="${card.id}">+ Add to plan</button>`;

    return `
      <article class="catalog-card ${blocked ? 'catalog-card--blocked' : ''}">
        <div class="catalog-card__head">
          <div>
            <span class="catalog-card__issuer">${escapeHtml(card.issuer)}</span>
            <h3>${escapeHtml(card.name)}</h3>
          </div>
          ${liveTag}
          ${blocked ? `<span class="gate-pill gate-pill--blocked" title="Issuer rule suggests waiting">${labelWithTip('Wait', 'gate')}</span>` : ''}
        </div>
        <div class="catalog-card__bonus">${bonus}</div>
        ${live?.sourceUrl ? `<a class="hint" href="${escapeHtml(live.sourceUrl)}" target="_blank" rel="noopener">Official offer page</a>` : ''}
        <div class="catalog-card__facts">
          <span>${formatSpendReq(card.msr, card.msrMonths)}</span>
          <span>Annual fee ${card.annualFee ? fmtMoney(card.annualFee) : '$0'}</span>
          ${card.creditLine ? `<span>~${fmtMoney(card.creditLine)} line</span>` : card.charge ? '<span>Charge card</span>' : ''}
        </div>
        <p class="catalog-card__trip">${escapeHtml(cardTripPitch(card))}</p>
        ${PROGRAMS[card.program]?.transferable
    ? `<p class="catalog-card__xfer">Transfer → ${transferPartnersFor(card.program).slice(0, 3).map((t) => PARTNERS[t.to]?.name).filter(Boolean).join(', ')}</p>`
    : ''}
        <div class="catalog-card__tags">${card.category && card.category !== 'national' ? `<span class="tag tag--cat">${escapeHtml(CATALOG_CATEGORIES[card.category] || card.category)}</span>` : ''}${(card.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}</div>
        ${ev.blockers.length ? `<ul class="offer-alerts offer-alerts--block">${ev.blockers.slice(0, 2).map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : ''}
        ${actionHtml}
      </article>
    `;
  }).join('');

  // Add handlers
  el.querySelectorAll('[data-catalog]').forEach((btn) => {
    btn.addEventListener('click', () => addFromCatalog(btn.dataset.catalog));
  });
  el.querySelectorAll('[data-remove-catalog]').forEach((btn) => {
    btn.addEventListener('click', () => removeOffer(btn.dataset.removeCatalog));
  });
  el.querySelectorAll('[data-go-inbox]').forEach((tag) => {
    tag.addEventListener('click', (e) => {
      e.stopPropagation();
      switchTab('inbox');
    });
  });
}

function addFromCatalog(catalogId) {
  const card = CARD_CATALOG.find((c) => c.id === catalogId);
  if (!card) return;

  // Prevent duplicates
  const already = state.offers.some((o) => o.catalogId === catalogId && !['done', 'skip'].includes(o.status));
  if (already) return;

  const offer = catalogEntryToOffer(card, state.offers.length + 1);
  state.offers.push(offer);
  save();
  renderAll();

  // Better continuity: stay where you are (Catalog), just update UI + gentle feedback
  showToast(`Added "${card.name}" to your plan.`);
  // Optional: gently pulse the tab
  const planTab = document.querySelector('.tab[data-tab="plan"]');
  if (planTab) {
    planTab.classList.add('tab--pulse');
    setTimeout(() => planTab.classList.remove('tab--pulse'), 1200);
  }
}

function removeOffer(idOrCatalogId, showUndo = true) {
  const idx = state.offers.findIndex((o) => o.id === idOrCatalogId || o.catalogId === idOrCatalogId);
  if (idx === -1) return;

  lastRemovedOffer = state.offers[idx];
  state.offers.splice(idx, 1);
  save();
  renderAll();

  if (showUndo) {
    clearTimeout(undoTimer);
    showToastWithUndo(`Removed "${lastRemovedOffer.title}".`, () => {
      if (lastRemovedOffer) {
        state.offers.push(lastRemovedOffer);
        save();
        renderAll();
        lastRemovedOffer = null;
      }
    });
    undoTimer = setTimeout(() => { lastRemovedOffer = null; }, 6000);
  }
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
          <p class="offer-card__meta">${meta.shortLabel || meta.label} · ${escapeHtml(o.issuer)} · ${fmtMoney(o.valueUsd)} est.</p>
        </div>
        <span class="offer-card__status">${st.label}</span>
      </header>
      <dl class="offer-card__facts">
        ${o.hardPull ? `<div><dt>${labelWithTip('Credit check', 'hard_pull')}</dt><dd>Hard pull on apply</dd></div>` : '<div><dt>Credit check</dt><dd>Soft / none</dd></div>'}
        ${o.minSpend ? `<div><dt>${labelWithTip('Minimum Spend Requirement (MSR)', 'msr')}</dt><dd>${fmtMoney(o.minSpend)}${o.msrMonths ? ` in ${o.msrMonths} mo` : ''}</dd></div>` : ''}
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
        <button type="button" class="btn-ghost offer-del" data-id="${o.id}" style="color:#c73e5a">✕ Remove</button>
      </div>
    </article>
  `;
}

function renderOffers() {
  const list = $('#offerList');
  if (!list) return;
  if (!state.offers.length) {
    list.innerHTML = '<p class="empty">No offers queued yet. Go to <strong>Catalog</strong> or <button type="button" class="btn-sm" data-tab-jump="dashboard">Dashboard</button> to start. Or use the guided wizard.</p>';
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
      if (!wasDone && o.status === 'done') {
        celebrateOfferDone(o);
      }
      save();
      renderAll();
    });
  });
  list.querySelectorAll('.offer-edit').forEach((btn) => btn.addEventListener('click', () => openForm(btn.dataset.id)));
  list.querySelectorAll('.offer-del').forEach((btn) => btn.addEventListener('click', () => {
    removeOffer(btn.dataset.id);
  }));
}

function renderTimeline() {
  const tl = suggestTimeline(state.offers, state.profile);
  const el = $('#timeline');
  if (!el) return tl;
  if (!tl.length) {
    el.innerHTML = '<p class="empty">Add planned offers to see issuer-aware spacing.</p>';
    return tl;
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

function renderRoadmap(timeline, sim) {
  const listEl = $('#roadmap');
  const summaryEl = $('#roadmapSummary');
  if (!listEl && !summaryEl) return;

  const tl = timeline || [];
  const offerById = Object.fromEntries(state.offers.map((o) => [o.id, o]));
  const scoreByOffer = {};
  (sim?.steps || []).forEach((step) => {
    if (step.kind === 'application' && step.offerId) {
      scoreByOffer[step.offerId] = step;
    }
  });

  if (summaryEl) {
    if (!sim || !tl.length) {
      summaryEl.innerHTML = `
        <p class="empty">Load a plan or pin offers to see your application roadmap and score path.</p>
      `;
    } else {
      const delta = sim.summary.endScore - sim.summary.startScore;
      const deltaCls = delta < 0 ? 'sim-summary__row--warn' : delta > 0 ? 'sim-summary__row--up' : '';
      const proj = earningsProjection(state.offers, [], { transferBonusPct });
      const dip = sim.summary.maxDrop || 0;
      const tripV = proj.netTravelPipeline || proj.netPipeline || 0;
      const vpd = dip > 0 ? fmtMoney(Math.round(tripV / dip)) + '/pt' : '—';
      summaryEl.innerHTML = `
        <div class="sim-summary roadmap-summary">
          <div class="sim-summary__row"><span>Starting FICO</span><strong>${sim.summary.startScore}</strong></div>
          <div class="sim-summary__row"><span>After full plan</span><strong>${sim.summary.endScore}</strong></div>
          <div class="sim-summary__row ${sim.summary.maxDrop >= 15 ? 'sim-summary__row--warn' : ''}">
            <span>Max dip</span><strong>−${sim.summary.maxDrop} pts</strong>
          </div>
          <div class="sim-summary__row ${deltaCls}">
            <span>Net change</span><strong>${delta > 0 ? '+' : ''}${delta} pts</strong>
          </div>
          <div class="sim-summary__row"><span>$ per pt dip</span><strong>${vpd}</strong></div>
          <div class="sim-summary__row"><span>Card apps in plan</span><strong>${sim.summary.totalApplications}</strong></div>
        </div>
      `;
    }
  }

  if (!listEl) return;

  if (!tl.length) {
    listEl.innerHTML = '<p class="empty">No queued offers — load a starter plan from the Dashboard or add from Catalog.</p>';
    return;
  }

  listEl.innerHTML = tl.map((row, i) => {
    const offer = offerById[row.offerId];
    const ev = offer ? evaluateOffer(offer, state.profile, state.offers) : { score: 'clear', blockers: [], warnings: [] };
    const gateLabel = issuerStatusLabel(ev.score);
    const scoreStep = scoreByOffer[row.offerId];
    const hasScore = !!scoreStep;
    const deltaCls = scoreStep?.delta < 0 ? 'delta-neg' : scoreStep?.delta > 0 ? 'delta-pos' : '';
    const value = offer?.valueUsd ? fmtMoney(offer.valueUsd) : '—';
    const pullNote = offer?.hardPull ? 'Hard pull' : 'No pull';

    return `
      <article class="roadmap-row roadmap-row--${ev.score}">
        <div class="roadmap-row__step">
          <span class="roadmap-step">${i + 1}</span>
          <time class="roadmap-date" datetime="${row.suggestedDate}">${fmtDate(row.suggestedDate)}</time>
        </div>
        <div class="roadmap-row__body">
          <div class="roadmap-row__head">
            <strong>${escapeHtml(row.title)}</strong>
            <span class="roadmap-gate roadmap-gate--${ev.score}">${gateLabel}</span>
          </div>
          <p class="roadmap-meta">${escapeHtml(row.issuer || 'Offer')} · ${escapeHtml(row.reason)} · ${value} · ${pullNote}</p>
          ${ev.blockers[0] ? `<p class="roadmap-alert roadmap-alert--block">${escapeHtml(ev.blockers[0])}</p>` : ''}
          ${!ev.blockers[0] && ev.warnings[0] ? `<p class="roadmap-alert roadmap-alert--warn">${escapeHtml(ev.warnings[0])}</p>` : ''}
        </div>
        <div class="roadmap-row__score" title="${hasScore ? 'Projected score right after approval' : 'No hard-pull score impact modeled'}">
          ${hasScore
    ? `<span class="roadmap-score">${scoreStep.score}</span>
               <span class="roadmap-delta ${deltaCls}">${scoreStep.delta > 0 ? '+' : ''}${scoreStep.delta}</span>`
    : '<span class="roadmap-score roadmap-score--na">—</span>'}
        </div>
      </article>
    `;
  }).join('');

  if (sim) updateScoreChart(sim, '#roadmapScoreChart', 'roadmap');
}

function renderSimulation(timeline) {
  const sim = simulateCreditPlan(state.profile, state.offers, timeline || []);

  const summaryEl = $('#simSummary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div>
        <div style="margin-bottom:8px;">
          <label style="font-size:0.8rem;">Your current FICO (edit here to update sim)
            <input type="number" id="simBaselineInput" value="${state.profile.baselineScore || 740}" min="300" max="850" style="width:90px; margin-left:6px; padding:2px 6px;">
          </label>
        </div>
        <div class="sim-summary">
          <div class="sim-summary__row"><span>Baseline</span><strong>${sim.summary.startScore}</strong></div>
          <div class="sim-summary__row"><span>After plan</span><strong>${sim.summary.endScore}</strong></div>
          <div class="sim-summary__row ${sim.summary.maxDrop >= 15 ? 'sim-summary__row--warn' : ''}">
            <span>Max drop</span><strong>−${sim.summary.maxDrop} pts</strong>
          </div>
          ${(() => {
            const p = earningsProjection(state.offers, [], { transferBonusPct });
            const d = sim.summary.maxDrop || 0;
            const tv = p.netTravelPipeline || p.netPipeline || 0;
            const v = d > 0 ? fmtMoney(Math.round(tv / d)) + '/pt' : '—';
            return `<div class="sim-summary__row"><span>$ per pt dip</span><strong>${v}</strong></div>`;
          })()}
          <div class="sim-summary__row"><span>CC applications</span><strong>${sim.summary.totalApplications}</strong></div>
          ${sim.summary.mortgageRisk ? '<p class="offer-alerts offer-alerts--warn">Mortgage/refi planned soon — consider pausing new applications.</p>' : ''}
          <p class="hint" style="margin-top:10px">Score typically recovers as inquiries age and bonus spending balances clear. Full profile editing is in the Credit profile tab.</p>
        </div>
      </div>
    `;

    // Wire direct FICO edit in sim for better flow
    setTimeout(() => {
      const input = $('#simBaselineInput');
      if (input) {
        input.onchange = input.onblur = () => {
          const val = parseInt(input.value, 10);
          if (val >= 300 && val <= 850) {
            state.profile.baselineScore = val;
            save();
            renderAll(); // re-renders sim + other places
          }
        };
      }
    }, 10);
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

  updateScoreChart(sim, '#scoreChart', 'main');
  return sim;
}

function updateScoreChart(sim, canvasSel = '#scoreChart', chartKey = 'main') {
  const canvas = $(canvasSel);
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = sim.steps.map((s) => s.label.length > 22 ? `${s.label.slice(0, 20)}…` : s.label);
  const data = sim.steps.map((s) => s.score);

  const colors = chartColors(state.theme);
  const minScore = Math.min(...data);

  const chartData = {
    labels,
    datasets: [{
      label: 'Projected score',
      data,
      borderColor: colors.border,
      backgroundColor: colors.fill,
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: data.map((v, i) => (
        i === 0 ? colors.pointStart : v === minScore ? colors.pointLow : colors.pointDefault
      )),
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
        grid: { color: colors.grid },
        ticks: { color: colors.ticks },
      },
      x: {
        grid: { display: false },
        ticks: { color: colors.ticks, maxRotation: 45 },
      },
    },
  };

  const isRoadmap = chartKey === 'roadmap';
  const existing = isRoadmap ? roadmapScoreChart : scoreChart;

  if (existing) {
    existing.data = chartData;
    existing.options = opts;
    existing.update('active');
  } else {
    const chart = new Chart(canvas, { type: 'line', data: chartData, options: opts });
    if (isRoadmap) roadmapScoreChart = chart;
    else scoreChart = chart;
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
  renderRoadmap(timeline, sim);
  renderDashboard(sim, timeline);
  renderTransfers();
  renderDealInbox();
}

function switchTab(name) {
  tabSwitchSparkle(name);
  $all('.tab').forEach((t) => {
    const on = t.dataset.tab === name;
    t.classList.toggle('tab--active', on);
    if (on) {
      t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
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
  // Ensure charts size correctly when their tab is revealed (fixes 0-size on narrow/mobile)
  if (name === 'simulation' || name === 'roadmap') {
    requestAnimationFrame(() => {
      try {
        if (scoreChart && name === 'simulation') scoreChart.resize();
        if (roadmapScoreChart && name === 'roadmap') roadmapScoreChart.resize();
      } catch (_) {}
    });
  }
}

function initMobileUx() {
  const tabs = $('#mainTabs');
  const wrap = $('#tabsWrap');

  const updateTabScrollHint = () => {
    if (!tabs || !wrap) return;
    wrap.classList.toggle('tabs-wrap--scrollable', tabs.scrollWidth > tabs.clientWidth + 4);
  };

  updateTabScrollHint();
  window.addEventListener('resize', updateTabScrollHint, { passive: true });

  // Keep charts sized on viewport changes (important for mobile rotate + tab views)
  window.addEventListener('resize', () => {
    try {
      if (scoreChart) scoreChart.resize();
      if (roadmapScoreChart) roadmapScoreChart.resize();
    } catch (_) {}
  }, { passive: true });

  document.addEventListener('click', (e) => {
    const tip = e.target.closest('.help-tip');
    if (tip) {
      e.preventDefault();
      e.stopPropagation();
      const wasOpen = tip.classList.contains('help-tip--open');
      $all('.help-tip--open').forEach((t) => t.classList.remove('help-tip--open'));
      if (!wasOpen) tip.classList.add('help-tip--open');
      return;
    }
    $all('.help-tip--open').forEach((t) => t.classList.remove('help-tip--open'));
  });

  // Touch support for help tips on mobile (ensures tap opens even if click timing varies)
  document.addEventListener('touchend', (e) => {
    const tip = e.target.closest('.help-tip');
    if (tip) {
      e.preventDefault();
      const wasOpen = tip.classList.contains('help-tip--open');
      $all('.help-tip--open').forEach((t) => t.classList.remove('help-tip--open'));
      if (!wasOpen) tip.classList.add('help-tip--open');
    } else {
      $all('.help-tip--open').forEach((t) => t.classList.remove('help-tip--open'));
    }
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $all('.help-tip--open').forEach((t) => t.classList.remove('help-tip--open'));
    }
  });
}

function fillIssuerOptions(select, { includeAll = false, grouped = false } = {}) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = '';
  if (includeAll) {
    const all = document.createElement('option');
    all.value = 'all';
    all.textContent = 'All issuers';
    select.appendChild(all);
  }
  if (grouped) {
    ISSUER_GROUPS.forEach(({ label, issuers }) => {
      const og = document.createElement('optgroup');
      og.label = label;
      issuers.forEach((i) => {
        const o = document.createElement('option');
        o.value = i;
        o.textContent = i;
        og.appendChild(o);
      });
      select.appendChild(og);
    });
    const other = document.createElement('option');
    other.value = 'Other';
    other.textContent = 'Other';
    select.appendChild(other);
  } else {
    ISSUERS.forEach((i) => {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = i;
      select.appendChild(o);
    });
  }
  if (current) select.value = current;
}

function populateIssuerSelects() {
  const offerIssuer = $('#offerIssuer');
  const catalogIssuer = $('#catalogIssuer');
  const catalogCategory = $('#catalogCategory');
  if (offerIssuer && !offerIssuer.dataset.bound) {
    fillIssuerOptions(offerIssuer, { grouped: true });
    offerIssuer.dataset.bound = '1';
  }
  if (catalogIssuer) {
    fillIssuerOptions(catalogIssuer, { includeAll: true, grouped: true });
  }
  if (catalogCategory && !catalogCategory.dataset.bound) {
    Object.entries(CATALOG_CATEGORIES).forEach(([value, label]) => {
      const o = document.createElement('option');
      o.value = value;
      o.textContent = label;
      catalogCategory.appendChild(o);
    });
    catalogCategory.dataset.bound = '1';
  }
}

function openForm(id) {
  const modal = $('#offerModal');
  const o = id ? state.offers.find((x) => x.id === id) : null;
  const editing = !!o;
  $('#offerModalTitle').textContent = editing ? 'Edit offer' : 'Add offer';
  const eyebrow = $('#offerModalEyebrow');
  if (eyebrow) eyebrow.textContent = editing ? 'Update your pin' : 'Pin to your board';
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
  // dismiss any vanity overlays so main modal isn't stuck behind
  const ach = $('#vanityAchievement'); if (ach) ach.hidden = true;
  const lvl = $('#vanityLevelUp'); if (lvl) lvl.hidden = true;
  dismissWelcomeSplash();
  modal.hidden = false;
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => {
    const titleInput = $('#offerTitle');
    if (titleInput && !editing) titleInput.focus();
    else $('#offerModalClose')?.focus();
  });
}

function closeForm() {
  const modal = $('#offerModal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
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
  const isEdit = !!existing;
  if (existing) Object.assign(existing, payload);
  else state.offers.push(payload);
  save();
  closeForm();
  celebratePin(isEdit);
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
      applyTheme(state.theme || DEFAULT_THEME);
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
  fillIssuerOptions(sel, { includeAll: true, grouped: true });
  sel.dataset.bound = '1';
}

function initThemePicker() {
  const sel = $('#themeSelect');
  if (!sel) return;
  sel.innerHTML = Object.values(THEMES).map((t) => (
    `<option value="${t.id}" title="${escapeHtml(t.hint)}">${t.emoji} ${t.label}</option>`
  )).join('');
  state.theme = applyTheme(state.theme || DEFAULT_THEME);
  sel.value = state.theme;
  sel.title = THEMES[state.theme]?.hint || '';
  sel.addEventListener('change', () => {
    state.theme = applyTheme(sel.value);
    sel.title = THEMES[state.theme]?.hint || '';
    const t = THEMES[state.theme];
    celebrateThemeChange(t ? `${t.emoji} ${t.label}` : sel.value);
    save();
    renderAll();
  });
}

/* ===================== Guided Wizard ===================== */
let wizardStep = 1;
const WIZARD_TOTAL = 5;

function openWizard() {
  const modal = $('#wizardModal');
  if (!modal) return;
  // dismiss any vanity overlays so main modal isn't stuck behind
  const ach = $('#vanityAchievement'); if (ach) ach.hidden = true;
  const lvl = $('#vanityLevelUp'); if (lvl) lvl.hidden = true;
  dismissWelcomeSplash();
  wizardStep = 1;
  modal.hidden = false;
  document.body.classList.add('modal-open');
  // explicitly hide launchers while in wizard (CSS may be cached or not apply)
  const start = $('#startWizard');
  if (start) start.style.display = 'none';
  const guide = $('#guideBtn');
  if (guide) guide.style.display = 'none';
  renderWizardStep();
}

function closeWizard() {
  const modal = $('#wizardModal');
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
  // restore launchers
  const start = $('#startWizard');
  if (start) start.style.display = '';
  const guide = $('#guideBtn');
  if (guide) guide.style.display = '';
}

function updateWizardProgress() {
  const label = $('#wizardStepLabel');
  const dotsWrap = $('#wizardModal .wizard-dots');
  if (!label || !dotsWrap) return;
  label.textContent = `Step ${wizardStep} of ${WIZARD_TOTAL}`;
  dotsWrap.innerHTML = Array.from({ length: WIZARD_TOTAL }, (_, i) => {
    const n = i + 1;
    const cls = n < wizardStep ? 'complete' : (n === wizardStep ? 'active' : '');
    return `<span class="wizard-dot ${cls}"></span>`;
  }).join('');
}

function renderWizardStep() {
  const body = $('#wizardBody');
  const titleEl = $('#wizardTitle');
  const nextBtn = $('#wizardNext');
  const backBtn = $('#wizardBack');
  if (!body || !nextBtn || !backBtn) return;

  updateWizardProgress();
  backBtn.style.visibility = wizardStep > 1 ? 'visible' : 'hidden';

  if (wizardStep === 1) {
    if (titleEl) titleEl.textContent = 'Welcome — this is your trip-planning board';
    body.innerHTML = `
      <div class="wizard-step">
        <p>Think of offers like pins on a map. You line them up at a sensible pace so the welcome bonuses actually post, your credit score gets a breather between pulls, and the points add up toward real trips.</p>
        
        <div class="wizard-explain">
          <strong>Why the score impact matters here:</strong><br>
          Hard pulls and the temporary spending to hit bonuses can cause a short dip. This plan deliberately spaces things out (and only uses money you’re already spending) so the model shows a manageable, temporary impact that recovers.
        </div>

        <p class="hint">Everything is saved in your browser. You can change any number later. The goal is a clear, responsible plan you can show and stand behind.</p>
      </div>
    `;
    nextBtn.textContent = 'Next: Your credit basics';
  }

  else if (wizardStep === 2) {
    if (titleEl) titleEl.textContent = 'Your credit basics (the parts that matter most here)';
    const p = state.profile;
    body.innerHTML = `
      <div class="wizard-step">
        <div class="wizard-simple-grid">
          <label>Baseline FICO estimate
            <input type="number" id="wizScore" min="580" max="850" value="${p.baselineScore || 740}">
            <span class="hint">Rough idea from your last statement or app. 720+ is strong for most premium cards.</span>
          </label>
          <label>Cards opened in last 24 months (all banks)
            <input type="number" id="wizCards24" min="0" max="20" value="${p.personalCards24mo || p.cards24mo || 2}">
            <span class="hint">Chase cares about this (the famous 5/24). Count every personal card, not just theirs.</span>
          </label>
          <label>Months since last hard pull (approx)
            <input type="number" id="wizLastPull" min="0" max="36" value="${p.lastHardPull ? Math.round((Date.now() - new Date(p.lastHardPull).getTime())/ (1000*60*60*24*30)) : 4}">
            <span class="hint">New applications usually add a hard pull. Spacing them helps approvals.</span>
          </label>
          <label>Planning a mortgage or refi soon?
            <select id="wizMortgage">
              <option value="false" ${!p.mortgageSensitive ? 'selected' : ''}>No — go for it</option>
              <option value="true" ${p.mortgageSensitive ? 'selected' : ''}>Yes — be extra gentle</option>
            </select>
            <span class="hint">Mortgage lenders hate recent inquiries and new accounts.</span>
          </label>
        </div>
        <p class="hint">We’re keeping it simple. You can fill the full “Credit profile” tab later for every bank’s velocity rule.</p>
      </div>
    `;
    nextBtn.textContent = 'Next: Cards you already hold';
  }

  else if (wizardStep === 3) {
    if (titleEl) titleEl.textContent = 'Cards you already have (helps us give smart advice)';
    body.innerHTML = `
      <div class="wizard-step">
        <p>Tell us roughly what you carry so the app can suggest good next cards and warn about issuer rules.</p>
        <button type="button" class="btn" id="wizLoadSix" style="margin-bottom:8px">Load common 6-card starter stack</button>
        <div id="wizCardsNote" class="hint">You can refine this anytime in the “Household &amp; points” tab.</div>
        <div class="wizard-explain" style="margin-top:12px">
          Knowing your stack lets us show: which everyday spending categories you’re already earning well on, and which transfer programs you can already unlock.
        </div>
      </div>
    `;
    nextBtn.textContent = 'Next: Pick a realistic plan';

    // Bind load preset inside this step render (after DOM update)
    setTimeout(() => {
      const btn = $('#wizLoadSix');
      if (btn) btn.onclick = () => {
        const preset = WALLET_PRESETS && WALLET_PRESETS['starter-six'];
        if (preset) {
          state.profile.ownedCards = [...preset.cards];
          save();
          btn.textContent = 'Loaded ✓';
          btn.disabled = true;
          $('#wizCardsNote').textContent = 'Starter cards loaded. You can edit the full list in Household & points tab.';
        }
      };
    }, 0);
  }

  else if (wizardStep === 4) {
    if (titleEl) titleEl.textContent = 'Choose a starter plan';
    body.innerHTML = `
      <div class="wizard-step">
        <p>Pick one to load. You can always edit dates, add more, or change order on the Roadmap and Offer queue tabs.</p>
        <div class="wizard-cards">
          <div class="wizard-card" data-plan="gentle">
            <strong>🛡️ Gentle & slow (~6 mo)</strong>
            <div class="meta">Low spend targets, easy pace</div>
            <div class="value">Safe starting point</div>
          </div>
          <div class="wizard-card" data-plan="balanced">
            <strong>⚖️ 12-month balanced</strong>
            <div class="meta">Chase Sapphire → Amex Gold pace</div>
            <div class="value">Most popular starter</div>
          </div>
          <div class="wizard-card" data-plan="household">
            <strong>🏡 Household stretch (18 mo)</strong>
            <div class="meta">You + partner, bigger trip goals</div>
            <div class="value">Max realistic upside</div>
          </div>
        </div>
        <p class="hint">Don’t overthink — any of these is a fine place to start. We’ll show you the sequence and score effect right after.</p>
      </div>
    `;
    nextBtn.textContent = 'Load plan & preview results';

    setTimeout(() => {
      body.querySelectorAll('.wizard-card').forEach(card => {
        card.onclick = () => {
          body.querySelectorAll('.wizard-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          const plan = card.dataset.plan;
          let planKey = 'balanced';
          if (plan === 'gentle') planKey = 'conservative';
          if (plan === 'household') planKey = 'household-stretch';
          loadPlan(planKey); // re-uses existing loader
          card.dataset.loaded = '1';
        };
      });
    }, 0);
  }

  else if (wizardStep === 5) {
    if (titleEl) titleEl.textContent = 'You’re set — here’s the picture so far';
    const stats = computeQuickStats();
    const sim = (typeof simulateCreditPlan === 'function') ? simulateCreditPlan(state.profile, state.offers, []) : null;
    const s = sim && sim.summary ? sim.summary : null;

    let scoreHtml = '';
    if (s) {
      const p = (typeof earningsProjection === 'function') ? earningsProjection(state.offers, [], { transferBonusPct }) : null;
      const d = s.maxDrop || 0;
      const tv = (p && (p.netTravelPipeline || p.netPipeline)) || 0;
      const vpd = d > 0 ? fmtMoney(Math.round(tv / d)) + '/pt' : '—';
      scoreHtml = `
        <div style="margin-top:14px; padding:12px 14px; background:var(--panel-soft); border-radius:12px; border:1px solid var(--accent-soft);">
          <strong style="display:block;margin-bottom:6px;">Credit score impact (modeled)</strong>
          <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:1.05rem;">
            <div>Start: <strong>${s.startScore}</strong></div>
            <div>Lowest: <strong>${s.minScore}</strong> <span style="color:var(--rose);font-size:0.95rem;">(−${s.maxDrop})</span></div>
            <div>End: <strong>${s.endScore}</strong></div>
            <div>$/pt: <strong>${vpd}</strong></div>
          </div>
          <p style="margin:8px 0 0;font-size:0.85rem;color:var(--text-soft);">We space pulls and use real household spending — the model shows a temporary dip that recovers as balances clear and inquiries age.</p>
        </div>
      `;
    }

    body.innerHTML = `
      <div class="wizard-step">
        <div class="wizard-complete">
          <h3>🎉 Your board is ready.</h3>
          <p>Loaded plan + your profile details are saved. This is a thoughtful, paced approach — exactly the kind of plan you can show and explain.</p>
        </div>

        <div class="grid-2" style="margin-top:8px">
          <div>
            <strong>Plan snapshot</strong>
            <ul style="margin:8px 0 0;padding-left:18px;font-size:0.95rem;line-height:1.45">
              <li>${state.offers.length} offers in queue</li>
              <li>Est. cash floor ~ ${stats.cash}</li>
              <li>Est. trip value (transfers) ~ ${stats.trip}</li>
            </ul>
          </div>
          <div class="wizard-explain">
            Next: Go to <strong>Roadmap</strong> tab to see the suggested order and full score path. Check “Can I apply?” before real apps.
          </div>
        </div>

        ${scoreHtml}
      </div>
    `;
    nextBtn.textContent = 'Finish & go to board';
  }
}

function computeQuickStats() {
  // lightweight snapshot using existing helpers if present
  try {
    const proj = (typeof earningsProjection === 'function') ? earningsProjection(state.offers) : null;
    const cash = fmtMoney((proj && (proj.netPipeline || proj.total || 0)) || 0);
    const trip = fmtMoney((proj && (proj.travelTotal || proj.netTravelPipeline || proj.travelPipeline || 0)) || 0);
    return { cash, trip };
  } catch {
    return { cash: '$—', trip: '$—' };
  }
}

function wizardNext() {
  const body = $('#wizardBody');

  // Capture data from step 2 (profile)
  if (wizardStep === 2 && body) {
    const score = Number($('#wizScore')?.value) || state.profile.baselineScore;
    const cards24 = Number($('#wizCards24')?.value) || 0;
    const monthsSince = Number($('#wizLastPull')?.value) || 0;
    const mort = $('#wizMortgage')?.value === 'true';

    state.profile.baselineScore = score;
    state.profile.personalCards24mo = cards24;
    state.profile.cards24mo = cards24;
    if (monthsSince > 0) {
      const d = new Date();
      d.setMonth(d.getMonth() - monthsSince);
      state.profile.lastHardPull = d.toISOString().slice(0, 10);
    }
    state.profile.mortgageSensitive = mort;
    save();
  }

  if (wizardStep < WIZARD_TOTAL) {
    wizardStep++;
    renderWizardStep();
  } else {
    // Finish
    closeWizard();
    renderAll();
    // Jump to a useful tab
    setTimeout(() => {
      switchTab('roadmap');
    }, 120);
    // Gentle toast-like hint
    const dash = $('#panel-dashboard');
    if (dash) {
      const note = document.createElement('div');
      note.className = 'hint';
      note.style.margin = '12px 0';
      note.textContent = 'Tip: You can reopen the guided setup anytime from the top of the Dashboard.';
      dash.prepend(note);
      setTimeout(() => note.remove(), 6500);
    }
  }
}

function wizardBack() {
  if (wizardStep > 1) {
    wizardStep--;
    renderWizardStep();
  }
}

function bindWizard() {
  const startBtn = $('#startWizard');
  if (startBtn) startBtn.addEventListener('click', openWizard);
  const guideBtn = $('#guideBtn');
  if (guideBtn) guideBtn.addEventListener('click', openWizard);

  const closeBtn = $('#wizardClose');
  if (closeBtn) closeBtn.addEventListener('click', closeWizard);

  const scrim = $('#wizardModal .modal__scrim');
  if (scrim) scrim.addEventListener('click', closeWizard);

  $('#wizardNext')?.addEventListener('click', wizardNext);
  $('#wizardBack')?.addEventListener('click', wizardBack);
  $('#wizardSkip')?.addEventListener('click', () => {
    closeWizard();
    // Still render in case they loaded something
    renderAll();
  });

  // Keyboard escape
  document.addEventListener('keydown', (e) => {
    const m = $('#wizardModal');
    if (e.key === 'Escape' && m && !m.hidden) {
      closeWizard();
    }
  });
}

async function init() {
  const glossaryEl = $('#glossaryPanel');
  if (glossaryEl) glossaryEl.innerHTML = glossaryHtml();

  initThemePicker();
  initVanity();
  initMobileUx();
  populateIssuerSelects();
  populateInboxIssuers();
  bindWizard();

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

  document.addEventListener('click', (e) => {
    const jump = e.target.closest('[data-tab-jump]');
    if (jump?.dataset.tabJump) switchTab(jump.dataset.tabJump);

    // Delegated handlers (more reliable on mobile / after any dynamic changes)
    if (e.target.closest('#addOffer')) { openForm(null); return; }
    if (e.target.closest('#loadHousehold')) { loadPlan('household-stretch'); return; }
    if (e.target.closest('#loadBalanced')) { loadPlan('balanced'); return; }
    if (e.target.closest('#loadConservative')) { loadPlan('conservative'); return; }
    if (e.target.closest('#loadSeed')) { loadPlan('balanced'); return; }
    if (e.target.closest('#guideBtn')) { openWizard(); return; }
  });

  $('#catalogIssuer')?.addEventListener('change', renderCatalog);
  $('#catalogCategory')?.addEventListener('change', renderCatalog);
  $('#transferProgram')?.addEventListener('change', (e) => renderTransferTable(e.target.value));

  // Direct attaches removed in favor of delegated (more reliable under mobile emulation + dynamic re-renders)

  $('#loadWalletPreset')?.addEventListener('click', () => {
    const preset = WALLET_PRESETS['starter-six'];
    if (!preset) return;
    state.profile.ownedCards = [...preset.cards];
    save();
    renderWalletIntegration();
  });
  $('#exportBtn')?.addEventListener('click', exportJson);
  $('#importBtn')?.addEventListener('click', () => $('#importFile').click());
  $('#importFile')?.addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (f) importJson(f);
    e.target.value = '';
  });
  $('#offerForm')?.addEventListener('submit', saveOffer);
  $('#offerCancel')?.addEventListener('click', closeForm);
  $('#offerModalClose')?.addEventListener('click', closeForm);
  $('#offerModal')?.addEventListener('click', (e) => {
    if (e.target.closest('[data-modal-close]')) closeForm();
  });
  document.addEventListener('keydown', (e) => {
    const modal = $('#offerModal');
    if (e.key === 'Escape' && modal && !modal.hidden) closeForm();
  });

  $('#refreshFeed')?.addEventListener('click', refreshFeedNow);

  try {
    offersFeed = await loadOffersFeed();
    updateFeedBadge();
  } catch (e) {
    console.warn('Initial feed load:', e.message);
  }

  renderAll();

  // Aggressively surface wizard for users who haven't seen it or have empty plan
  try {
    const hasSeen = localStorage.getItem('promo_wizard_seen');
    const active = (state.offers || []).filter(o => !['done','skip'].includes(o.status)).length;

    if (active === 0) {
      setTimeout(() => {
        dismissWelcomeSplash();
        if (!hasSeen) {
          // Auto-launch the wizard for brand new / empty users so they can't miss it
          openWizard();
          localStorage.setItem('promo_wizard_seen', '1');
        } else {
          // Still show strong nudge
          const cta = $('#startWizard');
          if (cta) cta.style.boxShadow = '0 0 0 4px rgba(230,0,35,0.3)';
        }
      }, 1200);
    }
  } catch (e) {}
}

init();