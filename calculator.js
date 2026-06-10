// calculator.js — Clean minimal working version
// calculator.js - Aggressive DOM updater
(function () {
  'use strict';

  function calculate() {
    // === INPUTS ===
    const get = id => parseFloat(document.getElementById(id)?.value) || 0;
    const purchase = get('purchasePrice') || get('purchase-price') || 175000;
    const rent = get('monthlyRent') || get('monthly-rent') || 1495;
    const vacancy = get('vacancyRate') || get('vacancy-rate') || 6;
    const down = get('downPayment') || get('down-payment') || 25;
    const rate = get('interestRate') || get('interest-rate') || 6.75;
    const term = get('loanTerm') || get('loan-term') || 30;
    const cash = document.getElementById('cashPurchase')?.checked || false;

    // === CALCULATIONS (simplified but real) ===
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

    // === ROBUST OUTPUT UPDATER ===
    const set = (id, val) => {
      let el = document.getElementById(id);
      if (!el) el = document.querySelector(`[id*="${id}"]`);
      if (el) el.textContent = val;
    };

    // Try every common variation
    set('monthlyCashFlow', '$' + Math.round(monthlyCF).toLocaleString());
    set('monthly-cash-flow', '$' + Math.round(monthlyCF).toLocaleString());
    set('annualCashFlow', '$' + Math.round(annualCF).toLocaleString());
    set('capRate', cap.toFixed(1) + '%');
    set('cashOnCash', cash ? 'N/A (Cash)' : coc.toFixed(1) + '%');
    set('totalROI', cap.toFixed(1) + '%');
    set('futureEquity', '$' + Math.round(purchase * 1.25).toLocaleString());
    set('mortgagePayment', cash ? 'Cash purchase' : '$' + Math.round(mortgage).toLocaleString());

    // Inline versions
    set('inlineMonthlyCF', '$' + Math.round(monthlyCF).toLocaleString());
    set('inlineNOI', '$' + Math.round(noi).toLocaleString());
    set('inlineCoC', coc.toFixed(1) + '%');

    console.log('✅ Numbers updated — Monthly CF:', Math.round(monthlyCF));
  }

  function init() {
    // Bind everything
    document.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
    });

    calculate(); // first run
    console.log('✅ Calculator ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
