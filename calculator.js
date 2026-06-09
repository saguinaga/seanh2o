(function () {
  'use strict';

  if (window.__buyHoldCalcReady) return;

  let calcRoot = null;
  let $ = null;
  let chart = null;
  const syncFns = {};
  let savedDownPayment = 20;

  function mount() {
    calcRoot = document.querySelector('#buy-hold-calculator, #calculator');
    if (!calcRoot) return false;
    $ = (sel) => calcRoot.querySelector(sel);
    return true;
  }

  function calcHash() {
    return document.querySelector('#buy-hold-calculator') ? '#buy-hold-calculator' : '#calculator';
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

  const URL_KEYS = {
    purchasePrice: 'p', downPayment: 'd', interestRate: 'i', loanTerm: 't',
    monthlyRent: 'r', vacancyRate: 'v', propertyTax: 'pt', insurance: 'ins',
    hoa: 'h', maintenance: 'm', management: 'mg', appreciation: 'a', holdingYears: 'y',
  };

  const FINANCING_KEYS = ['downPayment', 'interestRate', 'loanTerm'];

  const inputs = {
    purchasePrice: { el: '#purchasePrice', slider: '#purchasePriceSlider', display: '#purchasePriceDisplay', min: 50000, max: 2000000, step: 5000, default: 350000 },
    downPayment: { el: '#downPayment', slider: '#downPaymentSlider', display: '#downPaymentDisplay', min: 0, max: 50, step: 1, default: 20, suffix: '%' },
    interestRate: { el: '#interestRate', slider: '#interestRateSlider', display: '#interestRateDisplay', min: 2, max: 12, step: 0.125, default: 6.5, suffix: '%', decimals: 2 },
    loanTerm: { el: '#loanTerm', slider: '#loanTermSlider', display: '#loanTermDisplay', min: 10, max: 30, step: 1, default: 30, suffix: ' yr' },
    monthlyRent: { el: '#monthlyRent', slider: '#monthlyRentSlider', display: '#monthlyRentDisplay', min: 500, max: 10000, step: 50, default: 2200 },
    vacancyRate: { el: '#vacancyRate', slider: '#vacancyRateSlider', display: '#vacancyRateDisplay', min: 0, max: 20, step: 1, default: 5, suffix: '%' },
    propertyTax: { el: '#propertyTax', slider: '#propertyTaxSlider', display: '#propertyTaxDisplay', min: 0, max: 20000, step: 100, default: 4200 },
    insurance: { el: '#insurance', slider: '#insuranceSlider', display: '#insuranceDisplay', min: 0, max: 5000, step: 50, default: 1400 },
    hoa: { el: '#hoa', slider: '#hoaSlider', display: '#hoaDisplay', min: 0, max: 1000, step: 25, default: 0 },
    maintenance: { el: '#maintenance', slider: '#maintenanceSlider', display: '#maintenanceDisplay', min: 0, max: 15, step: 0.5, default: 5, suffix: '%' },
    management: { el: '#management', slider: '#managementSlider', display: '#managementDisplay', min: 0, max: 15, step: 0.5, default: 8, suffix: '%' },
    appreciation: { el: '#appreciation', slider: '#appreciationSlider', display: '#appreciationDisplay', min: 0, max: 10, step: 0.25, default: 3, suffix: '%', decimals: 1 },
    holdingYears: { el: '#holdingYears', slider: '#holdingYearsSlider', display: '#holdingYearsDisplay', min: 1, max: 30, step: 1, default: 10, suffix: ' yr' },
  };

  const SENSITIVITY_SCENARIOS = [
    { label: 'Your Scenario', key: 'base' },
    { label: 'Rent drops 10%', overrides: { monthlyRent: (v) => v.monthlyRent * 0.9 } },
    { label: 'Rate rises 1%', skipWhenCash: true, overrides: { interestRate: (v) => v.interestRate + 1 } },
    { label: 'Vacancy +5 pts', overrides: { vacancyRate: (v) => Math.min(20, v.vacancyRate + 5) } },
    { label: 'Price 5% lower', overrides: { purchasePrice: (v) => v.purchasePrice * 0.95 } },
    { label: 'Expenses +15%', overrides: {
      propertyTax: (v) => v.propertyTax * 1.15,
      insurance: (v) => v.insurance * 1.15,
      maintenance: (v) => Math.min(15, v.maintenance * 1.15),
    }},
  ];

  savedDownPayment = inputs.downPayment.default;

  function monthlyMortgage(principal, annualRate, years) {
    if (principal <= 0 || years <= 0) return 0;
    const r = annualRate / 100 / 12;
    const n = years * 12;
    if (r === 0) return principal / n;
    return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  function remainingBalance(principal, annualRate, years, monthsPaid) {
    if (principal <= 0 || years <= 0) return 0;
    const r = annualRate / 100 / 12;
    const n = years * 12;
    if (r === 0) return Math.max(0, principal - (principal / n) * monthsPaid);
    const payment = monthlyMortgage(principal, annualRate, years);
    return principal * Math.pow(1 + r, monthsPaid) - payment * ((Math.pow(1 + r, monthsPaid) - 1) / r);
  }

  function isCashPurchase() {
    const cb = $('#cashPurchase');
    return cb ? cb.checked === true : false;
  }

  function getValues() {
    const v = {};
    for (const [key, cfg] of Object.entries(inputs)) {
      const input = $(cfg.el);
      const raw = input ? input.value : cfg.default;
      v[key] = parseNum(raw, cfg.default);
    }
    v.cashPurchase = isCashPurchase();
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
    const cash = !!v.cashPurchase;
    const downAmount = cash ? v.purchasePrice : v.purchasePrice * (v.downPayment / 100);
    const loanAmount = cash ? 0 : v.purchasePrice - downAmount;
    const mortgage = cash ? 0 : monthlyMortgage(loanAmount, v.interestRate, v.loanTerm);

    const grossRent = v.monthlyRent * 12;
    const effectiveRent = grossRent * (1 - v.vacancyRate / 100);
    const maintenanceCost = v.purchasePrice * (v.maintenance / 100);
    const managementCost = effectiveRent * (v.management / 100);
    const hoaAnnual = v.hoa * 12;

    const totalExpenses = v.propertyTax + v.insurance + maintenanceCost + managementCost + hoaAnnual;
    const noi = effectiveRent - totalExpenses;
    const annualDebtService = mortgage * 12;
    const annualCashFlow = noi - annualDebtService;
    const monthlyCashFlow = annualCashFlow / 12;

    const capRate = v.purchasePrice > 0 ? (noi / v.purchasePrice) * 100 : 0;
    const cashInvested = downAmount;
    const cashOnCash = cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0;

    const monthsHeld = v.holdingYears * 12;
    const futureValue = v.purchasePrice * Math.pow(1 + v.appreciation / 100, v.holdingYears);
    const loanRemaining = remainingBalance(loanAmount, v.interestRate, v.loanTerm, monthsHeld);
    const equity = futureValue - Math.max(0, loanRemaining);
    const totalCashFlow = annualCashFlow * v.holdingYears;
    const totalReturn = equity - downAmount + totalCashFlow;
    const roi = cashInvested > 0 ? (totalReturn / cashInvested) * 100 : 0;

    const loanAfterYear1 = remainingBalance(loanAmount, v.interestRate, v.loanTerm, 12);
    const principalPaydownY1 = Math.max(0, loanAmount - loanAfterYear1);
    const price = v.purchasePrice;
    const grm = grossRent > 0 ? price / grossRent : 0;
    const grossYield = price > 0 ? (grossRent / price) * 100 : 0;
    const opexRatio = grossRent > 0 ? (totalExpenses / grossRent) * 100 : 0;
    const onePctRule = price > 0 ? (v.monthlyRent / price) * 100 : 0;
    const breakEvenOccupancy = grossRent > 0 ? ((totalExpenses + annualDebtService) / grossRent) * 100 : 0;
    const ltv = price > 0 && !cash ? (loanAmount / price) * 100 : 0;
    const dscr = !cash && annualDebtService > 0 ? noi / annualDebtService : (cash ? null : 0);
    const rentPer100k = price > 0 ? v.monthlyRent / (price / 100000) : 0;
    const monthlyTotalOutflow = (totalExpenses + annualDebtService) / 12;
    const equityMultiple = cashInvested > 0 ? (equity + totalCashFlow) / cashInvested : 0;
    const irrPct = computeIrr(cashInvested, v.holdingYears, annualCashFlow, equity);

    const projections = [];
    for (let yr = 0; yr <= v.holdingYears; yr++) {
      const propValue = v.purchasePrice * Math.pow(1 + v.appreciation / 100, yr);
      const balance = remainingBalance(loanAmount, v.interestRate, v.loanTerm, yr * 12);
      const cumulativeCashFlow = annualCashFlow * yr;
      projections.push({
        year: yr,
        propertyValue: propValue,
        equity: propValue - Math.max(0, balance),
        loanBalance: Math.max(0, balance),
        cumulativeCashFlow,
        totalWealth: propValue - Math.max(0, balance) + cumulativeCashFlow,
      });
    }

    return {
      v, cash, downAmount, loanAmount, mortgage, grossRent, effectiveRent,
      maintenanceCost, managementCost, hoaAnnual, totalExpenses, noi,
      annualDebtService, annualCashFlow, monthlyCashFlow,
      capRate, cashOnCash, futureValue, loanRemaining, equity,
      totalCashFlow, totalReturn, roi, projections,
      principalPaydownY1, grm, grossYield, opexRatio, onePctRule,
      breakEvenOccupancy, ltv, dscr, rentPer100k, monthlyTotalOutflow,
      equityMultiple, irrPct,
    };
  }

  function computeIrr(invested, years, annualCashFlow, exitEquity) {
    if (invested <= 0 || years <= 0) return 0;
    const flows = [-invested];
    for (let y = 1; y < years; y++) flows.push(annualCashFlow);
    flows.push(annualCashFlow + exitEquity);

    let low = -0.99;
    let high = 5;
    for (let i = 0; i < 80; i++) {
      const mid = (low + high) / 2;
      let npv = 0;
      for (let t = 0; t < flows.length; t++) {
        npv += flows[t] / Math.pow(1 + mid, t);
      }
      if (npv > 0) low = mid;
      else high = mid;
    }
    return ((low + high) / 2) * 100;
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

  function setMetricNumber(id, targetNum, formatter, cls) {
    const el = $(id);
    if (!el) return;
    el.textContent = formatter(Number.isFinite(targetNum) ? targetNum : 0);
    applyMetricCardClass(el, cls);
  }

  function updateVerdict(r) {
    const banner = $('#verdictBanner');
    if (!banner) return;

    let cls, icon, title, desc;
    if (r.monthlyCashFlow > 200 && r.cashOnCash >= 8) {
      cls = 'good'; icon = '🏆';
      title = 'Strong Buy & Hold Candidate';
      desc = 'Positive cash flow of ' + fmt(r.monthlyCashFlow) + '/mo with ' + pct(r.cashOnCash) + ' cash-on-cash return. Equity grows to ' + fmt(r.equity) + ' over ' + r.v.holdingYears + ' years.';
    } else if (r.monthlyCashFlow >= 0 && r.cashOnCash >= 4) {
      cls = 'moderate'; icon = '📊';
      title = 'Solid Long-Term Hold';
      desc = 'Break-even to modest cash flow. Appreciation (' + pct(r.v.appreciation) + ') builds ' + fmt(r.equity - r.downAmount) + ' in equity over ' + r.v.holdingYears + ' years.';
    } else if (r.monthlyCashFlow >= -200) {
      cls = 'moderate'; icon = '⚖️';
      title = 'Appreciation-Dependent Play';
      desc = 'Monthly cash flow is ' + fmt(r.monthlyCashFlow) + '. Viable if you believe in ' + pct(r.v.appreciation) + ' annual appreciation in this market.';
    } else {
      cls = 'poor'; icon = '⚠️';
      title = 'Numbers Are Tight';
      desc = 'Negative cash flow of ' + fmt(r.monthlyCashFlow) + '/mo. Consider negotiating price, increasing rent, or reducing expenses.';
    }

    banner.className = 'verdict-banner ' + cls;
    banner.innerHTML =
      '<div class="verdict-icon">' + icon + '</div>' +
      '<div class="verdict-text"><h5>' + title + '</h5><p>' + desc + '</p></div>';
  }

  function updateBreakdown(r) {
    const tbody = $('#breakdownBody');
    if (!tbody) return;
    tbody.innerHTML =
      '<tr><th>Gross Annual Rent</th><td class="income">' + fmt(r.grossRent) + '</td></tr>' +
      '<tr><th>Vacancy Loss (' + pct(r.v.vacancyRate) + ')</th><td class="expense">-' + fmt(r.grossRent - r.effectiveRent) + '</td></tr>' +
      '<tr><th>Effective Rental Income</th><td class="income">' + fmt(r.effectiveRent) + '</td></tr>' +
      '<tr><th>Property Taxes</th><td class="expense">-' + fmt(r.v.propertyTax) + '</td></tr>' +
      '<tr><th>Insurance</th><td class="expense">-' + fmt(r.v.insurance) + '</td></tr>' +
      '<tr><th>Maintenance (' + pct(r.v.maintenance) + ')</th><td class="expense">-' + fmt(r.maintenanceCost) + '</td></tr>' +
      '<tr><th>Property Management (' + pct(r.v.management) + ')</th><td class="expense">-' + fmt(r.managementCost) + '</td></tr>' +
      '<tr><th>HOA Fees</th><td class="expense">-' + fmt(r.hoaAnnual) + '</td></tr>' +
      '<tr><th>Net Operating Income</th><td>' + fmt(r.noi) + '</td></tr>' +
      '<tr><th>Mortgage Payment (annual)</th><td class="expense">' + (r.cash ? 'None (cash purchase)' : '-' + fmt(r.annualDebtService)) + '</td></tr>' +
      '<tr><th>Annual Cash Flow</th><td class="' + (r.annualCashFlow >= 0 ? 'income' : 'expense') + '">' + fmt(r.annualCashFlow) + '</td></tr>' +
      '<tr><th colspan="2" class="breakdown-section">Investor Ratios</th></tr>' +
      '<tr><th>Gross Rent Multiplier (GRM)</th><td>' + (r.grm > 0 ? r.grm.toFixed(1) + 'x' : '0.0x') + '</td></tr>' +
      '<tr><th>Gross Yield</th><td>' + pct(r.grossYield) + '</td></tr>' +
      '<tr><th>Operating Expense Ratio</th><td>' + pct(r.opexRatio) + ' <span class="breakdown-hint">(50% rule: ~50%)</span></td></tr>' +
      '<tr><th>1% Rule (rent / price)</th><td class="' + (r.onePctRule >= 1 ? 'income' : 'expense') + '">' + pct(r.onePctRule, 2) + '</td></tr>' +
      '<tr><th>Break-Even Occupancy</th><td>' + pct(r.breakEvenOccupancy) + '</td></tr>' +
      '<tr><th>DSCR (NOI / debt service)</th><td>' + (r.cash ? 'N/A (cash)' : (r.dscr > 0 ? r.dscr.toFixed(2) + 'x' : '0.00x')) + '</td></tr>' +
      '<tr><th>Loan-to-Value (LTV)</th><td>' + (r.cash ? '0% (cash)' : pct(r.ltv)) + '</td></tr>' +
      '<tr><th>Year 1 Principal Paydown</th><td class="income">' + fmt(r.principalPaydownY1) + '</td></tr>' +
      '<tr><th>IRR (hold + exit)</th><td>' + pct(r.irrPct) + '</td></tr>' +
      '<tr><th>Equity Multiple</th><td>' + (r.equityMultiple > 0 ? r.equityMultiple.toFixed(2) + 'x' : '0.00x') + '</td></tr>';
  }

  function benchmarkStatus(kind, value, r) {
    if (kind === 'dscr') {
      if (r.cash) return { cls: 'neutral', note: 'Cash purchase — no debt service' };
      if (value >= 1.25) return { cls: 'pass', note: 'Strong — many DSCR lenders prefer 1.25+' };
      if (value >= 1.0) return { cls: 'warn', note: 'Meets 1.0 minimum — borderline for DSCR loans' };
      return { cls: 'fail', note: 'Below 1.0 — may not qualify for DSCR financing' };
    }
    if (kind === 'onePct') {
      if (value >= 1) return { cls: 'pass', note: 'Passes 1% rule — strong rent vs price' };
      if (value >= 0.8) return { cls: 'warn', note: 'Close to 1% rule — verify market rents' };
      return { cls: 'fail', note: 'Below 1% rule — rent may be thin for price' };
    }
    if (kind === 'opex') {
      if (value <= 50) return { cls: 'pass', note: 'At or below 50% rule estimate' };
      if (value <= 60) return { cls: 'warn', note: 'Above 50% rule — watch expense load' };
      return { cls: 'fail', note: 'High expense ratio — tight margins' };
    }
    if (kind === 'breakEven') {
      if (value <= 85) return { cls: 'pass', note: 'Comfortable cushion above break-even' };
      if (value <= 100) return { cls: 'warn', note: 'Near break-even — little vacancy room' };
      return { cls: 'fail', note: 'Above 100% — loses money at full occupancy' };
    }
    if (kind === 'irr') {
      if (value >= 12) return { cls: 'pass', note: 'Strong annualized return (BiggerPockets target range)' };
      if (value >= 8) return { cls: 'warn', note: 'Moderate return — typical buy-and-hold range' };
      return { cls: 'fail', note: 'Below common 8% investor hurdle' };
    }
    return { cls: 'neutral', note: '' };
  }

  function benchmarkCard(label, valueHtml, kind, value, r) {
    const st = benchmarkStatus(kind, value, r);
    return '<div class="benchmark-card ' + st.cls + '">' +
      '<div class="benchmark-label">' + label + '</div>' +
      '<div class="benchmark-value">' + valueHtml + '</div>' +
      '<div class="benchmark-note">' + st.note + '</div></div>';
  }

  function updateBenchmarks(r) {
    const grid = $('#benchmarkGrid');
    if (!grid) return;

    const dscrVal = r.cash ? 'N/A' : (r.dscr > 0 ? r.dscr.toFixed(2) + 'x' : '0.00x');
    const cards = [
      benchmarkCard('DSCR', dscrVal, 'dscr', r.dscr || 0, r),
      benchmarkCard('1% Rule', pct(r.onePctRule, 2), 'onePct', r.onePctRule, r),
      benchmarkCard('50% Rule (OpEx)', pct(r.opexRatio), 'opex', r.opexRatio, r),
      benchmarkCard('Break-Even Occupancy', pct(r.breakEvenOccupancy), 'breakEven', r.breakEvenOccupancy, r),
      benchmarkCard('Gross Rent Multiplier', (r.grm > 0 ? r.grm.toFixed(1) : '0.0') + 'x', 'neutral', 0, r),
      benchmarkCard('Gross Yield', pct(r.grossYield), 'neutral', 0, r),
      benchmarkCard('IRR (hold + sale)', pct(r.irrPct), 'irr', r.irrPct, r),
      benchmarkCard('Equity Multiple', (r.equityMultiple > 0 ? r.equityMultiple.toFixed(2) : '0.00') + 'x', 'neutral', 0, r),
      benchmarkCard('Rent / $100k Price', fmt(r.rentPer100k), 'neutral', 0, r),
      benchmarkCard('LTV', r.cash ? '0%' : pct(r.ltv), 'neutral', 0, r),
      benchmarkCard('Year 1 Principal Paydown', fmt(r.principalPaydownY1), 'neutral', 0, r),
      benchmarkCard('Monthly Outflow', fmt(r.monthlyTotalOutflow), 'neutral', 0, r),
    ];

    grid.innerHTML = cards.join('');
  }

  function updateSensitivity(base) {
    const grid = $('#sensitivityGrid');
    if (!grid) return;

    grid.innerHTML = SENSITIVITY_SCENARIOS.map(function (scenario) {
      if (scenario.skipWhenCash && base.v.cashPurchase) {
        return '<div class="sensitivity-card muted">' +
          '<div class="scenario-label">' + scenario.label + '</div>' +
          '<div class="scenario-value" style="color:#94a3b8">N/A</div>' +
          '<div class="scenario-delta flat">cash purchase</div></div>';
      }
      const r = scenario.key === 'base' ? base : calculateFrom(applyOverrides(base.v, scenario.overrides));
      const delta = r.monthlyCashFlow - base.monthlyCashFlow;
      const isBase = scenario.key === 'base';
      let deltaClass = 'flat';
      let deltaText = 'baseline';
      if (!isBase) {
        if (delta > 5) { deltaClass = 'up'; deltaText = '+' + fmt(delta) + '/mo vs base'; }
        else if (delta < -5) { deltaClass = 'down'; deltaText = fmt(delta) + '/mo vs base'; }
        else { deltaText = '~ unchanged'; }
      }
      return '<div class="sensitivity-card' + (isBase ? ' base' : '') + '">' +
        '<div class="scenario-label">' + scenario.label + '</div>' +
        '<div class="scenario-value" style="color:' + (r.monthlyCashFlow >= 0 ? '#059669' : '#dc2626') + '">' +
        fmt(r.monthlyCashFlow) + '<span style="font-size:0.7em;font-weight:600">/mo</span></div>' +
        '<div class="scenario-delta ' + deltaClass + '">' + deltaText + '</div></div>';
    }).join('');
  }

  function updateChart(r) {
    const canvas = $('#wealthChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const labels = r.projections.map(function (p) { return 'Year ' + p.year; });
    const datasets = [
      { label: 'Property Value', data: r.projections.map(function (p) { return p.propertyValue; }), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3 },
      { label: 'Equity', data: r.projections.map(function (p) { return p.equity; }), borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.1)', fill: true, tension: 0.3 },
      { label: 'Cumulative Cash Flow', data: r.projections.map(function (p) { return p.cumulativeCashFlow; }), borderColor: '#d97706', backgroundColor: 'rgba(217,119,6,0.1)', fill: true, tension: 0.3 },
    ];
    if (!r.cash) {
      datasets.push({ label: 'Loan Balance', data: r.projections.map(function (p) { return p.loanBalance; }), borderColor: '#dc2626', borderDash: [5, 5], fill: false, tension: 0.3 });
    }

    const opts = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: window.innerWidth < 600 ? 1.15 : 2.2,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) { return ctx.dataset.label + ': ' + fmt(ctx.parsed.y); },
          },
        },
      },
      scales: {
        y: {
          ticks: { callback: function (v) { return Number.isFinite(v) ? '$' + (v / 1000).toFixed(0) + 'k' : ''; } },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        x: { grid: { display: false } },
      },
    };

    if (chart) {
      chart.data = { labels: labels, datasets: datasets };
      chart.update('active');
    } else {
      chart = new Chart(canvas, { type: 'line', data: { labels: labels, datasets: datasets }, options: opts });
    }
  }

  function buildShareUrl() {
    const params = new URLSearchParams();
    const v = getValues();
    for (const [key, short] of Object.entries(URL_KEYS)) {
      params.set(short, v[key]);
    }
    params.set('cash', v.cashPurchase ? '1' : '0');
    const base = window.location.href.split('#')[0].split('?')[0];
    return base + '?' + params.toString() + calcHash();
  }

  function sanitizeUrlParams() {
    const params = new URLSearchParams(window.location.search);
    let dirty = false;

    for (const short of Object.values(URL_KEYS)) {
      if (!params.has(short)) continue;
      const raw = params.get(short);
      if (raw === 'NaN' || raw === '' || !Number.isFinite(parseFloat(raw))) {
        params.delete(short);
        dirty = true;
      }
    }

    if (params.has('cash') && params.get('cash') !== '0' && params.get('cash') !== '1') {
      params.delete('cash');
      dirty = true;
    }

    if (!dirty) return;

    const clean = params.toString();
    const base = window.location.href.split('#')[0].split('?')[0];
    const hash = window.location.hash || calcHash();
    safeReplaceState(base + (clean ? '?' + clean : '') + hash);
  }

  function loadFromUrl() {
    sanitizeUrlParams();
    const params = new URLSearchParams(window.location.search);
    const loaded = {};
    for (const [key, short] of Object.entries(URL_KEYS)) {
      if (params.has(short)) loaded[key] = parseNum(params.get(short), inputs[key].default);
    }
    if (params.has('cash')) loaded.cashPurchase = params.get('cash') === '1';
    return loaded;
  }

  function updateFinancingUI(cash) {
    const wrap = $('#financingFields');
    if (wrap) wrap.classList.toggle('is-disabled', cash);
    calcRoot.classList.toggle('cash-purchase', cash);

    for (const key of FINANCING_KEYS) {
      const cfg = inputs[key];
      const input = $(cfg.el);
      const slider = $(cfg.slider);
      if (input) input.disabled = cash;
      if (slider) slider.disabled = cash;
    }

    const mortgageSub = $('#mortgageSub');
    if (mortgageSub) mortgageSub.textContent = cash ? 'Paid in cash - no loan' : 'Principal & interest';

    const cocSub = $('#cashOnCashSub');
    if (cocSub) cocSub.textContent = cash ? 'Annual return on purchase price' : 'Annual return on down payment';

    const loanLegend = $('#loanBalanceLegend');
    if (loanLegend) loanLegend.style.display = cash ? 'none' : '';
  }

  function setCashPurchase(cash, skipRender) {
    const cb = $('#cashPurchase');
    if (!cb) return;

    if (cash) {
      const dp = $('#downPayment');
      savedDownPayment = parseNum(dp ? dp.value : savedDownPayment, savedDownPayment);
    }

    cb.checked = cash;
    updateFinancingUI(cash);

    if (!cash && syncFns.downPayment) {
      syncFns.downPayment(savedDownPayment, true);
    }

    if (!skipRender) render();
  }

  function safeReplaceState(url) {
    try {
      history.replaceState(null, '', url);
    } catch (e) {
      /* file:// and other restricted contexts */
    }
  }

  function updateUrlQuiet() {
    safeReplaceState(buildShareUrl());
  }

  function showToast(msg) {
    const toast = $('#shareToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2500);
  }

  function render(updateHistory) {
    const r = calculate();

    setMetricNumber('#monthlyCashFlow', r.monthlyCashFlow, fmt, r.monthlyCashFlow >= 0 ? 'positive' : 'negative');
    setMetricNumber('#annualCashFlow', r.annualCashFlow, fmt, r.annualCashFlow >= 0 ? 'positive' : 'negative');
    setMetricNumber('#futureEquity', r.equity, fmt, 'positive');
    setMetricNumber('#mortgagePayment', r.mortgage, fmt, 'neutral');
    setMetricNumber('#totalWealth', r.equity + r.totalCashFlow, fmt, 'accent');
    setMetricValue('#capRate', pct(r.capRate), 'neutral');
    setMetricValue('#cashOnCash', pct(r.cashOnCash), r.cashOnCash >= 6 ? 'positive' : r.cashOnCash >= 0 ? 'neutral' : 'negative');
    setMetricValue('#totalROI', pct(r.roi), 'accent');

    updateFinancingUI(r.cash);
    updateVerdict(r);
    updateBreakdown(r);
    updateBenchmarks(r);
    updateSensitivity(r);
    updateChart(r);

    if (updateHistory !== false) updateUrlQuiet();
  }

  function bindInput(key, cfg) {
    const input = $(cfg.el);
    const slider = $(cfg.slider);
    const display = cfg.display ? $(cfg.display) : null;
    if (!input || !slider) return null;

    const formatDisplay = function (val) {
      if (cfg.suffix === '%') return pct(val, cfg.decimals || 1);
      if (cfg.suffix === ' yr') return val + ' yr';
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
    setCashPurchase(false, true);
    savedDownPayment = inputs.downPayment.default;
    for (const [key, cfg] of Object.entries(inputs)) {
      if (syncFns[key]) syncFns[key](cfg.default, true);
    }
    safeReplaceState(window.location.pathname + calcHash());
    render();
    showToast('Reset to defaults');
  }

  function shareScenario() {
    const url = buildShareUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        showToast('Link copied - share this scenario!');
      }).catch(function () {
        showToast('Copy this URL from the address bar');
      });
    } else {
      showToast('Copy this URL from the address bar');
      window.prompt('Copy this link:', url);
    }
  }

  function init() {
    const urlValues = loadFromUrl();

    for (const [key, cfg] of Object.entries(inputs)) {
      const sync = bindInput(key, cfg);
      const startVal = urlValues[key] !== undefined ? urlValues[key] : cfg.default;
      if (sync) sync(startVal, true);
    }

    setCashPurchase(!!urlValues.cashPurchase, true);

    const cashCb = $('#cashPurchase');
    const shareBtn = $('#shareScenario');
    const resetBtn = $('#resetScenario');
    if (cashCb) cashCb.addEventListener('change', function (e) { setCashPurchase(e.target.checked); });
    if (shareBtn) shareBtn.addEventListener('click', shareScenario);
    if (resetBtn) resetBtn.addEventListener('click', resetDefaults);

    if (Object.keys(urlValues).length && window.location.hash !== calcHash()) {
      safeReplaceState(window.location.href.split('#')[0] + calcHash());
    }

    render(false);
  }

  function boot() {
    if (window.__buyHoldCalcReady) return;
    if (!mount()) return;
    try {
      init();
      window.__buyHoldCalcReady = true;
    } catch (err) {
      console.error('Buy & Hold calculator failed to start:', err);
    }
  }

  boot();
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
})();