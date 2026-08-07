/** Reports library with preview drill-down. Demo data. */
(function () {
  const REPORTS = [
    {
      id: 'R-01',
      name: 'Time to decision by product',
      folder: 'ops',
      folderLabel: 'Ops metrics',
      type: 'Summary',
      desc: 'Median and p90 days from Application in to credit decision, split by product.',
      columns: ['Product', 'Files', 'Median days', 'p90 days'],
      rows: [
        ['Bridge', '64', '5.4', '9.1'],
        ['Rental term', '51', '7.1', '11.8'],
        ['Build-for-rent', '27', '8.0', '13.2'],
      ],
      insight: 'Rental and BFR drag decision time. Pair with aging matrix on the dashboard before asking for headcount.',
      links: [
        { label: 'Open dashboard', nav: 'accelerator:dashboard' },
        { label: 'Exception queue', nav: 'exceptions:queue' },
      ],
    },
    {
      id: 'R-02',
      name: 'Files past SLA by owner',
      folder: 'ops',
      folderLabel: 'Ops metrics',
      type: 'Tabular',
      desc: 'Open files past stage SLA, grouped by owner. Working list for Monday standup.',
      columns: ['Owner', 'Past SLA', 'Regulated tags', 'Oldest days'],
      rows: [
        ['M. Chen', '8', '5', '12'],
        ['J. Ortiz', '7', '4', '9'],
        ['A. Singh', '4', '2', '5'],
        ['Unassigned', '8', '6', '11'],
      ],
      insight: 'Unassigned + regulated tags is the dangerous combo. AI queue should surface those first.',
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
      type: 'Summary',
      desc: 'Days from Approved w/ conditions to Clear to fund. Where certainty of close is won or lost.',
      columns: ['Bucket', 'Count', 'Share'],
      rows: [
        ['0–2 days', '14', '28%'],
        ['3–5 days', '19', '38%'],
        ['6–10 days', '11', '22%'],
        ['11+ days', '6', '12%'],
      ],
      insight: 'Long tail is usually missing docs, KYC, or disclosure stamps, not pure credit.',
      links: [
        { label: 'Path · conditions stage', nav: 'accelerator:path' },
        { label: 'Exception queue', nav: 'exceptions:queue' },
      ],
    },
    {
      id: 'R-04',
      name: 'Compliance-tagged exceptions',
      folder: 'ops',
      folderLabel: 'Ops metrics',
      type: 'Summary',
      desc: 'Open exceptions with disclosure, KYC, state, audit, or fair-lending tags.',
      columns: ['Tag', 'Open', 'Escalated'],
      rows: [
        ['Disclosure / docs', '6', '1'],
        ['KYC / identity', '3', '1'],
        ['State / jurisdiction', '2', '0'],
        ['Audit trail / dual status', '4', '1'],
        ['Contract template mismatch', '1', '0'],
      ],
      insight: 'This is the regulated load report. Same instinct as multi-lender offer/contract automation.',
      links: [
        { label: 'Work Exception Queue', nav: 'exceptions:queue' },
        { label: 'Write-up · contracts proof', nav: 'accelerator:writeup' },
      ],
    },
    {
      id: 'R-05',
      name: 'Volume by broker / seller',
      folder: 'sales',
      folderLabel: 'Sales',
      type: 'Summary',
      desc: 'Funded and in-flight volume by seller. Experience + speed drive repeat, not only rate.',
      columns: ['Seller', 'In flight', 'Funded 30d', 'Tier'],
      rows: [
        ['Summit Capital', '12', '9', 'A'],
        ['Harbor Investors', '8', '6', 'A'],
        ['Metro Hard Money', '5', '3', 'B'],
        ['Pacific BFR LLC', '4', '2', 'C'],
      ],
      insight: 'Tier A with rising past-SLA is a relationship risk. Surface in exception priority.',
      links: [
        { label: 'Loan pipeline', nav: 'pipeline:all-open' },
        { label: 'Dashboard', nav: 'accelerator:dashboard' },
      ],
    },
    {
      id: 'R-06',
      name: 'Funded last 30 days',
      folder: 'sales',
      folderLabel: 'Sales',
      type: 'Tabular',
      desc: 'Outcome report. Only useful next to conversion and fallout after approval.',
      columns: ['Week', 'Funded', 'Fallout after approval'],
      rows: [
        ['W1', '18', '2'],
        ['W2', '21', '1'],
        ['W3', '19', '3'],
        ['W4', '22', '2'],
      ],
      insight: 'Fallout after approval is a certainty-of-close metric. Drill exceptions, not just celebrate funded.',
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
    return REPORTS.filter((r) => r.folder === folder);
  }

  function go(nav) {
    const parts = nav.split(':');
    if (window.mortgageShell && window.mortgageShell.navigate) {
      window.mortgageShell.navigate(parts[0], parts[1]);
    }
  }

  function render() {
    const root = $('#reports-root');
    if (!root) return;
    const rows = list();
    if (!rows.some((r) => r.id === selectedId)) selectedId = rows[0] ? rows[0].id : null;
    const sel = REPORTS.find((r) => r.id === selectedId);

    root.innerHTML =
      '<div class="drill-filters" style="padding:0;border:none;margin-bottom:8px">' +
      chip('all', 'All folders') +
      chip('ops', 'Ops metrics') +
      chip('sales', 'Sales') +
      '</div>' +
      '<div class="drill-layout">' +
      '<div class="drill-list-card">' +
      '<div class="drill-list-card__h"><h2>Report library</h2><span class="sub">Click to preview</span></div>' +
      '<div class="drill-table-wrap"><table class="drill-table"><thead><tr>' +
      '<th>Report</th><th>Folder</th><th>Type</th></tr></thead><tbody>' +
      rows
        .map(function (r) {
          return (
            '<tr data-id="' +
            r.id +
            '" class="' +
            (r.id === selectedId ? 'is-selected' : '') +
            '"><td><strong>' +
            r.name +
            '</strong></td><td>' +
            r.folderLabel +
            '</td><td>' +
            r.type +
            '</td></tr>'
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
        go(el.getAttribute('data-nav'));
      });
    });
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
    const head = r.columns.map(function (c) { return '<th>' + c + '</th>'; }).join('');
    const body = r.rows
      .map(function (row) {
        return '<tr>' + row.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
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

    return (
      '<div class="drill-detail-card__h"><h2>Report preview</h2><span class="sub">' +
      r.type +
      '</span></div><div class="drill-detail-card__b">' +
      '<h3>' +
      r.name +
      '</h3>' +
      '<p class="meta">Folder: ' +
      r.folderLabel +
      ' · Demo sample · not live org data</p>' +
      '<p>' +
      r.desc +
      '</p>' +
      '<h4>Sample result set</h4>' +
      '<div class="drill-table-wrap"><table class="drill-table"><thead><tr>' +
      head +
      '</tr></thead><tbody>' +
      body +
      '</tbody></table></div>' +
      '<h4>How I would use this</h4><p>' +
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
        folder = st.viewId === 'ops-folder' ? 'ops' : 'all';
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
  };
})();
