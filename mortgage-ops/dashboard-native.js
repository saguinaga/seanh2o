/**
 * Lightning-native layout study (v2). Same demo data as custom dashboard.
 * Toggle lives on #dash-root shell; this renders into #dash-native-root.
 */
(function () {
  var LP = window.LoanProducts;
  if (!LP) return;

  var state = {
    product: 'all',
    window: '7d',
    role: 'exec',
    stage: null,
  };

  function $(sel) {
    return document.querySelector(sel);
  }

  function data() {
    var d = LP.DATA[state.product] || LP.DATA.all;
    if (state.window === '30d') {
      return scale(d, 3.2);
    }
    return d;
  }

  function scale(d, f) {
    var c = JSON.parse(JSON.stringify(d));
    c.appsIn = Math.round(d.appsIn * f);
    c.stuck = Math.round(d.stuck * f * 0.9);
    c.policyHold = Math.round(d.policyHold * f * 0.85);
    c.dualSystem = Math.round(d.dualSystem * f * 0.8);
    c.funnel = d.funnel.map(function (s) {
      return Object.assign({}, s, {
        count:
          s.id === 'funded'
            ? Math.round(s.count * f)
            : Math.round(s.count * Math.min(f, 1.8)),
      });
    });
    c.reasons = d.reasons.map(function (r) {
      return Object.assign({}, r, { n: Math.round(r.n * f * 0.9) });
    });
    return c;
  }

  function funded(d) {
    var row = d.funnel.find(function (s) {
      return s.id === 'funded';
    });
    return row ? row.count : 0;
  }

  function cond(d) {
    var row = d.funnel.find(function (s) {
      return s.id === 'cond';
    });
    return row ? row.count : 0;
  }

  function conv(d) {
    if (!d.appsIn) return 0;
    return Math.round((funded(d) / d.appsIn) * 1000) / 10;
  }

  function goEq() {
    if (window.mortgageShell) window.mortgageShell.navigate('exceptions', 'queue');
  }

  function setProduct(id) {
    state.product = id;
    var sel = $('#ln-product');
    if (sel) sel.value = id;
    render();
  }

  var MENU_SVG =
    '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="10" r="4"/><circle cx="26" cy="26" r="4"/><circle cx="26" cy="42" r="4"/></svg>';

  function compHeader(title) {
    return (
      '<header class="ln-comp__header"><h3 title="' +
      title.replace(/"/g, '') +
      '">' +
      title +
      '</h3><button type="button" class="ln-comp__icon-btn" tabindex="-1" aria-hidden="true">' +
      MENU_SVG +
      '</button></header>'
    );
  }

  function metricCard(title, value, reportName, footer, tone, span, delta) {
    var col = span || 3;
    return (
      '<article class="ln-comp ln-comp--metric ln-comp--' +
      col +
      '">' +
      compHeader(title) +
      '<div class="ln-comp__body"><div class="ln-metric">' +
      '<div class="ln-metric__report">' +
      reportName +
      '</div>' +
      '<div class="ln-metric__value' +
      (tone ? ' ' + tone : '') +
      '">' +
      value +
      '</div>' +
      (delta ? '<div class="ln-metric__delta ' + delta.cls + '">' + delta.text + '</div>' : '') +
      '<div class="ln-metric__footer">' +
      footer +
      '</div></div></div></article>'
    );
  }

  function hbar(reasons) {
    var max = Math.max.apply(
      null,
      reasons
        .map(function (r) {
          return r.n;
        })
        .concat([1])
    );
    return (
      '<div class="ln-hbar">' +
      reasons
        .slice(0, 6)
        .map(function (r) {
          var w = Math.max(4, Math.round((r.n / max) * 100));
          return (
            '<div class="ln-hbar__row"><span class="ln-hbar__name">' +
            r.name +
            '</span><div class="ln-hbar__track"><div class="ln-hbar__fill' +
            (r.reg ? ' is-warn' : '') +
            '" style="width:' +
            w +
            '%"></div></div><span class="ln-hbar__n">' +
            r.n +
            '</span></div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function funnelChart(funnel) {
    var max = Math.max.apply(
      null,
      funnel
        .map(function (s) {
          return s.count;
        })
        .concat([1])
    );
    return (
      '<div class="ln-funnel">' +
      funnel
        .map(function (s) {
          var w = Math.max(6, Math.round((s.count / max) * 100));
          return (
            '<div class="ln-funnel__row' +
            (s.stuck ? ' is-stuck' : '') +
            (state.stage === s.id ? ' is-on' : '') +
            '"><button type="button" data-stage="' +
            s.id +
            '"><span class="ln-funnel__label">' +
            s.name +
            '</span><span class="ln-funnel__track"><span class="ln-funnel__fill" style="width:' +
            w +
            '%"></span></span><span class="ln-funnel__n">' +
            s.count +
            '</span></button></div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function render() {
    var root = $('#dash-native-root');
    if (!root) return;
    var d = data();
    var isExec = state.role === 'exec';
    var title = isExec ? 'Time to Yes - Leadership' : 'Time to Yes - Ops Desk';
    var prodLabel = LP.META[state.product] ? LP.META[state.product].label : 'All products';
    var asOf = 'As of demo clock · Running user Demo';

    // Stock metric components: report titles look like out-of-box dashboard widgets
    var metrics = isExec
      ? metricCard(
          'Applications Created',
          d.appsIn,
          'Report: Applications by Created Date',
          'Grand Total',
          '',
          3,
          { cls: 'is-up', text: '↑ 4%' }
        ) +
        metricCard(
          'Median Days to Decision',
          d.medianDecision,
          'Report: Application Aging Summary',
          'Record Count · Days',
          'is-warn',
          3,
          { cls: 'is-down', text: '↑ 0.4' }
        ) +
        metricCard(
          'Applications Funded',
          funded(d),
          'Report: Funded Applications',
          'Grand Total',
          'is-ok',
          3,
          { cls: 'is-up', text: '↑ 2' }
        ) +
        metricCard(
          'Conversion %',
          conv(d) + '%',
          'Report: App to Funded (formula)',
          'Summary formula',
          '',
          3,
          null
        )
      : metricCard(
          'Apps Past SLA',
          d.stuck,
          'Report: Open Applications Past SLA',
          'Grand Total',
          'is-hot',
          3,
          { cls: 'is-down', text: '↑ 3' }
        ) +
        metricCard(
          'Approved w/ Conditions',
          cond(d),
          'Report: Applications by Stage',
          'Stage = Conditions',
          'is-warn',
          3,
          null
        ) +
        metricCard(
          'On Hold',
          d.policyHold,
          'Report: Applications with Holds',
          'Grand Total',
          '',
          3,
          null
        ) +
        metricCard(
          'Status Mismatch',
          d.dualSystem,
          'Report: CRM vs LOS Status',
          'Grand Total',
          'is-warn',
          3,
          null
        );

    var scoreRows = LP.scorecardRows()
      .map(function (p) {
        var c = Math.round((p.funded / p.apps) * 100);
        return (
          '<tr class="is-click' +
          (state.product === p.id ? ' is-on' : '') +
          '" data-product="' +
          p.id +
          '"><td><span class="ln-link">' +
          p.label +
          '</span></td><td>' +
          p.med +
          'd</td><td>' +
          p.stuck +
          '</td><td>' +
          c +
          '%</td></tr>'
        );
      })
      .join('');

    // Stock LEX: report widgets only. No product DNA, no act-now worklist UX, no custom CTAs.
    var lower = isExec
      ? '<article class="ln-comp ln-comp--8">' +
        compHeader('Report: Applications by Product') +
        '<div class="ln-comp__body"><div class="ln-table-wrap"><table class="ln-table"><thead><tr><th>Product</th><th>Med. decision</th><th>Past SLA</th><th>Conv</th></tr></thead><tbody>' +
        scoreRows +
        '</tbody></table></div><p class="ln-comp-foot">Table component · source report (illustrative)</p></div></article>' +
        '<article class="ln-comp ln-comp--4">' +
        compHeader('Report: Decision speed (chart)') +
        '<div class="ln-comp__body">' +
        hbar(
          (d.reasons || []).slice(0, 4).map(function (r) {
            return r;
          })
        ) +
        '<p class="ln-comp-foot">Horizontal bar chart component</p></div></article>'
      : '<article class="ln-comp ln-comp--6">' +
        compHeader('Report: Stall reasons') +
        '<div class="ln-comp__body">' +
        hbar(d.reasons) +
        '<p class="ln-comp-foot">Horizontal bar chart · from report</p></div></article>' +
        '<article class="ln-comp ln-comp--6">' +
        compHeader('Report: Open applications (sample)') +
        '<div class="ln-comp__body"><div class="ln-table-wrap"><table class="ln-table"><thead><tr><th>Application</th><th>Status</th></tr></thead><tbody>' +
        (d.watch || [])
          .map(function (w) {
            var id = String(w.file).replace(/^LF-/, 'APP-');
            return (
              '<tr><td>' +
              id +
              '</td><td>' +
              w.pill +
              '</td></tr>'
            );
          })
          .join('') +
        '</tbody></table></div><p class="ln-comp-foot">Read-only report table · not a work queue</p></div></article>';

    root.innerHTML =
      '<div class="ln-root">' +
      '<div class="ln-build-banner">' +
      '<span class="ln-build-banner__tag">Standard LEX</span>' +
      '<p><strong>Dashboard builder, minutes not months.</strong> Metric + chart + table components on a dynamic dashboard. ' +
      'Filters and refresh. No product DNA, no aging heat, no claim/clear queue. Same demo numbers as the custom build so the contrast is the surface, not the data.</p>' +
      '</div>' +
      '<div class="ln-dash-top">' +
      '<div class="ln-breadcrumb"><span>Dashboards</span><span class="ln-breadcrumb__sep">›</span><span>Private Dashboards</span><span class="ln-breadcrumb__sep">›</span><span>' +
      title +
      '</span></div>' +
      '<div class="ln-dash-top__row">' +
      '<div class="ln-dash-top__title-block">' +
      '<h1 class="ln-dash-top__title">' +
      title +
      '</h1>' +
      '<div class="ln-dash-top__meta">Dynamic Dashboard · Created by Demo User · Last refreshed demo clock</div>' +
      '</div>' +
      '<div class="ln-dash-top__actions">' +
      '<div class="ln-btn-group" role="group" aria-label="Saved view">' +
      '<button type="button" class="' +
      (isExec ? 'is-on' : '') +
      '" data-role="exec">Folder: Leadership</button>' +
      '<button type="button" class="' +
      (!isExec ? 'is-on' : '') +
      '" data-role="ops">Folder: Ops</button></div>' +
      '<button type="button" class="ln-btn ln-btn--neutral" id="ln-refresh">Refresh</button>' +
      '<button type="button" class="ln-btn ln-btn--neutral" data-skin="custom">Open custom build</button>' +
      '</div></div></div>' +
      '<div class="ln-filters">' +
      '<label>Product<select id="ln-product"></select></label>' +
      '<label>Date range<select id="ln-window"><option value="7d">Last 7 Days</option><option value="30d">Last 30 Days</option></select></label>' +
      '<span class="ln-filters__spacer"></span>' +
      '<span class="ln-filters-note">Standard dashboard filters</span>' +
      '</div>' +
      '<div class="ln-grid-wrap"><div class="ln-grid">' +
      metrics +
      '<article class="ln-comp ln-comp--12">' +
      compHeader('Report: Applications by Stage') +
      '<div class="ln-comp__body">' +
      funnelChart(d.funnel) +
      '<p class="ln-comp-foot">Bar chart component · grouped by stage picklist</p></div></article>' +
      lower +
      '</div></div>' +
      '<div class="ln-footer"><span><strong>Filters:</strong> ' +
      prodLabel +
      ' · ' +
      state.window +
      '</span><span>' +
      asOf +
      '</span><span>Standard components only · switch to Custom component for job-shaped UX</span></div></div>';

    var sel = $('#ln-product');
    if (sel) {
      LP.fillSelect(sel);
      sel.value = state.product;
      sel.addEventListener('change', function () {
        setProduct(sel.value);
      });
    }
    var win = $('#ln-window');
    if (win) {
      win.value = state.window;
      win.addEventListener('change', function () {
        state.window = win.value;
        render();
      });
    }
    var ref = $('#ln-refresh');
    if (ref) {
      ref.addEventListener('click', function () {
        render();
      });
    }

    root.querySelectorAll('[data-role]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.role = btn.getAttribute('data-role');
        render();
      });
    });
    root.querySelectorAll('[data-role-switch]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.role = btn.getAttribute('data-role-switch');
        render();
      });
    });
    root.querySelectorAll('[data-stage]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-stage');
        state.stage = state.stage === id ? null : id;
        render();
      });
    });
    root.querySelectorAll('[data-product]').forEach(function (row) {
      row.addEventListener('click', function () {
        setProduct(row.getAttribute('data-product'));
      });
    });
    root.querySelectorAll('[data-go-eq]').forEach(function (btn) {
      btn.addEventListener('click', goEq);
    });
    root.querySelectorAll('[data-go-apps]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.mortgageShell) window.mortgageShell.navigate('pipeline', 'all-open');
      });
    });
    root.querySelectorAll('[data-go-app]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var appId = btn.getAttribute('data-go-app');
        if (window.mortgageShell) window.mortgageShell.navigate('pipeline', 'all-open');
        setTimeout(function () {
          if (window.mortgagePipeline && appId) window.mortgagePipeline.selectFile(appId);
        }, 60);
      });
    });
    root.querySelectorAll('[data-skin]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var skin = btn.getAttribute('data-skin');
        if (window.mortgageDash && window.mortgageDash.setSkin) {
          window.mortgageDash.setSkin(skin);
        }
      });
    });
  }

  function syncFromCustom(partial) {
    if (!partial) return;
    if (partial.product) state.product = partial.product;
    if (partial.window) state.window = partial.window;
    if (partial.role) state.role = partial.role;
  }

  function getState() {
    return { product: state.product, window: state.window, role: state.role };
  }

  window.mortgageDashNative = {
    render: render,
    syncFromCustom: syncFromCustom,
    getState: getState,
    setProduct: setProduct,
  };
})();
