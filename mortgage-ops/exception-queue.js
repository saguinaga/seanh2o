/**
 * Custom component: Application Exception Queue + AI prioritization.
 * Unit of work = loan application. Policy/rules as company checks, not customer-facing compliance theater.
 * Demo data only.
 */
(function () {
  const TAGS = {
    docs: { label: 'Missing docs', className: 'eq-tag--sla' },
    incomplete: { label: 'Incomplete app', className: 'eq-tag--partner' },
    policy: { label: 'Policy check', className: 'eq-tag--audit' },
    data: { label: 'Data quality', className: 'eq-tag--audit' },
    capacity: { label: 'Capacity', className: 'eq-tag--partner' },
  };

  let items = [
    {
      id: 'EX-2201',
      appId: 'APP-10455',
      product: 'Bridge',
      title: 'Conditions open after approval; package incomplete',
      summary:
        'Application approved with conditions. Required docs still missing after two broker pings. Aging past internal SLA; time-to-yes at risk for a Tier A broker.',
      tags: ['docs', 'incomplete'],
      slaDaysOver: 4,
      brokerTier: 'A',
      amountBand: '1.2M',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2202',
      appId: 'APP-10482',
      product: 'Bridge',
      title: 'Entity / income docs do not match application parties',
      summary:
        'Party records on the application do not line up with submitted entity docs. Internal policy check must clear before underwriting can finish. Applicant should not feel this as a black box; ops needs an owner.',
      tags: ['policy', 'docs'],
      slaDaysOver: 2,
      brokerTier: 'A',
      amountBand: '890K',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2203',
      appId: 'APP-10491',
      product: 'Rental term',
      title: 'Required fields blank; application stuck in intake',
      summary:
        'Application advanced to underwriting without file-complete. Rules engine would normally block; data quality gap. Broker is waiting on a real status.',
      tags: ['incomplete', 'data'],
      slaDaysOver: 1,
      brokerTier: 'B',
      amountBand: '2.4M',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2204',
      appId: 'APP-10470',
      product: 'Bridge',
      title: 'CRM stage and LOS status disagree',
      summary:
        'Salesforce shows Clear to fund; LOS still In underwriting. Integration write-back failed. Wrong status to broker if anyone trusts the wrong system.',
      tags: ['data'],
      slaDaysOver: 3,
      brokerTier: 'B',
      amountBand: '650K',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2205',
      appId: 'APP-10502',
      product: 'Build-for-rent',
      title: 'Pricing overlay without structured reason',
      summary:
        'Manual overlay on the application with no reason code. Internal control for the company; fix the data so the application can move cleanly.',
      tags: ['policy', 'data'],
      slaDaysOver: 0,
      brokerTier: 'C',
      amountBand: '3.1M',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2206',
      appId: 'APP-10510',
      product: 'Rental term',
      title: 'Broker escalated; application has no owner in queue',
      summary:
        'Repeat broker asked for status. Application is not blocked on policy; it is blocked on attention. AI should surface this before the relationship cools.',
      tags: ['capacity'],
      slaDaysOver: 2,
      brokerTier: 'A',
      amountBand: '1.0M',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2207',
      appId: 'APP-10518',
      product: 'Bridge',
      title: 'Product rules rejected path; application needs rework',
      summary:
        'Application submitted on a product path that fails eligibility rules (loan purpose / property type mismatch). Rules engine catch. Broker needs a clear next step, not a silent stall.',
      tags: ['policy', 'incomplete'],
      slaDaysOver: 3,
      brokerTier: 'A',
      amountBand: '1.5M',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2210',
      appId: 'APP-22101',
      product: 'Fix-and-flip',
      title: 'Draw inspection overdue · rehab path stalled',
      summary:
        'Fix-and-flip application past inspection SLA on draw #2. ARV path depends on scope verification. Broker and borrower waiting on capital release.',
      tags: ['capacity', 'docs'],
      slaDaysOver: 4,
      brokerTier: 'A',
      amountBand: '780K',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2211',
      appId: 'APP-33012',
      product: 'DSCR (rental)',
      title: 'Rent roll vs DSCR underwrite mismatch',
      summary:
        'DSCR application: lease stack does not support the underwritten rent used for coverage. Property cash-flow underwrite, not W-2 DTI. Needs corrected package or reprice path.',
      tags: ['docs', 'data'],
      slaDaysOver: 2,
      brokerTier: 'B',
      amountBand: '1.1M',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2212',
      appId: 'APP-44008',
      product: 'Non-QM / alt docs',
      title: 'Bank-statement package incomplete',
      summary:
        'Non-QM path: 12-month bank statements incomplete for self-employed borrower. Alt-doc guideline set requires full stack before decision clock should run.',
      tags: ['docs', 'incomplete'],
      slaDaysOver: 3,
      brokerTier: 'A',
      amountBand: '920K',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2213',
      appId: 'APP-41003',
      product: 'Build-for-rent',
      title: 'Construction milestone package incomplete',
      summary:
        'BFR application waiting on milestone 2 package before next draw. Construction + rental economics path — not a simple consumer close.',
      tags: ['docs', 'capacity'],
      slaDaysOver: 5,
      brokerTier: 'B',
      amountBand: '4.2M',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
  ];

  const auditLog = [];
  let selectedId = null;
  let sortMode = 'ai';
  let aiEnabled = true;
  let listFilter = 'all';

  function tierPts(t) {
    if (t === 'A') return 22;
    if (t === 'B') return 12;
    return 5;
  }

  function amountPts(band) {
    const n = parseFloat(String(band).replace(/[^\d.]/g, '')) || 0;
    if (n >= 2) return 18;
    if (n >= 1) return 12;
    return 6;
  }

  function scoreItem(item) {
    const policyPts = Math.min(28, item.tags.filter(function (t) {
      return t === 'policy' || t === 'docs' || t === 'incomplete';
    }).length * 12);
    const slaPts = Math.min(28, item.slaDaysOver * 7);
    const brokerPts = tierPts(item.brokerTier);
    const sizePts = amountPts(item.amountBand);
    const openBoost = item.status === 'open' ? 4 : 0;
    const total = policyPts + slaPts + brokerPts + sizePts + openBoost;

    const factors = [
      { name: 'App blockers (docs / incomplete / policy)', pts: policyPts, max: 28 },
      { name: 'SLA breach (days over)', pts: slaPts, max: 28 },
      { name: 'Broker / channel tier', pts: brokerPts, max: 22 },
      { name: 'Application size band', pts: sizePts, max: 18 },
    ];

    let why = 'Balanced';
    if (policyPts >= slaPts && policyPts >= brokerPts) why = 'App blockers';
    else if (slaPts >= brokerPts) why = 'SLA pressure';
    else why = 'Broker impact';

    item.score = total;
    item.factors = factors;
    item.aiWhy = why;
    return item;
  }

  function rescoreAll() {
    items.forEach(scoreItem);
  }

  function matchesFilter(item) {
    if (listFilter === 'policy') return item.tags.indexOf('policy') !== -1 || item.tags.indexOf('docs') !== -1;
    if (listFilter === 'sla') return item.slaDaysOver >= 2;
    if (listFilter === 'claimed') return item.owner !== 'Unassigned' && item.status === 'open';
    return true;
  }

  function sortedOpen() {
    let open = items.filter(function (i) {
      return i.status === 'open' && matchesFilter(i);
    });
    let done = items.filter(function (i) {
      return i.status !== 'open' && matchesFilter(i);
    });
    if (listFilter === 'claimed') done = [];
    if (sortMode === 'sla') {
      open.sort(function (a, b) {
        return b.slaDaysOver - a.slaDaysOver || b.score - a.score;
      });
    } else if (sortMode !== 'manual') {
      open.sort(function (a, b) {
        return b.score - a.score;
      });
    }
    return open.concat(done);
  }

  function log(msg) {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    auditLog.unshift({ ts: ts, msg: msg });
    if (auditLog.length > 40) auditLog.pop();
    renderAudit();
  }

  function $(sel) {
    return document.querySelector(sel);
  }

  function renderStats() {
    const open = items.filter(function (i) {
      return i.status === 'open';
    });
    const policy = open.filter(function (i) {
      return i.tags.indexOf('policy') !== -1 || i.tags.indexOf('docs') !== -1;
    });
    const hot = open.filter(function (i) {
      return i.slaDaysOver >= 2;
    });
    const claimed = open.filter(function (i) {
      return i.owner !== 'Unassigned';
    });
    function set(id, n) {
      const el = $(id);
      if (el) el.textContent = String(n);
    }
    set('#eq-stat-open', open.length);
    set('#eq-stat-reg', policy.length);
    set('#eq-stat-sla', hot.length);
    set('#eq-stat-claimed', claimed.length);

    // labels in HTML may still say compliance; fix via data attributes
    const map = {
      '#eq-stat-open': 'all',
      '#eq-stat-reg': 'policy',
      '#eq-stat-sla': 'sla',
      '#eq-stat-claimed': 'claimed',
    };
    Object.keys(map).forEach(function (sel) {
      const el = $(sel);
      if (!el) return;
      const parent = el.closest('.eq-stat');
      if (!parent) return;
      parent.classList.toggle('is-on', listFilter === map[sel]);
      parent.setAttribute('data-eq-filter', map[sel]);
      parent.setAttribute('role', 'button');
      parent.setAttribute('tabindex', '0');
      parent.title = 'Filter queue';
    });
    const regLabel = document.querySelector('#eq-stat-reg + .l, .eq-stat.is-reg .l');
    // update label text if present
    document.querySelectorAll('.eq-stat .l').forEach(function (lab, i) {
      const texts = ['Open apps', 'Docs / policy', 'SLA ≥ 2 days', 'Claimed'];
      if (texts[i]) lab.textContent = texts[i];
    });
  }

  function renderList() {
    const list = $('#eq-list');
    if (!list) return;
    const rows = sortedOpen();
    list.innerHTML = '';
    rows.forEach(function (item, idx) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'eq-row' +
        (item.id === selectedId ? ' is-selected' : '') +
        (item.status !== 'open' ? ' is-done' : '');
      btn.dataset.id = item.id;

      const tags = item.tags
        .map(function (c) {
          const meta = TAGS[c] || { label: c, className: '' };
          return '<span class="eq-tag ' + meta.className + '">' + meta.label + '</span>';
        })
        .join('');
      const slaTag =
        item.slaDaysOver > 0
          ? '<span class="eq-tag eq-tag--sla">' + item.slaDaysOver + 'd over SLA</span>'
          : '';
      const brokerTag = '<span class="eq-tag eq-tag--partner">Broker tier ' + item.brokerTier + '</span>';

      btn.innerHTML =
        '<span class="eq-rank">' +
        (item.status === 'open' ? idx + 1 : '✓') +
        '</span>' +
        '<span class="eq-row-main">' +
        '<span class="eq-row-id">' +
        item.id +
        ' · ' +
        item.appId +
        '</span>' +
        '<div class="eq-row-title">' +
        item.title +
        '</div>' +
        '<div class="eq-row-meta">' +
        tags +
        slaTag +
        brokerTag +
        '</div></span>' +
        '<span class="eq-score"><div class="val">' +
        (aiEnabled ? item.score : '—') +
        '</div><div class="why">' +
        (aiEnabled ? item.aiWhy : 'AI off') +
        '</div></span>';

      btn.addEventListener('click', function () {
        selectedId = item.id;
        renderList();
        renderDetail();
      });
      list.appendChild(btn);
    });
  }

  function selected() {
    return items.find(function (i) {
      return i.id === selectedId;
    }) || null;
  }

  function renderDetail() {
    const pane = $('#eq-detail');
    if (!pane) return;
    const item = selected();
    if (!item) {
      pane.className = 'eq-detail empty';
      pane.innerHTML = '<p>Select an application exception to see AI ranking and take action.</p>';
      return;
    }
    pane.className = 'eq-detail';
    const open = item.status === 'open';
    const factorsHtml = (item.factors || [])
      .map(function (f) {
        const pct = Math.round((f.pts / f.max) * 100);
        return (
          '<div class="eq-factor">' +
          '<span class="name">' +
          f.name +
          '</span><span class="pts">+' +
          f.pts +
          '</span>' +
          '<div class="eq-factor-bar"><i style="width:' +
          pct +
          '%"></i></div></div>'
        );
      })
      .join('');

    const tags =
      item.tags
        .map(function (c) {
          const meta = TAGS[c] || { label: c, className: '' };
          return '<span class="eq-tag ' + meta.className + '">' + meta.label + '</span>';
        })
        .join(' ') || '<span class="eq-tag">Ops only</span>';

    pane.innerHTML =
      '<h3>' +
      item.title +
      '</h3>' +
      '<p class="file-line">' +
      item.id +
      ' · Application <strong>' +
      item.appId +
      '</strong> · ' +
      item.product +
      ' · ' +
      item.amountBand +
      ' · Owner: <strong>' +
      item.owner +
      '</strong>' +
      (item.status !== 'open' ? ' · <strong>Status: ' + item.status + '</strong>' : '') +
      '</p>' +
      '<section><h4>What is blocking this application</h4><p>' +
      item.summary +
      '</p></section>' +
      '<section><h4>Tags</h4><div class="eq-row-meta">' +
      tags +
      '</div>' +
      '<p style="margin-top:8px">Policy and data checks are the company\'s job (rules engine, completeness). The customer/broker experience is speed and a clear path to yes, not a compliance lecture.</p></section>' +
      '<section><h4>AI priority breakdown' +
      (aiEnabled ? '' : ' (paused)') +
      '</h4>' +
      (aiEnabled
        ? '<p style="margin-bottom:8px">Score <strong>' +
          item.score +
          '</strong> · ' +
          item.aiWhy +
          '. AI orders the queue. People claim and clear applications.</p><div class="eq-factors">' +
          factorsHtml +
          '</div>'
        : '<p>AI ranking is off. List order is manual / SLA sort.</p>') +
      '</section>' +
      '<section><h4>Drill further</h4><div class="eq-actions" style="padding-top:0">' +
      '<button type="button" data-nav="pipeline" data-app="' +
      item.appId +
      '">Open application</button>' +
      '<button type="button" data-nav="dashboard">Dashboard</button>' +
      '<button type="button" data-nav="path">Application path</button>' +
      '</div></section>' +
      '<section><h4>Action note</h4>' +
      '<textarea class="eq-note-input" id="eq-note" placeholder="What cleared? What still blocks the application?" ' +
      (open ? '' : 'disabled') +
      '></textarea></section>' +
      '<div class="eq-actions">' +
      '<button type="button" class="is-primary" data-act="claim" ' +
      (open ? '' : 'disabled') +
      '>Claim for me</button>' +
      '<button type="button" data-act="policy" ' +
      (open ? '' : 'disabled') +
      '>Route to policy review</button>' +
      '<button type="button" data-act="resolve" ' +
      (open ? '' : 'disabled') +
      '>Mark resolved</button>' +
      '<button type="button" data-act="up" ' +
      (open && sortMode === 'manual' ? '' : 'disabled') +
      '>Move up</button>' +
      '<button type="button" data-act="down" ' +
      (open && sortMode === 'manual' ? '' : 'disabled') +
      '>Move down</button>' +
      '</div>';

    pane.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        handleAction(btn.getAttribute('data-act'), item);
      });
    });
    pane.querySelectorAll('[data-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const nav = btn.getAttribute('data-nav');
        const app = btn.getAttribute('data-app');
        if (nav === 'pipeline' && window.mortgageShell) {
          window.mortgageShell.navigate('pipeline', 'all-open');
          setTimeout(function () {
            if (window.mortgagePipeline && app) window.mortgagePipeline.selectFile(app);
          }, 50);
        } else if (nav === 'dashboard' && window.mortgageShell) {
          window.mortgageShell.navigate('accelerator', 'dashboard');
        } else if (nav === 'path' && window.mortgageShell) {
          window.mortgageShell.navigate('accelerator', 'path');
        }
      });
    });
  }

  function noteText() {
    const t = $('#eq-note');
    return t && t.value ? t.value.trim() : '';
  }

  function handleAction(act, item) {
    if (!item || item.status !== 'open') return;
    const note = noteText();
    if (act === 'claim') {
      item.owner = 'You (demo)';
      log(item.id + ' claimed · application ' + item.appId + (note ? ' — ' + note : ''));
    } else if (act === 'policy') {
      item.owner = 'Policy review';
      item.status = 'routed';
      log(item.id + ' routed to policy review' + (note ? ' — ' + note : ''));
    } else if (act === 'resolve') {
      item.status = 'resolved';
      item.owner = item.owner === 'Unassigned' ? 'You (demo)' : item.owner;
      log(item.id + ' resolved · application unblocked by ' + item.owner + (note ? ' — ' + note : ''));
    } else if (act === 'up' || act === 'down') {
      if (sortMode !== 'manual') return;
      const open = items.filter(function (i) {
        return i.status === 'open';
      });
      const rest = items.filter(function (i) {
        return i.status !== 'open';
      });
      const idx = open.findIndex(function (i) {
        return i.id === item.id;
      });
      if (idx < 0) return;
      const swap = act === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= open.length) return;
      const tmp = open[idx];
      open[idx] = open[swap];
      open[swap] = tmp;
      items = open.concat(rest);
      log(item.id + ' manually reordered (' + act + ')');
    }
    rescoreAll();
    renderAll();
  }

  function renderAudit() {
    const ul = $('#eq-audit-list');
    if (!ul) return;
    if (!auditLog.length) {
      ul.innerHTML = '<li><span class="ts">—</span>No actions yet. Claim or resolve to log work on an application.</li>';
      return;
    }
    ul.innerHTML = auditLog
      .map(function (e) {
        return '<li><span class="ts">' + e.ts + '</span>' + e.msg + '</li>';
      })
      .join('');
  }

  function renderAll() {
    renderStats();
    renderList();
    renderDetail();
    renderAudit();
  }

  function bindChrome() {
    document.querySelectorAll('.eq-stat').forEach(function (stat) {
      stat.addEventListener('click', function () {
        const f = stat.getAttribute('data-eq-filter') || 'all';
        listFilter = listFilter === f ? 'all' : f;
        log('Queue filter → ' + listFilter);
        const visible = sortedOpen();
        if (
          !visible.some(function (i) {
            return i.id === selectedId;
          })
        ) {
          selectedId = visible[0] ? visible[0].id : null;
        }
        renderAll();
      });
    });

    const sort = $('#eq-sort');
    if (sort) {
      sort.addEventListener('change', function () {
        sortMode = sort.value;
        log('Sort mode → ' + sortMode);
        renderAll();
      });
    }

    const aiToggle = $('#eq-ai-toggle');
    if (aiToggle) {
      aiToggle.addEventListener('click', function () {
        aiEnabled = !aiEnabled;
        aiToggle.textContent = aiEnabled ? 'AI ranking: On' : 'AI ranking: Off';
        aiToggle.classList.toggle('is-primary', aiEnabled);
        if (aiEnabled) sortMode = 'ai';
        const sortEl = $('#eq-sort');
        if (sortEl && aiEnabled) sortEl.value = 'ai';
        log(aiEnabled ? 'AI ranking enabled' : 'AI ranking paused');
        rescoreAll();
        renderAll();
      });
    }

    const refresh = $('#eq-refresh');
    if (refresh) {
      refresh.addEventListener('click', function () {
        rescoreAll();
        log('AI priorities recalculated on open applications');
        renderAll();
      });
    }
  }

  function init() {
    if (!$('#eq-component')) return;
    rescoreAll();
    const firstOpen = sortedOpen().find(function (i) {
      return i.status === 'open';
    });
    selectedId = firstOpen ? firstOpen.id : null;
    bindChrome();
    log('Application exception queue loaded · AI ranked · demo data');
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.eqExceptionQueue = { refresh: renderAll, init: init };
})();
