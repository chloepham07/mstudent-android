import { useColorScheme } from '@/components/useColorScheme';

const light = {
  bg: '#f6f6f3',
  panel: '#ffffff',
  soft: '#efefea',
  text: '#1d1d1b',
  muted: '#6b6b66',
  line: '#e3e3de',
  accent: '#2f5bd3',
  accentSoft: '#e8eefc',
  onAccent: '#ffffff',
  high: '#c4312b',
  medium: '#b7791f',
  low: '#4a7c59',
  ok: '#2e7d4f',
  bad: '#c4312b',
};

const dark: typeof light = {
  bg: '#141413',
  panel: '#1d1d1b',
  soft: '#262624',
  text: '#ecece8',
  muted: '#a0a09a',
  line: '#33332f',
  accent: '#7d9bff',
  accentSoft: '#232a40',
  onAccent: '#0b1020',
  high: '#ff7a70',
  medium: '#e3b25a',
  low: '#7fbf8f',
  ok: '#7fcf9a',
  bad: '#ff7a70',
};

export type Palette = typeof light;

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const PALETTES = { light, dark };
