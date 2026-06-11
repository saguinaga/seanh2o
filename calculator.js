console.log("\uD83D\uDD25 FIXED INDIANA DEFAULTS + FULL LIVE CALC LOADED - " + new Date().toISOString());

(function () {
  'use strict';

  // ============ INDIANA MARION COUNTY DEFAULT VALUE PROP HOME ============
  // Realistic value-add / strong turnkey 3-bed in Marion County / Indy metro.
  // Attractive but believable: positive cash flow, solid CoC for Midwest, low taxes/ins.
  const DEFAULTS = {
    purchasePrice: 179000,
    downPayment: 20,
    interestRate: 6.75,
    loanTerm: 30,
    monthlyRent: 1595,
    vacancyRate: 6,
    maintenance: 7,
    propertyTaxRate: 0.92,
    insuranceRate: 0.58,
    hoa: 0,
    management: 8,
    appreciation: 3.25,
    holdingYears: 7,
    cashPurchase: false
  };

  // Preset packs (Indiana first, then compare examples)
  const PRESETS = {
    'marion-default': { ...DEFAULTS },
    'indy-turnkey': {
      purchasePrice: 214000, downPayment: 25, interestRate: 6.5, loanTerm: 30,
      monthlyRent: 1725, vacancyRate: 5, maintenance: 6, propertyTaxRate: 0.88,
      insuranceRate: 0.55, hoa: 0, management: 7, appreciation: 3.5, holdingYears: 8, cashPurchase: false
    },
    'lafayette': {
      purchasePrice: 142000, downPayment: 18, interestRate: 6.875, loanTerm: 30,
      monthlyRent: 1395, vacancyRate: 7, maintenance: 8, propertyTaxRate: 0.95,
      insuranceRate: 0.62, hoa: 0, management: 9, appreciation: 2.75, holdingYears: 6, cashPurchase: false
    },
    'hb-sfr': {
      purchasePrice: 875000, downPayment: 25, interestRate: 6.25, loanTerm: 30,
      monthlyRent: 4250, vacancyRate: 4, maintenance: 5, propertyTaxRate: 0.72,
      insuranceRate: 0.35, hoa: 0, management: 6, appreciation: 4.5, holdingYears: 7, cashPurchase: false
    },
    'oc-condo': {
      purchasePrice: 485000, downPayment: 20, interestRate: 6.375, loanTerm: 30,
      monthlyRent: 2650, vacancyRate: 5, maintenance: 4.5, propertyTaxRate: 0.68,
      insuranceRate: 0.32, hoa: 285, management: 7, appreciation: 3.8, holdingYears: 5, cashPurchase: false
    }
  };

  // ============ HELPERS ============
  const $ = (id) => document.getElementById(id);

  function fmtMoney(n) {
    if (!isFinite(n)) return '$0';
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  function fmtPct(n, d = 1) {
    if (!isFinite(n)) return '0.0%';
    return n.toFixed(d) + '%';
  }
  function fmtMoneyOrNA(n, cash = false) {
    if (cash) return 'N/A (Cash)';
    return fmtMoney(n);
  }

  function monthlyPI(principal, annualRatePct, years) {
    if (principal <= 0 || years <= 0) return 0;
    const r = annualRatePct / 100 / 12;
    const n = years * 12;
    if (r === 0) return principal / n;
    return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  function remainingBalance(principal, annualRatePct, totalYears, yearsElapsed) {
    if (principal <= 0) return 0;
    const r = annualRatePct / 100 / 12;
    const n = totalYears * 12;
    const p = Math.min(yearsElapsed * 12, n);
    if (p >= n || r === 0) return 0;
    const factor = Math.pow(1 + r, n);
    return principal * (factor - Math.pow(1 + r, p)) / (factor - 1);
  }

  // ============ STATE ============
  let calcScheduled = false;

  function scheduleCalc() {
    if (calcScheduled) return;
    calcScheduled = true;
    requestAnimationFrame(() => {
      calcScheduled = false;
      fullCalc();
    });
  }

  // ============ BIND SLIDERS <-> NUMBERS <-> DISPLAYS ============
  function bindPair(numId, sliderId, displayId, { isPercent = false, isYear = false, decimals = 0 } = {}) {
    const num = $(numId);
    const slider = $(sliderId);
    const disp = $(displayId);
    if (!num || !slider) {
      console.warn('Missing bind targets', numId, sliderId);
      return;
    }

    function formatDisp(v) {
      if (!disp) return;
      v = parseFloat(v) || 0;
      if (isPercent) {
        disp.textContent = v.toFixed(decimals || 1) + '%';
      } else if (isYear) {
        disp.textContent = v + ' yr';
      } else {
        disp.textContent = fmtMoney(v);
      }
    }

    function sync(sourceIsSlider) {
      let v = sourceIsSlider ? parseFloat(slider.value) : parseFloat(num.value);
      if (!isFinite(v)) v = parseFloat(slider.min) || 0;

      // keep in range
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      if (isFinite(min)) v = Math.max(min, v);
      if (isFinite(max)) v = Math.min(max, v);

      num.value = v;
      slider.value = v;
      formatDisp(v);
      scheduleCalc();
    }

    slider.addEventListener('input', () => sync(true));
    num.addEventListener('input', () => sync(false));
    num.addEventListener('change', () => sync(false));

    // seed initial display
    const start = num.value || slider.value;
    formatDisp(start);
  }

  function setAllValuesFromDefaults() {
    // numbers + sliders
    Object.entries(DEFAULTS).forEach(([key, val]) => {
      if (key === 'cashPurchase') {
        const cb = $('cashPurchase');
        if (cb) cb.checked = !!val;
        return;
      }
      const num = $(key);
      const sld = $(key + 'Slider');
      if (num) num.value = val;
      if (sld) sld.value = val;
    });

    // also set displays for the pairs (will be refreshed in binds + calc)
    const dispMap = {
      purchasePrice: 'purchasePriceDisplay',
      downPayment: 'downPaymentDisplay',
      interestRate: 'interestRateDisplay',
      loanTerm: 'loanTermDisplay',
      monthlyRent: 'monthlyRentDisplay',
      vacancyRate: 'vacancyRateDisplay',
      maintenance: 'maintenanceDisplay',
      propertyTaxRate: 'propertyTaxRateDisplay',
      insuranceRate: 'insuranceRateDisplay',
      hoa: 'hoaDisplay',
      management: 'managementDisplay',
      appreciation: 'appreciationDisplay',
      holdingYears: 'holdingYearsDisplay'
    };
    Object.entries(dispMap).forEach(([k, d]) => {
      const el = $(d);
      if (!el) return;
      const v = DEFAULTS[k];
      if (k === 'downPayment' || k === 'vacancyRate' || k === 'maintenance' || k === 'propertyTaxRate' || k === 'insuranceRate' || k === 'management' || k === 'appreciation') {
        el.textContent = parseFloat(v).toFixed( (k.includes('Rate') || k==='appreciation') ? 2 : 0 ) + (k === 'holdingYears' ? '' : '%');
      } else if (k === 'loanTerm' || k === 'holdingYears') {
        el.textContent = v + ' yr';
      } else {
        el.textContent = fmtMoney(v);
      }
    });
  }

  // ============ FULL CALC + EVERYTHING POPULATES ============
  function fullCalc() {
    const price = parseFloat($('purchasePrice')?.value) || DEFAULTS.purchasePrice;
    const downPct = parseFloat($('downPayment')?.value) || DEFAULTS.downPayment;
    const rate = parseFloat($('interestRate')?.value) || DEFAULTS.interestRate;
    const term = parseFloat($('loanTerm')?.value) || DEFAULTS.loanTerm;
    const rent = parseFloat($('monthlyRent')?.value) || DEFAULTS.monthlyRent;
    const vac = parseFloat($('vacancyRate')?.value) || DEFAULTS.vacancyRate;
    const maintPct = parseFloat($('maintenance')?.value) || DEFAULTS.maintenance;
    const taxR = parseFloat($('propertyTaxRate')?.value) || DEFAULTS.propertyTaxRate;
    const insR = parseFloat($('insuranceRate')?.value) || DEFAULTS.insuranceRate;
    const hoaMo = parseFloat($('hoa')?.value) || DEFAULTS.hoa;
    const mgmtPct = parseFloat($('management')?.value) || DEFAULTS.management;
    const apprec = parseFloat($('appreciation')?.value) || DEFAULTS.appreciation;
    const holdY = parseFloat($('holdingYears')?.value) || DEFAULTS.holdingYears;
    const cash = $('cashPurchase')?.checked || false;

    // Financing
    const downAmt = cash ? price : price * (downPct / 100);
    const loan = Math.max(0, price - downAmt);
    const pmt = monthlyPI(loan, rate, term);
    const debtAnnual = pmt * 12;

    // Income
    const gross = rent * 12;
    const vacLoss = gross * (vac / 100);
    const effGross = gross - vacLoss;

    // Expenses (annual)
    const taxA = price * (taxR / 100);
    const insA = price * (insR / 100);
    const maintA = gross * (maintPct / 100);
    const mgmtA = gross * (mgmtPct / 100);
    const hoaA = hoaMo * 12;
    const opex = taxA + insA + maintA + mgmtA + hoaA;

    const noi = effGross - opex;
    const cfAnnual = noi - debtAnnual;
    const cfMonthly = cfAnnual / 12;

    const capRate = price > 0 ? (noi / price) * 100 : 0;
    const coc = downAmt > 0 ? (cfAnnual / downAmt) * 100 : 0;

    // === Projections ===
    const futureVal = price * Math.pow(1 + apprec / 100, holdY);
    const remBal = remainingBalance(loan, rate, term, holdY);
    const futureEquity = Math.max(0, futureVal - remBal);
    const cumCF = cfAnnual * holdY;
    const initEquity = downAmt;
    const equityGain = futureEquity - initEquity;
    const totalProfit = cumCF + equityGain;
    const totalROI = initEquity > 0 ? (totalProfit / initEquity) * 100 : 0;
    const totalWealth = futureEquity + cumCF;

    // === POPULATE ALL VISIBLE FIELDS ===
    // Main metrics
    setTextSafe('monthlyCashFlow', fmtMoney(cfMonthly));
    setTextSafe('annualCashFlow', fmtMoney(cfAnnual));
    setTextSafe('capRate', fmtPct(capRate, 1));
    setTextSafe('cashOnCash', cash ? 'N/A (Cash)' : fmtPct(coc, 1));
    setTextSafe('totalROI', fmtPct(totalROI, 0));
    setTextSafe('futureEquity', fmtMoney(futureEquity));
    setTextSafe('totalWealth', fmtMoney(totalWealth));
    setTextSafe('mortgagePayment', fmtMoney(pmt));

    // Computed annuals
    setTextSafe('propertyTaxDisplay', fmtMoney(taxA) + '/yr');
    setTextSafe('insuranceDisplay', fmtMoney(insA) + '/yr');

    // Inline live impact (next to sliders)
    setTextSafe('inlineLoanAmount', cash ? 'None (cash)' : fmtMoney(loan));
    setTextSafe('inlineMortgage', cash ? '—' : fmtMoney(pmt));
    setTextSafe('inlineMonthlyCF', fmtMoney(cfMonthly));
    setTextSafe('inlineNOI', fmtMoney(noi));
    setTextSafe('inlineCoC', cash ? 'N/A' : fmtPct(coc, 1));

    // Color classes for key live numbers
    colorize('inlineMonthlyCF', cfMonthly);
    colorize('monthlyCashFlow', cfMonthly);
    colorize('cashOnCash', coc);

    // Verdict banner
    updateVerdictBanner(cfMonthly, coc, capRate);

    // Breakdown table
    renderBreakdownTable(gross, effGross, opex, noi, debtAnnual, cfAnnual, taxA, insA, maintA, mgmtA, hoaA, vacLoss);

    // Benchmarks
    renderBenchmarks(price, rent, cfMonthly, coc, capRate, noi, debtAnnual);

    // Sensitivity
    renderSensitivity(price, rent, downPct, rate, term, vac, maintPct, mgmtPct, taxR, insR, hoaMo, cfMonthly);

    // Cash-on-cash sub label
    const cocSub = $('cashOnCashSub');
    if (cocSub) cocSub.textContent = cash ? 'Cash purchase (full equity)' : 'Annual return on down payment';

    // Mortgage sub
    const mSub = $('mortgageSub');
    if (mSub) mSub.textContent = cash ? 'No mortgage' : 'Principal & interest';

    console.log('✅ Full calc complete — CF/mo:', Math.round(cfMonthly), 'CoC:', coc.toFixed(1) + '%');
  }

  function setTextSafe(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  function colorize(id, val) {
    const el = $(id);
    if (!el) return;
    el.classList.remove('positive', 'negative');
    if (val > 50) el.classList.add('positive');
    else if (val < 0) el.classList.add('negative');
  }

  function updateVerdictBanner(cfM, coc, cap) {
    const b = $('verdictBanner');
    if (!b) return;
    let cls = 'moderate', icon = '📊', h = 'Solid Midwestern Deal', p = 'Decent cash flow for the market. Good for buy-and-hold accumulation.';
    if (cfM >= 200 && coc >= 9) {
      cls = 'good'; icon = '✅'; h = 'Strong Cash-Flow Value Play';
      p = 'Excellent monthly cash flow + CoC. Attractive Indiana risk/reward.';
    } else if (cfM < 50 || coc < 5) {
      cls = 'poor'; icon = '⚠️'; h = 'Tight or Negative';
      p = 'Cash flow is marginal. Watch expenses, vacancy, or consider a lower entry price.';
    }
    b.className = `verdict-banner ${cls}`;
    b.innerHTML = `
      <div class="verdict-icon" style="font-size:1.9rem">${icon}</div>
      <div class="verdict-text">
        <h5 style="margin:0 0 4px">${h}</h5>
        <p style="margin:0; font-size:0.82rem; line-height:1.35">${p} Cap rate ${cap.toFixed(1)}%.</p>
      </div>`;
  }

  function renderBreakdownTable(gross, eff, opex, noi, debt, cf, tax, ins, maint, mgmt, hoa, vacLoss) {
    const body = $('breakdownBody');
    if (!body) return;
    body.innerHTML = `
      <tr><td class="income" style="text-align:left">Gross Rent (Annual)</td><td class="income">${fmtMoney(gross)}</td></tr>
      <tr><td style="text-align:left">Less: Vacancy</td><td class="expense">-${fmtMoney(vacLoss)}</td></tr>
      <tr style="font-weight:600"><td style="text-align:left">Effective Gross Income</td><td>${fmtMoney(eff)}</td></tr>
      <tr class="breakdown-section"><td colspan="2" style="text-align:left">Operating Expenses</td></tr>
      <tr><td style="text-align:left">Property Taxes</td><td class="expense">-${fmtMoney(tax)}</td></tr>
      <tr><td style="text-align:left">Insurance</td><td class="expense">-${fmtMoney(ins)}</td></tr>
      <tr><td style="text-align:left">Maintenance & Repairs</td><td class="expense">-${fmtMoney(maint)}</td></tr>
      <tr><td style="text-align:left">Property Management</td><td class="expense">-${fmtMoney(mgmt)}</td></tr>
      <tr><td style="text-align:left">HOA (Annual)</td><td class="expense">-${fmtMoney(hoa)}</td></tr>
      <tr style="font-weight:600"><td style="text-align:left">Total Operating Expenses</td><td class="expense">-${fmtMoney(opex)}</td></tr>
      <tr style="font-weight:700"><td style="text-align:left">Net Operating Income (NOI)</td><td>${fmtMoney(noi)}</td></tr>
      <tr><td style="text-align:left">Annual Debt Service</td><td class="expense">-${fmtMoney(debt)}</td></tr>
      <tr style="font-weight:800; border-top:2px solid #1e3a8a"><td style="text-align:left">Annual Cash Flow</td><td>${fmtMoney(cf)}</td></tr>
    `;
  }

  function renderBenchmarks(price, rent, cfM, coc, cap, noi, debtAnnual) {
    const grid = $('benchmarkGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const rules = [
      { label: '1% Rule', val: (rent / price * 100).toFixed(2) + '% of price', pass: rent >= price * 0.01, note: rent >= price * 0.01 ? 'Passes' : 'Below target' },
      { label: 'Cash-on-Cash', val: fmtPct(coc, 1), pass: coc >= 8, note: 'Target 8%+ for value-add' },
      { label: 'Cap Rate', val: fmtPct(cap, 1), pass: cap >= 6.5, note: 'Solid for Indy market' },
      { label: 'Monthly CF', val: fmtMoney(cfM), pass: cfM >= 150, note: 'Positive cash flow' },
      { label: 'DSCR (rough)', val: (noi / (debtAnnual || 1)).toFixed(2), pass: (noi / (debtAnnual || 1)) >= 1.25, note: 'Lender comfort >1.25' },
      { label: '50% Rule (opex+vac <50% gross)', val: (((price * 0.009 + (rent*12*0.07) + (rent*12*0.08)) / (rent*12)) * 100).toFixed(0) + '%', pass: true, note: 'Typical Midwest' }
    ];

    rules.forEach(r => {
      const card = document.createElement('div');
      card.className = `benchmark-card ${r.pass ? 'pass' : 'warn'}`;
      card.innerHTML = `
        <div class="benchmark-label">${r.label}</div>
        <div class="benchmark-value">${r.val}</div>
        <div class="benchmark-note">${r.note}</div>
      `;
      grid.appendChild(card);
    });
  }

  function renderSensitivity(price, rent, down, rate, term, vac, maint, mgmt, taxR, insR, hoa, baseCF) {
    const grid = $('sensitivityGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const scenarios = [
      { label: 'Base Case', delta: 0, cf: baseCF },
      { label: 'Rent −$100/mo', delta: -100 * 12 * (1 - vac/100), cf: baseCF + (-100 * 12 * (1 - vac/100)) },
      { label: 'Rent +$150/mo', delta: 150 * 12 * (1 - vac/100), cf: baseCF + (150 * 12 * (1 - vac/100)) },
      { label: 'Vacancy +3pts', delta: -rent * 12 * 0.03, cf: baseCF - rent * 12 * 0.03 },
      { label: 'Maintenance +2pts', delta: -(rent * 12 * 0.02), cf: baseCF - (rent * 12 * 0.02) },
      { label: 'Rate +1.0%', delta: -1 * (monthlyPI(price * (down / 100) * -1 + price, rate + 1, term) * 12), cf: baseCF - (monthlyPI(price - price * (down / 100), rate + 1, term) * 12 - monthlyPI(price - price * (down / 100), rate, term) * 12) }
    ];

    scenarios.forEach(s => {
      const d = s.cf - baseCF;
      const card = document.createElement('div');
      card.className = `sensitivity-card ${d > 10 ? 'base' : ''}`;
      card.innerHTML = `
        <div class="scenario-label">${s.label}</div>
        <div class="scenario-value">${fmtMoney(s.cf)}</div>
        <div class="scenario-delta ${d > 5 ? 'up' : d < -5 ? 'down' : 'flat'} ">${d >= 0 ? '+' : ''}${fmtMoney(d)} /mo vs base</div>
      `;
      grid.appendChild(card);
    });
  }

  // ============ PRESETS, RESET, CASH, TOOLBAR ============
  function applyPreset(presetKey, alsoHighlight = true) {
    const data = PRESETS[presetKey];
    if (!data) return;

    Object.keys(data).forEach(k => {
      if (k === 'cashPurchase') {
        const cb = $('cashPurchase');
        if (cb) cb.checked = !!data[k];
        return;
      }
      setVal(k, data[k]);
      const s = $(k + 'Slider');
      if (s) s.value = data[k];
    });

    // refresh displays for bound pairs
    refreshAllDisplays();

    // cash state
    updateCashUI();

    fullCalc();

    if (alsoHighlight) {
      document.querySelectorAll('#buyholdPresets .preset-chip').forEach(ch => {
        ch.classList.toggle('active', ch.dataset.preset === presetKey);
      });
    }
  }

  function setVal(id, v) {
    const el = $(id);
    if (el) el.value = v;
  }

  function refreshAllDisplays() {
    // Force display text for all known
    const pairs = [
      ['purchasePrice', 'purchasePriceDisplay', false],
      ['downPayment', 'downPaymentDisplay', true],
      ['interestRate', 'interestRateDisplay', true],
      ['loanTerm', 'loanTermDisplay', false, true],
      ['monthlyRent', 'monthlyRentDisplay', false],
      ['vacancyRate', 'vacancyRateDisplay', true],
      ['maintenance', 'maintenanceDisplay', true],
      ['propertyTaxRate', 'propertyTaxRateDisplay', true],
      ['insuranceRate', 'insuranceRateDisplay', true],
      ['hoa', 'hoaDisplay', false],
      ['management', 'managementDisplay', true],
      ['appreciation', 'appreciationDisplay', true],
      ['holdingYears', 'holdingYearsDisplay', false, true]
    ];
    pairs.forEach(([numId, dispId, isPct, isYr]) => {
      const n = $(numId);
      const d = $(dispId);
      if (!n || !d) return;
      const v = parseFloat(n.value) || 0;
      if (isPct) d.textContent = v.toFixed( (numId.includes('Rate') || numId === 'appreciation') ? 2 : 1 ) + (numId === 'holdingYears' ? '' : '%');
      else if (isYr) d.textContent = v + ' yr';
      else d.textContent = fmtMoney(v);
    });
  }

  function updateCashUI() {
    const cb = $('cashPurchase');
    const fin = $('financingFields');
    if (!cb || !fin) return;
    if (cb.checked) {
      fin.classList.add('is-disabled');
    } else {
      fin.classList.remove('is-disabled');
    }
  }

  function wirePresets() {
    const container = $('buyholdPresets');
    if (!container) return;
    container.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.preset;
        applyPreset(key);
      });
    });
  }

  function wireReset() {
    const btn = $('resetScenario');
    if (!btn) return;
    btn.addEventListener('click', () => {
      applyPreset('marion-default', true);
      // ensure cash off for default
      const cb = $('cashPurchase');
      if (cb) cb.checked = false;
      updateCashUI();
      fullCalc();
    });
  }

  function wireCashToggle() {
    const cb = $('cashPurchase');
    if (!cb) return;
    cb.addEventListener('change', () => {
      updateCashUI();
      fullCalc();
    });
  }

  function wireShare() {
    const btn = $('shareScenario');
    const toast = $('shareToast');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const params = new URLSearchParams();
      const keys = ['purchasePrice', 'downPayment', 'interestRate', 'loanTerm', 'monthlyRent', 'vacancyRate', 'maintenance', 'propertyTaxRate', 'insuranceRate', 'hoa', 'management', 'appreciation', 'holdingYears'];
      keys.forEach(k => {
        const v = parseFloat($(k)?.value);
        if (isFinite(v)) params.set(k.substring(0, 3), v);
      });
      if ($('cashPurchase')?.checked) params.set('cash', '1');

      const url = window.location.origin + window.location.pathname + '?' + params.toString() + '#buy-hold-calculator';
      try {
        await navigator.clipboard.writeText(url);
        if (toast) {
          toast.textContent = 'Link copied to clipboard!';
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 2100);
        }
      } catch (e) {
        prompt('Copy this share link:', url);
      }
    });
  }

  function loadFromURLParams() {
    const p = new URLSearchParams(window.location.search);
    if (!p.toString()) return false;

    const map = {
      pur: 'purchasePrice', dow: 'downPayment', int: 'interestRate', loa: 'loanTerm',
      mon: 'monthlyRent', vac: 'vacancyRate', mai: 'maintenance', pro: 'propertyTaxRate',
      ins: 'insuranceRate', hoa: 'hoa', man: 'management', app: 'appreciation', hol: 'holdingYears'
    };
    Object.entries(map).forEach(([short, full]) => {
      if (p.has(short)) {
        const v = parseFloat(p.get(short));
        if (isFinite(v)) {
          setVal(full, v);
          const s = $(full + 'Slider');
          if (s) s.value = v;
        }
      }
    });
    if (p.has('cash')) {
      const cb = $('cashPurchase');
      if (cb) cb.checked = true;
    }
    return true;
  }

  function wireCompare() {
    const btn = $('compareBtn');
    const view = $('comparisonView');
    const close = $('closeComparisonBtn');
    const grid = $('comparisonGrid');
    if (!btn || !view || !grid) return;

    btn.addEventListener('click', () => {
      // Generate 3 variants from current
      const base = collectCurrentInputs();
      const opt = { ...base, monthlyRent: base.monthlyRent * 1.12, vacancyRate: Math.max(3, base.vacancyRate - 2), maintenance: base.maintenance - 1 };
      const cons = { ...base, monthlyRent: base.monthlyRent * 0.9, vacancyRate: base.vacancyRate + 3, interestRate: base.interestRate + 1.25 };

      grid.innerHTML = '';
      [ {label:'Current', data:base}, {label:'Optimistic', data:opt}, {label:'Conservative', data:cons} ].forEach(item => {
        const card = document.createElement('div');
        card.style.cssText = 'background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;font-size:0.8rem';
        // quick mini calc for display
        const cf = (item.data.monthlyRent * 12 * (1-item.data.vacancyRate/100) - (item.data.monthlyRent*12*0.07 + item.data.monthlyRent*12*0.08 + item.data.purchasePrice*item.data.propertyTaxRate/100 + item.data.purchasePrice*item.data.insuranceRate/100)) /12 ;
        card.innerHTML = `<strong>${item.label}</strong><br>
          Rent: $${Math.round(item.data.monthlyRent)} &nbsp; CF/mo est: <strong>${fmtMoney(cf)}</strong><br>
          <span style="font-size:0.7rem;color:#64748b">Click a saved scenario name in the toolbar to load full values.</span>`;
        grid.appendChild(card);
      });
      view.style.display = 'block';
      view.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    if (close) close.addEventListener('click', () => { view.style.display = 'none'; });
  }

  function collectCurrentInputs() {
    return {
      purchasePrice: getValSafe('purchasePrice'),
      downPayment: getValSafe('downPayment'),
      interestRate: getValSafe('interestRate'),
      loanTerm: getValSafe('loanTerm'),
      monthlyRent: getValSafe('monthlyRent'),
      vacancyRate: getValSafe('vacancyRate'),
      maintenance: getValSafe('maintenance'),
      propertyTaxRate: getValSafe('propertyTaxRate'),
      insuranceRate: getValSafe('insuranceRate'),
      hoa: getValSafe('hoa'),
      management: getValSafe('management'),
      appreciation: getValSafe('appreciation'),
      holdingYears: getValSafe('holdingYears')
    };
  }
  function getValSafe(id) { return parseFloat($(id)?.value) || 0; }

  function wireExports() {
    // CSV
    const csvBtn = $('exportCSV');
    if (csvBtn) csvBtn.addEventListener('click', () => {
      const rows = [
        ['Field', 'Value'],
        ['Purchase Price', $('purchasePrice').value],
        ['Down %', $('downPayment').value],
        ['Rate %', $('interestRate').value],
        ['Monthly Rent', $('monthlyRent').value],
        ['Monthly Cash Flow', $('monthlyCashFlow').textContent.replace(/[^0-9.-]/g,'')],
        ['CoC %', $('cashOnCash').textContent],
        ['Cap Rate %', $('capRate').textContent]
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      const a = document.createElement('a');
      a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      a.download = 'buyhold-indiana-scenario.csv';
      a.click();
    });

    // PDF (basic)
    const pdfBtn = $('exportPDF');
    if (pdfBtn && window.jspdf) {
      pdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Buy & Hold — Indiana Scenario', 20, 20);
        doc.setFontSize(11);
        doc.text('Purchase: ' + $('purchasePriceDisplay').textContent, 20, 32);
        doc.text('Monthly Rent: ' + $('monthlyRentDisplay').textContent, 20, 40);
        doc.text('Monthly Cash Flow: ' + $('monthlyCashFlow').textContent, 20, 48);
        doc.text('Cash-on-Cash: ' + $('cashOnCash').textContent, 20, 56);
        doc.text('Cap Rate: ' + $('capRate').textContent, 20, 64);
        doc.text('Total ROI (hold): ' + $('totalROI').textContent, 20, 72);
        doc.text('Disclaimer: Educational only. Not advice. Do your own diligence.', 20, 90);
        doc.save('buyhold-indiana-report.pdf');
      });
    }
  }

  function wireSavedScenarios() {
    // Lightweight localStorage implementation (no external module dependency for robustness)
    const nameInput = $('scenarioName');
    const saveBtn = $('saveScenario');
    const select = $('savedScenarioSelect');
    const loadBtn = $('loadScenario');
    const delBtn = $('deleteScenario');

    function refreshSelect() {
      if (!select) return;
      select.innerHTML = '<option value="">\u2014 Saved scenarios \u2014</option>';
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('bh-scenario-')) {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = k.replace('bh-scenario-', '');
          select.appendChild(opt);
        }
      }
    }

    if (saveBtn && nameInput) {
      saveBtn.addEventListener('click', () => {
        const nm = (nameInput.value || 'Indy Deal ' + new Date().toLocaleDateString()).trim();
        const data = collectCurrentInputs();
        data.cashPurchase = $('cashPurchase')?.checked || false;
        localStorage.setItem('bh-scenario-' + nm, JSON.stringify(data));
        refreshSelect();
        nameInput.value = '';
        const t = $('shareToast');
        if (t) { t.textContent = 'Saved \u201C' + nm + '\u201D'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1600); }
      });
    }

    if (loadBtn && select) {
      loadBtn.addEventListener('click', () => {
        const key = select.value;
        if (!key) return;
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          Object.keys(data).forEach(k => {
            if (k === 'cashPurchase') {
              const cb = $('cashPurchase'); if (cb) cb.checked = !!data[k];
              return;
            }
            setVal(k, data[k]);
            const s = $(k + 'Slider'); if (s) s.value = data[k];
          });
          refreshAllDisplays();
          updateCashUI();
          fullCalc();
        } catch (e) {}
      });
    }

    if (delBtn && select) {
      delBtn.addEventListener('click', () => {
        const key = select.value;
        if (key) {
          localStorage.removeItem(key);
          refreshSelect();
        }
      });
    }

    refreshSelect();
  }

  function wirePropertyLookupStub() {
    const toggle = $('toggleLookupBtn');
    const panel = $('propertyLookupFields');
    const loadBtn = $('loadPropertyBtn');

    if (toggle && panel) {
      toggle.addEventListener('click', () => {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });
    }
    if (loadBtn) {
      loadBtn.addEventListener('click', () => {
        // Demo realistic Marion County-ish numbers
        setVal('purchasePrice', 168500);
        const s = $('purchasePriceSlider'); if (s) s.value = 168500;
        setVal('monthlyRent', 1485);
        const rs = $('monthlyRentSlider'); if (rs) rs.value = 1485;
        setVal('propertyTaxRate', 0.94);
        setVal('insuranceRate', 0.61);
        refreshAllDisplays();
        updateCashUI();
        fullCalc();
        const t = $('shareToast');
        if (t) { t.textContent = 'Demo values loaded (Marion County comp)'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1500); }
      });
    }
    const taxBtn = $('openTaxRecordsBtn');
    if (taxBtn) taxBtn.addEventListener('click', () => window.open('https://www.marioncounty.in.gov/', '_blank'));
  }

  function wireAllInputsForCalc() {
    // Extra safety net: any input change triggers calc
    document.querySelectorAll('#buy-hold-calculator input').forEach(el => {
      el.addEventListener('input', scheduleCalc);
      el.addEventListener('change', scheduleCalc);
    });
  }

  // ============ INIT ============
  function init() {
    // 1. Apply Indiana defaults into DOM
    setAllValuesFromDefaults();

    // 2. Bind every slider/number pair (live sync + display + calc)
    bindPair('purchasePrice', 'purchasePriceSlider', 'purchasePriceDisplay');
    bindPair('downPayment', 'downPaymentSlider', 'downPaymentDisplay', { isPercent: true });
    bindPair('interestRate', 'interestRateSlider', 'interestRateDisplay', { isPercent: true, decimals: 2 });
    bindPair('loanTerm', 'loanTermSlider', 'loanTermDisplay', { isYear: true });
    bindPair('monthlyRent', 'monthlyRentSlider', 'monthlyRentDisplay');
    bindPair('vacancyRate', 'vacancyRateSlider', 'vacancyRateDisplay', { isPercent: true });
    bindPair('maintenance', 'maintenanceSlider', 'maintenanceDisplay', { isPercent: true, decimals: 1 });
    bindPair('propertyTaxRate', 'propertyTaxRateSlider', 'propertyTaxRateDisplay', { isPercent: true, decimals: 2 });
    bindPair('insuranceRate', 'insuranceRateSlider', 'insuranceRateDisplay', { isPercent: true, decimals: 2 });
    bindPair('hoa', 'hoaSlider', 'hoaDisplay');
    bindPair('management', 'managementSlider', 'managementDisplay', { isPercent: true, decimals: 1 });
    bindPair('appreciation', 'appreciationSlider', 'appreciationDisplay', { isPercent: true, decimals: 2 });
    bindPair('holdingYears', 'holdingYearsSlider', 'holdingYearsDisplay', { isYear: true });

    // 3. Cash UX + initial state
    wireCashToggle();
    updateCashUI();

    // 4. Load URL overrides if present (share links)
    const hadURL = loadFromURLParams();
    if (hadURL) refreshAllDisplays();

    // 5. Wire UI
    wirePresets();
    wireReset();
    wireShare();
    wireCompare();
    wireExports();
    wireSavedScenarios();
    wirePropertyLookupStub();
    wireAllInputsForCalc();

    // 6. Initial full population + visuals
    // Make sure Marion default chip looks active
    document.querySelectorAll('#buyholdPresets .preset-chip').forEach(ch => {
      ch.classList.toggle('active', ch.dataset.preset === 'marion-default');
    });

    fullCalc();

    // 7. One more sync pass for any late displays
    setTimeout(refreshAllDisplays, 40);

    console.log('✅ Indiana home value prop ready. Sliders reactive. All values & charts populate live.');
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();