/** First-day coaching — how to hit your star goal */
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
      return 'Step 2: First bloom task — check 📋 or glowing spot · +5⭐';
    }
    if (phase.id === 'afternoon' && !state.mealsEaten?.lunch) {
      return 'Step 3: Lunch time — fridge or Main St spot (+5⭐)';
    }
    if (choresDoneCount(state) < choreTarget(state)) {
      const left = choreTarget(state) - choresDoneCount(state);
      return `${left} bloom task${left > 1 ? 's' : ''} left — follow 📋 or explore between tasks`;
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

  function setGuideExpanded(expanded) {
    const panel = document.getElementById('starGuide');
    const toggle = document.getElementById('guideToggle');
    if (!panel) return;
    if (!isMobileGuide()) {
      panel.classList.remove('star-guide--collapsed');
      panel.classList.add('star-guide--expanded');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      return;
    }
    panel.classList.toggle('star-guide--collapsed', !expanded);
    panel.classList.toggle('star-guide--expanded', expanded);
    if (toggle) toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  function updatePanel(state) {
    const panel = document.getElementById('starGuide');
    if (!panel) return;
    if (!shouldShowPanel(state)) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    const { goal, lines } = buildChecklist(state);
    const step = nextStep(state);
    const goalEl = document.getElementById('guideGoal');
    const listEl = document.getElementById('guideChecklist');
    const tipEl = document.getElementById('guideTip');
    const peekEl = document.getElementById('guidePeek');
    if (goalEl) goalEl.textContent = `${state.stars}/${goal} ⭐`;
    if (listEl) {
      listEl.innerHTML = lines.map((l) => {
        const cls = [
          'guide-check',
          l.ok ? 'guide-check--done' : '',
          l.navigable ? 'guide-check--go' : '',
        ].filter(Boolean).join(' ');
        const goBtn = l.navigable
          ? `<span class="guide-check__go" aria-hidden="true">GO →</span>`
          : '';
        return `<li class="${cls}" data-task-id="${l.id}" role="${l.navigable ? 'button' : 'listitem'}" tabindex="${l.navigable ? '0' : '-1'}">${l.ok ? '✓' : '○'} ${l.text}${goBtn}</li>`;
      }).join('');
      listEl.querySelectorAll('.guide-check--go').forEach((el) => {
        el.onclick = (e) => {
          e.stopPropagation();
          const id = el.dataset.taskId;
          if (id) window.BlossomGame?.goToTask?.(id);
        };
        el.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            el.click();
          }
        };
      });
    }
    const nextNav = lines.find((l) => l.navigable);
    const tipText = nextNav
      ? `Tap "${nextNav.text.replace(/^.\s/, '')}" to go there →`
      : step.hint;
    if (tipEl) tipEl.textContent = tipText;
    if (peekEl) peekEl.textContent = tipText;
    const bar = document.getElementById('guideProgressBar');
    if (bar) bar.style.width = `${Math.min(100, (state.stars / goal) * 100)}%`;
    const expanded = isMobileGuide() ? Boolean(state.guideExpanded) : true;
    setGuideExpanded(expanded);
  }

  function togglePanel(state) {
    if (!state || !isMobileGuide()) return state;
    state.guideExpanded = !state.guideExpanded;
    setGuideExpanded(state.guideExpanded);
    return state;
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
    togglePanel,
    setGuideExpanded,
    isMobileGuide,
  };
})();