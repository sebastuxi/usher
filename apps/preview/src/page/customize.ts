/**
 * "Make it yours": live controls that set the skin's public custom properties on the frame's `media-container`
 * (`--media-accent-color`, `--media-border-radius`, `--media-font-family`), and the CSS that does the same on a site.
 */
import type { PlayerFrame } from './frames';

const ACCENTS = [
  { name: 'Yellow', value: '#ffd23f' },
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#000000' },
  { name: 'Navy', value: '#1b2a52' },
  { name: 'Pink', value: '#ff7eb6' },
];

/** A host page's own fonts, which `--media-font-family: inherit` hands to the skin. */
const FONTS = [
  { id: 'system', label: 'System', family: '' },
  {
    id: 'serif',
    label: 'Serif',
    family: 'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, Cambria, "Times New Roman", serif',
  },
  {
    id: 'rounded',
    label: 'Rounded',
    family: 'ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", "Varela Round", "Nunito", system-ui, sans-serif',
  },
];

const CHECK =
  '<svg viewBox="0 0 18 18" aria-hidden="true"><path fill="currentColor" d="M3.707 8.293L7 11.586L14.293 4.293A1 1 0 0 1 15.707 5.707L7.707 13.707A1 1 0 0 1 6.293 13.707L2.293 9.707A1 1 0 0 1 3.707 8.293Z"/></svg>';

function channel(hex: string, index: number): number {
  const c = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;

  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);
}

/** Black or white, whichever reads better on the accent (WCAG 2). */
function inkFor(hex: string): '#000' | '#fff' {
  const l = luminance(hex);

  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? '#000' : '#fff';
}

interface State {
  accent: string;
  radius: number | 'full';
  font: string;
}

export function initCustomize(frame: PlayerFrame): void {
  const form = document.querySelector<HTMLFormElement>('[data-yours]');
  const swatches = form?.querySelector<HTMLElement>('[data-swatches]');
  const fonts = form?.querySelector<HTMLElement>('[data-fonts]');
  const range = form?.querySelector<HTMLInputElement>('[data-radius]');
  const rangeBox = form?.querySelector<HTMLElement>('[data-range]');
  const rangeOut = form?.querySelector<HTMLOutputElement>('[data-radius-out]');
  const code = form?.querySelector<HTMLElement>('[data-css]');

  if (!form || !swatches || !fonts || !range || !rangeBox || !rangeOut || !code) return;

  const state: State = { accent: ACCENTS[0]!.value, radius: 12, font: 'system' };
  const FULL = Number(range.max);

  form.addEventListener('submit', (event) => event.preventDefault());

  // Accent swatches: five presets as radios, then any colour.
  const swatchFor = (labelText: string, color: string, input: HTMLInputElement, any = false) => {
    const label = document.createElement('label');
    const chip = document.createElement('span');
    const name = document.createElement('span');

    label.className = any ? 'swatch swatch-any' : 'swatch';
    label.style.setProperty('--c', color);
    label.style.setProperty('--c-ink', inkFor(color));
    chip.className = 'swatch-chip';
    chip.innerHTML = CHECK;
    name.className = 'visually-hidden';
    name.textContent = labelText;
    label.append(input, chip, name);

    return label;
  };

  const radios = ACCENTS.map((accent, index) => {
    const input = document.createElement('input');

    input.type = 'radio';
    input.name = 'accent';
    input.value = accent.value;
    input.checked = index === 0;

    return { input, label: swatchFor(accent.name, accent.value, input) };
  });

  const picker = document.createElement('input');

  picker.type = 'color';
  picker.value = '#e4572e';

  const any = swatchFor('Any colour', picker.value, picker, true);

  swatches.append(...radios.map((radio) => radio.label), any);

  const markSwatches = () => {
    for (const radio of radios) radio.label.toggleAttribute('data-checked', radio.input.checked);
    any.toggleAttribute('data-checked', !radios.some((radio) => radio.input.checked));
  };

  for (const radio of radios)
    radio.input.addEventListener('change', () => {
      state.accent = radio.input.value;
      markSwatches();
      apply();
    });

  picker.addEventListener('input', () => {
    for (const radio of radios) radio.input.checked = false;
    any.setAttribute('data-picked', '');
    any.style.setProperty('--c', picker.value);
    any.style.setProperty('--c-ink', inkFor(picker.value));
    state.accent = picker.value;
    markSwatches();
    apply();
  });

  markSwatches();

  // Fonts.
  for (const font of FONTS) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    const text = document.createElement('span');

    label.className = 'option';
    input.type = 'radio';
    input.name = 'font';
    input.value = font.id;
    input.checked = font.id === state.font;
    text.textContent = font.label;
    label.append(input, text);
    fonts.append(label);
    input.addEventListener('change', () => {
      state.font = font.id;
      apply();
    });
  }

  // Radius: 0 to 32px, and one more step for full.
  const readRange = () => {
    const value = Number(range.value);

    state.radius = value >= FULL ? 'full' : value;
    rangeOut.textContent = state.radius === 'full' ? 'Full' : String(value);
    range.setAttribute('aria-valuetext', state.radius === 'full' ? 'Full' : `${value} pixels`);
    rangeBox.style.setProperty('--at', `${(value / FULL) * 100}%`);
  };

  range.addEventListener('input', () => {
    readRange();
    apply();
  });
  readRange();

  function radiusValue(): string {
    return state.radius === 'full' ? '9999px' : `${state.radius}px`;
  }

  function css(): string {
    const ink = inkFor(state.accent);
    const lines = [`  --media-accent-color: ${state.accent};`];

    // The skin picks black text on the accent by default; a dark accent needs white.
    if (ink === '#fff') lines.push('  --media-accent-text-color: #fff;');
    lines.push(`  --media-border-radius: ${radiusValue()};`);
    if (state.font !== 'system') lines.push('  --media-font-family: inherit; /* your page’s font */');

    return `media-container {\n${lines.join('\n')}\n}`;
  }

  function apply(): void {
    code!.textContent = css();
    frame.root.style.setProperty('--player-radius', state.radius === 'full' ? '9999px' : `${state.radius}px`);

    void frame.ready.then(({ container, doc }) => {
      const style = container.style;
      const font = FONTS.find((item) => item.id === state.font)!;

      style.setProperty('--media-accent-color', state.accent);
      style.setProperty('--media-accent-text-color', inkFor(state.accent));
      style.setProperty('--media-border-radius', radiusValue());

      if (font.family) {
        style.setProperty('--media-font-family', 'inherit');
        doc.body.style.fontFamily = font.family;
      } else {
        style.removeProperty('--media-font-family');
        doc.body.style.removeProperty('font-family');
      }
    });
  }

  apply();
}
