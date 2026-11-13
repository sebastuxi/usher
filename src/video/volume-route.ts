import { UIElement } from '@videojs/html';

/**
 * `<usher-volume-route>`, inside the settings menu's Volume page. The page's row is only needed where the inline volume
 * line is not shown (below 512px, set in skin.css) and only where volume can be set (not on iOS). The menu skips rows by
 * their `data-hidden` attribute, not by CSS, so this mirrors both conditions onto the row: it reads the inline slider's
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
      const row = container.querySelector(`[commandfor="${page.id}"]`);
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
