/** First-day coaching — how to hit your star goal */
window.BlossomGuide = (function () {
  const STEPS = [
    { id: 'breakfast', label: 'Breakfast', stars: 5, hint: 'Tap the green fridge · pick oatmeal ($1) for +5⭐' },
    { id: 'chores_home', label: 'Home chores', stars: null, hint: 'Walk to glowing objects · E or tap · 5⭐ each' },
    { id: 'explore', label: 'Outdoor chores', stars: null, hint: 'Green exit (right) → yard → street → park' },
    { id: 'lunch', label: 'Lunch', stars: 5, hint: 'Afternoon: fridge at home or café on Main street' },
    { id: 'play', label: 'Play / work (optional)', stars: null, hint: 'Kids: pretend shift at dream job · +2⭐' },
    { id: 'dinner', label: 'Dinner', stars: 5, hint: 'Evening: tap fridge · ice cream is only $2' },
    { id: 'finish', label: 'End day', stars: null, hint: 'Tap End day when the bar is full — you keep going if you miss!' },
  ];

  function starsGoal(state) {
    const cfg = window.BLOSSOM_CONFIG;
    if (state.day <= 1) return cfg.starsPerDayFirst;
    if (state.day <= 2) return cfg.starsPerDaySecond;
    return cfg.starsPerDay;
  }

  function choreTarget(state) {
    if (state.day <= 1) return 4;
    if (state.day <= 2) return 5;
    return Math.min(7, (state.todaysChores || []).length);
  }

  function recipeText(state) {
    const goal = starsGoal(state);
    const meals = 15;
    const chores = choreTarget(state) * cfgStarsPerChore();
    return `Quinn's recipe: 3 meals (${meals}⭐) + ${choreTarget(state)} chores (${chores}⭐) = ${meals + chores}⭐ — you need ${goal}⭐ today!`;
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
      case 'chores_home': return choresDoneCount(state) >= Math.min(3, choreTarget(state));
      case 'explore': {
        const outdoor = ['trash', 'plants_out', 'mailbox', 'groceries', 'litter', 'ducks', 'playground'];
        const list = state.todaysChores || [];
        const done = state.choresDone || {};
        const need = list.filter((id) => outdoor.includes(id));
        if (need.length === 0) return true;
        return need.some((id) => done[id]);
      }
      case 'play': return state.playedToday || state.workedToday;
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
    const lines = [
      { ok: state.mealsEaten?.breakfast, text: `☕ Breakfast (+5)` },
      { ok: choreDone >= choreN, text: `🧹 Chores (${choreDone}/${choreN}) · +5 each` },
      { ok: state.mealsEaten?.lunch, text: `🥪 Lunch (+5)` },
      { ok: state.mealsEaten?.dinner, text: `🍽️ Dinner (+5)` },
      { ok: state.stars >= goal, text: `⭐ ${state.stars}/${goal} stars` },
    ];
    return { goal, lines, choreDone, choreN };
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
    if (phase.id === 'morning' && choresDoneCount(state) < 2) {
      return 'Step 2: Do 2 home chores (bed, dishes, teeth…) · +5⭐ each';
    }
    if (phase.id === 'afternoon' && !state.mealsEaten?.lunch) {
      return 'Step 3: Lunch time — fridge or café (+5⭐)';
    }
    if (choresDoneCount(state) < choreTarget(state)) {
      const left = choreTarget(state) - choresDoneCount(state);
      return `${left} chore${left > 1 ? 's' : ''} left on your list — follow the 📋 panel`;
    }
    return step.hint;
  }

  function shouldShowPanel(state) {
    return state.day <= 3 || state.level <= 2 || !state.guideDismissed;
  }

  function welcomeBody(state) {
    const goal = starsGoal(state);
    const isChild = state.lifeStage === 'child';
    return [
      `Your first goal: ${goal} stars (full 50 unlocks on day 3 — Quinn's rule!).`,
      '',
      'Easy path for day 1 (all at home!):',
      '1. Breakfast — tap fridge, type 1 for oatmeal ($1) → +5⭐',
      '2. Four home chores — walk to glowing objects, press E → +20⭐',
      '3. Lunch & dinner — fridge again → +10⭐',
      `That's ${goal}⭐ total!`,
      '',
      isChild ? 'Bonus: pretend shift at your dream job → +2⭐' : '',
      '',
      'WASD to move · E to interact · green exits on the right = travel outside',
      '',
      'Earn money from chores & shifts → visit Bloom Boutique on Main street for hoodies, boots, shades & more!',
      '',
      'Take your time. Tap End day when ready. Miss the goal? You bloom again tomorrow!',
    ].filter(Boolean).join('\n');
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
    const goalEl = document.getElementById('guideGoal');
    const listEl = document.getElementById('guideChecklist');
    const tipEl = document.getElementById('guideTip');
    if (goalEl) goalEl.textContent = `${state.stars}/${goal} ⭐`;
    if (listEl) {
      listEl.innerHTML = lines.map((l) =>
        `<li class="guide-check ${l.ok ? 'guide-check--done' : ''}">${l.ok ? '✓' : '○'} ${l.text}</li>`
      ).join('');
    }
    if (tipEl) tipEl.textContent = nextStep(state).hint;
    const bar = document.getElementById('guideProgressBar');
    if (bar) bar.style.width = `${Math.min(100, (state.stars / goal) * 100)}%`;
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
    welcomeBody,
    updatePanel,
  };
})();