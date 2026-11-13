/**
 * The Usher showcase. The hero's player loads first; every other player is a lazy iframe the browser loads as its
 * section comes near. All page structure is built at once, so the layout never shifts under a reader or a deep link.
 */
import './page.css';
import { contrast, formatRatio, percent } from './contrast';
import { initCustomize } from './customize';
import { initJump, initParked } from './footage';
import { PlayerFrame, park } from './frames';
import { initNav } from './nav';
import { initSizes } from './sizes';
import { loadAttribution } from './credits';

const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector);

/** Run `callback` once `element` is within a screen of the view. */
function whenNear(element: Element | null, callback: () => void, margin = '100% 0px'): void {
  if (!element) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;

      observer.disconnect();
      callback();
    },
    { rootMargin: margin },
  );

  observer.observe(element);
}

// 1. Hero: its frame is in the HTML, so it starts loading before this script runs.
const heroRoot = $('[data-player="hero"]');

if (heroRoot) {
  const hero = new PlayerFrame(heroRoot, { eager: true, title: 'Usher player with the demo reel' });
  let heroInView = true;

  initJump(hero);
  new IntersectionObserver(([entry]) => (heroInView = Boolean(entry?.isIntersecting)), { threshold: 0.5 }).observe(
    heroRoot,
  );

  // The hint's keys work from the page too while the hero is in view: they go to the hero player, as if it had focus.
  document.addEventListener('keydown', (event) => {
    if (!heroInView || event.altKey || event.ctrlKey || event.metaKey || (event.key !== 'g' && event.key !== '?')) return;
    if ((event.target as Element).closest('input, textarea, select, [contenteditable]')) return;

    void hero.ready.then(async (handle) => {
      // Before playback the line is not shown yet: start the session paused a moment in, past any fade from black.
      if (!handle.player.store.state.started) await park(handle, Math.min(4, (handle.media.duration || 0) / 3));
      requestAnimationFrame(() =>
        handle.container.dispatchEvent(
          new handle.win.KeyboardEvent('keydown', { key: event.key, bubbles: true, cancelable: true }),
        ),
      );
    });
    event.preventDefault();
  });
}

// Everything read from the skin's own markup and scripts (the hint, the shortcut table, the touch notes, the "Use it"
// markup) comes in a separate chunk, after the first screen.
const keysReady = import('./keys').then(({ containerTag, features, mediaComment, renderShortcuts, touchNotes }) => {
  const hint = $('[data-hint]');

  if (hint && (features.typeTime || features.shortcutSheet)) {
    const parts: string[] = [];

    if (features.typeTime) parts.push('Press <kbd>G</kbd> to type a time.');
    if (features.shortcutSheet) parts.push('Press <kbd>?</kbd> for shortcuts.');
    hint.innerHTML = parts.join(' ');
    hint.hidden = false;
  }

  const typed = $('[data-job-typed]');

  if (typed && features.typeTime)
    typed.textContent = 'Press G, or Enter on it, or double-click it, then type a time to go there.';

  const shortcuts = $<HTMLTableElement>('[data-shortcuts]');

  if (shortcuts) renderShortcuts(shortcuts);

  const touch = $('[data-touch]');

  if (touch) {
    touch.replaceChildren(
      ...touchNotes().map((note) => {
        const item = document.createElement('li');
        const title = document.createElement('strong');

        title.textContent = note.title;
        item.append(title, ` ${note.text}`);

        return item;
      }),
    );
  }

  // 9. Use it: the skin's real container tag and media comment, one attribute per line so the tag fits the column.
  const markup = $('[data-markup]');

  if (markup) {
    const [tag, ...attrs] = containerTag.slice(1, -1).split(/\s+(?=[\w-]+=")/);
    const opening =
      attrs.length > 1 ? [`  <${tag}`, ...attrs.map((attr) => `    ${attr}`)].join('\n') + '>' : `  ${containerTag}`;

    markup.textContent = [
      '<video-player>',
      opening,
      `    ${mediaComment}`,
      '    <video src="movie.mp4" playsinline></video>',
      '    <!-- …the rest of skin.html… -->',
      '  </media-container>',
      '</video-player>',
    ].join('\n');
  }
});

initNav();

// 2. The strip's arrows.
const strip = $('[data-strip-list]');
const prev = $<HTMLButtonElement>('[data-strip="prev"]');
const next = $<HTMLButtonElement>('[data-strip="next"]');

if (strip && prev && next) {
  const step = () => {
    const item = strip.querySelector('li');

    return item ? item.getBoundingClientRect().width + 24 : strip.clientWidth * 0.8;
  };
  const sync = () => {
    prev.disabled = strip.scrollLeft <= 1;
    next.disabled = strip.scrollLeft >= strip.scrollWidth - strip.clientWidth - 1;
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const go = (direction: number) =>
    strip.scrollBy({ left: direction * step(), behavior: reduce.matches ? 'auto' : 'smooth' });

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  strip.addEventListener('scroll', sync, { passive: true });
  new ResizeObserver(sync).observe(strip);
  sync();
}

// 3. Any footage.
const parked = [...document.querySelectorAll<HTMLElement>('[data-player="footage"]')];

initParked(parked.map((root) => new PlayerFrame(root, { title: `Usher player paused on ${root.dataset.park} footage` })));

const contrastNote = $('[data-contrast]');
const scrimNote = $('[data-scrim-note]');

if (contrast) {
  const line = `Over pure white, the worst case, the scrim peaks at ${percent(contrast.peak)} black, so white print reads at ${formatRatio(contrast.print)}, the duration at ${formatRatio(contrast.muted)} and the unplayed line at ${formatRatio(contrast.line)}.`;

  if (contrastNote) contrastNote.textContent = line;
  if (scrimNote)
    scrimNote.textContent = `One smoothstep scrim, nine eased stops in oklab, darkens the picture behind the line and the row without flattening it. It peaks at ${percent(contrast.peak)} black where the glyphs sit, enough for white print to reach ${formatRatio(contrast.print)} over pure white; more contrast or reduced transparency raises it further.`;
} else {
  // TODO: the scrim's peak could not be read from src/styles/themes/usher.css; restate the measured contrast here.
  if (contrastNote) contrastNote.textContent = 'TODO: contrast over bright, dark and busy frames.';
  if (scrimNote) scrimNote.textContent = 'TODO: the scrim and its contrast.';
}

// 4. Any size.
const sizesRoot = $('[data-player="sizes"]');

if (sizesRoot) initSizes(new PlayerFrame(sizesRoot, { title: 'Usher player at the chosen size' }));

// 5. Make it yours.
const yoursRoot = $('[data-player="yours"]');

if (yoursRoot) initCustomize(new PlayerFrame(yoursRoot, { title: 'Usher player with your settings' }));

// 8. Icons.
const icons = $('[data-icons]');

const iconsReady = import('./icons').then(({ renderIcons }) => {
  if (icons) renderIcons(icons);
});

// Copy buttons.
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
  const live = document.createElement('span');

  live.className = 'visually-hidden';
  live.setAttribute('aria-live', 'polite');
  button.after(live);

  button.addEventListener('click', async () => {
    const source = document.getElementById(button.dataset.copy!);

    if (!source) return;

    try {
      await navigator.clipboard.writeText(source.textContent ?? '');
      button.textContent = 'Copied';
      live.textContent = 'Copied to the clipboard';
    } catch {
      // Select the text so it can be copied by hand.
      const range = document.createRange();

      range.selectNodeContents(source);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
      button.textContent = 'Selected';
      live.textContent = 'Selected. Press Command or Control C to copy.';
    }

    setTimeout(() => {
      button.textContent = 'Copy';
      live.textContent = '';
    }, 2000);
  });
}

// 10. Credits.
const attribution = $('[data-attribution]');

whenNear(attribution, () => {
  if (attribution) void loadAttribution(attribution);
});

// A deep link (#yours) lands before the late parts exist; land it again once they do, unless the reader has moved.
if (location.hash.length > 1) {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  let moved = false;

  for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown'])
    addEventListener(type, () => (moved = true), { once: true, passive: true });

  void Promise.all([keysReady, iconsReady]).then(() =>
    requestAnimationFrame(() => {
      if (!moved) target?.scrollIntoView({ behavior: 'instant' });
    }),
  );
}
