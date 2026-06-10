console.log("🔥 NEW CLEAN VERSION LOADED - " + new Date().toISOString());

(function () {
  'use strict';

  // === 1. BIND SLIDERS + NUMBER INPUTS + DISPLAYS ===
  function bindPair(numberId, sliderId, displayId, isPercent = false, isYear = false) {
    const num = document.getElementById(numberId);
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);

    if (!num || !slider) {
      console.warn("Missing:", numberId);
      return;
    }

    function sync(val) {
      val = parseFloat(val) || 0;
      num.value = val;
      slider.value = val;

      if (display) {
        if (isPercent) display.textContent = val + '%';
        else if (isYear) display.textContent = val + ' yr';
        else display.textContent = '$' + Math.round(val).toLocaleString();
      }
    }

    slider.addEventListener('input', () => sync(slider.value));
    num.addEventListener('input', () => sync(num.value));
    sync(num.value || slider.value);
  }

  // Bind everything from your HTML
  bindPair('purchasePrice', 'purchasePriceSlider', 'purchasePriceDisplay');
  bindPair('downPayment', 'downPaymentSlider', 'downPaymentDisplay', true);
  bindPair('interestRate', 'interestRateSlider', 'interestRateDisplay', true);
  bindPair('loanTerm', 'loanTermSlider', 'loanTermDisplay', false, true);
  bindPair('monthlyRent', 'monthlyRentSlider', 'monthlyRentDisplay');
  bindPair('vacancyRate', 'vacancyRateSlider', 'vacancyRateDisplay', true);
  bindPair('maintenance', 'maintenanceSlider', 'maintenanceDisplay', true);
  bindPair('propertyTaxRate', 'propertyTaxRateSlider', 'propertyTaxRateDisplay', true);
  bindPair('insuranceRate', 'insuranceRateSlider', 'insuranceRateDisplay', true);
  bindPair('hoa', 'hoaSlider', 'hoaDisplay');
  bindPair('management', 'managementSlider', 'managementDisplay', true);
  bindPair('appreciation', 'appreciationSlider', 'appreciationDisplay', true);
  bindPair('holdingYears', 'holdingYearsSlider', 'holdingYearsDisplay', false, true);

  // === 2. CALCULATE + UPDATE BIG NUMBERS ON THE LEFT ===
  function calculate() {
    const get = id => parseFloat(document.getElementById(id)?.value) || 0;

    const purchase = get('purchasePrice') || 175000;
    const rent = get('monthlyRent') || 1495;
    const vacancy = get('vacancyRate') || 6;
    const down = get('downPayment') || 25;
    const rate = get('interestRate') || 6.75;
    const term = get('loanTerm') || 30;
    const cash = document.getElementById('cashPurchase')?.checked || false;

    const downAmount = cash ? purchase : purchase * (down / 100);
    const loan = cash ? 0 : purchase - downAmount;

    const r = rate / 100 / 12;
    const n = term * 12;
    const mortgage = loan <= 0 ? 0 : loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);

    const gross = rent * 12;
    const effective = gross * (1 - vacancy / 100);
    const expenses = purchase * 0.035 + effective * 0.09;
    const noi = effective - expenses;
    const debt = mortgage * 12;
    const annualCF = noi - debt;
    const monthlyCF = annualCF / 12;
    const cap = purchase > 0 ? (noi / purchase) * 100 : 0;
    const coc = downAmount > 0 ? (annualCF / downAmount) * 100 : 0;

    // Update big result numbers (left side)
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('monthlyCashFlow', '$' + Math.round(monthlyCF).toLocaleString());
    set('annualCashFlow', '$' + Math.round(annualCF).toLocaleString());
    set('capRate', cap.toFixed(1) + '%');
    set('cashOnCash', cash ? 'N/A (Cash)' : coc.toFixed(1) + '%');

    // Update computed fields
    const pt = purchase * (get('propertyTaxRate') / 100);
    const ins = purchase * (get('insuranceRate') / 100);
    set('propertyTaxDisplay', '$' + Math.round(pt).toLocaleString() + '/yr');
    set('insuranceDisplay', '$' + Math.round(ins).toLocaleString() + '/yr');
    set('inlineLoanAmount', cash ? 'None (cash)' : '$' + Math.round(loan).toLocaleString());
    set('inlineMortgage', cash ? '—' : '$' + Math.round(mortgage).toLocaleString());

    console.log('✅ Numbers updated — Monthly CF:', Math.round(monthlyCF));
  }

  // === 3. WIRE EVERYTHING UP ===
  function init() {
    // Re-run calculate whenever anything changes
    document.querySelectorAll('input').forEach(el => {
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
    });

    // Cash purchase toggle
    const cashCb = document.getElementById('cashPurchase');
    if (cashCb) cashCb.addEventListener('change', calculate);

    calculate(); // first run
    console.log('✅ Calculator fully ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
    
  }
  // === ADD THIS AT THE BOTTOM ===

  function calculate() {
    const get = id => parseFloat(document.getElementById(id)?.value) || 0;

    const purchase = get('purchasePrice') || 175000;
    const rent = get('monthlyRent') || 1495;
    const vacancy = get('vacancyRate') || 6;
    const down = get('downPayment') || 25;
    const rate = get('interestRate') || 6.75;
    const term = get('loanTerm') || 30;
    const cash = document.getElementById('cashPurchase')?.checked || false;

    const downAmount = cash ? purchase : purchase * (down / 100);
    const loan = cash ? 0 : purchase - downAmount;

    const r = rate / 100 / 12;
    const n = term * 12;
    const mortgage = loan <= 0 ? 0 : loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);

    const gross = rent * 12;
    const effective = gross * (1 - vacancy / 100);
    const expenses = purchase * 0.035 + effective * 0.09;
    const noi = effective - expenses;
    const debt = mortgage * 12;
    const annualCF = noi - debt;
    const monthlyCF = annualCF / 12;
    const cap = purchase > 0 ? (noi / purchase) * 100 : 0;
    const coc = downAmount > 0 ? (annualCF / downAmount) * 100 : 0;

    // Update big numbers on the left
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('monthlyCashFlow', '$' + Math.round(monthlyCF).toLocaleString());
    set('annualCashFlow', '$' + Math.round(annualCF).toLocaleString());
    set('capRate', cap.toFixed(1) + '%');
    set('cashOnCash', cash ? 'N/A (Cash)' : coc.toFixed(1) + '%');

    // Update computed fields
    set('propertyTaxDisplay', '$' + Math.round(purchase * (get('propertyTaxRate')/100)).toLocaleString() + '/yr');
    set('insuranceDisplay', '$' + Math.round(purchase * (get('insuranceRate')/100)).toLocaleString() + '/yr');
    set('inlineLoanAmount', cash ? 'None (cash)' : '$' + Math.round(loan).toLocaleString());
    set('inlineMortgage', cash ? '—' : '$' + Math.round(mortgage).toLocaleString());

    console.log('✅ Numbers updated — Monthly CF:', Math.round(monthlyCF));
  }

  // Run calculate when anything changes
  document.querySelectorAll('input').forEach(el => {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });

  const cashCb = document.getElementById('cashPurchase');
  if (cashCb) cashCb.addEventListener('change', calculate);

  calculate(); // run once on load
  
})();
