/** Time-of-day, meals, chores, star goals, day evaluation */
window.BlossomDay = (function () {
  const PHASES = [
    { id: 'morning', label: 'Morning', hint: 'Step 1: Tap fridge for breakfast (+5⭐), then home chores!', meal: 'breakfast' },
    { id: 'afternoon', label: 'Afternoon', hint: 'Lunch, then work shift or play at your dream job!', meal: 'lunch' },
    { id: 'evening', label: 'Evening', hint: 'Dinner at home — finish chores & your work shift if you haven\'t.', meal: 'dinner' },
    { id: 'night', label: 'Night', hint: 'Almost there — finish chores & tap End day when ready!', meal: null },
  ];

  const OUTDOOR_CHORES = ['trash', 'plants_out', 'mailbox', 'groceries', 'litter', 'ducks', 'playground'];
  const HOME_CHORES = ['bed', 'dishes', 'homework', 'teeth', 'sweep', 'plants'];
  const BLOOM_PER_DAY = 3;
  const CAREER_CHORES = {
    salon: ['litter', 'groceries', 'mailbox'],
    broadway: ['litter', 'playground', 'ducks'],
    tiktoker: ['plants_out', 'mailbox', 'litter'],
    coach: ['groceries', 'ducks', 'mailbox'],
    trainer: ['playground', 'ducks', 'trash'],
  };

  const CHORES = [
    { id: 'bed', label: 'Make bed' },
    { id: 'dishes', label: 'Wash dishes' },
    { id: 'homework', label: 'Do homework' },
    { id: 'teeth', label: 'Brush teeth' },
    { id: 'sweep', label: 'Sweep floor' },
    { id: 'plants', label: 'Water plants' },
    { id: 'trash', label: 'Take out trash' },
    { id: 'plants_out', label: 'Water garden' },
    { id: 'mailbox', label: 'Check mail' },
    { id: 'groceries', label: BlossomHBLocal?.CHORES?.groceries || 'Grocery run on Main' },
    { id: 'litter', label: BlossomHBLocal?.CHORES?.litter || 'Pick up litter on Main' },
    { id: 'ducks', label: BlossomHBLocal?.CHORES?.ducks || 'Feed shorebirds by the pier' },
    { id: 'playground', label: BlossomHBLocal?.CHORES?.playground || 'Tidy beach volleyball courts' },
  ];

  const FOODS = {
    breakfast: [
      { name: 'Oatmeal', type: 'Healthy', price: 1, fat: false },
      { name: 'Pancakes', type: 'Yummy', price: 2, fat: false },
      { name: 'Donuts', type: 'Dessert', price: 3, fat: true },
    ],
    lunch: [
      { name: 'Sandwich', type: 'Healthy', price: 2, fat: false },
      { name: 'Pizza slice', type: 'Fat', price: 3, fat: true },
      { name: 'Salad', type: 'Healthy', price: 2, fat: false },
    ],
    dinner: [
      { name: 'Chicken & rice', type: 'Healthy', price: 3, fat: false },
      { name: 'Burgers', type: 'Fat', price: 4, fat: true },
      { name: 'Ice cream', type: 'Dessert', price: 2, fat: true },
    ],
  };

  function currentPhase(state) {
    return PHASES[state.dayPhaseIndex] || PHASES[0];
  }

  function advancePhase(state) {
    if (state.dayPhaseIndex < PHASES.length - 1) {
      state.dayPhaseIndex += 1;
      state.timeOfDay = PHASES[state.dayPhaseIndex].id;
      return currentPhase(state);
    }
    return null;
  }

  function addStars(state, n, reason) {
    state.stars += n;
    return { stars: n, reason };
  }

  function eatMeal(state, food, mealKey) {
    if (state.mealsEaten[mealKey]) return { ok: false, msg: 'You already ate that meal!' };
    if (state.money < food.price) return { ok: false, msg: 'Not enough money!' };
    state.money -= food.price;
    state.mealsEaten[mealKey] = true;
    if (food.fat) state.fatItemsToday += 1;
    if (state.fatItemsToday >= 5) state.chubby = true;
    const gain = addStars(state, window.BLOSSOM_CONFIG.starsPerMeal, food.name);
    return { ok: true, msg: `Yum! ${food.name} (+${gain.stars} stars)`, food };
  }

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function assignDailyChores(state) {
    const day = state.day || 1;
    let home;
    let world;
    let career;

    if (day <= 1) {
      const picks = shuffle(HOME_CHORES).slice(0, BLOOM_PER_DAY);
      state.todaysChores = picks;
      state.bloomSlots = { home: picks[0], world: picks[1], career: picks[2] };
      return;
    }

    home = shuffle(HOME_CHORES)[0];
    world = shuffle(OUTDOOR_CHORES)[0];
    const pool = CAREER_CHORES[state.careerPath] || CAREER_CHORES.salon;
    career = shuffle(pool)[0];

    const used = new Set([home]);
    if (used.has(world)) world = shuffle(OUTDOOR_CHORES).find((id) => !used.has(id)) || world;
    used.add(world);
    if (used.has(career)) {
      career = shuffle([...pool, ...OUTDOOR_CHORES]).find((id) => !used.has(id)) || career;
    }

    state.bloomSlots = { home, world, career };
    state.todaysChores = [home, world, career];
  }

  function starsGoal(state) {
    return window.BlossomGuide?.starsGoal(state) ?? window.BLOSSOM_CONFIG.starsPerDay;
  }

  function isChoreToday(state, choreId) {
    return state.todaysChores?.includes(choreId);
  }

  function doChore(state, choreId) {
    if (!isChoreToday(state, choreId)) {
      return { ok: false, msg: 'That chore isn\'t on your list today — check another spot!' };
    }
    if (state.choresDone[choreId]) return { ok: false, msg: 'Already done today!' };
    const chore = CHORES.find((c) => c.id === choreId);
    if (!chore) return { ok: false, msg: 'Unknown chore' };
    state.choresDone[choreId] = true;
    let bonus = window.BlossomToday?.onChoreDone?.(state, choreId) || 0;
    const gain = addStars(state, window.BLOSSOM_CONFIG.starsPerChore + bonus, chore.label);
    return { ok: true, msg: `${chore.label} done! (+${gain.stars} stars${bonus ? ' · event bonus!' : ''})` };
  }

  function evaluateDay(state) {
    const cfg = window.BLOSSOM_CONFIG;
    const total = state.stars;
    const adultCheck = window.BlossomCareer?.adultDayRequirements(state);
    if (adultCheck && !adultCheck.ok) {
      return {
        success: false,
        title: 'Bills and work caught up with you',
        body: adultCheck.msg,
        revive: true,
      };
    }
    const goal = starsGoal(state);
    if (total < goal) {
      const tip = window.BlossomGuide?.nextStep(state)?.hint || 'Eat 3 meals and finish 3 bloom tasks.';
      return {
        success: false,
        title: 'Tough day — but you can bloom again!',
        body: `You got ${total}/${goal} stars today. Try: ${tip}`,
        revive: true,
      };
    }
    if (state.money < 0) {
      return {
        success: false,
        title: 'You\'re broke!',
        body: BlossomCareer.QUINN.broke,
        revive: true,
      };
    }
    let levelGain = 1;
    if (total >= cfg.starsSkipLevel) levelGain = 2;
    state.level += levelGain;
    state.money += cfg.dailyBonusMoney;
    state.bonusStars += cfg.dailyBonusStars;
    state.bloomStreak = (state.bloomStreak || 0) + 1;
    const eventBonus = window.BlossomToday?.onDayClear?.(state);
    if (eventBonus?.money) state.money += eventBonus.money;
    window.BlossomPassport?.stampDay?.(state);
    const houseUnlock = state.level >= 50 && state.house === 'small';
    if (houseUnlock) state.houseUpgradeAvailable = true;
    const streak = state.bloomStreak || 1;
    const extra = eventBonus?.money ? ` Event bonus +$${eventBonus.money}!` : '';
    return {
      success: true,
      title: 'You bloomed today!',
      body: `+${cfg.dailyBonusMoney} money, level up${levelGain > 1 ? ' (bonus skip!)' : ''}! 🔥 ${streak}-day streak.${extra}`,
      levelGain,
      houseUnlock,
      streak,
    };
  }

  function startNewDay(state) {
    state.day += 1;
    window.BlossomCareer?.resetDailyCareer(state);
    const bills = window.BlossomCareer?.applyMorningBills(state);
    window.BlossomToday?.assign?.(state);
    state.stars = 0;
    state.fatItemsToday = 0;
    state.chubby = state.chubby && state.fatItemsToday === 0 ? state.chubby : state.chubby;
    state.mealsEaten = { breakfast: false, lunch: false, dinner: false };
    state.choresDone = {};
    state.dayPhaseIndex = 0;
    state.timeOfDay = 'morning';
    state.alive = true;
    state.currentLocation = 'house';
    assignDailyChores(state);
    return bills;
  }

  function resetAfterFail(state) {
    state.bloomStreak = 0;
    window.BlossomCareer?.resetDailyCareer(state);
    state.stars = 0;
    state.mealsEaten = { breakfast: false, lunch: false, dinner: false };
    state.choresDone = {};
    state.dayPhaseIndex = 0;
    state.timeOfDay = 'morning';
    state.alive = true;
    state.money = Math.max(5, state.money - 2);
    state.currentLocation = 'house';
    assignDailyChores(state);
  }

  return {
    PHASES,
    CHORES,
    FOODS,
    currentPhase,
    advancePhase,
    eatMeal,
    doChore,
    assignDailyChores,
    isChoreToday,
    evaluateDay,
    starsGoal,
    startNewDay,
    resetAfterFail,
  };
})();