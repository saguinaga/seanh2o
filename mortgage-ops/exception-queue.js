/**
 * Custom component prototype: Exception Queue with AI prioritization.
 * Human acts; AI ranks. Demo data only. Not legal advice / not a live org.
 */
(function () {
  const COMPLIANCE = {
    disclosure: { label: 'Disclosure / docs', className: 'eq-tag--compliance' },
    kyc: { label: 'KYC / identity', className: 'eq-tag--compliance' },
    audit: { label: 'Audit trail', className: 'eq-tag--audit' },
    state: { label: 'State / jurisdiction', className: 'eq-tag--compliance' },
    fair: { label: 'Fair lending review', className: 'eq-tag--compliance' },
    privacy: { label: 'Data handling', className: 'eq-tag--compliance' },
  };

  /** Seed exceptions — illustrative specialty lending ops */
  let items = [
    {
      id: 'EX-2201',
      fileId: 'LF-10455',
      product: 'Bridge',
      title: 'Condition package incomplete after approval',
      summary:
        'File approved with conditions. Required entity docs still missing after two partner pings. Stage aging past internal SLA.',
      compliance: ['disclosure', 'audit'],
      slaDaysOver: 4,
      partnerTier: 'A',
      amountBand: '1.2M',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2202',
      fileId: 'LF-10482',
      product: 'Bridge',
      title: 'Identity verification mismatch on co-borrower entity',
      summary:
        'Name / formation docs do not line up with CRM party record. Hold before further credit action until ops or compliance clears the match.',
      compliance: ['kyc', 'audit'],
      slaDaysOver: 2,
      partnerTier: 'A',
      amountBand: '890K',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2203',
      fileId: 'LF-10491',
      product: 'Rental term',
      title: 'State-specific disclosure not stamped on package',
      summary:
        'Jurisdiction requires additional disclosure language for this product path. Package generated without the state stamp flag set true. Same failure mode as multi-jurisdiction offer/contract automation: wrong rules for the location, wrong artifact in the file.',
      compliance: ['state', 'disclosure'],
      slaDaysOver: 1,
      partnerTier: 'B',
      amountBand: '2.4M',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2207',
      fileId: 'LF-10518',
      product: 'Bridge',
      title: 'Offer package used wrong loan-type contract template',
      summary:
        'Illustrative: file advanced with a template tied to a different loan type. Multi-lender / multi-product shops break here when offer-level generation is not wired to loan type + jurisdiction rules. Needs human stop and regenerate with a logged reason.',
      compliance: ['disclosure', 'state', 'audit'],
      slaDaysOver: 3,
      partnerTier: 'A',
      amountBand: '1.5M',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2204',
      fileId: 'LF-10470',
      product: 'Bridge',
      title: 'Integration write-back failed after stage change',
      summary:
        'CRM shows Clear to fund; adjacent system still shows In underwriting. Dual status risks wrong external communication and weak audit story.',
      compliance: ['audit', 'privacy'],
      slaDaysOver: 3,
      partnerTier: 'B',
      amountBand: '650K',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2205',
      fileId: 'LF-10502',
      product: 'Build-for-rent',
      title: 'Manual pricing overlay applied without comment',
      summary:
        'Overlay present with no structured reason code. Ops needs a logged rationale before the file advances (review trail for later questions).',
      compliance: ['fair', 'audit'],
      slaDaysOver: 0,
      partnerTier: 'C',
      amountBand: '3.1M',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
    {
      id: 'EX-2206',
      fileId: 'LF-10510',
      product: 'Rental term',
      title: 'Partner asked for status; queue had no owner',
      summary:
        'Repeat submitter escalated via email. Not a pure compliance break, but certainty of close and partner experience are on the line.',
      compliance: [],
      slaDaysOver: 2,
      partnerTier: 'A',
      amountBand: '1.0M',
      owner: 'Unassigned',
      status: 'open',
      factors: null,
      score: 0,
      aiWhy: '',
    },
  ];

  const auditLog = [];
  let selectedId = null;
  let sortMode = 'ai'; // ai | sla | manual
  let aiEnabled = true;
  let listFilter = 'all'; // all | reg | sla | claimed

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
    const compliancePts = Math.min(36, item.compliance.length * 14);
    const slaPts = Math.min(28, item.slaDaysOver * 7);
    const partnerPts = tierPts(item.partnerTier);
    const sizePts = amountPts(item.amountBand);
    const openBoost = item.status === 'open' ? 4 : 0;
    const total = compliancePts + slaPts + partnerPts + sizePts + openBoost;

    const factors = [
      { name: 'Regulatory / compliance tags', pts: compliancePts, max: 36 },
      { name: 'SLA breach (days over)', pts: slaPts, max: 28 },
      { name: 'Partner / seller tier', pts: partnerPts, max: 22 },
      { name: 'File size band', pts: sizePts, max: 18 },
    ];

    let why = 'Balanced';
    if (compliancePts >= slaPts && compliancePts >= partnerPts) why = 'Compliance weight';
    else if (slaPts >= partnerPts) why = 'SLA pressure';
    else why = 'Partner impact';

    item.score = total;
    item.factors = factors;
    item.aiWhy = why;
    return item;
  }

  function rescoreAll() {
    items.forEach(scoreItem);
  }

  function matchesFilter(item) {
    if (listFilter === 'reg') return item.compliance.length > 0;
    if (listFilter === 'sla') return item.slaDaysOver >= 2;
    if (listFilter === 'claimed') return item.owner !== 'Unassigned' && item.status === 'open';
    return true;
  }

  function sortedOpen() {
    let open = items.filter((i) => i.status === 'open' && matchesFilter(i));
    let done = items.filter((i) => i.status !== 'open' && matchesFilter(i));
    if (listFilter === 'claimed') {
      done = [];
    }
    if (sortMode === 'sla') {
      open.sort((a, b) => b.slaDaysOver - a.slaDaysOver || b.score - a.score);
    } else if (sortMode === 'manual') {
      // keep array order for open; user can move up/down
    } else {
      open.sort((a, b) => b.score - a.score);
    }
    return open.concat(done);
  }

  function log(msg) {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    auditLog.unshift({ ts, msg });
    if (auditLog.length > 40) auditLog.pop();
    renderAudit();
  }

  function $(sel) {
    return document.querySelector(sel);
  }

  function renderStats() {
    const open = items.filter((i) => i.status === 'open');
    const reg = open.filter((i) => i.compliance.length > 0);
    const hot = open.filter((i) => i.slaDaysOver >= 2);
    const claimed = open.filter((i) => i.owner !== 'Unassigned');
    const set = (id, n) => {
      const el = $(id);
      if (el) el.textContent = String(n);
    };
    set('#eq-stat-open', open.length);
    set('#eq-stat-reg', reg.length);
    set('#eq-stat-sla', hot.length);
    set('#eq-stat-claimed', claimed.length);
    const map = {
      '#eq-stat-open': 'all',
      '#eq-stat-reg': 'reg',
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
  }

  function renderList() {
    const list = $('#eq-list');
    if (!list) return;
    const rows = sortedOpen();
    list.innerHTML = '';
    rows.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'eq-row' +
        (item.id === selectedId ? ' is-selected' : '') +
        (item.status !== 'open' ? ' is-done' : '');
      btn.dataset.id = item.id;

      const tags = item.compliance
        .map((c) => {
          const meta = COMPLIANCE[c];
          return '<span class="eq-tag ' + meta.className + '">' + meta.label + '</span>';
        })
        .join('');
      const slaTag =
        item.slaDaysOver > 0
          ? '<span class="eq-tag eq-tag--sla">' + item.slaDaysOver + 'd over SLA</span>'
          : '';
      const partnerTag =
        '<span class="eq-tag eq-tag--partner">Tier ' + item.partnerTier + '</span>';

      btn.innerHTML =
        '<span class="eq-rank">' + (item.status === 'open' ? idx + 1 : '✓') + '</span>' +
        '<span class="eq-row-main">' +
        '<span class="eq-row-id">' + item.id + ' · ' + item.fileId + '</span>' +
        '<div class="eq-row-title">' + item.title + '</div>' +
        '<div class="eq-row-meta">' + tags + slaTag + partnerTag + '</div>' +
        '</span>' +
        '<span class="eq-score">' +
        '<div class="val">' + (aiEnabled ? item.score : '—') + '</div>' +
        '<div class="why">' + (aiEnabled ? item.aiWhy : 'AI off') + '</div>' +
        '</span>';

      btn.addEventListener('click', () => {
        selectedId = item.id;
        renderList();
        renderDetail();
      });
      list.appendChild(btn);
    });
  }

  function selected() {
    return items.find((i) => i.id === selectedId) || null;
  }

  function renderDetail() {
    const pane = $('#eq-detail');
    if (!pane) return;
    const item = selected();
    if (!item) {
      pane.className = 'eq-detail empty';
      pane.innerHTML = '<p>Select an exception to review AI ranking and take action.</p>';
      return;
    }
    pane.className = 'eq-detail';
    const open = item.status === 'open';
    const factorsHtml = (item.factors || [])
      .map((f) => {
        const pct = Math.round((f.pts / f.max) * 100);
        return (
          '<div class="eq-factor">' +
          '<span class="name">' + f.name + '</span>' +
          '<span class="pts">+' + f.pts + '</span>' +
          '<div class="eq-factor-bar"><i style="width:' + pct + '%"></i></div>' +
          '</div>'
        );
      })
      .join('');

    const tags = item.compliance
      .map((c) => {
        const meta = COMPLIANCE[c];
        return '<span class="eq-tag ' + meta.className + '">' + meta.label + '</span>';
      })
      .join(' ') || '<span class="eq-tag">Ops only</span>';

    pane.innerHTML =
      '<h3>' + item.title + '</h3>' +
      '<p class="file-line">' +
      item.id + ' · File <strong>' + item.fileId + '</strong> · ' + item.product +
      ' · ' + item.amountBand + ' · Owner: <strong>' + item.owner + '</strong>' +
      (item.status !== 'open' ? ' · <strong>Status: ' + item.status + '</strong>' : '') +
      '</p>' +
      '<section><h4>Situation</h4><p>' + item.summary + '</p></section>' +
      '<section><h4>Regulatory / control tags</h4><div class="eq-row-meta">' + tags + '</div>' +
      '<p style="margin-top:8px">In a regulated shop, these tags are not decoration. They tell the queue why a human with the right seat should touch this before a pure speed-only file.</p></section>' +
      '<section><h4>Drill further</h4><div class="eq-actions" style="padding-top:0">' +
      '<button type="button" data-nav="pipeline" data-file="' + item.fileId + '">Open loan file</button>' +
      '<button type="button" data-nav="dashboard">Dashboard context</button>' +
      '<button type="button" data-nav="path">Path prototype</button>' +
      '</div></section>' +
      '<section><h4>AI priority breakdown' + (aiEnabled ? '' : ' (paused)') + '</h4>' +
      (aiEnabled
        ? '<p style="margin-bottom:8px">Score <strong>' + item.score + '</strong> · ' + item.aiWhy +
          '. AI proposes order only. People claim, resolve, or escalate.</p><div class="eq-factors">' +
          factorsHtml + '</div>'
        : '<p>AI ranking is off. List order is manual / SLA sort.</p>') +
      '</section>' +
      '<section><h4>Action note (logged)</h4>' +
      '<textarea class="eq-note-input" id="eq-note" placeholder="What did you verify? Who did you loop in? Keep it audit-friendly." ' +
      (open ? '' : 'disabled') + '></textarea></section>' +
      '<div class="eq-actions">' +
      '<button type="button" class="is-primary" data-act="claim" ' + (open ? '' : 'disabled') + '>Claim for me</button>' +
      '<button type="button" data-act="compliance" ' + (open ? '' : 'disabled') + '>Escalate to compliance</button>' +
      '<button type="button" data-act="resolve" ' + (open ? '' : 'disabled') + '>Mark resolved</button>' +
      '<button type="button" data-act="up" ' + (open && sortMode === 'manual' ? '' : 'disabled') + '>Move up</button>' +
      '<button type="button" data-act="down" ' + (open && sortMode === 'manual' ? '' : 'disabled') + '>Move down</button>' +
      '</div>';

    pane.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => handleAction(btn.getAttribute('data-act'), item));
    });
    pane.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nav = btn.getAttribute('data-nav');
        const file = btn.getAttribute('data-file');
        if (nav === 'pipeline' && window.mortgageShell) {
          window.mortgageShell.navigate('pipeline', 'all-open');
          setTimeout(function () {
            if (window.mortgagePipeline && file) window.mortgagePipeline.selectFile(file);
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
      log(item.id + ' claimed by You (demo)' + (note ? ' — ' + note : ''));
    } else if (act === 'compliance') {
      item.owner = 'Compliance queue';
      item.status = 'escalated';
      log(item.id + ' escalated to compliance' + (note ? ' — ' + note : '') + ' · audit trail entry created');
      selectedId = item.id;
    } else if (act === 'resolve') {
      item.status = 'resolved';
      item.owner = item.owner === 'Unassigned' ? 'You (demo)' : item.owner;
      log(item.id + ' resolved by ' + item.owner + (note ? ' — ' + note : '') + ' · ready for sample audit export');
    } else if (act === 'up' || act === 'down') {
      if (sortMode !== 'manual') return;
      const open = items.filter((i) => i.status === 'open');
      const rest = items.filter((i) => i.status !== 'open');
      const idx = open.findIndex((i) => i.id === item.id);
      if (idx < 0) return;
      const swap = act === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= open.length) return;
      const tmp = open[idx];
      open[idx] = open[swap];
      open[swap] = tmp;
      items = open.concat(rest);
      log(item.id + ' manually reordered (' + act + ') · AI order overridden for session');
    }

    rescoreAll();
    renderAll();
  }

  function renderAudit() {
    const ul = $('#eq-audit-list');
    if (!ul) return;
    if (!auditLog.length) {
      ul.innerHTML = '<li><span class="ts">—</span>No actions yet. Claim, escalate, or resolve to write the trail.</li>';
      return;
    }
    ul.innerHTML = auditLog
      .map((e) => '<li><span class="ts">' + e.ts + '</span>' + e.msg + '</li>')
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
        if (!visible.some((i) => i.id === selectedId)) {
          selectedId = visible[0] ? visible[0].id : null;
        }
        renderAll();
      });
    });

    const sort = $('#eq-sort');
    if (sort) {
      sort.addEventListener('change', () => {
        sortMode = sort.value;
        log('Sort mode → ' + sortMode + (sortMode === 'ai' ? ' (AI proposes order)' : ''));
        renderAll();
      });
    }

    const aiToggle = $('#eq-ai-toggle');
    if (aiToggle) {
      aiToggle.addEventListener('click', () => {
        aiEnabled = !aiEnabled;
        aiToggle.textContent = aiEnabled ? 'AI ranking: On' : 'AI ranking: Off';
        aiToggle.classList.toggle('is-primary', aiEnabled);
        if (aiEnabled) sortMode = 'ai';
        const sortEl = $('#eq-sort');
        if (sortEl && aiEnabled) sortEl.value = 'ai';
        log(aiEnabled ? 'AI ranking enabled · scores refreshed' : 'AI ranking paused · humans own order');
        rescoreAll();
        renderAll();
      });
    }

    const refresh = $('#eq-refresh');
    if (refresh) {
      refresh.addEventListener('click', () => {
        rescoreAll();
        log('AI priorities recalculated against current open set');
        renderAll();
      });
    }
  }

  function init() {
    if (!$('#eq-component')) return;
    rescoreAll();
    var firstOpen = sortedOpen().find(function (i) { return i.status === 'open'; });
    selectedId = firstOpen ? firstOpen.id : null;
    bindChrome();
    log('Queue loaded · AI ranked open exceptions · demo data only');
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-init when shell shows panel (panel may start hidden)
  window.eqExceptionQueue = { refresh: renderAll, init: init };
})();
