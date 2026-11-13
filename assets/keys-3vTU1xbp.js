import{t as e}from"./skin-CCTSjShy.js";var t=Object.assign({"../../src/video/chapter.ts":`import {
  type MediaTextCue,
  PlayerController,
  type PropertyValues,
  playerContext,
  selectTextTrack,
  selectTime,
  UIElement,
} from '@videojs/html';

/** A chapter with its end resolved: the next chapter's start, or the duration. */
export interface Chapter {
  start: number;
  end: number;
  title: string;
}

/** Chapters from the store's \`chaptersCues\`, in order, each ending where the next begins (or at the duration). */
export function chaptersFrom(cues: readonly MediaTextCue[], duration: number): Chapter[] {
  const sorted = [...cues].sort((a, b) => a.startTime - b.startTime);

  return sorted.map((cue, index) => {
    const next = sorted[index + 1]?.startTime ?? duration;
    const end = cue.endTime > cue.startTime ? Math.min(cue.endTime, next || cue.endTime) : next;

    return { start: cue.startTime, end: duration ? Math.min(end, duration) : end, title: cue.text.trim() };
  });
}

/** Index of the chapter that holds \`time\`, or -1. */
export function chapterIndexAt(chapters: readonly Chapter[], time: number): number {
  for (let index = chapters.length - 1; index >= 0; index--) {
    if (time >= chapters[index]!.start) return time < chapters[index]!.end || index === chapters.length - 1 ? index : -1;
  }

  return -1;
}

/** \`m:ss\`, or \`h:mm:ss\` when the media is an hour or longer, so every time in one list has the same shape. */
export function formatTime(seconds: number, duration: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');

  return duration >= 3600 ? \`\${h}:\${String(m).padStart(2, '0')}:\${s}\` : \`\${h * 60 + m}:\${s}\`;
}

/** Selects the chapters and the current one: shallow-equal while the chapter stays the same, so no per-frame work. */
const selectChapters = (state: object) => {
  const cues = selectTextTrack(state)?.chaptersCues ?? [];
  const time = selectTime(state);
  const chapters = chaptersFrom(cues, time?.duration ?? 0);

  return { cues, duration: time?.duration ?? 0, current: chapterIndexAt(chapters, time?.currentTime ?? 0), seek: time?.seek };
};

/**
 * \`<usher-chapter>\`: the chapter button's slot in the button row. It writes the current chapter title into its
 * \`.usher-chapter-title\` and hides itself (native \`hidden\`) when the media has no chapters.
 */
export class UsherChapterElement extends UIElement {
  static readonly tagName = 'usher-chapter';

  readonly #chapters = new PlayerController(this, playerContext, selectChapters);

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    const value = this.#chapters.value;
    const chapters = value ? chaptersFrom(value.cues, value.duration) : [];
    const title = chapters[value?.current ?? -1]?.title ?? '';
    const label = this.querySelector('.usher-chapter-title');

    this.hidden = chapters.length === 0 || title === '';
    if (label && label.textContent !== title) label.textContent = title;
  }
}

/**
 * \`<usher-chapter-list>\`, inside the chapter menu's content: one \`<media-menu-item>\` per chapter with its start time
 * and title. The current chapter carries \`aria-current="true"\` (its time chip turns solid). Choosing a row seeks to the
 * chapter's start; the menu then closes and returns focus to the chapter button, as menus do.
 */
export class UsherChapterListElement extends UIElement {
  static readonly tagName = 'usher-chapter-list';

  readonly #chapters = new PlayerController(this, playerContext, selectChapters);

  #disconnect: AbortController | null = null;
  #key = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.#disconnect = new AbortController();
    const { signal } = this.#disconnect;

    this.addEventListener('select', this.#onSelect, { signal });
    // When the menu opens, start on the current chapter rather than the first one.
    this.closest('media-menu')?.addEventListener(
      'open-change',
      (event) => {
        if (!(event as CustomEvent<{ open: boolean }>).detail?.open) return;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => this.querySelector<HTMLElement>('[aria-current="true"]')?.focus())
        );
      },
      { signal }
    );
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#disconnect?.abort();
    this.#disconnect = null;
  }

  #onSelect = (event: Event) => {
    const row = (event.target as Element).closest<HTMLElement>('[data-start]');
    if (row) void this.#chapters.value?.seek?.(Number(row.dataset.start));
  };

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    const value = this.#chapters.value;
    if (!value) return;

    const chapters = chaptersFrom(value.cues, value.duration);
    const key = chapters.map((c) => \`\${c.start}|\${c.title}\`).join('\\n') + value.duration;

    if (key !== this.#key) {
      this.#key = key;
      // Chips are as wide as the longest start time, so the titles line up.
      this.style.setProperty('--usher-chip-chars', String(formatTime(value.duration, value.duration).length));
      this.replaceChildren(
        ...chapters.map((chapter) => {
          const row = document.createElement('media-menu-item');
          const time = document.createElement('span');
          const title = document.createElement('span');

          row.className = 'media-menu-item usher-chapter-row';
          row.dataset.start = String(chapter.start);
          time.className = 'usher-chapter-row-time';
          time.textContent = formatTime(chapter.start, value.duration);
          title.className = 'usher-chapter-row-title';
          title.textContent = chapter.title;
          row.append(time, title);

          return row;
        })
      );
    }

    this.querySelectorAll('.usher-chapter-row').forEach((row, index) => {
      if (index === value.current) row.setAttribute('aria-current', 'true');
      else row.removeAttribute('aria-current');
    });
  }
}

/**
 * \`<usher-chapter-names>\`, inside the time slider: writes each chapter's title into the \`.usher-chapter-name\` of its
 * clone in \`<media-time-slider-chapters>\`, so the names can sit under their own stretch of the line while scrubbing.
 * Clones are matched to chapters by their start; names narrower than 56px get \`data-narrow\` and are not shown.
 */
export class UsherChapterNamesElement extends UIElement {
  static readonly tagName = 'usher-chapter-names';

  readonly #chapters = new PlayerController(this, playerContext, selectChapters);

  #observer: MutationObserver | null = null;
  #resize: ResizeObserver | null = null;

  override connectedCallback(): void {
    super.connectedCallback();

    const slider = this.closest('media-time-slider');
    const clones = slider?.querySelector('media-time-slider-chapters');
    if (!slider || !clones) return;

    this.#observer = new MutationObserver(() => this.#write());
    this.#observer.observe(clones, { childList: true });
    this.#resize = new ResizeObserver(() => this.#write());
    this.#resize.observe(slider);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#resize?.disconnect();
    this.#observer = this.#resize = null;
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);
    this.#write();
  }

  #write(): void {
    const value = this.#chapters.value;
    const slider = this.closest('media-time-slider');
    if (!value || !slider || !value.duration) return;

    const chapters = chaptersFrom(value.cues, value.duration);
    const width = slider.getBoundingClientRect().width;

    for (const clone of slider.querySelectorAll<HTMLElement>('.usher-chapter')) {
      const name = clone.querySelector<HTMLElement>('.usher-chapter-name');
      if (!name) continue;

      const start = parseFloat(clone.style.getPropertyValue('--media-slider-chapter-start')) || 0;
      const end = parseFloat(clone.style.getPropertyValue('--media-slider-chapter-end')) || 100;
      const chapter = chapters.find((c) => Math.abs((c.start / value.duration) * 100 - start) < 0.5);
      const title = chapter?.title ?? '';

      if (name.textContent !== title) name.textContent = title;
      name.toggleAttribute('data-narrow', ((end - start) / 100) * width < 56);
    }
  }
}

for (const element of [UsherChapterElement, UsherChapterListElement, UsherChapterNamesElement]) {
  if (!customElements.get(element.tagName)) customElements.define(element.tagName, element);
}
`,"../../src/video/rate.ts":`import {
  type InputActionEvent,
  PlayerController,
  type PropertyValues,
  playerContext,
  type StatusIndicatorElement,
  selectPlaybackRate,
  UIElement,
} from '@videojs/html';

type Snapshot = { playbackRate?: number };

/** A rate as people read it on a speed control: \`1.5×\`, in the page's number format. */
export function formatRate(rate: number, locale?: string): string {
  return \`\${new Intl.NumberFormat(locale || undefined, { maximumFractionDigits: 2 }).format(rate)}×\`;
}

/** The rate a stock \`speedUp\` / \`speedDown\` action will land on: the next listed rate, or the current one at the end. */
function nextRate(action: string, current: number, rates: readonly number[]): number {
  const faster = rates.filter((rate) => rate > current);
  const slower = rates.filter((rate) => rate < current);

  if (action === 'speedUp') return faster.length ? Math.min(...faster) : current;
  return slower.length ? Math.max(...slower) : current;
}

/**
 * \`<usher-rate-indicator>\`: wraps the \`<media-status-indicator actions="speedUp,speedDown">\` that shows speed changes
 * from the \`>\` and \`<\` keys as a hollow marker. Speed actions have no built-in status, so this supplies one through
 * \`deriveCustomStatus\`, computed from the snapshot taken before the action, the same way the action itself steps.
 */
export class UsherRateIndicatorElement extends UIElement {
  static readonly tagName = 'usher-rate-indicator';

  override connectedCallback(): void {
    super.connectedCallback();

    const indicator = this.querySelector<StatusIndicatorElement>('media-status-indicator');
    if (!indicator) return;

    indicator.deriveCustomStatus = (event: InputActionEvent, snapshot: Snapshot) => {
      if (event.action !== 'speedUp' && event.action !== 'speedDown') return null;

      const store = (this.closest('video-player') as { store?: { playbackRates?: readonly number[] } } | null)?.store;
      const rates = store?.playbackRates ?? [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
      const rate = formatRate(nextRate(event.action, snapshot.playbackRate ?? 1, rates), this.closest('[lang]')?.getAttribute('lang') ?? undefined);

      return { status: 'rate', label: rate, value: rate };
    };
  }
}

/**
 * \`<usher-rate>\`, inside the marker after the time: shows the playback rate (\`1.5×\`) behind a 1px divider when it is
 * not 1, and hides itself otherwise (§10). It updates on rate changes only.
 */
export class UsherRateElement extends UIElement {
  static readonly tagName = 'usher-rate';

  readonly #rate = new PlayerController(this, playerContext, (state: object) => selectPlaybackRate(state)?.playbackRate ?? 1);

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    const rate = this.#rate.value ?? 1;
    const text = formatRate(rate, this.closest('[lang]')?.getAttribute('lang') ?? undefined);

    this.hidden = rate === 1;
    if (this.textContent !== text) this.textContent = text;
  }
}

for (const element of [UsherRateIndicatorElement, UsherRateElement]) {
  if (!customElements.get(element.tagName)) customElements.define(element.tagName, element);
}
`,"../../src/video/skin.ts":`import '../styles/video/usher.css';
import './skin.css';
import '@videojs/html/i18n';
import '@videojs/html/ui/container';
import '@videojs/html/ui/poster';
import '@videojs/html/ui/buffering-indicator';
import '@videojs/html/ui/controls';
import '@videojs/html/ui/controls-backdrop';
import '@videojs/html/ui/controls-content';
import '@videojs/html/ui/controls-group';
import '@videojs/html/ui/tooltip-group';
import '@videojs/html/ui/tooltip';
import '@videojs/html/ui/tooltip-label';
import '@videojs/html/ui/tooltip-shortcut';
import '@videojs/html/ui/title';
import '@videojs/html/ui/seek-button';
import '@videojs/html/ui/play-button';
import '@videojs/html/ui/time';
import '@videojs/html/ui/time-slider';
import '@videojs/html/ui/time-slider-chapters';
import '@videojs/html/ui/time-slider-chapter-title';
import '@videojs/html/ui/slider-track';
import '@videojs/html/ui/slider-buffer';
import '@videojs/html/ui/slider-fill';
import '@videojs/html/ui/slider-thumb';
import '@videojs/html/ui/slider-preview';
import '@videojs/html/ui/slider-thumbnail';
import '@videojs/html/ui/slider-value';
import '@videojs/html/ui/mute-button';
import '@videojs/html/ui/volume-slider';
import '@videojs/html/ui/captions-button';
import '@videojs/html/ui/menu';
import '@videojs/html/ui/menu-content';
import '@videojs/html/ui/menu-item';
import '@videojs/html/ui/menu-separator';
import '@videojs/html/ui/menu-radio-item';
import '@videojs/html/ui/menu-item-indicator';
import '@videojs/html/ui/quality-radio-group';
import '@videojs/html/ui/audio-track-radio-group';
import '@videojs/html/ui/playback-rate-radio-group';
import '@videojs/html/ui/captions-radio-group';
import '@videojs/html/ui/pip-button';
import '@videojs/html/ui/cast-button';
import '@videojs/html/ui/airplay-button';
import '@videojs/html/ui/fullscreen-button';
import '@videojs/html/ui/error-dialog';
import '@videojs/html/ui/dialog-backdrop';
import '@videojs/html/ui/dialog-popup';
import '@videojs/html/ui/dialog-title';
import '@videojs/html/ui/dialog-description';
import '@videojs/html/ui/dialog-close';
import '@videojs/html/ui/hotkey';
import '@videojs/html/ui/gesture';
import '@videojs/html/ui/status-announcer';
import '@videojs/html/ui/status-indicator';
import '@videojs/html/ui/status-indicator-value';
import '@videojs/html/ui/volume-indicator';
import '@videojs/html/ui/volume-indicator-fill';
import '@videojs/html/ui/volume-indicator-value';
import '@videojs/html/ui/seek-indicator';
import '@videojs/html/ui/seek-indicator-value';
import './chapter';
import './rate';
import './volume-route';
import './time-field';
// The Usher icon family (25 icons on an 18x18 grid). Every <media-icon> in skin.html uses family="usher".
import './icons';
`,"../../src/video/time-field.ts":`import { PlayerController, type PropertyValues, playerContext, selectTime, UIElement } from '@videojs/html';
import { formatTime } from './chapter';

/**
 * Reads a typed time: \`25:00\`, \`1:02:03\`, or digits that fill from the right like timecode (\`2500\` → 25:00,
 * \`90\` → 1:30, \`10203\` → 1:02:03). Returns seconds, or null for anything else.
 */
export function parseTime(text: string): number | null {
  const value = text.trim();

  if (/^\\d{1,6}$/.test(value)) {
    const digits = value.padStart(6, '0');
    return Number(digits.slice(0, 2)) * 3600 + Number(digits.slice(2, 4)) * 60 + Number(digits.slice(4, 6));
  }

  const parts = value.split(':');
  if (parts.length < 2 || parts.length > 3 || !/^\\d+$/.test(parts[0]!)) return null;
  if (parts.slice(1).some((part) => !/^\\d{1,2}$/.test(part) || Number(part) > 59)) return null;

  return parts.map(Number).reduce((total, n) => total * 60 + n, 0);
}

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.localName));

/**
 * \`<usher-time-field>\`, inside the time slider next to its thumb: turns the marker into a field for a typed time
 * (§9.3). Opened by Enter on the focused thumb, the \`g\` key anywhere in the player, or a double-click on the marker.
 * Enter seeks through the store; Escape or blur cancels; a bad entry sets \`aria-invalid\` and keeps the field open.
 * Pointer handling stays the slider's own: the field only stops pointer events that start inside it.
 */
export class UsherTimeFieldElement extends UIElement {
  static readonly tagName = 'usher-time-field';

  readonly #time = new PlayerController(this, playerContext, selectTime);

  #disconnect: AbortController | null = null;
  #input: HTMLInputElement | null = null;
  #committing = false;
  /** The time at the first press on the marker, so a double-click can undo the seek its first click made. */
  #pressTime: number | null = null;
  #pressAt = 0;
  #doubleTap = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#disconnect = new AbortController();
    const { signal } = this.#disconnect;

    const slider = this.closest('media-time-slider');
    const thumb = slider?.querySelector<HTMLElement>('media-slider-thumb');
    const marker = slider?.querySelector<HTMLElement>('.usher-marker');
    const container = this.closest('media-container');
    const input = this.querySelector('input');
    if (!slider || !thumb || !marker || !container || !input) return;

    this.#input = input;
    this.hidden = true;

    // Keep the slider from treating presses inside the field as seeks.
    this.addEventListener('pointerdown', (event) => event.stopPropagation(), { signal });

    thumb.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Enter' && !event.altKey && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.open();
        }
      },
      { signal }
    );

    container.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'g' || event.altKey || event.ctrlKey || event.metaKey || isEditable(event.target)) return;
        event.preventDefault();
        this.open();
      },
      { signal }
    );

    // A double-click (mouse) or double-tap (touch, pen) on the marker opens the field. The slider has already moved
    // the playhead on the first press, so restore the time from before it.
    marker.addEventListener(
      'pointerdown',
      (event) => {
        const now = performance.now();
        this.#doubleTap = event.pointerType !== 'mouse' && now - this.#pressAt < 350;
        if (now - this.#pressAt > 500) this.#pressTime = this.#time.value?.currentTime ?? null;
        this.#pressAt = now;
      },
      { signal }
    );

    const reopen = () => {
      if (this.#pressTime === null || performance.now() - this.#pressAt > 600) return;
      const time = this.#pressTime;
      void this.#time.value?.seek(time);
      this.#pressTime = null;
      this.open(time);
    };

    slider.addEventListener('dblclick', reopen, { signal });
    slider.addEventListener(
      'pointerup',
      (event) => {
        if (event.pointerType === 'mouse' || !this.#doubleTap) return;
        this.#doubleTap = false;
        reopen();
      },
      { signal }
    );

    input.addEventListener('keydown', this.#onKeydown, { signal });
    input.addEventListener('input', () => input.removeAttribute('aria-invalid'), { signal });
    input.addEventListener(
      'blur',
      () => {
        if (!this.#committing) this.close(false);
      },
      { signal }
    );
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#disconnect?.abort();
    this.#disconnect = null;
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);
    const time = this.#time.value;
    if (!time || !this.#input) return;

    // The field is as wide as the longest time this media can show, so it covers the marker exactly.
    this.style.setProperty('--usher-field-chars', String(formatTime(time.duration, time.duration).length));
  }

  /** Opens the field showing \`at\` (default: the current time). */
  open(at?: number): void {
    const time = this.#time.value;
    const input = this.#input;
    const slider = this.closest('media-time-slider');
    if (!time || !input || !time.duration || slider?.hasAttribute('data-disabled')) return;

    // Label it with the slider's own translated name ("Seek"): no new strings.
    const label = slider?.querySelector('media-slider-thumb')?.getAttribute('aria-label');
    if (label) input.setAttribute('aria-label', label);

    input.value = formatTime(at ?? time.currentTime, time.duration);
    input.removeAttribute('aria-invalid');
    this.hidden = false;
    slider?.toggleAttribute('data-editing', true);
    input.focus();
    input.select();
  }

  close(restoreFocus: boolean): void {
    const slider = this.closest('media-time-slider');
    this.hidden = true;
    this.#committing = false;
    slider?.removeAttribute('data-editing');
    if (restoreFocus) slider?.querySelector<HTMLElement>('media-slider-thumb')?.focus();
  }

  #onKeydown = (event: KeyboardEvent) => {
    const input = this.#input;
    const time = this.#time.value;
    if (!input) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
      return;
    }

    if (event.key !== 'Enter') return;
    event.preventDefault();

    const seconds = parseTime(input.value);
    const duration = this.#time.value?.duration ?? 0;
    if (seconds === null || !time) {
      input.setAttribute('aria-invalid', 'true');
      return;
    }

    // Seek, then keep focus here until the status announcer has spoken the new time (it stays quiet while a slider
    // has focus), and only then hand focus back to the thumb.
    const target = Math.min(seconds, duration);
    this.#committing = true;
    input.value = formatTime(target, duration);
    input.readOnly = true;
    void time
      .seek(target)
      .catch(() => undefined)
      .then(() => new Promise((resolve) => setTimeout(resolve, 450)))
      .then(() => {
        input.readOnly = false;
        if (this.#committing) this.close(document.activeElement === input);
      });
  };
}

if (!customElements.get(UsherTimeFieldElement.tagName)) {
  customElements.define(UsherTimeFieldElement.tagName, UsherTimeFieldElement);
}
`,"../../src/video/volume-route.ts":`import { UIElement } from '@videojs/html';

/**
 * \`<usher-volume-route>\`, inside the settings menu's Volume page. The page's row is only needed where the inline volume
 * line is not shown (below 512px, set in skin.css) and only where volume can be set (not on iOS). The menu skips rows by
 * their \`data-hidden\` attribute, not by CSS, so this mirrors both conditions onto the row: it reads the inline slider's
 * computed display, which keeps the breakpoint in one place, the stylesheet.
 */
export class UsherVolumeRouteElement extends UIElement {
  static readonly tagName = 'usher-volume-route';

  #resize: ResizeObserver | null = null;
  #attributes: MutationObserver | null = null;

  override connectedCallback(): void {
    super.connectedCallback();

    const container = this.closest('media-container');
    const page = this.closest('media-menu-content');
    const slider = page?.querySelector('media-volume-slider');
    const inline = container?.querySelector('.usher-volume-inline');

    if (!container || !page?.id || !slider || !inline) return;

    const sync = () => {
      const row = container.querySelector(\`[commandfor="\${page.id}"]\`);
      const unavailable = slider.hasAttribute('hidden') || slider.hasAttribute('data-hidden');
      const inlineShown = getComputedStyle(inline).display !== 'none';

      row?.toggleAttribute('data-hidden', unavailable || inlineShown);
    };

    this.#resize = new ResizeObserver(sync);
    this.#resize.observe(container);
    this.#attributes = new MutationObserver(sync);
    this.#attributes.observe(slider, { attributes: true, attributeFilter: ['hidden', 'data-hidden'] });
    sync();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#resize?.disconnect();
    this.#attributes?.disconnect();
    this.#resize = this.#attributes = null;
  }
}

if (!customElements.get(UsherVolumeRouteElement.tagName)) {
  customElements.define(UsherVolumeRouteElement.tagName, UsherVolumeRouteElement);
}
`});function n(e){let t={};for(let n of e.matchAll(/([\w-]+)="([^"]*)"/g))t[n[1]]=n[2];return t}function r(e){return e.replace(/&lt;/g,`<`).replace(/&gt;/g,`>`).replace(/&quot;/g,`"`).replace(/&amp;/g,`&`)}var i=[...e.matchAll(/<media-hotkey\b(?:[^>"]|"[^"]*")*>/g)].map(e=>{let t=n(e[0]);return{keys:r(t.keys??``),action:t.action??``,value:t.value?Number(t.value):void 0}}),a=[...e.matchAll(/<media-gesture\b(?:[^>"]|"[^"]*")*>/g)].map(e=>n(e[0]));function o(e){let n=e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),r=i.some(t=>t.keys.split(/[\s,]+/).some(t=>t.toLowerCase()===e.toLowerCase())),a=Object.values(t).some(e=>RegExp(`\\bkey\\s*[!=]==?\\s*['"]${n}['"]|['"]${n}['"]\\s*[!=]==?\\s*(?:event\\.)?key\\b`).test(e));return r||a}var s={typeTime:o(`g`),shortcutSheet:o(`?`)},c=10,l=5,u=new Set([`ArrowLeft`,`ArrowDown`,`j`,`J`]),d={Space:`Space`,ArrowRight:`→`,ArrowLeft:`←`,ArrowUp:`↑`,ArrowDown:`↓`,Home:`Home`,End:`End`,Escape:`Esc`,Enter:`Enter`},f={"→":`Right arrow`,"←":`Left arrow`,"↑":`Up arrow`,"↓":`Down arrow`};function p(e){return d[e]??(e.length===1?e.toUpperCase():e)}function m(e){let t=e.value===void 0?u.has(e.keys):e.value<0,n=Math.abs(e.value??c);switch(e.action){case`togglePaused`:return`Play or pause`;case`toggleMuted`:return`Mute or unmute`;case`seekStep`:return t?`Back ${n} seconds`:`Forward ${n} seconds`;case`volumeStep`:return t?`Volume down ${Math.abs(e.value??l)}%`:`Volume up ${Math.abs(e.value??l)}%`;case`seekToPercent`:return e.value===0?`Go to the start`:e.value===100?`Go to the end`:e.value===void 0?`Go to 0% to 90% of the video`:`Go to ${e.value}%`;case`speedUp`:return`Faster`;case`speedDown`:return`Slower`;case`toggleFullscreen`:return`Full screen on or off`;case`toggleSubtitles`:return`Captions on or off`;case`togglePictureInPicture`:return`Picture in picture on or off`;default:return e.action}}function h(){let e=[];for(let t of i){let n=m(t),r=t.keys===`0-9`?[`0`,`9`]:[p(t.keys)],i=e.find(e=>e.action===n);i?i.keys.push(...r):e.push({keys:r,action:t.keys===`0-9`?`${n}`:n})}return s.typeTime&&e.push({keys:[`G`],action:`Type a time and go there`}),s.shortcutSheet&&e.push({keys:[`?`],action:`Show the shortcuts`}),e}function g(e){let t=document.createElement(`kbd`);return t.textContent=e,f[e]&&t.setAttribute(`aria-label`,f[e]),t}function _(e){let t=document.createElement(`span`);return t.className=`sep`,t.textContent=e,t}function v(e){e.tBodies[0].replaceChildren(...h().map((e,t)=>{let n=document.createElement(`tr`),r=document.createElement(`td`),a=document.createElement(`td`),o=i.some(e=>e.keys===`0-9`)&&e.keys.join(``)===`09`;return e.keys.forEach((e,t)=>{t>0&&r.append(_(o?`to`:`or`)),r.append(g(e))}),a.textContent=e.action,n.append(r,a),n.dataset.row=String(t),n}))}function y(){let e=(e,t,n)=>a.some(r=>r.type===e&&r.action===t&&(!n||r.region===n)),t=[];e(`tap`,`toggleControls`)&&t.push({title:`Tap to show the controls.`,text:`A tap on the picture shows or hides them. On touch screens every button grows to 48 by 48 pixels, and so does the line’s hit area.`});let n=e(`doubletap`,`seekStep`,`left`),r=e(`doubletap`,`seekStep`,`right`),i=e(`doubletap`,`toggleFullscreen`,`center`);return(n||r)&&t.push({title:`Double-tap to skip.`,text:`Double-tap the ${n&&r?`left or right side`:n?`left side`:`right side`} to skip ${n&&r?`back or forward`:n?`back`:`forward`} ${c} seconds${i?`, or the middle for full screen`:``}.`}),/usher-transport/.test(`<media-container class="media-skin usher" data-theme="usher" data-preset="video">
<!-- Add a compatible media component here. -->
<media-poster class="usher-poster">
<img alt="" decoding="async" class="usher-poster-image">
</media-poster>
<media-buffering-indicator class="usher-buffering">
</media-buffering-indicator>
<media-controls>
<div class="usher-frame">
<media-controls-backdrop class="usher-shade">
</media-controls-backdrop>
<media-controls-content class="usher-content">
<media-tooltip-group>
<media-title class="usher-title">
</media-title>
<media-controls-group class="usher-center">
<media-seek-button seconds="-10" class="media-button usher-transport">
<span class="usher-transport-glyph">
<media-icon family="usher" name="seek" class="usher-icon usher-transport-icon">
</media-icon>
<span class="usher-transport-label" aria-hidden="true">10</span>
</span>
</media-seek-button>
<media-play-button class="media-button usher-hero">
<span class="usher-hero-glyph">
<media-icon family="usher" name="spinner" class="usher-icon usher-spinner">
</media-icon>
<media-icon family="usher" name="restart" class="usher-icon usher-play-restart">
</media-icon>
<media-icon family="usher" name="play" class="usher-icon usher-play-play">
</media-icon>
<media-icon family="usher" name="pause" class="usher-icon usher-play-pause">
</media-icon>
</span>
<media-time type="duration" class="usher-hero-time">
</media-time>
</media-play-button>
<media-seek-button seconds="10" class="media-button usher-transport">
<span class="usher-transport-glyph">
<media-icon family="usher" name="seek" class="usher-icon usher-transport-icon">
</media-icon>
<span class="usher-transport-label" aria-hidden="true">10</span>
</span>
</media-seek-button>
</media-controls-group>
<div class="usher-bottom">
<div class="usher-line-row">
<media-time-slider class="usher-slider">
<media-time-slider-chapters class="usher-chapters">
<template>
<div class="usher-chapter">
<div class="usher-chapter-line">
<media-slider-track class="usher-track">
<media-slider-buffer class="usher-buffer">
</media-slider-buffer>
<media-slider-fill class="usher-fill">
</media-slider-fill>
</media-slider-track>
</div>
<span class="usher-chapter-name">
</span>
</div>
</template>
</media-time-slider-chapters>
<usher-chapter-names hidden>
</usher-chapter-names>
<media-slider-preview class="usher-preview">
<span class="usher-preview-card">
<media-slider-thumbnail class="usher-thumbnail">
<img alt="" aria-hidden="true" decoding="async" class="usher-thumbnail-image">
</media-slider-thumbnail>
<media-time-slider-chapter-title class="usher-preview-chapter">
</media-time-slider-chapter-title>
</span>
</media-slider-preview>
<span class="usher-ghost" aria-hidden="true">
<media-slider-value type="pointer">
</media-slider-value>
</span>
<media-slider-thumb class="usher-thumb">
<span class="usher-marker" aria-hidden="true">
<media-icon family="usher" name="spinner" class="usher-icon usher-spinner">
</media-icon>
<media-slider-value type="current" class="usher-marker-time">
</media-slider-value>
<media-slider-value type="pointer" class="usher-marker-pointer">
</media-slider-value>
<usher-rate class="usher-marker-rate" hidden>
</usher-rate>
</span>
</media-slider-thumb>
<usher-time-field class="usher-field" hidden>
<input class="usher-field-input" type="text" inputmode="numeric" enterkeyhint="go" autocomplete="off" autocorrect="off" spellcheck="false">
</usher-time-field>
</media-time-slider>
<media-time type="duration" class="usher-duration">
</media-time>
</div>
<div class="usher-row">
<media-controls-group class="usher-row-start">
<media-play-button class="media-button usher-play" id="usher-play">
<media-icon family="usher" name="restart" class="usher-icon usher-play-restart">
</media-icon>
<media-icon family="usher" name="play" class="usher-icon usher-play-play">
</media-icon>
<media-icon family="usher" name="pause" class="usher-icon usher-play-pause">
</media-icon>
</media-play-button>
<media-tooltip trigger="usher-play" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-mute-button class="media-button usher-mute" id="usher-mute">
<media-icon family="usher" name="volume-off" class="usher-icon usher-mute-off">
</media-icon>
<media-icon family="usher" name="volume-low" class="usher-icon usher-mute-low">
</media-icon>
<media-icon family="usher" name="volume-high" class="usher-icon usher-mute-high">
</media-icon>
</media-mute-button>
<media-tooltip trigger="usher-mute" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-volume-slider class="usher-volume usher-volume-inline">
<media-slider-track class="usher-volume-track">
<media-slider-fill class="usher-volume-fill">
</media-slider-fill>
</media-slider-track>
<media-slider-thumb class="usher-volume-thumb">
<media-slider-value class="usher-volume-value">
</media-slider-value>
</media-slider-thumb>
</media-volume-slider>
<usher-chapter class="usher-chapter-slot">
<button type="button" tabindex="0" commandfor="usher-chapter-menu" class="media-button usher-chapter-button">
<span class="usher-chapter-title">
</span>
<media-icon family="usher" name="chevron" class="usher-icon usher-chapter-chevron">
</media-icon>
</button>
<media-menu side="top" align="start" class="media-popup usher-menu usher-chapter-menu" id="usher-chapter-menu">
<media-menu-content class="media-menu-content">
<usher-chapter-list class="usher-chapter-list">
</usher-chapter-list>
</media-menu-content>
</media-menu>
</usher-chapter>
</media-controls-group>
<media-controls-group class="usher-row-end">
<media-captions-button class="media-button usher-captions" id="usher-captions">
<media-icon family="usher" name="captions-off" class="usher-icon usher-captions-off">
</media-icon>
<media-icon family="usher" name="captions-on" class="usher-icon usher-captions-on">
</media-icon>
</media-captions-button>
<media-tooltip trigger="usher-captions" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<button type="button" tabindex="0" commandfor="usher-settings-menu" class="media-button usher-settings" id="usher-settings">
<media-icon family="usher" name="gear" class="usher-icon usher-gear">
</media-icon>
<media-text class="usher-visually-hidden" token="menu.settings">Settings</media-text>
</button>
<media-tooltip trigger="usher-settings" side="top" class="media-popup usher-tooltip">
<media-text token="menu.settings">Settings</media-text>
</media-tooltip>
<media-menu side="top" align="end" class="media-popup usher-menu" id="usher-settings-menu">
<media-menu-content class="media-menu-content">
<media-menu-item commandfor="usher-menu-volume" class="media-menu-item usher-menu-volume-item">
<media-icon family="usher" name="volume-high" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="volume.label">Volume</media-text>
<span class="media-menu-hint">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-volume">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="volume.label">Volume</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<usher-volume-route hidden>
</usher-volume-route>
<div class="usher-menu-volume-row">
<media-volume-slider class="usher-volume usher-volume-menu">
<media-slider-track class="usher-volume-track">
<media-slider-fill class="usher-volume-fill">
</media-slider-fill>
</media-slider-track>
<media-slider-thumb class="usher-volume-thumb">
<media-slider-value class="usher-volume-value">
</media-slider-value>
</media-slider-thumb>
</media-volume-slider>
</div>
</media-menu-content>
<media-menu-item commandfor="usher-menu-quality" class="media-menu-item">
<media-icon family="usher" name="quality" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.quality">Quality</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-quality">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.quality">Quality</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-quality-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span class="media-menu-label">
<span data-part="label">
</span>
<sup data-part="tier" class="media-menu-tier">
</sup>
</span>
<span data-part="badge" class="media-menu-badge">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-quality-radio-group>
</media-menu-content>
<media-menu-item commandfor="usher-menu-audio" class="media-menu-item">
<media-icon family="usher" name="speech" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.audio">Audio</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-audio">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.audio">Audio</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-audio-track-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span data-part="label" class="media-menu-label">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-audio-track-radio-group>
</media-menu-content>
<media-menu-item commandfor="usher-menu-speed" class="media-menu-item">
<media-icon family="usher" name="speed" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.speed">Speed</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-speed">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.speed">Speed</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-playback-rate-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span data-part="label" class="media-menu-label">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-playback-rate-radio-group>
</media-menu-content>
<media-menu-item commandfor="usher-menu-captions" class="media-menu-item">
<media-icon family="usher" name="captions-off" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.captions">Captions</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-captions">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.captions">Captions</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-captions-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span data-part="label" class="media-menu-label">
</span>
<span data-part="badge" class="media-menu-badge">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-captions-radio-group>
</media-menu-content>
</media-menu-content>
</media-menu>
<media-pip-button class="media-button usher-pip" id="usher-pip">
<media-icon family="usher" name="pip-enter" class="usher-icon usher-pip-enter">
</media-icon>
<media-icon family="usher" name="pip-exit" class="usher-icon usher-pip-exit">
</media-icon>
</media-pip-button>
<media-tooltip trigger="usher-pip" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-cast-button class="media-button usher-cast" id="usher-cast">
<media-icon family="usher" name="cast-enter" class="usher-icon usher-cast-enter">
</media-icon>
<media-icon family="usher" name="cast-exit" class="usher-icon usher-cast-exit">
</media-icon>
</media-cast-button>
<media-tooltip trigger="usher-cast" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-airplay-button class="media-button usher-airplay" id="usher-airplay">
<media-icon family="usher" name="airplay-enter" class="usher-icon usher-airplay-enter">
</media-icon>
<media-icon family="usher" name="airplay-exit" class="usher-icon usher-airplay-exit">
</media-icon>
</media-airplay-button>
<media-tooltip trigger="usher-airplay" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-fullscreen-button class="media-button usher-fullscreen" id="usher-fullscreen">
<media-icon family="usher" name="fullscreen-enter" class="usher-icon usher-fullscreen-enter">
</media-icon>
<media-icon family="usher" name="fullscreen-exit" class="usher-icon usher-fullscreen-exit">
</media-icon>
</media-fullscreen-button>
<media-tooltip trigger="usher-fullscreen" side="top" align="end" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
</media-controls-group>
</div>
</div>
</media-tooltip-group>
</media-controls-content>
</div>
</media-controls>
<media-error-dialog>
<media-dialog-backdrop class="usher-dialog-backdrop">
</media-dialog-backdrop>
<media-dialog-popup class="usher-dialog">
<media-dialog-title class="usher-dialog-title">
</media-dialog-title>
<media-dialog-description class="usher-dialog-description">
</media-dialog-description>
<media-dialog-close class="media-button usher-dialog-close">
</media-dialog-close>
</media-dialog-popup>
</media-error-dialog>
<media-hotkey keys="Space" action="togglePaused">
</media-hotkey>
<media-hotkey keys="k" action="togglePaused">
</media-hotkey>
<media-hotkey keys="m" action="toggleMuted">
</media-hotkey>
<media-hotkey keys="ArrowRight" action="seekStep">
</media-hotkey>
<media-hotkey keys="ArrowLeft" action="seekStep">
</media-hotkey>
<media-hotkey keys="l" action="seekStep">
</media-hotkey>
<media-hotkey keys="j" action="seekStep">
</media-hotkey>
<media-hotkey keys="ArrowUp" action="volumeStep">
</media-hotkey>
<media-hotkey keys="ArrowDown" action="volumeStep">
</media-hotkey>
<media-hotkey keys="0-9" action="seekToPercent">
</media-hotkey>
<media-hotkey keys="Home" action="seekToPercent" value="0">
</media-hotkey>
<media-hotkey keys="End" action="seekToPercent" value="100">
</media-hotkey>
<media-hotkey keys=">" action="speedUp">
</media-hotkey>
<media-hotkey keys="<" action="speedDown">
</media-hotkey>
<media-hotkey keys="f" action="toggleFullscreen">
</media-hotkey>
<media-hotkey keys="c" action="toggleSubtitles">
</media-hotkey>
<media-hotkey keys="i" action="togglePictureInPicture">
</media-hotkey>
<media-gesture type="tap" action="togglePaused" pointer="mouse" region="center">
</media-gesture>
<media-gesture type="tap" action="toggleControls" pointer="touch">
</media-gesture>
<media-gesture type="doubletap" action="seekStep" region="left">
</media-gesture>
<media-gesture type="doubletap" action="toggleFullscreen" region="center">
</media-gesture>
<media-gesture type="doubletap" action="seekStep" region="right">
</media-gesture>
<media-status-announcer class="usher-visually-hidden">
</media-status-announcer>
<div aria-hidden="true" class="usher-indicators">
<media-status-indicator actions="togglePaused,toggleSubtitles,toggleFullscreen,togglePictureInPicture" class="usher-status">
<media-icon family="usher" name="play" class="usher-icon usher-status-play">
</media-icon>
<media-icon family="usher" name="pause" class="usher-icon usher-status-pause">
</media-icon>
<media-icon family="usher" name="captions-on" class="usher-icon usher-status-captions-on">
</media-icon>
<media-icon family="usher" name="captions-off" class="usher-icon usher-status-captions-off">
</media-icon>
<media-icon family="usher" name="fullscreen-enter" class="usher-icon usher-status-fullscreen">
</media-icon>
<media-icon family="usher" name="fullscreen-exit" class="usher-icon usher-status-exit-fullscreen">
</media-icon>
<media-icon family="usher" name="pip-enter" class="usher-icon usher-status-pip">
</media-icon>
<media-icon family="usher" name="pip-exit" class="usher-icon usher-status-exit-pip">
</media-icon>
</media-status-indicator>
<usher-rate-indicator class="usher-rate-slot">
<media-status-indicator actions="speedUp,speedDown" class="usher-hollow usher-rate-indicator">
<media-icon family="usher" name="speed" class="usher-icon">
</media-icon>
<media-status-indicator-value class="usher-indicator-value">
</media-status-indicator-value>
</media-status-indicator>
</usher-rate-indicator>
<media-volume-indicator class="usher-hollow usher-volume-indicator">
<media-volume-indicator-fill class="usher-volume-indicator-fill">
<media-icon family="usher" name="volume-high" class="usher-icon usher-volume-indicator-high">
</media-icon>
<media-icon family="usher" name="volume-low" class="usher-icon usher-volume-indicator-low">
</media-icon>
<media-icon family="usher" name="volume-off" class="usher-icon usher-volume-indicator-off">
</media-icon>
<media-volume-indicator-value class="usher-indicator-value">
</media-volume-indicator-value>
</media-volume-indicator-fill>
</media-volume-indicator>
<media-seek-indicator class="usher-hollow usher-seek-indicator">
<media-icon family="usher" name="seek" class="usher-icon">
</media-icon>
<media-seek-indicator-value class="usher-indicator-value">
</media-seek-indicator-value>
</media-seek-indicator>
</div>
</media-container>
`)&&t.push({title:`Thumbs first in portrait.`,text:`In portrait and square players, back 10, play and forward 10 sit in the middle of the picture, within reach of a thumb.`}),t}var b=`<media-container class="media-skin usher" data-theme="usher" data-preset="video">
<!-- Add a compatible media component here. -->
<media-poster class="usher-poster">
<img alt="" decoding="async" class="usher-poster-image">
</media-poster>
<media-buffering-indicator class="usher-buffering">
</media-buffering-indicator>
<media-controls>
<div class="usher-frame">
<media-controls-backdrop class="usher-shade">
</media-controls-backdrop>
<media-controls-content class="usher-content">
<media-tooltip-group>
<media-title class="usher-title">
</media-title>
<media-controls-group class="usher-center">
<media-seek-button seconds="-10" class="media-button usher-transport">
<span class="usher-transport-glyph">
<media-icon family="usher" name="seek" class="usher-icon usher-transport-icon">
</media-icon>
<span class="usher-transport-label" aria-hidden="true">10</span>
</span>
</media-seek-button>
<media-play-button class="media-button usher-hero">
<span class="usher-hero-glyph">
<media-icon family="usher" name="spinner" class="usher-icon usher-spinner">
</media-icon>
<media-icon family="usher" name="restart" class="usher-icon usher-play-restart">
</media-icon>
<media-icon family="usher" name="play" class="usher-icon usher-play-play">
</media-icon>
<media-icon family="usher" name="pause" class="usher-icon usher-play-pause">
</media-icon>
</span>
<media-time type="duration" class="usher-hero-time">
</media-time>
</media-play-button>
<media-seek-button seconds="10" class="media-button usher-transport">
<span class="usher-transport-glyph">
<media-icon family="usher" name="seek" class="usher-icon usher-transport-icon">
</media-icon>
<span class="usher-transport-label" aria-hidden="true">10</span>
</span>
</media-seek-button>
</media-controls-group>
<div class="usher-bottom">
<div class="usher-line-row">
<media-time-slider class="usher-slider">
<media-time-slider-chapters class="usher-chapters">
<template>
<div class="usher-chapter">
<div class="usher-chapter-line">
<media-slider-track class="usher-track">
<media-slider-buffer class="usher-buffer">
</media-slider-buffer>
<media-slider-fill class="usher-fill">
</media-slider-fill>
</media-slider-track>
</div>
<span class="usher-chapter-name">
</span>
</div>
</template>
</media-time-slider-chapters>
<usher-chapter-names hidden>
</usher-chapter-names>
<media-slider-preview class="usher-preview">
<span class="usher-preview-card">
<media-slider-thumbnail class="usher-thumbnail">
<img alt="" aria-hidden="true" decoding="async" class="usher-thumbnail-image">
</media-slider-thumbnail>
<media-time-slider-chapter-title class="usher-preview-chapter">
</media-time-slider-chapter-title>
</span>
</media-slider-preview>
<span class="usher-ghost" aria-hidden="true">
<media-slider-value type="pointer">
</media-slider-value>
</span>
<media-slider-thumb class="usher-thumb">
<span class="usher-marker" aria-hidden="true">
<media-icon family="usher" name="spinner" class="usher-icon usher-spinner">
</media-icon>
<media-slider-value type="current" class="usher-marker-time">
</media-slider-value>
<media-slider-value type="pointer" class="usher-marker-pointer">
</media-slider-value>
<usher-rate class="usher-marker-rate" hidden>
</usher-rate>
</span>
</media-slider-thumb>
<usher-time-field class="usher-field" hidden>
<input class="usher-field-input" type="text" inputmode="numeric" enterkeyhint="go" autocomplete="off" autocorrect="off" spellcheck="false">
</usher-time-field>
</media-time-slider>
<media-time type="duration" class="usher-duration">
</media-time>
</div>
<div class="usher-row">
<media-controls-group class="usher-row-start">
<media-play-button class="media-button usher-play" id="usher-play">
<media-icon family="usher" name="restart" class="usher-icon usher-play-restart">
</media-icon>
<media-icon family="usher" name="play" class="usher-icon usher-play-play">
</media-icon>
<media-icon family="usher" name="pause" class="usher-icon usher-play-pause">
</media-icon>
</media-play-button>
<media-tooltip trigger="usher-play" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-mute-button class="media-button usher-mute" id="usher-mute">
<media-icon family="usher" name="volume-off" class="usher-icon usher-mute-off">
</media-icon>
<media-icon family="usher" name="volume-low" class="usher-icon usher-mute-low">
</media-icon>
<media-icon family="usher" name="volume-high" class="usher-icon usher-mute-high">
</media-icon>
</media-mute-button>
<media-tooltip trigger="usher-mute" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-volume-slider class="usher-volume usher-volume-inline">
<media-slider-track class="usher-volume-track">
<media-slider-fill class="usher-volume-fill">
</media-slider-fill>
</media-slider-track>
<media-slider-thumb class="usher-volume-thumb">
<media-slider-value class="usher-volume-value">
</media-slider-value>
</media-slider-thumb>
</media-volume-slider>
<usher-chapter class="usher-chapter-slot">
<button type="button" tabindex="0" commandfor="usher-chapter-menu" class="media-button usher-chapter-button">
<span class="usher-chapter-title">
</span>
<media-icon family="usher" name="chevron" class="usher-icon usher-chapter-chevron">
</media-icon>
</button>
<media-menu side="top" align="start" class="media-popup usher-menu usher-chapter-menu" id="usher-chapter-menu">
<media-menu-content class="media-menu-content">
<usher-chapter-list class="usher-chapter-list">
</usher-chapter-list>
</media-menu-content>
</media-menu>
</usher-chapter>
</media-controls-group>
<media-controls-group class="usher-row-end">
<media-captions-button class="media-button usher-captions" id="usher-captions">
<media-icon family="usher" name="captions-off" class="usher-icon usher-captions-off">
</media-icon>
<media-icon family="usher" name="captions-on" class="usher-icon usher-captions-on">
</media-icon>
</media-captions-button>
<media-tooltip trigger="usher-captions" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<button type="button" tabindex="0" commandfor="usher-settings-menu" class="media-button usher-settings" id="usher-settings">
<media-icon family="usher" name="gear" class="usher-icon usher-gear">
</media-icon>
<media-text class="usher-visually-hidden" token="menu.settings">Settings</media-text>
</button>
<media-tooltip trigger="usher-settings" side="top" class="media-popup usher-tooltip">
<media-text token="menu.settings">Settings</media-text>
</media-tooltip>
<media-menu side="top" align="end" class="media-popup usher-menu" id="usher-settings-menu">
<media-menu-content class="media-menu-content">
<media-menu-item commandfor="usher-menu-volume" class="media-menu-item usher-menu-volume-item">
<media-icon family="usher" name="volume-high" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="volume.label">Volume</media-text>
<span class="media-menu-hint">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-volume">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="volume.label">Volume</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<usher-volume-route hidden>
</usher-volume-route>
<div class="usher-menu-volume-row">
<media-volume-slider class="usher-volume usher-volume-menu">
<media-slider-track class="usher-volume-track">
<media-slider-fill class="usher-volume-fill">
</media-slider-fill>
</media-slider-track>
<media-slider-thumb class="usher-volume-thumb">
<media-slider-value class="usher-volume-value">
</media-slider-value>
</media-slider-thumb>
</media-volume-slider>
</div>
</media-menu-content>
<media-menu-item commandfor="usher-menu-quality" class="media-menu-item">
<media-icon family="usher" name="quality" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.quality">Quality</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-quality">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.quality">Quality</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-quality-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span class="media-menu-label">
<span data-part="label">
</span>
<sup data-part="tier" class="media-menu-tier">
</sup>
</span>
<span data-part="badge" class="media-menu-badge">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-quality-radio-group>
</media-menu-content>
<media-menu-item commandfor="usher-menu-audio" class="media-menu-item">
<media-icon family="usher" name="speech" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.audio">Audio</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-audio">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.audio">Audio</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-audio-track-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span data-part="label" class="media-menu-label">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-audio-track-radio-group>
</media-menu-content>
<media-menu-item commandfor="usher-menu-speed" class="media-menu-item">
<media-icon family="usher" name="speed" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.speed">Speed</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-speed">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.speed">Speed</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-playback-rate-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span data-part="label" class="media-menu-label">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-playback-rate-radio-group>
</media-menu-content>
<media-menu-item commandfor="usher-menu-captions" class="media-menu-item">
<media-icon family="usher" name="captions-off" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.captions">Captions</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-captions">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.captions">Captions</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-captions-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span data-part="label" class="media-menu-label">
</span>
<span data-part="badge" class="media-menu-badge">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-captions-radio-group>
</media-menu-content>
</media-menu-content>
</media-menu>
<media-pip-button class="media-button usher-pip" id="usher-pip">
<media-icon family="usher" name="pip-enter" class="usher-icon usher-pip-enter">
</media-icon>
<media-icon family="usher" name="pip-exit" class="usher-icon usher-pip-exit">
</media-icon>
</media-pip-button>
<media-tooltip trigger="usher-pip" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-cast-button class="media-button usher-cast" id="usher-cast">
<media-icon family="usher" name="cast-enter" class="usher-icon usher-cast-enter">
</media-icon>
<media-icon family="usher" name="cast-exit" class="usher-icon usher-cast-exit">
</media-icon>
</media-cast-button>
<media-tooltip trigger="usher-cast" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-airplay-button class="media-button usher-airplay" id="usher-airplay">
<media-icon family="usher" name="airplay-enter" class="usher-icon usher-airplay-enter">
</media-icon>
<media-icon family="usher" name="airplay-exit" class="usher-icon usher-airplay-exit">
</media-icon>
</media-airplay-button>
<media-tooltip trigger="usher-airplay" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-fullscreen-button class="media-button usher-fullscreen" id="usher-fullscreen">
<media-icon family="usher" name="fullscreen-enter" class="usher-icon usher-fullscreen-enter">
</media-icon>
<media-icon family="usher" name="fullscreen-exit" class="usher-icon usher-fullscreen-exit">
</media-icon>
</media-fullscreen-button>
<media-tooltip trigger="usher-fullscreen" side="top" align="end" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
</media-controls-group>
</div>
</div>
</media-tooltip-group>
</media-controls-content>
</div>
</media-controls>
<media-error-dialog>
<media-dialog-backdrop class="usher-dialog-backdrop">
</media-dialog-backdrop>
<media-dialog-popup class="usher-dialog">
<media-dialog-title class="usher-dialog-title">
</media-dialog-title>
<media-dialog-description class="usher-dialog-description">
</media-dialog-description>
<media-dialog-close class="media-button usher-dialog-close">
</media-dialog-close>
</media-dialog-popup>
</media-error-dialog>
<media-hotkey keys="Space" action="togglePaused">
</media-hotkey>
<media-hotkey keys="k" action="togglePaused">
</media-hotkey>
<media-hotkey keys="m" action="toggleMuted">
</media-hotkey>
<media-hotkey keys="ArrowRight" action="seekStep">
</media-hotkey>
<media-hotkey keys="ArrowLeft" action="seekStep">
</media-hotkey>
<media-hotkey keys="l" action="seekStep">
</media-hotkey>
<media-hotkey keys="j" action="seekStep">
</media-hotkey>
<media-hotkey keys="ArrowUp" action="volumeStep">
</media-hotkey>
<media-hotkey keys="ArrowDown" action="volumeStep">
</media-hotkey>
<media-hotkey keys="0-9" action="seekToPercent">
</media-hotkey>
<media-hotkey keys="Home" action="seekToPercent" value="0">
</media-hotkey>
<media-hotkey keys="End" action="seekToPercent" value="100">
</media-hotkey>
<media-hotkey keys=">" action="speedUp">
</media-hotkey>
<media-hotkey keys="<" action="speedDown">
</media-hotkey>
<media-hotkey keys="f" action="toggleFullscreen">
</media-hotkey>
<media-hotkey keys="c" action="toggleSubtitles">
</media-hotkey>
<media-hotkey keys="i" action="togglePictureInPicture">
</media-hotkey>
<media-gesture type="tap" action="togglePaused" pointer="mouse" region="center">
</media-gesture>
<media-gesture type="tap" action="toggleControls" pointer="touch">
</media-gesture>
<media-gesture type="doubletap" action="seekStep" region="left">
</media-gesture>
<media-gesture type="doubletap" action="toggleFullscreen" region="center">
</media-gesture>
<media-gesture type="doubletap" action="seekStep" region="right">
</media-gesture>
<media-status-announcer class="usher-visually-hidden">
</media-status-announcer>
<div aria-hidden="true" class="usher-indicators">
<media-status-indicator actions="togglePaused,toggleSubtitles,toggleFullscreen,togglePictureInPicture" class="usher-status">
<media-icon family="usher" name="play" class="usher-icon usher-status-play">
</media-icon>
<media-icon family="usher" name="pause" class="usher-icon usher-status-pause">
</media-icon>
<media-icon family="usher" name="captions-on" class="usher-icon usher-status-captions-on">
</media-icon>
<media-icon family="usher" name="captions-off" class="usher-icon usher-status-captions-off">
</media-icon>
<media-icon family="usher" name="fullscreen-enter" class="usher-icon usher-status-fullscreen">
</media-icon>
<media-icon family="usher" name="fullscreen-exit" class="usher-icon usher-status-exit-fullscreen">
</media-icon>
<media-icon family="usher" name="pip-enter" class="usher-icon usher-status-pip">
</media-icon>
<media-icon family="usher" name="pip-exit" class="usher-icon usher-status-exit-pip">
</media-icon>
</media-status-indicator>
<usher-rate-indicator class="usher-rate-slot">
<media-status-indicator actions="speedUp,speedDown" class="usher-hollow usher-rate-indicator">
<media-icon family="usher" name="speed" class="usher-icon">
</media-icon>
<media-status-indicator-value class="usher-indicator-value">
</media-status-indicator-value>
</media-status-indicator>
</usher-rate-indicator>
<media-volume-indicator class="usher-hollow usher-volume-indicator">
<media-volume-indicator-fill class="usher-volume-indicator-fill">
<media-icon family="usher" name="volume-high" class="usher-icon usher-volume-indicator-high">
</media-icon>
<media-icon family="usher" name="volume-low" class="usher-icon usher-volume-indicator-low">
</media-icon>
<media-icon family="usher" name="volume-off" class="usher-icon usher-volume-indicator-off">
</media-icon>
<media-volume-indicator-value class="usher-indicator-value">
</media-volume-indicator-value>
</media-volume-indicator-fill>
</media-volume-indicator>
<media-seek-indicator class="usher-hollow usher-seek-indicator">
<media-icon family="usher" name="seek" class="usher-icon">
</media-icon>
<media-seek-indicator-value class="usher-indicator-value">
</media-seek-indicator-value>
</media-seek-indicator>
</div>
</media-container>
`.match(/<media-container\b(?:[^>"]|"[^"]*")*>/)?.[0]??`<media-container>`,x=`<media-container class="media-skin usher" data-theme="usher" data-preset="video">
<!-- Add a compatible media component here. -->
<media-poster class="usher-poster">
<img alt="" decoding="async" class="usher-poster-image">
</media-poster>
<media-buffering-indicator class="usher-buffering">
</media-buffering-indicator>
<media-controls>
<div class="usher-frame">
<media-controls-backdrop class="usher-shade">
</media-controls-backdrop>
<media-controls-content class="usher-content">
<media-tooltip-group>
<media-title class="usher-title">
</media-title>
<media-controls-group class="usher-center">
<media-seek-button seconds="-10" class="media-button usher-transport">
<span class="usher-transport-glyph">
<media-icon family="usher" name="seek" class="usher-icon usher-transport-icon">
</media-icon>
<span class="usher-transport-label" aria-hidden="true">10</span>
</span>
</media-seek-button>
<media-play-button class="media-button usher-hero">
<span class="usher-hero-glyph">
<media-icon family="usher" name="spinner" class="usher-icon usher-spinner">
</media-icon>
<media-icon family="usher" name="restart" class="usher-icon usher-play-restart">
</media-icon>
<media-icon family="usher" name="play" class="usher-icon usher-play-play">
</media-icon>
<media-icon family="usher" name="pause" class="usher-icon usher-play-pause">
</media-icon>
</span>
<media-time type="duration" class="usher-hero-time">
</media-time>
</media-play-button>
<media-seek-button seconds="10" class="media-button usher-transport">
<span class="usher-transport-glyph">
<media-icon family="usher" name="seek" class="usher-icon usher-transport-icon">
</media-icon>
<span class="usher-transport-label" aria-hidden="true">10</span>
</span>
</media-seek-button>
</media-controls-group>
<div class="usher-bottom">
<div class="usher-line-row">
<media-time-slider class="usher-slider">
<media-time-slider-chapters class="usher-chapters">
<template>
<div class="usher-chapter">
<div class="usher-chapter-line">
<media-slider-track class="usher-track">
<media-slider-buffer class="usher-buffer">
</media-slider-buffer>
<media-slider-fill class="usher-fill">
</media-slider-fill>
</media-slider-track>
</div>
<span class="usher-chapter-name">
</span>
</div>
</template>
</media-time-slider-chapters>
<usher-chapter-names hidden>
</usher-chapter-names>
<media-slider-preview class="usher-preview">
<span class="usher-preview-card">
<media-slider-thumbnail class="usher-thumbnail">
<img alt="" aria-hidden="true" decoding="async" class="usher-thumbnail-image">
</media-slider-thumbnail>
<media-time-slider-chapter-title class="usher-preview-chapter">
</media-time-slider-chapter-title>
</span>
</media-slider-preview>
<span class="usher-ghost" aria-hidden="true">
<media-slider-value type="pointer">
</media-slider-value>
</span>
<media-slider-thumb class="usher-thumb">
<span class="usher-marker" aria-hidden="true">
<media-icon family="usher" name="spinner" class="usher-icon usher-spinner">
</media-icon>
<media-slider-value type="current" class="usher-marker-time">
</media-slider-value>
<media-slider-value type="pointer" class="usher-marker-pointer">
</media-slider-value>
<usher-rate class="usher-marker-rate" hidden>
</usher-rate>
</span>
</media-slider-thumb>
<usher-time-field class="usher-field" hidden>
<input class="usher-field-input" type="text" inputmode="numeric" enterkeyhint="go" autocomplete="off" autocorrect="off" spellcheck="false">
</usher-time-field>
</media-time-slider>
<media-time type="duration" class="usher-duration">
</media-time>
</div>
<div class="usher-row">
<media-controls-group class="usher-row-start">
<media-play-button class="media-button usher-play" id="usher-play">
<media-icon family="usher" name="restart" class="usher-icon usher-play-restart">
</media-icon>
<media-icon family="usher" name="play" class="usher-icon usher-play-play">
</media-icon>
<media-icon family="usher" name="pause" class="usher-icon usher-play-pause">
</media-icon>
</media-play-button>
<media-tooltip trigger="usher-play" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-mute-button class="media-button usher-mute" id="usher-mute">
<media-icon family="usher" name="volume-off" class="usher-icon usher-mute-off">
</media-icon>
<media-icon family="usher" name="volume-low" class="usher-icon usher-mute-low">
</media-icon>
<media-icon family="usher" name="volume-high" class="usher-icon usher-mute-high">
</media-icon>
</media-mute-button>
<media-tooltip trigger="usher-mute" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-volume-slider class="usher-volume usher-volume-inline">
<media-slider-track class="usher-volume-track">
<media-slider-fill class="usher-volume-fill">
</media-slider-fill>
</media-slider-track>
<media-slider-thumb class="usher-volume-thumb">
<media-slider-value class="usher-volume-value">
</media-slider-value>
</media-slider-thumb>
</media-volume-slider>
<usher-chapter class="usher-chapter-slot">
<button type="button" tabindex="0" commandfor="usher-chapter-menu" class="media-button usher-chapter-button">
<span class="usher-chapter-title">
</span>
<media-icon family="usher" name="chevron" class="usher-icon usher-chapter-chevron">
</media-icon>
</button>
<media-menu side="top" align="start" class="media-popup usher-menu usher-chapter-menu" id="usher-chapter-menu">
<media-menu-content class="media-menu-content">
<usher-chapter-list class="usher-chapter-list">
</usher-chapter-list>
</media-menu-content>
</media-menu>
</usher-chapter>
</media-controls-group>
<media-controls-group class="usher-row-end">
<media-captions-button class="media-button usher-captions" id="usher-captions">
<media-icon family="usher" name="captions-off" class="usher-icon usher-captions-off">
</media-icon>
<media-icon family="usher" name="captions-on" class="usher-icon usher-captions-on">
</media-icon>
</media-captions-button>
<media-tooltip trigger="usher-captions" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<button type="button" tabindex="0" commandfor="usher-settings-menu" class="media-button usher-settings" id="usher-settings">
<media-icon family="usher" name="gear" class="usher-icon usher-gear">
</media-icon>
<media-text class="usher-visually-hidden" token="menu.settings">Settings</media-text>
</button>
<media-tooltip trigger="usher-settings" side="top" class="media-popup usher-tooltip">
<media-text token="menu.settings">Settings</media-text>
</media-tooltip>
<media-menu side="top" align="end" class="media-popup usher-menu" id="usher-settings-menu">
<media-menu-content class="media-menu-content">
<media-menu-item commandfor="usher-menu-volume" class="media-menu-item usher-menu-volume-item">
<media-icon family="usher" name="volume-high" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="volume.label">Volume</media-text>
<span class="media-menu-hint">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-volume">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="volume.label">Volume</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<usher-volume-route hidden>
</usher-volume-route>
<div class="usher-menu-volume-row">
<media-volume-slider class="usher-volume usher-volume-menu">
<media-slider-track class="usher-volume-track">
<media-slider-fill class="usher-volume-fill">
</media-slider-fill>
</media-slider-track>
<media-slider-thumb class="usher-volume-thumb">
<media-slider-value class="usher-volume-value">
</media-slider-value>
</media-slider-thumb>
</media-volume-slider>
</div>
</media-menu-content>
<media-menu-item commandfor="usher-menu-quality" class="media-menu-item">
<media-icon family="usher" name="quality" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.quality">Quality</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-quality">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.quality">Quality</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-quality-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span class="media-menu-label">
<span data-part="label">
</span>
<sup data-part="tier" class="media-menu-tier">
</sup>
</span>
<span data-part="badge" class="media-menu-badge">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-quality-radio-group>
</media-menu-content>
<media-menu-item commandfor="usher-menu-audio" class="media-menu-item">
<media-icon family="usher" name="speech" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.audio">Audio</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-audio">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.audio">Audio</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-audio-track-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span data-part="label" class="media-menu-label">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-audio-track-radio-group>
</media-menu-content>
<media-menu-item commandfor="usher-menu-speed" class="media-menu-item">
<media-icon family="usher" name="speed" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.speed">Speed</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-speed">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.speed">Speed</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-playback-rate-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span data-part="label" class="media-menu-label">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-playback-rate-radio-group>
</media-menu-content>
<media-menu-item commandfor="usher-menu-captions" class="media-menu-item">
<media-icon family="usher" name="captions-off" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.captions">Captions</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-captions">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.captions">Captions</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-captions-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span data-part="label" class="media-menu-label">
</span>
<span data-part="badge" class="media-menu-badge">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-captions-radio-group>
</media-menu-content>
</media-menu-content>
</media-menu>
<media-pip-button class="media-button usher-pip" id="usher-pip">
<media-icon family="usher" name="pip-enter" class="usher-icon usher-pip-enter">
</media-icon>
<media-icon family="usher" name="pip-exit" class="usher-icon usher-pip-exit">
</media-icon>
</media-pip-button>
<media-tooltip trigger="usher-pip" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-cast-button class="media-button usher-cast" id="usher-cast">
<media-icon family="usher" name="cast-enter" class="usher-icon usher-cast-enter">
</media-icon>
<media-icon family="usher" name="cast-exit" class="usher-icon usher-cast-exit">
</media-icon>
</media-cast-button>
<media-tooltip trigger="usher-cast" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-airplay-button class="media-button usher-airplay" id="usher-airplay">
<media-icon family="usher" name="airplay-enter" class="usher-icon usher-airplay-enter">
</media-icon>
<media-icon family="usher" name="airplay-exit" class="usher-icon usher-airplay-exit">
</media-icon>
</media-airplay-button>
<media-tooltip trigger="usher-airplay" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-fullscreen-button class="media-button usher-fullscreen" id="usher-fullscreen">
<media-icon family="usher" name="fullscreen-enter" class="usher-icon usher-fullscreen-enter">
</media-icon>
<media-icon family="usher" name="fullscreen-exit" class="usher-icon usher-fullscreen-exit">
</media-icon>
</media-fullscreen-button>
<media-tooltip trigger="usher-fullscreen" side="top" align="end" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
</media-controls-group>
</div>
</div>
</media-tooltip-group>
</media-controls-content>
</div>
</media-controls>
<media-error-dialog>
<media-dialog-backdrop class="usher-dialog-backdrop">
</media-dialog-backdrop>
<media-dialog-popup class="usher-dialog">
<media-dialog-title class="usher-dialog-title">
</media-dialog-title>
<media-dialog-description class="usher-dialog-description">
</media-dialog-description>
<media-dialog-close class="media-button usher-dialog-close">
</media-dialog-close>
</media-dialog-popup>
</media-error-dialog>
<media-hotkey keys="Space" action="togglePaused">
</media-hotkey>
<media-hotkey keys="k" action="togglePaused">
</media-hotkey>
<media-hotkey keys="m" action="toggleMuted">
</media-hotkey>
<media-hotkey keys="ArrowRight" action="seekStep">
</media-hotkey>
<media-hotkey keys="ArrowLeft" action="seekStep">
</media-hotkey>
<media-hotkey keys="l" action="seekStep">
</media-hotkey>
<media-hotkey keys="j" action="seekStep">
</media-hotkey>
<media-hotkey keys="ArrowUp" action="volumeStep">
</media-hotkey>
<media-hotkey keys="ArrowDown" action="volumeStep">
</media-hotkey>
<media-hotkey keys="0-9" action="seekToPercent">
</media-hotkey>
<media-hotkey keys="Home" action="seekToPercent" value="0">
</media-hotkey>
<media-hotkey keys="End" action="seekToPercent" value="100">
</media-hotkey>
<media-hotkey keys=">" action="speedUp">
</media-hotkey>
<media-hotkey keys="<" action="speedDown">
</media-hotkey>
<media-hotkey keys="f" action="toggleFullscreen">
</media-hotkey>
<media-hotkey keys="c" action="toggleSubtitles">
</media-hotkey>
<media-hotkey keys="i" action="togglePictureInPicture">
</media-hotkey>
<media-gesture type="tap" action="togglePaused" pointer="mouse" region="center">
</media-gesture>
<media-gesture type="tap" action="toggleControls" pointer="touch">
</media-gesture>
<media-gesture type="doubletap" action="seekStep" region="left">
</media-gesture>
<media-gesture type="doubletap" action="toggleFullscreen" region="center">
</media-gesture>
<media-gesture type="doubletap" action="seekStep" region="right">
</media-gesture>
<media-status-announcer class="usher-visually-hidden">
</media-status-announcer>
<div aria-hidden="true" class="usher-indicators">
<media-status-indicator actions="togglePaused,toggleSubtitles,toggleFullscreen,togglePictureInPicture" class="usher-status">
<media-icon family="usher" name="play" class="usher-icon usher-status-play">
</media-icon>
<media-icon family="usher" name="pause" class="usher-icon usher-status-pause">
</media-icon>
<media-icon family="usher" name="captions-on" class="usher-icon usher-status-captions-on">
</media-icon>
<media-icon family="usher" name="captions-off" class="usher-icon usher-status-captions-off">
</media-icon>
<media-icon family="usher" name="fullscreen-enter" class="usher-icon usher-status-fullscreen">
</media-icon>
<media-icon family="usher" name="fullscreen-exit" class="usher-icon usher-status-exit-fullscreen">
</media-icon>
<media-icon family="usher" name="pip-enter" class="usher-icon usher-status-pip">
</media-icon>
<media-icon family="usher" name="pip-exit" class="usher-icon usher-status-exit-pip">
</media-icon>
</media-status-indicator>
<usher-rate-indicator class="usher-rate-slot">
<media-status-indicator actions="speedUp,speedDown" class="usher-hollow usher-rate-indicator">
<media-icon family="usher" name="speed" class="usher-icon">
</media-icon>
<media-status-indicator-value class="usher-indicator-value">
</media-status-indicator-value>
</media-status-indicator>
</usher-rate-indicator>
<media-volume-indicator class="usher-hollow usher-volume-indicator">
<media-volume-indicator-fill class="usher-volume-indicator-fill">
<media-icon family="usher" name="volume-high" class="usher-icon usher-volume-indicator-high">
</media-icon>
<media-icon family="usher" name="volume-low" class="usher-icon usher-volume-indicator-low">
</media-icon>
<media-icon family="usher" name="volume-off" class="usher-icon usher-volume-indicator-off">
</media-icon>
<media-volume-indicator-value class="usher-indicator-value">
</media-volume-indicator-value>
</media-volume-indicator-fill>
</media-volume-indicator>
<media-seek-indicator class="usher-hollow usher-seek-indicator">
<media-icon family="usher" name="seek" class="usher-icon">
</media-icon>
<media-seek-indicator-value class="usher-indicator-value">
</media-seek-indicator-value>
</media-seek-indicator>
</div>
</media-container>
`.match(/<!--[^>]*-->/)?.[0]??`<!-- Add a compatible media component here. -->`;export{b as containerTag,s as features,x as mediaComment,v as renderShortcuts,y as touchNotes};