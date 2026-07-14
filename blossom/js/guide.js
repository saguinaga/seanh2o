/** First-day coaching — Last War-style quest chip + popup task list */
window.BlossomGuide = (function () {
  const STEPS = [
    { id: 'breakfast', label: 'Breakfast', stars: 5, hint: 'Tap the fridge · pick breakfast (+5⭐)' },
    { id: 'bloom', label: '3 Bloom Tasks', stars: null, hint: '🏠 home · 🌊 world · 💼 career — glowing spots · E or tap' },
    { id: 'lunch', label: 'Lunch', stars: 5, hint: 'Afternoon: fridge or Main St restaurants (+5⭐)' },
    { id: 'explore', label: 'Explore HB', stars: null, hint: 'Walk the loop — passport stamps at zones & landmarks' },
    { id: 'dinner', label: 'Dinner', stars: 5, hint: 'Evening: tap fridge · pick dinner (+5⭐)' },
    { id: 'finish', label: 'End day', stars: null, hint: 'Tap End day when stars hit the goal — streak builds on wins!' },
  ];

  function starsGoal(state) {
    const cfg = window.BLOSSOM_CONFIG;
    if (state.day <= 1) return cfg.starsPerDayFirst;
    if (state.day <= 2) return cfg.starsPerDaySecond;
    return cfg.starsPerDay;
  }

  function choreTarget(state) {
    return Math.min(3, (state.todaysChores || []).length) || 3;
  }

  function recipeText(state) {
    const goal = starsGoal(state);
    const meals = 15;
    const chores = choreTarget(state) * cfgStarsPerChore();
    return `Quinn's recipe: 3 meals (${meals}⭐) + 3 bloom tasks (${chores}⭐) = ${meals + chores}⭐ — need ${goal}⭐ today!`;
  }

  function cfgStarsPerChore() {
    return window.BLOSSOM_CONFIG.starsPerChore;
  }

  function choresDoneCount(state) {
    const list = state.todaysChores || [];
    const done = state.choresDone || {};
    return list.filter((id) => done[id]).length;
  }

  function stepDone(state, stepId) {
    switch (stepId) {
      case 'breakfast': return state.mealsEaten?.breakfast;
      case 'lunch': return state.mealsEaten?.lunch;
      case 'dinner': return state.mealsEaten?.dinner;
      case 'bloom': return choresDoneCount(state) >= choreTarget(state);
      case 'explore': {
        const stamps = window.BlossomPassport?.count?.(state);
        return (stamps?.pages || 0) >= 1;
      }
      case 'finish': return state.stars >= starsGoal(state);
      default: return false;
    }
  }

  function nextStep(state) {
    for (const s of STEPS) {
      if (!stepDone(state, s.id)) return s;
    }
    return STEPS[STEPS.length - 1];
  }

  function buildChecklist(state) {
    const goal = starsGoal(state);
    const choreN = choreTarget(state);
    const choreDone = choresDoneCount(state);
    const tasks = window.BlossomNavigate?.buildNavigableTasks?.(state) || [];
    const lines = tasks.map((t) => {
      const ok = BlossomNavigate?.taskIsDone?.(state, t.id) || false;
      const starsTxt = t.stars ? ` (+${t.stars})` : '';
      const locTxt = t.type === 'chore' && t.locationName ? ` · ${t.locationName}` : '';
      return {
        id: t.id,
        ok,
        navigable: t.type !== 'meta' && !ok,
        text: `${t.emoji || '○'} ${t.label}${starsTxt}${locTxt}`,
        hint: t.hint,
      };
    });
    if (!lines.some((l) => l.id === 'stars')) {
      lines.push({
        id: 'stars',
        ok: state.stars >= goal,
        navigable: false,
        text: `⭐ ${state.stars}/${goal} stars`,
      });
    }
    return { goal, lines, choreDone, choreN, tasks };
  }

  function phaseHint(state) {
    const step = nextStep(state);
    const goal = starsGoal(state);
    if (state.stars >= goal) {
      return `You hit ${goal} stars! Tap End day when you're ready 🌸`;
    }
    const phase = BlossomDay.currentPhase(state);
    if (phase.id === 'morning' && !state.mealsEaten?.breakfast) {
      return 'Step 1: Tap the fridge for breakfast (+5⭐)';
    }
    if (phase.id === 'morning' && choresDoneCount(state) < 1) {
      return 'Step 2: First bloom task — tap 📋 · GO → auto-walks (+5⭐)';
    }
    if (phase.id === 'afternoon' && !state.mealsEaten?.lunch) {
      return 'Step 3: Lunch time — fridge or Main St spot (+5⭐)';
    }
    if (choresDoneCount(state) < choreTarget(state)) {
      const left = choreTarget(state) - choresDoneCount(state);
      return `${left} bloom task${left > 1 ? 's' : ''} left — tap 📋 · GO →`;
    }
    return step.hint;
  }

  function shouldShowPanel(state) {
    if (state.guideDismissed) return false;
    return state.day <= 2 || state.level <= 2;
  }

  function isMobileGuide() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  let guideListBound = false;

  function setExpanded(val) {
    window.BlossomGame?.setGuideExpanded?.(val);
    window.BlossomApp?.setGuideExpanded?.(val);
  }

  function refocusGame() {
    document.getElementById('gameCanvas')?.focus?.({ preventScroll: true });
  }

  function showModalDom() {
    const modal = document.getElementById('guideModal');
    if (!modal) return;
    modal.removeAttribute('inert');
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
  }

  function forceCloseModal() {
    const modal = document.getElementById('guideModal');
    if (!modal) return;
    refocusGame();
    const active = document.activeElement;
    if (active && modal.contains(active)) active.blur();
    refocusGame();
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');
  }

  function openModal(state) {
    if (!state || !shouldShowPanel(state)) return state;
    state.guideExpanded = true;
    setExpanded(true);
    updatePanel(state);
    showModalDom();
    window.BlossomAudio?.playSfx?.('ui');
    return state;
  }

  function closeModal(state) {
    if (state) state.guideExpanded = false;
    setExpanded(false);
    forceCloseModal();
    return state;
  }

  function goTaskAndClose(taskId) {
    setExpanded(false);
    forceCloseModal();
    window.BlossomGame?.goToTask?.(taskId);
    requestAnimationFrame(() => forceCloseModal());
  }

  function isModalOpen() {
    const modal = document.getElementById('guideModal');
    return modal && !modal.hidden;
  }

  function bindGuideList() {
    const listEl = document.getElementById('guideChecklist');
    if (!listEl || guideListBound) return;
    guideListBound = true;
    listEl.addEventListener('click', (e) => {
      const row = e.target.closest('li.guide-check--go');
      if (!row?.dataset.taskId) return;
      e.preventDefault();
      e.stopPropagation();
      row.querySelector('button.guide-check__go')?.blur();
      goTaskAndClose(row.dataset.taskId);
    });
  }

  function renderChecklistHtml(lines) {
    return lines.map((l) => {
      const cls = [
        'guide-check',
        l.ok ? 'guide-check--done' : '',
        l.navigable ? 'guide-check--go' : '',
      ].filter(Boolean).join(' ');
      const label = `${l.ok ? '✓' : '○'} ${l.text}`;
      const goBtn = l.navigable
        ? `<button type="button" class="guide-check__go" data-task-id="${l.id}">GO →</button>`
        : '';
      return `<li class="${cls}" data-task-id="${l.id}" tabindex="-1"><span class="guide-check__text">${label}</span>${goBtn}</li>`;
    }).join('');
  }

  function updatePanel(state) {
    bindGuideList();
    const chip = document.getElementById('questChip');
    const show = shouldShowPanel(state);
    if (chip) {
      chip.hidden = !show;
      chip.classList.toggle('quest-chip--pulse', show && (state.day || 1) <= 2 && state.stars < starsGoal(state));
    }
    if (!show) {
      forceCloseModal();
      return;
    }

    const { goal, lines } = buildChecklist(state);
    const step = nextStep(state);
    const locName = BlossomWorld.getLocation(state.currentLocation || 'house')?.name || 'Surf City';
    const goalTxt = `${state.stars}/${goal} ⭐ · ${locName}`;
    const pct = `${Math.min(100, (state.stars / goal) * 100)}%`;

    const goalEl = document.getElementById('guideGoal');
    const listEl = document.getElementById('guideChecklist');
    const tipEl = document.getElementById('guideTip');
    const bar = document.getElementById('guideProgressBar');
    const chipGoal = document.getElementById('questChipGoal');
    const chipNext = document.getElementById('questChipNext');
    const chipBar = document.getElementById('questChipBar');

    if (goalEl) goalEl.textContent = goalTxt;
    if (chipGoal) chipGoal.textContent = `${state.stars}/${goal} ⭐`;
    if (bar) bar.style.width = pct;
    if (chipBar) chipBar.style.width = pct;

    const nextNav = lines.find((l) => l.navigable);
    const nextLabel = nextNav
      ? nextNav.text.replace(/^.\s/, '')
      : step.hint;
    if (chipNext) {
      chipNext.textContent = nextNav ? `Next: ${nextLabel.slice(0, 36)}` : step.hint.slice(0, 40);
    }

    if (listEl) listEl.innerHTML = renderChecklistHtml(lines);

    const tipText = nextNav
      ? `Next: ${nextNav.text.replace(/^.\s/, '')} — tap GO → to auto-walk`
      : step.hint;
    if (tipEl) tipEl.textContent = tipText;

    if (!state.guideExpanded) forceCloseModal();
  }

  function togglePanel(state) {
    if (!state) return state;
    return isModalOpen() ? closeModal(state) : openModal(state);
  }

  return {
    STEPS,
    starsGoal,
    choreTarget,
    recipeText,
    nextStep,
    buildChecklist,
    phaseHint,
    shouldShowPanel,
    updatePanel,
    openModal,
    closeModal,
    isModalOpen,
    togglePanel,
    isMobileGuide,
  };
})();