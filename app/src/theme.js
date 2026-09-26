import { DEFAULT_DASHBOARD_LAYOUT, normalizeDashboardLayout } from './dashboardLayout.js';

const STORAGE_KEY = 'oper-radar-ui-preferences-v1';

/* Identidade unica: design system Oper Radar (design-system/tokens/colors.css).
   Os valores abaixo espelham os tokens semanticos do design system; o app le
   `T.*` em runtime e as classes `.or-*` de theme.css leem `--or-*`.
   - dark  = "cockpit" (padrao do design system)
   - light = tema claro do design system
   No tema claro o verde radar (#46F84B) nao tem contraste como texto sobre branco;
   `signal` usa radar-800 (#007A22), o mesmo que o design system usa em --text-accent. */
export const THEMES = {
  dark: {
    id: 'dark',
    label: 'Escuro',
    description: 'Cockpit escuro do Oper Radar. É o padrão.',
    mode: 'dark',
    tokens: {
      bg: '#0A0A0A',
      surface: '#141414',
      surface2: '#1A1A1A',
      surface3: '#262626',
      ink: '#FFFFFF',
      inkMuted: '#A3A3A3',
      signal: '#46F84B',
      signalInk: '#0A0A0A',
      positive: '#46F84B',
      alert: '#FF6B6B',
      warning: '#FF9A2E',
      steel: '#5AA9FF',
      line: 'rgba(255,255,255,0.10)',
      lineStrong: 'rgba(255,255,255,0.22)',
      overlay: 'rgba(0,0,0,0.64)',
      nav: 'rgba(10,10,10,0.94)',
      shadow: '0 20px 60px rgba(0,0,0,0.55)',
    },
  },
  light: {
    id: 'light',
    label: 'Claro',
    description: 'Claro e limpo para uso diurno.',
    mode: 'light',
    tokens: {
      bg: '#F2F2F2',
      surface: '#FFFFFF',
      surface2: '#F2F2F2',
      surface3: '#ECECEC',
      ink: '#0F0F0F',
      inkMuted: '#555555',
      signal: '#007A22',
      signalInk: '#FFFFFF',
      positive: '#007A22',
      alert: '#C62828',
      warning: '#B35C00',
      steel: '#1F6FD1',
      line: 'rgba(15,15,15,0.10)',
      lineStrong: 'rgba(15,15,15,0.24)',
      overlay: 'rgba(15,15,15,0.40)',
      nav: 'rgba(255,255,255,0.94)',
      shadow: '0 20px 60px rgba(15,15,15,0.16)',
    },
  },
};

/* Preferencias salvas antes do design system usavam radar/dark/white. */
const LEGACY_THEME_IDS = { radar: 'dark', white: 'light' };

export function migrateThemeId(themeId) {
  if (themeId === 'auto' || THEMES[themeId]) return themeId;
  return LEGACY_THEME_IDS[themeId] || null;
}

export const DEFAULT_UI_PREFERENCES = {
  theme: 'dark',
  density: 'standard',
  reduceMotion: false,
  dashboardHoje: DEFAULT_DASHBOARD_LAYOUT,
};

/* Manjari so em titulos de pagina; Inter no restante (design-system/tokens/typography.css).
   O design system nao usa fonte mono: numeros usam Inter com algarismos tabulares. */
const FONT_TOKENS = {
  fontDisplay: "'Manjari', 'Inter', system-ui, sans-serif",
  fontBody: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontMono: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
};

let activeTheme = THEMES.dark;

export const T = {};
Object.keys({ ...THEMES.dark.tokens, ...FONT_TOKENS }).forEach(key => {
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
      theme: migrateThemeId(stored.theme) || DEFAULT_UI_PREFERENCES.theme,
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
  if (themePreference === 'auto') return systemDark ? 'dark' : 'light';
  const migrated = migrateThemeId(themePreference);
  return migrated && migrated !== 'auto' ? migrated : DEFAULT_UI_PREFERENCES.theme;
}

export function activateTheme(themeId) {
  activeTheme = THEMES[migrateThemeId(themeId)] || THEMES.dark;
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
