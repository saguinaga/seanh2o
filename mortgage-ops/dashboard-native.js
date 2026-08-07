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

  function metricCard(label, value, footer, tone, span) {
    return (
      '<article class="ln-comp ln-comp--' +
      (span || 4) +
      '">' +
      '<header class="ln-comp__header"><h3>' +
      label +
      '</h3><span class="ln-comp__menu" aria-hidden="true">▾</span></header>' +
      '<div class="ln-comp__body"><div class="ln-metric">' +
      '<div class="ln-metric__label">Report · Summary</div>' +
      '<div class="ln-metric__value' +
      (tone ? ' ' + tone : '') +
      '">' +
      value +
      '</div>' +
      '<div class="ln-metric__footer">' +
      footer +
      '</div></div></div></article>'
    );
  }

  function hbar(reasons) {
    var max = Math.max.apply(
      null,
      reasons.map(function (r) {
        return r.n;
      }).concat([1])
    );
    return (
      '<div class="ln-hbar">' +
      reasons
        .slice(0, 6)
        .map(function (r) {
          var w = Math.round((r.n / max) * 100);
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

  function render() {
    var root = $('#dash-native-root');
    if (!root) return;
    var d = data();
    var isExec = state.role === 'exec';
    var title = isExec ? 'Time to Yes — Leadership' : 'Time to Yes — Ops Desk';
    var subtitle = isExec
      ? 'Dashboard · loan applications · outcomes'
      : 'Dashboard · loan applications · worklist signals';

    var metrics = isExec
      ? metricCard('Applications in', d.appsIn, 'This window · intake volume', '', 3) +
        metricCard(
          'Median time to decision',
          d.medianDecision + 'd',
          'Stage enter → credit decision',
          'is-warn',
          3
        ) +
        metricCard('Funded', funded(d), 'Closed in window', 'is-ok', 3) +
        metricCard('App → funded', conv(d) + '%', 'Illustrative conversion', '', 3)
      : metricCard('Stuck past SLA', d.stuck, 'Primary worklist size', 'is-hot', 3) +
        metricCard('In conditions', cond(d), 'Approved but not clear', 'is-warn', 3) +
        metricCard('Docs / rules holds', d.policyHold, 'Completeness + eligibility', '', 3) +
        metricCard('System mismatch', d.dualSystem, 'CRM vs LOS status', 'is-warn', 3);

    var path = d.funnel
      .map(function (s) {
        return (
          '<button type="button" class="ln-path__step' +
          (s.stuck ? ' is-stuck' : '') +
          (state.stage === s.id ? ' is-on' : '') +
          '" data-stage="' +
          s.id +
          '"><span>' +
          s.name +
          '</span><span class="ln-path__n">' +
          s.count +
          '</span></button>'
        );
      })
      .join('');

    var scoreRows = LP.scorecardRows()
      .map(function (p) {
        var c = Math.round((p.funded / p.apps) * 100);
        return (
          '<tr class="is-click' +
          (state.product === p.id ? ' is-on' : '') +
          '" data-product="' +
          p.id +
          '"><td><strong>' +
          p.label +
          '</strong></td><td>' +
          p.med +
          'd</td><td>' +
          p.stuck +
          '</td><td>' +
          c +
          '%</td></tr>'
        );
      })
      .join('');

    var watch = (d.watch || [])
      .map(function (w) {
        var id = String(w.file).replace(/^LF-/, 'APP-');
        return (
          '<li><button type="button" data-go-app="' +
          id +
          '"><span>' +
          id +
          ' · ' +
          w.why +
          '</span><span class="ln-badge' +
          (w.kind === 'sla' ? ' ln-badge--warn' : ' ln-badge--hot') +
          '">' +
          w.pill +
          '</span></button></li>'
        );
      })
      .join('');

    var lower = isExec
      ? '<article class="ln-comp ln-comp--8"><header class="ln-comp__header"><h3>Product scorecard</h3><span class="ln-comp__menu">▾</span></header>' +
        '<div class="ln-comp__body"><table class="ln-table"><thead><tr><th>Product</th><th>Med. decision</th><th>Past SLA</th><th>Conv*</th></tr></thead><tbody>' +
        scoreRows +
        '</tbody></table><p class="ln-metric__footer" style="margin-top:8px">*Illustrative. Click a product to filter this dashboard.</p></div></article>' +
        '<article class="ln-comp ln-comp--4"><header class="ln-comp__header"><h3>Leadership notes</h3><span class="ln-comp__menu">▾</span></header>' +
        '<div class="ln-comp__body"><ul class="ln-list" style="display:block">' +
        '<li style="display:block;border:none;padding:4px 0">Is median decision moving for the right reason?</li>' +
        '<li style="display:block;border:none;padding:4px 0">Which product path is slowest for this book?</li>' +
        '<li style="display:block;border:none;padding:4px 0">Is stuck rising faster than apps in?</li>' +
        '</ul><button type="button" class="ln-btn ln-btn--brand" style="margin-top:10px" data-role-switch="ops">Open Ops desk</button></div></article>'
      : '<article class="ln-comp ln-comp--6"><header class="ln-comp__header"><h3>Why applications stall</h3><span class="ln-comp__menu">▾</span></header>' +
        '<div class="ln-comp__body">' +
        hbar(d.reasons) +
        '</div></article>' +
        '<article class="ln-comp ln-comp--6"><header class="ln-comp__header"><h3>Report · Open exceptions (sample)</h3><span class="ln-comp__menu">▾</span></header>' +
        '<div class="ln-comp__body"><ul class="ln-list">' +
        watch +
        '</ul><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">' +
        '<button type="button" class="ln-btn ln-btn--brand" data-go-apps>Open Applications</button>' +
        '<button type="button" class="ln-btn" data-go-eq>Exception Queue</button></div></div></article>';

    root.innerHTML =
      '<div class="ln-root">' +
      '<div class="ln-page-header">' +
      '<div class="ln-page-header__row">' +
      '<div class="ln-page-header__icon">DB</div>' +
      '<div class="ln-page-header__meta">' +
      '<div class="ln-page-header__eyebrow">Xtreme · Dashboards</div>' +
      '<h1 class="ln-page-header__title">' +
      title +
      '</h1>' +
      '<div class="ln-page-header__eyebrow">' +
      subtitle +
      ' · demo data · not a live org</div></div>' +
      '<div class="ln-page-header__actions">' +
      '<div class="ln-skin-toggle" role="group" aria-label="Dashboard skin">' +
      '<button type="button" data-skin="custom">Custom prototype</button>' +
      '<button type="button" class="is-on" data-skin="native">Lightning layout</button>' +
      '</div>' +
      '<button type="button" class="ln-btn' +
      (isExec ? ' is-on' : '') +
      '" data-role="exec">Leadership</button>' +
      '<button type="button" class="ln-btn' +
      (!isExec ? ' is-on' : '') +
      '" data-role="ops">Ops desk</button>' +
      '<button type="button" class="ln-btn ln-btn--brand" data-go-eq>Exceptions</button>' +
      '</div></div>' +
      '<div class="ln-filter-bar">' +
      '<label>Product<select id="ln-product"></select></label>' +
      '<label>Date range<select id="ln-window"><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select></label>' +
      '<button type="button" class="ln-btn ln-btn--neutral" id="ln-refresh">Refresh</button>' +
      '</div></div>' +
      '<p class="ln-note">Lightning-style layout study: page header, filter bar, and dashboard components (metric + report charts). Same underlying demo metrics as the custom prototype. Not Salesforce-hosted.</p>' +
      '<div class="ln-grid">' +
      metrics +
      '<article class="ln-comp ln-comp--12"><header class="ln-comp__header"><h3>Application path · stage counts</h3><span class="ln-comp__menu">▾</span></header>' +
      '<div class="ln-comp__body"><div class="ln-path">' +
      path +
      '</div></div></article>' +
      lower +
      '</div>' +
      '<p class="ln-footer">As of demo clock · ' +
      (LP.META[state.product] ? LP.META[state.product].label : 'All products') +
      ' · ' +
      state.window +
      ' · Running user: Demo</p></div>';

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
