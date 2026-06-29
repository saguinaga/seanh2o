/**
 * Blossom Life — Supabase cloud saves
 * Project: https://supabase.com/dashboard/project/mtqezgchhggmlrfzfyjb
 * Anon key:  Settings → API → "anon public" (safe to commit; RLS protects data)
 */
window.BLOSSOM_CONFIG = {
  supabaseUrl: 'https://mtqezgchhggmlrfzfyjb.supabase.co',
  // Paste anon key below, or set in config.secrets.js (see config.secrets.example.js)
  supabaseAnonKey: window.BLOSSOM_SECRETS?.supabaseAnonKey || '',
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