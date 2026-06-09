(function () {
  'use strict';

  if (window.__flipCalcReady) return;

  let calcRoot = null;
  let $ = null;
  let waterfallChart = null;
  let capitalChart = null;
  let burnChart = null;
  const syncFns = {};
  let targetProfit = 25000;
  let activeMarket = 'marion';
  let activeRehab = 'standard';

  const SCORE_RING_CIRC = 2 * Math.PI * 52;

  function mount() {
    calcRoot = document.querySelector('#fix-flip-calculator');
    if (!calcRoot) return false;
    $ = (sel) => calcRoot.querySelector(sel);
    return true;
  }

  const parseNum = (raw, fallback) => {
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/,/g, ''));
    return Number.isFinite(n) ? n : fallback;
  };

  const fmt = (n, dec = 0) => {
    if (!Number.isFinite(n)) return '$0';
    return n.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
  };

  const pct = (n, dec = 1) => {
    if (!Number.isFinite(n)) return '0.0%';
    return n.toFixed(dec) + '%';
  };

  const MARKET_PRESETS = {
    marion: {
      purchasePrice: 118000, arv: 189000, rehabBudget: 35000, rehabContingency: 10,
      holdMonths: 4, propertyTaxMo: 175, insuranceMo: 90, utilitiesMo: 175,
      purchaseRate: 11.5, rehabRate: 12, buyClosing: 3000,
    },
    midwest: {
      purchasePrice: 145000, arv: 218000, rehabBudget: 28000, rehabContingency: 10,
      holdMonths: 5, propertyTaxMo: 195, insuranceMo: 110, utilitiesMo: 200,
      purchaseRate: 10.75, rehabRate: 11.25, buyClosing: 3500,
    },
    sunbelt: {
      purchasePrice: 185000, arv: 292000, rehabBudget: 48000, rehabContingency: 12,
      holdMonths: 5, propertyTaxMo: 240, insuranceMo: 140, utilitiesMo: 250,
      purchaseRate: 11, rehabRate: 12.5, buyClosing: 4200,
    },
  };

  const REHAB_PRESETS = {
    cosmetic: { rehabBudget: 15000, rehabContingency: 8, holdMonths: 3 },
    standard: { rehabBudget: 35000, rehabContingency: 10, holdMonths: 4 },
    heavy: { rehabBudget: 65000, rehabContingency: 15, holdMonths: 6 },
    structural: { rehabBudget: 95000, rehabContingency: 20, holdMonths: 8 },
  };

  const inputs = {
    purchasePrice: { el: '#flipPurchasePrice', slider: '#flipPurchasePriceSlider', display: '#flipPurchasePriceDisplay', min: 40000, max: 800000, step: 5000, default: 118000 },
    arv: { el: '#flipArv', slider: '#flipArvSlider', display: '#flipArvDisplay', min: 60000, max: 1200000, step: 5000, default: 189000 },
    rehabBudget: { el: '#flipRehabBudget', slider: '#flipRehabBudgetSlider', display: '#flipRehabBudgetDisplay', min: 5000, max: 250000, step: 1000, default: 35000 },
    rehabContingency: { el: '#flipRehabContingency', slider: '#flipRehabContingencySlider', display: '#flipRehabContingencyDisplay', min: 0, max: 30, step: 1, default: 10, suffix: '%' },
    holdMonths: { el: '#flipHoldMonths', slider: '#flipHoldMonthsSlider', display: '#flipHoldMonthsDisplay', min: 1, max: 18, step: 1, default: 4, suffix: ' mo' },
    purchaseDown: { el: '#flipPurchaseDown', slider: '#flipPurchaseDownSlider', display: '#flipPurchaseDownDisplay', min: 0, max: 50, step: 1, default: 20, suffix: '%' },
    purchaseRate: { el: '#flipPurchaseRate', slider: '#flipPurchaseRateSlider', display: '#flipPurchaseRateDisplay', min: 4, max: 18, step: 0.25, default: 11.5, suffix: '%', decimals: 2 },
    purchasePoints: { el: '#flipPurchasePoints', slider: '#flipPurchasePointsSlider', display: '#flipPurchasePointsDisplay', min: 0, max: 5, step: 0.25, default: 2, suffix: '%', decimals: 1 },
    rehabRate: { el: '#flipRehabRate', slider: '#flipRehabRateSlider', display: '#flipRehabRateDisplay', min: 4, max: 18, step: 0.25, default: 12, suffix: '%', decimals: 2 },
    propertyTaxMo: { el: '#flipPropertyTaxMo', slider: '#flipPropertyTaxMoSlider', display: '#flipPropertyTaxMoDisplay', min: 0, max: 800, step: 25, default: 175 },
    insuranceMo: { el: '#flipInsuranceMo', slider: '#flipInsuranceMoSlider', display: '#flipInsuranceMoDisplay', min: 0, max: 400, step: 25, default: 90 },
    utilitiesMo: { el: '#flipUtilitiesMo', slider: '#flipUtilitiesMoSlider', display: '#flipUtilitiesMoDisplay', min: 0, max: 600, step: 25, default: 175 },
    hoaMo: { el: '#flipHoaMo', slider: '#flipHoaMoSlider', display: '#flipHoaMoDisplay', min: 0, max: 400, step: 25, default: 0 },
    buyClosing: { el: '#flipBuyClosing', slider: '#flipBuyClosingSlider', display: '#flipBuyClosingDisplay', min: 0, max: 15000, step: 100, default: 3000 },
    sellingAgentPct: { el: '#flipSellingAgentPct', slider: '#flipSellingAgentPctSlider', display: '#flipSellingAgentPctDisplay', min: 0, max: 8, step: 0.25, default: 5.5, suffix: '%', decimals: 1 },
    sellerClosingPct: { el: '#flipSellerClosingPct', slider: '#flipSellerClosingPctSlider', display: '#flipSellerClosingPctDisplay', min: 0, max: 5, step: 0.25, default: 2, suffix: '%', decimals: 1 },
    seventyRulePct: { el: '#flipSeventyRulePct', slider: '#flipSeventyRulePctSlider', display: '#flipSeventyRulePctDisplay', min: 60, max: 80, step: 1, default: 70, suffix: '%' },
  };

  const FLIP_URL_KEYS = {
    purchasePrice: 'fp', arv: 'fa', rehabBudget: 'fr', rehabContingency: 'fc',
    holdMonths: 'fh', purchaseDown: 'fd', purchaseRate: 'fpr', purchasePoints: 'fpt',
    rehabRate: 'frr', propertyTaxMo: 'ftx', insuranceMo: 'fins', utilitiesMo: 'fut',
    hoaMo: 'fho', buyClosing: 'fbc', sellingAgentPct: 'fsa', sellerClosingPct: 'fsc',
    seventyRulePct: 'f70', targetProfit: 'ftp',
  };

  const FLIP_SCENARIOS = [
    { label: 'Your Deal', key: 'base' },
    { label: 'Rehab +20%', overrides: { rehabBudget: (v) => v.rehabBudget * 1.2 } },
    { label: 'ARV -5%', overrides: { arv: (v) => v.arv * 0.95 } },
    { label: 'Hold +2 mo', overrides: { holdMonths: (v) => Math.min(18, v.holdMonths + 2) } },
    { label: 'Rate +1%', overrides: { purchaseRate: (v) => v.purchaseRate + 1, rehabRate: (v) => v.rehabRate + 1 } },
    { label: 'ARV -10% + Hold +3', overrides: { arv: (v) => v.arv * 0.9, holdMonths: (v) => Math.min(18, v.holdMonths + 3) } },
  ];

  function getValues() {
    const v = {};
    for (const [key, cfg] of Object.entries(inputs)) {
      const input = $(cfg.el);
      v[key] = parseNum(input ? input.value : cfg.default, cfg.default);
    }
    const financeRehab = $('#flipFinanceRehab');
    v.financeRehab = financeRehab ? financeRehab.checked : true;
    return v;
  }

  function applyOverrides(base, overrides) {
    const v = Object.assign({}, base);
    if (!overrides) return v;
    for (const [key, fn] of Object.entries(overrides)) {
      v[key] = typeof fn === 'function' ? fn(base) : fn;
    }
    return v;
  }

  function calculateFrom(v) {
    const purchase = v.purchasePrice;
    const arv = v.arv;
    const rehabTotal = v.rehabBudget * (1 + v.rehabContingency / 100);
    const hold = v.holdMonths;

    const downCash = purchase * (v.purchaseDown / 100);
    const loanAmount = purchase - downCash;
    const pointsCost = loanAmount * (v.purchasePoints / 100);
    const buyClosing = v.buyClosing;

    const rehabCash = v.financeRehab ? 0 : rehabTotal;
    const rehabLoan = v.financeRehab ? rehabTotal : 0;

    const purchaseInterest = loanAmount * (v.purchaseRate / 100 / 12) * hold;
    const rehabInterest = rehabLoan * (v.rehabRate / 100 / 12) * hold * 0.55;

    const holdingMonthly = v.propertyTaxMo + v.insuranceMo + v.utilitiesMo + v.hoaMo;
    const holdingCosts = holdingMonthly * hold;

    const sellCosts = arv * ((v.sellingAgentPct + v.sellerClosingPct) / 100);
    const netSaleProceeds = arv - sellCosts;

    const totalProjectCost = purchase + rehabTotal + buyClosing + pointsCost + purchaseInterest
      + rehabInterest + holdingCosts + sellCosts;
    const netProfit = arv - totalProjectCost;
    const profitMargin = arv > 0 ? (netProfit / arv) * 100 : 0;

    const cashInvested = downCash + buyClosing + pointsCost + rehabCash + holdingCosts
      + purchaseInterest + rehabInterest;
    const roi = cashInvested > 0 ? (netProfit / cashInvested) * 100 : 0;
    const annualizedRoi = hold > 0 ? roi * (12 / hold) : 0;
    const profitPerMonth = hold > 0 ? netProfit / hold : 0;

    const rulePct = v.seventyRulePct / 100;
    const maxOffer70 = arv * rulePct - rehabTotal - holdingCosts;
    const offerGap = purchase - maxOffer70;

    const spread = arv - purchase - rehabTotal;
    const spreadPct = purchase > 0 ? (spread / purchase) * 100 : 0;
    const rehabPctOfArv = arv > 0 ? (rehabTotal / arv) * 100 : 0;
    const allInCost = purchase + rehabTotal + buyClosing + pointsCost + holdingCosts
      + purchaseInterest + rehabInterest;
    const profitPerDollar = allInCost > 0 ? netProfit / allInCost : 0;

    const monthlyBurn = [];
    for (let m = 1; m <= hold; m++) {
      const moInterest = loanAmount * (v.purchaseRate / 100 / 12)
        + rehabLoan * (v.rehabRate / 100 / 12) * (m / hold) * 0.55;
      monthlyBurn.push({
        month: m,
        carry: holdingMonthly,
        interest: moInterest,
        total: holdingMonthly + moInterest,
      });
    }

    const capitalStack = [
      { label: 'Down Payment', value: downCash },
      { label: 'Buy Closing & Points', value: buyClosing + pointsCost },
      { label: 'Rehab (cash)', value: rehabCash },
      { label: 'Holding Costs', value: holdingCosts },
      { label: 'Loan Interest', value: purchaseInterest + rehabInterest },
    ].filter(function (row) { return row.value > 0; });

    const waterfall = [
      { label: 'ARV', value: arv, type: 'start' },
      { label: 'Selling costs', value: -sellCosts, type: 'step' },
      { label: 'Purchase', value: -purchase, type: 'step' },
      { label: 'Rehab', value: -rehabTotal, type: 'step' },
      { label: 'Buy close & points', value: -(buyClosing + pointsCost), type: 'step' },
      { label: 'Holding', value: -holdingCosts, type: 'step' },
      { label: 'Interest', value: -(purchaseInterest + rehabInterest), type: 'step' },
      { label: 'Net profit', value: netProfit, type: 'end' },
    ];

    return {
      v, purchase, arv, rehabTotal, hold, downCash, loanAmount, pointsCost, buyClosing,
      rehabCash, rehabLoan, purchaseInterest, rehabInterest, holdingMonthly, holdingCosts,
      sellCosts, netSaleProceeds, totalProjectCost, netProfit, profitMargin,
      cashInvested, roi, annualizedRoi, profitPerMonth, maxOffer70, offerGap,
      spread, spreadPct, rehabPctOfArv, allInCost, profitPerDollar, monthlyBurn,
      capitalStack, waterfall,
    };
  }

  function calculate(overrides) {
    return calculateFrom(applyOverrides(getValues(), overrides));
  }

  function computeDealScore(r) {
    let score = 0;
    const factors = [];

    if (r.offerGap <= 0) {
      score += 22;
      factors.push({ label: '70% rule', pts: 22, ok: true });
    } else if (r.offerGap <= 10000) {
      score += 12;
      factors.push({ label: '70% rule', pts: 12, ok: false });
    } else {
      factors.push({ label: '70% rule', pts: 0, ok: false });
    }

    if (r.netProfit >= 30000) { score += 22; factors.push({ label: 'Net profit', pts: 22, ok: true }); }
    else if (r.netProfit >= 20000) { score += 18; factors.push({ label: 'Net profit', pts: 18, ok: true }); }
    else if (r.netProfit >= 10000) { score += 12; factors.push({ label: 'Net profit', pts: 12, ok: false }); }
    else if (r.netProfit >= 0) { score += 5; factors.push({ label: 'Net profit', pts: 5, ok: false }); }
    else { factors.push({ label: 'Net profit', pts: 0, ok: false }); }

    if (r.roi >= 30) { score += 18; factors.push({ label: 'ROI on cash', pts: 18, ok: true }); }
    else if (r.roi >= 20) { score += 14; factors.push({ label: 'ROI on cash', pts: 14, ok: true }); }
    else if (r.roi >= 12) { score += 8; factors.push({ label: 'ROI on cash', pts: 8, ok: false }); }
    else if (r.roi >= 0) { score += 3; factors.push({ label: 'ROI on cash', pts: 3, ok: false }); }
    else { factors.push({ label: 'ROI on cash', pts: 0, ok: false }); }

    if (r.annualizedRoi >= 60) { score += 14; factors.push({ label: 'Annualized ROI', pts: 14, ok: true }); }
    else if (r.annualizedRoi >= 40) { score += 10; factors.push({ label: 'Annualized ROI', pts: 10, ok: true }); }
    else if (r.annualizedRoi >= 25) { score += 6; factors.push({ label: 'Annualized ROI', pts: 6, ok: false }); }
    else { factors.push({ label: 'Annualized ROI', pts: 0, ok: false }); }

    if (r.profitMargin >= 15) { score += 12; factors.push({ label: 'Profit margin', pts: 12, ok: true }); }
    else if (r.profitMargin >= 10) { score += 8; factors.push({ label: 'Profit margin', pts: 8, ok: false }); }
    else if (r.profitMargin >= 5) { score += 4; factors.push({ label: 'Profit margin', pts: 4, ok: false }); }
    else { factors.push({ label: 'Profit margin', pts: 0, ok: false }); }

    if (r.hold <= 5) { score += 8; factors.push({ label: 'Timeline', pts: 8, ok: true }); }
    else if (r.hold <= 8) { score += 4; factors.push({ label: 'Timeline', pts: 4, ok: false }); }
    else { factors.push({ label: 'Timeline', pts: 0, ok: false }); }

    if (r.rehabPctOfArv <= 25) { score += 4; factors.push({ label: 'Rehab % of ARV', pts: 4, ok: true }); }
    else if (r.rehabPctOfArv <= 35) { score += 2; factors.push({ label: 'Rehab % of ARV', pts: 2, ok: false }); }
    else { factors.push({ label: 'Rehab % of ARV', pts: 0, ok: false }); }

    return { score: Math.min(100, score), factors };
  }

  function solveMaxPurchaseForProfit(target, baseV) {
    let lo = inputs.purchasePrice.min;
    let hi = inputs.purchasePrice.max;
    let best = lo;

    for (let i = 0; i < 40; i++) {
      const mid = Math.round((lo + hi) / 2 / inputs.purchasePrice.step) * inputs.purchasePrice.step;
      const trial = Object.assign({}, baseV, { purchasePrice: mid });
      const profit = calculateFrom(trial).netProfit;
      if (profit >= target) {
        best = mid;
        lo = mid + inputs.purchasePrice.step;
      } else {
        hi = mid - inputs.purchasePrice.step;
      }
    }
    return Math.max(inputs.purchasePrice.min, Math.min(inputs.purchasePrice.max, best));
  }

  function applyMetricCardClass(el, cls) {
    if (!el || !cls) return;
    const card = el.closest('.metric-card');
    if (!card) return;
    card.classList.remove('positive', 'negative', 'neutral', 'accent');
    card.classList.add(cls);
  }

  function setMetricValue(id, value, cls) {
    const el = $(id);
    if (!el) return;
    el.textContent = value;
    applyMetricCardClass(el, cls);
  }

  function setMetricNumber(id, num, formatter, cls) {
    const el = $(id);
    if (!el) return;
    el.textContent = formatter(Number.isFinite(num) ? num : 0);
    applyMetricCardClass(el, cls);
  }

  function updateDealScore(r) {
    const ds = computeDealScore(r);
    const scoreEl = $('#flipDealScore');
    const ringEl = $('#flipScoreRing');
    const breakdownEl = $('#flipScoreBreakdown');

    if (scoreEl) {
      scoreEl.textContent = ds.score;
      scoreEl.className = 'score-number' + (ds.score >= 75 ? ' hot' : ds.score >= 50 ? ' warm' : ' cold');
    }

    if (ringEl) {
      const offset = SCORE_RING_CIRC * (1 - ds.score / 100);
      ringEl.style.strokeDasharray = SCORE_RING_CIRC;
      ringEl.style.strokeDashoffset = offset;
      ringEl.setAttribute('class', 'score-ring-fill' + (ds.score >= 75 ? ' hot' : ds.score >= 50 ? ' warm' : ' cold'));
    }

    if (breakdownEl) {
      breakdownEl.innerHTML = ds.factors.map(function (f) {
        return '<div class="score-factor' + (f.ok ? ' pass' : ' warn') + '">' +
          '<span>' + f.label + '</span><span>+' + f.pts + '</span></div>';
      }).join('');
    }
  }

  function updateOptimizer(r) {
    const display = $('#flipTargetProfitDisplay');
    const offerEl = $('#flipOptimizedOffer');
    if (display) display.textContent = fmt(targetProfit);

    const maxOffer = solveMaxPurchaseForProfit(targetProfit, r.v);
    if (offerEl) {
      offerEl.textContent = fmt(maxOffer);
      const gap = r.purchase - maxOffer;
      offerEl.className = 'optimizer-value' + (gap <= 0 ? ' good' : ' over');
    }
  }

  function flipBenchmarkStatus(kind, value, r) {
    if (kind === 'seventy') {
      if (r.offerGap <= 0) return { cls: 'pass', note: 'At or under ' + r.v.seventyRulePct + '% rule max offer' };
      if (r.offerGap <= 8000) return { cls: 'warn', note: fmt(r.offerGap) + ' over max — negotiate harder' };
      return { cls: 'fail', note: fmt(r.offerGap) + ' over rule — thin or negative after stress' };
    }
    if (kind === 'minProfit') {
      if (value >= 25000) return { cls: 'pass', note: 'Meets $25k+ flip profit target' };
      if (value >= 15000) return { cls: 'warn', note: 'Workable but below typical $25k floor' };
      if (value >= 0) return { cls: 'warn', note: 'Positive but thin — one overrun kills it' };
      return { cls: 'fail', note: 'Underwater at current assumptions' };
    }
    if (kind === 'margin') {
      if (value >= 12) return { cls: 'pass', note: 'Healthy margin on ARV' };
      if (value >= 8) return { cls: 'warn', note: 'Acceptable in tight markets' };
      return { cls: 'fail', note: 'Low margin — fees and slippage hurt' };
    }
    if (kind === 'annualized') {
      if (value >= 50) return { cls: 'pass', note: 'Strong velocity-adjusted return' };
      if (value >= 30) return { cls: 'warn', note: 'Decent if timeline holds' };
      return { cls: 'fail', note: 'Capital tied up too long for return' };
    }
    if (kind === 'spread') {
      if (value >= 35) return { cls: 'pass', note: 'Wide spread vs purchase + rehab' };
      if (value >= 20) return { cls: 'warn', note: 'Tighter — watch rehab scope' };
      return { cls: 'fail', note: 'Spread may not cover friction costs' };
    }
    if (kind === 'rehabPct') {
      if (value <= 25) return { cls: 'pass', note: 'Rehab is reasonable share of ARV' };
      if (value <= 35) return { cls: 'warn', note: 'Heavier scope — contingency matters' };
      return { cls: 'fail', note: 'Rehab eating too much of exit value' };
    }
    return { cls: 'neutral', note: '' };
  }

  function flipBenchmarkCard(label, valueHtml, kind, value, r) {
    const st = flipBenchmarkStatus(kind, value, r);
    return '<div class="benchmark-card ' + st.cls + '">' +
      '<div class="benchmark-label">' + label + '</div>' +
      '<div class="benchmark-value">' + valueHtml + '</div>' +
      '<div class="benchmark-note">' + st.note + '</div></div>';
  }

  function updateBenchmarks(r) {
    const grid = $('#flipBenchmarkGrid');
    if (!grid) return;

    grid.innerHTML = [
      flipBenchmarkCard('70% Rule Check', r.offerGap <= 0 ? 'PASS' : fmt(r.offerGap) + ' over', 'seventy', r.offerGap, r),
      flipBenchmarkCard('Min Profit ($25k)', fmt(r.netProfit), 'minProfit', r.netProfit, r),
      flipBenchmarkCard('Profit Margin', pct(r.profitMargin), 'margin', r.profitMargin, r),
      flipBenchmarkCard('Annualized ROI', pct(r.annualizedRoi), 'annualized', r.annualizedRoi, r),
      flipBenchmarkCard('Spread %', pct(r.spreadPct), 'spread', r.spreadPct, r),
      flipBenchmarkCard('Rehab % of ARV', pct(r.rehabPctOfArv), 'rehabPct', r.rehabPctOfArv, r),
      flipBenchmarkCard('Profit / $1 Invested', (r.profitPerDollar * 100).toFixed(1) + '¢', 'neutral', 0, r),
      flipBenchmarkCard('Max 70% Offer', fmt(r.maxOffer70), 'neutral', 0, r),
    ].join('');
  }

  function updateVerdict(r) {
    const banner = $('#flipVerdictBanner');
    if (!banner) return;
    const ds = computeDealScore(r);

    let cls, title, desc;
    if (ds.score >= 75 && r.netProfit >= 20000) {
      cls = 'good';
      title = 'Strong Flip';
      desc = 'Deal score ' + ds.score + '/100. Net profit of ' + fmt(r.netProfit) + ' on ' + fmt(r.cashInvested)
        + ' cash (' + pct(r.roi) + ' ROI). Roughly ' + fmt(r.profitPerMonth) + '/mo over a ' + r.hold + '-month hold.';
    } else if (r.netProfit >= 10000 && r.roi >= 12) {
      cls = 'moderate';
      title = 'Workable Deal';
      desc = 'Score ' + ds.score + '/100. Profit of ' + fmt(r.netProfit) + ' with ' + pct(r.annualizedRoi)
        + ' annualized. Worth running if rehab timeline and ARV comps hold.';
    } else if (r.netProfit >= 0) {
      cls = 'moderate';
      title = 'Thin Margin';
      desc = 'Score ' + ds.score + '/100. Positive at ' + fmt(r.netProfit) + ', but one overrun or ARV miss eats it. '
        + '70% rule max is ' + fmt(r.maxOffer70) + ' (' + (r.offerGap > 0 ? fmt(r.offerGap) + ' over' : 'you are under') + ').';
    } else {
      cls = 'poor';
      title = 'Numbers Do Not Work';
      desc = 'Score ' + ds.score + '/100. Projected loss of ' + fmt(Math.abs(r.netProfit)) + '. '
        + 'Cut price, trim rehab, or raise ARV before you chase this one.';
    }

    banner.className = 'verdict-banner ' + cls;
    banner.innerHTML = '<div class="verdict-text"><h5>' + title + '</h5><p>' + desc + '</p></div>';
  }

  function updateBreakdown(r) {
    const tbody = $('#flipBreakdownBody');
    if (!tbody) return;
    tbody.innerHTML =
      '<tr><th>Purchase Price</th><td class="expense">' + fmt(r.purchase) + '</td></tr>' +
      '<tr><th>Rehab Budget</th><td class="expense">' + fmt(r.v.rehabBudget) + '</td></tr>' +
      '<tr><th>Contingency (' + pct(r.v.rehabContingency) + ')</th><td class="expense">' + fmt(r.rehabTotal - r.v.rehabBudget) + '</td></tr>' +
      '<tr><th>Total Rehab</th><td class="expense">' + fmt(r.rehabTotal) + '</td></tr>' +
      '<tr><th>Down Payment</th><td class="expense">' + fmt(r.downCash) + '</td></tr>' +
      '<tr><th>Loan Amount</th><td>' + fmt(r.loanAmount) + '</td></tr>' +
      '<tr><th>Points &amp; Buy Closing</th><td class="expense">' + fmt(r.pointsCost + r.buyClosing) + '</td></tr>' +
      '<tr><th>Holding (' + r.hold + ' mo)</th><td class="expense">' + fmt(r.holdingCosts) + '</td></tr>' +
      '<tr><th>Loan Interest</th><td class="expense">' + fmt(r.purchaseInterest + r.rehabInterest) + '</td></tr>' +
      '<tr><th>ARV</th><td class="income">' + fmt(r.arv) + '</td></tr>' +
      '<tr><th>Selling Costs</th><td class="expense">-' + fmt(r.sellCosts) + '</td></tr>' +
      '<tr><th>Net Profit</th><td class="' + (r.netProfit >= 0 ? 'income' : 'expense') + '">' + fmt(r.netProfit) + '</td></tr>';
  }

  function updateSensitivity(base) {
    const grid = $('#flipSensitivityGrid');
    if (!grid) return;

    grid.innerHTML = FLIP_SCENARIOS.map(function (scenario) {
      const res = scenario.key === 'base' ? base : calculateFrom(applyOverrides(base.v, scenario.overrides));
      const delta = res.netProfit - base.netProfit;
      const isBase = scenario.key === 'base';
      let deltaClass = 'flat';
      let deltaText = 'baseline';
      if (!isBase) {
        if (delta > 500) { deltaClass = 'up'; deltaText = '+' + fmt(delta) + ' profit'; }
        else if (delta < -500) { deltaClass = 'down'; deltaText = fmt(delta) + ' profit'; }
        else { deltaText = '~ unchanged'; }
      }
      return '<div class="sensitivity-card' + (isBase ? ' base' : '') + '">' +
        '<div class="scenario-label">' + scenario.label + '</div>' +
        '<div class="scenario-value" style="color:' + (res.netProfit >= 0 ? '#059669' : '#dc2626') + '">' +
        fmt(res.netProfit) + '</div>' +
        '<div class="scenario-delta ' + deltaClass + '">' + deltaText + '</div></div>';
    }).join('');
  }

  function buildFloatingWaterfall(r) {
    let running = r.arv;
    const labels = [];
    const bases = [];
    const heights = [];
    const colors = [];

    r.waterfall.forEach(function (row, i) {
      if (row.type === 'start') {
        labels.push(row.label);
        bases.push(0);
        heights.push(row.value);
        colors.push('#3b82f6');
        running = row.value;
        return;
      }
      if (row.type === 'step') {
        const abs = Math.abs(row.value);
        running += row.value;
        labels.push(row.label);
        bases.push(Math.max(0, running));
        heights.push(abs);
        colors.push('#e11d48');
        return;
      }
      if (row.type === 'end') {
        labels.push(row.label);
        bases.push(0);
        heights.push(Math.max(0, row.value));
        colors.push(row.value >= 0 ? '#059669' : '#dc2626');
      }
    });

    return { labels, bases, heights, colors };
  }

  function updateWaterfallChart(r) {
    const canvas = $('#flipWaterfallChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const wf = buildFloatingWaterfall(r);
    const data = {
      labels: wf.labels,
      datasets: [
        { label: 'Base', data: wf.bases, backgroundColor: 'transparent', borderWidth: 0, barPercentage: 0.7 },
        {
          label: 'Amount',
          data: wf.heights,
          backgroundColor: wf.colors,
          borderRadius: 6,
          barPercentage: 0.7,
        },
      ],
    };

    const opts = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: window.innerWidth < 600 ? 1 : 1.6,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              if (ctx.datasetIndex === 0) return null;
              return fmt(ctx.parsed.y);
            },
          },
        },
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 40, font: { size: 10 } } },
        y: {
          stacked: true,
          ticks: { callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'k'; } },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
      },
    };

    if (waterfallChart) {
      waterfallChart.data = data;
      waterfallChart.options = opts;
      waterfallChart.update('active');
    } else {
      waterfallChart = new Chart(canvas, { type: 'bar', data: data, options: opts });
    }
  }

  function updateCapitalChart(r) {
    const canvas = $('#flipCapitalChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const labels = r.capitalStack.map(function (x) { return x.label; });
    const values = r.capitalStack.map(function (x) { return x.value; });
    const palette = ['#be123c', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3'];

    const data = {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: palette.slice(0, values.length),
        borderWidth: 0,
      }],
    };

    const opts = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.1,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const total = r.cashInvested;
              const val = ctx.parsed;
              const share = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
              return fmt(val) + ' (' + share + '%)';
            },
          },
        },
      },
    };

    if (capitalChart) {
      capitalChart.data = data;
      capitalChart.update('active');
    } else {
      capitalChart = new Chart(canvas, { type: 'doughnut', data: data, options: opts });
    }
  }

  function updateBurnChart(r) {
    const canvas = $('#flipBurnChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const labels = r.monthlyBurn.map(function (m) { return 'Mo ' + m.month; });
    const carry = r.monthlyBurn.map(function (m) { return m.carry; });
    const interest = r.monthlyBurn.map(function (m) { return m.interest; });

    const data = {
      labels: labels,
      datasets: [
        { label: 'Carry (tax, ins, utils)', data: carry, backgroundColor: '#fda4af', borderRadius: 4 },
        { label: 'Loan interest', data: interest, backgroundColor: '#be123c', borderRadius: 4 },
      ],
    };

    const opts = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: window.innerWidth < 600 ? 1.4 : 2.4,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
        tooltip: {
          callbacks: {
            footer: function (items) {
              const sum = items.reduce(function (s, i) { return s + i.parsed.y; }, 0);
              return 'Total: ' + fmt(sum);
            },
          },
        },
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: {
          stacked: true,
          ticks: { callback: function (v) { return '$' + v; } },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
      },
    };

    if (burnChart) {
      burnChart.data = data;
      burnChart.options = opts;
      burnChart.update('active');
    } else {
      burnChart = new Chart(canvas, { type: 'bar', data: data, options: opts });
    }
  }

  function render() {
    const r = calculate();

    setMetricNumber('#flipNetProfit', r.netProfit, fmt, r.netProfit >= 15000 ? 'positive' : r.netProfit >= 0 ? 'neutral' : 'negative');
    setMetricNumber('#flipCashNeeded', r.cashInvested, fmt, 'neutral');
    setMetricValue('#flipRoi', pct(r.roi), r.roi >= 20 ? 'positive' : r.roi >= 10 ? 'neutral' : 'negative');
    setMetricValue('#flipAnnualizedRoi', pct(r.annualizedRoi), 'accent');
    setMetricNumber('#flipMaxOffer', r.maxOffer70, fmt, r.offerGap <= 0 ? 'positive' : 'negative');
    setMetricValue('#flipProfitMargin', pct(r.profitMargin), 'neutral');
    setMetricNumber('#flipProfitPerMonth', r.profitPerMonth, fmt, r.profitPerMonth >= 0 ? 'positive' : 'negative');
    setMetricNumber('#flipTotalProjectCost', r.totalProjectCost, fmt, 'neutral');

    const gapEl = $('#flipOfferGapNote');
    if (gapEl) {
      if (r.offerGap > 0) {
        gapEl.textContent = fmt(r.offerGap) + ' over ' + r.v.seventyRulePct + '% rule max';
        gapEl.className = 'metric-sub negative-text';
      } else {
        gapEl.textContent = fmt(Math.abs(r.offerGap)) + ' under ' + r.v.seventyRulePct + '% rule max';
        gapEl.className = 'metric-sub positive-text';
      }
    }

    updateDealScore(r);
    updateOptimizer(r);
    updateVerdict(r);
    updateBenchmarks(r);
    updateBreakdown(r);
    updateSensitivity(r);
    updateWaterfallChart(r);
    updateCapitalChart(r);
    updateBurnChart(r);
  }

  function bindInput(key, cfg) {
    const input = $(cfg.el);
    const slider = $(cfg.slider);
    const display = cfg.display ? $(cfg.display) : null;
    if (!input || !slider) return null;

    const formatDisplay = function (val) {
      if (cfg.suffix === '%') return pct(val, cfg.decimals || 1);
      if (cfg.suffix === ' mo') return val + ' mo';
      return fmt(val);
    };

    const sync = function (val, skipRender) {
      val = parseNum(val, cfg.default);
      val = Math.min(cfg.max, Math.max(cfg.min, val));
      input.value = val;
      slider.value = val;
      if (display) display.textContent = formatDisplay(val);
      if (!skipRender) render();
    };

    syncFns[key] = sync;
    slider.addEventListener('input', function () { sync(slider.value, false); });
    input.addEventListener('input', function () { sync(input.value, false); });
    input.addEventListener('change', function () { sync(input.value, false); });
    return sync;
  }

  function setPresetChipActive(containerSel, attr, value) {
    const container = $(containerSel);
    if (!container) return;
    container.querySelectorAll('.preset-chip').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute(attr) === value);
    });
  }

  function applyMarketPreset(key) {
    const preset = MARKET_PRESETS[key];
    if (!preset) return;
    activeMarket = key;
    setPresetChipActive('#flipMarketPresets', 'data-market', key);
    Object.keys(preset).forEach(function (k) {
      if (syncFns[k]) syncFns[k](preset[k], true);
    });
    render();
  }

  function applyRehabPreset(key) {
    const preset = REHAB_PRESETS[key];
    if (!preset) return;
    activeRehab = key;
    setPresetChipActive('#flipRehabPresets', 'data-rehab', key);
    Object.keys(preset).forEach(function (k) {
      if (syncFns[k]) syncFns[k](preset[k], true);
    });
    render();
  }

  function applyOptimizedOffer() {
    const r = calculate();
    const maxOffer = solveMaxPurchaseForProfit(targetProfit, r.v);
    if (syncFns.purchasePrice) syncFns.purchasePrice(maxOffer, false);
    showToast('Purchase price set to ' + fmt(maxOffer));
  }

  function safeReplaceState(url) {
    try {
      history.replaceState(null, '', url);
    } catch (e) { /* file:// */ }
  }

  function buildShareUrl() {
    const v = getValues();
    const params = new URLSearchParams();
    Object.entries(FLIP_URL_KEYS).forEach(function (entry) {
      const key = entry[0];
      const short = entry[1];
      if (key === 'targetProfit') {
        params.set(short, targetProfit);
        return;
      }
      if (inputs[key]) params.set(short, v[key]);
    });
    const financeRehab = $('#flipFinanceRehab');
    if (financeRehab) params.set('ffr', financeRehab.checked ? '1' : '0');
    const base = window.location.pathname;
    const clean = params.toString();
    return base + (clean ? '?' + clean : '') + '#fix-flip-calculator';
  }

  function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const loaded = {};
    Object.entries(FLIP_URL_KEYS).forEach(function (entry) {
      const key = entry[0];
      const short = entry[1];
      if (!params.has(short)) return;
      if (key === 'targetProfit') {
        targetProfit = parseNum(params.get(short), targetProfit);
        return;
      }
      if (inputs[key]) loaded[key] = parseNum(params.get(short), inputs[key].default);
    });
    Object.keys(loaded).forEach(function (k) {
      if (syncFns[k]) syncFns[k](loaded[k], true);
    });
    const ffr = params.get('ffr');
    const cb = $('#flipFinanceRehab');
    if (cb && ffr !== null) cb.checked = ffr === '1';
    const slider = $('#flipTargetProfitSlider');
    if (slider) slider.value = targetProfit;
  }

  function showToast(msg) {
    const toast = $('#flipShareToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2500);
  }

  function shareScenario() {
    let shareUrl;
    try {
      shareUrl = new URL(buildShareUrl(), window.location.href).href;
    } catch (e) {
      shareUrl = buildShareUrl();
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(function () {
        showToast('Share link copied');
      }).catch(function () {
        showToast('Copy: ' + shareUrl);
      });
    } else {
      showToast('Copy: ' + shareUrl);
    }
    safeReplaceState(buildShareUrl());
  }

  function resetDefaults() {
    applyMarketPreset('marion');
    applyRehabPreset('standard');
    targetProfit = 25000;
    const slider = $('#flipTargetProfitSlider');
    if (slider) slider.value = targetProfit;
    const cb = $('#flipFinanceRehab');
    if (cb) cb.checked = true;
    safeReplaceState(window.location.pathname + '#fix-flip-calculator');
    render();
    showToast('Reset to Marion County flip defaults');
  }

  function init() {
    for (const [key, cfg] of Object.entries(inputs)) {
      const sync = bindInput(key, cfg);
      if (sync) sync(cfg.default, true);
    }

    const cb = $('#flipFinanceRehab');
    if (cb) cb.addEventListener('change', render);

    const targetSlider = $('#flipTargetProfitSlider');
    if (targetSlider) {
      targetSlider.value = targetProfit;
      targetSlider.addEventListener('input', function () {
        targetProfit = parseNum(targetSlider.value, 25000);
        render();
      });
    }

    calcRoot.querySelectorAll('#flipMarketPresets .preset-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyMarketPreset(btn.getAttribute('data-market'));
      });
    });

    calcRoot.querySelectorAll('#flipRehabPresets .preset-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyRehabPreset(btn.getAttribute('data-rehab'));
      });
    });

    const resetBtn = $('#flipResetScenario');
    const shareBtn = $('#flipShareScenario');
    const applyBtn = $('#flipApplyOptimizedOffer');
    if (resetBtn) resetBtn.addEventListener('click', resetDefaults);
    if (shareBtn) shareBtn.addEventListener('click', shareScenario);
    if (applyBtn) applyBtn.addEventListener('click', applyOptimizedOffer);

    loadFromUrl();
    if (window.location.search && window.location.hash !== '#fix-flip-calculator') {
      safeReplaceState(window.location.href.split('#')[0] + '#fix-flip-calculator');
    }

    render();
  }

  function boot() {
    if (window.__flipCalcReady) return;
    if (!mount()) return;
    try {
      init();
      window.__flipCalcReady = true;
    } catch (err) {
      console.error('Fix & Flip calculator failed to start:', err);
    }
  }

  boot();
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
})();