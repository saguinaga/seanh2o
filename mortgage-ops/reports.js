/**
 * Salesforce-style report library with chart previews + outside-the-box ops reports.
 * Demo data only. SVG charts (Lightning-ish blues/oranges).
 */
(function () {
  const COLORS = {
    blue: '#0176d3',
    blue2: '#1b96ff',
    blue3: '#0b5cab',
    navy: '#032d60',
    orange: '#fe9339',
    red: '#ba0517',
    green: '#2e844a',
    purple: '#7526c6',
    gray: '#939393',
    soft: ['#0176d3', '#1b96ff', '#0b5cab', '#fe9339', '#2e844a', '#7526c6', '#ba0517', '#5b5b5b'],
  };

  /** Chart builders return SVG strings */
  const Charts = {
    hbar: function (labels, values, opts) {
      opts = opts || {};
      const w = 420;
      const rowH = 28;
      const h = labels.length * rowH + 16;
      const max = Math.max.apply(null, values.concat([1]));
      const left = 118;
      const barMax = w - left - 48;
      let g = '';
      labels.forEach(function (lab, i) {
        const bw = Math.max(4, Math.round((values[i] / max) * barMax));
        const y = 10 + i * rowH;
        const c = opts.colors ? opts.colors[i % opts.colors.length] : COLORS.blue;
        g +=
          '<text x="0" y="' +
          (y + 14) +
          '" font-size="11" fill="#444" font-family="Segoe UI,sans-serif">' +
          escapeXml(truncate(lab, 16)) +
          '</text>' +
          '<rect x="' +
          left +
          '" y="' +
          y +
          '" width="' +
          bw +
          '" height="16" rx="3" fill="' +
          c +
          '"/>' +
          '<text x="' +
          (left + bw + 6) +
          '" y="' +
          (y + 13) +
          '" font-size="11" font-weight="700" fill="#032d60" font-family="Segoe UI,sans-serif">' +
          values[i] +
          (opts.suffix || '') +
          '</text>';
      });
      return svgWrap(w, h, g);
    },

    vbar: function (labels, values, opts) {
      opts = opts || {};
      const w = 420;
      const h = 180;
      const max = Math.max.apply(null, values.concat([1]));
      const padL = 36;
      const padB = 36;
      const padT = 16;
      const plotW = w - padL - 12;
      const plotH = h - padB - padT;
      const gap = 8;
      const bw = (plotW - gap * (labels.length - 1)) / labels.length;
      let g =
        '<line x1="' +
        padL +
        '" y1="' +
        (padT + plotH) +
        '" x2="' +
        (w - 8) +
        '" y2="' +
        (padT + plotH) +
        '" stroke="#c9c9c9"/>';
      labels.forEach(function (lab, i) {
        const bh = Math.max(2, (values[i] / max) * plotH);
        const x = padL + i * (bw + gap);
        const y = padT + plotH - bh;
        const c = opts.colors ? opts.colors[i % opts.colors.length] : COLORS.blue2;
        g +=
          '<rect x="' +
          x +
          '" y="' +
          y +
          '" width="' +
          bw +
          '" height="' +
          bh +
          '" rx="3" fill="' +
          c +
          '"/>' +
          '<text x="' +
          (x + bw / 2) +
          '" y="' +
          (h - 12) +
          '" text-anchor="middle" font-size="10" fill="#5b5b5b" font-family="Segoe UI,sans-serif">' +
          escapeXml(truncate(lab, 10)) +
          '</text>' +
          '<text x="' +
          (x + bw / 2) +
          '" y="' +
          (y - 4) +
          '" text-anchor="middle" font-size="10" font-weight="700" fill="#032d60" font-family="Segoe UI,sans-serif">' +
          values[i] +
          '</text>';
      });
      return svgWrap(w, h, g);
    },

    line: function (labels, seriesList, opts) {
      // seriesList: [{ name, values, color }]
      opts = opts || {};
      const w = 420;
      const h = 180;
      const padL = 36;
      const padB = 32;
      const padT = 20;
      const plotW = w - padL - 16;
      const plotH = h - padB - padT;
      let all = [];
      seriesList.forEach(function (s) {
        all = all.concat(s.values);
      });
      const max = Math.max.apply(null, all.concat([1]));
      const min = Math.min.apply(null, all.concat([0]));
      const span = max - min || 1;
      let g =
        '<line x1="' +
        padL +
        '" y1="' +
        (padT + plotH) +
        '" x2="' +
        (w - 8) +
        '" y2="' +
        (padT + plotH) +
        '" stroke="#c9c9c9"/>';
      // grid
      for (let i = 0; i < 3; i++) {
        const gy = padT + (plotH * i) / 2;
        g +=
          '<line x1="' +
          padL +
          '" y1="' +
          gy +
          '" x2="' +
          (w - 8) +
          '" y2="' +
          gy +
          '" stroke="#eee"/>';
      }
      seriesList.forEach(function (s) {
        const pts = s.values
          .map(function (v, i) {
            const x = padL + (i / Math.max(1, s.values.length - 1)) * plotW;
            const y = padT + plotH - ((v - min) / span) * plotH;
            return x + ',' + y;
          })
          .join(' ');
        g +=
          '<polyline fill="none" stroke="' +
          s.color +
          '" stroke-width="2.5" points="' +
          pts +
          '"/>';
        s.values.forEach(function (v, i) {
          const x = padL + (i / Math.max(1, s.values.length - 1)) * plotW;
          const y = padT + plotH - ((v - min) / span) * plotH;
          g += '<circle cx="' + x + '" cy="' + y + '" r="3.5" fill="' + s.color + '"/>';
        });
      });
      labels.forEach(function (lab, i) {
        const x = padL + (i / Math.max(1, labels.length - 1)) * plotW;
        g +=
          '<text x="' +
          x +
          '" y="' +
          (h - 10) +
          '" text-anchor="middle" font-size="10" fill="#5b5b5b" font-family="Segoe UI,sans-serif">' +
          escapeXml(lab) +
          '</text>';
      });
      // legend
      let lx = padL;
      seriesList.forEach(function (s) {
        g +=
          '<rect x="' +
          lx +
          '" y="4" width="10" height="10" rx="2" fill="' +
          s.color +
          '"/>' +
          '<text x="' +
          (lx + 14) +
          '" y="13" font-size="10" fill="#444" font-family="Segoe UI,sans-serif">' +
          escapeXml(s.name) +
          '</text>';
        lx += 90;
      });
      return svgWrap(w, h, g);
    },

    donut: function (labels, values, opts) {
      opts = opts || {};
      const w = 420;
      const h = 180;
      const cx = 100;
      const cy = 90;
      const r = 58;
      const r0 = 34;
      const total = values.reduce(function (a, b) {
        return a + b;
      }, 0) || 1;
      let angle = -Math.PI / 2;
      let g = '';
      values.forEach(function (v, i) {
        const slice = (v / total) * Math.PI * 2;
        const a0 = angle;
        const a1 = angle + slice;
        const large = slice > Math.PI ? 1 : 0;
        const x0 = cx + r * Math.cos(a0);
        const y0 = cy + r * Math.sin(a0);
        const x1 = cx + r * Math.cos(a1);
        const y1 = cy + r * Math.sin(a1);
        const xi0 = cx + r0 * Math.cos(a0);
        const yi0 = cy + r0 * Math.sin(a0);
        const xi1 = cx + r0 * Math.cos(a1);
        const yi1 = cy + r0 * Math.sin(a1);
        const c = COLORS.soft[i % COLORS.soft.length];
        // donut segment via two arcs
        const d =
          'M ' +
          x0 +
          ' ' +
          y0 +
          ' A ' +
          r +
          ' ' +
          r +
          ' 0 ' +
          large +
          ' 1 ' +
          x1 +
          ' ' +
          y1 +
          ' L ' +
          xi1 +
          ' ' +
          yi1 +
          ' A ' +
          r0 +
          ' ' +
          r0 +
          ' 0 ' +
          large +
          ' 0 ' +
          xi0 +
          ' ' +
          yi0 +
          ' Z';
        g += '<path d="' + d + '" fill="' + c + '"/>';
        angle = a1;
      });
      g +=
        '<text x="' +
        cx +
        '" y="' +
        (cy + 4) +
        '" text-anchor="middle" font-size="14" font-weight="700" fill="#032d60" font-family="Segoe UI,sans-serif">' +
        total +
        '</text>' +
        '<text x="' +
        cx +
        '" y="' +
        (cy + 18) +
        '" text-anchor="middle" font-size="9" fill="#706e6b" font-family="Segoe UI,sans-serif">total</text>';
      labels.forEach(function (lab, i) {
        const y = 28 + i * 22;
        g +=
          '<rect x="190" y="' +
          (y - 10) +
          '" width="12" height="12" rx="2" fill="' +
          COLORS.soft[i % COLORS.soft.length] +
          '"/>' +
          '<text x="208" y="' +
          y +
          '" font-size="11" fill="#444" font-family="Segoe UI,sans-serif">' +
          escapeXml(lab) +
          ' · ' +
          values[i] +
          '</text>';
      });
      return svgWrap(w, h, g);
    },

    stackedH: function (labels, series, opts) {
      // series: [{ name, values[], color }]
      opts = opts || {};
      const w = 420;
      const rowH = 32;
      const h = labels.length * rowH + 28;
      const left = 100;
      const barMax = w - left - 20;
      const totals = labels.map(function (_, i) {
        return series.reduce(function (a, s) {
          return a + s.values[i];
        }, 0);
      });
      const max = Math.max.apply(null, totals.concat([1]));
      let g = '';
      // legend
      let lx = left;
      series.forEach(function (s) {
        g +=
          '<rect x="' +
          lx +
          '" y="2" width="10" height="10" rx="2" fill="' +
          s.color +
          '"/>' +
          '<text x="' +
          (lx + 14) +
          '" y="11" font-size="10" fill="#444" font-family="Segoe UI,sans-serif">' +
          escapeXml(s.name) +
          '</text>';
        lx += 100;
      });
      labels.forEach(function (lab, i) {
        const y = 22 + i * rowH;
        let x = left;
        g +=
          '<text x="0" y="' +
          (y + 14) +
          '" font-size="11" fill="#444" font-family="Segoe UI,sans-serif">' +
          escapeXml(truncate(lab, 14)) +
          '</text>';
        series.forEach(function (s) {
          const bw = Math.max(0, (s.values[i] / max) * barMax);
          if (bw > 0) {
            g +=
              '<rect x="' +
              x +
              '" y="' +
              y +
              '" width="' +
              bw +
              '" height="16" fill="' +
              s.color +
              '"/>';
          }
          x += bw;
        });
      });
      return svgWrap(w, h, g);
    },

    funnel: function (labels, values) {
      const w = 420;
      const h = 200;
      const max = Math.max.apply(null, values.concat([1]));
      let g = '';
      labels.forEach(function (lab, i) {
        const t = 0.35 + 0.65 * (values[i] / max);
        const bw = (w - 80) * t;
        const x = (w - bw) / 2;
        const y = 12 + i * 36;
        const c = i === 2 ? COLORS.orange : COLORS.blue2;
        g +=
          '<rect x="' +
          x +
          '" y="' +
          y +
          '" width="' +
          bw +
          '" height="28" rx="4" fill="' +
          c +
          '"/>' +
          '<text x="' +
          w / 2 +
          '" y="' +
          (y + 18) +
          '" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Segoe UI,sans-serif">' +
          escapeXml(lab) +
          ' · ' +
          values[i] +
          '</text>';
      });
      return svgWrap(w, h, g);
    },
  };

  function svgWrap(w, h, inner) {
    return (
      '<svg class="rpt-chart-svg" viewBox="0 0 ' +
      w +
      ' ' +
      h +
      '" width="100%" role="img">' +
      inner +
      '</svg>'
    );
  }

  function escapeXml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function truncate(s, n) {
    s = String(s);
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  const REPORTS = [
    // —— Core ops (Lightning dashboard food) ——
    {
      id: 'R-01',
      name: 'Time to decision by product',
      folder: 'ops',
      folderLabel: 'Ops metrics',
      type: 'Summary chart',
      chartType: 'Lightning · Vertical bar',
      desc: 'Median days Application in → credit decision. The clock leadership feels as “time to yes.”',
      columns: ['Product', 'Files', 'Median days', 'p90 days'],
      rows: [
        ['Bridge', '64', '5.4', '9.1'],
        ['Rental term', '51', '7.1', '11.8'],
        ['Build-for-rent', '27', '8.0', '13.2'],
      ],
      chart: function () {
        return Charts.vbar(['Bridge', 'Rental', 'BFR'], [5.4, 7.1, 8.0], {
          colors: [COLORS.blue, COLORS.orange, COLORS.purple],
        });
      },
      insight: 'BFR and rental drag decision time. Do not staff from apps-in alone; pair with aging matrix.',
      links: [
        { label: 'Dashboard', nav: 'accelerator:dashboard' },
        { label: 'Exception queue', nav: 'exceptions:queue' },
      ],
    },
    {
      id: 'R-02',
      name: 'Files past SLA by owner',
      folder: 'ops',
      folderLabel: 'Ops metrics',
      type: 'Summary chart',
      chartType: 'Lightning · Horizontal bar',
      desc: 'Open files past stage SLA. Monday standup list with regulated load overlaid.',
      columns: ['Owner', 'Past SLA', 'With reg tags', 'Oldest days'],
      rows: [
        ['Unassigned', '8', '6', '11'],
        ['M. Chen', '8', '5', '12'],
        ['J. Ortiz', '7', '4', '9'],
        ['A. Singh', '4', '2', '5'],
      ],
      chart: function () {
        return Charts.stackedH(
          ['Unassigned', 'M. Chen', 'J. Ortiz', 'A. Singh'],
          [
            { name: 'Ops only', values: [2, 3, 3, 2], color: COLORS.blue2 },
            { name: 'Regulated tags', values: [6, 5, 4, 2], color: COLORS.red },
          ]
        );
      },
      insight: 'Unassigned + regulated is the dangerous combo. Feed AI queue from this report.',
      links: [
        { label: 'Loan files · Past SLA', nav: 'pipeline:past-sla' },
        { label: 'Exception queue', nav: 'exceptions:queue' },
      ],
    },
    {
      id: 'R-03',
      name: 'Condition clear cycle time',
      folder: 'ops',
      folderLabel: 'Ops metrics',
      type: 'Summary chart',
      chartType: 'Lightning · Donut',
      desc: 'Distribution of days Approved w/ conditions → Clear to fund. Certainty of close lives here.',
      columns: ['Bucket', 'Count', 'Share'],
      rows: [
        ['0–2 days', '14', '28%'],
        ['3–5 days', '19', '38%'],
        ['6–10 days', '11', '22%'],
        ['11+ days', '6', '12%'],
      ],
      chart: function () {
        return Charts.donut(['0–2d', '3–5d', '6–10d', '11d+'], [14, 19, 11, 6]);
      },
      insight: 'Long tail is usually docs, KYC, disclosure stamps, not pure credit.',
      links: [
        { label: 'Path · conditions', nav: 'accelerator:path' },
        { label: 'Exception queue', nav: 'exceptions:queue' },
      ],
    },
    {
      id: 'R-04',
      name: 'Path to yes funnel',
      folder: 'ops',
      folderLabel: 'Ops metrics',
      type: 'Funnel',
      chartType: 'Lightning · Funnel',
      desc: 'Stage WIP with conversion labels. Conditions is the usual choke.',
      columns: ['Stage', 'Count', 'Conv from prior'],
      rows: [
        ['Application in', '38', '—'],
        ['In underwriting', '41', '78%'],
        ['Approved w/ conditions', '33', '71%'],
        ['Clear to fund', '18', '55%'],
        ['Funded (7d)', '24', '88%'],
      ],
      chart: function () {
        return Charts.funnel(
          ['App in', 'UW', 'Conditions', 'Clear to fund', 'Funded'],
          [38, 41, 33, 18, 24]
        );
      },
      insight: 'Conditions → clear-to-fund is the conversion cliff. Instrument owners and reason codes there.',
      links: [
        { label: 'Dashboard funnel', nav: 'accelerator:dashboard' },
        { label: 'Loan files', nav: 'pipeline:conditions' },
      ],
    },

    // —— Regulated / control ——
    {
      id: 'R-05',
      name: 'Compliance-tagged exceptions',
      folder: 'control',
      folderLabel: 'Control & audit',
      type: 'Summary chart',
      chartType: 'Lightning · Horizontal bar',
      desc: 'Open exceptions by control tag. Regulated load for Accelerator + compliance partners.',
      columns: ['Tag', 'Open', 'Escalated'],
      rows: [
        ['Disclosure / docs', '6', '1'],
        ['Audit / dual status', '4', '1'],
        ['KYC / identity', '3', '1'],
        ['State / jurisdiction', '2', '0'],
        ['Contract template', '1', '0'],
      ],
      chart: function () {
        return Charts.hbar(
          ['Disclosure', 'Dual status', 'KYC', 'State', 'Contract tmpl'],
          [6, 4, 3, 2, 1],
          { colors: [COLORS.red, COLORS.orange, COLORS.purple, COLORS.blue, COLORS.navy] }
        );
      },
      insight: 'Same instinct as multi-lender offer/contract automation: wrong artifact stops the line.',
      links: [
        { label: 'Exception Queue', nav: 'exceptions:queue' },
        { label: 'Write-up · contracts', nav: 'accelerator:writeup' },
      ],
    },
    {
      id: 'R-06',
      name: 'Package / contract generation defects',
      folder: 'control',
      folderLabel: 'Control & audit',
      type: 'Summary chart',
      chartType: 'Lightning · Grouped idea · vbar',
      desc: 'Offer/package failures by loan type: wrong template, missing jurisdiction disclosure, stamp not set. Bridges Auction-style contract automation to CRM exceptions.',
      columns: ['Loan type', 'Wrong template', 'Missing disclosure', 'Stamp miss'],
      rows: [
        ['Bridge', '4', '7', '2'],
        ['Rental term', '1', '9', '5'],
        ['Build-for-rent', '2', '3', '1'],
      ],
      chart: function () {
        return Charts.stackedH(
          ['Bridge', 'Rental', 'BFR'],
          [
            { name: 'Wrong template', values: [4, 1, 2], color: COLORS.red },
            { name: 'Missing disclosure', values: [7, 9, 3], color: COLORS.orange },
            { name: 'Stamp miss', values: [2, 5, 1], color: COLORS.purple },
          ]
        );
      },
      insight: 'Outside the usual “pipeline by stage” set. Product + BA gold: rules engine quality is a reportable control.',
      links: [
        { label: 'Exception · contract row', nav: 'exceptions:queue' },
        { label: 'Write-up', nav: 'accelerator:writeup' },
      ],
    },
    {
      id: 'R-07',
      name: 'Dual-system status disagreement',
      folder: 'control',
      folderLabel: 'Control & audit',
      type: 'Tabular + trend',
      chartType: 'Lightning · Line',
      desc: 'CRM stage ≠ LOS / warehouse status. Audit and partner-comms risk. Integration health as a product metric.',
      columns: ['Day', 'Disagreements', 'Cleared same day'],
      rows: [
        ['Mon', '6', '3'],
        ['Tue', '5', '4'],
        ['Wed', '8', '3'],
        ['Thu', '4', '4'],
        ['Fri', '7', '2'],
      ],
      chart: function () {
        return Charts.line(
          ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          [
            { name: 'Disagreements', values: [6, 5, 8, 4, 7], color: COLORS.red },
            { name: 'Cleared same day', values: [3, 4, 3, 4, 2], color: COLORS.green },
          ]
        );
      },
      insight: 'If leadership only watches funded volume, this stays invisible until a partner gets the wrong status.',
      links: [
        { label: 'Exception queue', nav: 'exceptions:queue' },
        { label: 'Dashboard', nav: 'accelerator:dashboard' },
      ],
    },
    {
      id: 'R-08',
      name: 'Audit-ready field completeness',
      folder: 'control',
      folderLabel: 'Control & audit',
      type: 'Summary chart',
      chartType: 'Lightning · Horizontal bar',
      desc: '% of funded files with required reason codes, condition outcomes, and owner history populated. Exam / internal audit posture.',
      columns: ['Control field', '% complete', 'Gaps'],
      rows: [
        ['Condition reason codes', '91%', '7'],
        ['Pricing overlay rationale', '74%', '12'],
        ['Stage skip justification', '68%', '15'],
        ['External status send log', '82%', '9'],
      ],
      chart: function () {
        return Charts.hbar(
          ['Condition codes', 'Overlay rationale', 'Stage skip note', 'Status send log'],
          [91, 74, 68, 82],
          { suffix: '%', colors: [COLORS.green, COLORS.orange, COLORS.red, COLORS.blue] }
        );
      },
      insight: 'Boring report, huge trust. BA defines “complete”; admin/platform enforces; this chart proves it.',
      links: [
        { label: 'Exception queue', nav: 'exceptions:queue' },
        { label: 'Reports · ops', nav: 'reports:ops-folder' },
      ],
    },

    // —— Outside the box ——
    {
      id: 'R-09',
      name: 'Ghost pipeline (open, no activity 7d)',
      folder: 'insight',
      folderLabel: 'Outside the box',
      type: 'Summary chart',
      chartType: 'Lightning · Donut',
      desc: 'Still “open” in CRM but no field history, task, or stage change in 7 days. Fake WIP inflates dashboards.',
      columns: ['Stage', 'Ghost files', 'Avg days silent'],
      rows: [
        ['Application in', '6', '11'],
        ['In underwriting', '9', '9'],
        ['Approved w/ conditions', '11', '14'],
        ['Clear to fund', '3', '8'],
      ],
      chart: function () {
        return Charts.donut(['App in', 'UW', 'Conditions', 'CTF'], [6, 9, 11, 3]);
      },
      insight: 'Kill ghosts before you hire. Often missing owner or dual-system stall.',
      links: [
        { label: 'Loan pipeline', nav: 'pipeline:all-open' },
        { label: 'Exception queue', nav: 'exceptions:queue' },
      ],
    },
    {
      id: 'R-10',
      name: 'Definition drift watch',
      folder: 'insight',
      folderLabel: 'Outside the box',
      type: 'Trend',
      chartType: 'Lightning · Line',
      desc: 'Proxy for stage-meaning chaos: same-day stage skips, reverse stage moves, and “Application in” with empty critical fields. When this rises, every dashboard becomes politics.',
      columns: ['Week', 'Stage skips', 'Reverse moves', 'Empty critical fields'],
      rows: [
        ['W1', '12', '3', '18'],
        ['W2', '15', '4', '16'],
        ['W3', '11', '2', '14'],
        ['W4', '19', '6', '21'],
      ],
      chart: function () {
        return Charts.line(
          ['W1', 'W2', 'W3', 'W4'],
          [
            { name: 'Stage skips', values: [12, 15, 11, 19], color: COLORS.orange },
            { name: 'Reverse moves', values: [3, 4, 2, 6], color: COLORS.red },
            { name: 'Empty P0 fields', values: [18, 16, 14, 21], color: COLORS.purple },
          ]
        );
      },
      insight: 'BA headline report. Fix dictionary and validation before adding more dashboard components.',
      links: [
        { label: 'Write-up · method', nav: 'accelerator:writeup' },
        { label: 'Dashboard', nav: 'accelerator:dashboard' },
      ],
    },
    {
      id: 'R-11',
      name: 'AI priority vs human reorder',
      folder: 'insight',
      folderLabel: 'Outside the box',
      type: 'Summary chart',
      chartType: 'Lightning · Horizontal bar',
      desc: 'How often ops overrides AI ranking, and why. Keeps AI as assistant, not silent policy.',
      columns: ['Override reason', 'Count', '% of overrides'],
      rows: [
        ['Known partner escalation', '14', '32%'],
        ['Compliance seat required', '11', '25%'],
        ['AI underweighted $ size', '8', '18%'],
        ['AI overweighted SLA noise', '7', '16%'],
        ['Other / training', '4', '9%'],
      ],
      chart: function () {
        return Charts.hbar(
          ['Partner escalate', 'Compliance seat', 'Size underweight', 'SLA noise', 'Other'],
          [14, 11, 8, 7, 4],
          { colors: [COLORS.blue, COLORS.red, COLORS.orange, COLORS.purple, COLORS.gray] }
        );
      },
      insight: 'Use overrides to retrain scoring weights. Honest AI story for interviews.',
      links: [
        { label: 'Exception Queue', nav: 'exceptions:queue' },
        { label: 'Dashboard', nav: 'accelerator:dashboard' },
      ],
    },
    {
      id: 'R-12',
      name: 'Partner / seller experience risk',
      folder: 'insight',
      folderLabel: 'Outside the box',
      type: 'Matrix-ish · vbar',
      chartType: 'Lightning · Vertical bar',
      desc: 'Tier A sellers with rising past-SLA or kickbacks. Competitive “why us” is not only rate.',
      columns: ['Seller', 'Tier', 'Past SLA Δ', 'Kickback rate'],
      rows: [
        ['Summit Capital', 'A', '+4', '12%'],
        ['Harbor Investors', 'A', '+1', '6%'],
        ['Metro Hard Money', 'B', '+2', '15%'],
        ['Pacific BFR LLC', 'C', '0', '9%'],
      ],
      chart: function () {
        return Charts.vbar(['Summit', 'Harbor', 'Metro', 'Pacific'], [4, 1, 2, 0], {
          colors: [COLORS.red, COLORS.orange, COLORS.orange, COLORS.green],
        });
      },
      insight: 'Relationship risk report. Product should see this next to exception aging.',
      links: [
        { label: 'Loan pipeline', nav: 'pipeline:all-open' },
        { label: 'Dashboard', nav: 'accelerator:dashboard' },
      ],
    },
    {
      id: 'R-13',
      name: 'Excel shadow system score',
      folder: 'insight',
      folderLabel: 'Outside the box',
      type: 'Summary chart',
      chartType: 'Lightning · Donut',
      desc: 'Where people still export or keep side trackers (survey + login proxy). Measures trust in SF reports.',
      columns: ['Work surface', 'Still uses Excel', 'Primary in SF'],
      rows: [
        ['Conditions tracking', '14', '22'],
        ['Weekly exec pack', '9', '11'],
        ['Partner status list', '11', '8'],
        ['Capacity / WIP', '6', '18'],
      ],
      chart: function () {
        return Charts.donut(['Conditions', 'Exec pack', 'Partner status', 'Capacity'], [14, 9, 11, 6]);
      },
      insight: 'If Excel wins, definitions or ownership are wrong. Kill the shadow with list views + this queue, not more vanity charts.',
      links: [
        { label: 'Exception Queue', nav: 'exceptions:queue' },
        { label: 'Write-up', nav: 'accelerator:writeup' },
      ],
    },
    {
      id: 'R-14',
      name: 'Time to first human touch (exceptions)',
      folder: 'insight',
      folderLabel: 'Outside the box',
      type: 'Trend',
      chartType: 'Lightning · Line',
      desc: 'Hours from exception create → first claim. AI ranking only helps if humans pick up the top of the list.',
      columns: ['Week', 'Median hours', 'p90 hours', 'AI-on days'],
      rows: [
        ['W1', '6.2', '22', '3'],
        ['W2', '5.1', '18', '5'],
        ['W3', '4.4', '15', '5'],
        ['W4', '3.8', '14', '5'],
      ],
      chart: function () {
        return Charts.line(
          ['W1', 'W2', 'W3', 'W4'],
          [
            { name: 'Median hrs to claim', values: [6.2, 5.1, 4.4, 3.8], color: COLORS.blue },
            { name: 'p90 hrs', values: [22, 18, 15, 14], color: COLORS.orange },
          ]
        );
      },
      insight: 'Pairs with Exception Queue prototype: prioritization without pickup is theater.',
      links: [
        { label: 'Exception Queue', nav: 'exceptions:queue' },
        { label: 'AI override report', nav: 'reports:recent' },
      ],
    },

    // —— Sales / volume (keep some classic) ——
    {
      id: 'R-15',
      name: 'Volume by broker / seller',
      folder: 'sales',
      folderLabel: 'Sales',
      type: 'Summary chart',
      chartType: 'Lightning · Horizontal bar',
      desc: 'In-flight and funded volume by seller. Classic, still useful next to experience risk.',
      columns: ['Seller', 'In flight', 'Funded 30d', 'Tier'],
      rows: [
        ['Summit Capital', '12', '9', 'A'],
        ['Harbor Investors', '8', '6', 'A'],
        ['Metro Hard Money', '5', '3', 'B'],
        ['Pacific BFR LLC', '4', '2', 'C'],
      ],
      chart: function () {
        return Charts.hbar(['Summit', 'Harbor', 'Metro', 'Pacific'], [12, 8, 5, 4], {
          colors: [COLORS.blue, COLORS.blue2, COLORS.blue3, COLORS.navy],
        });
      },
      insight: 'Volume without SLA and kickback context lies. Open partner experience risk next.',
      links: [
        { label: 'Partner risk report', nav: 'reports:recent' },
        { label: 'Pipeline', nav: 'pipeline:all-open' },
      ],
    },
    {
      id: 'R-16',
      name: 'Funded vs fallout after approval',
      folder: 'sales',
      folderLabel: 'Sales',
      type: 'Trend',
      chartType: 'Lightning · Line',
      desc: 'Outcome + certainty. Fallout after approval is a quiet competitor for “time to yes.”',
      columns: ['Week', 'Funded', 'Fallout after approval'],
      rows: [
        ['W1', '18', '2'],
        ['W2', '21', '1'],
        ['W3', '19', '3'],
        ['W4', '22', '2'],
      ],
      chart: function () {
        return Charts.line(
          ['W1', 'W2', 'W3', 'W4'],
          [
            { name: 'Funded', values: [18, 21, 19, 22], color: COLORS.green },
            { name: 'Fallout after yes', values: [2, 1, 3, 2], color: COLORS.red },
          ]
        );
      },
      insight: 'Celebrate funded only next to fallout. Drill exceptions on fallout spikes.',
      links: [
        { label: 'Dashboard', nav: 'accelerator:dashboard' },
        { label: 'Exception queue', nav: 'exceptions:queue' },
      ],
    },
  ];

  let folder = 'all';
  let selectedId = 'R-01';

  function $(s) {
    return document.querySelector(s);
  }

  function list() {
    if (folder === 'all') return REPORTS;
    return REPORTS.filter(function (r) {
      return r.folder === folder;
    });
  }

  function go(nav) {
    const parts = nav.split(':');
    if (window.mortgageShell && window.mortgageShell.navigate) {
      // special: jump to a report by selecting it
      if (parts[0] === 'reports' && parts[1] === 'recent') {
        window.mortgageShell.navigate('reports', 'recent');
        return;
      }
      window.mortgageShell.navigate(parts[0], parts[1]);
    }
  }

  function render() {
    const root = $('#reports-root');
    if (!root) return;
    const rows = list();
    if (!rows.some(function (r) { return r.id === selectedId; })) {
      selectedId = rows[0] ? rows[0].id : null;
    }
    const sel = REPORTS.find(function (r) {
      return r.id === selectedId;
    });

    const counts = {
      all: REPORTS.length,
      ops: REPORTS.filter(function (r) { return r.folder === 'ops'; }).length,
      control: REPORTS.filter(function (r) { return r.folder === 'control'; }).length,
      insight: REPORTS.filter(function (r) { return r.folder === 'insight'; }).length,
      sales: REPORTS.filter(function (r) { return r.folder === 'sales'; }).length,
    };

    root.innerHTML =
      '<div class="rpt-hero-note">' +
      '<strong>Report library · Salesforce-style charts.</strong> ' +
      'Folders mix classic pipeline metrics with control/audit and outside-the-box trust reports. Click any row for a Lightning-ish chart preview (SVG demo, not a live org).' +
      '</div>' +
      '<div class="drill-filters" style="padding:0;border:none;margin-bottom:8px">' +
      chip('all', 'All (' + counts.all + ')') +
      chip('ops', 'Ops (' + counts.ops + ')') +
      chip('control', 'Control & audit (' + counts.control + ')') +
      chip('insight', 'Outside the box (' + counts.insight + ')') +
      chip('sales', 'Sales (' + counts.sales + ')') +
      '</div>' +
      '<div class="drill-layout">' +
      '<div class="drill-list-card">' +
      '<div class="drill-list-card__h"><h2>Reports</h2><span class="sub">Click to chart preview</span></div>' +
      '<div class="drill-table-wrap"><table class="drill-table"><thead><tr>' +
      '<th>Report</th><th>Folder</th><th>Chart</th></tr></thead><tbody>' +
      rows
        .map(function (r) {
          return (
            '<tr data-id="' +
            r.id +
            '" class="' +
            (r.id === selectedId ? 'is-selected' : '') +
            '"><td><strong>' +
            r.name +
            '</strong><div class="rpt-row-type">' +
            r.type +
            '</div></td><td>' +
            r.folderLabel +
            '</td><td><span class="rpt-chart-pill">' +
            shortChart(r.chartType) +
            '</span></td></tr>'
          );
        })
        .join('') +
      '</tbody></table></div></div>' +
      '<div class="drill-detail-card">' +
      (sel ? preview(sel) : '<div class="drill-empty">Select a report</div>') +
      '</div></div>';

    root.querySelectorAll('[data-folder]').forEach(function (el) {
      el.addEventListener('click', function () {
        folder = el.getAttribute('data-folder');
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
        const nav = el.getAttribute('data-nav');
        if (nav.indexOf('report:') === 0) {
          selectedId = nav.split(':')[1];
          folder = 'all';
          render();
          return;
        }
        go(nav);
      });
    });
  }

  function shortChart(t) {
    if (!t) return 'Table';
    if (t.indexOf('Bar') !== -1 || t.indexOf('bar') !== -1) return 'Bar';
    if (t.indexOf('Line') !== -1) return 'Line';
    if (t.indexOf('Donut') !== -1) return 'Donut';
    if (t.indexOf('Funnel') !== -1) return 'Funnel';
    return 'Chart';
  }

  function chip(id, label) {
    return (
      '<button type="button" class="drill-chip' +
      (folder === id ? ' is-on' : '') +
      '" data-folder="' +
      id +
      '">' +
      label +
      '</button>'
    );
  }

  function preview(r) {
    const head = r.columns
      .map(function (c) {
        return '<th>' + c + '</th>';
      })
      .join('');
    const body = r.rows
      .map(function (row) {
        return (
          '<tr>' +
          row
            .map(function (c) {
              return '<td>' + c + '</td>';
            })
            .join('') +
          '</tr>'
        );
      })
      .join('');
    const links = r.links
      .map(function (l, i) {
        return (
          '<button type="button" class="' +
          (i === 0 ? 'is-primary' : '') +
          '" data-nav="' +
          l.nav +
          '">' +
          l.label +
          '</button>'
        );
      })
      .join('');

    const chartHtml = r.chart
      ? '<div class="rpt-chart-frame"><div class="rpt-chart-label">' +
        escapeXml(r.chartType || 'Chart') +
        ' · sample</div>' +
        r.chart() +
        '</div>'
      : '';

    return (
      '<div class="drill-detail-card__h"><h2>Report run · preview</h2><span class="sub">' +
      r.type +
      '</span></div><div class="drill-detail-card__b">' +
      '<h3>' +
      r.name +
      '</h3>' +
      '<p class="meta">Folder: ' +
      r.folderLabel +
      ' · Demo sample · not live Salesforce data</p>' +
      '<p>' +
      r.desc +
      '</p>' +
      chartHtml +
      '<h4>Underlying rows</h4>' +
      '<div class="drill-table-wrap"><table class="drill-table"><thead><tr>' +
      head +
      '</tr></thead><tbody>' +
      body +
      '</tbody></table></div>' +
      '<h4>How I would use this in the seat</h4><p>' +
      r.insight +
      '</p>' +
      '<div class="drill-actions">' +
      links +
      '</div></div>'
    );
  }

  function applyShellFolder() {
    if (window.mortgageShell && window.mortgageShell.getState) {
      const st = window.mortgageShell.getState();
      if (st.appId === 'reports') {
        if (st.viewId === 'ops-folder') folder = 'ops';
        // keep control/insight if user chose via chips
      }
    }
  }

  function init() {
    if (!$('#reports-root')) return;
    applyShellFolder();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.mortgageReports = {
    render: function () {
      applyShellFolder();
      render();
    },
    select: function (id) {
      selectedId = id;
      folder = 'all';
      render();
    },
  };
})();
