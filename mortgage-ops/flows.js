/** Illustrative mortgage path prototypes for case study. Not any client's real process. */
(function () {
  const external = [
    {
      id: 'e1',
      label: 'Deal + product match',
      friction: false,
      title: 'Deal shape meets product box',
      body: 'Investor or broker has a property strategy (fix-flip bridge, rental term, build-for-rent, non-QM income story). First filter is whether your guidelines fit without forcing a consumer QM template.',
      points: [
        'Competitive lever: product fit and clear eligibility messaging',
        'Analytics angle later: inquiry-to-app conversion by product and channel',
      ],
    },
    {
      id: 'e2',
      label: 'Submit package',
      friction: true,
      title: 'Submission friction',
      body: 'Files stall when required docs, entity docs, or property package rules are unclear. Correspondents multi-home. Painful intake loses the relationship before credit starts.',
      points: [
        'Competitive lever: clean checklist, fewer kickbacks, predictable status',
        'Analytics: incomplete package rate, time from first submit to “file complete”',
      ],
    },
    {
      id: 'e3',
      label: 'Credit decision',
      friction: true,
      title: 'Time to a real yes',
      body: 'This is the “time to yes” moment. Speed matters; certainty matters more. Re-trades and surprise overlays push volume elsewhere.',
      points: [
        'Competitive lever: decision SLA that holds, transparent conditions',
        'Analytics: median/p90 decision time, re-decision rate, condition count at approval',
      ],
    },
    {
      id: 'e4',
      label: 'Conditions clear',
      friction: true,
      title: 'Condition clearing grind',
      body: 'Where deals go to die quietly. Ownership, aging, and partner communication decide whether “approved” feels like progress or limbo.',
      points: [
        'Competitive lever: ownership and partner-visible status',
        'Analytics: open conditions by age, time-to-clear, repeat condition types',
      ],
    },
    {
      id: 'e5',
      label: 'Fund / close',
      friction: false,
      title: 'Certainty of close',
      body: 'Funding and handoff. A firm that is boringly consistent at the finish earns repeat investor and broker volume.',
      points: [
        'Competitive lever: clear-to-close reliability',
        'Analytics: clear-to-fund time, fallout after approval, post-close defect themes',
      ],
    },
    {
      id: 'e6',
      label: 'Repeat / refer',
      friction: false,
      title: 'Why they come back',
      body: 'Retention is the product. Experience across the path, not a single rate quote, decides the next file.',
      points: [
        'Competitive lever: whole-path experience + relationship memory',
        'Analytics: repeat submitter rate, time between files, qualitative complaint themes',
      ],
    },
  ];

  const internal = [
    {
      id: 'i1',
      label: 'Lead / opp capture',
      friction: false,
      title: 'Capture with product intent',
      body: 'SF (or CRM) needs enough product and channel fields that later stages are analyzable. Garbage in means vanity funnels.',
      points: [
        'BA question: what minimum fields block a useful stage model?',
        'Dashboard object: intake volume by product, channel, seller',
      ],
    },
    {
      id: 'i2',
      label: 'Application in',
      friction: true,
      title: 'Stage: application in',
      body: 'Definition must be written. “In” that means different things to sales and ops will poison every chart.',
      points: [
        'BA question: what event writes application-in, and can it be gamed?',
        'Dashboard object: apps in, incomplete rate, time to file complete',
      ],
    },
    {
      id: 'i3',
      label: 'In underwriting',
      friction: true,
      title: 'Stage: in underwriting / decisioning',
      body: 'Where leadership usually wants speed metrics. Instrument start/stop and idle time, not only timestamps on status flips.',
      points: [
        'BA question: when does the clock start and pause?',
        'Dashboard object: time to decision, WIP, aging buckets, owner load',
      ],
    },
    {
      id: 'i4',
      label: 'Approved w/ conditions',
      friction: true,
      title: 'Exception queue reality',
      body: 'Approved-with-conditions is often the real work queue. Dashboards should be exception-first with owners.',
      points: [
        'BA question: who owns each condition type, and is that in SF?',
        'Dashboard object: open conditions, p90 clear time, top condition codes',
      ],
    },
    {
      id: 'i5',
      label: 'Clear to fund',
      friction: false,
      title: 'Stage: clear to close / fund',
      body: 'Handoff between credit, ops, and funding. Integration failures show up here as “the system said yes but…”',
      points: [
        'BA question: which system is source of truth for clear-to-fund?',
        'Dashboard object: clear-to-fund cycle, fallout, failed integration events',
      ],
    },
    {
      id: 'i6',
      label: 'Funded + learn',
      friction: false,
      title: 'Funded and feedback loop',
      body: 'Close the loop into backlog: which frictions cost time to yes and partner trust. That is Accelerator work.',
      points: [
        'BA question: what shipped last month because of the dashboard?',
        'Dashboard object: conversion by stage vs baseline; backlog impact tags',
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
      btn.innerHTML = '<span class="step-num">Step ' + (i + 1) + (step.friction ? ' · friction' : '') + '</span>' + step.label;
      btn.addEventListener('click', () => select(container, steps, detailEl, step.id));
      container.appendChild(btn);
    });
  }

  function renderDetail(detailEl, step) {
    if (!step) {
      detailEl.innerHTML = '<p>Select a step.</p>';
      return;
    }
    const tagClass = step.friction ? 'tag tag-friction' : 'tag';
    const tagLabel = step.friction ? 'Competitive friction' : 'Path moment';
    detailEl.innerHTML =
      '<span class="' + tagClass + '">' + tagLabel + '</span>' +
      '<h3>' + step.title + '</h3>' +
      '<p>' + step.body + '</p>' +
      '<ul>' + step.points.map((p) => '<li>' + p + '</li>').join('') + '</ul>';
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
    const tabs = document.querySelectorAll('.flow-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const panel = tab.getAttribute('data-panel');
        tabs.forEach((t) => {
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

  initFlow('flow-external', 'detail-external', external);
  initFlow('flow-internal', 'detail-internal', internal);
  initTabs();
})();
