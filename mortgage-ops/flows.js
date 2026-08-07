/** Illustrative Salesforce path prototypes. Not any client's real process or org. */
(function () {
  const external = [
    {
      id: 'e1',
      label: 'Product match',
      friction: false,
      title: 'Deal shape meets product box',
      body: 'Investor or broker has a strategy (bridge, rental term, build-for-rent, non-QM). First filter is eligibility. In CRM this should be product and channel fields you can report on.',
      points: [
        'Competitive lever: product fit messaging',
        'SF: product picklist / record type; report by product and channel',
      ],
    },
    {
      id: 'e2',
      label: 'Submit package',
      friction: true,
      title: 'Submission friction',
      body: 'Files stall when required docs or entity package rules are unclear. Correspondents multi-home. Painful intake loses the relationship before credit starts.',
      points: [
        'Competitive lever: checklist clarity and fewer kickbacks',
        'SF: file-complete flag; time from create to Application in; incomplete list view',
      ],
    },
    {
      id: 'e3',
      label: 'Credit decision',
      friction: true,
      title: 'Time to a real yes',
      body: 'Core “time to yes” moment. Speed matters; certainty matters more. Re-trades push volume to competitors.',
      points: [
        'Competitive lever: decision SLA that holds',
        'SF: stage timestamps; median/p90 to decision; re-decision count',
      ],
    },
    {
      id: 'e4',
      label: 'Conditions clear',
      friction: true,
      title: 'Condition clearing grind',
      body: 'Where deals go quiet. Ownership, aging, and partner communication decide whether approved feels like progress.',
      points: [
        'Competitive lever: owned conditions and visible status',
        'SF: related conditions or tasks; aging report; exception list view by owner',
      ],
    },
    {
      id: 'e5',
      label: 'Fund / close',
      friction: false,
      title: 'Certainty of close',
      body: 'Funding handoff. Consistency at the finish earns repeat volume.',
      points: [
        'Competitive lever: clear-to-fund reliability',
        'SF: clear-to-fund stage; fallout after approval; integration failure flags',
      ],
    },
    {
      id: 'e6',
      label: 'Repeat / refer',
      friction: false,
      title: 'Why they come back',
      body: 'Retention is the product. Whole-path experience decides the next file.',
      points: [
        'Competitive lever: path experience + relationship memory',
        'SF: account / contact rollups; repeat opportunity rate by seller',
      ],
    },
  ];

  const internal = [
    {
      id: 'i1',
      label: 'Lead / opp open',
      friction: false,
      title: 'Capture with reportable fields',
      body: 'Lead or Opportunity create. Minimum product, channel, and seller fields or later dashboards are fiction.',
      points: [
        'BA: which fields are required vs nice-to-have for stage analytics?',
        'Artifacts: page layout notes; validation only where it protects data quality',
      ],
    },
    {
      id: 'i2',
      label: 'Application in',
      friction: true,
      title: 'Stage: Application in',
      body: 'Definition must be written. Sales and ops often mean different things by “in.” That poisons every summary report.',
      points: [
        'BA: what event sets the stage, and can users game it?',
        'Artifacts: stage definition; report Apps Created / Incomplete package',
      ],
    },
    {
      id: 'i3',
      label: 'In underwriting',
      friction: true,
      title: 'Stage: In underwriting',
      body: 'Where leadership wants speed metrics. Instrument enter time, idle time, and owner. Not only last-modified.',
      points: [
        'BA: when does the clock start and pause?',
        'Artifacts: aging buckets; WIP by underwriter list view; SOQL if history is messy',
      ],
    },
    {
      id: 'i4',
      label: 'Approved w/ cond.',
      friction: true,
      title: 'Stage: Approved with conditions',
      body: 'Often the real work queue. Dashboards should be exception-first with owners, not a single green pipeline chart.',
      points: [
        'BA: is each condition a related record, task, or free text?',
        'Artifacts: open conditions report; p90 clear time; top condition codes chart',
      ],
    },
    {
      id: 'i5',
      label: 'Clear to fund',
      friction: false,
      title: 'Stage: Clear to fund',
      body: 'Handoff across credit, ops, funding. Integration failures show up as “CRM said yes but…”',
      points: [
        'BA: system of truth for clear-to-fund status?',
        'Artifacts: cycle time report; failed integration exception report',
      ],
    },
    {
      id: 'i6',
      label: 'Funded + backlog',
      friction: false,
      title: 'Funded and feed the backlog',
      body: 'Close the loop: which frictions cost time to yes. That is Accelerator work with admin/platform partners.',
      points: [
        'BA: what shipped last month because of the dashboard?',
        'Artifacts: conversion vs baseline; user stories with AC for field or automation fixes',
      ],
    },
  ];

  function renderRail(container, steps, detailEl, selectedId) {
    container.innerHTML = '';
    steps.forEach((step, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'flow-step' + (step.friction ? ' is-friction' : '') + (step.id === selectedId ? ' is-selected' : '');
      btn.dataset.id = step.id;
      btn.innerHTML = '<span class="step-num">Stage ' + (i + 1) + (step.friction ? ' · friction' : '') + '</span>' + step.label;
      btn.addEventListener('click', () => select(container, steps, detailEl, step.id));
      container.appendChild(btn);
    });
  }

  function drillLinks(step) {
    const friction = step.friction;
    const links = [];
    if (friction) {
      links.push({ nav: 'exceptions:queue', label: 'Open Exception Queue', primary: true });
      links.push({ nav: 'pipeline:past-sla', label: 'Loan files past SLA' });
    } else {
      links.push({ nav: 'accelerator:dashboard', label: 'Dashboard', primary: true });
      links.push({ nav: 'pipeline:all-open', label: 'Loan pipeline' });
    }
    links.push({ nav: 'reports:ops-folder', label: 'Ops reports' });
    return links;
  }

  function renderDetail(detailEl, step) {
    if (!step) {
      detailEl.innerHTML = '<p>Select a stage.</p>';
      return;
    }
    const tagClass = step.friction ? 'tag tag-friction' : 'tag';
    const tagLabel = step.friction ? 'Friction · instrument in SF' : 'Path moment · CRM';
    const links = drillLinks(step)
      .map(function (l) {
        return (
          '<button type="button" class="' +
          (l.primary ? 'is-primary' : '') +
          '" data-path-nav="' +
          l.nav +
          '">' +
          l.label +
          '</button>'
        );
      })
      .join('');

    detailEl.innerHTML =
      '<span class="' + tagClass + '">' + tagLabel + '</span>' +
      '<h3>' + step.title + '</h3>' +
      '<p>' + step.body + '</p>' +
      '<ul>' + step.points.map((p) => '<li>' + p + '</li>').join('') + '</ul>' +
      '<div class="path-deep">' +
      '<h4>Drill down from this stage</h4>' +
      '<p style="font-size:0.85rem;color:var(--muted);margin:0 0 8px">Same journey as the dashboard and exception queue. Jump into the working surface that would own this moment.</p>' +
      '<div class="path-links drill-actions" style="margin-top:0">' +
      links +
      '</div></div>';

    detailEl.querySelectorAll('[data-path-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const parts = btn.getAttribute('data-path-nav').split(':');
        if (window.mortgageShell) window.mortgageShell.navigate(parts[0], parts[1]);
      });
    });
  }

  function select(container, steps, detailEl, id) {
    const step = steps.find((s) => s.id === id) || steps[0];
    renderRail(container, steps, detailEl, step.id);
    renderDetail(detailEl, step);
  }

  function initFlow(railId, detailId, steps) {
    const rail = document.getElementById(railId);
    const detail = document.getElementById(detailId);
    if (!rail || !detail) return;
    select(rail, steps, detail, steps[0].id);
  }

  function initTabs() {
    document.querySelectorAll('.flow-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const panel = tab.getAttribute('data-panel');
        document.querySelectorAll('.flow-tab').forEach((t) => {
          const on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        document.querySelectorAll('.flow-panel').forEach((p) => {
          const on = p.id === 'panel-' + panel;
          p.classList.toggle('is-active', on);
          if (on) p.removeAttribute('hidden');
          else p.setAttribute('hidden', '');
        });
      });
    });
  }

  function initAll() {
    initFlow('flow-external', 'detail-external', external);
    initFlow('flow-internal', 'detail-internal', internal);
    initTabs();
  }

  initAll();

  window.mortgagePath = {
    refresh: function () {
      // re-bind if panel was hidden at first paint
      initAll();
    },
  };
})();
