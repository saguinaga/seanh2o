(function () {
  'use strict';

  if (window.__flipCalcReady) return;

  let calcRoot = null;
  let $ = null;
  let chart = null;
  const syncFns = {};

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

  const FLIP_SCENARIOS = [
    { label: 'Your Deal', key: 'base' },
    { label: 'Rehab +20%', overrides: { rehabBudget: (v) => v.rehabBudget * 1.2 } },
    { label: 'ARV -5%', overrides: { arv: (v) => v.arv * 0.95 } },
    { label: 'Hold +2 mo', overrides: { holdMonths: (v) => Math.min(18, v.holdMonths + 2) } },
    { label: 'Rate +1%', overrides: { purchaseRate: (v) => v.purchaseRate + 1, rehabRate: (v) => v.rehabRate + 1 } },
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

    const waterfall = [
      { label: 'Purchase', value: purchase, type: 'cost' },
      { label: 'Rehab (incl. contingency)', value: rehabTotal, type: 'cost' },
      { label: 'Buy closing & points', value: buyClosing + pointsCost, type: 'cost' },
      { label: 'Holding & utilities', value: holdingCosts, type: 'cost' },
      { label: 'Loan interest', value: purchaseInterest + rehabInterest, type: 'cost' },
      { label: 'Selling costs', value: sellCosts, type: 'cost' },
      { label: 'ARV (sale price)', value: arv, type: 'income' },
      { label: 'Net profit', value: netProfit, type: 'net' },
    ];

    return {
      v, purchase, arv, rehabTotal, hold, downCash, loanAmount, pointsCost, buyClosing,
      rehabCash, rehabLoan, purchaseInterest, rehabInterest, holdingMonthly, holdingCosts,
      sellCosts, netSaleProceeds, totalProjectCost, netProfit, profitMargin,
      cashInvested, roi, annualizedRoi, profitPerMonth, maxOffer70, offerGap,
      spread, spreadPct, waterfall,
    };
  }

  function calculate(overrides) {
    return calculateFrom(applyOverrides(getValues(), overrides));
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

  function updateVerdict(r) {
    const banner = $('#flipVerdictBanner');
    if (!banner) return;

    let cls, title, desc;
    if (r.netProfit >= 25000 && r.roi >= 25) {
      cls = 'good';
      title = 'Strong Flip';
      desc = 'Net profit of ' + fmt(r.netProfit) + ' on ' + fmt(r.cashInvested) + ' cash (' + pct(r.roi) + ' ROI). '
        + 'At ' + r.hold + ' months, that\'s roughly ' + fmt(r.profitPerMonth) + '/mo of hold time.';
    } else if (r.netProfit >= 10000 && r.roi >= 12) {
      cls = 'moderate';
      title = 'Workable Deal';
      desc = 'Profit of ' + fmt(r.netProfit) + ' with ' + pct(r.annualizedRoi) + ' annualized return. '
        + 'Worth running if your rehab timeline and ARV comp hold up.';
    } else if (r.netProfit >= 0) {
      cls = 'moderate';
      title = 'Thin Margin';
      desc = 'You\'re positive at ' + fmt(r.netProfit) + ', but one rehab overrun or ARV miss eats it. '
        + '70% rule max offer is ' + fmt(r.maxOffer70) + ' (you\'re ' + (r.offerGap > 0 ? 'over by ' + fmt(r.offerGap) : 'under') + ').';
    } else {
      cls = 'poor';
      title = 'Numbers Don\'t Work';
      desc = 'Projected loss of ' + fmt(Math.abs(r.netProfit)) + '. '
        + 'Cut purchase price, trim rehab, or underwrite a higher ARV before you chase this one.';
    }

    banner.className = 'verdict-banner ' + cls;
    banner.innerHTML =
      '<div class="verdict-text"><h5>' + title + '</h5><p>' + desc + '</p></div>';
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
      const r = scenario.key === 'base' ? base : calculateFrom(applyOverrides(base.v, scenario.overrides));
      const delta = r.netProfit - base.netProfit;
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
        '<div class="scenario-value" style="color:' + (r.netProfit >= 0 ? '#059669' : '#dc2626') + '">' +
        fmt(r.netProfit) + '</div>' +
        '<div class="scenario-delta ' + deltaClass + '">' + deltaText + '</div></div>';
    }).join('');
  }

  function updateChart(r) {
    const canvas = $('#flipWaterfallChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const costLabels = [];
    const costValues = [];
    r.waterfall.forEach(function (row) {
      if (row.type === 'cost') {
        costLabels.push(row.label);
        costValues.push(row.value);
      }
    });
    costLabels.push('Net profit');
    costValues.push(Math.max(0, r.netProfit));

    const opts = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: window.innerWidth < 600 ? 1.1 : 1.8,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) { return fmt(ctx.parsed.y); },
          },
        },
      },
      scales: {
        y: {
          ticks: { callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'k'; } },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 25, font: { size: 10 } } },
      },
    };

    const colors = costValues.map(function (_, i) {
      return i === costValues.length - 1 ? '#059669' : '#e11d48';
    });

    if (chart) {
      chart.data = { labels: costLabels, datasets: [{ data: costValues, backgroundColor: colors, borderRadius: 6 }] };
      chart.update('active');
    } else {
      chart = new Chart(canvas, {
        type: 'bar',
        data: { labels: costLabels, datasets: [{ data: costValues, backgroundColor: colors, borderRadius: 6 }] },
        options: opts,
      });
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

    updateVerdict(r);
    updateBreakdown(r);
    updateSensitivity(r);
    updateChart(r);
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

  function resetDefaults() {
    for (const [key, cfg] of Object.entries(inputs)) {
      if (syncFns[key]) syncFns[key](cfg.default, true);
    }
    const cb = $('#flipFinanceRehab');
    if (cb) cb.checked = true;
    render();
    const toast = $('#flipShareToast');
    if (toast) {
      toast.textContent = 'Reset to Marion County flip defaults';
      toast.classList.add('show');
      setTimeout(function () { toast.classList.remove('show'); }, 2500);
    }
  }

  function init() {
    for (const [key, cfg] of Object.entries(inputs)) {
      const sync = bindInput(key, cfg);
      if (sync) sync(cfg.default, true);
    }
    const cb = $('#flipFinanceRehab');
    if (cb) cb.addEventListener('change', render);
    const resetBtn = $('#flipResetScenario');
    if (resetBtn) resetBtn.addEventListener('click', resetDefaults);
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