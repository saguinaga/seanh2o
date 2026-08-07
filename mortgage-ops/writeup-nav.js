/** Write-up: jump buttons into interactive demos + section drill highlight */
(function () {
  function bind() {
    document.querySelectorAll('[data-wu-nav]').forEach(function (btn) {
      if (btn._wuBound) return;
      btn._wuBound = true;
      btn.addEventListener('click', function () {
        const parts = btn.getAttribute('data-wu-nav').split(':');
        if (window.mortgageShell) window.mortgageShell.navigate(parts[0], parts[1]);
      });
    });

    // Expansion path steps → related demos
    var path = document.querySelector('.expansion-path');
    if (path && !path._wuBound) {
      path._wuBound = true;
      var steps = path.querySelectorAll('.path-step');
      var targets = [
        'accelerator:dashboard',
        'reports:ops-folder',
        'accelerator:dashboard',
        'pipeline:all-open',
      ];
      steps.forEach(function (step, i) {
        step.style.cursor = 'pointer';
        step.title = 'Open related demo';
        step.addEventListener('click', function () {
          var nav = targets[i] || 'exceptions:queue';
          var parts = nav.split(':');
          if (window.mortgageShell) window.mortgageShell.navigate(parts[0], parts[1]);
        });
      });
    }

    // Object chips → demos
    document.querySelectorAll('.object-chip').forEach(function (chip, i) {
      if (chip._wuBound) return;
      chip._wuBound = true;
      chip.style.cursor = 'pointer';
      var map = [
        'pipeline:all-open',
        'exceptions:queue',
        'accelerator:path',
        'accelerator:dashboard',
        'exceptions:queue',
        'reports:ops-folder',
      ];
      chip.addEventListener('click', function () {
        var nav = map[i] || 'exceptions:queue';
        var parts = nav.split(':');
        if (window.mortgageShell) window.mortgageShell.navigate(parts[0], parts[1]);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
