/**
 * The contrast sentence, computed at build time from the skin's own tokens: the scrim's peak opacity and the alphas of
 * the muted print and the unplayed line. Over a pure white frame (the worst case) the ground under the glyphs is
 * white darkened by the peak; each mark's colour is that ground mixed with white by its alpha. WCAG 2 contrast.
 * If a token cannot be read, the sentence says so instead of guessing.
 */
import usherTokens from '@/styles/themes/usher.css?raw';

function token(name: string): string | undefined {
  // The first declaration is the default one; preference overrides come later in the file.
  return usherTokens.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1]?.trim();
}

function alphaOf(value: string | undefined): number | undefined {
  if (!value) return undefined;
  if (/^rgb\(255 255 255\)$/.test(value)) return 1;

  const match = value.match(/rgb\(255 255 255 \/ ([\d.]+)\)/);

  return match ? Number(match[1]) : undefined;
}

function luminance(channel: number): number {
  const c = channel / 255;
  const linear = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

  return linear;
}

function ratio(a: number, b: number): number {
  const [hi, lo] = [Math.max(a, b), Math.min(a, b)];

  return (hi + 0.05) / (lo + 0.05);
}

const peak = Number(token('--usher-scrim-peak'));
const muted = alphaOf(token('--usher-print-muted'));
const unplayed = alphaOf(token('--usher-line-unplayed'));

function over(ground: number, alpha: number): number {
  return ground + (255 - ground) * alpha;
}

export interface ContrastNumbers {
  peak: number;
  ground: number;
  print: number;
  muted?: number;
  line?: number;
}

export const contrast: ContrastNumbers | undefined = Number.isFinite(peak)
  ? (() => {
      const ground = Math.round(255 * (1 - peak));
      const groundL = luminance(ground);

      return {
        peak,
        ground,
        print: ratio(1, groundL),
        muted: muted === undefined ? undefined : ratio(luminance(over(ground, muted)), groundL),
        line: unplayed === undefined ? undefined : ratio(luminance(over(ground, unplayed)), groundL),
      };
    })()
  : undefined;

/** One decimal, as the skin's token comments state them. */
export function formatRatio(value: number | undefined): string {
  return value === undefined ? 'TODO' : `${value.toFixed(1)}:1`;
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
