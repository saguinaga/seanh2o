/** Loan application path prototypes. Not offer management. */
(function () {
  const external = [
    {
      id: 'e1',
      label: 'Start application',
      friction: false,
      title: 'Broker / borrower starts an application',
      body: 'Product selection (bridge, rental term, BFR, etc.) and channel. Goal: get a complete application in, not a marketing brochure.',
      points: [
        'Competitive lever: easy start, clear product fit',
        'SF: application record, product, channel, broker fields',
      ],
    },
    {
      id: 'e2',
      label: 'Complete package',
      friction: true,
      title: 'Application completeness',
      body: 'Files stall when required docs and fields are unclear. Brokers multi-home. Incomplete applications never get a real yes.',
      points: [
        'Competitive lever: checklist clarity, fewer kickbacks',
        'SF: file-complete flag; time to complete application',
      ],
    },
    {
      id: 'e3',
      label: 'Credit decision',
      friction: true,
      title: 'Time to a real yes',
      body: 'Core time-to-yes moment on the application. Speed matters; a decision that sticks matters more.',
      points: [
        'Competitive lever: decision SLA that holds',
        'SF: stage timestamps; median/p90 to decision',
      ],
    },
    {
      id: 'e4',
      label: 'Conditions',
      friction: true,
      title: 'Clear conditions on the application',
      body: 'Where applications go quiet. Ownership and aging decide whether approved feels like progress.',
      points: [
        'Competitive lever: owned conditions, visible status',
        'SF: open conditions; aging; exception queue',
      ],
    },
    {
      id: 'e5',
      label: 'Fund',
      friction: false,
      title: 'Clear to fund / fund',
      body: 'Funding handoff. Consistency at the finish earns the next application from that broker.',
      points: [
        'Competitive lever: clear-to-fund reliability',
        'SF: clear-to-fund stage; fallout after approval',
      ],
    },
    {
      id: 'e6',
      label: 'Next app',
      friction: false,
      title: 'Why they submit again',
      body: 'Retention is whole-path experience on applications: speed, certainty, status clarity.',
      points: [
        'Competitive lever: path experience',
        'SF: repeat applications by broker',
      ],
    },
  ];

  const internal = [
    {
      id: 'i1',
      label: 'App created',
      friction: false,
      title: 'Application create',
      body: 'Minimum product, channel, and broker fields so later stages are analyzable.',
      points: [
        'BA: which fields block a useful stage model?',
        'Artifacts: intake report by product and channel',
      ],
    },
    {
      id: 'i2',
      label: 'Application in',
      friction: true,
      title: 'Stage: Application in',
      body: 'Definition must be written. Incomplete vs complete applications poison every funnel chart.',
      points: [
        'BA: what event sets application-in?',
        'Artifacts: incomplete rate; time to file complete',
      ],
    },
    {
      id: 'i3',
      label: 'Underwriting',
      friction: true,
      title: 'Stage: In underwriting',
      body: 'Where leadership wants decision speed. Rules/policy checks run here as company process, not as the product story to the customer.',
      points: [
        'BA: when does the decision clock start and pause?',
        'Artifacts: aging buckets; WIP by underwriter',
      ],
    },
    {
      id: 'i4',
      label: 'Approved w/ cond.',
      friction: true,
      title: 'Stage: Approved with conditions',
      body: 'Often the real work queue on applications. Exception-first views with owners.',
      points: [
        'BA: is each condition tracked with an owner?',
        'Artifacts: open conditions; p90 clear time',
      ],
    },
    {
      id: 'i5',
      label: 'Clear to fund',
      friction: false,
      title: 'Stage: Clear to fund',
      body: 'Handoff across credit, ops, funding. Integration failures show as dual status on the application.',
      points: [
        'BA: system of truth for clear-to-fund?',
        'Artifacts: cycle time; failed write-backs',
      ],
    },
    {
      id: 'i6',
      label: 'Funded + learn',
      friction: false,
      title: 'Funded and feed the backlog',
      body: 'Close the loop: which frictions cost time to yes on applications. That is Accelerator work.',
      points: [
        'BA: what shipped last month because of the dashboard?',
        'Artifacts: conversion vs baseline; stories with AC',
      ],
    },
  ];

  function drillLinks(step) {
    const links = [];
    if (step.friction) {
      links.push({ nav: 'exceptions:queue', label: 'Application exception queue', primary: true });
      links.push({ nav: 'pipeline:past-sla', label: 'Applications past SLA' });
    } else {
      links.push({ nav: 'accelerator:dashboard', label: 'Dashboard', primary: true });
      links.push({ nav: 'pipeline:all-open', label: 'All applications' });
    }
    links.push({ nav: 'reports:ops-folder', label: 'App pipeline reports' });
    return links;
  }

  function renderRail(container, steps, detailEl, selectedId) {
    container.innerHTML = '';
    steps.forEach(function (step, i) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'flow-step' +
        (step.friction ? ' is-friction' : '') +
        (step.id === selectedId ? ' is-selected' : '');
      btn.dataset.id = step.id;
      btn.innerHTML =
        '<span class="step-num">Stage ' +
        (i + 1) +
        (step.friction ? ' · friction' : '') +
        '</span>' +
        step.label;
      btn.addEventListener('click', function () {
        select(container, steps, detailEl, step.id);
      });
      container.appendChild(btn);
    });
  }

  function renderDetail(detailEl, step) {
    if (!step) {
      detailEl.innerHTML = '<p>Select a stage.</p>';
      return;
    }
    const tagClass = step.friction ? 'tag tag-friction' : 'tag';
    const tagLabel = step.friction ? 'Friction on the application' : 'Application path moment';
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
      '<span class="' +
      tagClass +
      '">' +
      tagLabel +
      '</span>' +
      '<h3>' +
      step.title +
      '</h3>' +
      '<p>' +
      step.body +
      '</p>' +
      '<ul>' +
      step.points
        .map(function (p) {
          return '<li>' + p + '</li>';
        })
        .join('') +
      '</ul>' +
      '<div class="path-deep"><h4>Drill down</h4>' +
      '<p style="font-size:0.85rem;color:var(--muted);margin:0 0 8px">Jump to the working surface for this step on the loan application journey.</p>' +
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
    const step = steps.find(function (s) { return s.id === id; }) || steps[0];
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
    document.querySelectorAll('.flow-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        const panel = tab.getAttribute('data-panel');
        document.querySelectorAll('.flow-tab').forEach(function (t) {
          const on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        document.querySelectorAll('.flow-panel').forEach(function (p) {
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
  window.mortgagePath = { refresh: initAll };
})();
