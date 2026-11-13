import {
  type InputActionEvent,
  PlayerController,
  type PropertyValues,
  playerContext,
  type StatusIndicatorElement,
  selectPlaybackRate,
  UIElement,
} from '@videojs/html';

type Snapshot = { playbackRate?: number };

/** A rate as people read it on a speed control: `1.5×`, in the page's number format. */
export function formatRate(rate: number, locale?: string): string {
  return `${new Intl.NumberFormat(locale || undefined, { maximumFractionDigits: 2 }).format(rate)}×`;
}

/** The rate a stock `speedUp` / `speedDown` action will land on: the next listed rate, or the current one at the end. */
function nextRate(action: string, current: number, rates: readonly number[]): number {
  const faster = rates.filter((rate) => rate > current);
  const slower = rates.filter((rate) => rate < current);

  if (action === 'speedUp') return faster.length ? Math.min(...faster) : current;
  return slower.length ? Math.max(...slower) : current;
}

/**
 * `<usher-rate-indicator>`: wraps the `<media-status-indicator actions="speedUp,speedDown">` that shows speed changes
 * from the `>` and `<` keys as a hollow marker. Speed actions have no built-in status, so this supplies one through
 * `deriveCustomStatus`, computed from the snapshot taken before the action, the same way the action itself steps.
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
 * `<usher-rate>`, inside the marker after the time: shows the playback rate (`1.5×`) behind a 1px divider when it is
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
