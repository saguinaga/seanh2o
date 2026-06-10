// === MINIMAL WORKING BUY & HOLD CALCULATOR ===
(function() {
  'use strict';

  function mount() {
    const root = document.getElementById('buy-hold-calculator') || document.getElementById('calculator');
    if (!root) return null;
    return {
      query: sel => root.querySelector(sel)
    };
  }

  const $ = sel => document.querySelector(sel);

  function parseNum(v, def = 0) {
    const n = parseFloat(v);
    return isNaN(n) ? def : n;
  }

  function fmt(n) {
    return '$' + Math.round(n || 0).toLocaleString();
  }

  function calculate() {
    const purchase = parseNum($('#purchasePrice')?.value, 175000);
    const rent = parseNum($('#monthlyRent')?.value, 1495);
    const vacancy = parseNum($('#vacancyRate')?.value, 6);
    const downPct = parseNum($('#downPayment')?.value, 25);
    const rate = parseNum($('#interestRate')?.value, 6.75);
    const term = parseNum($('#loanTerm')?.value, 30);

    const cashPurchase = $('#cashPurchase')?.checked || false;
    const down = cashPurchase ? purchase : purchase * (downPct / 100);
    const loan = cashPurchase ? 0 : purchase - down;

    // Simple mortgage
    const r = rate / 100 / 12;
    const n = term * 12;
    const mortgage = loan <= 0 ? 0 : loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    const gross = rent * 12;
    const effective = gross * (1 - vacancy / 100);
    const expenses = purchase * 0.035 + effective * 0.1; // rough tax+ins+maint+mgmt
    const noi = effective - expenses;
    const debt = mortgage * 12;
    const annualCF = noi - debt;
    const monthlyCF = annualCF / 12;

    // Update displays
    if ($('#monthlyCashFlow')) $('#monthlyCashFlow').textContent = fmt(monthlyCF);
    if ($('#annualCashFlow')) $('#annualCashFlow').textContent = fmt(annualCF);
    if ($('#capRate')) $('#capRate').textContent = (noi / purchase * 100).toFixed(1) + '%';

    console.log('✅ Calculator running - Monthly CF:', monthlyCF.toFixed(0));
  }

  function init() {
    const root = mount();
    if (!root) {
      console.error("Calculator container not found");
      return;
    }

    // Bind all inputs
    document.querySelectorAll('input[type="number"], input[type="range"], input[type="checkbox"]').forEach(el => {
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
    });

    calculate();
    console.log('✅ Minimal Buy & Hold Calculator initialized successfully');
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('load', init);
})();
