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

  /**
   * Expand demo book to ~100 apps with varied products, stages, and friction patterns.
   * Seed apps above stay first (linked to Exceptions / act-now). Generated ids APP-50xxx+.
   */
  (function expandBook() {
    var TARGET = 100;
    // Seeded RNG so the book is stable across reloads (demo, not live data)
    var _s = 0x2f6e2b1;
    function rnd() {
      _s = (_s * 1664525 + 1013904223) >>> 0;
      return _s / 4294967296;
    }
    function ri(n) {
      return Math.floor(rnd() * n);
    }
    var OWNERS = ['M. Chen', 'J. Ortiz', 'A. Singh', 'R. Patel', 'K. Brooks', 'Funding desk', 'L. Nguyen', 'S. Okonkwo'];
    var BROKERS = [
      { name: 'Summit Capital', tier: 'A' },
      { name: 'Harbor Investors', tier: 'A' },
      { name: 'Metro Hard Money', tier: 'B' },
      { name: 'Pacific BFR LLC', tier: 'B' },
      { name: 'Coastline Brokers', tier: 'B' },
      { name: 'Inland Equity Desk', tier: 'C' },
      { name: 'Northstar Lending Group', tier: 'A' },
      { name: 'Valley Correspondent', tier: 'C' },
      { name: 'Bay Area Private Credit', tier: 'B' },
      { name: 'Sunbelt Capital Partners', tier: 'A' },
    ];
    var PRODUCTS = [
      { key: 'bridge', label: 'Bridge', weight: 22 },
      { key: 'fix_flip', label: 'Fix-and-flip', weight: 18 },
      { key: 'dscr', label: 'DSCR (rental)', weight: 18 },
      { key: 'term_rental', label: 'Term rental / portfolio', weight: 14 },
      { key: 'bfr', label: 'Build-for-rent', weight: 12 },
      { key: 'non_qm', label: 'Non-QM / alt docs', weight: 16 },
    ];
    var STAGES_GEN = [
      { id: 'app', label: 'Application in', weight: 16 },
      { id: 'uw', label: 'In underwriting', weight: 32 },
      { id: 'cond', label: 'Approved w/ conditions', weight: 24 },
      { id: 'ctf', label: 'Clear to fund', weight: 14 },
      { id: 'funded', label: 'Funded', weight: 14 },
    ];

    var SCENARIOS = {
      bridge: [
        {
          tags: ['stuck', 'policy'],
          issues: ['Entity docs do not match parties on application'],
          conds: [],
          note: 'Policy path before decision. Owner needed on entity package.',
        },
        {
          tags: ['stuck', 'conditions'],
          issues: ['Interest reserve evidence incomplete'],
          conds: [
            { text: 'Interest reserve wire evidence', owner: 'Broker' },
            { text: 'Updated payoff statement', owner: 'Ops' },
          ],
          note: 'Approved subject to reserves. Tier pressure if SLA slips.',
        },
        {
          tags: ['data'],
          issues: ['CRM stage lag vs LOS status'],
          conds: [],
          note: 'Dual-system noise. Fix source of truth before broker status.',
        },
        {
          tags: [],
          issues: [],
          conds: [],
          note: 'Clean bridge file in normal flow.',
        },
        {
          tags: ['stuck'],
          issues: ['Extension request with incomplete exit narrative'],
          conds: [{ text: 'Exit / refinance LOI', owner: 'Broker' }],
          note: 'Maturity risk. Exit story incomplete.',
        },
      ],
      fix_flip: [
        {
          tags: ['stuck'],
          issues: ['Draw inspection overdue', 'ARV depends on scope verification'],
          conds: [],
          note: 'Rehab capital stalled on inspection.',
        },
        {
          tags: ['stuck', 'conditions'],
          issues: ['Budget change after underwrite'],
          conds: [
            { text: 'Revised rehab budget signed', owner: 'Broker' },
            { text: 'Inspection on draw #2', owner: 'Ops' },
          ],
          note: 'Scope creep after yes. Conditions factory owns the list.',
        },
        {
          tags: ['policy'],
          issues: ['LTC out of product box · exception path'],
          conds: [],
          note: 'Needs product exception or restructure.',
        },
        {
          tags: [],
          issues: [],
          conds: [{ text: 'Permit package (cleared)', owner: 'Ops', status: 'cleared' }],
          note: 'Flip progressing; prior conditions mostly clear.',
        },
      ],
      dscr: [
        {
          tags: ['conditions', 'policy'],
          issues: ['Rent roll vs DSCR underwrite mismatch'],
          conds: [
            { text: 'Signed rent roll supporting underwrite rents', owner: 'Broker' },
            { text: 'Leases matching DSCR rent used', owner: 'Broker' },
            { text: 'Re-run DSCR after package', owner: 'UW' },
          ],
          note: 'Coverage number is the decision. Package must support it.',
        },
        {
          tags: ['stuck', 'conditions'],
          issues: ['STR income package incomplete'],
          conds: [{ text: '12-mo STR platform statements', owner: 'Broker' }],
          note: 'Short-term rental path needs full income stack.',
        },
        {
          tags: [],
          issues: [],
          conds: [],
          note: 'Stabilized DSCR rental on track.',
        },
        {
          tags: ['data'],
          issues: ['Multi-unit lease stack missing unit'],
          conds: [{ text: 'Lease for missing unit', owner: 'Broker' }],
          note: 'Property-level data gap.',
        },
      ],
      term_rental: [
        {
          tags: ['conditions'],
          issues: ['Portfolio unit data incomplete'],
          conds: [
            { text: 'Unit schedule for property gap', owner: 'Broker' },
            { text: 'Portfolio insurance endorsement', owner: 'Broker' },
          ],
          note: 'Multi-property package holds conversion.',
        },
        {
          tags: ['stuck'],
          issues: ['Occupancy schedule stale'],
          conds: [{ text: 'Current occupancy cert', owner: 'Broker' }],
          note: 'Stabilized term product; occupancy truth lagging.',
        },
        {
          tags: [],
          issues: [],
          conds: [],
          note: 'Term rental moving cleanly.',
        },
      ],
      bfr: [
        {
          tags: ['stuck'],
          issues: ['Construction milestone package incomplete'],
          conds: [],
          note: 'Draw blocked on milestone evidence.',
        },
        {
          tags: ['stuck', 'conditions'],
          issues: ['Draw schedule vs budget mismatch'],
          conds: [
            { text: 'Updated draw schedule', owner: 'Broker' },
            { text: 'GC change order log', owner: 'Ops' },
          ],
          note: 'BFR economics + construction stack.',
        },
        {
          tags: [],
          issues: [],
          conds: [],
          note: 'BFR intake / UW normal course.',
        },
      ],
      non_qm: [
        {
          tags: ['stuck', 'policy'],
          issues: ['Bank-statement package incomplete (12-mo)'],
          conds: [],
          note: 'Alt docs incomplete; decision clock should not run.',
        },
        {
          tags: ['conditions'],
          issues: ['LOX on credit event missing'],
          conds: [
            { text: 'Letter of explanation · credit event', owner: 'Broker' },
            { text: 'Guideline set confirmation v4', owner: 'Ops' },
          ],
          note: 'Non-QM post-decision conditions.',
        },
        {
          tags: ['policy'],
          issues: ['Guideline set version conflict'],
          conds: [],
          note: 'Internal guideline alignment before broker chase.',
        },
        {
          tags: [],
          issues: [],
          conds: [],
          note: 'Alt-doc package complete enough to progress.',
        },
      ],
    };

    function pickWeighted(list) {
      var total = 0;
      var i;
      for (i = 0; i < list.length; i++) total += list[i].weight || 1;
      var r = rnd() * total;
      for (i = 0; i < list.length; i++) {
        r -= list[i].weight || 1;
        if (r <= 0) return list[i];
      }
      return list[list.length - 1];
    }

    function amountFor(productKey) {
      var bands = {
        bridge: [420, 650, 780, 890, 1100, 1250, 1500, 1800],
        fix_flip: [380, 520, 680, 780, 920, 1100, 1400],
        dscr: [550, 720, 900, 1100, 1350, 1600, 2100],
        term_rental: [900, 1200, 1800, 2400, 2800, 3200, 4100],
        bfr: [2100, 2800, 3100, 3800, 4200, 5500, 6800],
        non_qm: [480, 620, 750, 920, 1050, 1280, 1550],
      };
      var arr = bands[productKey] || bands.bridge;
      var n = arr[ri(arr.length)];
      if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'M';
      return n + 'K';
    }

    function daysFor(stageId, stuck) {
      if (stageId === 'funded') return 0;
      if (stageId === 'ctf') return ri(3);
      if (stageId === 'app') return ri(4) + 1;
      if (stuck) return ri(10) + 6;
      if (stageId === 'cond') return ri(8) + 2;
      return ri(7) + 2;
    }

    function timeline(stageId, days, scenarioIssue) {
      var ev = [{ t: 'Day 0', e: 'Application submitted' }];
      if (stageId === 'app') {
        ev.push({ t: 'Day ' + Math.min(days, 1), e: 'Intake review' });
        return ev;
      }
      ev.push({ t: 'Day 1', e: 'Moved to underwriting' });
      if (stageId === 'uw') {
        if (scenarioIssue) ev.push({ t: 'Day ' + Math.max(2, Math.min(days, 4)), e: scenarioIssue });
        ev.push({ t: 'Day ' + days, e: days >= 7 ? 'Still open · aging' : 'In underwriting' });
        return ev;
      }
      ev.push({ t: 'Day ' + Math.max(2, Math.min(5, days)), e: 'Credit decision · approved w/ conditions' });
      if (stageId === 'cond') {
        ev.push({ t: 'Day ' + days, e: 'Waiting on condition package' });
        return ev;
      }
      ev.push({ t: 'Day ' + Math.max(4, Math.min(days + 1, 9)), e: 'Conditions cleared' });
      if (stageId === 'ctf') {
        ev.push({ t: 'Day ' + days, e: 'Clear to fund · funding window' });
        return ev;
      }
      ev.push({ t: 'Day ' + (days + 1), e: 'Funded' });
      return ev;
    }

    function buildConditions(sc, stageId) {
      if (stageId !== 'cond' && stageId !== 'ctf' && stageId !== 'funded') {
        if (!sc.conds || !sc.conds.length) return [];
      }
      var list = (sc.conds || []).map(function (c, i) {
        var status =
          c.status ||
          (stageId === 'funded' || stageId === 'ctf'
            ? 'cleared'
            : i === 0 && stageId === 'cond'
              ? 'open'
              : rnd() > 0.45
                ? 'open'
                : 'cleared');
        if (stageId === 'funded' || stageId === 'ctf') status = 'cleared';
        return {
          id: 'c' + (i + 1),
          text: c.text,
          owner: c.owner || 'Broker',
          status: status,
        };
      });
      if (stageId === 'cond' && list.length === 0 && sc.tags && sc.tags.indexOf('conditions') !== -1) {
        list.push({
          id: 'c1',
          text: 'Outstanding condition package item',
          owner: 'Broker',
          status: 'open',
        });
      }
      return list;
    }

    var used = {};
    APPS.forEach(function (a) {
      used[a.id] = true;
    });

    var n = 0;
    var seq = 50001;
    while (APPS.length < TARGET && n < TARGET * 3) {
      n++;
      var prod = pickWeighted(PRODUCTS);
      var stage = pickWeighted(STAGES_GEN);
      var scenarios = SCENARIOS[prod.key] || SCENARIOS.bridge;
      var sc = scenarios[ri(scenarios.length)];

      // Stage-appropriate tag cleanup
      var tags = (sc.tags || []).slice();
      if (stage.id === 'funded' || stage.id === 'ctf') {
        tags = tags.filter(function (t) {
          return t !== 'stuck' && t !== 'conditions';
        });
      }
      if (stage.id === 'app' || stage.id === 'uw') {
        tags = tags.filter(function (t) {
          return t !== 'conditions';
        });
      }
      if (stage.id === 'cond' && tags.indexOf('conditions') === -1 && rnd() > 0.35) {
        tags.push('conditions');
      }
      var stuck = tags.indexOf('stuck') !== -1 || (stage.id === 'uw' && rnd() > 0.72);
      if (stuck && tags.indexOf('stuck') === -1 && stage.id !== 'funded' && stage.id !== 'ctf') tags.push('stuck');
      if (stage.id === 'funded' || stage.id === 'ctf') stuck = false;

      var days = daysFor(stage.id, stuck);
      var broker = BROKERS[ri(BROKERS.length)];
      var owner =
        stage.id === 'ctf' || stage.id === 'funded'
          ? 'Funding desk'
          : OWNERS[ri(OWNERS.length - 1)];

      var id = 'APP-' + seq;
      seq++;
      if (used[id]) continue;
      used[id] = true;

      var issue0 = sc.issues && sc.issues[0] ? sc.issues[0] : '';
      var issues = stage.id === 'funded' || stage.id === 'ctf' ? [] : (sc.issues || []).slice();
      if (stuck && issues.length === 0) issues.push('Aging past internal SLA');

      var onWatch = stuck && rnd() > 0.55;
      var exceptionId = null;
      // Seed apps keep real EX- queue links; only a few generated rows claim an EX id
      if (stuck && rnd() > 0.82) {
        exceptionId = 'EX-' + (3000 + (seq % 900));
      }

      var conds = buildConditions(sc, stage.id);
      if (stage.id === 'cond' && conds.length === 0) {
        conds = [
          { id: 'c1', text: 'Condition package item outstanding', owner: 'Broker', status: 'open' },
          { id: 'c2', text: 'Ops verification of cleared items', owner: 'Ops', status: 'open' },
        ];
      }

      APPS.push({
        id: id,
        productKey: prod.key,
        product: prod.label,
        stage: stage.label,
        stageId: stage.id,
        owner: owner,
        days: days,
        tags: tags,
        amount: amountFor(prod.key),
        broker: broker.name,
        tier: broker.tier,
        issues: issues,
        timeline: timeline(stage.id, days, issue0),
        exceptionId: exceptionId,
        onWatch: onWatch,
        conditions: conds,
        notes: sc.note || '',
      });
    }
  })();

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
      // Default book = open pipeline (exclude funded); other filters can still surface them if tagged
      if (statusFilter === 'all' && f.stageId === 'funded') return false;
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
    var base = (productFilter === 'all' ? APPS : APPS.filter(function (f) {
      return f.productKey === productFilter;
    })).filter(function (f) {
      return f.stageId !== 'funded';
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
      '<input type="text" class="app-cond-input" id="app-cond-text" placeholder="New condition (e.g. 12-mo bank statements months 1-12)" maxlength="200" />' +
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
      '<textarea class="app-notes-area" id="app-notes" rows="4" maxlength="2000" placeholder="Broker conversation, last ping, why a condition is stuck...">' +
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

    // Portal-style status counts (pattern from specialty lender app lists; not a client clone)
    var statusTabs =
      '<div class="app-status-tabs" role="tablist" aria-label="Application status">' +
      statusTab('all', s.all, 'All open') +
      statusTab('stuck', s.stuck, 'Past SLA') +
      statusTab('conditions', s.conditions, 'In progress') +
      statusTab('policy', s.policy, 'Rules / data') +
      statusTab('watch', s.watch, 'Act-now') +
      '<div class="app-status-tabs__filter">' +
      '<label for="app-filter-select">Filter by</label>' +
      '<select id="app-filter-select" class="app-filter-select" aria-label="Filter applications">' +
      '<option value="all"' +
      (statusFilter === 'all' ? ' selected' : '') +
      '>All open</option>' +
      '<option value="stuck"' +
      (statusFilter === 'stuck' ? ' selected' : '') +
      '>Past SLA</option>' +
      '<option value="conditions"' +
      (statusFilter === 'conditions' ? ' selected' : '') +
      '>In progress / conditions</option>' +
      '<option value="policy"' +
      (statusFilter === 'policy' ? ' selected' : '') +
      '>Rules / data</option>' +
      '<option value="watch"' +
      (statusFilter === 'watch' ? ' selected' : '') +
      '>Act-now</option>' +
      '</select></div></div>';

    root.innerHTML =
      '<div id="pipe-product-chips" class="prod-chip-rail"></div>' +
      '<div id="pipe-product-dna" class="prod-dna-host"></div>' +
      statusTabs +
      '<div class="drill-layout">' +
      '<div class="drill-list-card app-list-frame">' +
      '<div class="drill-list-card__h"><h2>Open applications</h2><span class="sub">' +
      rows.length +
      ' shown · hottest first</span></div>' +
      '<div class="drill-table-wrap"><table class="drill-table app-list-table"><thead><tr>' +
      '<th class="col-num">#</th><th>Loan type</th><th>Loan ID</th><th>Status</th><th>Broker</th><th>Days</th><th>Signal</th>' +
      '</tr></thead><tbody>' +
      (rows.length
        ? rows
            .map(function (f, idx) {
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
              var statusLabel = f.stage;
              if (f.stageId === 'cond')
                statusLabel =
                  'In progress · ' + openConditionCount(f) + ' open cond';
              return (
                '<tr data-id="' +
                f.id +
                '" class="' +
                (f.id === selectedId ? 'is-selected' : '') +
                (isHot ? ' is-hot' : '') +
                '"><td class="col-num">' +
                (idx + 1) +
                '</td><td>' +
                escapeHtml(f.product) +
                '<div class="app-row-sub">' +
                escapeHtml(f.amount) +
                '</div></td><td><strong>' +
                f.id +
                '</strong></td><td>' +
                escapeHtml(statusLabel) +
                '<div class="app-row-sub">Owner ' +
                escapeHtml(f.owner) +
                '</div></td><td>' +
                escapeHtml(f.broker) +
                ' <span class="app-tier">T' +
                f.tier +
                '</span></td><td class="' +
                (isHot || f.days >= 7 ? 'app-days-hot' : '') +
                '">' +
                f.days +
                'd</td><td class="app-row-signals">' +
                (badges.length ? badges.join(' ') : '<span class="app-row-quiet">ok</span>') +
                '</td></tr>'
              );
            })
            .join('')
        : '<tr><td colspan="7">No applications in this filter.</td></tr>') +
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

    root.querySelectorAll('[data-filter]').forEach(function (el) {
      el.addEventListener('click', function () {
        statusFilter = el.getAttribute('data-filter');
        render();
      });
    });
    var filterSel = root.querySelector('#app-filter-select');
    if (filterSel) {
      filterSel.addEventListener('change', function () {
        statusFilter = filterSel.value;
        render();
      });
    }
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

  function statusTab(id, n, label) {
    return (
      '<button type="button" class="app-status-tab' +
      (statusFilter === id ? ' is-on' : '') +
      '" data-filter="' +
      id +
      '" role="tab" aria-selected="' +
      (statusFilter === id ? 'true' : 'false') +
      '">' +
      label +
      ' <span class="app-status-tab__n">(' +
      n +
      ')</span></button>'
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
