/** Supabase — paste your project URL + anon key to enable cloud saves. */
window.BLOSSOM_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  gameVersion: 1,
  starsPerDay: 50,
  starsSkipLevel: 60,
  startMoney: 10,
  dailyBonusMoney: 15,
  dailyBonusStars: 20,
  starsPerMeal: 5,
  starsPerChore: 5,
};

window.BLOSSOM_CONFIG.cloudEnabled = Boolean(
  window.BLOSSOM_CONFIG.supabaseUrl && window.BLOSSOM_CONFIG.supabaseAnonKey
);