import { DEFAULT_DASHBOARD_LAYOUT, normalizeDashboardLayout } from './dashboardLayout.js';

const STORAGE_KEY = 'oper-radar-ui-preferences-v1';

export const THEMES = {
  radar: {
    id: 'radar',
    label: 'Tema Radar',
    description: 'A identidade técnica original do Oper Radar.',
    mode: 'dark',
    tokens: {
      bg: '#0B0E13',
      surface: '#141922',
      surface2: '#1B212C',
      surface3: '#242C39',
      ink: '#EDEFF3',
      inkMuted: '#8A94A6',
      signal: '#F5A623',
      signalInk: '#14171C',
      positive: '#3DD68C',
      alert: '#FF6B4A',
      steel: '#5B8AA6',
      line: 'rgba(255,255,255,0.07)',
      lineStrong: 'rgba(255,255,255,0.16)',
      overlay: 'rgba(0,0,0,0.48)',
      nav: 'rgba(11,14,19,0.94)',
      shadow: '0 20px 60px rgba(0,0,0,0.45)',
    },
  },
  dark: {
    id: 'dark',
    label: 'Dark',
    description: 'Escuro neutro, discreto e corporativo.',
    mode: 'dark',
    tokens: {
      bg: '#101114',
      surface: '#191C21',
      surface2: '#22262D',
      surface3: '#2A3039',
      ink: '#F4F6F8',
      inkMuted: '#9CA6B3',
      signal: '#7FA8C9',
      signalInk: '#0C1822',
      positive: '#48C78E',
      alert: '#FF765F',
      steel: '#7FA8C9',
      line: 'rgba(255,255,255,0.08)',
      lineStrong: 'rgba(255,255,255,0.18)',
      overlay: 'rgba(0,0,0,0.52)',
      nav: 'rgba(16,17,20,0.95)',
      shadow: '0 20px 60px rgba(0,0,0,0.42)',
    },
  },
  white: {
    id: 'white',
    label: 'White Clean',
    description: 'Claro, limpo e confortável para uso diurno.',
    mode: 'light',
    tokens: {
      bg: '#F4F6F8',
      surface: '#FFFFFF',
      surface2: '#EEF1F5',
      surface3: '#E4E9EF',
      ink: '#101828',
      inkMuted: '#667085',
      signal: '#2563EB',
      signalInk: '#FFFFFF',
      positive: '#087A55',
      alert: '#C53B2C',
      steel: '#466B85',
      line: 'rgba(16,24,40,0.10)',
      lineStrong: 'rgba(16,24,40,0.20)',
      overlay: 'rgba(16,24,40,0.34)',
      nav: 'rgba(255,255,255,0.94)',
      shadow: '0 20px 60px rgba(16,24,40,0.16)',
    },
  },
};

export const COMING_THEMES = [
  { id: 'silver', label: 'Silver', colors: ['#E8EDF1', '#F8FAFC', '#5B8AA6'] },
  { id: 'future', label: 'Future', colors: ['#07111F', '#0C1B2E', '#38BDF8'] },
  { id: 'neon', label: 'Neon', colors: ['#05080C', '#0D141B', '#00E5C4'] },
];

export const DEFAULT_UI_PREFERENCES = {
  theme: 'radar',
  density: 'standard',
  reduceMotion: false,
  dashboardHoje: DEFAULT_DASHBOARD_LAYOUT,
};

const FONT_TOKENS = {
  fontDisplay: "'Space Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontMono: "'JetBrains Mono', monospace",
};

let activeTheme = THEMES.radar;

export const T = {};
Object.keys({ ...THEMES.radar.tokens, ...FONT_TOKENS }).forEach(key => {
  Object.defineProperty(T, key, {
    enumerable: true,
    get: () => activeTheme.tokens[key] ?? FONT_TOKENS[key],
  });
});

export function loadUiPreferences() {
  if (typeof window === 'undefined') return DEFAULT_UI_PREFERENCES;
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      ...DEFAULT_UI_PREFERENCES,
      ...stored,
      theme: stored.theme === 'auto' || THEMES[stored.theme] ? stored.theme : DEFAULT_UI_PREFERENCES.theme,
      dashboardHoje: normalizeDashboardLayout(stored.dashboardHoje),
    };
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
}

export function saveUiPreferences(preferences) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {}
}

export function resolveTheme(themePreference, systemDark = true) {
  if (themePreference === 'auto') return systemDark ? 'dark' : 'white';
  return THEMES[themePreference] ? themePreference : DEFAULT_UI_PREFERENCES.theme;
}

export function activateTheme(themeId) {
  activeTheme = THEMES[themeId] || THEMES.radar;
  return activeTheme;
}

export function applyUiPreferences(preferences, resolvedThemeId) {
  if (typeof document === 'undefined') return;
  const theme = activateTheme(resolvedThemeId);
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.dataset.themeMode = theme.mode;
  root.dataset.density = preferences.density || 'standard';
  root.dataset.reduceMotion = preferences.reduceMotion ? 'true' : 'false';
  root.style.colorScheme = theme.mode;

  Object.entries(theme.tokens).forEach(([key, value]) => {
    root.style.setProperty(`--or-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, value);
  });
}
