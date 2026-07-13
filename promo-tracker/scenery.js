/**
 * Bloom theme: gentle mouse parallax on floating destination cards (desktop only).
 */
(function () {
  const scenery = document.querySelector('.scenery');
  if (!scenery) return;

  const cards = [...scenery.querySelectorAll('.scenery-card')];
  const mqDesktop = window.matchMedia('(min-width: 701px)');
  const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function active() {
    return document.documentElement.dataset.theme === 'bloom'
      && mqDesktop.matches
      && !mqMotion.matches;
  }

  function reset() {
    scenery.style.removeProperty('transform');
    cards.forEach((card) => {
      card.style.removeProperty('--parallax-x');
      card.style.removeProperty('--parallax-y');
    });
  }

  function onMove(event) {
    if (!active()) return;

    const cx = window.innerWidth * 0.5;
    const cy = window.innerHeight * 0.5;
    const dx = (event.clientX - cx) / cx;
    const dy = (event.clientY - cy) / cy;

    scenery.style.transform =
      `rotateX(${dy * -2.5}deg) rotateY(${dx * 3.5}deg)`;

    cards.forEach((card, index) => {
      const depth = 0.55 + (index % 4) * 0.12;
      card.style.setProperty('--parallax-x', `${dx * 10 * depth}px`);
      card.style.setProperty('--parallax-y', `${dy * 7 * depth}px`);
    });
  }

  document.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mouseleave', reset);

  mqDesktop.addEventListener('change', () => { if (!active()) reset(); });
  mqMotion.addEventListener('change', () => { if (!active()) reset(); });

  new MutationObserver(() => { if (!active()) reset(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();