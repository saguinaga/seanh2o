/** Huntington Beach local flavor — full downtown → PCH → pier loop */
window.BlossomHBLocal = (function () {
  const LOCS = {
    house: {
      id: 'house',
      name: '9th Street Cottage',
      short: 'Downtown HB',
      blurb: 'Residential streets off Main — a few blocks to Pacific Coast Highway.',
    },
    yard: {
      id: 'yard',
      name: '9th Street Neighborhood',
      short: 'Near downtown',
      blurb: 'Cut through the neighborhood toward Main Street and the coast.',
    },
    street: {
      id: 'street',
      name: 'Main Street',
      short: 'Downtown HB',
      blurb: 'The full Main Street strip — Sugar Shack, Jan\'s, No Ka Oi, Wahoo\'s, Bonnie\'s, and every local stop.',
    },
    pch: {
      id: 'pch',
      name: 'Pacific Coast Highway',
      short: 'PCH',
      blurb: 'Main Street meets PCH — International Surfing Museum, the highway east toward downtown.',
    },
    pacCity: {
      id: 'pacCity',
      name: 'Pacific City',
      short: 'Pacific City',
      blurb: 'Pacific City HB — boardwalk shops, The Strand, City Beach, lifeguard towers, US Open zone, fire rings.',
    },
    park: {
      id: 'park',
      name: 'Huntington Beach Pier',
      short: 'The Pier',
      blurb: 'The HB Pier, Ruby\'s at the end, sand volleyball — Surf City USA.',
    },
  };

  const SHOPS = {
    market: { sign: '🛒 Main St Grocery Run', label: 'Grocery run', npc: 'Clerk at downtown market' },
    boutique: { sign: '👗 Bloom Boutique', label: 'Bloom Boutique', npc: 'Jade at Bloom Boutique' },
    sugarShack: {
      sign: '☕ Sugar Shack Cafe',
      label: 'Sugar Shack Cafe',
      mealTitle: 'Sugar Shack Cafe',
      mealEmoji: '☕',
      mealSub: 'Main St classic · breakfast & lunch · +5⭐',
      npc: 'Sugar Shack crew — locals\' morning spot on Main',
    },
    jans: {
      sign: "🥗 Jan's Health Bar",
      label: "Jan's Health Bar",
      mealTitle: "Jan's Health Bar",
      mealEmoji: '🥗',
      mealSub: 'Smoothies & bowls on Main · +5⭐',
      npc: "Jan's crew — health bar regulars since forever",
    },
    nokaoi: {
      sign: '🌺 No Ka Oi',
      label: 'No Ka Oi',
      mealTitle: 'No Ka Oi',
      mealEmoji: '🌺',
      mealSub: 'Hawaiian plates on Main Street · +5⭐',
      npc: 'No Ka Oi crew — island vibes, HB local favorite',
    },
    cafe: {
      sign: '🌮 Wahoo\'s · HB Original',
      label: "Wahoo's Fish Tacos",
      mealTitle: "Wahoo's Fish Tacos",
      mealEmoji: '🌮',
      mealSub: 'HB original fish tacos · +5⭐',
      npc: 'Crew at Wahoo\'s (started in HB!)',
    },
    salon: { sign: "💇 Bonnie's on Main", label: "Bonnie's Salon", npc: 'Bonnie — salon owner on Main' },
    wellness: { sign: '🧘 Main St Wellness', label: 'Main St Wellness', npc: 'Coach at Main St Wellness' },
  };

  const RESTAURANTS = ['sugarShack', 'jans', 'nokaoi', 'cafe'];

  const LANDMARKS = {
    pier: 'Huntington Beach Pier',
    rubys: "Ruby's Diner — end of the pier",
    sugarShack: 'Sugar Shack Cafe — Main Street',
    jans: "Jan's Health Bar — Main Street",
    nokaoi: 'No Ka Oi — Main Street',
    pch: 'Pacific Coast Highway (PCH)',
    mainPch: 'Main Street & Pacific Coast Highway',
    pacCity: 'Pacific City · Huntington Beach',
    strand: 'The Strand · Pacific City beach path',
    surfMuseum: 'International Surfing Museum',
    usOpen: 'US Open of Surfing',
    cityBeach: 'Huntington City Beach',
    oilers: 'HB Oilers',
    farmersMarket: 'Sunday Farmers Market on Main',
  };

  const EXITS = {
    toYard: '→ Main & PCH',
    toHouse: '← 9th Street home',
    toStreet: '→ Main Street downtown',
    toPCH: '→ Pacific Coast Hwy',
    fromPCH: '← Main Street',
    toPacCity: '→ Pacific City',
    fromPacCity: '← Pacific Coast Hwy',
    toPier: '→ HB Pier',
    fromPier: '← Pacific City',
  };

  const CHORES = {
    ducks: 'Feed shorebirds on the sand',
    playground: 'Tidy beach volleyball courts',
    litter: 'Pick up litter on Main',
    groceries: 'Grocery run on Main',
  };

  const CAREER_SITES = {
    salon: "Bonnie's on Main Street",
    broadway: 'HB Art Center · Main Street',
    tiktoker: 'Film corner · home near downtown',
    coach: 'Main St Wellness',
    trainer: 'City Beach · Pacific City workouts',
  };

  function loc(id) {
    return LOCS[id] || LOCS.house;
  }

  function shop(key) {
    return SHOPS[key] || SHOPS.cafe;
  }

  function isRestaurant(key) {
    return RESTAURANTS.includes(key);
  }

  function restaurantMealCopy(key) {
    const s = shop(key);
    if (!s.mealTitle) return null;
    return {
      title: s.mealTitle,
      emoji: s.mealEmoji || '🍽️',
      sub: s.mealSub || 'Tap to order · +5⭐',
    };
  }

  return {
    LOCS,
    SHOPS,
    RESTAURANTS,
    LANDMARKS,
    EXITS,
    CHORES,
    CAREER_SITES,
    loc,
    shop,
    isRestaurant,
    restaurantMealCopy,
    welcome: 'You live near downtown HB. Walk 9th Street → Main Street → PCH → Pacific City → the pier. Sugar Shack, Jan\'s, No Ka Oi, Wahoo\'s — then Pacific City sand and Ruby\'s.',
  };
})();