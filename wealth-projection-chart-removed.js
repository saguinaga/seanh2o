// BACKUP of removed "Wealth Projection Over Time" chart code
// Removed due to Chart.js responsive + container sizing bug causing
// insane canvas dimensions (e.g. 24k+ px height) and SyntaxError issues on deploys.
// Saved for re-implementation later (user said "save for later").
// Original was using Chart.js line chart with 4 datasets (Property Value, Equity, Cum CF, Loan Balance).
// Data computed in computeYearlySeries using remainingBalance etc.
// 
// To restore: 
// 1. Add back the <div class="chart-wrap"> with <canvas id="wealthChart"> and .chart-legend in index.html (in analysis-sections).
// 2. Add back the CSS for .chart-canvas-wrap { position:relative; height:180px; ... } and media query.
// 3. Add back the JS functions below into calculator.js (before the STATE section and the full updateWealthChart).
// 4. Add the call in fullCalc(): updateWealthChart(...);
// 5. Bump version in script tag.
//
// The code below is the extracted removed JS (computeYearlySeries + updateWealthChart + the let was removed).

function computeYearlySeries(price, downPct, ratePct, termY, holdY, apprecPct, annualCF, cash) {
  const series = [];
  const downAmt0 = cash ? price : price * (downPct / 100);
  const loan0 = cash ? 0 : price - downAmt0;
  let cumCF = 0;
  let value = price;
  let bal = loan0;

  for (let y = 0; y <= holdY; y++) {
    const yr = y;
    const val = price * Math.pow(1 + apprecPct / 100, yr);
    const remBal = remainingBalance(loan0, ratePct, termY, yr);
    const eq = Math.max(0, val - remBal);
    if (y > 0) cumCF += annualCF;
    series.push({
      year: yr,
      value: Math.round(val),
      equity: Math.round(eq),
      cumCF: Math.round(cumCF),
      loan: Math.round(Math.max(0, remBal))
    });
  }
  return series;
}

// In STATE section was: let wealthChart = null;

function updateWealthChart(price, downPct, ratePct, termY, holdY, apprecPct, annualCF, cash) {
  const canvas = $('wealthChart');
  if (!canvas) return;

  const series = computeYearlySeries(price, downPct, ratePct, termY, holdY, apprecPct, annualCF, cash);

  const labels = series.map(s => 'Y' + s.year);
  const valueData = series.map(s => s.value);
  const equityData = series.map(s => s.equity);
  const cumCFData = series.map(s => s.cumCF);
  const loanData = series.map(s => s.loan);

  // toggle custom loan legend visibility (cash purchases have no loan line)
  const loanLeg = $('loanBalanceLegend');
  if (loanLeg) loanLeg.style.display = cash ? 'none' : '';

  if (wealthChart) {
    wealthChart.data.labels = labels;
    wealthChart.data.datasets[0].data = valueData;
    wealthChart.data.datasets[1].data = equityData;
    wealthChart.data.datasets[2].data = cumCFData;
    if (wealthChart.data.datasets[3]) {
      wealthChart.data.datasets[3].data = loanData;
      wealthChart.data.datasets[3].hidden = cash;
    }
    wealthChart.update();
    return;
  }

  wealthChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Property Value', data: valueData, borderColor: '#3b82f6', borderWidth: 2.5, tension: 0.25, fill: false },
        { label: 'Equity', data: equityData, borderColor: '#059669', borderWidth: 2.5, tension: 0.25, fill: false },
        { label: 'Cumulative Cash Flow', data: cumCFData, borderColor: '#d97706', borderWidth: 2.5, tension: 0.25, fill: false },
        { label: 'Loan Balance', data: loanData, borderColor: '#dc2626', borderWidth: 2, borderDash: [4, 2], tension: 0.2, fill: false, hidden: cash }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 }, // instant updates while dragging sliders
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
        y: {
          grid: { color: '#f1f5f9' },
          ticks: {
            font: { size: 10 },
            callback: function(v) {
              const abs = Math.abs(v);
              if (abs >= 1000000) return (v < 0 ? '-' : '') + '$' + (abs / 1000000).toFixed(1) + 'M';
              return '$' + (v / 1000).toFixed(0) + 'k';
            }
          }
        }
      },
      elements: { point: { radius: 2, hoverRadius: 4 } }
    }
  });
}

// In fullCalc, after sensitivity:
//    // Wealth chart
//    updateWealthChart(price, downPct, rate, term, holdY, apprec, cfAnnual, cash);

// Also in HTML, the div was:
//      <div class="chart-wrap">
//        <h5>Wealth Projection Over Time</h5>
//        <div class="chart-canvas-wrap">
//          <canvas id="wealthChart"></canvas>
//        </div>
//        <div class="chart-legend">
//          ... the 4 legend items, with id on loan one
//        </div>
//      </div>

// CSS backup (the rules we removed):
/*
.chart-canvas-wrap {
  position: relative;
  height: 180px;
  width: 100%;
}

@media (max-width: 768px) {
  .chart-canvas-wrap {
    height: 160px;
  }
}
*/

console.log('Wealth chart backup loaded for future re-use. See comments.');
