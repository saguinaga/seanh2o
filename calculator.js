// calculator.js — Clean minimal working version
(function () {
  'use strict';

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
  const capRate = purchase > 0 ? (noi / purchase) * 100 : 0;
  const coc = downAmount > 0 ? (annualCF / downAmount) * 100 : 0;

  // === Update all common metric IDs defensively ===
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('monthlyCashFlow', '$' + Math.round(monthlyCF).toLocaleString());
  setText('annualCashFlow', '$' + Math.round(annualCF).toLocaleString());
  setText('capRate', capRate.toFixed(1) + '%');
  setText('cashOnCash', cash ? 'N/A' : coc.toFixed(1) + '%');
  setText('totalROI', capRate.toFixed(1) + '%');           // fallback
  setText('futureEquity', '$' + Math.round(purchase * 1.3).toLocaleString()); // placeholder
  setText('mortgagePayment', cash ? 'None (cash)' : '$' + Math.round(mortgage).toLocaleString());
  setText('totalWealth', '$' + Math.round(monthlyCF * 120 + purchase * 0.3).toLocaleString());

  // Also try inline versions if they exist
  setText('inlineMonthlyCF', '$' + Math.round(monthlyCF).toLocaleString());
  setText('inlineNOI', '$' + Math.round(noi).toLocaleString());
  setText('inlineCoC', coc.toFixed(1) + '%');

  console.log('✅ Updated metrics — Monthly CF:', Math.round(monthlyCF));
}

  function init() {
    document.querySelectorAll('input').forEach(el => {
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
    });
    calculate();
    console.log('✅ Buy & Hold Calculator ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
