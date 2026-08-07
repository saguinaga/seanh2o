/**
 * Shared loan product catalog for the case study demo.
 * Definitions from specialty lending notes (DSCR, bridge, fix-and-flip, BFR, etc.).
 * Illustrative metrics only — not client data.
 */
(function (global) {
  var META = {
    all: {
      id: 'all',
      label: 'All products',
      short: 'All',
      tagline: 'Full book · blended view',
      underwrite: 'Mixed',
      hotspots: 'Stage definitions, cross-product conversion, capacity',
      group: 'book',
    },
    bridge: {
      id: 'bridge',
      label: 'Bridge',
      short: 'Bridge',
      tagline: 'Short-term capital · exit-driven',
      underwrite: 'Asset / exit / experience · often interest-only',
      hotspots: 'Maturity, extensions, interest reserves, payoff / refi handoff',
      group: 'bpl',
    },
    fix_flip: {
      id: 'fix_flip',
      label: 'Fix-and-flip',
      short: 'Flip',
      tagline: 'Buy · rehab · sell (or refi out)',
      underwrite: 'ARV, LTC, rehab budget, borrower track record',
      hotspots: 'Draw schedule, inspections, budget changes, holdbacks',
      group: 'bpl',
    },
    dscr: {
      id: 'dscr',
      label: 'DSCR (rental)',
      short: 'DSCR',
      tagline: 'Investor rental · cash-flow underwrite',
      underwrite: 'Property DSCR (rent vs debt), not borrower W-2 DTI',
      hotspots: 'Rent rolls / leases, property-level calcs, investor UX, DSCR/LTV pricing',
      group: 'bpl',
    },
    term_rental: {
      id: 'term_rental',
      label: 'Term rental / portfolio',
      short: 'Term rental',
      tagline: 'Longer hold · stabilized rentals',
      underwrite: 'Stabilized cash flow · portfolio economics',
      hotspots: 'Multi-property packages, term locks, portfolio data model',
      group: 'bpl',
    },
    bfr: {
      id: 'bfr',
      label: 'Build-for-rent',
      short: 'BFR',
      tagline: 'Ground-up or scale rental build',
      underwrite: 'Construction + rental economics',
      hotspots: 'Construction draws, milestones, convert-to-hold, multi-unit data',
      group: 'bpl',
    },
    non_qm: {
      id: 'non_qm',
      label: 'Non-QM / alt docs',
      short: 'Non-QM',
      tagline: 'Outside agency QM box',
      underwrite: 'Bank statements, alt income, expanded credit stories',
      hotspots: 'Doc packages, guideline versions, exception paths, broker education',
      group: 'res',
    },
  };

  /** Illustrative dashboard series per product */
  var DATA = {
    all: {
      appsIn: 286,
      appsDelta: 14,
      medianDecision: 6.4,
      medianDelta: 0.3,
      p90Fund: 12,
      p90Delta: -0.4,
      stuck: 41,
      stuckDelta: 4,
      policyHold: 18,
      dualSystem: 7,
      sparkApps: [210, 228, 240, 251, 262, 274, 286],
      sparkDecision: [7.0, 6.8, 6.7, 6.6, 6.5, 6.5, 6.4],
      sparkStuck: [30, 32, 34, 35, 38, 39, 41],
      funnel: [
        { id: 'app', name: 'Application in', count: 72, conv: null, stuck: false },
        { id: 'uw', name: 'In underwriting', count: 81, conv: 0.76, stuck: false },
        { id: 'cond', name: 'Approved w/ conditions', count: 64, conv: 0.7, stuck: true },
        { id: 'ctf', name: 'Clear to fund', count: 38, conv: 0.54, stuck: false },
        { id: 'funded', name: 'Funded (7d)', count: 48, conv: 0.86, stuck: false },
      ],
      aging: {
        labels: ['App in', 'Underwriting', 'Conditions', 'Clear to fund'],
        matrix: [
          [22, 24, 16, 10],
          [14, 22, 26, 19],
          [10, 14, 20, 20],
          [16, 10, 8, 4],
        ],
      },
      reasons: [
        { name: 'Missing docs / package incomplete', n: 52, reg: true },
        { name: 'Valuation / ARV hold', n: 28, reg: false },
        { name: 'Entity / KYC mismatch', n: 24, reg: true },
        { name: 'Draw / inspection lag', n: 18, reg: false },
        { name: 'Dual-system status', n: 16, reg: true },
        { name: 'Income / DSCR docs', n: 15, reg: true },
      ],
      watch: [
        { file: 'APP-10455', why: 'Bridge · conditions incomplete · Tier A', pill: 'Conditions', kind: 'sla' },
        { file: 'APP-22101', why: 'Fix-and-flip · draw inspection overdue', pill: 'Draws', kind: 'sla' },
        { file: 'APP-33012', why: 'DSCR · rent roll vs underwrite mismatch', pill: 'DSCR', kind: 'reg' },
        { file: 'APP-44008', why: 'Non-QM · bank-statement package incomplete', pill: 'Alt docs', kind: 'reg' },
      ],
    },
    bridge: {
      appsIn: 64,
      appsDelta: 5,
      medianDecision: 5.1,
      medianDelta: 0.2,
      p90Fund: 9.0,
      p90Delta: -0.5,
      stuck: 11,
      stuckDelta: 1,
      policyHold: 4,
      dualSystem: 2,
      sparkApps: [48, 52, 55, 57, 60, 62, 64],
      sparkDecision: [5.6, 5.5, 5.4, 5.3, 5.2, 5.2, 5.1],
      sparkStuck: [8, 9, 9, 10, 10, 11, 11],
      funnel: [
        { id: 'app', name: 'Application in', count: 14, conv: null, stuck: false },
        { id: 'uw', name: 'In underwriting', count: 18, conv: 0.84, stuck: false },
        { id: 'cond', name: 'Approved w/ conditions', count: 12, conv: 0.72, stuck: true },
        { id: 'ctf', name: 'Clear to fund', count: 9, conv: 0.58, stuck: false },
        { id: 'funded', name: 'Funded (7d)', count: 14, conv: 0.91, stuck: false },
      ],
      aging: {
        labels: ['App in', 'Underwriting', 'Conditions', 'Clear to fund'],
        matrix: [
          [5, 5, 3, 1],
          [3, 6, 5, 4],
          [2, 3, 4, 3],
          [4, 3, 1, 1],
        ],
      },
      reasons: [
        { name: 'Exit strategy / payoff docs', n: 9, reg: false },
        { name: 'Interest reserve setup', n: 7, reg: false },
        { name: 'Missing entity docs', n: 6, reg: true },
        { name: 'Extension request backlog', n: 5, reg: false },
        { name: 'Dual-system status', n: 3, reg: true },
      ],
      watch: [
        { file: 'APP-10455', why: 'Conditions incomplete · Tier A broker', pill: 'Conditions', kind: 'sla' },
        { file: 'APP-10482', why: 'Entity mismatch · policy check', pill: 'Entity', kind: 'reg' },
        { file: 'APP-10518', why: 'Eligibility rules fail · product path', pill: 'Rules', kind: 'reg' },
      ],
    },
    fix_flip: {
      appsIn: 52,
      appsDelta: 4,
      medianDecision: 5.8,
      medianDelta: 0.4,
      p90Fund: 10.5,
      p90Delta: 0.2,
      stuck: 9,
      stuckDelta: 2,
      policyHold: 3,
      dualSystem: 1,
      sparkApps: [38, 41, 44, 46, 48, 50, 52],
      sparkDecision: [6.2, 6.1, 6.0, 5.9, 5.9, 5.8, 5.8],
      sparkStuck: [6, 6, 7, 7, 8, 8, 9],
      funnel: [
        { id: 'app', name: 'Application in', count: 12, conv: null, stuck: false },
        { id: 'uw', name: 'In underwriting', count: 15, conv: 0.8, stuck: false },
        { id: 'cond', name: 'Approved w/ conditions', count: 11, conv: 0.69, stuck: true },
        { id: 'ctf', name: 'Clear to fund', count: 7, conv: 0.55, stuck: false },
        { id: 'funded', name: 'Funded (7d)', count: 10, conv: 0.88, stuck: false },
      ],
      aging: {
        labels: ['App in', 'Underwriting', 'Conditions', 'Clear to fund'],
        matrix: [
          [4, 4, 3, 1],
          [2, 5, 5, 3],
          [2, 2, 4, 3],
          [3, 2, 1, 1],
        ],
      },
      reasons: [
        { name: 'ARV / appraisal lag', n: 11, reg: false },
        { name: 'Rehab budget incomplete', n: 9, reg: false },
        { name: 'Draw inspection delay', n: 8, reg: false },
        { name: 'Track record / experience docs', n: 6, reg: true },
        { name: 'Holdback / contractor package', n: 5, reg: false },
      ],
      watch: [
        { file: 'APP-22101', why: 'Draw #2 inspection overdue', pill: 'Draws', kind: 'sla' },
        { file: 'APP-22144', why: 'ARV revision after scope change', pill: 'ARV', kind: 'sla' },
        { file: 'APP-22108', why: 'LTC out of box · needs exception path', pill: 'LTC', kind: 'reg' },
      ],
    },
    dscr: {
      appsIn: 58,
      appsDelta: 3,
      medianDecision: 6.9,
      medianDelta: 0.5,
      p90Fund: 12.0,
      p90Delta: 0.3,
      stuck: 8,
      stuckDelta: 1,
      policyHold: 4,
      dualSystem: 1,
      sparkApps: [44, 47, 50, 52, 54, 56, 58],
      sparkDecision: [7.4, 7.3, 7.2, 7.1, 7.0, 7.0, 6.9],
      sparkStuck: [5, 6, 6, 7, 7, 8, 8],
      funnel: [
        { id: 'app', name: 'Application in', count: 13, conv: null, stuck: false },
        { id: 'uw', name: 'In underwriting', count: 16, conv: 0.77, stuck: false },
        { id: 'cond', name: 'Approved w/ conditions', count: 13, conv: 0.73, stuck: true },
        { id: 'ctf', name: 'Clear to fund', count: 7, conv: 0.52, stuck: false },
        { id: 'funded', name: 'Funded (7d)', count: 9, conv: 0.85, stuck: false },
      ],
      aging: {
        labels: ['App in', 'Underwriting', 'Conditions', 'Clear to fund'],
        matrix: [
          [4, 5, 3, 1],
          [3, 4, 5, 4],
          [2, 3, 4, 4],
          [3, 2, 1, 1],
        ],
      },
      reasons: [
        { name: 'Rent roll / lease package', n: 12, reg: true },
        { name: 'DSCR calc vs rent support', n: 10, reg: false },
        { name: 'Property-level data incomplete', n: 8, reg: false },
        { name: 'Short-term rental income docs', n: 6, reg: true },
        { name: 'Entity / vesting docs', n: 5, reg: true },
      ],
      watch: [
        { file: 'APP-33012', why: 'Rent roll vs underwrite DSCR gap', pill: 'DSCR', kind: 'reg' },
        { file: 'APP-33040', why: 'STR income package incomplete', pill: 'Income', kind: 'sla' },
        { file: 'APP-33019', why: 'Multi-unit lease stack missing units', pill: 'Property', kind: 'sla' },
      ],
    },
    term_rental: {
      appsIn: 41,
      appsDelta: 2,
      medianDecision: 7.2,
      medianDelta: 0.2,
      p90Fund: 13.0,
      p90Delta: 0.1,
      stuck: 6,
      stuckDelta: 0,
      policyHold: 2,
      dualSystem: 1,
      sparkApps: [32, 34, 36, 37, 38, 40, 41],
      sparkDecision: [7.5, 7.4, 7.4, 7.3, 7.3, 7.2, 7.2],
      sparkStuck: [5, 5, 5, 6, 6, 6, 6],
      funnel: [
        { id: 'app', name: 'Application in', count: 10, conv: null, stuck: false },
        { id: 'uw', name: 'In underwriting', count: 11, conv: 0.75, stuck: false },
        { id: 'cond', name: 'Approved w/ conditions', count: 9, conv: 0.74, stuck: true },
        { id: 'ctf', name: 'Clear to fund', count: 5, conv: 0.5, stuck: false },
        { id: 'funded', name: 'Funded (7d)', count: 6, conv: 0.84, stuck: false },
      ],
      aging: {
        labels: ['App in', 'Underwriting', 'Conditions', 'Clear to fund'],
        matrix: [
          [3, 4, 2, 1],
          [2, 3, 3, 3],
          [1, 2, 3, 3],
          [2, 2, 1, 0],
        ],
      },
      reasons: [
        { name: 'Portfolio package incomplete', n: 8, reg: false },
        { name: 'Stabilized occupancy support', n: 6, reg: false },
        { name: 'Multi-property data model gaps', n: 5, reg: false },
        { name: 'Missing entity docs', n: 4, reg: true },
      ],
      watch: [
        { file: 'APP-35002', why: '3-property package · unit missing on #2', pill: 'Portfolio', kind: 'sla' },
        { file: 'APP-35011', why: 'Occupancy schedule stale', pill: 'Occupancy', kind: 'sla' },
      ],
    },
    bfr: {
      appsIn: 34,
      appsDelta: 2,
      medianDecision: 8.4,
      medianDelta: 0.1,
      p90Fund: 15.0,
      p90Delta: -0.2,
      stuck: 5,
      stuckDelta: 1,
      policyHold: 3,
      dualSystem: 1,
      sparkApps: [24, 26, 28, 30, 31, 33, 34],
      sparkDecision: [8.8, 8.7, 8.6, 8.5, 8.5, 8.4, 8.4],
      sparkStuck: [3, 3, 4, 4, 4, 5, 5],
      funnel: [
        { id: 'app', name: 'Application in', count: 9, conv: null, stuck: false },
        { id: 'uw', name: 'In underwriting', count: 10, conv: 0.72, stuck: false },
        { id: 'cond', name: 'Approved w/ conditions', count: 8, conv: 0.68, stuck: true },
        { id: 'ctf', name: 'Clear to fund', count: 4, conv: 0.48, stuck: false },
        { id: 'funded', name: 'Funded (7d)', count: 5, conv: 0.82, stuck: false },
      ],
      aging: {
        labels: ['App in', 'Underwriting', 'Conditions', 'Clear to fund'],
        matrix: [
          [3, 3, 2, 1],
          [2, 3, 3, 2],
          [1, 2, 3, 2],
          [2, 1, 1, 0],
        ],
      },
      reasons: [
        { name: 'Construction milestone package', n: 7, reg: false },
        { name: 'Draw schedule not approved', n: 6, reg: false },
        { name: 'Plans / budget revision', n: 5, reg: false },
        { name: 'Convert-to-hold path unclear', n: 4, reg: false },
        { name: 'Entity / vesting docs', n: 3, reg: true },
      ],
      watch: [
        { file: 'APP-41003', why: 'Milestone 2 package incomplete', pill: 'Milestone', kind: 'sla' },
        { file: 'APP-41017', why: 'Draw schedule vs budget mismatch', pill: 'Draws', kind: 'sla' },
      ],
    },
    non_qm: {
      appsIn: 37,
      appsDelta: 3,
      medianDecision: 6.6,
      medianDelta: 0.3,
      p90Fund: 11.5,
      p90Delta: 0.2,
      stuck: 7,
      stuckDelta: 1,
      policyHold: 5,
      dualSystem: 1,
      sparkApps: [26, 28, 30, 32, 34, 35, 37],
      sparkDecision: [7.0, 6.9, 6.8, 6.7, 6.7, 6.6, 6.6],
      sparkStuck: [4, 5, 5, 6, 6, 7, 7],
      funnel: [
        { id: 'app', name: 'Application in', count: 11, conv: null, stuck: false },
        { id: 'uw', name: 'In underwriting', count: 12, conv: 0.74, stuck: false },
        { id: 'cond', name: 'Approved w/ conditions', count: 10, conv: 0.71, stuck: true },
        { id: 'ctf', name: 'Clear to fund', count: 5, conv: 0.51, stuck: false },
        { id: 'funded', name: 'Funded (7d)', count: 7, conv: 0.83, stuck: false },
      ],
      aging: {
        labels: ['App in', 'Underwriting', 'Conditions', 'Clear to fund'],
        matrix: [
          [3, 4, 3, 1],
          [2, 3, 4, 3],
          [2, 2, 3, 3],
          [2, 2, 1, 0],
        ],
      },
      reasons: [
        { name: 'Bank statement stack incomplete', n: 11, reg: true },
        { name: 'Guideline version mismatch', n: 7, reg: true },
        { name: 'Alt income calc questions', n: 6, reg: false },
        { name: 'Credit story / LOX needed', n: 5, reg: true },
        { name: 'Broker education / rework', n: 4, reg: false },
      ],
      watch: [
        { file: 'APP-44008', why: '12-mo bank statements incomplete', pill: 'Alt docs', kind: 'reg' },
        { file: 'APP-44021', why: 'Guideline set v3 vs v4 conflict', pill: 'Guidelines', kind: 'reg' },
        { file: 'APP-44015', why: 'LOX on credit event missing', pill: 'Credit', kind: 'sla' },
      ],
    },
  };

  var ORDER = ['bridge', 'fix_flip', 'dscr', 'term_rental', 'bfr', 'non_qm'];

  function labels() {
    var out = { all: META.all.label };
    ORDER.forEach(function (id) {
      out[id] = META[id].label;
    });
    return out;
  }

  function scorecardRows() {
    return ORDER.map(function (id) {
      var d = DATA[id];
      var m = META[id];
      return {
        id: id,
        name: m.short,
        label: m.label,
        med: d.medianDecision,
        stuck: d.stuck,
        funded: d.funnel[d.funnel.length - 1].count,
        apps: d.appsIn,
        tagline: m.tagline,
      };
    });
  }

  function fillSelect(sel) {
    if (!sel) return;
    sel.innerHTML = '';
    var optAll = document.createElement('option');
    optAll.value = 'all';
    optAll.textContent = 'All products';
    sel.appendChild(optAll);

    var g1 = document.createElement('optgroup');
    g1.label = 'Business-purpose';
    ['bridge', 'fix_flip', 'dscr', 'term_rental', 'bfr'].forEach(function (id) {
      var o = document.createElement('option');
      o.value = id;
      o.textContent = META[id].label;
      g1.appendChild(o);
    });
    sel.appendChild(g1);

    var g2 = document.createElement('optgroup');
    g2.label = 'Expanded residential';
    var o2 = document.createElement('option');
    o2.value = 'non_qm';
    o2.textContent = META.non_qm.label;
    g2.appendChild(o2);
    sel.appendChild(g2);
  }

  function renderChips(container, selectedId, onPick) {
    if (!container) return;
    container.innerHTML = '';
    var ids = ['all'].concat(ORDER);
    ids.forEach(function (id) {
      var m = META[id];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'prod-chip' + (id === selectedId ? ' is-on' : '');
      btn.setAttribute('data-product', id);
      btn.innerHTML =
        '<span class="prod-chip-name">' +
        m.short +
        '</span><span class="prod-chip-tag">' +
        m.tagline +
        '</span>';
      btn.addEventListener('click', function () {
        onPick(id);
      });
      container.appendChild(btn);
    });
  }

  function renderDna(container, productId) {
    if (!container) return;
    var m = META[productId] || META.all;
    container.hidden = false;
    container.innerHTML =
      '<div class="prod-dna">' +
      '<div class="prod-dna-kicker">Product DNA · demo</div>' +
      '<div class="prod-dna-title">' +
      m.label +
      '</div>' +
      '<p class="prod-dna-tag">' +
      m.tagline +
      '</p>' +
      '<div class="prod-dna-grid">' +
      '<div><span class="prod-dna-label">Underwrite focus</span><span class="prod-dna-val">' +
      m.underwrite +
      '</span></div>' +
      '<div><span class="prod-dna-label">System hot spots</span><span class="prod-dna-val">' +
      m.hotspots +
      '</span></div>' +
      '</div></div>';
  }

  global.LoanProducts = {
    META: META,
    DATA: DATA,
    ORDER: ORDER,
    labels: labels,
    scorecardRows: scorecardRows,
    fillSelect: fillSelect,
    renderChips: renderChips,
    renderDna: renderDna,
  };
})(window);
