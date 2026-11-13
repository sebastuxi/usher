/**
 * "Any size": one live player on a stage as wide as the window. Widths change the frame's size only, so playback
 * carries on; portrait swaps to the 9:16 reel. A size wider than the window is scaled down, and the page says so.
 */
import type { Media, PlayerFrame, Ratio } from './frames';

interface Size {
  id: string;
  label: string;
  hidden?: string;
  width: number;
  height: number;
  media: Media;
  ratio: Ratio;
}

const wide = (width: number): Size => ({
  id: String(width),
  label: String(width),
  hidden: ' pixels wide',
  width,
  height: Math.round((width * 9) / 16),
  media: 'usher',
  ratio: '16:9',
});

export const SIZES: Size[] = [
  wide(1360),
  wide(896),
  wide(512),
  wide(384),
  wide(320),
  wide(240),
  { id: '9:16', label: '9:16', hidden: ' portrait, 360 by 640', width: 360, height: 640, media: 'reel-9x16', ratio: '9:16' },
  { id: '1:1', label: '1:1', hidden: ' square, 512 by 512', width: 512, height: 512, media: 'usher', ratio: '1:1' },
];

export function initSizes(frame: PlayerFrame): void {
  const group = document.querySelector<HTMLFieldSetElement>('[data-sizes]');
  const stage = document.querySelector<HTMLElement>('[data-stage]');
  const holder = document.querySelector<HTMLElement>('[data-stage-player]');
  const ruler = document.querySelector<HTMLElement>('[data-ruler]');
  const note = document.querySelector<HTMLElement>('[data-stage-note]');

  if (!group || !stage || !holder || !ruler || !note) return;

  // Start at the workbench's 896, or the widest size that fits a smaller window.
  const room = stage.clientWidth;
  let size = SIZES.find((item) => item.ratio === '16:9' && item.width <= Math.min(896, room)) ?? SIZES[5]!;

  for (const item of SIZES) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    const text = document.createElement('span');

    label.className = item.id === '9:16' ? 'option option-break' : 'option';
    input.type = 'radio';
    input.name = 'size';
    input.value = item.id;
    input.checked = item === size;
    text.textContent = item.label;

    if (item.hidden) {
      const hidden = document.createElement('span');

      hidden.className = 'visually-hidden';
      hidden.textContent = item.hidden;
      text.append(hidden);
    }

    label.append(input, text);
    group.append(label);
  }

  const layout = () => {
    const available = stage.clientWidth;
    const scale = Math.min(1, available / size.width);

    frame.root.style.setProperty('--w', `${size.width}px`);
    frame.root.style.setProperty('--h', `${size.height}px`);
    frame.root.style.setProperty('--scale', String(scale));
    stage.style.setProperty('--shown-w', `${size.width * scale}px`);
    stage.style.setProperty('--shown-h', `${size.height * scale}px`);
    ruler.textContent = `${size.width} × ${size.height}`;
    note.textContent = scale < 1 ? `Shown at ${Math.floor(scale * 100)}% so it fits this window.` : '';
  };

  // A square from the 16:9 reel fills its frame, as a square slot on a site would.
  const fit = () =>
    void frame.ready.then(({ container }) => {
      if (size.ratio === '1:1') container.style.setProperty('--media-object-fit', 'cover');
      else container.style.removeProperty('--media-object-fit');
    });

  group.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    const next = SIZES.find((item) => item.id === input.value);

    if (!next || next === size) return;

    const reload = next.media !== frame.media;

    size = next;
    layout();
    if (reload) void frame.load(next.media, next.ratio);
    else {
      frame.ratio = next.ratio;
      frame.root.dataset.ratio = next.ratio;
    }
    fit();
  });

  new ResizeObserver(layout).observe(stage);
  layout();
}
