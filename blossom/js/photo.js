/** Photo mode — hide HUD, pause time, capture frame */
window.BlossomPhoto = (function () {
  let active = false;

  function isActive() {
    return active;
  }

  function setActive(on) {
    active = !!on;
    document.querySelector('[data-screen="game"]')?.classList.toggle('photo-mode', active);
    const btn = document.getElementById('photoBtn');
    if (btn) {
      btn.textContent = active ? '📷 Exit' : '📷';
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  function toggle() {
    setActive(!active);
    window.BlossomAudio?.playSfx('ui');
    return active;
  }

  function capture(canvas) {
    if (!canvas) return;
    try {
      const link = document.createElement('a');
      link.download = `blossom-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      window.BlossomAudio?.playSfx('sparkle');
    } catch (_) {
      window.BlossomApp?.showToast?.('Could not save photo on this device.', 'warn');
    }
  }

  function init() {
    document.getElementById('photoBtn')?.addEventListener('click', () => {
      if (active) capture(document.getElementById('gameCanvas'));
      else toggle();
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { toggle, isActive, setActive, capture, init };
})();