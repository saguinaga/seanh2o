/**
 * Interactive Time-to-Yes dashboard. Demo data only.
 * Filters, clickable KPIs/funnel/aging, policy alerts → Exception Queue.
 */
(function () {
  const PRODUCTS = {
    all: 'All products',
    bridge: 'Bridge',
    rental: 'Rental term',
    bfr: 'Build-for-rent',
  };

  /** Base series by product (illustrative) */
  const DATA = {
    all: {
      appsIn: 142,
      appsDelta: 8,
      medianDecision: 6.2,
      medianDelta: 0.4,
      p90Fund: 11,
      p90Delta: -0.6,
      stuck: 27,
      stuckDelta: 3,
      policyHold: 11,
      dualSystem: 4,
      sparkApps: [98, 105, 112, 118, 121, 130, 142],
      sparkDecision: [7.1, 6.9, 6.8, 6.5, 6.4, 6.3, 6.2],
      sparkStuck: [18, 20, 22, 21, 24, 25, 27],
      funnel: [
        { id: 'app', name: 'Application in', count: 38, conv: null, stuck: false },
        { id: 'uw', name: 'In underwriting', count: 41, conv: 0.78, stuck: false },
        { id: 'cond', name: 'Approved w/ conditions', count: 33, conv: 0.71, stuck: true },
        { id: 'ctf', name: 'Clear to fund', count: 18, conv: 0.55, stuck: false },
        { id: 'funded', name: 'Funded (7d)', count: 24, conv: 0.88, stuck: false },
      ],
      aging: {
        // rows: stages, cols: 0-1d, 2-3d, 4-6d, 7d+
        labels: ['App in', 'Underwriting', 'Conditions', 'Clear to fund'],
        matrix: [
          [12, 14, 8, 4],
          [8, 11, 13, 9],
          [5, 7, 10, 11],
          [9, 5, 3, 1],
        ],
      },
      reasons: [
        { name: 'Missing docs / disclosures', n: 34, reg: true },
        { name: 'Entity / KYC mismatch', n: 18, reg: true },
        { name: 'Valuation hold', n: 16, reg: false },
        { name: 'Dual-system status', n: 12, reg: true },
        { name: 'Credit open item', n: 11, reg: false },
      ],
      watch: [
        { file: 'LF-10455', why: 'Conditions + disclosure gap · Tier A', pill: 'policy', kind: 'reg' },
        { file: 'LF-10482', why: 'KYC co-borrower entity · 2d over SLA', pill: 'KYC', kind: 'reg' },
        { file: 'LF-10518', why: 'Wrong loan-type App rules template', pill: 'App rules', kind: 'reg' },
        { file: 'LF-10470', why: 'CRM vs LOS stage mismatch', pill: 'Audit', kind: 'sla' },
      ],
    },
    bridge: {
      appsIn: 64,
      appsDelta: 5,
      medianDecision: 5.4,
      medianDelta: 0.2,
      p90Fund: 9.5,
      p90Delta: -0.3,
      stuck: 14,
      stuckDelta: 2,
      policyHold: 6,
      dualSystem: 2,
      sparkApps: [44, 48, 50, 52, 55, 60, 64],
      sparkDecision: [6.0, 5.9, 5.7, 5.6, 5.5, 5.5, 5.4],
      sparkStuck: [9, 10, 11, 11, 12, 13, 14],
      funnel: [
        { id: 'app', name: 'Application in', count: 16, conv: null, stuck: false },
        { id: 'uw', name: 'In underwriting', count: 19, conv: 0.82, stuck: false },
        { id: 'cond', name: 'Approved w/ conditions', count: 15, conv: 0.68, stuck: true },
        { id: 'ctf', name: 'Clear to fund', count: 9, conv: 0.52, stuck: false },
        { id: 'funded', name: 'Funded (7d)', count: 12, conv: 0.9, stuck: false },
      ],
      aging: {
        labels: ['App in', 'Underwriting', 'Conditions', 'Clear to fund'],
        matrix: [
          [6, 5, 3, 2],
          [4, 6, 5, 4],
          [2, 3, 5, 5],
          [5, 2, 1, 1],
        ],
      },
      reasons: [
        { name: 'Missing docs / disclosures', n: 16, reg: true },
        { name: 'Entity / KYC mismatch', n: 9, reg: true },
        { name: 'Wrong App rules template', n: 7, reg: true },
        { name: 'Valuation hold', n: 6, reg: false },
        { name: 'Dual-system status', n: 5, reg: true },
      ],
      watch: [
        { file: 'LF-10518', why: 'Wrong loan-type App rules template', pill: 'App rules', kind: 'reg' },
        { file: 'LF-10455', why: 'Conditions + disclosure gap', pill: 'policy', kind: 'reg' },
        { file: 'LF-10482', why: 'KYC mismatch', pill: 'KYC', kind: 'reg' },
      ],
    },
    rental: {
      appsIn: 51,
      appsDelta: 2,
      medianDecision: 7.1,
      medianDelta: 0.6,
      p90Fund: 12.5,
      p90Delta: 0.4,
      stuck: 9,
      stuckDelta: 1,
      policyHold: 3,
      dualSystem: 1,
      sparkApps: [40, 42, 44, 45, 47, 49, 51],
      sparkDecision: [6.8, 6.9, 7.0, 7.0, 7.1, 7.1, 7.1],
      sparkStuck: [6, 7, 7, 8, 8, 9, 9],
      funnel: [
        { id: 'app', name: 'Application in', count: 14, conv: null, stuck: false },
        { id: 'uw', name: 'In underwriting', count: 13, conv: 0.74, stuck: false },
        { id: 'cond', name: 'Approved w/ conditions', count: 12, conv: 0.76, stuck: true },
        { id: 'ctf', name: 'Clear to fund', count: 6, conv: 0.5, stuck: false },
        { id: 'funded', name: 'Funded (7d)', count: 8, conv: 0.85, stuck: false },
      ],
      aging: {
        labels: ['App in', 'Underwriting', 'Conditions', 'Clear to fund'],
        matrix: [
          [4, 5, 3, 2],
          [3, 3, 4, 3],
          [2, 3, 4, 3],
          [3, 2, 1, 0],
        ],
      },
      reasons: [
        { name: 'State disclosure stamp', n: 11, reg: true },
        { name: 'Missing docs / disclosures', n: 10, reg: true },
        { name: 'Valuation hold', n: 8, reg: false },
        { name: 'Credit open item', n: 5, reg: false },
      ],
      watch: [
        { file: 'LF-10491', why: 'State disclosure not stamped', pill: 'State', kind: 'reg' },
        { file: 'LF-10510', why: 'Funding handoff aging', pill: 'SLA', kind: 'sla' },
      ],
    },
    bfr: {
      appsIn: 27,
      appsDelta: 1,
      medianDecision: 8.0,
      medianDelta: 0.1,
      p90Fund: 14,
      p90Delta: -0.2,
      stuck: 4,
      stuckDelta: 0,
      policyHold: 2,
      dualSystem: 1,
      sparkApps: [18, 20, 21, 22, 24, 25, 27],
      sparkDecision: [8.2, 8.1, 8.1, 8.0, 8.0, 8.0, 8.0],
      sparkStuck: [3, 3, 4, 4, 4, 4, 4],
      funnel: [
        { id: 'app', name: 'Application in', count: 8, conv: null, stuck: false },
        { id: 'uw', name: 'In underwriting', count: 9, conv: 0.7, stuck: false },
        { id: 'cond', name: 'Approved w/ conditions', count: 6, conv: 0.65, stuck: true },
        { id: 'ctf', name: 'Clear to fund', count: 3, conv: 0.48, stuck: false },
        { id: 'funded', name: 'Funded (7d)', count: 4, conv: 0.8, stuck: false },
      ],
      aging: {
        labels: ['App in', 'Underwriting', 'Conditions', 'Clear to fund'],
        matrix: [
          [2, 3, 2, 1],
          [1, 2, 3, 3],
          [1, 1, 2, 2],
          [1, 1, 1, 0],
        ],
      },
      reasons: [
        { name: 'Overlay without reason code', n: 5, reg: true },
        { name: 'Missing docs / disclosures', n: 4, reg: true },
        { name: 'Valuation hold', n: 3, reg: false },
      ],
      watch: [
        { file: 'LF-10502', why: 'Pricing overlay missing rationale', pill: 'Fair lending', kind: 'reg' },
      ],
    },
  };

  const state = {
    product: 'all',
    window: '7d',
    // First paint for hiring manager: outcomes, then they can flip to Ops
    role: 'exec', // ops | exec
    focus: null, // kpi id or stage
    agingCell: null,
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function data() {
    const d = DATA[state.product] || DATA.all;
    // crude 30d scale
    if (state.window === '30d') {
      return scaleWindow(d, 3.2);
    }
    return d;
  }

  function scaleWindow(d, f) {
    const clone = JSON.parse(JSON.stringify(d));
    clone.appsIn = Math.round(d.appsIn * f);
    clone.stuck = Math.round(d.stuck * f * 0.9);
    clone.policyHold = Math.round(d.policyHold * f * 0.85);
    clone.dualSystem = Math.round(d.dualSystem * f * 0.8);
    clone.funnel = d.funnel.map((s) =>
      Object.assign({}, s, {
        count: s.id === 'funded' ? Math.round(s.count * f) : Math.round(s.count * Math.min(f, 1.8)),
      })
    );
    clone.aging.matrix = d.aging.matrix.map((row) => row.map((n) => Math.round(n * Math.min(f, 1.6))));
    clone.reasons = d.reasons.map((r) => Object.assign({}, r, { n: Math.round(r.n * f * 0.9) }));
    return clone;
  }

  function sparkSvg(series, color) {
    if (!series || !series.length) return '';
    const w = 120;
    const h = 28;
    const min = Math.min.apply(null, series);
    const max = Math.max.apply(null, series);
    const span = max - min || 1;
    const pts = series
      .map(function (v, i) {
        const x = (i / (series.length - 1)) * w;
        const y = h - 2 - ((v - min) / span) * (h - 4);
        return x.toFixed(1) + ',' + y.toFixed(1);
      })
      .join(' ');
    return (
      '<svg class="spark" viewBox="0 0 ' +
      w +
      ' ' +
      h +
      '" preserveAspectRatio="none" aria-hidden="true">' +
      '<polyline fill="none" stroke="' +
      color +
      '" stroke-width="2" points="' +
      pts +
      '"/>' +
      '</svg>'
    );
  }

  function deltaHtml(n, invert) {
    // invert: true means down is good (e.g. cycle time)
    if (n === 0) return '<span class="delta flat">flat vs prior</span>';
    const good = invert ? n < 0 : n > 0;
    const cls = n === 0 ? 'flat' : good ? 'down' : 'up';
    // for stuck count, up is bad
    const cls2 = invert ? (n < 0 ? 'down' : 'up') : n > 0 ? 'up' : 'down';
    const arrow = n > 0 ? '▲' : '▼';
    const abs = Math.abs(n);
    const unit = abs < 3 && String(n).indexOf('.') !== -1 ? abs.toFixed(1) : String(abs);
    return '<span class="delta ' + cls2 + '">' + arrow + ' ' + unit + ' vs prior</span>';
  }

  function navigateExceptions() {
    const chip = document.querySelector('[data-shell-app="exceptions"][data-shell-view="queue"]');
    if (chip) chip.click();
  }

  function condCount(d) {
    const row = d.funnel.find(function (s) {
      return s.id === 'cond';
    });
    return row ? row.count : 0;
  }

  function fundedCount(d) {
    const row = d.funnel.find(function (s) {
      return s.id === 'funded';
    });
    return row ? row.count : 0;
  }

  function conversionPct(d) {
    const funded = fundedCount(d);
    if (!d.appsIn) return 0;
    return Math.round((funded / d.appsIn) * 1000) / 10;
  }

  function productCompareRows() {
    // Leadership product scorecard from base DATA (not window-scaled noise)
    return [
      { name: 'Bridge', med: DATA.bridge.medianDecision, stuck: DATA.bridge.stuck, funded: 12, apps: DATA.bridge.appsIn },
      { name: 'Rental term', med: DATA.rental.medianDecision, stuck: DATA.rental.stuck, funded: 8, apps: DATA.rental.appsIn },
      { name: 'Build-for-rent', med: DATA.bfr.medianDecision, stuck: DATA.bfr.stuck, funded: 4, apps: DATA.bfr.appsIn },
    ];
  }

  function setChrome(d) {
    const title = $('#dash-title');
    const lead = $('#dash-lead');
    if (state.role === 'exec') {
      if (title) title.textContent = 'Leadership · outcomes';
      if (lead)
        lead.textContent =
          'Board-room view: volume, time to yes, conversion, and product comparison. Not the act-now queue — that lives on Ops desk.';
    } else {
      if (title) title.textContent = 'Ops desk · work the queue';
      if (lead)
        lead.textContent =
          'Working surface for people clearing applications today: stuck SLA, aging heat, act-now list, jump to the exception queue.';
    }
  }

  function setInsight(d) {
    const el = $('#dash-insight');
    if (!el) return;
    let text = '';
    let actions = '';

    if (state.role === 'exec') {
      if (state.focus === 'decision' || state.focus === 'ttd') {
        text =
          '<strong>Time to yes.</strong> Median decision is the headline. If it rises while apps rise, you have a capacity or definition problem, not a marketing problem.';
        actions = '<button type="button" class="secondary" data-clear-focus>Clear focus</button>';
      } else if (state.focus === 'conv' || state.focus === 'funded') {
        text =
          '<strong>Throughput.</strong> Funded and conversion answer “are we closing the path?” Pair with fallout after approval on the reports tab if this softens.';
        actions = '<button type="button" class="secondary" data-clear-focus>Clear focus</button>';
      } else if (state.focus === 'stuck' || state.focus === 'apps') {
        text =
          '<strong>Pressure signal.</strong> Volume and stuck counts are leadership early warnings. Ops desk owns the row-level work.';
        actions =
          '<button type="button" data-switch-ops>Switch to Ops desk</button>' +
          '<button type="button" class="secondary" data-clear-focus>Clear focus</button>';
      } else {
        text =
          '<strong>Leadership mode.</strong> You are looking at outcomes and product health. For who touches which application today, switch to Ops desk.';
        actions = '<button type="button" data-switch-ops>Open Ops desk</button>';
      }
    } else {
      if (state.focus === 'stuck' || state.focus === 'cond') {
        text =
          '<strong>Work these next.</strong> Conditions and past-SLA apps are where time-to-yes dies. Open the exception queue and claim.';
        actions =
          '<button type="button" data-go-eq>Open Exception Queue</button>' +
          '<button type="button" class="secondary" data-clear-focus>Clear focus</button>';
      } else if (state.focus === 'policy') {
        text =
          '<strong>Docs / rules blockers.</strong> Completeness and eligibility holds — company-side checks so the broker sees progress, not silence.';
        actions =
          '<button type="button" data-go-eq>Work exceptions</button>' +
          '<button type="button" class="secondary" data-clear-focus>Clear focus</button>';
      } else if (state.focus === 'aging' || state.agingCell) {
        text =
          '<strong>Aging cell selected.</strong> Put an owner on 7d+ buckets. Do not let WIP sit without a name.';
        actions =
          '<button type="button" data-go-eq>Exception Queue</button>' +
          '<button type="button" class="secondary" data-clear-focus>Clear focus</button>';
      } else {
        text =
          '<strong>Ops mode.</strong> Click a KPI, aging cell, or stall reason — then clear apps. Leadership mode hides the act-now list on purpose.';
        actions = '<button type="button" data-go-eq>Open Exception Queue</button>';
      }
    }

    el.innerHTML =
      '<div style="flex:1;min-width:200px">' +
      text +
      '</div><div style="display:flex;gap:8px;flex-wrap:wrap">' +
      actions +
      '</div>';
    el.querySelectorAll('[data-go-eq]').forEach(function (b) {
      b.addEventListener('click', navigateExceptions);
    });
    el.querySelectorAll('[data-switch-ops]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.role = 'ops';
        document.querySelectorAll('[data-role]').forEach(function (btn) {
          btn.classList.toggle('is-on', btn.getAttribute('data-role') === 'ops');
        });
        render();
      });
    });
    el.querySelectorAll('[data-clear-focus]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.focus = null;
        state.agingCell = null;
        render();
      });
    });
  }

  function renderDetail(d) {
    const pane = $('#dash-detail');
    if (!pane) return;
    if (!state.focus && !state.agingCell) {
      pane.hidden = true;
      return;
    }
    pane.hidden = false;
    if (state.agingCell) {
      const c = state.agingCell;
      pane.innerHTML =
        '<h3>Aging cell: ' +
        d.aging.labels[c.r] +
        ' · ' +
        c.colLabel +
        '</h3>' +
        '<p><strong>' +
        c.n +
        ' applications</strong> in this bucket for ' +
        PRODUCTS[state.product] +
        '. Long aging in conditions or underwriting is where time-to-yes dies. Put owners on 7d+ cells.</p>' +
        '<ul>' +
        '<li>Define the stage clock in writing (when it starts / pauses).</li>' +
        '<li>Route 7d+ applications to the Exception Queue.</li>' +
        '<li>If CRM and LOS disagree on stage, fix source of truth before status goes external.</li>' +
        '</ul>' +
        '<p style="margin-top:8px"><button type="button" class="dash-inline-btn" id="dash-eq-from-aging">Open Exception Queue</button></p>';
      const btn = $('#dash-eq-from-aging');
      if (btn) btn.addEventListener('click', navigateExceptions);
      return;
    }
    const map = {
      apps: 'Applications in is a volume signal only. Pair with conversion and stuck rate so growth does not hide control debt.',
      decision: 'Median time to decision is the “yes” clock. If it rises while apps rise, capacity or definition drift is likely.',
      fund: 'Clear-to-fund p90 is certainty of close. Spikes often mean funding handoff or integration write-back failures.',
      stuck: 'Stuck past SLA is a working queue, not a slide metric. Open Exception Queue and work by AI priority.',
      policy: 'Docs and policy holds are company-side application blockers. Clear them so time-to-yes stays honest.',
      app: 'Application-in stage: watch incomplete package rate and file-complete time.',
      uw: 'Underwriting WIP: owner load and idle time matter more than last-modified.',
      cond: 'Approved-with-conditions is usually the real factory floor. Highest conversion leak in this demo.',
      ctf: 'Clear to fund: integration and dual status checks before external status is trusted.',
      funded: 'Funded is the outcome metric. Compare to apps in for true funnel health.',
    };
    pane.innerHTML =
      '<h3>Selection detail</h3><p>' +
      (map[state.focus] || 'Selection active.') +
      '</p><ul><li>Product filter: ' +
      PRODUCTS[state.product] +
      '</li><li>Window: ' +
      state.window +
      '</li><li>Role lens: ' +
      (state.role === 'exec' ? 'Executive' : 'Ops desk') +
      '</li></ul>';
  }

  function render() {
    const root = $('#dash-root');
    if (!root) return;
    const d = data();
    const maxFunnel = Math.max.apply(
      null,
      d.funnel.map(function (s) {
        return s.count;
      })
    );

    const isExec = state.role === 'exec';
    const asof = $('#dash-asof');
    if (asof) {
      asof.textContent =
        'As of demo clock · ' +
        PRODUCTS[state.product] +
        ' · ' +
        state.window +
        ' · ' +
        (isExec ? 'Leadership' : 'Ops');
    }
    setChrome(d);

    let alerts = '';
    let kpis = '';
    let mainHtml = '';

    if (isExec) {
      alerts =
        '<div class="dash-alert-rail">' +
        '<button type="button" class="dash-alert dash-alert--ok" data-focus="ttd">' +
        '<span class="kicker">Time to yes</span>' +
        '<span class="msg">Median decision ' +
        d.medianDecision +
        'd · ' +
        (d.medianDelta > 0 ? 'slower' : d.medianDelta < 0 ? 'faster' : 'flat') +
        ' vs prior</span>' +
        '<span class="cta">Outcome metric →</span></button>' +
        '<button type="button" class="dash-alert" data-focus="conv">' +
        '<span class="kicker">Throughput</span>' +
        '<span class="msg">' +
        conversionPct(d) +
        '% apps → funded (window) · ' +
        fundedCount(d) +
        ' funded</span>' +
        '<span class="cta">Conversion story →</span></button>' +
        '<button type="button" class="dash-alert dash-alert--sla" data-focus="stuck">' +
        '<span class="kicker">Ops pressure (signal only)</span>' +
        '<span class="msg">' +
        d.stuck +
        ' past SLA · not your worklist</span>' +
        '<span class="cta">Switch to Ops for names →</span></button>' +
        '</div>';

      kpis =
        '<div class="dash-kpi-grid">' +
        kpiBtn('apps', 'Apps in', d.appsIn, deltaHtml(d.appsDelta, false), 'Intake volume', sparkSvg(d.sparkApps, '#0176d3'), '') +
        kpiBtn('ttd', 'Median time to decision', d.medianDecision + 'd', deltaHtml(d.medianDelta, true), 'Clock to a real yes', sparkSvg(d.sparkDecision, '#8c4b02'), 'is-warn') +
        kpiBtn('funded', 'Funded (window)', fundedCount(d), deltaHtml(Math.round(d.appsDelta * 0.4), false), 'Closed throughput', sparkSvg(d.sparkApps, '#2e844a'), 'is-ok') +
        kpiBtn('conv', 'App → funded', conversionPct(d) + '%', deltaHtml(0.3, false), 'Illustrative conversion', sparkSvg(d.sparkStuck, '#0176d3'), '') +
        '</div>';

      const funnelSteps = d.funnel
        .map(function (s) {
          const w = Math.max(12, Math.round((s.count / maxFunnel) * 100));
          const active = state.focus === s.id;
          return (
            '<button type="button" class="funnel-step' +
            (s.stuck ? ' is-stuck' : '') +
            (active ? ' is-active' : '') +
            '" data-stage="' +
            s.id +
            '"><span class="name">' +
            s.name +
            '</span><span class="track"><span class="fill" style="width:' +
            w +
            '%"><span class="fill-label">' +
            s.count +
            '</span></span></span><span class="meta">' +
            (s.conv != null ? Math.round(s.conv * 100) + '% conv' : 'top') +
            '</span></button>'
          );
        })
        .join('');

      const compare = productCompareRows()
        .map(function (p) {
          const conv = Math.round((p.funded / p.apps) * 100);
          return (
            '<tr><td><strong>' +
            p.name +
            '</strong></td><td>' +
            p.med +
            'd</td><td>' +
            p.stuck +
            '</td><td>' +
            conv +
            '%</td></tr>'
          );
        })
        .join('');

      mainHtml =
        '<div class="dash-main">' +
        '<div class="dash-card"><div class="dash-card__h"><h2>Application funnel</h2><span class="sub">Conversion story</span></div>' +
        '<div class="dash-card__b"><div class="funnel">' +
        funnelSteps +
        '</div><p class="funnel-conv">Leadership watches where volume dies between stages — not who claims the next ticket.</p></div></div>' +
        '<div class="dash-card"><div class="dash-card__h"><h2>Product scorecard</h2><span class="sub">Compare paths</span></div>' +
        '<div class="dash-card__b"><div class="drill-table-wrap"><table class="drill-table" style="min-width:0">' +
        '<thead><tr><th>Product</th><th>Med. decision</th><th>Past SLA</th><th>Conv*</th></tr></thead><tbody>' +
        compare +
        '</tbody></table></div><p class="funnel-conv">*Illustrative funded/apps in window. Ops desk has the aging heat and names.</p></div></div>' +
        '</div>' +
        '<div class="dash-main">' +
        '<div class="dash-card"><div class="dash-card__h"><h2>What good looks like</h2><span class="sub">Questions to ask</span></div>' +
        '<div class="dash-card__b"><ul class="dash-exec-list">' +
        '<li>Is median time to decision moving for the right reason (capacity, not soft definitions)?</li>' +
        '<li>Which product path is the slowest, and is that acceptable for the book?</li>' +
        '<li>Is stuck-past-SLA rising faster than apps in? That is an ops investment signal.</li>' +
        '<li>Are we optimizing lock volume while conversion or certainty of close softens?</li>' +
        '</ul>' +
        '<div class="drill-actions" style="margin-top:12px">' +
        '<button type="button" class="is-primary" data-switch-ops>Go to Ops desk for action</button>' +
        '</div></div></div>' +
        '<div class="dash-card"><div class="dash-card__h"><h2>Trend · decision speed</h2><span class="sub">7-point series</span></div>' +
        '<div class="dash-card__b dash-trend-panel">' +
        sparkSvg(d.sparkDecision, '#8c4b02').replace('class="spark"', 'class="spark spark-lg"') +
        '<p class="funnel-conv">Median days to decision (demo series). Down and to the right is better.</p></div></div>' +
        '</div>';
    } else {
      alerts =
        '<div class="dash-alert-rail">' +
        '<button type="button" class="dash-alert dash-alert--sla" data-focus="stuck">' +
        '<span class="kicker">Work now</span>' +
        '<span class="msg">' +
        d.stuck +
        ' apps past SLA</span>' +
        '<span class="cta">Focus stuck → Exception Queue</span></button>' +
        '<button type="button" class="dash-alert dash-alert--reg" data-focus="policy">' +
        '<span class="kicker">Docs / rules</span>' +
        '<span class="msg">' +
        d.policyHold +
        ' apps blocked on completeness or rules</span>' +
        '<span class="cta">Focus blockers →</span></button>' +
        '<button type="button" class="dash-alert" data-focus="cond">' +
        '<span class="kicker">Conditions factory</span>' +
        '<span class="msg">' +
        condCount(d) +
        ' in approved w/ conditions</span>' +
        '<span class="cta">Focus conditions →</span></button>' +
        '</div>';

      kpis =
        '<div class="dash-kpi-grid">' +
        kpiBtn('stuck', 'Stuck past SLA', d.stuck, deltaHtml(d.stuckDelta, true), 'Your primary worklist size', sparkSvg(d.sparkStuck, '#b60554'), 'is-hot') +
        kpiBtn('cond', 'In conditions', condCount(d), deltaHtml(1, true), 'Approved but not clear', sparkSvg(d.sparkStuck, '#fe9339'), 'is-warn') +
        kpiBtn('policy', 'Docs / rules holds', d.policyHold, deltaHtml(0, true), 'Completeness + eligibility', sparkSvg(d.sparkDecision, '#7526c6'), '') +
        kpiBtn('dual', 'System mismatch', d.dualSystem, deltaHtml(0, true), 'CRM vs LOS status', sparkSvg(d.sparkApps, '#0176d3'), 'is-warn') +
        '</div>';

      const colLabels = ['0–1d', '2–3d', '4–6d', '7d+'];
      let agingHtml = '<div class="aging-grid"><div></div>';
      colLabels.forEach(function (c) {
        agingHtml += '<div class="h">' + c + '</div>';
      });
      d.aging.labels.forEach(function (lab, r) {
        agingHtml += '<div class="rh">' + lab + '</div>';
        d.aging.matrix[r].forEach(function (n, c) {
          const lvl = n >= 10 ? 3 : n >= 6 ? 2 : n >= 3 ? 1 : 0;
          const active =
            state.agingCell && state.agingCell.r === r && state.agingCell.c === c ? ' is-active' : '';
          agingHtml +=
            '<button type="button" class="aging-cell lvl' +
            lvl +
            active +
            '" data-ar="' +
            r +
            '" data-ac="' +
            c +
            '" data-n="' +
            n +
            '">' +
            n +
            '</button>';
        });
      });
      agingHtml += '</div>';

      const maxReason = Math.max.apply(
        null,
        d.reasons.map(function (r) {
          return r.n;
        })
      );
      const reasons = d.reasons
        .map(function (r) {
          const w = Math.round((r.n / maxReason) * 100);
          return (
            '<div class="sf-bar-row"><span class="name">' +
            r.name +
            '</span><div class="sf-bar-track"><div class="sf-bar-fill' +
            (r.reg ? ' warn' : '') +
            '" style="width:' +
            w +
            '%"></div></div><span class="num">' +
            r.n +
            '</span></div>'
          );
        })
        .join('');

      const watch = d.watch
        .map(function (w) {
          const id = String(w.file).replace(/^LF-/, 'APP-');
          return (
            '<button type="button" class="watch-row" data-go-eq><span><span class="id">' +
            id +
            '</span><div class="why">' +
            w.why +
            '</div></span><span class="pill' +
            (w.kind === 'sla' ? ' sla' : '') +
            '">' +
            w.pill +
            '</span></button>'
          );
        })
        .join('');

      mainHtml =
        '<div class="dash-main">' +
        '<div class="dash-card"><div class="dash-card__h"><h2>Aging matrix</h2><span class="sub">Where to put people</span></div>' +
        '<div class="dash-card__b">' +
        agingHtml +
        '<p class="funnel-conv">Click a cell. 7d+ buckets need named owners.</p></div></div>' +
        '<div class="dash-card"><div class="dash-card__h"><h2>Act now</h2><span class="sub">Opens Exception Queue</span></div>' +
        '<div class="dash-card__b"><div class="watch-list">' +
        watch +
        '</div></div></div>' +
        '</div>' +
        '<div class="dash-main">' +
        '<div class="dash-card"><div class="dash-card__h"><h2>Why apps stall</h2><span class="sub">Root themes</span></div>' +
        '<div class="dash-card__b"><div class="sf-bars">' +
        reasons +
        '</div></div></div>' +
        '<div class="dash-card"><div class="dash-card__h"><h2>Ops checklist</h2><span class="sub">This shift</span></div>' +
        '<div class="dash-card__b"><ul class="dash-exec-list">' +
        '<li>Claim past-SLA apps before new intake noise.</li>' +
        '<li>Conditions factory: oldest open conditions first.</li>' +
        '<li>Docs/rules holds: clear or route — do not leave silent.</li>' +
        '<li>Dual-system mismatch: fix source of truth before broker status.</li>' +
        '</ul>' +
        '<div class="drill-actions" style="margin-top:12px">' +
        '<button type="button" class="is-primary" data-go-eq>Open Exception Queue</button>' +
        '</div></div></div>' +
        '</div>';
    }

    const body = $('#dash-body');
    if (!body) return;
    body.innerHTML =
      alerts +
      kpis +
      '<div id="dash-insight" class="dash-insight"></div>' +
      mainHtml +
      '<div class="dash-detail-pane" id="dash-detail" hidden></div>' +
      '<p class="dash-footer">' +
      (isExec
        ? 'Leadership view · demo data. Switch to Ops desk for aging heat, named apps, and the exception queue.'
        : 'Ops desk · demo data. Switch to Leadership for outcomes, conversion, and product comparison — not the act-now list.') +
      '</p>';

    setInsight(d);
    renderDetail(d);
    bindBody(d);
  }

  function kpiBtn(id, label, value, delta, hint, spark, extraClass) {
    return (
      '<button type="button" class="dash-kpi ' +
      (extraClass || '') +
      (state.focus === id ? ' is-active' : '') +
      '" data-kpi="' +
      id +
      '">' +
      '<div class="label">' +
      label +
      '</div>' +
      '<div class="value-row"><span class="value">' +
      value +
      '</span>' +
      delta +
      '</div>' +
      '<div class="hint">' +
      hint +
      '</div>' +
      spark +
      '</button>'
    );
  }

  function bindBody(d) {
    document.querySelectorAll('#dash-body [data-focus]').forEach(function (el) {
      el.addEventListener('click', function () {
        const f = el.getAttribute('data-focus');
        // Leadership "stuck" is a signal — offer switch to ops, still set focus
        state.focus = state.focus === f ? null : f;
        state.agingCell = null;
        if (state.role === 'exec' && f === 'stuck') {
          // keep on exec but insight offers switch
        }
        render();
      });
    });
    document.querySelectorAll('#dash-body [data-kpi]').forEach(function (el) {
      el.addEventListener('click', function () {
        const id = el.getAttribute('data-kpi');
        state.focus = state.focus === id ? null : id;
        state.agingCell = null;
        render();
      });
    });
    document.querySelectorAll('#dash-body [data-stage]').forEach(function (el) {
      el.addEventListener('click', function () {
        const id = el.getAttribute('data-stage');
        state.focus = state.focus === id ? null : id;
        state.agingCell = null;
        render();
      });
    });
    document.querySelectorAll('#dash-body [data-ar]').forEach(function (el) {
      el.addEventListener('click', function () {
        const r = parseInt(el.getAttribute('data-ar'), 10);
        const c = parseInt(el.getAttribute('data-ac'), 10);
        const n = parseInt(el.getAttribute('data-n'), 10);
        const colLabels = ['0–1d', '2–3d', '4–6d', '7d+'];
        if (state.agingCell && state.agingCell.r === r && state.agingCell.c === c) {
          state.agingCell = null;
        } else {
          state.agingCell = { r: r, c: c, n: n, colLabel: colLabels[c] };
          state.focus = 'aging';
        }
        render();
      });
    });
    document.querySelectorAll('#dash-body [data-go-eq]').forEach(function (el) {
      el.addEventListener('click', navigateExceptions);
    });
    document.querySelectorAll('#dash-body [data-switch-ops]').forEach(function (el) {
      el.addEventListener('click', function () {
        state.role = 'ops';
        document.querySelectorAll('[data-role]').forEach(function (btn) {
          btn.classList.toggle('is-on', btn.getAttribute('data-role') === 'ops');
        });
        render();
      });
    });
  }

  function bindControls() {
    const product = $('#dash-product');
    const win = $('#dash-window');
    const refresh = $('#dash-refresh');
    if (product) {
      product.addEventListener('change', function () {
        state.product = product.value;
        state.focus = null;
        state.agingCell = null;
        render();
      });
    }
    if (win) {
      win.addEventListener('change', function () {
        state.window = win.value;
        render();
      });
    }
    document.querySelectorAll('[data-role]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.role = btn.getAttribute('data-role');
        document.querySelectorAll('[data-role]').forEach(function (b) {
          b.classList.toggle('is-on', b === btn);
        });
        render();
      });
    });
    if (refresh) {
      refresh.addEventListener('click', function () {
        const asof = $('#dash-asof');
        if (asof) {
          asof.classList.add('is-pulse');
          asof.textContent = 'Recalculated · demo clock ' + new Date().toLocaleTimeString();
          setTimeout(function () {
            asof.classList.remove('is-pulse');
            render();
          }, 400);
        } else {
          render();
        }
      });
    }
  }

  function init() {
    if (!$('#dash-root')) return;
    bindControls();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.mortgageDash = { render: render, init: init };
})();
