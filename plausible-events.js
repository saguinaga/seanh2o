/**
 * Optional custom-event helper for data-plausible-event clicks.
 * Throttles and backs off on failure so a Plausible 429 does not flood the console.
 * Pageviews still come from the official Plausible snippet.
 */
(function () {
  var disabled = false;
  var failCount = 0;
  var lastSent = 0;
  var MIN_GAP_MS = 400;
  var MAX_FAILS = 2;

  function track(name, props) {
    if (disabled) return;
    if (typeof window.plausible !== 'function') return;
    if (!name) return;

    var now = Date.now();
    if (now - lastSent < MIN_GAP_MS) return;
    lastSent = now;

    try {
      if (props && typeof props === 'object') {
        window.plausible(name, { props: props });
      } else {
        window.plausible(name);
      }
    } catch (err) {
      failCount += 1;
      if (failCount >= MAX_FAILS) disabled = true;
    }
  }

  // If Plausible's own fetch starts failing (429), stop our custom events for this session.
  // Pageview script may still log CORS/429 once; we avoid piling on.
  if (typeof window.fetch === 'function' && !window.__plausibleFetchWrapped) {
    window.__plausibleFetchWrapped = true;
    var origFetch = window.fetch;
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : input && input.url;
      var p = origFetch.apply(this, arguments);
      if (url && String(url).indexOf('plausible.io') !== -1) {
        return p.then(
          function (res) {
            if (res && (res.status === 429 || res.status >= 500)) {
              failCount += 1;
              if (failCount >= MAX_FAILS) disabled = true;
            } else if (res && res.ok) {
              failCount = 0;
            }
            return res;
          },
          function (err) {
            failCount += 1;
            if (failCount >= MAX_FAILS) disabled = true;
            return Promise.reject(err);
          }
        );
      }
      return p;
    };
  }

  window.trackPlausible = track;

  document.addEventListener(
    'click',
    function (e) {
      var el = e.target.closest('[data-plausible-event]');
      if (!el) return;
      var name = el.getAttribute('data-plausible-event');
      if (!name) return;
      var propsRaw = el.getAttribute('data-plausible-event-props');
      var props = null;
      if (propsRaw) {
        try {
          props = JSON.parse(propsRaw);
        } catch (err) {
          props = null;
        }
      }
      track(name, props);
    },
    true
  );
})();
