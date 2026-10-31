export interface Theme {
  readonly name: string;
  readonly bg: string;
  readonly text: string;
  readonly muted: string;
  readonly accent: string;
  readonly paper: string;
  readonly paperBack: string;
}

export const themes: readonly Theme[] = [
  { name: 'moss', bg: '#021608', text: '#33b863', muted: '#2b9150', accent: '#3fe07a', paper: '#3fe07a', paperBack: '#eef3ea' },
  { name: 'ink', bg: '#0b0b0b', text: '#a3a3a3', muted: '#808080', accent: '#f2f2f2', paper: '#e4473b', paperBack: '#f4f1ea' },
  { name: 'washi', bg: '#f7f4ec', text: '#5b5648', muted: '#6f675b', accent: '#1d1b16', paper: '#d9453a', paperBack: '#fffdf7' },
  { name: 'sunset', bg: '#190c02', text: '#d9823a', muted: '#b8743a', accent: '#ffa552', paper: '#ffa552', paperBack: '#f6efe6' },
  { name: 'tide', bg: '#030c1d', text: '#4f8fe0', muted: '#6085b5', accent: '#7ab4ff', paper: '#7ab4ff', paperBack: '#eef2f8' },
  { name: 'plum', bg: '#11061c', text: '#a070e0', muted: '#9373c0', accent: '#c69bff', paper: '#c69bff', paperBack: '#f3eff8' },
  { name: 'sakura', bg: '#1b0610', text: '#e0709a', muted: '#c0708f', accent: '#ff9ec2', paper: '#ff9ec2', paperBack: '#f8eef2' },
];

const KEY = 'origami:theme';

export function currentTheme(): string {
  try {
    return localStorage.getItem(KEY) ?? 'moss';
  } catch {
    return 'moss';
  }
}

export function applyTheme(name: string) {
  const theme = themes.find((t) => t.name === name) ?? themes[0]!;
  const s = document.documentElement.style;
  s.setProperty('--bg', theme.bg);
  s.setProperty('--text', theme.text);
  s.setProperty('--muted', theme.muted);
  s.setProperty('--accent', theme.accent);
  s.setProperty('--paper', theme.paper);
  s.setProperty('--paper-back', theme.paperBack);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme.bg);
  try {
    localStorage.setItem(KEY, theme.name);
  } catch {
    /* not remembered */
  }
}

// A crane, in banner pixels (64 × 20).
const crane: readonly (readonly [number, number])[][] = [
  [[32, 11], [17, 1], [27, 12]],
  [[32, 11], [45, 2], [37, 12]],
  [[23, 13], [32, 9], [41, 13], [32, 16.5]],
  [[25, 13.5], [14, 6], [12.5, 6.5], [14.5, 7], [23.5, 14.5]],
  [[38.5, 13], [51, 7.5], [40, 14.5]],
];

function inside(x: number, y: number, poly: readonly (readonly [number, number])[]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Pixel-mosaic banner: a crane over dithered noise in the theme's colors. */
export function drawBanner(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const css = getComputedStyle(document.documentElement);
  const bg = css.getPropertyValue('--bg').trim();
  const muted = css.getPropertyValue('--muted').trim();
  const paper = css.getPropertyValue('--paper').trim();
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const n = hash(x, y);
      const onCrane = crane.some((p) => inside(x + 0.5, y + 0.5, p));
      const wave = 0.5 + 0.5 * Math.sin(x / 6 + y / 4);
      ctx.fillStyle = onCrane
        ? `color-mix(in srgb, ${paper} ${70 + n * 30}%, ${bg})`
        : `color-mix(in srgb, ${muted} ${10 + (n * 0.6 + wave * 0.4) * 45}%, ${bg})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}
