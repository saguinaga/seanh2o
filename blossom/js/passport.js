/** Surf City Passport — stamps for zones, landmarks, days */
window.BlossomPassport = (function () {
  const PAGES = [
    { id: 'zone-yard', label: '9th Street', emoji: '🏠', group: 'zones' },
    { id: 'zone-street', label: 'Main Street', emoji: '🛍️', group: 'zones' },
    { id: 'zone-pch', label: 'PCH', emoji: '🛣️', group: 'zones' },
    { id: 'zone-pacCity', label: 'Pacific City', emoji: '🌴', group: 'zones' },
    { id: 'zone-park', label: 'HB Pier', emoji: '🎡', group: 'zones' },
    { id: 'lm-pch-arch', label: 'Main & PCH', emoji: '📍', group: 'landmarks' },
    { id: 'lm-surf-museum', label: 'Surf Museum', emoji: '🏄', group: 'landmarks' },
    { id: 'lm-pac-city-arch', label: 'Pac City Arch', emoji: '🌉', group: 'landmarks' },
    { id: 'lm-us-open', label: 'US Open Zone', emoji: '🏆', group: 'landmarks' },
    { id: 'lm-pier', label: 'HB Pier', emoji: '🌊', group: 'landmarks' },
    { id: 'lm-rubys', label: "Ruby's Diner", emoji: '🍔', group: 'landmarks' },
  ];

  const ZONE_STAMP = {
    yard: 'zone-yard',
    street: 'zone-street',
    pch: 'zone-pch',
    pacCity: 'zone-pacCity',
    park: 'zone-park',
  };

  const LM_STAMP = {
    'pch-arch': 'lm-pch-arch',
    'surf-museum': 'lm-surf-museum',
    'pac-city-arch': 'lm-pac-city-arch',
    'us-open': 'lm-us-open',
    pier: 'lm-pier',
    rubys: 'lm-rubys',
  };

  function ensure(state) {
    if (!state.passportStamps) state.passportStamps = {};
  }

  function stamp(state, stampId) {
    ensure(state);
    if (state.passportStamps[stampId]) return false;
    state.passportStamps[stampId] = Date.now();
    return true;
  }

  function stampZone(state, zoneId) {
    const id = ZONE_STAMP[zoneId];
    return id ? stamp(state, id) : false;
  }

  function stampLandmark(state, lmId) {
    const id = LM_STAMP[lmId];
    return id ? stamp(state, id) : false;
  }

  function stampDay(state) {
    return stamp(state, `day-${state.day || 1}`);
  }

  function count(state) {
    ensure(state);
    const pageIds = PAGES.map((p) => p.id);
    const pages = pageIds.filter((id) => state.passportStamps[id]).length;
    const days = Object.keys(state.passportStamps).filter((k) => k.startsWith('day-')).length;
    return { pages, pagesTotal: PAGES.length, days };
  }

  function renderModal(state) {
    const modal = document.getElementById('passportModal');
    const grid = document.getElementById('passportGrid');
    const prog = document.getElementById('passportProgress');
    if (!modal || !grid) return;
    ensure(state);
    const c = count(state);
    if (prog) prog.textContent = `${c.pages}/${c.pagesTotal} stamps · ${c.days} days bloomed`;
    grid.innerHTML = PAGES.map((p) => {
      const got = Boolean(state.passportStamps[p.id]);
      return `<div class="passport-stamp ${got ? 'passport-stamp--got' : ''}">
        <span class="passport-stamp__emoji">${got ? p.emoji : '❔'}</span>
        <span class="passport-stamp__label">${p.label}</span>
      </div>`;
    }).join('');
    modal.hidden = false;
    modal.classList.add('passport-modal--open');
  }

  function closeModal() {
    const modal = document.getElementById('passportModal');
    if (!modal) return;
    modal.classList.remove('passport-modal--open');
    setTimeout(() => { modal.hidden = true; }, 200);
  }

  return {
    PAGES, stamp, stampZone, stampLandmark, stampDay, count, renderModal, closeModal,
  };
})();