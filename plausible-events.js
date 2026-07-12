(function () {
  function track(name, props) {
    if (typeof window.plausible !== 'function') return;
    if (props && typeof props === 'object') {
      window.plausible(name, { props: props });
    } else {
      window.plausible(name);
    }
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
