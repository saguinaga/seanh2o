/** Loan Applications pipeline with row drill-down. Demo data. */
(function () {
  const APPS = [
    {
      id: 'APP-10482',
      product: 'Bridge',
      stage: 'In underwriting',
      owner: 'M. Chen',
      days: 9,
      tags: ['stuck', 'policy'],
      amount: '890K',
      broker: 'Summit Capital',
      tier: 'A',
      issues: ['Entity/income docs do not match parties on application', 'SLA breached'],
      timeline: [
        { t: 'Day 0', e: 'Application submitted' },
        { t: 'Day 1', e: 'Moved to underwriting' },
        { t: 'Day 3', e: 'Policy check: party mismatch' },
        { t: 'Day 9', e: 'Still open · exception unclaimed' },
      ],
      exceptionId: 'EX-2202',
    },
    {
      id: 'APP-10491',
      product: 'Rental term',
      stage: 'Approved w/ conditions',
      owner: 'J. Ortiz',
      days: 5,
      tags: ['conditions'],
      amount: '2.4M',
      broker: 'Harbor Investors',
      tier: 'B',
      issues: ['Condition docs incomplete'],
      timeline: [
        { t: 'Day 0', e: 'Application submitted' },
        { t: 'Day 4', e: 'Credit decision · approved w/ conditions' },
        { t: 'Day 5', e: 'Waiting on condition package' },
      ],
      exceptionId: 'EX-2203',
    },
    {
      id: 'APP-10502',
      product: 'Build-for-rent',
      stage: 'Application in',
      owner: 'A. Singh',
      days: 1,
      tags: [],
      amount: '3.1M',
      broker: 'Pacific BFR LLC',
      tier: 'C',
      issues: ['Pricing overlay missing reason code (internal)'],
      timeline: [
        { t: 'Day 0', e: 'Application in · checklist 1 item open' },
        { t: 'Day 1', e: 'Intake review' },
      ],
      exceptionId: 'EX-2205',
    },
    {
      id: 'APP-10455',
      product: 'Bridge',
      stage: 'Approved w/ conditions',
      owner: 'M. Chen',
      days: 12,
      tags: ['stuck', 'conditions'],
      amount: '1.2M',
      broker: 'Summit Capital',
      tier: 'A',
      issues: ['Condition package incomplete after approval'],
      timeline: [
        { t: 'Day 0', e: 'Application submitted' },
        { t: 'Day 5', e: 'Approved w/ conditions' },
        { t: 'Day 8', e: 'Broker ping #1' },
        { t: 'Day 12', e: 'Still incomplete' },
      ],
      exceptionId: 'EX-2201',
    },
    {
      id: 'APP-10510',
      product: 'Rental term',
      stage: 'Clear to fund',
      owner: 'Funding desk',
      days: 0,
      tags: [],
      amount: '1.0M',
      broker: 'Harbor Investors',
      tier: 'A',
      issues: [],
      timeline: [{ t: 'Day 0', e: 'Clear to fund · in funding window' }],
      exceptionId: null,
    },
    {
      id: 'APP-10470',
      product: 'Bridge',
      stage: 'In underwriting',
      owner: 'J. Ortiz',
      days: 7,
      tags: ['stuck', 'data'],
      amount: '650K',
      broker: 'Metro Hard Money',
      tier: 'B',
      issues: ['CRM vs LOS status mismatch'],
      timeline: [
        { t: 'Day 0', e: 'Application submitted' },
        { t: 'Day 2', e: 'Underwriting' },
        { t: 'Day 6', e: 'Stage flip · adjacent system lag' },
        { t: 'Day 7', e: 'Dual status' },
      ],
      exceptionId: 'EX-2204',
    },
    {
      id: 'APP-10518',
      product: 'Bridge',
      stage: 'Application in',
      owner: 'A. Singh',
      days: 3,
      tags: ['stuck', 'policy'],
      amount: '1.5M',
      broker: 'Summit Capital',
      tier: 'A',
      issues: ['Product eligibility rules failed; needs rework or product change'],
      timeline: [
        { t: 'Day 0', e: 'Application submitted' },
        { t: 'Day 1', e: 'Rules engine: eligibility fail' },
        { t: 'Day 3', e: 'Waiting broker / ops path decision' },
      ],
      exceptionId: 'EX-2207',
    },
    {
      id: 'APP-22101',
      product: 'Fix-and-flip',
      stage: 'In underwriting',
      owner: 'M. Chen',
      days: 6,
      tags: ['stuck'],
      amount: '780K',
      broker: 'Metro Hard Money',
      tier: 'A',
      issues: ['Draw #2 inspection overdue', 'ARV path depends on scope verification'],
      timeline: [
        { t: 'Day 0', e: 'Application submitted · flip box' },
        { t: 'Day 2', e: 'Underwriting · LTC / ARV review' },
        { t: 'Day 6', e: 'Inspection not returned' },
      ],
      exceptionId: 'EX-2210',
    },
    {
      id: 'APP-33012',
      product: 'DSCR (rental)',
      stage: 'Approved w/ conditions',
      owner: 'J. Ortiz',
      days: 4,
      tags: ['conditions', 'policy'],
      amount: '1.1M',
      broker: 'Harbor Investors',
      tier: 'B',
      issues: ['Rent roll vs DSCR underwrite mismatch'],
      timeline: [
        { t: 'Day 0', e: 'Application in · investor rental' },
        { t: 'Day 3', e: 'Decisioned · conditions on leases' },
        { t: 'Day 4', e: 'Coverage calc does not support rent used' },
      ],
      exceptionId: 'EX-2211',
    },
    {
      id: 'APP-44008',
      product: 'Non-QM / alt docs',
      stage: 'Application in',
      owner: 'A. Singh',
      days: 5,
      tags: ['stuck', 'policy'],
      amount: '920K',
      broker: 'Summit Capital',
      tier: 'A',
      issues: ['Bank-statement package incomplete (12-mo)'],
      timeline: [
        { t: 'Day 0', e: 'Application submitted · alt docs path' },
        { t: 'Day 2', e: 'File incomplete · statements missing months' },
        { t: 'Day 5', e: 'Still incomplete · decision clock should not run' },
      ],
      exceptionId: 'EX-2212',
    },
    {
      id: 'APP-41003',
      product: 'Build-for-rent',
      stage: 'In underwriting',
      owner: 'M. Chen',
      days: 8,
      tags: ['stuck'],
      amount: '4.2M',
      broker: 'Pacific BFR LLC',
      tier: 'B',
      issues: ['Construction milestone 2 package incomplete'],
      timeline: [
        { t: 'Day 0', e: 'Application in · BFR' },
        { t: 'Day 3', e: 'Underwriting construction + rental economics' },
        { t: 'Day 8', e: 'Milestone package blocking next draw' },
      ],
      exceptionId: 'EX-2213',
    },
    {
      id: 'APP-35002',
      product: 'Term rental / portfolio',
      stage: 'Approved w/ conditions',
      owner: 'J. Ortiz',
      days: 3,
      tags: ['conditions'],
      amount: '2.8M',
      broker: 'Harbor Investors',
      tier: 'A',
      issues: ['3-property package · unit data missing on property #2'],
      timeline: [
        { t: 'Day 0', e: 'Portfolio application in' },
        { t: 'Day 2', e: 'Approved w/ conditions' },
        { t: 'Day 3', e: 'Unit-level data gap' },
      ],
      exceptionId: null,
    },
  ];

  let filter = 'all';
  let selectedId = null;

  function $(s) {
    return document.querySelector(s);
  }

  function filtered() {
    if (filter === 'all') return APPS.slice();
    if (filter === 'stuck') return APPS.filter(function (f) { return f.tags.indexOf('stuck') !== -1; });
    if (filter === 'conditions') return APPS.filter(function (f) { return f.tags.indexOf('conditions') !== -1; });
    if (filter === 'policy') return APPS.filter(function (f) { return f.tags.indexOf('policy') !== -1 || f.tags.indexOf('data') !== -1; });
    return APPS.slice();
  }

  function stats() {
    return {
      all: APPS.length,
      stuck: APPS.filter(function (f) { return f.tags.indexOf('stuck') !== -1; }).length,
      conditions: APPS.filter(function (f) { return f.tags.indexOf('conditions') !== -1; }).length,
      policy: APPS.filter(function (f) { return f.tags.indexOf('policy') !== -1 || f.tags.indexOf('data') !== -1; }).length,
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
    if (!selectedId || !rows.some(function (r) { return r.id === selectedId; })) {
      selectedId = rows[0] ? rows[0].id : null;
    }
    const sel = APPS.find(function (f) { return f.id === selectedId; });

    root.innerHTML =
      '<div class="drill-stat-row">' +
      statBtn('all', s.all, 'All apps') +
      statBtn('stuck', s.stuck, 'Past SLA') +
      statBtn('conditions', s.conditions, 'W/ conditions') +
      statBtn('policy', s.policy, 'Rules / data') +
      '</div>' +
      '<div class="drill-layout">' +
      '<div class="drill-list-card">' +
      '<div class="drill-list-card__h"><h2>Loan applications</h2><span class="sub">Click row to drill</span></div>' +
      '<div class="drill-filters">' +
      chip('all', 'All') +
      chip('stuck', 'Past SLA') +
      chip('conditions', 'Conditions') +
      chip('policy', 'Rules / data') +
      '</div>' +
      '<div class="drill-table-wrap"><table class="drill-table"><thead><tr>' +
      '<th>Application</th><th>Product</th><th>Stage</th><th>Owner</th><th>Days</th>' +
      '</tr></thead><tbody>' +
      rows
        .map(function (f) {
          return (
            '<tr data-id="' +
            f.id +
            '" class="' +
            (f.id === selectedId ? 'is-selected' : '') +
            '"><td><strong>' +
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
      (sel ? detailHtml(sel) : '<div class="drill-empty">Select an application</div>') +
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
      const labels = {
        all: 'All open applications',
        stuck: 'Past SLA',
        conditions: 'Approved w/ conditions',
        policy: 'Rules / data holds',
      };
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
      '<div class="drill-detail-card__h"><h2>Application detail</h2><span class="sub">' +
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
      ' · Broker ' +
      f.broker +
      ' (tier ' +
      f.tier +
      ') · Owner ' +
      f.owner +
      '</p>' +
      '<h4>What is blocking time to yes</h4>' +
      (f.issues.length
        ? '<ul>' +
          f.issues
            .map(function (i) {
              return '<li>' + i + '</li>';
            })
            .join('') +
          '</ul>'
        : '<p>No open blockers. In funding window.</p>') +
      '<h4>Application timeline</h4>' +
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
      '<button type="button" data-nav="accelerator:dashboard">Dashboard</button>' +
      '<button type="button" data-nav="accelerator:path">Application path</button>' +
      '</div>' +
      '<p style="margin-top:12px;font-size:0.78rem;color:var(--muted-soft)">Policy and rules checks sit on the company side so applications can move cleanly. The broker/borrower experience is progress toward a real yes.</p>' +
      '</div>'
    );
  }

  function applyShellFilter() {
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
