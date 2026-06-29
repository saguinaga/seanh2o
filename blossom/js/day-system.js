/** Time-of-day, meals, chores, star goals, day evaluation */
window.BlossomDay = (function () {
  const PHASES = [
    { id: 'morning', label: 'Morning', hint: 'Time for breakfast! Head to the fridge.', meal: 'breakfast' },
    { id: 'afternoon', label: 'Afternoon', hint: 'Lunch time! Don\'t forget to eat.', meal: 'lunch' },
    { id: 'evening', label: 'Evening', hint: 'Sunset dinner — 5 stars if you eat.', meal: 'dinner' },
    { id: 'night', label: 'Night', hint: 'Finish chores and hit 50 stars!', meal: null },
  ];

  const CHORES = [
    { id: 'dishes', label: 'Wash dishes', x: 520, y: 200, w: 80, h: 60 },
    { id: 'bed', label: 'Make bed', x: 120, y: 140, w: 100, h: 70 },
    { id: 'trash', label: 'Take out trash', x: 680, y: 280, w: 70, h: 50 },
    { id: 'sweep', label: 'Sweep floor', x: 300, y: 380, w: 120, h: 50 },
    { id: 'homework', label: 'Do homework', x: 200, y: 240, w: 80, h: 60 },
    { id: 'teeth', label: 'Brush teeth', x: 600, y: 140, w: 60, h: 50 },
    { id: 'plants', label: 'Water plants', x: 50, y: 300, w: 60, h: 50 },
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

  const FRIDGE = { x: 720, y: 180, w: 70, h: 90 };

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

  function doChore(state, choreId) {
    if (state.choresDone[choreId]) return { ok: false, msg: 'Already done today!' };
    const chore = CHORES.find((c) => c.id === choreId);
    if (!chore) return { ok: false, msg: 'Unknown chore' };
    state.choresDone[choreId] = true;
    const gain = addStars(state, window.BLOSSOM_CONFIG.starsPerChore, chore.label);
    return { ok: true, msg: `${chore.label} done! (+${gain.stars} stars)` };
  }

  function evaluateDay(state) {
    const cfg = window.BLOSSOM_CONFIG;
    const total = state.stars;
    if (total < cfg.starsPerDay) {
      return {
        success: false,
        title: 'Tough day — but you can bloom again!',
        body: `You got ${total}/${cfg.starsPerDay} stars. Eat meals, do chores, and try again tomorrow.`,
        revive: true,
      };
    }
    let levelGain = 1;
    if (total >= cfg.starsSkipLevel) levelGain = 2;
    state.level += levelGain;
    state.money += cfg.dailyBonusMoney;
    state.bonusStars += cfg.dailyBonusStars;
    const houseUnlock = state.level >= 50 && state.house === 'small';
    if (houseUnlock) state.houseUpgradeAvailable = true;
    return {
      success: true,
      title: 'You bloomed today!',
      body: `+${cfg.dailyBonusMoney} money, level up${levelGain > 1 ? ' (bonus skip!)' : ''}!`,
      levelGain,
      houseUnlock,
    };
  }

  function startNewDay(state) {
    state.day += 1;
    state.stars = 0;
    state.fatItemsToday = 0;
    state.chubby = state.chubby && state.fatItemsToday === 0 ? state.chubby : state.chubby;
    state.mealsEaten = { breakfast: false, lunch: false, dinner: false };
    state.choresDone = {};
    state.dayPhaseIndex = 0;
    state.timeOfDay = 'morning';
    state.alive = true;
  }

  function resetAfterFail(state) {
    state.stars = 0;
    state.mealsEaten = { breakfast: false, lunch: false, dinner: false };
    state.choresDone = {};
    state.dayPhaseIndex = 0;
    state.timeOfDay = 'morning';
    state.alive = true;
    state.money = Math.max(5, state.money - 2);
  }

  return {
    PHASES,
    CHORES,
    FOODS,
    FRIDGE,
    currentPhase,
    advancePhase,
    eatMeal,
    doChore,
    evaluateDay,
    startNewDay,
    resetAfterFail,
  };
})();