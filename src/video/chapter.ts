import {
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

/** Chapters from the store's `chaptersCues`, in order, each ending where the next begins (or at the duration). */
export function chaptersFrom(cues: readonly MediaTextCue[], duration: number): Chapter[] {
  const sorted = [...cues].sort((a, b) => a.startTime - b.startTime);

  return sorted.map((cue, index) => {
    const next = sorted[index + 1]?.startTime ?? duration;
    const end = cue.endTime > cue.startTime ? Math.min(cue.endTime, next || cue.endTime) : next;

    return { start: cue.startTime, end: duration ? Math.min(end, duration) : end, title: cue.text.trim() };
  });
}

/** Index of the chapter that holds `time`, or -1. */
export function chapterIndexAt(chapters: readonly Chapter[], time: number): number {
  for (let index = chapters.length - 1; index >= 0; index--) {
    if (time >= chapters[index]!.start) return time < chapters[index]!.end || index === chapters.length - 1 ? index : -1;
  }

  return -1;
}

/** `m:ss`, or `h:mm:ss` when the media is an hour or longer, so every time in one list has the same shape. */
export function formatTime(seconds: number, duration: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');

  return duration >= 3600 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${h * 60 + m}:${s}`;
}

/** Selects the chapters and the current one: shallow-equal while the chapter stays the same, so no per-frame work. */
const selectChapters = (state: object) => {
  const cues = selectTextTrack(state)?.chaptersCues ?? [];
  const time = selectTime(state);
  const chapters = chaptersFrom(cues, time?.duration ?? 0);

  return { cues, duration: time?.duration ?? 0, current: chapterIndexAt(chapters, time?.currentTime ?? 0), seek: time?.seek };
};

/**
 * `<usher-chapter>`: the chapter button's slot in the button row. It writes the current chapter title into its
 * `.usher-chapter-title` and hides itself (native `hidden`) when the media has no chapters.
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
 * `<usher-chapter-list>`, inside the chapter menu's content: one `<media-menu-item>` per chapter with its start time
 * and title. The current chapter carries `aria-current="true"` (its time chip turns solid). Choosing a row seeks to the
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
    const key = chapters.map((c) => `${c.start}|${c.title}`).join('\n') + value.duration;

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
 * `<usher-chapter-names>`, inside the time slider: writes each chapter's title into the `.usher-chapter-name` of its
 * clone in `<media-time-slider-chapters>`, so the names can sit under their own stretch of the line while scrubbing.
 * Clones are matched to chapters by their start; names narrower than 56px get `data-narrow` and are not shown.
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
