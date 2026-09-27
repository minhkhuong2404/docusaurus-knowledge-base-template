export interface ThemePreset {
  id: string;
  name: string;
  subtitle: string;
  primaryDark: string;
  accentDark: string;
  primaryLight: string;
  accentLight: string;
  gradientDark: string;
  gradientLight: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'emerald',
    name: 'Emerald Matrix',
    subtitle: 'Classic Neon & Cyberpunk',
    primaryDark: '#4ade80',
    accentDark: '#a855f7',
    primaryLight: '#16a34a',
    accentLight: '#7c3aed',
    gradientDark: 'linear-gradient(135deg, #4ade80 0%, #a855f7 100%)',
    gradientLight: 'linear-gradient(135deg, #16a34a 0%, #7c3aed 100%)',
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    subtitle: 'Indigo & Neon Purple',
    primaryDark: '#7aa2f7',
    accentDark: '#bb9af7',
    primaryLight: '#2563eb',
    accentLight: '#7c3aed',
    gradientDark: 'linear-gradient(135deg, #7aa2f7 0%, #bb9af7 100%)',
    gradientLight: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
  },
  {
    id: 'nord',
    name: 'Nordic Frost',
    subtitle: 'Arctic Teal & Glacier Blue',
    primaryDark: '#88c0d0',
    accentDark: '#81a1c1',
    primaryLight: '#0284c7',
    accentLight: '#6366f1',
    gradientDark: 'linear-gradient(135deg, #88c0d0 0%, #81a1c1 100%)',
    gradientLight: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin Mauve',
    subtitle: 'Soft Mauve & Flamingo Pink',
    primaryDark: '#cba6f7',
    accentDark: '#f5c2e7',
    primaryLight: '#7c3aed',
    accentLight: '#db2777',
    gradientDark: 'linear-gradient(135deg, #cba6f7 0%, #f5c2e7 100%)',
    gradientLight: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
  },
  {
    id: 'amber',
    name: 'Retro Amber',
    subtitle: 'Warm CRT & Sunset Gold',
    primaryDark: '#f59e0b',
    accentDark: '#fbbf24',
    primaryLight: '#b45309',
    accentLight: '#d97706',
    gradientDark: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    gradientLight: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
  },
  {
    id: 'rose',
    name: 'Rose Sunset',
    subtitle: 'Cyberpunk Rose & Neon Coral',
    primaryDark: '#f43f5e',
    accentDark: '#fb7185',
    primaryLight: '#e11d48',
    accentLight: '#9333ea',
    gradientDark: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
    gradientLight: 'linear-gradient(135deg, #e11d48 0%, #9333ea 100%)',
  },
];

export const THEME_PRESET_STORAGE_KEY = 'kb_theme_preset';

export function getStoredThemePreset(): string {
  if (typeof window === 'undefined') return 'emerald';
  try {
    return localStorage.getItem(THEME_PRESET_STORAGE_KEY) || 'emerald';
  } catch (_e) {
    return 'emerald';
  }
}

export function setStoredThemePreset(presetId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_PRESET_STORAGE_KEY, presetId);
    document.documentElement.setAttribute('data-theme-preset', presetId);
  } catch (_e) {
    // ignore local storage errors
  }
}

export function applyThemePreset(presetId: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme-preset', presetId);
}
