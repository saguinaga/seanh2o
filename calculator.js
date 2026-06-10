// calculator.js - Fixed input binding + live displays + calculations
(function () {
  'use strict';

  const inputs = {
    purchasePrice:     { slider: 'purchasePriceSlider',     display: 'purchasePriceDisplay' },
    downPayment:       { slider: 'downPaymentSlider',       display: 'downPaymentDisplay' },
    interestRate:      { slider: 'interestRateSlider',      display: 'interestRateDisplay' },
    loanTerm:          { slider: 'loanTermSlider',          display: 'loanTermDisplay' },
    monthlyRent:       { slider: 'monthlyRentSlider',       display: 'monthlyRentDisplay' },
    vacancyRate:       { slider: 'vacancyRateSlider',       display: 'vacancyRateDisplay' },
    maintenance:       { slider: 'maintenanceSlider',       display: 'maintenanceDisplay' },
    propertyTaxRate:   { slider: 'propertyTaxRateSlider',   display: 'propertyTaxRateDisplay' },
    insuranceRate:     { slider: 'insuranceRateSlider',     display: 'insuranceRateDisplay' },
    hoa:               { slider: 'hoaSlider',               display: 'hoaDisplay' },
    management:        { slider: 'managementSlider',        display: 'managementDisplay' },
    appreciation:      { slider: 'appreciationSlider',      display: 'appreciationDisplay' },
    holdingYears:      { slider: 'holdingYearsSlider',      display: 'holdingYearsDisplay' },
  };

  function parseNum(val, fallback = 0) {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  }

  function fmtMoney(n) {
    return '$' + Math.round(n || 0).toLocaleString();
  }

  function fmtPct(n, decimals = 1) {
    return (n || 0).toFixed(decimals) + '%';
  }

  function syncField(key) {
    const cfg = inputs[key];
    if (!cfg) return;

    const numberEl = document.getElementById(key);
    const sliderEl = document.getElementById(cfg.slider);
    const displayEl = document.getElementById(cfg.display);

    if (!numberEl || !sliderEl) return;

    const update = (val) => {
      val = parseNum(val, numberEl.defaultValue || 0);
      numberEl.value = val;
      sliderEl.value = val;
      if (displayEl) {
        if (key.includes('Rate') || key.includes('maintenance') || key.includes('management') || key.includes('appreciation')) {
          displayEl.textContent = fmtPct(val);
        } else if (key === 'downPayment' || key === 'vacancyRate') {
          displayEl.textContent = fmtPct(val);
        } else if (key === 'holdingYears' || key === 'loanTerm') {
          displayEl.textContent = val + ' yr';
        } else {
          displayEl.textContent = fmtMoney(val);
        }
      }
    };

    // Initial sync
    update(numberEl.value || sliderEl.value);

    // Two-way binding
    sliderEl.addEventListener('input', () => update(sliderEl.value));
    numberEl.addEventListener('input', () => update(numberEl.value));
    numberEl.addEventListener('change', () => update(numberEl.value));
  }

  function calculate() {
    // Get all current values
    const v = {};
    Object.keys(inputs).forEach(key => {
      const el = document.getElementById(key);
      v[key] = parseNum(el ? el.value : 0);
    });
    v.cashPurchase = document.getElementById('cashPurchase')?.checked || false;

    // Derived values
    v.propertyTax = v.purchasePrice * (v.propertyTaxRate / 100);
    v.insurance = v.purchasePrice * (v.insuranceRate / 100);

    // Update computed displays
    const ptEl = document.getElementById('propertyTaxDisplay');
    if (ptEl) ptEl.textContent = fmtMoney(v.propertyTax);

    const insEl = document.getElementById('insuranceDisplay');
    if (insEl) insEl.textContent = fmtMoney(v.insurance);

    const loanEl = document.getElementById('inlineLoanAmount');
    const piEl = document.getElementById('inlineMortgage');
    if (loanEl || piEl) {
      const downAmt = v.cashPurchase ? v.purchasePrice : v.purchasePrice * (v.downPayment / 100);
      const loanAmt = v.cashPurchase ? 0 : v.purchasePrice - downAmt;
      if (loanEl) loanEl.textContent = v.cashPurchase ? 'None (cash)' : fmtMoney(loanAmt);

      // Simple monthly P&I
      const r = v.interestRate / 100 / 12;
      const n = v.loanTerm * 12;
      const mortgage = loanAmt <= 0 ? 0 : loanAmt * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
      if (piEl) piEl.textContent = v.cashPurchase ? '—' : fmtMoney(mortgage);
    }

    console.log('✅ Inputs synced + calculated');
  }

  function init() {
    // Bind all sliders + numbers + displays
    Object.keys(inputs).forEach(key => syncField(key));

    // Cash purchase toggle
    const cashCb = document.getElementById('cashPurchase');
    if (cashCb) cashCb.addEventListener('change', calculate);

    // Presets (basic support)
    const presetBar = document.getElementById('buyholdPresets');
    if (presetBar) {
      presetBar.addEventListener('click', e => {
        const btn = e.target.closest('[data-preset]');
        if (!btn) return;
        // You can expand this later with actual preset values
        console.log('Preset clicked:', btn.dataset.preset);
        calculate();
      });
    }

    // Initial calculation
    calculate();

    // Re-calculate on any input change
    document.querySelectorAll('input').forEach(el => {
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
    });

    console.log('✅ Buy & Hold inputs fully initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
