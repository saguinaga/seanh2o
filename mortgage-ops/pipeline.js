/** Loan Pipeline with row drill-down. Demo data. */
(function () {
  const FILES = [
    {
      id: 'LF-10482',
      product: 'Bridge',
      stage: 'In underwriting',
      owner: 'M. Chen',
      days: 9,
      tags: ['stuck', 'reg'],
      amount: '890K',
      seller: 'Summit Capital',
      tier: 'A',
      issues: ['Identity verification mismatch on co-borrower entity', 'SLA breached'],
      timeline: [
        { t: 'Day 0', e: 'Application in · package received' },
        { t: 'Day 1', e: 'Moved to underwriting' },
        { t: 'Day 3', e: 'KYC flag raised' },
        { t: 'Day 9', e: 'Still open · no owner claim on exception' },
      ],
      exceptionId: 'EX-2202',
    },
    {
      id: 'LF-10491',
      product: 'Rental term',
      stage: 'Approved w/ conditions',
      owner: 'J. Ortiz',
      days: 5,
      tags: ['conditions', 'reg'],
      amount: '2.4M',
      seller: 'Harbor Investors',
      tier: 'B',
      issues: ['State-specific disclosure not stamped'],
      timeline: [
        { t: 'Day 0', e: 'Application in' },
        { t: 'Day 4', e: 'Credit decision · approved w/ conditions' },
        { t: 'Day 5', e: 'Disclosure stamp missing in package' },
      ],
      exceptionId: 'EX-2203',
    },
    {
      id: 'LF-10502',
      product: 'Build-for-rent',
      stage: 'Application in',
      owner: 'A. Singh',
      days: 1,
      tags: [],
      amount: '3.1M',
      seller: 'Pacific BFR LLC',
      tier: 'C',
      issues: ['Manual pricing overlay without reason code (watch)'],
      timeline: [
        { t: 'Day 0', e: 'Application in · incomplete checklist 1 item' },
        { t: 'Day 1', e: 'Overlay noted without structured code' },
      ],
      exceptionId: 'EX-2205',
    },
    {
      id: 'LF-10455',
      product: 'Bridge',
      stage: 'Approved w/ conditions',
      owner: 'M. Chen',
      days: 12,
      tags: ['stuck', 'conditions', 'reg'],
      amount: '1.2M',
      seller: 'Summit Capital',
      tier: 'A',
      issues: ['Condition package incomplete', 'Disclosure gap'],
      timeline: [
        { t: 'Day 0', e: 'Application in' },
        { t: 'Day 5', e: 'Approved w/ conditions' },
        { t: 'Day 8', e: 'Partner ping #1' },
        { t: 'Day 12', e: 'Still incomplete · exception open' },
      ],
      exceptionId: 'EX-2201',
    },
    {
      id: 'LF-10510',
      product: 'Rental term',
      stage: 'Clear to fund',
      owner: 'Funding desk',
      days: 0,
      tags: [],
      amount: '1.0M',
      seller: 'Harbor Investors',
      tier: 'A',
      issues: [],
      timeline: [
        { t: 'Day 0', e: 'Clear to fund · waiting funding window' },
      ],
      exceptionId: null,
    },
    {
      id: 'LF-10470',
      product: 'Bridge',
      stage: 'In underwriting',
      owner: 'J. Ortiz',
      days: 7,
      tags: ['stuck', 'reg'],
      amount: '650K',
      seller: 'Metro Hard Money',
      tier: 'B',
      issues: ['Integration write-back failed · dual status risk'],
      timeline: [
        { t: 'Day 0', e: 'Application in' },
        { t: 'Day 2', e: 'Underwriting' },
        { t: 'Day 6', e: 'Stage flip attempted · adjacent system lag' },
        { t: 'Day 7', e: 'CRM and LOS disagree' },
      ],
      exceptionId: 'EX-2204',
    },
    {
      id: 'LF-10518',
      product: 'Bridge',
      stage: 'Application in',
      owner: 'A. Singh',
      days: 3,
      tags: ['stuck', 'reg'],
      amount: '1.5M',
      seller: 'Summit Capital',
      tier: 'A',
      issues: ['Wrong loan-type contract template on offer package'],
      timeline: [
        { t: 'Day 0', e: 'Application in' },
        { t: 'Day 1', e: 'Offer package generated' },
        { t: 'Day 3', e: 'Template mismatch found · stop the line' },
      ],
      exceptionId: 'EX-2207',
    },
  ];

  let filter = 'all';
  let selectedId = null;

  function $(s) {
    return document.querySelector(s);
  }

  function filtered() {
    if (filter === 'all') return FILES.slice();
    if (filter === 'stuck') return FILES.filter((f) => f.tags.indexOf('stuck') !== -1);
    if (filter === 'conditions') return FILES.filter((f) => f.tags.indexOf('conditions') !== -1);
    if (filter === 'reg') return FILES.filter((f) => f.tags.indexOf('reg') !== -1);
    return FILES.slice();
  }

  function stats() {
    return {
      all: FILES.length,
      stuck: FILES.filter((f) => f.tags.indexOf('stuck') !== -1).length,
      conditions: FILES.filter((f) => f.tags.indexOf('conditions') !== -1).length,
      reg: FILES.filter((f) => f.tags.indexOf('reg') !== -1).length,
    };
  }

  function go(app, view) {
    if (window.mortgageShell && window.mortgageShell.navigate) {
      window.mortgageShell.navigate(app, view);
    }
  }

  function render() {
    const root = $('#pipeline-root');
    if (!root) return;
    const s = stats();
    const rows = filtered();
    if (!selectedId || !rows.some((r) => r.id === selectedId)) {
      selectedId = rows[0] ? rows[0].id : null;
    }
    const sel = FILES.find((f) => f.id === selectedId);

    root.innerHTML =
      '<div class="drill-stat-row">' +
      statBtn('all', s.all, 'All open') +
      statBtn('stuck', s.stuck, 'Past SLA') +
      statBtn('conditions', s.conditions, 'W/ conditions') +
      statBtn('reg', s.reg, 'Regulated flags') +
      '</div>' +
      '<div class="drill-layout">' +
      '<div class="drill-list-card">' +
      '<div class="drill-list-card__h"><h2>Loan files</h2><span class="sub">Click row to drill</span></div>' +
      '<div class="drill-filters">' +
      chip('all', 'All') +
      chip('stuck', 'Past SLA') +
      chip('conditions', 'Conditions') +
      chip('reg', 'Regulated') +
      '</div>' +
      '<div class="drill-table-wrap"><table class="drill-table"><thead><tr>' +
      '<th>File</th><th>Product</th><th>Stage</th><th>Owner</th><th>Days</th>' +
      '</tr></thead><tbody>' +
      rows
        .map(function (f) {
          return (
            '<tr data-id="' +
            f.id +
            '" class="' +
            (f.id === selectedId ? 'is-selected' : '') +
            '">' +
            '<td><strong>' +
            f.id +
            '</strong></td><td>' +
            f.product +
            '</td><td>' +
            f.stage +
            '</td><td>' +
            f.owner +
            '</td><td>' +
            f.days +
            '</td></tr>'
          );
        })
        .join('') +
      '</tbody></table></div></div>' +
      '<div class="drill-detail-card">' +
      (sel ? detailHtml(sel) : '<div class="drill-empty">Select a loan file</div>') +
      '</div></div>';

    root.querySelectorAll('[data-stat]').forEach(function (el) {
      el.addEventListener('click', function () {
        filter = el.getAttribute('data-stat');
        render();
      });
    });
    root.querySelectorAll('[data-filter]').forEach(function (el) {
      el.addEventListener('click', function () {
        filter = el.getAttribute('data-filter');
        render();
      });
    });
    root.querySelectorAll('tr[data-id]').forEach(function (el) {
      el.addEventListener('click', function () {
        selectedId = el.getAttribute('data-id');
        render();
      });
    });
    root.querySelectorAll('[data-nav]').forEach(function (el) {
      el.addEventListener('click', function () {
        const parts = el.getAttribute('data-nav').split(':');
        go(parts[0], parts[1]);
      });
    });

    const cap = $('#pipeline-view-caption');
    if (cap) {
      const labels = { all: 'All open files', stuck: 'Past SLA', conditions: 'Approved w/ conditions', reg: 'Regulated flags' };
      cap.textContent = (labels[filter] || 'List') + ' · click any row';
    }
  }

  function statBtn(id, n, label) {
    return (
      '<button type="button" class="drill-stat' +
      (filter === id ? ' is-on' : '') +
      '" data-stat="' +
      id +
      '"><div class="n">' +
      n +
      '</div><div class="l">' +
      label +
      '</div></button>'
    );
  }

  function chip(id, label) {
    return (
      '<button type="button" class="drill-chip' +
      (filter === id ? ' is-on' : '') +
      '" data-filter="' +
      id +
      '">' +
      label +
      '</button>'
    );
  }

  function detailHtml(f) {
    return (
      '<div class="drill-detail-card__h"><h2>File detail</h2><span class="sub">' +
      f.id +
      '</span></div><div class="drill-detail-card__b">' +
      '<h3>' +
      f.id +
      ' · ' +
      f.product +
      '</h3>' +
      '<p class="meta">Stage <strong>' +
      f.stage +
      '</strong> · ' +
      f.days +
      'd in stage · ' +
      f.amount +
      ' · Seller ' +
      f.seller +
      ' (Tier ' +
      f.tier +
      ') · Owner ' +
      f.owner +
      '</p>' +
      '<h4>Why this file matters</h4>' +
      (f.issues.length
        ? '<ul>' + f.issues.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>'
        : '<p>No open control flags. Funding handoff watch only.</p>') +
      '<h4>Stage timeline (illustrative)</h4>' +
      '<div class="drill-timeline">' +
      f.timeline
        .map(function (ev) {
          return '<div class="ev"><span class="t">' + ev.t + '</span><strong>' + ev.e + '</strong></div>';
        })
        .join('') +
      '</div>' +
      '<h4>Drill further</h4>' +
      '<div class="drill-actions">' +
      (f.exceptionId
        ? '<button type="button" class="is-primary" data-nav="exceptions:queue">Open related exception</button>'
        : '') +
      '<button type="button" data-nav="accelerator:dashboard">See on dashboard</button>' +
      '<button type="button" data-nav="accelerator:path">Path prototype</button>' +
      '</div>' +
      '<p style="margin-top:12px;font-size:0.78rem;color:var(--muted-soft)">Regulated angle: multi-party files need a trail (who owned the hold, what package went out). Same pattern as offer/contract automation across lenders.</p>' +
      '</div>'
    );
  }

  function applyShellFilter() {
    // when shell switches list views
    if (window.mortgageShell && window.mortgageShell.getState) {
      const st = window.mortgageShell.getState();
      if (st.appId === 'pipeline') {
        if (st.viewId === 'past-sla') filter = 'stuck';
        else if (st.viewId === 'conditions') filter = 'conditions';
        else if (st.viewId === 'all-open') filter = 'all';
      }
    }
  }

  function init() {
    if (!$('#pipeline-root')) return;
    applyShellFilter();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.mortgagePipeline = {
    render: function () {
      applyShellFilter();
      render();
    },
    selectFile: function (id) {
      selectedId = id;
      render();
    },
  };
})();
