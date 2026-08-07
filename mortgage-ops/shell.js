/**
 * Illustrative Lightning chrome: App Launcher (waffle) + in-app view menu.
 * Demo only — not a live Salesforce org.
 */
(function () {
  const APPS = {
    exceptions: {
      id: 'exceptions',
      name: 'Exception Queue',
      blurb: 'Stuck applications · AI ranks · humans clear',
      icon: 'E',
      views: [
        { id: 'queue', label: 'AI-prioritized app queue', panel: 'panel-exceptions' },
        { id: 'writeup', label: 'Case study write-up', panel: 'panel-writeup' },
      ],
    },
    accelerator: {
      id: 'accelerator',
      name: 'Accelerator Analytics',
      blurb: 'Loan apps · time to yes · dashboards',
      icon: 'A',
      views: [
        { id: 'dashboard', label: 'Dashboard: Time to Yes', panel: 'panel-dashboard' },
        { id: 'writeup', label: 'Case study write-up', panel: 'panel-writeup' },
        { id: 'path', label: 'Application path', panel: 'panel-path' },
      ],
    },
    pipeline: {
      id: 'pipeline',
      name: 'Loan Applications',
      blurb: 'Apps in flight · start to fund',
      icon: 'L',
      views: [
        { id: 'all-open', label: 'All open applications', panel: 'panel-pipeline' },
        { id: 'past-sla', label: 'Past SLA', panel: 'panel-pipeline' },
        { id: 'conditions', label: 'Approved w/ conditions', panel: 'panel-pipeline' },
      ],
      queueFilter: {
        'all-open': null,
        'past-sla': 'stuck',
        'conditions': 'conditions',
      },
    },
    reports: {
      id: 'reports',
      name: 'Reports',
      blurb: 'Application pipeline charts',
      icon: 'R',
      views: [
        { id: 'recent', label: 'All reports', panel: 'panel-reports' },
        { id: 'ops-folder', label: 'Folder: App pipeline', panel: 'panel-reports' },
      ],
    },
  };

  const state = {
    appId: 'exceptions',
    viewId: 'queue',
    launcherOpen: false,
    viewMenuOpen: false,
  };

  const el = {
    launcher: null,
    waffle: null,
    appName: null,
    viewBtn: null,
    viewMenu: null,
    viewLabel: null,
    demoBanner: null,
    backdrop: null,
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function currentApp() {
    return APPS[state.appId];
  }

  function currentView() {
    const app = currentApp();
    return app.views.find((v) => v.id === state.viewId) || app.views[0];
  }

  function closeMenus() {
    state.launcherOpen = false;
    state.viewMenuOpen = false;
    if (el.launcher) el.launcher.hidden = true;
    if (el.viewMenu) el.viewMenu.hidden = true;
    if (el.waffle) el.waffle.setAttribute('aria-expanded', 'false');
    if (el.viewBtn) el.viewBtn.setAttribute('aria-expanded', 'false');
    if (el.backdrop) el.backdrop.hidden = true;
    document.body.classList.remove('chrome-menu-open');
  }

  function openLauncher() {
    state.viewMenuOpen = false;
    if (el.viewMenu) el.viewMenu.hidden = true;
    if (el.viewBtn) el.viewBtn.setAttribute('aria-expanded', 'false');
    state.launcherOpen = true;
    el.launcher.hidden = false;
    el.waffle.setAttribute('aria-expanded', 'true');
    el.backdrop.hidden = false;
    renderLauncher();
  }

  function openViewMenu() {
    state.launcherOpen = false;
    if (el.launcher) el.launcher.hidden = true;
    if (el.waffle) el.waffle.setAttribute('aria-expanded', 'false');
    state.viewMenuOpen = true;
    el.viewMenu.hidden = false;
    el.viewBtn.setAttribute('aria-expanded', 'true');
    el.backdrop.hidden = false;
    document.body.classList.add('chrome-menu-open');
    renderViewMenu();
  }

  function renderLauncher() {
    const grid = $('#app-launcher-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.values(APPS).forEach((app) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'launcher-tile' + (app.id === state.appId ? ' is-current' : '');
      btn.innerHTML =
        '<span class="launcher-icon" aria-hidden="true">' + app.icon + '</span>' +
        '<span class="launcher-name">' + app.name + '</span>' +
        '<span class="launcher-blurb">' + app.blurb + '</span>';
      btn.addEventListener('click', () => {
        setApp(app.id);
        closeMenus();
      });
      grid.appendChild(btn);
    });

    const exit = document.createElement('a');
    exit.href = '../index.html#work';
    exit.className = 'launcher-tile launcher-tile--exit';
    exit.setAttribute('data-plausible-event', 'Nav - Back to Portfolio');
    exit.innerHTML =
      '<span class="launcher-icon" aria-hidden="true">↩</span>' +
      '<span class="launcher-name">Portfolio site</span>' +
      '<span class="launcher-blurb">Leave demo shell</span>';
    grid.appendChild(exit);
  }

  function renderViewMenu() {
    const menu = el.viewMenu;
    if (!menu) return;
    const app = currentApp();
    menu.innerHTML = '';
    app.views.forEach((view) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'view-menu-item' + (view.id === state.viewId ? ' is-current' : '');
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', view.id === state.viewId ? 'true' : 'false');
      btn.textContent = view.label;
      // pointerdown so we win before backdrop click closes the menu
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setView(view.id);
        closeMenus();
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      menu.appendChild(btn);
    });
  }

  function setApp(appId) {
    if (!APPS[appId]) return;
    state.appId = appId;
    state.viewId = APPS[appId].views[0].id;
    syncChrome();
    showPanel();
  }

  function setView(viewId) {
    const app = currentApp();
    if (!app.views.some((v) => v.id === viewId)) return;
    state.viewId = viewId;
    syncChrome();
    showPanel();
  }

  function navigate(appId, viewId) {
    if (!APPS[appId]) return;
    state.appId = appId;
    const app = APPS[appId];
    const ok = app.views.some((v) => v.id === viewId);
    state.viewId = ok ? viewId : app.views[0].id;
    closeMenus();
    syncChrome();
    showPanel();
  }

  function syncChrome() {
    const app = currentApp();
    const view = currentView();
    if (el.appName) el.appName.textContent = app.name;
    if (el.viewLabel) el.viewLabel.textContent = view.label;
    if (el.demoBanner) {
      el.demoBanner.textContent =
        'Demo shell · ' + app.name + ' · click waffle or view menu · not a live org';
    }
    // Highlight context chips
    $all('.nav-chip[data-shell-app]').forEach((node) => {
      const app = node.getAttribute('data-shell-app');
      const view = node.getAttribute('data-shell-view');
      let on = false;
      if (app === 'pipeline' || app === 'reports') {
        on = state.appId === app;
      } else if (app === 'exceptions' && view === 'queue') {
        on = state.appId === 'exceptions' && state.viewId === 'queue';
      } else if (view === 'writeup') {
        on = state.viewId === 'writeup';
      } else {
        on = state.appId === app && state.viewId === view;
      }
      node.classList.toggle('is-active', on);
    });
  }

  function showPanel() {
    const view = currentView();
    $all('[data-shell-panel]').forEach((panel) => {
      const on = panel.id === view.panel;
      panel.hidden = !on;
      panel.classList.toggle('is-active-panel', on);
    });

    // Refresh interactive panels when shown
    if (view.panel === 'panel-pipeline' && window.mortgagePipeline) {
      window.mortgagePipeline.render();
    }
    if (view.panel === 'panel-reports' && window.mortgageReports) {
      window.mortgageReports.render();
    }
    if (view.panel === 'panel-dashboard' && window.mortgageDash) {
      window.mortgageDash.render();
    }
    if (view.panel === 'panel-path' && window.mortgagePath) {
      window.mortgagePath.refresh();
    }
  }

  function bindNavChips() {
    $all('[data-shell-view]').forEach((node) => {
      node.addEventListener('click', (e) => {
        e.preventDefault();
        const appId = node.getAttribute('data-shell-app');
        const viewId = node.getAttribute('data-shell-view');
        if (appId && APPS[appId]) {
          state.appId = appId;
          state.viewId = viewId;
          closeMenus();
          syncChrome();
          showPanel();
        }
      });
    });
  }

  function init() {
    el.launcher = $('#app-launcher');
    el.waffle = $('#waffle-btn');
    el.appName = $('#chrome-app-name');
    el.viewBtn = $('#view-menu-btn');
    el.viewMenu = $('#view-menu');
    el.viewLabel = $('#view-menu-label');
    el.demoBanner = $('#demo-banner');
    el.backdrop = $('#chrome-backdrop');

    if (!el.waffle || !el.viewBtn) return;

    el.waffle.addEventListener('click', () => {
      if (state.launcherOpen) closeMenus();
      else openLauncher();
    });

    el.viewBtn.addEventListener('click', () => {
      if (state.viewMenuOpen) closeMenus();
      else openViewMenu();
    });

    if (el.backdrop) {
      el.backdrop.addEventListener('click', closeMenus);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenus();
    });

    bindNavChips();
    renderLauncher();
    renderViewMenu();
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
    getState: function () {
      return { appId: state.appId, viewId: state.viewId };
    },
  };
})();
