import { PlayerController, type PropertyValues, playerContext, selectTime, UIElement } from '@videojs/html';
import { formatTime } from './chapter';

/**
 * Reads a typed time: `25:00`, `1:02:03`, or digits that fill from the right like timecode (`2500` → 25:00,
 * `90` → 1:30, `10203` → 1:02:03). Returns seconds, or null for anything else.
 */
export function parseTime(text: string): number | null {
  const value = text.trim();

  if (/^\d{1,6}$/.test(value)) {
    const digits = value.padStart(6, '0');
    return Number(digits.slice(0, 2)) * 3600 + Number(digits.slice(2, 4)) * 60 + Number(digits.slice(4, 6));
  }

  const parts = value.split(':');
  if (parts.length < 2 || parts.length > 3 || !/^\d+$/.test(parts[0]!)) return null;
  if (parts.slice(1).some((part) => !/^\d{1,2}$/.test(part) || Number(part) > 59)) return null;

  return parts.map(Number).reduce((total, n) => total * 60 + n, 0);
}

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.localName));

/**
 * `<usher-time-field>`, inside the time slider next to its thumb: turns the marker into a field for a typed time
 * (§9.3). Opened by Enter on the focused thumb, the `g` key anywhere in the player, or a double-click on the marker.
 * Enter seeks through the store; Escape or blur cancels; a bad entry sets `aria-invalid` and keeps the field open.
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

  /** Opens the field showing `at` (default: the current time). */
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
