// === CLEAN MINIMAL BUY & HOLD CALCULATOR - seanaguinaga.com ===
(function () {
  'use strict';

  let calcRoot = null;
  let $ = null;
  let chart = null;
  const syncFns = {};
  let savedDownPayment = 25;

  function mount() {
    calcRoot = document.querySelector('#buy-hold-calculator, #calculator');
    if (!calcRoot) return false;
    $ = sel => calcRoot.querySelector(sel);
    return true;
  }

  const parseNum = (raw, fallback) => Number.isFinite(+raw) ? +raw : fallback;
  const fmt = n => Number.isFinite(n) ? '$' + n.toLocaleString() : '$0';
  const pct = n => Number.isFinite(n) ? n.toFixed(1) + '%' : '0%';

  const inputs = {
    purchasePrice: { el: '#purchasePrice', slider: '#purchasePriceSlider', display: '#purchasePriceDisplay', default: 175000 },
    downPayment: { el: '#downPayment', slider: '#downPaymentSlider', display: '#downPaymentDisplay', default: 25 },
    interestRate: { el: '#interestRate', slider: '#interestRateSlider', display: '#interestRateDisplay', default: 6.75 },
    loanTerm: { el: '#loanTerm', slider: '#loanTermSlider', display: '#loanTermDisplay', default: 30 },
    monthlyRent: { el: '#monthlyRent', slider: '#monthlyRentSlider', display: '#monthlyRentDisplay', default: 1495 },
    vacancyRate: { el: '#vacancyRate', slider: '#vacancyRateSlider', display: '#vacancyRateDisplay', default: 6 },
    propertyTaxRate: { el: '#propertyTaxRate', slider: '#propertyTaxRateSlider', display: '#propertyTaxRateDisplay', default: 1.0 },
    insuranceRate: { el: '#insuranceRate', slider: '#insuranceRateSlider', display: '#insuranceRateDisplay', default: 0.7 },
  };

  function getValues() {
    const v = {};
    for (const [k, cfg] of Object.entries(inputs)) {
      const el = $(cfg.el);
      v[k] = parseNum(el ? el.value : cfg.default, cfg.default);
    }
    v.cashPurchase = $('#cashPurchase') ? $('#cashPurchase').checked : false;
    v.propertyTax = v.purchasePrice * (v.propertyTaxRate / 100);
    v.insurance = v.purchasePrice * (v.insuranceRate / 100);
    return v;
  }

  // Simple mortgage calculation
  function monthlyMortgage(principal, annualRate, years) {
    if (principal <= 0) return 0;
    const r = annualRate / 100 / 12;
    const n = years * 12;
    return r === 0 ? principal / n : principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  }

  function calculate() {
    const v = getValues();
    const cash = v.cashPurchase;
    const down = cash ? v.purchasePrice : v.purchasePrice * (v.downPayment / 100);
    const loan = cash ? 0 : v.purchasePrice - down;
    const mortgage = cash ? 0 : monthlyMortgage(loan, v.interestRate, v.loanTerm);

    const grossRent = v.monthlyRent * 12;
    const effectiveRent = grossRent * (1 - v.vacancyRate / 100);
    const totalExpenses = v.propertyTax + v.insurance + (v.purchasePrice * 0.025) + (effectiveRent * 0.09);
    const noi = effectiveRent - totalExpenses;
    const annualDebt = mortgage * 12;
    const annualCF = noi - annualDebt;
    const monthlyCF = annualCF / 12;

    // Update UI
    if ($('#monthlyCashFlow')) $('#monthlyCashFlow').textContent = fmt(monthlyCF);
    if ($('#annualCashFlow')) $('#annualCashFlow').textContent = fmt(annualCF);
    if ($('#capRate')) $('#capRate').textContent = pct(noi / v.purchasePrice * 100);
    if ($('#cashOnCash')) $('#cashOnCash').textContent = cash ? 'N/A (Cash)' : pct(annualCF / down * 100);

    console.log("✅ Calculator updated", { monthlyCF: monthlyCF.toFixed(0) });
  }

  function init() {
    if (!mount()) return;
    // Bind sliders/inputs
    Object.keys(inputs).forEach(key => {
      const cfg = inputs[key];
      const input = $(cfg.el);
      const slider = $(cfg.slider);
      if (input) input.addEventListener('input', calculate);
      if (slider) slider.addEventListener('input', () => { if (input) input.value = slider.value; calculate(); });
    });

    const cashCb = $('#cashPurchase');
    if (cashCb) cashCb.addEventListener('change', calculate);

    calculate();
    console.log("✅ Buy & Hold Calculator initialized");
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('load', init);
})();
