/**
 * Loan Applications: connected working list for Xtreme demo.
 * Same product catalog as dashboard; same APP ids as exceptions/watchlists.
 */
(function () {
  var LP = window.LoanProducts;

  var APPS = [
    {
      id: 'APP-10482',
      productKey: 'bridge',
      product: 'Bridge',
      stage: 'In underwriting',
      stageId: 'uw',
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
      onWatch: true,
      conditions: [],
      notes:
        'Policy hold on entity/income parties. Not a conditions factory item until credit decision lands.',
    },
    {
      id: 'APP-10491',
      productKey: 'term_rental',
      product: 'Term rental / portfolio',
      stage: 'Approved w/ conditions',
      stageId: 'cond',
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
      onWatch: false,
      conditions: [
        { id: 'c1', text: 'Executed leases for all units on schedule', owner: 'Broker', status: 'open' },
        { id: 'c2', text: 'Insurance binder matching property schedule', owner: 'Broker', status: 'open' },
        { id: 'c3', text: 'Credit decision letter acknowledged by broker', owner: 'Ops', status: 'cleared' },
      ],
      notes:
        'Credit yes is done. File cannot fund until open conditions clear. Broker said package mid-week; no upload yet.',
    },
    {
      id: 'APP-10502',
      productKey: 'bfr',
      product: 'Build-for-rent',
      stage: 'Application in',
      stageId: 'app',
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
      onWatch: false,
      conditions: [],
      notes: 'Still intake. Conditions list starts after decision.',
    },
    {
      id: 'APP-10455',
      productKey: 'bridge',
      product: 'Bridge',
      stage: 'Approved w/ conditions',
      stageId: 'cond',
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
      onWatch: true,
      conditions: [
        {
          id: 'c1',
          text: 'Entity docs matching parties on application (articles + operating agreement)',
          owner: 'Broker',
          status: 'open',
        },
        { id: 'c2', text: 'Evidence of reserves (2 months interest reserve equivalent)', owner: 'Broker', status: 'open' },
        { id: 'c3', text: 'Appraisal received and in file', owner: 'Ops', status: 'cleared' },
        { id: 'c4', text: 'HOA estoppel if condo/PUD (confirm product path)', owner: 'Ops', status: 'open' },
      ],
      notes:
        'Tier A broker. Two pings already. Approval without tracked conditions is how time-to-yes dies here. Oldest open condition is entity docs.',
    },
    {
      id: 'APP-10510',
      productKey: 'term_rental',
      product: 'Term rental / portfolio',
      stage: 'Clear to fund',
      stageId: 'ctf',
      owner: 'Funding desk',
      days: 0,
      tags: [],
      amount: '1.0M',
      broker: 'Harbor Investors',
      tier: 'A',
      issues: [],
      timeline: [{ t: 'Day 0', e: 'Clear to fund · in funding window' }],
      exceptionId: null,
      onWatch: false,
      conditions: [
        { id: 'c1', text: 'All prior credit conditions cleared', owner: 'Ops', status: 'cleared' },
        { id: 'c2', text: 'Wire instructions verified', owner: 'Funding', status: 'cleared' },
      ],
      notes: 'Conditions factory complete. In funding window.',
    },
    {
      id: 'APP-10470',
      productKey: 'bridge',
      product: 'Bridge',
      stage: 'In underwriting',
      stageId: 'uw',
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
      onWatch: true,
      conditions: [],
      notes: 'Dual status CRM vs LOS. Fix source of truth before writing conditions.',
    },
    {
      id: 'APP-10518',
      productKey: 'bridge',
      product: 'Bridge',
      stage: 'Application in',
      stageId: 'app',
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
      onWatch: true,
      conditions: [],
      notes: 'Eligibility fail. Product path decision first; conditions come after a real decision.',
    },
    {
      id: 'APP-22101',
      productKey: 'fix_flip',
      product: 'Fix-and-flip',
      stage: 'In underwriting',
      stageId: 'uw',
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
      onWatch: true,
      conditions: [],
      notes: 'Inspection lag is underwriting friction, not post-approval conditions yet.',
    },
    {
      id: 'APP-33012',
      productKey: 'dscr',
      product: 'DSCR (rental)',
      stage: 'Approved w/ conditions',
      stageId: 'cond',
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
      onWatch: true,
      conditions: [
        { id: 'c1', text: 'Signed rent roll supporting underwrite rents', owner: 'Broker', status: 'open' },
        { id: 'c2', text: 'Leases that match DSCR rent used in decision', owner: 'Broker', status: 'open' },
        { id: 'c3', text: 'Re-run DSCR after package (ops verify coverage)', owner: 'UW', status: 'open' },
      ],
      notes:
        'Approved only if rent package supports the number. Open conditions are the decision itself, not paperwork theater.',
    },
    {
      id: 'APP-44008',
      productKey: 'non_qm',
      product: 'Non-QM / alt docs',
      stage: 'Application in',
      stageId: 'app',
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
      onWatch: true,
      conditions: [],
      notes: 'Incomplete file before decision. Do not start a decision clock or fake conditions list yet.',
    },
    {
      id: 'APP-41003',
      productKey: 'bfr',
      product: 'Build-for-rent',
      stage: 'In underwriting',
      stageId: 'uw',
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
      onWatch: true,
      conditions: [],
      notes: 'Milestone package is construction UW; post-approval conditions may mirror draws later.',
    },
    {
      id: 'APP-35002',
      productKey: 'term_rental',
      product: 'Term rental / portfolio',
      stage: 'Approved w/ conditions',
      stageId: 'cond',
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
      onWatch: false,
      conditions: [
        { id: 'c1', text: 'Unit-level rent schedule for property #2 (all units)', owner: 'Broker', status: 'open' },
        { id: 'c2', text: 'Insurance endorsement covering multi-property portfolio', owner: 'Broker', status: 'open' },
        { id: 'c3', text: 'Property #1 and #3 unit schedules confirmed', owner: 'Ops', status: 'cleared' },
      ],
      notes: 'Portfolio approval holds until property #2 unit data lands. Owner on each condition keeps conversion honest.',
    },
  ];

  var STAGES = [
    { id: 'app', label: 'App in' },
    { id: 'uw', label: 'Underwriting' },
    { id: 'cond', label: 'Conditions' },
    { id: 'ctf', label: 'Clear to fund' },
    { id: 'funded', label: 'Funded' },
  ];

  var statusFilter = 'all';
  var productFilter = 'all';
  var selectedId = null;

  function $(s) {
    return document.querySelector(s);
  }

  function go(app, view) {
    if (window.mortgageShell && window.mortgageShell.navigate) {
      window.mortgageShell.navigate(app, view);
    }
  }

  function filtered() {
    var rows = APPS.filter(function (f) {
      if (productFilter !== 'all' && f.productKey !== productFilter) return false;
      if (statusFilter === 'stuck') return f.tags.indexOf('stuck') !== -1;
      if (statusFilter === 'conditions') return f.tags.indexOf('conditions') !== -1;
      if (statusFilter === 'policy')
        return f.tags.indexOf('policy') !== -1 || f.tags.indexOf('data') !== -1;
      if (statusFilter === 'watch') return f.onWatch;
      return true;
    });
    // Worklist order: hottest first (days desc, then SLA tags)
    rows.sort(function (a, b) {
      var aHot = a.tags.indexOf('stuck') !== -1 ? 1 : 0;
      var bHot = b.tags.indexOf('stuck') !== -1 ? 1 : 0;
      if (bHot !== aHot) return bHot - aHot;
      return b.days - a.days;
    });
    return rows;
  }

  function stats(pool) {
    var base = productFilter === 'all' ? APPS : APPS.filter(function (f) {
      return f.productKey === productFilter;
    });
    return {
      all: base.length,
      stuck: base.filter(function (f) {
        return f.tags.indexOf('stuck') !== -1;
      }).length,
      conditions: base.filter(function (f) {
        return f.tags.indexOf('conditions') !== -1;
      }).length,
      policy: base.filter(function (f) {
        return f.tags.indexOf('policy') !== -1 || f.tags.indexOf('data') !== -1;
      }).length,
      watch: base.filter(function (f) {
        return f.onWatch;
      }).length,
    };
  }

  function setProduct(id) {
    productFilter = id || 'all';
    render();
  }

  function stagePathHtml(app) {
    return (
      '<div class="app-stage-path" aria-label="Stage on application path">' +
      STAGES.map(function (s) {
        var on = s.id === app.stageId;
        var past =
          STAGES.findIndex(function (x) {
            return x.id === s.id;
          }) <
          STAGES.findIndex(function (x) {
            return x.id === app.stageId;
          });
        return (
          '<span class="app-stage-step' +
          (on ? ' is-on' : '') +
          (past ? ' is-past' : '') +
          '">' +
          s.label +
          '</span>'
        );
      }).join('<span class="app-stage-arrow" aria-hidden="true">→</span>') +
      '</div>'
    );
  }

  function connectStrip(app) {
    var bits = [];
    bits.push('Same APP ids as dashboard watchlist and exception queue');
    if (app.exceptionId) bits.push('Open exception <strong>' + app.exceptionId + '</strong>');
    if (app.onWatch) bits.push('On Ops “act now” list');
    if (LP && LP.META[app.productKey])
      bits.push(LP.META[app.productKey].short + ' product DNA matches dashboard chips');
    return (
      '<div class="app-connect-strip">' +
      bits
        .map(function (b) {
          return '<span class="app-connect-pill">' + b + '</span>';
        })
        .join('') +
      '</div>'
    );
  }

  function ensureAppFields(f) {
    if (!f.conditions) f.conditions = [];
    if (typeof f.notes !== 'string') f.notes = '';
    return f;
  }

  function openConditionCount(f) {
    ensureAppFields(f);
    return f.conditions.filter(function (c) {
      return c.status !== 'cleared';
    }).length;
  }

  function condStageExplainer(f) {
    var open = openConditionCount(f);
    var cleared = f.conditions.length - open;
    return (
      '<div class="app-cond-explain' +
      (f.stageId === 'cond' ? ' is-active' : '') +
      '">' +
      '<div class="app-cond-explain__title">What "Approved with conditions" means</div>' +
      '<p>Credit / underwriting said <strong>yes, subject to</strong> specific items still outstanding. ' +
      'It is not clear-to-fund and not a soft maybe. The application stays in this stage until every open condition is cleared (or the decision is revised).</p>' +
      '<ul class="app-cond-explain__list">' +
      '<li><strong>Not funded yet.</strong> Broker and ops work the condition list; funding waits.</li>' +
      '<li><strong>Each condition needs an owner</strong> (broker, ops, UW) and a clear done state.</li>' +
      '<li><strong>Time-to-yes risk lives here.</strong> Long aging with open conditions is the factory floor, not a vanity stage.</li>' +
      '</ul>' +
      (f.stageId === 'cond'
        ? '<p class="app-cond-explain__status"><strong>This file:</strong> ' +
          open +
          ' open · ' +
          cleared +
          ' cleared · ' +
          f.days +
          'd in stage' +
          (open === 0
            ? ' · ready to promote toward clear-to-fund when ops confirms'
            : ' · blocked on open conditions') +
          '</p>'
        : f.conditions.length
          ? '<p class="app-cond-explain__status">This file is not in the conditions stage right now, but it still carries a condition history (' +
            f.conditions.length +
            ').</p>'
          : '<p class="app-cond-explain__status muted">Not in conditions stage. You can still add post-decision conditions when a credit yes lands.</p>') +
      '</div>'
    );
  }

  function conditionsHtml(f) {
    ensureAppFields(f);
    var open = openConditionCount(f);
    var rows =
      f.conditions.length === 0
        ? '<li class="app-cond-empty">No conditions entered yet. Add what the decision is subject to.</li>'
        : f.conditions
            .map(function (c) {
              var done = c.status === 'cleared';
              return (
                '<li class="app-cond-item' +
                (done ? ' is-cleared' : '') +
                '" data-cond-id="' +
                c.id +
                '">' +
                '<label class="app-cond-check">' +
                '<input type="checkbox" data-cond-toggle="' +
                c.id +
                '"' +
                (done ? ' checked' : '') +
                ' />' +
                '<span class="app-cond-text">' +
                escapeHtml(c.text) +
                '</span></label>' +
                '<span class="app-cond-owner">' +
                escapeHtml(c.owner || 'Unassigned') +
                '</span>' +
                '<span class="app-cond-status">' +
                (done ? 'Cleared' : 'Open') +
                '</span>' +
                '<button type="button" class="app-cond-remove" data-cond-remove="' +
                c.id +
                '" title="Remove condition">×</button>' +
                '</li>'
              );
            })
            .join('');

    return (
      '<div class="app-cond-panel" data-app-id="' +
      f.id +
      '">' +
      '<div class="app-cond-panel__h">' +
      '<h4>Conditions on this approval</h4>' +
      '<span class="app-cond-count">' +
      open +
      ' open · ' +
      f.conditions.length +
      ' total</span></div>' +
      '<p class="app-cond-panel__hint">Write the real checklist the decision depends on. Toggle cleared when evidence is in file. Demo only; not saved to a server.</p>' +
      '<ul class="app-cond-list">' +
      rows +
      '</ul>' +
      '<div class="app-cond-add">' +
      '<input type="text" class="app-cond-input" id="app-cond-text" placeholder="New condition (e.g. 12-mo bank statements months 1–12)" maxlength="200" />' +
      '<input type="text" class="app-cond-owner-input" id="app-cond-owner" placeholder="Owner" maxlength="40" value="Broker" />' +
      '<button type="button" class="app-cond-add-btn" data-cond-add>Add condition</button>' +
      '</div></div>'
    );
  }

  function notesHtml(f) {
    ensureAppFields(f);
    return (
      '<div class="app-notes-panel">' +
      '<h4>Notes</h4>' +
      '<p class="app-cond-panel__hint">Ops / UW working notes on this application. Stays with the file while you demo (session only).</p>' +
      '<textarea class="app-notes-area" id="app-notes" rows="4" maxlength="2000" placeholder="Broker conversation, last ping, why a condition is stuck…">' +
      escapeHtml(f.notes || '') +
      '</textarea>' +
      '<div class="app-notes-meta"><span id="app-notes-saved">Edits stick on this file until you refresh the page.</span></div>' +
      '</div>'
    );
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function detailHtml(f) {
    ensureAppFields(f);
    var dna = '';
    if (LP && LP.META[f.productKey]) {
      var m = LP.META[f.productKey];
      dna =
        '<div class="app-detail-dna">' +
        '<div class="prod-dna-kicker">Product DNA</div>' +
        '<div class="app-detail-dna-title">' +
        m.label +
        ' · ' +
        m.tagline +
        '</div>' +
        '<div class="prod-dna-grid" style="margin-top:8px">' +
        '<div><span class="prod-dna-label">Underwrite focus</span><span class="prod-dna-val">' +
        m.underwrite +
        '</span></div>' +
        '<div><span class="prod-dna-label">System hot spots</span><span class="prod-dna-val">' +
        m.hotspots +
        '</span></div></div></div>';
    }

    var openCond = openConditionCount(f);
    var stageLabel =
      f.stageId === 'cond'
        ? f.stage + ' · ' + openCond + ' open condition' + (openCond === 1 ? '' : 's')
        : f.stage;

    return (
      '<div class="drill-detail-card__h"><h2>Application</h2><span class="sub">' +
      f.id +
      '</span></div><div class="drill-detail-card__b">' +
      '<h3>' +
      f.id +
      ' · ' +
      f.product +
      '</h3>' +
      '<p class="meta"><strong>' +
      stageLabel +
      '</strong> · ' +
      f.days +
      'd in stage · ' +
      f.amount +
      ' · ' +
      f.broker +
      ' (tier ' +
      f.tier +
      ') · Owner ' +
      f.owner +
      '</p>' +
      stagePathHtml(f) +
      connectStrip(f) +
      condStageExplainer(f) +
      conditionsHtml(f) +
      notesHtml(f) +
      dna +
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
      '<h4>Timeline</h4>' +
      '<div class="drill-timeline">' +
      f.timeline
        .map(function (ev) {
          return '<div class="ev"><span class="t">' + ev.t + '</span><strong>' + ev.e + '</strong></div>';
        })
        .join('') +
      '</div>' +
      '<h4>Connected surfaces</h4>' +
      '<div class="drill-actions">' +
      (f.exceptionId
        ? '<button type="button" class="is-primary" data-open-ex="' +
          f.exceptionId +
          '">Open exception ' +
          f.exceptionId +
          '</button>'
        : '') +
      '<button type="button" data-nav="accelerator:dashboard">Xtreme dashboard (Ops)</button>' +
      '<button type="button" data-nav="accelerator:path">Application path</button>' +
      '<button type="button" data-nav="reports:ops-folder">Pipeline reports</button>' +
      (f.productKey
        ? '<button type="button" data-dash-product="' +
          f.productKey +
          '">Filter dashboard to ' +
          (LP && LP.META[f.productKey] ? LP.META[f.productKey].short : f.product) +
          '</button>'
        : '') +
      '</div>' +
      '<p class="app-detail-note">System of work under the dashboards. Same APP records as Ops act-now and the exception queue. Same product DNA as the chips above.</p>' +
      '</div>'
    );
  }

  function bindConditionControls(root, app) {
    ensureAppFields(app);
    var notes = root.querySelector('#app-notes');
    if (notes) {
      notes.addEventListener('input', function () {
        app.notes = notes.value;
        var meta = root.querySelector('#app-notes-saved');
        if (meta) meta.textContent = 'Saved on this file (session).';
      });
    }

    root.querySelectorAll('[data-cond-toggle]').forEach(function (el) {
      el.addEventListener('change', function () {
        var id = el.getAttribute('data-cond-toggle');
        var c = app.conditions.find(function (x) {
          return x.id === id;
        });
        if (c) c.status = el.checked ? 'cleared' : 'open';
        syncConditionTags(app);
        render();
      });
    });

    root.querySelectorAll('[data-cond-remove]').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.getAttribute('data-cond-remove');
        app.conditions = app.conditions.filter(function (x) {
          return x.id !== id;
        });
        syncConditionTags(app);
        render();
      });
    });

    var addBtn = root.querySelector('[data-cond-add]');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        addConditionFromForm(app);
      });
    }
    var textIn = root.querySelector('#app-cond-text');
    if (textIn) {
      textIn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          addConditionFromForm(app);
        }
      });
    }
  }

  function addConditionFromForm(app) {
    ensureAppFields(app);
    var textEl = document.querySelector('#app-cond-text');
    var ownerEl = document.querySelector('#app-cond-owner');
    var text = textEl && textEl.value ? textEl.value.trim() : '';
    if (!text) {
      if (textEl) textEl.focus();
      return;
    }
    var owner = ownerEl && ownerEl.value ? ownerEl.value.trim() : 'Unassigned';
    app.conditions.push({
      id: 'c' + Date.now(),
      text: text,
      owner: owner || 'Unassigned',
      status: 'open',
    });
    if (app.stageId === 'cond' || app.tags.indexOf('conditions') !== -1) {
      /* keep */
    } else if (app.stageId === 'uw' || app.stageId === 'app') {
      /* allow pre-decision notes; do not force stage */
    }
    syncConditionTags(app);
    render();
  }

  function syncConditionTags(app) {
    ensureAppFields(app);
    var open = openConditionCount(app);
    if (app.stageId === 'cond') {
      if (open > 0 && app.tags.indexOf('conditions') === -1) app.tags.push('conditions');
      if (open === 0) {
        app.tags = app.tags.filter(function (t) {
          return t !== 'conditions';
        });
      }
    }
  }

  function openException(exId) {
    go('exceptions', 'queue');
    setTimeout(function () {
      if (window.eqExceptionQueue && window.eqExceptionQueue.selectById && exId) {
        window.eqExceptionQueue.selectById(exId);
      }
    }, 60);
  }

  function render() {
    var root = $('#pipeline-root');
    if (!root) return;
    var rows = filtered();
    var s = stats();
    if (
      !selectedId ||
      !rows.some(function (r) {
        return r.id === selectedId;
      })
    ) {
      selectedId = rows[0] ? rows[0].id : null;
    }
    var sel = APPS.find(function (f) {
      return f.id === selectedId;
    });

    var linkBar =
      '<div class="app-link-bar">' +
      '<span class="app-link-bar__text"><strong>Xtreme applications</strong>: working list under Leadership / Ops dashboards and the exception queue. Same APP ids, same product chips.</span>' +
      '<div class="app-link-bar__actions">' +
      '<button type="button" data-nav="accelerator:dashboard">Dashboard</button>' +
      '<button type="button" data-nav="exceptions:queue">Exceptions</button>' +
      '<button type="button" data-nav="accelerator:path">Path</button>' +
      '<button type="button" data-nav="reports:ops-folder">Reports</button>' +
      '</div></div>';

    root.innerHTML =
      linkBar +
      '<div id="pipe-product-chips" class="prod-chip-rail"></div>' +
      '<div id="pipe-product-dna" class="prod-dna-host"></div>' +
      '<div class="drill-stat-row">' +
      statBtn('all', s.all, 'In filter') +
      statBtn('stuck', s.stuck, 'Past SLA') +
      statBtn('conditions', s.conditions, 'Conditions') +
      statBtn('policy', s.policy, 'Rules / data') +
      statBtn('watch', s.watch, 'On act-now') +
      '</div>' +
      '<div class="drill-layout">' +
      '<div class="drill-list-card">' +
      '<div class="drill-list-card__h"><h2>Open applications</h2><span class="sub">' +
      rows.length +
      ' shown · hottest first</span></div>' +
      '<div class="drill-filters">' +
      chip('all', 'All status') +
      chip('stuck', 'Past SLA') +
      chip('conditions', 'Conditions') +
      chip('policy', 'Rules / data') +
      chip('watch', 'Act-now') +
      '</div>' +
      '<div class="drill-table-wrap"><table class="drill-table"><thead><tr>' +
      '<th>Application</th><th>Product</th><th>Stage</th><th>Owner</th><th>Days</th><th>Signal</th>' +
      '</tr></thead><tbody>' +
      (rows.length
        ? rows
            .map(function (f) {
              var isHot = f.tags.indexOf('stuck') !== -1;
              var badges = [];
              if (isHot) badges.push('<span class="app-row-badge app-row-badge--hot">SLA</span>');
              if (f.tags.indexOf('conditions') !== -1)
                badges.push('<span class="app-row-badge app-row-badge--warn">COND</span>');
              if (f.exceptionId)
                badges.push(
                  '<button type="button" class="app-row-badge app-row-badge--ex" data-ex="' +
                    f.exceptionId +
                    '" title="Open exception">' +
                    f.exceptionId +
                    '</button>'
                );
              if (f.onWatch && !isHot)
                badges.push('<span class="app-row-badge">ACT</span>');
              return (
                '<tr data-id="' +
                f.id +
                '" class="' +
                (f.id === selectedId ? 'is-selected' : '') +
                (isHot ? ' is-hot' : '') +
                '"><td><strong>' +
                f.id +
                '</strong><div class="app-row-sub">' +
                f.amount +
                ' · ' +
                f.broker +
                (f.stageId === 'cond'
                  ? ' · ' + openConditionCount(f) + ' open cond'
                  : '') +
                '</div></td><td>' +
                f.product +
                '</td><td>' +
                f.stage +
                '</td><td>' +
                f.owner +
                '</td><td class="' +
                (isHot || f.days >= 7 ? 'app-days-hot' : '') +
                '">' +
                f.days +
                'd</td><td class="app-row-signals">' +
                (badges.length ? badges.join(' ') : '<span class="app-row-quiet">ok</span>') +
                '</td></tr>'
              );
            })
            .join('')
        : '<tr><td colspan="6">No applications in this filter. Clear product or status filters.</td></tr>') +
      '</tbody></table></div></div>' +
      '<div class="drill-detail-card">' +
      (sel ? detailHtml(sel) : '<div class="drill-empty">Select an application</div>') +
      '</div></div>';

    if (LP) {
      LP.renderChips($('#pipe-product-chips'), productFilter, setProduct);
      if (productFilter !== 'all') {
        LP.renderDna($('#pipe-product-dna'), productFilter);
      } else {
        var dna = $('#pipe-product-dna');
        if (dna) {
          dna.hidden = false;
          dna.innerHTML =
            '<div class="prod-dna"><div class="prod-dna-kicker">Book view</div>' +
            '<div class="prod-dna-title">All products</div>' +
            '<p class="prod-dna-tag">Filter by product chip to match dashboard DNA and stall patterns (bridge, flip, DSCR, BFR, non-QM…).</p></div>';
        }
      }
    }

    root.querySelectorAll('[data-stat]').forEach(function (el) {
      el.addEventListener('click', function () {
        statusFilter = el.getAttribute('data-stat');
        render();
      });
    });
    root.querySelectorAll('[data-filter]').forEach(function (el) {
      el.addEventListener('click', function () {
        statusFilter = el.getAttribute('data-filter');
        render();
      });
    });
    root.querySelectorAll('tr[data-id]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('[data-ex]')) return;
        selectedId = el.getAttribute('data-id');
        render();
      });
    });
    root.querySelectorAll('[data-ex], [data-open-ex]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        openException(el.getAttribute('data-ex') || el.getAttribute('data-open-ex'));
      });
    });
    root.querySelectorAll('[data-nav]').forEach(function (el) {
      el.addEventListener('click', function () {
        var parts = el.getAttribute('data-nav').split(':');
        go(parts[0], parts[1]);
      });
    });
    root.querySelectorAll('[data-dash-product]').forEach(function (el) {
      el.addEventListener('click', function () {
        var pk = el.getAttribute('data-dash-product');
        go('accelerator', 'dashboard');
        setTimeout(function () {
          if (window.mortgageDash && window.mortgageDash.setProduct) {
            window.mortgageDash.setProduct(pk);
          } else if (window.mortgageDashNative && window.mortgageDashNative.setProduct) {
            window.mortgageDashNative.setProduct(pk);
          }
        }, 80);
      });
    });

    if (sel) bindConditionControls(root, sel);

    var cap = $('#pipeline-view-caption');
    if (cap) {
      var prodLabel =
        productFilter === 'all'
          ? 'All products'
          : LP && LP.META[productFilter]
            ? LP.META[productFilter].label
            : productFilter;
      var statusLabels = {
        all: 'all statuses',
        stuck: 'past SLA',
        conditions: 'conditions',
        policy: 'rules / data',
        watch: 'act-now / watchlist',
      };
      cap.textContent =
        prodLabel +
        ' · ' +
        (statusLabels[statusFilter] || statusFilter) +
        ' · ' +
        rows.length +
        ' applications · click a row';
    }
  }

  function statBtn(id, n, label) {
    return (
      '<button type="button" class="drill-stat' +
      (statusFilter === id ? ' is-on' : '') +
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
      (statusFilter === id ? ' is-on' : '') +
      '" data-filter="' +
      id +
      '">' +
      label +
      '</button>'
    );
  }

  function applyShellFilter() {
    if (window.mortgageShell && window.mortgageShell.getState) {
      var st = window.mortgageShell.getState();
      if (st.appId === 'pipeline') {
        if (st.viewId === 'past-sla') statusFilter = 'stuck';
        else if (st.viewId === 'conditions') statusFilter = 'conditions';
        else if (st.viewId === 'all-open') statusFilter = 'all';
      }
    }
    // Pull product filter from dashboard if user was filtering there
    if (window.mortgageDash && window.mortgageDash.getState) {
      var ds = window.mortgageDash.getState();
      if (ds.product && ds.product !== 'all') productFilter = ds.product;
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
    setProduct: setProduct,
  };
})();
