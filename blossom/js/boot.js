/** Boot polish — loading screen fade, status text */
window.BlossomBoot = (function () {
  function setLoadStatus(text) {
    const el = document.getElementById('gameLoadStatus');
    if (el) el.textContent = text || '';
  }

  function hideLoad() {
    const loadEl = document.getElementById('gameLoad');
    if (!loadEl || loadEl.classList.contains('game-load--out')) return;
    loadEl.classList.add('game-load--out');
    window.setTimeout(() => {
      loadEl.hidden = true;
    }, 500);
  }

  function hideLoadAfterPaint() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(hideLoad);
    });
  }

  return { setLoadStatus, hideLoad, hideLoadAfterPaint };
})();