/**
 * Blossom Life — Supabase cloud saves
 * Project: https://supabase.com/dashboard/project/mtqezgchhggmlrfzfyjb
 * Anon key:  Settings → API → "anon public" (safe to commit; RLS protects data)
 */
window.BLOSSOM_CONFIG = {
  supabaseUrl: 'https://mtqezgchhggmlrfzfyjb.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10cWV6Z2NoaGdnbWxyZnpmeWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTc0NjMsImV4cCI6MjA5ODMzMzQ2M30.CJs6HP6xfAne-xUF-B0mZo74y6wJlNhETEo2VXfVJgU',
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