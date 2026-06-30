/** Theme presets — default is cozy (warm light / Pinterest-style). */

export const DEFAULT_THEME = 'cozy';

export const THEMES = {
  cozy: {
    id: 'cozy',
    label: 'Cozy',
    emoji: '🌸',
    hint: 'Warm & inviting — our default',
    themeColor: '#fffdfb',
    colorScheme: 'light',
    chart: {
      border: '#e60023',
      fill: 'rgba(230, 0, 35, 0.08)',
      grid: 'rgba(62, 39, 35, 0.08)',
      ticks: '#8a7a72',
      pointStart: '#1f7a4f',
      pointLow: '#c73e5a',
      pointDefault: '#e60023',
    },
  },
  paper: {
    id: 'paper',
    label: 'Paper',
    emoji: '📋',
    hint: 'Clean white board',
    themeColor: '#ffffff',
    colorScheme: 'light',
    chart: {
      border: '#e60023',
      fill: 'rgba(230, 0, 35, 0.06)',
      grid: 'rgba(0, 0, 0, 0.06)',
      ticks: '#6b7280',
      pointStart: '#059669',
      pointLow: '#dc2626',
      pointDefault: '#e60023',
    },
  },
  bloom: {
    id: 'bloom',
    label: 'Bloom',
    emoji: '💗',
    hint: 'Soft pink mood board',
    themeColor: '#fffafc',
    colorScheme: 'light',
    chart: {
      border: '#d9468f',
      fill: 'rgba(217, 70, 143, 0.1)',
      grid: 'rgba(190, 24, 93, 0.08)',
      ticks: '#9d7489',
      pointStart: '#059669',
      pointLow: '#be185d',
      pointDefault: '#d9468f',
    },
  },
  midnight: {
    id: 'midnight',
    label: 'Midnight',
    emoji: '🌙',
    hint: 'Easy on the eyes at night',
    themeColor: '#1a1625',
    colorScheme: 'dark',
    chart: {
      border: '#ff5c7a',
      fill: 'rgba(255, 92, 122, 0.15)',
      grid: 'rgba(255, 255, 255, 0.08)',
      ticks: '#a89aad',
      pointStart: '#4ade80',
      pointLow: '#fb7185',
      pointDefault: '#ff5c7a',
    },
  },
};

export function isValidTheme(id) {
  return id != null && id in THEMES;
}

export function applyTheme(themeId) {
  const id = isValidTheme(themeId) ? themeId : DEFAULT_THEME;
  const theme = THEMES[id];
  document.documentElement.dataset.theme = id;
  document.documentElement.style.colorScheme = theme.colorScheme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.themeColor);
  return id;
}

export function chartColors(themeId) {
  return THEMES[isValidTheme(themeId) ? themeId : DEFAULT_THEME].chart;
}