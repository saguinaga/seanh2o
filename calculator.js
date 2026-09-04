console.log("\uD83D\uDD25 FIXED INDIANA DEFAULTS + FULL LIVE CALC LOADED - " + new Date().toISOString());

(function () {
  'use strict';

  function trackEvent(name) {
    if (window.plausible) window.plausible(name);
  }

  // ============ INDIANA MARION COUNTY DEFAULT VALUE PROP HOME ============
  // Realistic value-add / strong turnkey 3-bed in Marion County / Indy metro.
  // Attractive but believable: positive cash flow, solid CoC for Midwest, low taxes/ins.
  const DEFAULTS = {
    purchasePrice: 179000,
    downPayment: 25,
    interestRate: 7.375,
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

  function principalFromPmt(pmt, annualRatePct, years, interestOnly) {
    if (pmt <= 0 || years <= 0) return 0;
    const r = annualRatePct / 100 / 12;
    if (interestOnly) {
      if (r === 0) return 0;
      return pmt / r;
    }
    const n = years * 12;
    if (r === 0) return pmt * n;
    return pmt * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
  }

  const DSCR_PRESET = { downPayment: 25, interestRate: 7.375 };
  const CONV_PRESET = { downPayment: 20, interestRate: 6.75 };
  let loanType = 'dscr';
  let dscrTarget = 1.25;
  let convSnapshot = null;

  function remainingBalance(principal, annualRatePct, totalYears, yearsElapsed) {
    if (principal <= 0) return 0;
    const r = annualRatePct / 100 / 12;
    const n = totalYears * 12;
    const p = Math.min(yearsElapsed * 12, n);
    if (p >= n || r === 0) return 0;
    const factor = Math.pow(1 + r, n);
    return principal * (factor - Math.pow(1 + r, p)) / (factor - 1);
  }

  // ============ SCENARIO MODEL + CONFIG (Phase 1 - more aggressive but safe) ============
  // Extends the inert skeleton. Active scenario holds config + inputs.
  // getEffectiveInputs applies overrides (per user specs) but NEVER modifies fullCalc or core.
  // Config changes update DOM values + scheduleCalc (existing live system).
  // Existing mode: down/loan hidden, current fields used (focus future CF).
  // Viewports protected via previous fixes + Tailwind on modal.

  const SCENARIO_DEFAULT_CONFIG = {
    propertyCategory: 'single-family',
    rentalStrategy: 'long-term',
    analysisType: 'new-purchase',
    isIndianaFocus: true
  };

  let activeScenario = {
    id: 'current',
    name: 'Current',
    config: { ...SCENARIO_DEFAULT_CONFIG },
    inputs: { ...DEFAULTS }
  };

  let comparisonScenarios = [];

  function getEffectiveInputs(scenario) {
    const eff = { ...scenario.inputs };
    const cfg = scenario.config;

    // Strategy overrides (input adjustments only, user can still slider-override)
    if (cfg.rentalStrategy === 'short-term') {
      eff.vacancyRate = Math.max(eff.vacancyRate, 12);
      eff.maintenance = Math.max(eff.maintenance, 8);
      eff.insuranceRate = Math.max(eff.insuranceRate, 0.65);
      // rent significantly higher - caller sets via apply
    } else if (cfg.rentalStrategy === 'padsplit') {
      eff.vacancyRate = Math.max(eff.vacancyRate, 10);
      eff.maintenance = Math.max(eff.maintenance, 9);
      // higher effective income - handled in apply
    }

    // Analysis Type: Existing focuses future cash flows from current position
    if (cfg.analysisType === 'existing-investment') {
      eff.downPayment = 0;
      // loan/interest will use current fields below
    }

    // Indiana Focus bias (rates only, as specified)
    if (cfg.isIndianaFocus) {
      eff.propertyTaxRate = 0.92;
      eff.insuranceRate = 0.58;
    }

    return eff;
  }

  function computeKeyMetrics(inputs) {
    // Pure helper (duplicates only the math from fullCalc for comparison cards; keeps core untouched)
    const price = inputs.purchasePrice || DEFAULTS.purchasePrice;
    const downPct = inputs.downPayment || DEFAULTS.downPayment;
    const rate = inputs.interestRate || DEFAULTS.interestRate;
    const term = inputs.loanTerm || DEFAULTS.loanTerm;
    const rent = inputs.monthlyRent || DEFAULTS.monthlyRent;
    const vac = inputs.vacancyRate || DEFAULTS.vacancyRate;
    const maintPct = inputs.maintenance || DEFAULTS.maintenance;
    const taxR = inputs.propertyTaxRate || DEFAULTS.propertyTaxRate;
    const insR = inputs.insuranceRate || DEFAULTS.insuranceRate;
    const hoaMo = inputs.hoa || DEFAULTS.hoa;
    const mgmtPct = inputs.management || DEFAULTS.management;
    const apprec = inputs.appreciation || DEFAULTS.appreciation;
    const holdY = inputs.holdingYears || DEFAULTS.holdingYears;
    const cash = inputs.cashPurchase || false;
    const io = !cash && inputs.loanType === 'dscr' && !!inputs.dscrInterestOnly;

    const downAmt = cash ? price : price * (downPct / 100);
    const loan = Math.max(0, price - downAmt);
    const pmt = cash ? 0 : (io ? loan * (rate / 100 / 12) : monthlyPI(loan, rate, term));
    const debtAnnual = pmt * 12;
    const pitia = pmt + (price * (taxR / 100) / 12) + (price * (insR / 100) / 12) + hoaMo;
    const lenderDscr = cash || pitia <= 0 ? 0 : rent / pitia;

    const gross = rent * 12;
    const vacLoss = gross * (vac / 100);
    const effGross = gross - vacLoss;

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

    const futureVal = price * Math.pow(1 + apprec / 100, holdY);
    const remBal = io ? loan : remainingBalance(loan, rate, term, holdY);
    const futureEquity = Math.max(0, futureVal - remBal);
    const cumCF = cfAnnual * holdY;
    const initEquity = downAmt;
    const equityGain = futureEquity - initEquity;
    const totalProfit = cumCF + equityGain;
    const totalROI = initEquity > 0 ? (totalProfit / initEquity) * 100 : 0;
    const totalWealth = futureEquity + cumCF;

    return {
      monthlyCF: cfMonthly,
      annualCF: cfAnnual,
      capRate,
      coc,
      totalROI,
      futureEquity,
      totalWealth,
      mortgage: pmt,
      noi,
      lenderDscr
    };
  }

  function applyConfigToDOM() {
    const cfg = activeScenario.config;
    const eff = getEffectiveInputs(activeScenario);

    // Update strategy-driven values (examples; full in future)
    if (cfg.rentalStrategy === 'short-term') {
      setVal('monthlyRent', Math.round(activeScenario.inputs.monthlyRent * 1.4)); // significantly higher
      setVal('vacancyRate', eff.vacancyRate);
      setVal('maintenance', eff.maintenance);
      setVal('insuranceRate', eff.insuranceRate);
    } else if (cfg.rentalStrategy === 'padsplit') {
      setVal('monthlyRent', Math.round(activeScenario.inputs.monthlyRent * 1.6)); // room-by-room higher income
      setVal('vacancyRate', eff.vacancyRate);
      setVal('maintenance', eff.maintenance);
    } else {
      // long-term: restore baseline-ish
      setVal('monthlyRent', activeScenario.inputs.monthlyRent);
      setVal('vacancyRate', activeScenario.inputs.vacancyRate || DEFAULTS.vacancyRate);
      setVal('maintenance', activeScenario.inputs.maintenance || DEFAULTS.maintenance);
      setVal('insuranceRate', activeScenario.inputs.insuranceRate || DEFAULTS.insuranceRate);
    }

    // Existing mode UI + fields
    const fin = $('financingFields');
    const exist = $('existingFields');
    if (cfg.analysisType === 'existing-investment') {
      if (fin) fin.classList.add('is-disabled'); // reuse existing disabled style
      if (exist) exist.classList.remove('hidden');
      // set current fields from inputs (or defaults)
      setVal('currentEquity', activeScenario.inputs.currentEquity || (activeScenario.inputs.purchasePrice * 0.3));
      setVal('currentLoanBalance', activeScenario.inputs.currentLoanBalance || (activeScenario.inputs.purchasePrice * 0.5));
      // down/loan effectively 0 for calc
      setVal('downPayment', 0);
    } else {
      if (fin) fin.classList.remove('is-disabled');
      if (exist) exist.classList.add('hidden');
    }

    // Indiana rates already in eff, but ensure display
    if (cfg.isIndianaFocus) {
      setVal('propertyTaxRate', eff.propertyTaxRate);
      setVal('insuranceRate', eff.insuranceRate);
    }

    refreshAllDisplays();
    updateCashUI();
    scheduleCalc();
  }

  // ============ MODAL WIRING (config button + live apply) ============
  function setupAnalysisConfigModal() {
    const btn = $('configureAnalysis');
    const modal = $('analysisConfigModal');
    if (!btn || !modal) return;

    const closeBtn = $('closeConfigModal');
    const resetBtn = $('resetConfigModal');
    const applyBtn = $('applyConfigModal');
    const indyToggle = $('indianaFocusToggle');

    function show() { modal.style.display = 'flex'; syncModalFromConfig(); }
    function hide() { modal.style.display = 'none'; }

    btn.addEventListener('click', () => {
      trackEvent('BuyHold - Configure Analysis');
      show();
    });
    if (closeBtn) closeBtn.addEventListener('click', hide);
    if (applyBtn) applyBtn.addEventListener('click', () => { trackEvent('BuyHold - Apply Config'); applyConfigToDOM(); hide(); });

    // Toggle buttons
    modal.querySelectorAll('.config-toggle').forEach(tog => {
      tog.addEventListener('click', () => {
        const cfgKey = tog.dataset.config;
        const val = tog.dataset.value;
        activeScenario.config[cfgKey] = val;
        syncModalFromConfig();
        applyConfigToDOM(); // live
      });
    });

    if (indyToggle) {
      indyToggle.addEventListener('change', () => {
        activeScenario.config.isIndianaFocus = indyToggle.checked;
        applyConfigToDOM();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        activeScenario.config = { ...SCENARIO_DEFAULT_CONFIG };
        // reset inputs to DEFAULTS too
        Object.assign(activeScenario.inputs, DEFAULTS);
        syncModalFromConfig();
        applyConfigToDOM();
      });
    }

    // initial sync
    function syncModalFromConfig() {
      const cfg = activeScenario.config;
      modal.querySelectorAll('.config-toggle').forEach(tog => {
        const active = tog.dataset.config === 'propertyCategory' ? cfg.propertyCategory === tog.dataset.value :
                       tog.dataset.config === 'rentalStrategy' ? cfg.rentalStrategy === tog.dataset.value :
                       cfg.analysisType === tog.dataset.value;
        tog.classList.toggle('active', active);
        tog.classList.toggle('border-[#1e3a8a]', active);
        tog.classList.toggle('bg-[#1e3a8a]', active);
        tog.classList.toggle('text-white', active);
        tog.classList.toggle('border-[#cbd5e1]', !active);
      });
      if (indyToggle) indyToggle.checked = cfg.isIndianaFocus;
    }

    // expose for future
    window.__syncConfigModal = syncModalFromConfig;
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
    const io = !cash && loanType === 'dscr' && !!$('dscrInterestOnly')?.checked;

    // Financing
    const downAmt = cash ? price : price * (downPct / 100);
    const loan = Math.max(0, price - downAmt);
    const pmt = cash ? 0 : (io ? loan * (rate / 100 / 12) : monthlyPI(loan, rate, term));
    const debtAnnual = pmt * 12;
    const pitia = pmt + (taxR / 100 * price) / 12 + (insR / 100 * price) / 12 + hoaMo;
    const lenderDscr = cash || pitia <= 0 ? 0 : rent / pitia;


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
    const noiDscr = cash || debtAnnual <= 0 ? 0 : noi / debtAnnual;

    const capRate = price > 0 ? (noi / price) * 100 : 0;
    const coc = downAmt > 0 ? (cfAnnual / downAmt) * 100 : 0;

    // === Projections ===
    const futureVal = price * Math.pow(1 + apprec / 100, holdY);
    const remBal = io ? loan : remainingBalance(loan, rate, term, holdY);
    const futureEquity = Math.max(0, futureVal - remBal);
    const cumCF = cfAnnual * holdY;
    const initEquity = downAmt;
    const equityGain = futureEquity - initEquity;
    const totalProfit = cumCF + equityGain;
    const totalROI = initEquity > 0 ? (totalProfit / initEquity) * 100 : 0;
    const totalWealth = futureEquity + cumCF;

    const tiaMo = (taxA + insA) / 12 + hoaMo;
    const maxPitia = rent / dscrTarget;
    const maxPi = maxPitia - tiaMo;
    const maxLoan = cash || maxPi <= 0 ? 0 : principalFromPmt(maxPi, rate, term, io);

    // === POPULATE ALL VISIBLE FIELDS ===
    setTextSafe('monthlyCashFlow', fmtMoney(cfMonthly));
    setTextSafe('annualCashFlow', fmtMoney(cfAnnual));
    setTextSafe('capRate', fmtPct(capRate, 1));
    setTextSafe('cashOnCash', cash ? 'N/A (Cash)' : fmtPct(coc, 1));
    setTextSafe('totalROI', fmtPct(totalROI, 0));
    setTextSafe('futureEquity', fmtMoney(futureEquity));
    setTextSafe('totalWealth', fmtMoney(totalWealth));
    setTextSafe('mortgagePayment', fmtMoney(pmt));
    setTextSafe('dscrValue', cash ? 'N/A' : lenderDscr.toFixed(2));
    setTextSafe('dscrSub', cash ? 'No debt' : 'Rent / PITIA · target ' + dscrTarget.toFixed(2));
    setTextSafe('inlineDscr', cash ? 'N/A' : lenderDscr.toFixed(2));

    setTextSafe('propertyTaxDisplay', fmtMoney(taxA) + '/yr');
    setTextSafe('insuranceDisplay', fmtMoney(insA) + '/yr');

    setTextSafe('inlineLoanAmount', cash ? 'None (cash)' : fmtMoney(loan));
    setTextSafe('inlineMortgage', cash ? '-' : fmtMoney(pmt));
    setTextSafe('inlineMonthlyCF', fmtMoney(cfMonthly));
    setTextSafe('inlineNOI', fmtMoney(noi));
    setTextSafe('inlineCoC', cash ? 'N/A' : fmtPct(coc, 1));

    colorize('inlineMonthlyCF', cfMonthly);
    colorize('monthlyCashFlow', cfMonthly);
    colorize('cashOnCash', coc);
    colorizeDscr('inlineDscr', lenderDscr, cash);
    colorizeDscr('dscrValue', lenderDscr, cash);

    updateDscrStatus({ cash, lenderDscr, pitia, loan, maxLoan, io, rent });
    updateVerdictBanner(cfMonthly, coc, capRate, { cash, loanType, lenderDscr });

    renderBreakdownTable(gross, effGross, opex, noi, debtAnnual, cfAnnual, taxA, insA, maintA, mgmtA, hoaA, vacLoss);

    renderBenchmarks(price, rent, cfMonthly, coc, capRate, noi, debtAnnual, lenderDscr, noiDscr, cash);

    renderSensitivity(price, rent, downPct, rate, term, vac, maintPct, mgmtPct, taxR, insR, hoaMo, cfMonthly);

    const cocSub = $('cashOnCashSub');
    if (cocSub) cocSub.textContent = cash ? 'Cash purchase (full equity)' : 'Annual return on down payment';

    const mSub = $('mortgageSub');
    if (mSub) {
      if (cash) mSub.textContent = 'No mortgage';
      else if (io) mSub.textContent = 'Interest only · PITIA ' + fmtMoney(pitia) + '/mo';
      else mSub.textContent = 'P&I · PITIA ' + fmtMoney(pitia) + '/mo';
    }

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

  function colorizeDscr(id, ratio, cash) {
    const el = $(id);
    if (!el) return;
    el.classList.remove('positive', 'negative');
    if (cash) return;
    if (ratio >= dscrTarget) el.classList.add('positive');
    else if (ratio < 1) el.classList.add('negative');
  }

  function updateDscrStatus(d) {
    const el = $('dscrStatus');
    if (!el) return;
    if (d.cash || loanType !== 'dscr') {
      el.textContent = '';
      el.className = 'dscr-status';
      return;
    }
    const ratio = d.lenderDscr;
    let cls = 'fail';
    let msg;
    if (ratio >= dscrTarget) {
      cls = 'pass';
      msg = 'Lender DSCR ' + ratio.toFixed(2) + ' vs target ' + dscrTarget.toFixed(2) + '. This rent covers PITIA of ' + fmtMoney(d.pitia) + '/mo.';
      if (d.maxLoan > 0) msg += ' At this rent and rate, about ' + fmtMoney(d.maxLoan) + ' of loan still clears ' + dscrTarget.toFixed(2) + '.';
    } else if (ratio >= 1) {
      cls = 'warn';
      msg = 'Lender DSCR ' + ratio.toFixed(2) + '. Clears 1.00, short of 1.25. Some programs will do 1.00 at a higher rate. More down, lower price, or interest-only can lift coverage.';
    } else {
      msg = 'Lender DSCR ' + ratio.toFixed(2) + '. Rent does not cover PITIA (' + fmtMoney(d.pitia) + '/mo). Raise rent, put more down, cut price, or try interest-only.';
    }
    if (d.io) msg += ' Interest-only: principal does not pay down during the IO period.';
    el.className = 'dscr-status ' + cls;
    el.textContent = msg;
  }

  function updateVerdictBanner(cfM, coc, cap, extra) {
    const b = $('verdictBanner');
    if (!b) return;
    extra = extra || {};
    let cls = 'moderate', icon = '📊', h = 'Solid Midwestern Deal', p = 'Decent cash flow for the market. Good for buy-and-hold accumulation.';
    if (extra.loanType === 'dscr' && !extra.cash) {
      const r = extra.lenderDscr || 0;
      if (r >= 1.25 && cfM >= 0) {
        cls = 'good'; icon = '✅'; h = 'DSCR covers at 1.25';
        p = 'Rent covers PITIA at the common DSCR cutoff. Cash flow after vacancy and management is the investor test, not the lender test.';
      } else if (r >= 1 && cfM >= 0) {
        cls = 'moderate'; icon = '📊'; h = 'DSCR between 1.00 and 1.25';
        p = 'Some DSCR programs accept 1.00. 1.25 usually prices better. Cash flow still has to work after vacancy and ops.';
      } else if (r < 1) {
        cls = 'poor'; icon = '⚠️'; h = 'DSCR below 1.00';
        p = 'This rent does not cover PITIA. A DSCR lender will not like this structure without more down, a lower price, or more rent.';
      } else {
        cls = 'poor'; icon = '⚠️'; h = 'Qualifies, cash flow is tight';
        p = 'Coverage can pass while the property still loses money after vacancy and management. Run both tests.';
      }
    } else if (cfM >= 200 && coc >= 9) {
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

  function renderBenchmarks(price, rent, cfM, coc, cap, noi, debtAnnual, lenderDscr, noiDscr, cash) {
    const grid = $('benchmarkGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const lenderVal = cash ? 'N/A' : (lenderDscr || 0).toFixed(2);
    const noiVal = cash || !debtAnnual ? 'N/A' : (noiDscr || (noi / (debtAnnual || 1))).toFixed(2);

    const rules = [
      { label: '1% Rule', val: (rent / price * 100).toFixed(2) + '% of price', pass: rent >= price * 0.01, note: rent >= price * 0.01 ? 'Passes' : 'Below target' },
      { label: 'Cash-on-Cash', val: fmtPct(coc, 1), pass: coc >= 8, note: 'Target 8%+ for value-add' },
      { label: 'Cap Rate', val: fmtPct(cap, 1), pass: cap >= 6.5, note: 'Solid for Indy market' },
      { label: 'Monthly CF', val: fmtMoney(cfM), pass: cfM >= 150, note: 'Positive cash flow' },
      { label: 'Lender DSCR', val: lenderVal, pass: cash || (lenderDscr || 0) >= 1.25, note: 'Rent / PITIA. Common cutoff 1.25' },
      { label: 'NOI / debt service', val: noiVal, pass: cash || (noiDscr || 0) >= 1.25, note: 'Investor coverage after ops' }
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
    const row = $('loanTypeRow');
    if (!cb || !fin) return;
    if (cb.checked) {
      fin.classList.add('is-disabled');
      if (row) row.style.opacity = '0.45';
    } else {
      fin.classList.remove('is-disabled');
      if (row) row.style.opacity = '1';
    }
    syncLoanTypeUI();
  }

  function snapshotConv() {
    convSnapshot = {
      downPayment: parseFloat($('downPayment')?.value) || DEFAULTS.downPayment,
      interestRate: parseFloat($('interestRate')?.value) || DEFAULTS.interestRate
    };
  }

  function applyFinancingPreset(preset) {
    setVal('downPayment', preset.downPayment);
    setVal('interestRate', preset.interestRate);
    const ds = $('downPaymentSlider');
    const is = $('interestRateSlider');
    if (ds) ds.value = preset.downPayment;
    if (is) is.value = preset.interestRate;
    refreshAllDisplays();
  }

  function setLoanType(next, applyPresetRates) {
    if (next === 'dscr') {
      const cb = $('cashPurchase');
      if (cb && cb.checked) {
        cb.checked = false;
        updateCashUI();
      }
    }
    if (applyPresetRates && next !== loanType) {
      if (loanType === 'conventional') snapshotConv();
      if (next === 'dscr') applyFinancingPreset(DSCR_PRESET);
      if (next === 'conventional') applyFinancingPreset(convSnapshot || CONV_PRESET);
    }
    loanType = next;
    syncLoanTypeUI();
    fullCalc();
  }

  function syncLoanTypeUI() {
    const cash = $('cashPurchase')?.checked;
    document.querySelectorAll('.loan-type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.loanType === loanType);
    });
    const panel = $('dscrPanel');
    if (panel) panel.hidden = cash || loanType !== 'dscr';
    const hint = $('loanTypeHint');
    if (hint) {
      if (cash) hint.textContent = 'Cash purchase. No PITIA test.';
      else if (loanType === 'dscr') hint.textContent = 'DSCR qualifies on rent vs PITIA. Rate is usually higher. 20-25% down is typical.';
      else hint.textContent = 'P&I on a 30-year amortizing loan. Qualify on your income and DTI.';
    }
    document.querySelectorAll('.dscr-target-btn').forEach(btn => {
      const t = parseFloat(btn.dataset.dscrTarget);
      btn.classList.toggle('active', t === dscrTarget);
    });
  }

  function wireLoanType() {
    document.querySelectorAll('.loan-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.loanType;
        if (next === loanType) return;
        trackEvent('BuyHold - Loan Type ' + next);
        setLoanType(next, true);
      });
    });
    document.querySelectorAll('.dscr-target-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        dscrTarget = parseFloat(btn.dataset.dscrTarget) || 1.25;
        trackEvent('BuyHold - DSCR Target ' + dscrTarget);
        syncLoanTypeUI();
        fullCalc();
      });
    });
    const io = $('dscrInterestOnly');
    if (io) {
      io.addEventListener('change', () => {
        trackEvent('BuyHold - DSCR IO ' + (io.checked ? 'on' : 'off'));
        fullCalc();
      });
    }
  }

  function wirePresets() {
    const container = $('buyholdPresets');
    if (!container) return;
    container.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.preset;
        trackEvent('BuyHold - Preset ' + key);
        applyPreset(key);
      });
    });
  }

  function wireReset() {
    const btn = $('resetScenario');
    if (!btn) return;
    btn.addEventListener('click', () => {
      trackEvent('BuyHold - Reset Defaults');
      loanType = 'dscr';
      dscrTarget = 1.25;
      convSnapshot = null;
      const io = $('dscrInterestOnly');
      if (io) io.checked = false;
      applyPreset('marion-default', true);
      const cb = $('cashPurchase');
      if (cb) cb.checked = false;
      updateCashUI();
      syncLoanTypeUI();
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
      trackEvent('BuyHold - Share Link');
      const params = new URLSearchParams();
      const keys = ['purchasePrice', 'downPayment', 'interestRate', 'loanTerm', 'monthlyRent', 'vacancyRate', 'maintenance', 'propertyTaxRate', 'insuranceRate', 'hoa', 'management', 'appreciation', 'holdingYears'];
      keys.forEach(k => {
        const v = parseFloat($(k)?.value);
        if (isFinite(v)) params.set(k.substring(0, 3), v);
      });
      if ($('cashPurchase')?.checked) params.set('cash', '1');
      if (loanType === 'dscr') params.set('lt', 'dscr');
      params.set('dt', String(dscrTarget));
      if ($('dscrInterestOnly')?.checked) params.set('io', '1');

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
    if (p.get('lt') === 'dscr') loanType = 'dscr';
    if (p.has('dt')) {
      const t = parseFloat(p.get('dt'));
      if (t === 1 || t === 1.25) dscrTarget = t;
    }
    if (p.get('io') === '1') {
      const io = $('dscrInterestOnly');
      if (io) io.checked = true;
    }
    return true;
  }

  function renderComparison() {
    const grid = $('comparisonGrid');
    const view = $('comparisonView');
    if (!grid || !view || comparisonScenarios.length === 0) return;

    grid.innerHTML = '';
    const hasHYSA = comparisonScenarios.some(s => s._isHYSA);
    grid.className = hasHYSA
      ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3'
      : 'grid grid-cols-1 md:grid-cols-3 gap-3';

    comparisonScenarios.forEach((sc, idx) => {
      const eff = getEffectiveInputs(sc);
      const m = computeKeyMetrics(eff);

      const col = document.createElement('div');
      const isHYSA = !!sc._isHYSA;

      if (isHYSA) {
        const d = sc.hysaData || {};
        col.className = 'bg-white border border-amber-200 rounded-xl p-4 text-base shadow-sm flex flex-col';
        col.innerHTML = `
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-1">
              <span class="scenario-name font-semibold text-sm cursor-default">${sc.name}</span>
              <span class="text-xs px-1 py-0.5 bg-amber-500 text-white rounded">Benchmark</span>
            </div>
            <button class="remove-btn calc-btn ghost !px-2 !py-1 !text-sm text-red-600" data-idx="${idx}">×</button>
          </div>
          <div class="text-xs text-[#64748b] mb-2">Opportunity cost of full purchase price @ 4% over ${d.holdY || '?'} years (simple)</div>
          <div class="metrics-grid !gap-1 !mb-1 text-sm" style="grid-template-columns: repeat(2, 1fr);">
            <div class="metric-card neutral p-2">
              <div class="metric-label text-xs">Future Value</div>
              <div class="metric-value text-base tabular-nums">${fmtMoney(d.fv)}</div>
            </div>
            <div class="metric-card accent p-2">
              <div class="metric-label text-xs">Effective ROI</div>
              <div class="metric-value text-base">${fmtPct(d.effectiveROI || 0, 1)}</div>
            </div>
            <div class="metric-card neutral p-2">
              <div class="metric-label text-xs">Annualized</div>
              <div class="metric-value text-base">${(d.annualized || 4).toFixed(1)}%</div>
            </div>
            <div class="metric-card ${ (d.delta||0) >= 0 ? 'positive' : 'negative' } p-2">
              <div class="metric-label text-xs">Delta vs Prop</div>
              <div class="metric-value text-base tabular-nums">${(d.delta||0) >= 0 ? '+' : ''}${fmtMoney(d.delta)}</div>
            </div>
          </div>
        `;
      } else {
        const isHighIntent = sc.name.includes('High Intent') || idx === 0;
        const isActive = activeScenario.id === sc.id;
        col.className = 'bg-white border border-[#e2e8f0] rounded-xl p-4 text-base shadow-sm flex flex-col';

        col.innerHTML = `
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-1">
              <span class="scenario-name font-semibold text-sm cursor-pointer" data-idx="${idx}">${sc.name}</span>
              ${isHighIntent ? '<span class="text-xs px-1 py-0.5 bg-[#1e3a8a] text-white rounded">High Intent</span>' : ''}
              ${isActive ? '<span class="text-xs px-1 py-0.5 bg-green-600 text-white rounded">Active</span>' : ''}
            </div>
            <div class="flex gap-0.5">
              <button class="load-btn calc-btn ghost !px-2 !py-1 !text-sm" data-idx="${idx}">Load</button>
              <button class="remove-btn calc-btn ghost !px-2 !py-1 !text-sm text-red-600" data-idx="${idx}">×</button>
            </div>
          </div>

          <div class="inline-dynamics p-2 mb-2 text-sm">
            <div class="inline-dynamics-label text-xs">Key impacts</div>
            <div class="inline-metrics-row gap-2">
              <div class="inline-metric p-1">
                <span class="im-label text-xs">Monthly CF</span>
                <span class="im-value text-base tabular-nums">${fmtMoney(m.monthlyCF)}</span>
              </div>
              <div class="inline-metric p-1">
                <span class="im-label text-xs">NOI</span>
                <span class="im-value text-base tabular-nums">${fmtMoney(m.noi)}</span>
              </div>
              <div class="inline-metric p-1">
                <span class="im-label text-xs">CoC</span>
                <span class="im-value text-base">${fmtPct(m.coc, 1)}</span>
              </div>
            </div>
          </div>

          <div class="metrics-grid !gap-1 !mb-1 text-sm" style="grid-template-columns: repeat(2, 1fr);">
            <div class="metric-card positive p-2">
              <div class="metric-label text-xs">Monthly CF</div>
              <div class="metric-value text-base tabular-nums">${fmtMoney(m.monthlyCF)}</div>
            </div>
            <div class="metric-card neutral p-2">
              <div class="metric-label text-xs">Cap Rate</div>
              <div class="metric-value text-base">${fmtPct(m.capRate, 1)}</div>
            </div>
            <div class="metric-card neutral p-2">
              <div class="metric-label text-xs">Cash-on-Cash</div>
              <div class="metric-value text-base">${fmtPct(m.coc, 1)}</div>
            </div>
            <div class="metric-card accent p-2">
              <div class="metric-label text-xs">Total ROI</div>
              <div class="metric-value text-base">${fmtPct(m.totalROI, 0)}</div>
            </div>
            <div class="metric-card positive p-2">
              <div class="metric-label text-xs">Future Equity</div>
              <div class="metric-value text-base tabular-nums">${fmtMoney(m.futureEquity)}</div>
            </div>
            <div class="metric-card neutral p-2">
              <div class="metric-label text-xs">Total Wealth</div>
              <div class="metric-value text-base tabular-nums">${fmtMoney(m.totalWealth)}</div>
            </div>
            <div class="metric-card neutral p-2">
              <div class="metric-label text-xs">Mortgage</div>
              <div class="metric-value text-base tabular-nums">${fmtMoney(m.mortgage)}</div>
            </div>
            <div class="metric-card positive p-2">
              <div class="metric-label text-xs">Annual CF</div>
              <div class="metric-value text-base tabular-nums">${fmtMoney(m.annualCF)}</div>
            </div>
          </div>
        `;
      }

      if (isHYSA) {
        const remBtn = col.querySelector('.remove-btn');
        if (remBtn) remBtn.addEventListener('click', () => {
          trackEvent('BuyHold - Compare Remove');
          comparisonScenarios.splice(idx, 1);
          renderComparison();
        });
      } else {
        // Editable name
        const nameEl = col.querySelector('.scenario-name');
        nameEl.addEventListener('click', () => {
          const newName = prompt('Edit scenario name:', sc.name);
          if (newName && newName.trim()) {
            sc.name = newName.trim();
            renderComparison();
          }
        });

        // Load
        const loadBtn = col.querySelector('.load-btn');
        if (loadBtn) loadBtn.addEventListener('click', () => {
          trackEvent('BuyHold - Compare Load');
          activeScenario = JSON.parse(JSON.stringify(sc));
          applyConfigToDOM();
          fullCalc();
          renderComparison(); // refresh to update active badges
        });

        // Remove
        const remBtn = col.querySelector('.remove-btn');
        if (remBtn) remBtn.addEventListener('click', () => {
          trackEvent('BuyHold - Compare Remove');
          comparisonScenarios.splice(idx, 1);
          renderComparison();
        });
      }

      grid.appendChild(col);
    });
  }

  function wireCompare() {
    const btn = $('compareBtn');
    const view = $('comparisonView');
    const close = $('closeComparisonBtn');
    const grid = $('comparisonGrid');
    if (!btn || !view || !grid) return;

    btn.addEventListener('click', () => {
      trackEvent('BuyHold - Compare Scenarios');
      const baseScenario = JSON.parse(JSON.stringify(activeScenario));
      baseScenario.name = 'Current (High Intent)';

      const optInputs = { ...baseScenario.inputs, monthlyRent: baseScenario.inputs.monthlyRent * 1.12, vacancyRate: Math.max(3, baseScenario.inputs.vacancyRate - 2), maintenance: Math.max(1, baseScenario.inputs.maintenance - 1) };
      const opt = { id: 'opt-' + Date.now(), name: 'Optimistic', config: { ...baseScenario.config }, inputs: optInputs };

      const consInputs = { ...baseScenario.inputs, monthlyRent: baseScenario.inputs.monthlyRent * 0.9, vacancyRate: baseScenario.inputs.vacancyRate + 3, interestRate: baseScenario.inputs.interestRate + 1.25 };
      const cons = { id: 'cons-' + Date.now(), name: 'Conservative', config: { ...baseScenario.config }, inputs: consInputs };

      comparisonScenarios = [baseScenario, opt, cons];

      renderComparison();

      view.style.display = 'block';
      view.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    if (close) close.addEventListener('click', () => { view.style.display = 'none'; });

    // Wire HYSA comparison button (ROI vs HYSA @4% opp cost on full price, using holding period)
    const hysaBtn = $('compareToHYSA');
    if (hysaBtn) hysaBtn.addEventListener('click', () => {
      trackEvent('BuyHold - Compare to HYSA');
      compareToHYSA();
    });
  }

  function compareToHYSA() {
    const view = $('comparisonView');
    if (!view) return;

    const baseEff = getEffectiveInputs(activeScenario);
    const propM = computeKeyMetrics(baseEff);
    const price = baseEff.purchasePrice || DEFAULTS.purchasePrice;
    const holdY = baseEff.holdingYears || DEFAULTS.holdingYears;
    const rate = 0.04;

    const fv = price * Math.pow(1 + rate, holdY);
    const totalRet = fv - price;
    const effROI = price > 0 ? (totalRet / price) * 100 : 0;
    const delta = fv - propM.totalWealth;

    const hysaSc = {
      id: 'hysa-' + Date.now(),
      name: 'HYSA @ 4% (opp. cost)',
      config: { ...activeScenario.config },
      inputs: { ...activeScenario.inputs },
      _isHYSA: true,
      hysaData: { fv, effectiveROI: effROI, delta, holdY, price, annualized: 4 }
    };

    comparisonScenarios.push(hysaSc);

    renderComparison();

    view.style.display = 'block';
    view.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      holdingYears: getValSafe('holdingYears'),
      loanType,
      dscrTarget,
      dscrInterestOnly: !!$('dscrInterestOnly')?.checked
    };
  }
  function getValSafe(id) { return parseFloat($(id)?.value) || 0; }

  function wireExports() {
    // CSV
    const csvBtn = $('exportCSV');
    if (csvBtn) csvBtn.addEventListener('click', () => {
      trackEvent('BuyHold - Export CSV');
      const rows = [
        ['Field', 'Value'],
        ['Purchase Price', $('purchasePrice').value],
        ['Down %', $('downPayment').value],
        ['Rate %', $('interestRate').value],
        ['Monthly Rent', $('monthlyRent').value],
        ['Monthly Cash Flow', $('monthlyCashFlow').textContent.replace(/[^0-9.-]/g,'')],
        ['CoC %', $('cashOnCash').textContent],
        ['Cap Rate %', $('capRate').textContent],
        ['Loan type', loanType],
        ['Lender DSCR', $('dscrValue') ? $('dscrValue').textContent : ''],
        ['DSCR target', String(dscrTarget)]
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
        trackEvent('BuyHold - Export PDF');
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
        doc.text('Loan type: ' + loanType + '  Lender DSCR: ' + ($('dscrValue') && $('dscrValue').textContent), 20, 80);
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
        trackEvent('BuyHold - Save Scenario');
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
        trackEvent('BuyHold - Load Scenario');
        const key = select.value;
        if (!key) return;
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          Object.keys(data).forEach(k => {
            if (k === 'cashPurchase') {
              const cb = $('cashPurchase'); if (cb) cb.checked = !!data[k];
              return;
            }
            if (k === 'loanType') {
              loanType = data[k] === 'dscr' ? 'dscr' : 'conventional';
              return;
            }
            if (k === 'dscrTarget') {
              dscrTarget = data[k] === 1 ? 1 : 1.25;
              return;
            }
            if (k === 'dscrInterestOnly') {
              const io = $('dscrInterestOnly');
              if (io) io.checked = !!data[k];
              return;
            }
            setVal(k, data[k]);
            const s = $(k + 'Slider'); if (s) s.value = data[k];
          });
          refreshAllDisplays();
          updateCashUI();
          syncLoanTypeUI();
          fullCalc();
        } catch (e) {}
      });
    }

    if (delBtn && select) {
      delBtn.addEventListener('click', () => {
        trackEvent('BuyHold - Delete Scenario');
        const key = select.value;
        if (key) {
          localStorage.removeItem(key);
          refreshSelect();
        }
      });
    }

    refreshSelect();
  }

  // wirePropertyLookupStub removed in Phase 0 (non-functional stub).
  // See comment in init() and HTML for future pinning on granular tax data.

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
    wireLoanType();
    updateCashUI();
    syncLoanTypeUI();

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
    // wirePropertyLookupStub();  // REMOVED in Phase 0 - stub feature (Zillow/Redfin lookup) was non-functional.
                                 // Pinned for future granular county/state tax & insurance data work.
    wireAllInputsForCalc();

    // Phase 1: wire config modal (more aggressive but safe)
    document.querySelectorAll('#buy-hold-calculator .priority-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = btn.getAttribute('data-priority') || 'unknown';
        trackEvent('BuyHold - Priority ' + p);
      });
    });
    setupAnalysisConfigModal();

    // Bind new Existing fields (safe additive)
    bindPair('currentEquity', 'currentEquitySlider', 'currentEquityDisplay');
    bindPair('currentLoanBalance', 'currentLoanBalanceSlider', 'currentLoanBalanceDisplay');

    // 6. Initial full population + visuals
    // Make sure Marion default chip looks active
    document.querySelectorAll('#buyholdPresets .preset-chip').forEach(ch => {
      ch.classList.toggle('active', ch.dataset.preset === 'marion-default');
    });

    // seed initial config apply (harmless for Long-Term/New)
    applyConfigToDOM();

    fullCalc();

    // 7. One more sync pass for any late displays
    setTimeout(refreshAllDisplays, 40);

    console.log('✅ Indiana home value prop ready. Sliders reactive. All values & charts populate live. Phase 1 config modal wired (local only).');
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();