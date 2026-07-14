/** Global guards — keep game running through script errors */
(function () {
  window.addEventListener('error', (e) => {
    console.warn('[Blossom] caught error:', e.message);
    window.BlossomBoot?.hideLoad?.();
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.warn('[Blossom] unhandled rejection:', e.reason);
    window.BlossomBoot?.hideLoad?.();
    e.preventDefault?.();
  });
})();