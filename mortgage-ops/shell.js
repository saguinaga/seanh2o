/**
 * Demo shell: one app (Xtreme), one top nav. Not a live Salesforce org.
 * navigate(appId, viewId) still accepts legacy pairs used by panels.
 */
(function () {
  // Primary screens shown in the top nav (order = left to right)
  var SCREENS = [
    { id: 'dashboard', label: 'Dashboard', panel: 'panel-dashboard' },
    { id: 'applications', label: 'Applications', panel: 'panel-pipeline' },
    { id: 'exceptions', label: 'Exceptions', panel: 'panel-exceptions' },
    { id: 'reports', label: 'Reports', panel: 'panel-reports' },
    { id: 'path', label: 'Path', panel: 'panel-path' },
    { id: 'writeup', label: 'Write-up', panel: 'panel-writeup' },
  ];

  // Legacy navigate('app','view') → screen id + optional side effects
  var LEGACY = {
    'accelerator:dashboard': { screen: 'dashboard' },
    'accelerator:path': { screen: 'path' },
    'accelerator:writeup': { screen: 'writeup' },
    'pipeline:all-open': { screen: 'applications', pipelineView: 'all-open' },
    'pipeline:past-sla': { screen: 'applications', pipelineView: 'past-sla' },
    'pipeline:conditions': { screen: 'applications', pipelineView: 'conditions' },
    'exceptions:queue': { screen: 'exceptions' },
    'exceptions:writeup': { screen: 'writeup' },
    'reports:recent': { screen: 'reports', reportsView: 'recent' },
    'reports:ops-folder': { screen: 'reports', reportsView: 'ops-folder' },
  };

  var state = {
    screenId: 'dashboard',
    pipelineView: 'all-open',
    reportsView: 'ops-folder',
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function screenById(id) {
    return SCREENS.find(function (s) {
      return s.id === id;
    });
  }

  function resolveLegacy(appId, viewId) {
    var key = appId + ':' + (viewId || '');
    if (LEGACY[key]) return LEGACY[key];
    // Fallback by app only
    if (appId === 'pipeline') return { screen: 'applications', pipelineView: viewId || 'all-open' };
    if (appId === 'exceptions') return { screen: 'exceptions' };
    if (appId === 'reports') return { screen: 'reports', reportsView: viewId || 'ops-folder' };
    if (appId === 'accelerator') {
      if (viewId === 'path') return { screen: 'path' };
      if (viewId === 'writeup') return { screen: 'writeup' };
      return { screen: 'dashboard' };
    }
    return { screen: 'dashboard' };
  }

  function goScreen(screenId, opts) {
    opts = opts || {};
    var scr = screenById(screenId);
    if (!scr) return;
    state.screenId = screenId;
    if (opts.pipelineView) state.pipelineView = opts.pipelineView;
    if (opts.reportsView) state.reportsView = opts.reportsView;
    syncChrome();
    showPanel();
  }

  function navigate(appId, viewId) {
    var r = resolveLegacy(appId, viewId);
    goScreen(r.screen, {
      pipelineView: r.pipelineView,
      reportsView: r.reportsView,
    });
  }

  function syncChrome() {
    var scr = screenById(state.screenId) || SCREENS[0];
    var nameEl = $('#chrome-app-name');
    if (nameEl) nameEl.textContent = 'Xtreme';

    $all('.nav-chip[data-screen]').forEach(function (node) {
      node.classList.toggle('is-active', node.getAttribute('data-screen') === state.screenId);
    });

    var banner = $('#demo-banner');
    if (banner) {
      banner.textContent =
        'Xtreme demo · ' + scr.label + ' · loan applications · not a live org';
    }
  }

  function showPanel() {
    var scr = screenById(state.screenId) || SCREENS[0];
    $all('[data-shell-panel]').forEach(function (panel) {
      var on = panel.id === scr.panel;
      panel.hidden = !on;
      panel.classList.toggle('is-active-panel', on);
    });

    if (scr.panel === 'panel-pipeline' && window.mortgagePipeline) {
      // Bridge pipeline shell filters via getState shape panels already expect
      window.mortgagePipeline.render();
    }
    if (scr.panel === 'panel-reports' && window.mortgageReports) {
      window.mortgageReports.render();
    }
    if (scr.panel === 'panel-dashboard' && window.mortgageDash) {
      window.mortgageDash.render();
    }
    if (scr.panel === 'panel-path' && window.mortgagePath) {
      window.mortgagePath.refresh();
    }
  }

  function bindNav() {
    $all('.nav-chip[data-screen]').forEach(function (node) {
      node.addEventListener('click', function (e) {
        e.preventDefault();
        goScreen(node.getAttribute('data-screen'));
      });
    });
  }

  function init() {
    bindNav();
    state.screenId = 'dashboard';
    syncChrome();
    showPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.mortgageShell = {
    navigate: navigate,
    goScreen: goScreen,
    getState: function () {
      // Keep shape used by pipeline/reports applyShellFilter
      var scr = state.screenId;
      if (scr === 'applications') {
        return { appId: 'pipeline', viewId: state.pipelineView || 'all-open' };
      }
      if (scr === 'exceptions') {
        return { appId: 'exceptions', viewId: 'queue' };
      }
      if (scr === 'reports') {
        return { appId: 'reports', viewId: state.reportsView || 'ops-folder' };
      }
      if (scr === 'path') {
        return { appId: 'accelerator', viewId: 'path' };
      }
      if (scr === 'writeup') {
        return { appId: 'accelerator', viewId: 'writeup' };
      }
      return { appId: 'accelerator', viewId: 'dashboard' };
    },
  };
})();
