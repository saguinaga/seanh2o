
console.log("🔥 NEW CLEAN VERSION LOADED - " + new Date().toISOString());

(function () {
  'use strict';

  function bindPair(numberId, sliderId, displayId) {
    const num = document.getElementById(numberId);
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);

    if (!num || !slider) {
      console.warn("Missing elements for", numberId);
      return;
    }

    function sync(val) {
      val = parseFloat(val) || 0;
      num.value = val;
      slider.value = val;
      if (display) display.textContent = val;
    }

    slider.addEventListener('input', () => sync(slider.value));
    num.addEventListener('input', () => sync(num.value));

    // Initial sync
    sync(num.value || slider.value);
  }

  // Bind all your pairs
  bindPair('purchasePrice', 'purchasePriceSlider', 'purchasePriceDisplay');
  bindPair('downPayment', 'downPaymentSlider', 'downPaymentDisplay');
  bindPair('interestRate', 'interestRateSlider', 'interestRateDisplay');
  bindPair('loanTerm', 'loanTermSlider', 'loanTermDisplay');
  bindPair('monthlyRent', 'monthlyRentSlider', 'monthlyRentDisplay');
  bindPair('vacancyRate', 'vacancyRateSlider', 'vacancyRateDisplay');
  bindPair('maintenance', 'maintenanceSlider', 'maintenanceDisplay');
  bindPair('propertyTaxRate', 'propertyTaxRateSlider', 'propertyTaxRateDisplay');
  bindPair('insuranceRate', 'insuranceRateSlider', 'insuranceRateDisplay');
  bindPair('hoa', 'hoaSlider', 'hoaDisplay');
  bindPair('management', 'managementSlider', 'managementDisplay');
  bindPair('appreciation', 'appreciationSlider', 'appreciationDisplay');
  bindPair('holdingYears', 'holdingYearsSlider', 'holdingYearsDisplay');

  console.log("✅ All input pairs bound");
})();
