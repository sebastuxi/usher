/**
 * The shortcut table, the touch notes and the hero's hint, read at build time from the skin's own markup, so the page
 * can never list a shortcut the skin does not have.
 */
import skinHtml from '@/video/skin.html?raw';

// The skin's scripts, to find key handlers that are not `media-hotkey` elements (such as the typed-time field's G).
const sources = import.meta.glob<string>(['@/video/*.ts', '!@/video/icons.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

interface Binding {
  keys: string;
  action: string;
  value?: number;
}

function attributes(tag: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const match of tag.matchAll(/([\w-]+)="([^"]*)"/g)) result[match[1]!] = match[2]!;

  return result;
}

function decode(value: string): string {
  return value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

const hotkeys: Binding[] = [...skinHtml.matchAll(/<media-hotkey\b(?:[^>"]|"[^"]*")*>/g)].map((match) => {
  const attrs = attributes(match[0]);

  return { keys: decode(attrs.keys ?? ''), action: attrs.action ?? '', value: attrs.value ? Number(attrs.value) : undefined };
});

const gestures = [...skinHtml.matchAll(/<media-gesture\b(?:[^>"]|"[^"]*")*>/g)].map((match) => attributes(match[0]));

/** Keys a single-key binding listens for, from `media-hotkey` or from a keydown handler in the skin's scripts. */
function hasKey(key: string): boolean {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const inMarkup = hotkeys.some((binding) => binding.keys.split(/[\s,]+/).some((k) => k.toLowerCase() === key.toLowerCase()));
  const inScript = Object.values(sources).some((source) =>
    new RegExp(`\\bkey\\s*[!=]==?\\s*['"]${escaped}['"]|['"]${escaped}['"]\\s*[!=]==?\\s*(?:event\\.)?key\\b`).test(source),
  );

  return inMarkup || inScript;
}

/** Typing a time with G, and a `?` sheet of shortcuts: listed only when the skin has them. */
export const features = {
  typeTime: hasKey('g'),
  shortcutSheet: hasKey('?'),
};

const STEP = 10;
const VOLUME_STEP = 5;
const NEGATIVE = new Set(['ArrowLeft', 'ArrowDown', 'j', 'J']);

const KEY_NAMES: Record<string, string> = {
  Space: 'Space',
  ArrowRight: '→',
  ArrowLeft: '←',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Home: 'Home',
  End: 'End',
  Escape: 'Esc',
  Enter: 'Enter',
};

const KEY_LABELS: Record<string, string> = {
  '→': 'Right arrow',
  '←': 'Left arrow',
  '↑': 'Up arrow',
  '↓': 'Down arrow',
};

function keyName(key: string): string {
  return KEY_NAMES[key] ?? (key.length === 1 ? key.toUpperCase() : key);
}

function describe(binding: Binding): string {
  const negative = binding.value !== undefined ? binding.value < 0 : NEGATIVE.has(binding.keys);
  const step = Math.abs(binding.value ?? STEP);

  switch (binding.action) {
    case 'togglePaused':
      return 'Play or pause';
    case 'toggleMuted':
      return 'Mute or unmute';
    case 'seekStep':
      return negative ? `Back ${step} seconds` : `Forward ${step} seconds`;
    case 'volumeStep':
      return negative ? `Volume down ${Math.abs(binding.value ?? VOLUME_STEP)}%` : `Volume up ${Math.abs(binding.value ?? VOLUME_STEP)}%`;
    case 'seekToPercent':
      if (binding.value === 0) return 'Go to the start';
      if (binding.value === 100) return 'Go to the end';
      if (binding.value !== undefined) return `Go to ${binding.value}%`;
      return 'Go to 0% to 90% of the video';
    case 'speedUp':
      return 'Faster';
    case 'speedDown':
      return 'Slower';
    case 'toggleFullscreen':
      return 'Full screen on or off';
    case 'toggleSubtitles':
      return 'Captions on or off';
    case 'togglePictureInPicture':
      return 'Picture in picture on or off';
    default:
      return binding.action;
  }
}

export interface ShortcutRow {
  keys: string[];
  action: string;
}

/** Bindings with the same effect share a row, in the skin's order. */
export function shortcutRows(): ShortcutRow[] {
  const rows: ShortcutRow[] = [];

  for (const binding of hotkeys) {
    const action = describe(binding);
    const keys = binding.keys === '0-9' ? ['0', '9'] : [keyName(binding.keys)];
    const existing = rows.find((row) => row.action === action);

    if (existing) existing.keys.push(...keys);
    else rows.push({ keys, action: binding.keys === '0-9' ? `${action}` : action });
  }

  if (features.typeTime) rows.push({ keys: ['G'], action: 'Type a time and go there' });
  if (features.shortcutSheet) rows.push({ keys: ['?'], action: 'Show the shortcuts' });

  return rows;
}

function kbd(key: string): HTMLElement {
  const element = document.createElement('kbd');

  element.textContent = key;
  if (KEY_LABELS[key]) element.setAttribute('aria-label', KEY_LABELS[key]!);

  return element;
}

function separator(text: string): HTMLElement {
  const element = document.createElement('span');

  element.className = 'sep';
  element.textContent = text;

  return element;
}

export function renderShortcuts(table: HTMLTableElement): void {
  const body = table.tBodies[0]!;

  body.replaceChildren(
    ...shortcutRows().map((row, index) => {
      const tr = document.createElement('tr');
      const keys = document.createElement('td');
      const action = document.createElement('td');
      const digits = hotkeys.some((binding) => binding.keys === '0-9') && row.keys.join('') === '09';

      row.keys.forEach((key, position) => {
        if (position > 0) keys.append(separator(digits ? 'to' : 'or'));
        keys.append(kbd(key));
      });
      action.textContent = row.action;
      tr.append(keys, action);
      tr.dataset.row = String(index);

      return tr;
    }),
  );
}

/** Touch notes from the skin's gestures, its 48px coarse-pointer sizes and its portrait transport. */
export function touchNotes(): { title: string; text: string }[] {
  const has = (type: string, action: string, region?: string) =>
    gestures.some((g) => g.type === type && g.action === action && (!region || g.region === region));
  const notes: { title: string; text: string }[] = [];

  if (has('tap', 'toggleControls'))
    notes.push({
      title: 'Tap to show the controls.',
      text: 'A tap on the picture shows or hides them. On touch screens every button grows to 48 by 48 pixels, and so does the line’s hit area.',
    });

  const back = has('doubletap', 'seekStep', 'left');
  const forward = has('doubletap', 'seekStep', 'right');
  const full = has('doubletap', 'toggleFullscreen', 'center');

  if (back || forward)
    notes.push({
      title: 'Double-tap to skip.',
      text: `Double-tap the ${back && forward ? 'left or right side' : back ? 'left side' : 'right side'} to skip ${back && forward ? 'back or forward' : back ? 'back' : 'forward'} ${STEP} seconds${full ? ', or the middle for full screen' : ''}.`,
    });

  if (/usher-transport/.test(skinHtml))
    notes.push({
      title: 'Thumbs first in portrait.',
      text: 'In portrait and square players, back 10, play and forward 10 sit in the middle of the picture, within reach of a thumb.',
    });

  return notes;
}

/** The opening tag of the skin's container, for the "Use it" snippet. */
export const containerTag = skinHtml.match(/<media-container\b(?:[^>"]|"[^"]*")*>/)?.[0] ?? '<media-container>';
export const mediaComment = skinHtml.match(/<!--[^>]*-->/)?.[0] ?? '<!-- Add a compatible media component here. -->';
