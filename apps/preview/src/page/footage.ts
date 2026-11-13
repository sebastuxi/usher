/**
 * Bright, dark and busy footage: the hero's jump buttons and the three parked players. Both read the reel's chapters
 * from the player, so they follow the reel rather than hard-coded times.
 */
import { type Chapter, type FootageKind, formatTime, kindOf, type PlayerFrame, park, pointFor, readChapters } from './frames';

let chaptersPromise: Promise<Chapter[]> | undefined;

/** The first player to load reads the chapters; the rest reuse them. */
function chaptersFrom(frame: PlayerFrame): Promise<Chapter[]> {
  chaptersPromise ??= frame.ready.then(readChapters).catch(() => []);

  return chaptersPromise;
}

/** "Jump to: Bright, Dark, Busy". The button for the kind of footage on screen stays solid while it plays. */
export function initJump(frame: PlayerFrame): void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-jump]')];

  if (!buttons.length) return;

  void Promise.all([frame.ready, chaptersFrom(frame)]).then(([handle, chapters]) => {
    if (!chapters.some((chapter) => kindOf(chapter.title))) {
      // No chapters to jump to (the media has none): say so rather than offer buttons that do nothing.
      for (const button of buttons) {
        button.disabled = true;
        button.title = 'This media has no chapters to jump to';
      }

      return;
    }

    const mark = () => {
      const time = handle.media.currentTime;
      const chapter = chapters.find((item) => time >= item.start && time < item.end);
      const kind = handle.player.store.state.started && chapter ? kindOf(chapter.title) : undefined;

      for (const button of buttons) button.setAttribute('aria-current', String(button.dataset.jump === kind));
    };

    for (const type of ['timeupdate', 'seeked', 'emptied']) handle.media.addEventListener(type, mark);
    mark();

    for (const button of buttons) {
      const point = pointFor(chapters, button.dataset.jump as FootageKind);

      if (!point) {
        button.disabled = true;
        continue;
      }

      button.addEventListener('click', () => void park(handle, point.time).then(mark));
    }
  });
}

/** Three small players, each parked on the first chapter of its kind. */
export function initParked(frames: PlayerFrame[]): void {
  for (const frame of frames) {
    const kind = frame.root.dataset.park as FootageKind;
    const caption = frame.root.closest('figure')?.querySelector<HTMLElement>('[data-park-caption]');

    void Promise.all([frame.ready, chaptersFrom(frame)]).then(async ([handle, chapters]) => {
      const point = pointFor(chapters, kind);

      if (!point) {
        if (caption) caption.textContent = 'The reel’s chapters are not available.';
        return;
      }

      if (caption) caption.textContent = `${point.chapter.title}, ${formatTime(point.time)}`;
      await park(handle, point.time);
    });
  }
}
