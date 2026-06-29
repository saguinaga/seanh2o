/** Timed work-shift mini-game — serve customers */
window.BlossomShift = (function () {
  const TOOLS = {
    wash: { id: 'wash', label: 'Wash', emoji: '🧴' },
    cut: { id: 'cut', label: 'Cut', emoji: '✂️' },
    dry: { id: 'dry', label: 'Dry', emoji: '💨' },
  };

  const NEEDS = ['wash', 'cut', 'dry'];
  let active = false;
  let timer = null;
  let onDone = null;
  let round = 0;
  let score = 0;
  let timeLeft = 0;
  let currentNeed = 'wash';
  let pretend = false;
  let theme = 'salon';

  function $(id) { return document.getElementById(id); }

  function themeCopy() {
    if (theme === 'broadway') {
      return { title: 'Stage rehearsal', want: 'Performance cue', tools: { wash: '🎵 Warm up', cut: '🎭 Act', dry: '🌟 Bow' } };
    }
    if (theme === 'tiktoker') {
      return { title: 'Film shift', want: 'Shot needed', tools: { wash: '💡 Lights', cut: '🎬 Action', dry: '📤 Post' } };
    }
    return { title: 'Salon shift', want: 'Customer wants', tools: { wash: '🧴 Wash', cut: '✂️ Cut', dry: '💨 Dry' } };
  }

  function open(opts) {
    if (active) return;
    active = true;
    pretend = Boolean(opts.pretend);
    theme = opts.theme || 'salon';
    onDone = opts.onDone;
    round = 0;
    score = 0;
    const modal = $('shiftModal');
    if (modal) modal.hidden = false;
    nextRound();
  }

  function close() {
    active = false;
    if (timer) clearInterval(timer);
    timer = null;
    const modal = $('shiftModal');
    if (modal) modal.hidden = true;
  }

  function nextRound() {
    round += 1;
    const total = pretend ? 2 : 3;
    if (round > total) {
      close();
      onDone?.({ score, pretend });
      return;
    }
    currentNeed = NEEDS[Math.floor(Math.random() * NEEDS.length)];
    timeLeft = pretend ? 12 : 15;
    updateUi(total);
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      timeLeft -= 1;
      updateUi(total);
      if (timeLeft <= 0) {
        window.BlossomAudio?.playSfx('warn');
        nextRound();
      }
    }, 1000);
  }

  function updateUi(total) {
    const copy = themeCopy();
    const title = $('shiftTitle');
    const timerEl = $('shiftTimer');
    const customer = $('shiftCustomer');
    const progress = $('shiftProgress');
    if (title) title.textContent = pretend ? `Play — ${copy.title}` : copy.title;
    if (timerEl) timerEl.textContent = `${timeLeft}s · Round ${round}/${total}`;
    if (progress) progress.textContent = `Score: ${score}`;
    const need = TOOLS[currentNeed];
    const toolLabels = copy.tools;
    if (customer) {
      customer.textContent = `${copy.want}: ${toolLabels[currentNeed] || need.emoji + ' ' + need.label}`;
    }
    document.querySelectorAll('[data-shift-tool]').forEach((btn) => {
      const t = btn.dataset.shiftTool;
      btn.textContent = toolLabels[t] || TOOLS[t].emoji + ' ' + TOOLS[t].label;
    });
  }

  function pick(toolId) {
    if (!active) return;
    if (toolId === currentNeed) {
      score += 1;
      window.BlossomAudio?.playSfx('chore');
    } else {
      window.BlossomAudio?.playSfx('warn');
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