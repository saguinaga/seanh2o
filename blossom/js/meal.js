/** Fun food picker — big tap cards, no typing */
window.BlossomMeal = (function () {
  const MEAL_COPY = {
    breakfast: { title: 'What\'s for breakfast?', emoji: '🌅', sub: 'Tap a yummy pick · +5⭐' },
    lunch: { title: 'Lunch time!', emoji: '☀️', sub: 'Tap what sounds good · +5⭐' },
    dinner: { title: 'Dinner o\'clock!', emoji: '🌙', sub: 'Pick your plate · +5⭐' },
  };

  const CAFE_COPY = { title: "Wahoo's Fish Tacos", emoji: '🌮', sub: 'HB original · tap to order · +5⭐' };

  function copyFor(source, mealKey) {
    const local = window.BlossomHBLocal?.restaurantMealCopy?.(source);
    if (local) return local;
    if (source === 'cafe') return CAFE_COPY;
    return MEAL_COPY[mealKey] || MEAL_COPY.lunch;
  }

  const FOOD_EMOJI = {
    Oatmeal: '🥣',
    Pancakes: '🥞',
    Donuts: '🍩',
    Sandwich: '🥪',
    'Pizza slice': '🍕',
    Salad: '🥗',
    'Chicken & rice': '🍗',
    Burgers: '🍔',
    'Ice cream': '🍦',
  };

  const TYPE_STYLE = {
    Healthy: 'meal-badge--healthy',
    Yummy: 'meal-badge--yummy',
    Dessert: 'meal-badge--treat',
    Fat: 'meal-badge--treat',
  };

  let pendingFoods = [];
  let pickHandler = null;

  function $(id) { return document.getElementById(id); }

  function starsPerMeal() {
    return window.BLOSSOM_CONFIG?.starsPerMeal ?? 5;
  }

  function open(opts) {
    const { mealKey, foods, state, source, onPick } = opts || {};
    pendingFoods = foods || [];
    pickHandler = onPick;

    const modal = $('mealModal');
    const card = modal?.querySelector('.meal-card-panel');
    if (!modal) return;

    const copy = copyFor(source, mealKey);
    const title = $('mealModalTitle');
    const sub = $('mealModalSub');
    const bigEmoji = $('mealModalEmoji');
    const money = $('mealModalMoney');
    const grid = $('mealGrid');
    const ateNote = $('mealAlreadyAte');

    if (title) title.textContent = copy.title;
    if (sub) sub.textContent = copy.sub;
    if (bigEmoji) bigEmoji.textContent = copy.emoji;
    if (money) money.textContent = `$${state?.money ?? 0}`;

    const already = state?.mealsEaten?.[mealKey];
    if (ateNote) {
      ateNote.hidden = !already;
      if (already) {
        ateNote.textContent = `You already had ${mealKey}! Come back next meal time.`;
      }
    }
    if (grid) {
      grid.hidden = !!already;
      grid.innerHTML = '';
      if (!already) {
        pendingFoods.forEach((food, idx) => {
          const btn = document.createElement('button');
          const afford = (state?.money ?? 0) >= food.price;
          btn.type = 'button';
          btn.className = `meal-pick${afford ? '' : ' meal-pick--locked'}`;
          btn.dataset.idx = String(idx);
          btn.disabled = !afford;
          const emoji = FOOD_EMOJI[food.name] || '🍽️';
          const badge = TYPE_STYLE[food.type] || 'meal-badge--yummy';
          btn.innerHTML = `
            <span class="meal-pick__emoji" aria-hidden="true">${emoji}</span>
            <span class="meal-pick__name">${food.name}</span>
            <span class="meal-pick__badge ${badge}">${food.type}</span>
            <span class="meal-pick__price">${afford ? `$${food.price}` : `Need $${food.price}`}</span>
            <span class="meal-pick__stars">+${starsPerMeal()} ⭐</span>
          `;
          btn.addEventListener('click', () => choose(idx, btn));
          grid.appendChild(btn);
        });
      }
    }

    modal.hidden = false;
    card?.classList.add('meal-card-panel--open');
    document.body.classList.add('meal-picker-open');
    window.BlossomAudio?.playSfx('ui');
  }

  function close() {
    const modal = $('mealModal');
    const card = modal?.querySelector('.meal-card-panel');
    if (modal) modal.hidden = true;
    card?.classList.remove('meal-card-panel--open');
    document.body.classList.remove('meal-picker-open');
    pickHandler = null;
    pendingFoods = [];
  }

  function choose(idx, btn) {
    const food = pendingFoods[idx];
    if (!food || !pickHandler) return;
    btn?.classList.add('meal-pick--chosen');
    window.BlossomAudio?.playSfx('ui');
    setTimeout(() => {
      close();
      pickHandler(idx, food);
    }, 280);
  }

  function init() {
    $('mealClose')?.addEventListener('click', () => {
      window.BlossomAudio?.playSfx('ui');
      close();
    });
    $('mealModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'mealModal') close();
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { open, close };
})();