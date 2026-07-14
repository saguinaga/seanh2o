/** Scripted "Today in Surf City" events — no AI */
window.BlossomToday = (function () {
  const EVENTS = [
    { id: 'sunny', emoji: '☀️', title: 'Classic Surf City morning', line: 'Salt air on 9th Street — perfect day to walk Main.' },
    { id: 'fog', emoji: '🌫️', title: 'June gloom lifting', line: 'Fog burns off by afternoon. Pier might be dreamy right now.' },
    { id: 'busy_main', emoji: '🛍️', title: 'Main Street buzz', line: 'Shops are lively — locals say hi if you linger at the doors.' },
    { id: 'surf', emoji: '🏄', title: 'Surf check at PCH', line: 'Boards out near the museum — PCH sounds louder today.' },
    { id: 'pier_walk', emoji: '🎡', title: 'Pier stroll weather', line: 'Ruby\'s line might be long. Worth the view either way.' },
    { id: 'pac_city', emoji: '🌴', title: 'Pacific City breeze', line: 'The Strand smells like sunscreen and tacos.' },
    { id: 'bonnie', emoji: '💇', title: 'Bonnie\'s busy chair', line: 'Salon energy on Main — career bloom counts extra today.', bonusCareer: 1 },
    { id: 'birds', emoji: '🦆', title: 'Shorebirds active', line: 'Feed the birds by the pier if that\'s on your bloom list.' },
    { id: 'volleyball', emoji: '🏐', title: 'Courts are open', line: 'Someone left volleyballs out — good day for the beach task.' },
    { id: 'sunset', emoji: '🌅', title: 'Golden hour coming', line: 'Evening light hits the pier rails — photo-worthy.' },
    { id: 'quinn', emoji: '🌸', title: 'Quinn\'s recipe day', line: '3 meals + 3 bloom tasks = you\'re blooming. Explore between tasks!' },
    { id: 'coupon', emoji: '🎟️', title: 'Main Street find', line: 'You spotted a flyer — +$2 if you clear every bloom task today.', bonusMoney: 2, bonusAllBloom: true },
  ];

  function pickForDay(state) {
    const day = state.day || 1;
    if (day === 1) return EVENTS.find((e) => e.id === 'quinn') || EVENTS[0];
    const idx = (day * 7 + (state.level || 1)) % EVENTS.length;
    return EVENTS[idx];
  }

  function assign(state) {
    const ev = pickForDay(state);
    state.todayEventId = ev.id;
    return ev;
  }

  function current(state) {
    return EVENTS.find((e) => e.id === state.todayEventId) || pickForDay(state);
  }

  function onChoreDone(state, choreId) {
    const ev = current(state);
    const slot = state.bloomSlots?.career;
    if (ev.bonusCareer && choreId === slot) return ev.bonusCareer;
    return 0;
  }

  function onDayClear(state) {
    const ev = current(state);
    const slots = state.bloomSlots || {};
    const list = state.todaysChores || [];
    const done = state.choresDone || {};
    const allBloom = list.every((id) => done[id]);
    let money = 0;
    if (ev.bonusMoney && allBloom) money = ev.bonusMoney;
    return { money, allBloom };
  }

  function renderCard(state) {
    const ev = current(state);
    const el = document.getElementById('todayCard');
    if (!el) return;
    el.hidden = false;
    const emoji = el.querySelector('.today-card__emoji');
    const title = el.querySelector('.today-card__title');
    const line = el.querySelector('.today-card__line');
    if (emoji) emoji.textContent = ev.emoji;
    if (title) title.textContent = ev.title;
    if (line) line.textContent = ev.line;
  }

  return { EVENTS, assign, current, onChoreDone, onDayClear, renderCard };
})();