/** Timed work-shift mini-game — combos, juice, urgency */
window.BlossomShift = (function () {
  const TOOLS = {
    wash: { id: 'wash', label: 'Wash', emoji: '🧴' },
    cut: { id: 'cut', label: 'Cut', emoji: '✂️' },
    dry: { id: 'dry', label: 'Dry', emoji: '💨' },
  };

  const CUSTOMERS = ['😊', '🥰', '😎', '🤩', '👧', '👦', '🧑‍🦱', '👩'];
  const NEEDS = ['wash', 'cut', 'dry'];
  let active = false;
  let timer = null;
  let onDone = null;
  let round = 0;
  let score = 0;
  let combo = 0;
  let timeLeft = 0;
  let currentNeed = 'wash';
  let pretend = false;
  let theme = 'salon';
  let beatPos = 0;
  let beatDir = 1;
  let beatTimer = null;

  function $(id) { return document.getElementById(id); }

  function themeCopy() {
    if (theme === 'broadway') {
      return { title: 'Stage rehearsal', want: 'Cue', tools: { wash: '🎵 Warm up', cut: '🎭 Act', dry: '🌟 Bow' } };
    }
    if (theme === 'tiktoker') {
      return { title: 'Film shift', want: 'Shot', tools: { wash: '💡 Lights', cut: '🎬 Action', dry: '📤 Post' } };
    }
    if (theme === 'coach') {
      return { title: 'Coaching session', want: 'Step', tools: { wash: '👂 Listen', cut: '🎯 Goal', dry: '🌱 Encourage' } };
    }
    if (theme === 'trainer') {
      return { title: 'Training shift', want: 'Set', tools: { wash: '🏃 Warm-up', cut: '💪 Rep', dry: '🧘 Cool-down' } };
    }
    return { title: 'Salon shift', want: 'Wants', tools: { wash: '🧴 Wash', cut: '✂️ Cut', dry: '💨 Dry' } };
  }

  function open(opts) {
    if (active) return;
    active = true;
    pretend = Boolean(opts.pretend);
    theme = opts.theme || 'salon';
    onDone = opts.onDone;
    round = 0;
    score = 0;
    combo = 0;
    const modal = $('shiftModal');
    const card = modal?.querySelector('.shift-card');
    if (modal) {
      modal.hidden = false;
      card?.classList.add('shift-card--open');
    }
    document.body.classList.add('shift-active');
    window.BlossomAudio?.playSfx('shiftStart');
    nextRound();
  }

  function close() {
    active = false;
    if (timer) clearInterval(timer);
    if (beatTimer) clearInterval(beatTimer);
    timer = null;
    beatTimer = null;
    const modal = $('shiftModal');
    const card = modal?.querySelector('.shift-card');
    card?.classList.remove('shift-card--open', 'shift-card--urgent', 'shift-card--perfect');
    if (modal) modal.hidden = true;
    document.body.classList.remove('shift-active');
  }

  function flashCard(cls) {
    const card = $('shiftModal')?.querySelector('.shift-card');
    if (!card) return;
    card.classList.remove('shift-card--perfect', 'shift-card--miss');
    card.classList.add(cls);
    setTimeout(() => card.classList.remove(cls), 400);
  }

  function nextRound() {
    round += 1;
    const total = pretend ? 2 : 3;
    if (round > total) {
      const perfect = score >= total;
      if (perfect) {
        window.BlossomAudio?.playSfx('shiftPerfect');
        $('shiftModal')?.querySelector('.shift-card')?.classList.add('shift-card--perfect');
      }
      setTimeout(() => {
        close();
        onDone?.({ score, pretend, perfect });
      }, perfect ? 500 : 80);
      return;
    }
    currentNeed = NEEDS[Math.floor(Math.random() * NEEDS.length)];
    timeLeft = pretend ? 12 : 15;
    beatPos = Math.random() * 60 + 20;
    beatDir = 1;
    updateUi(total);
    updateBeatBar();
    if (beatTimer) clearInterval(beatTimer);
    beatTimer = setInterval(() => {
      beatPos += beatDir * (pretend ? 2.8 : 3.6);
      if (beatPos >= 96) { beatPos = 96; beatDir = -1; }
      if (beatPos <= 4) { beatPos = 4; beatDir = 1; }
      updateBeatBar();
    }, 40);
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      timeLeft -= 1;
      updateUi(total);
      const card = $('shiftModal')?.querySelector('.shift-card');
      if (timeLeft <= 5) card?.classList.add('shift-card--urgent');
      else card?.classList.remove('shift-card--urgent');
      if (timeLeft <= 0) {
        combo = 0;
        window.BlossomAudio?.playSfx('warn');
        flashCard('shift-card--miss');
        nextRound();
      }
    }, 1000);
  }

  function updateBeatBar() {
    const marker = $('shiftBeatMarker');
    const bar = $('shiftBeatBar');
    if (marker) marker.style.left = `${beatPos}%`;
    if (bar) {
      const inZone = beatPos >= 42 && beatPos <= 58;
      bar.classList.toggle('shift-beat--hot', inZone);
    }
  }

  function timingBonus() {
    return beatPos >= 40 && beatPos <= 60;
  }

  function updateUi(total) {
    const copy = themeCopy();
    const title = $('shiftTitle');
    const timerEl = $('shiftTimer');
    const customer = $('shiftCustomer');
    const progress = $('shiftProgress');
    const avatar = $('shiftCustomerAvatar');
    const comboEl = $('shiftCombo');
    if (title) title.textContent = pretend ? `✨ Play — ${copy.title}` : `✨ ${copy.title}`;
    if (timerEl) {
      timerEl.textContent = `${timeLeft}s · Round ${round}/${total}`;
      timerEl.style.color = timeLeft <= 5 ? '#fb7185' : '#a5f3fc';
    }
    if (progress) progress.textContent = `Score ${score}/${total}`;
    if (comboEl) {
      comboEl.textContent = combo > 1 ? `🔥 ${combo}x COMBO!` : '';
      comboEl.hidden = combo <= 1;
    }
    const toolLabels = copy.tools;
    if (customer) {
      customer.textContent = `${copy.want}: ${toolLabels[currentNeed]}`;
    }
    if (avatar) avatar.textContent = CUSTOMERS[(round + score) % CUSTOMERS.length];
    document.querySelectorAll('[data-shift-tool]').forEach((btn) => {
      const t = btn.dataset.shiftTool;
      btn.textContent = toolLabels[t] || TOOLS[t].emoji + ' ' + TOOLS[t].label;
      btn.classList.toggle('shift-tool-btn--hint', t === currentNeed && timeLeft <= 8);
    });
  }

  function pick(toolId) {
    if (!active) return;
    const btn = document.querySelector(`[data-shift-tool="${toolId}"]`);
    const onBeat = timingBonus();
    const hint = $('shiftBeatHint');
    if (toolId === currentNeed) {
      if (!onBeat) {
        combo = 0;
        timeLeft = Math.max(1, timeLeft - 2);
        window.BlossomAudio?.playSfx('warn');
        flashCard('shift-card--miss');
        if (hint) hint.textContent = 'Hit the green zone for a perfect!';
        return;
      }
      score += 1;
      combo += 1;
      window.BlossomAudio?.playSfx(combo > 2 ? 'combo' : 'chore');
      flashCard('shift-card--perfect');
      btn?.classList.add('shift-tool-btn--hit');
      setTimeout(() => btn?.classList.remove('shift-tool-btn--hit'), 300);
      if (combo >= 3) window.BlossomAudio?.playSfx('combo');
      if (hint) hint.textContent = 'Perfect timing!';
    } else {
      combo = 0;
      window.BlossomAudio?.playSfx('warn');
      flashCard('shift-card--miss');
      btn?.classList.add('shift-tool-btn--miss');
      setTimeout(() => btn?.classList.remove('shift-tool-btn--miss'), 300);
      if (hint) hint.textContent = 'Wrong tool — try again!';
      return;
    }
    nextRound();
  }

  function init() {
    document.querySelectorAll('[data-shift-tool]').forEach((btn) => {
      btn.addEventListener('click', () => pick(btn.dataset.shiftTool));
    });
    $('shiftClose')?.addEventListener('click', () => {
      close();
      onDone?.({ score, pretend, cancelled: true });
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { open, close, isActive: () => active };
})();