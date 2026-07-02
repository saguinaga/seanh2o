/** Delight layer — toasts, confetti, sparkles, milestone flex. Obvious on purpose. */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let confettiCanvas = null;
let confettiCtx = null;
let confettiPieces = [];
let confettiRaf = null;
let sparklesBound = false;

const MILESTONES = [
  { id: 'first-pin', test: (p) => p.queued >= 1, emoji: '📌', title: 'First pin!', body: 'Your board has an offer. The plan begins.' },
  { id: 'trip-1k', test: (p) => (p.netTravelPipeline || p.netPipeline) >= 1000, emoji: '✨', title: '$1k trip upside', body: 'Transfer math is starting to look real.' },
  { id: 'trip-3k', test: (p) => (p.netTravelPipeline || p.netPipeline) >= 3000, emoji: '🏖️', title: '$3k vacation energy', body: 'Beach week is on the mood board.' },
  { id: 'trip-5k', test: (p) => (p.netTravelPipeline || p.netPipeline) >= 5000, emoji: '🏰', title: '$5k Disney territory', body: 'Family trip math is getting spicy.' },
  { id: 'trip-10k', test: (p) => (p.netTravelPipeline || p.netPipeline) >= 10000, emoji: '🌴', title: '$10k dream trip', body: 'You are officially in luxury redemption territory.' },
  { id: 'captured', test: (p) => p.captured >= 500, emoji: '💰', title: 'Bonus landed!', body: 'Captured value is rolling in.' },
  { id: 'captured-2k', test: (p) => p.captured >= 2000, emoji: '💎', title: '$2k captured', body: 'The household helper is getting paid in points.' },
  { id: 'queue-5', test: (p) => p.queued >= 5, emoji: '🗂️', title: 'Full board', body: 'Five offers pinned — you are running a real queue.' },
  { id: 'score-steady', test: (_, sim) => sim && sim.summary.maxDrop <= 12, emoji: '💚', title: 'Credit stays classy', body: 'Max dip under 12 pts — responsible pacing.' },
  { id: 'score-elite', test: (_, sim) => sim && sim.summary.endScore >= 800, emoji: '👑', title: 'Elite FICO energy', body: 'Projected end score still in the 800s. Chef\'s kiss.' },
];

const CFO_LEVELS = [
  { min: 0, title: 'Rookie pin collector', emoji: '🌱' },
  { min: 1, title: 'Household helper', emoji: '🏠' },
  { min: 3, title: 'Bonus board curator', emoji: '📋' },
  { min: 5, title: 'Trip math wizard', emoji: '🧙' },
  { min: 3000, title: 'Transfer partner pro', emoji: '✈️', metric: 'trip' },
  { min: 5000, title: 'Family CFO', emoji: '👑', metric: 'trip' },
  { min: 10000, title: 'Vacation architect', emoji: '🏛️', metric: 'trip' },
];

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isAutomated() {
  return !!navigator.webdriver;
}

function ensureLayer() {
  if ($('#vanityLayer')) return;
  const layer = document.createElement('div');
  layer.id = 'vanityLayer';
  layer.className = 'vanity-layer';
  layer.innerHTML = `
    <div class="vanity-toasts" id="vanityToasts" aria-live="polite"></div>
    <canvas class="vanity-confetti" id="vanityConfetti" aria-hidden="true"></canvas>
    <div class="vanity-achievement" id="vanityAchievement" hidden>
      <div class="vanity-achievement__card">
        <span class="vanity-achievement__emoji" id="vanityAchEmoji">✨</span>
        <div>
          <strong id="vanityAchTitle">Milestone</strong>
          <p id="vanityAchBody">Nice.</p>
        </div>
        <button type="button" class="vanity-achievement__close" id="vanityAchClose" aria-label="Dismiss">×</button>
      </div>
    </div>
    <div class="vanity-sparkle-field" id="vanitySparkleField" aria-hidden="true"></div>
    <div class="vanity-levelup" id="vanityLevelUp" hidden aria-live="polite"></div>
  `;
  document.body.appendChild(layer);
  confettiCanvas = $('#vanityConfetti');
  if (confettiCanvas) {
    confettiCtx = confettiCanvas.getContext('2d');
    resizeConfetti();
    window.addEventListener('resize', resizeConfetti, { passive: true });
  }
  $('#vanityAchClose')?.addEventListener('click', () => {
    const el = $('#vanityAchievement');
    if (el) el.hidden = true;
  });
}

function $(sel) { return document.querySelector(sel); }

const WELCOME_KEY = 'promo_vanity_welcomed';
let welcomeDismissed = false;
let welcomeBound = false;

function ensureWelcomeSplash() {
  let splash = $('#vanitySplash');
  // Replace legacy static HTML splash (no dismiss button wiring / wrong layer)
  if (splash && !splash.querySelector('#vanitySplashGo')) {
    splash.remove();
    splash = null;
  }
  if (splash) return splash;
  splash = document.createElement('div');
  splash.id = 'vanitySplash';
  splash.className = 'vanity-splash';
  splash.hidden = true;
  splash.setAttribute('role', 'dialog');
  splash.setAttribute('aria-modal', 'true');
  splash.setAttribute('aria-labelledby', 'vanitySplashTitle');
  splash.innerHTML = `
    <div class="vanity-splash__card">
      <button type="button" class="vanity-splash__close" id="vanitySplashClose" aria-label="Dismiss welcome">×</button>
      <span class="vanity-splash__emoji" aria-hidden="true">✨</span>
      <strong id="vanitySplashTitle">Household CFO mode</strong>
      <p>Your cozy bonus board is ready. Pin a plan and watch the trip math sparkle.</p>
      <button type="button" class="vanity-splash__go" id="vanitySplashGo">Let's go →</button>
      <small class="vanity-splash__hint">tap outside, press Esc, or use the button</small>
    </div>
  `;
  document.body.appendChild(splash);
  return splash;
}

/** Dismiss the one-time Household CFO welcome overlay — safe to call repeatedly. */
export function dismissWelcomeSplash({ persist = true } = {}) {
  const splash = $('#vanitySplash');
  if (!splash || splash.hidden) {
    welcomeDismissed = true;
    document.body.classList.remove('welcome-splash-open');
    if (persist) {
      try { localStorage.setItem(WELCOME_KEY, '1'); } catch { /* noop */ }
    }
    return;
  }
  if (welcomeDismissed || splash.classList.contains('vanity-splash--out')) return;
  welcomeDismissed = true;

  const focused = document.activeElement;
  if (focused && splash.contains(focused)) focused.blur();

  splash.classList.add('vanity-splash--out');
  document.body.classList.remove('welcome-splash-open');

  window.setTimeout(() => {
    splash.hidden = true;
    splash.setAttribute('aria-hidden', 'true');
    splash.classList.remove('vanity-splash--out');
  }, prefersReducedMotion() ? 0 : 400);

  if (persist) {
    try { localStorage.setItem(WELCOME_KEY, '1'); } catch { /* noop */ }
  }
}

function bindWelcomeSplash() {
  if (welcomeBound) return;
  welcomeBound = true;
  const splash = ensureWelcomeSplash();

  splash.addEventListener('click', (e) => {
    if (e.target === splash) dismissWelcomeSplash();
  });
  splash.querySelector('#vanitySplashGo')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissWelcomeSplash();
  });
  splash.querySelector('#vanitySplashClose')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissWelcomeSplash();
  });
  splash.querySelector('.vanity-splash__card')?.addEventListener('click', (e) => e.stopPropagation());

  document.addEventListener('keydown', (e) => {
    const el = $('#vanitySplash');
    if (e.key === 'Escape' && el && !el.hidden) dismissWelcomeSplash();
  });

  // Mobile: touchend on backdrop (click can be flaky inside fixed overlays)
  splash.addEventListener('touchend', (e) => {
    if (e.target === splash) {
      e.preventDefault();
      dismissWelcomeSplash();
    }
  }, { passive: false });
}

function resizeConfetti() {
  if (!confettiCanvas) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

export function initVanity() {
  ensureLayer();
  if (!prefersReducedMotion() && !isAutomated() && !sparklesBound) {
    spawnSparkles();
    sparklesBound = true;
  }
  document.body.classList.add('vanity-on');
  bumpVisitCount();
  welcomeVanitySplash();
  bindVanityClicks();
}

function bumpVisitCount() {
  const key = 'promo_vanity_visits';
  let n = 1;
  try { n = (parseInt(localStorage.getItem(key), 10) || 0) + 1; } catch { /* noop */ }
  localStorage.setItem(key, String(n));
  const el = document.getElementById('vanityVisitCount');
  if (el) el.textContent = `Visit #${n}`;
}

export function welcomeVanitySplash() {
  if (navigator.webdriver) return;
  try {
    if (localStorage.getItem(WELCOME_KEY)) return;
  } catch { /* show anyway if storage blocked */ }

  welcomeDismissed = false;
  bindWelcomeSplash();
  const splash = ensureWelcomeSplash();
  splash.hidden = false;
  splash.removeAttribute('aria-hidden');
  document.body.classList.add('welcome-splash-open');
  burstConfetti({ count: 140 });
  showToast('Welcome to Bonus Board — let\'s plan something delicious.', { type: 'gold', emoji: '🎀', duration: 4500 });

  window.setTimeout(() => {
    const el = $('#vanitySplash');
    if (el && !el.hidden) dismissWelcomeSplash();
  }, 8000);
}

function bindVanityClicks() {
  document.getElementById('addOffer')?.addEventListener('click', (e) => {
    clickRipple(e.clientX, e.clientY, '📌');
  });
}

export function showToast(message, { type = 'info', emoji = '✨', duration = 4200 } = {}) {
  ensureLayer();
  const stack = $('#vanityToasts');
  if (!stack) return;

  const toast = document.createElement('div');
  toast.className = `vanity-toast vanity-toast--${type}`;
  toast.innerHTML = `
    <span class="vanity-toast__emoji">${emoji}</span>
    <span class="vanity-toast__msg">${escapeHtml(message)}</span>
  `;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('vanity-toast--in'));

  const dismiss = () => {
    toast.classList.remove('vanity-toast--in');
    toast.classList.add('vanity-toast--out');
    setTimeout(() => toast.remove(), 400);
  };
  setTimeout(dismiss, duration);
  toast.addEventListener('click', dismiss);
}

function confettiLoop() {
  if (!confettiCtx || !confettiCanvas) return;
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  confettiPieces = confettiPieces.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.18;
    p.rot += p.vr;
    p.life -= 1;

    if (p.life <= 0 || p.y > confettiCanvas.height + 20) return false;

    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rot * Math.PI) / 180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.globalAlpha = Math.min(1, p.life / 40);
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
    return true;
  });

  if (confettiPieces.length) {
    confettiRaf = requestAnimationFrame(confettiLoop);
  } else {
    confettiRaf = null;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

export function burstConfetti({ count = 120, origin } = {}) {
  if (prefersReducedMotion() || isAutomated()) return;
  ensureLayer();
  if (!confettiCtx) return;

  const ox = origin?.x ?? window.innerWidth / 2;
  const oy = origin?.y ?? window.innerHeight * 0.35;
  const colors = ['#e60023', '#d45d7a', '#f4a261', '#1f7a4f', '#ffd6de', '#1174CC', '#fbbf24', '#c026d3'];

  for (let i = 0; i < count; i += 1) {
    confettiPieces.push({
      x: ox + (Math.random() - 0.5) * 80,
      y: oy + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 14,
      vy: -6 - Math.random() * 10,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 5,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 18,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 70 + Math.random() * 50,
    });
  }

  if (!confettiRaf) confettiLoop();
}

export function flashCelebration() {
  if (prefersReducedMotion() || isAutomated()) return;
  document.body.classList.add('vanity-flash');
  setTimeout(() => document.body.classList.remove('vanity-flash'), 600);
}

function showAchievement({ emoji, title, body }) {
  ensureLayer();
  const el = $('#vanityAchievement');
  if (!el) return;
  $('#vanityAchEmoji').textContent = emoji;
  $('#vanityAchTitle').textContent = title;
  $('#vanityAchBody').textContent = body;
  el.hidden = false;
  el.classList.remove('vanity-achievement--pop');
  requestAnimationFrame(() => el.classList.add('vanity-achievement--pop'));
  burstConfetti({ count: 80 });
  setTimeout(() => { el.hidden = true; }, 5500);
}

export function checkMilestones(projection, sim, storageKey = 'promo_vanity_milestones') {
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { /* noop */ }

  MILESTONES.forEach((m) => {
    if (seen.includes(m.id)) return;
    if (!m.test(projection, sim)) return;
    seen.push(m.id);
    showAchievement(m);
    showToast(m.title, { type: 'gold', emoji: m.emoji });
  });

  localStorage.setItem(storageKey, JSON.stringify(seen));
}

export function celebrateOfferDone(offer) {
  const val = offer?.valueUsd ? `~$${Number(offer.valueUsd).toLocaleString()} captured` : 'Bonus marked done';
  showToast(`${offer?.title || 'Offer'} — ${val}`, { type: 'success', emoji: '🎉', duration: 5000 });
  burstConfetti({ count: 160, origin: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.55 } });
  flashCelebration();
}

export function celebratePin(isEdit = false) {
  showToast(isEdit ? 'Offer updated on your board' : 'New offer pinned!', {
    type: 'pin',
    emoji: '📌',
  });
  if (!isEdit) burstConfetti({ count: 60, origin: { x: window.innerWidth * 0.72, y: 120 } });
  const pin = document.querySelector('.topbar__pin');
  if (pin && !prefersReducedMotion()) {
    pin.classList.add('topbar__pin--drop');
    setTimeout(() => pin.classList.remove('topbar__pin--drop'), 700);
  }
}

export function celebratePlanLoad(planName, { replaced = false } = {}) {
  const msg = replaced
    ? `Loaded: ${planName} (previous queue replaced)`
    : `Loaded: ${planName}`;
  showToast(msg, { type: 'gold', emoji: '🗺️', duration: 5000 });
  burstConfetti({ count: 100 });
  flashCelebration();
}

export function celebrateThemeChange(themeLabel) {
  showToast(`Theme: ${themeLabel}`, { type: 'pin', emoji: '🎨', duration: 3200 });
  burstConfetti({ count: 40, origin: { x: 80, y: 60 } });
}

export function clickRipple(x, y, emoji = '✨') {
  if (prefersReducedMotion() || isAutomated()) return;
  ensureLayer();
  const ripple = document.createElement('span');
  ripple.className = 'vanity-ripple';
  ripple.textContent = emoji;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  document.getElementById('vanityLayer')?.appendChild(ripple);
  setTimeout(() => ripple.remove(), 900);
}

function cfoLevelFor(projection) {
  const trip = projection.netTravelPipeline || projection.netPipeline || 0;
  const queued = projection.queued || 0;
  let level = CFO_LEVELS[0];
  CFO_LEVELS.forEach((l) => {
    const val = l.metric === 'trip' ? trip : queued;
    if (val >= l.min) level = l;
  });
  return level;
}

let prevCfoLevel = '';

export function updateCfoLevel(projection) {
  const level = cfoLevelFor(projection);
  const ribbon = document.querySelector('.vanity-ribbon');
  const badge = document.getElementById('vanityCfoBadge');
  const label = `${level.emoji} ${level.title}`;

  if (badge) badge.textContent = label;
  if (ribbon) ribbon.dataset.level = level.title;

  const key = `lvl:${level.title}`;
  if (prevCfoLevel && prevCfoLevel !== key) {
    showLevelUp(level);
  }
  prevCfoLevel = key;
}

function showLevelUp(level) {
  ensureLayer();
  const el = $('#vanityLevelUp');
  if (!el) return;
  el.innerHTML = `<span class="vanity-levelup__burst">${level.emoji}</span><strong>Level up!</strong> ${escapeHtml(level.title)}`;
  el.hidden = false;
  el.classList.remove('vanity-levelup--pop');
  requestAnimationFrame(() => el.classList.add('vanity-levelup--pop'));
  burstConfetti({ count: 70, origin: { x: window.innerWidth * 0.5, y: 140 } });
  setTimeout(() => { el.hidden = true; }, 4000);
}

const creditPrev = {};

export function animateCreditScores() {
  if (prefersReducedMotion()) return;
  document.querySelectorAll('.credit-impact__numbers .num').forEach((el) => {
    const id = el.closest('div')?.querySelector('.label')?.textContent || el.textContent;
    const next = parseInt(el.textContent, 10);
    if (Number.isNaN(next)) return;
    const prev = creditPrev[id];
    creditPrev[id] = next;
    if (prev === undefined || prev === next) return;

    const from = prev;
    const start = performance.now();
    const dur = 880;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const ease = 1 - (1 - t) ** 3;
      el.textContent = String(Math.round(from + (next - from) * ease));
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = String(next);
    };
    requestAnimationFrame(tick);
    el.classList.add('num--pulse');
    setTimeout(() => el.classList.remove('num--pulse'), 700);
  });
}

export function flairCreditPanel(sim) {
  const panel = document.getElementById('dashboardCreditImpact');
  if (!panel) return;
  panel.classList.remove('credit-impact--elite', 'credit-impact--steady');
  if (!sim) return;
  const { endScore, maxDrop } = sim.summary;
  if (endScore >= 800) panel.classList.add('credit-impact--elite');
  else if (maxDrop <= 12) panel.classList.add('credit-impact--steady');
}

const statPrev = {};

function parseStatNumber(text) {
  const n = String(text).replace(/[^0-9.k-]/gi, '');
  if (n.includes('k')) return Math.round(parseFloat(n) * 1000) || 0;
  return parseInt(n.replace(/-/g, ''), 10) || 0;
}

export function animateStats(ids) {
  if (prefersReducedMotion() || isAutomated()) return;

  ids.forEach(({ id, text, pulse }) => {
    const el = document.getElementById(id);
    if (!el) return;

    const prev = statPrev[id];
    const next = text;
    statPrev[id] = next;

    if (prev === undefined || prev === next) {
      el.textContent = next;
      return;
    }

    const from = parseStatNumber(prev);
    const to = parseStatNumber(next);
    if (from === to || Number.isNaN(to)) {
      el.textContent = next;
      return;
    }

    const isMoney = next.includes('$');
    const isNeg = next.startsWith('−') || next.startsWith('-');
    const start = performance.now();
    const dur = 720;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const ease = 1 - (1 - t) ** 3;
      const cur = Math.round(from + (to - from) * ease);
      if (isMoney) {
        el.textContent = `${isNeg && cur < 0 ? '−' : ''}$${Math.abs(cur).toLocaleString()}`;
      } else {
        el.textContent = String(cur);
      }
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = next;
    };
    requestAnimationFrame(tick);

    if (pulse) {
      el.classList.add('stat-pop');
      setTimeout(() => el.classList.remove('stat-pop'), 650);
    }
  });

  const hero = document.querySelector('.stat--hero');
  if (hero && !prefersReducedMotion()) {
    hero.classList.add('stat--hero-shimmer');
    setTimeout(() => hero.classList.remove('stat--hero-shimmer'), 1200);
  }
}

function spawnSparkles() {
  const field = $('#vanitySparkleField');
  if (!field || field.childElementCount > 0) return;

  const emojis = ['✨', '💫', '📌', '🌸', '💳', '✈️', '🏖️', '🛒'];
  for (let i = 0; i < 14; i += 1) {
    const s = document.createElement('span');
    s.className = 'vanity-sparkle';
    s.textContent = emojis[i % emojis.length];
    s.style.setProperty('--sx', `${8 + Math.random() * 84}%`);
    s.style.setProperty('--sy', `${5 + Math.random() * 90}%`);
    s.style.setProperty('--sdelay', `${-Math.random() * 20}s`);
    s.style.setProperty('--sdur', `${14 + Math.random() * 18}s`);
    s.style.setProperty('--ssize', `${0.65 + Math.random() * 0.7}rem`);
    field.appendChild(s);
  }
}

export function tabSwitchSparkle(tabName) {
  if (prefersReducedMotion() || isAutomated()) return;
  const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
  if (tab) {
    tab.classList.add('tab--sparkle');
    setTimeout(() => tab.classList.remove('tab--sparkle'), 500);
    const rect = tab.getBoundingClientRect();
    clickRipple(rect.left + rect.width / 2, rect.top + rect.height / 2, tabName === 'roadmap' ? '🗺️' : '✨');
  }
  if (tabName === 'roadmap') burstConfetti({ count: 35, origin: { x: window.innerWidth * 0.3, y: 90 } });
}

export function showToastWithUndo(message, onUndo) {
  ensureLayer();
  const stack = $('#vanityToasts');
  if (!stack) return;

  const toast = document.createElement('div');
  toast.className = 'vanity-toast vanity-toast--undo';
  toast.innerHTML = `
    <span class="vanity-toast__emoji">↩️</span>
    <span class="vanity-toast__msg">${escapeHtml(message)}</span>
    <button type="button" class="vanity-toast__undo">Undo</button>
  `;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('vanity-toast--in'));

  const dismiss = () => {
    toast.classList.remove('vanity-toast--in');
    toast.classList.add('vanity-toast--out');
    setTimeout(() => toast.remove(), 400);
  };

  toast.querySelector('.vanity-toast__undo')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dismiss();
    onUndo?.();
  });
  setTimeout(dismiss, 6000);
  toast.addEventListener('click', dismiss);
}