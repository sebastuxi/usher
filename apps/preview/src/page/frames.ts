/**
 * Live players on the showcase. Each one is a same-origin iframe of the bare preview page (`preview.html#…`), so every
 * player is a real, isolated Video.js 10 player with the skin exactly as it ships. The page reaches into the frame only
 * through public surfaces: the player element's `store`, the media element, and custom properties on `media-container`.
 *
 * The reel's poster sits behind each frame, and the frame fades in once its document has loaded, so nothing is ever
 * blank while a player starts.
 */

export type Media = 'reel' | 'reel-9x16' | 'usher';
export type Ratio = '16:9' | '9:16' | '1:1';

/** The parts of the player store the page uses. */
export interface PlayerStore {
  target?: unknown;
  readonly state: Record<string, unknown>;
  seek(time: number): unknown;
  subscribe(callback: () => void): () => void;
}

export interface PlayerHandle {
  win: Window & typeof globalThis;
  doc: Document;
  player: HTMLElement & { store: PlayerStore };
  container: HTMLElement;
  media: HTMLMediaElement;
}

export interface Chapter {
  start: number;
  end: number;
  title: string;
}

/** Only for the page's own frames: the preview page's padding and backdrop go, and the player fills the frame. */
const FRAME_CSS = `
html, body { height: 100%; margin: 0; overflow: hidden; background: transparent !important; }
.preview-page { display: block !important; height: 100%; min-height: 0 !important; padding: 0 !important; }
.preview-player { height: 100%; max-width: none !important; }
.preview-player .media-skin { height: 100% !important; aspect-ratio: auto !important; }
`;

const POSTERS: Record<Media, string> = { reel: './media/poster.jpg', 'reel-9x16': './media/poster-9x16.jpg', usher: './media/poster.jpg' };

const frames = new Set<PlayerFrame>();

function frameUrl(media: Media, ratio: Ratio): string {
  return `./preview.html#${new URLSearchParams({ media, ratio, scheme: 'light' })}`;
}

/** The player's media: the first element that is not a skin part and can play. */
function findMedia(doc: Document): HTMLMediaElement | undefined {
  for (const element of doc.querySelectorAll('*')) {
    if (element.localName.startsWith('media-')) continue;
    if ('paused' in element && 'play' in element && typeof (element as HTMLMediaElement).play === 'function')
      return element as HTMLMediaElement;
  }

  return undefined;
}

function until<T>(check: () => T | null | undefined, timeout = 20000): Promise<T> {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const tick = () => {
      let value: T | null | undefined;

      try {
        value = check();
      } catch {
        value = undefined;
      }

      if (value) resolve(value);
      else if (performance.now() - started > timeout) reject(new Error('Timed out waiting for the player'));
      else setTimeout(tick, 50);
    };

    tick();
  });
}

export class PlayerFrame {
  readonly root: HTMLElement;
  media: Media;
  ratio: Ratio;
  iframe: HTMLIFrameElement;
  #ready!: Promise<PlayerHandle>;
  #poster: HTMLImageElement | null;

  constructor(root: HTMLElement, options: { eager?: boolean; title?: string } = {}) {
    this.root = root;
    this.media = (root.dataset.media as Media) ?? 'reel';
    this.ratio = (root.dataset.ratio as Ratio) ?? '16:9';
    this.#poster = root.querySelector<HTMLImageElement>('.player-poster');

    if (!this.#poster) {
      this.#poster = document.createElement('img');
      this.#poster.className = 'player-poster';
      this.#poster.alt = '';
      this.#poster.decoding = 'async';
      if (!options.eager) this.#poster.loading = 'lazy';
      this.#poster.src = POSTERS[this.media];
      root.append(this.#poster);
    }

    // A missing poster must not show a broken image; the black frame behind it is enough.
    const poster = this.#poster;
    poster.addEventListener('error', () => (poster.hidden = true));
    if (poster.complete && poster.naturalWidth === 0 && poster.src) poster.hidden = true;

    let iframe = root.querySelector<HTMLIFrameElement>('iframe');

    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.className = 'player-frame';
      iframe.title = options.title ?? 'Usher player';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      if (!options.eager) iframe.loading = 'lazy';
      iframe.src = frameUrl(this.media, this.ratio);
      root.append(iframe);
    }

    this.iframe = iframe;
    this.#watch(iframe);
    frames.add(this);
  }

  /** Resolves once the player inside has its media attached and its store ready. */
  get ready(): Promise<PlayerHandle> {
    return this.#ready;
  }

  /** Swap the media or the ratio. A new media needs a new document, so the frame is replaced. */
  load(media: Media, ratio: Ratio): Promise<PlayerHandle> {
    this.media = media;
    this.ratio = ratio;
    this.root.dataset.media = media;
    this.root.dataset.ratio = ratio;
    this.root.removeAttribute('data-ready');

    if (this.#poster) {
      this.#poster.hidden = false;
      this.#poster.src = POSTERS[media];
    }

    const next = document.createElement('iframe');

    next.className = 'player-frame';
    next.title = this.iframe.title;
    next.allow = this.iframe.allow;
    next.src = frameUrl(media, ratio);
    this.iframe.replaceWith(next);
    this.iframe = next;
    this.#watch(next);

    return this.#ready;
  }

  #watch(iframe: HTMLIFrameElement): void {
    this.#ready = new Promise<PlayerHandle>((resolve, reject) => {
      const attach = () => {
        const win = iframe.contentWindow as (Window & typeof globalThis) | null;
        const doc = iframe.contentDocument;

        if (!win || !doc || doc.URL === 'about:blank') return;

        iframe.removeEventListener('load', attach);

        if (!doc.getElementById('showcase-frame-css')) {
          const style = doc.createElement('style');

          style.id = 'showcase-frame-css';
          style.textContent = FRAME_CSS;
          doc.head.append(style);
        }

        this.root.setAttribute('data-ready', '');

        until(() => {
          const player = doc.querySelector('video-player') as PlayerHandle['player'] | null;
          const container = doc.querySelector<HTMLElement>('media-container');
          const media = findMedia(doc);

          return player?.store?.target && container && media ? { win, doc, player, container, media } : undefined;
        }).then((handle) => {
          handle.media.addEventListener('play', () => {
            for (const frame of frames) if (frame !== this) void frame.pause();
          });
          resolve(handle);
        }, reject);
      };

      iframe.addEventListener('load', attach);

      // The hero's frame is in the HTML and may have loaded before this script ran.
      if (iframe.contentDocument?.readyState === 'complete') attach();
    });

    // Callers that never wait on it should not see an unhandled rejection.
    this.#ready.catch(() => undefined);
  }

  /** Pause without waiting for a frame that has not started loading. */
  async pause(): Promise<void> {
    const doc = this.iframe.contentDocument;
    const media = doc ? findMedia(doc) : undefined;

    if (media && !media.paused) media.pause();
  }
}

/**
 * Show a frame of the video with the controls up: seek (which counts as started, so the poster and the start marker
 * give way), and leave it paused. If the browser needs playback before it paints a frame, play muted for a moment.
 */
export async function park(handle: PlayerHandle, time: number): Promise<void> {
  const { media, player } = handle;
  const store = player.store;
  // A seek to where the media already is may never report back; never wait on one for long.
  const seek = (to: number) =>
    Math.abs(media.currentTime - to) < 0.05
      ? Promise.resolve()
      : Promise.race([store.seek(to), new Promise((resolve) => setTimeout(resolve, 1500))]);

  if (!media.paused) media.pause();

  await seek(time);

  if (!store.state.started) {
    const muted = media.muted;

    media.muted = true;

    try {
      await media.play();
      media.pause();
      await seek(time);
    } catch {
      // Autoplay blocked: the seek alone still shows the frame in most browsers.
    } finally {
      media.muted = muted;
    }
  }
}

/** Chapters, from the player's store, else from the media's chapters track, else from the reel's VTT file. */
export async function readChapters(handle: PlayerHandle): Promise<Chapter[]> {
  const fromCues = (cues: readonly { startTime: number; endTime: number; text: string }[]) =>
    cues.map((cue) => ({ start: cue.startTime, end: cue.endTime, title: cue.text.trim() }));

  try {
    const cues = await until(() => {
      const value = handle.player.store.state.chaptersCues as { startTime: number; endTime: number; text: string }[];

      return value?.length ? value : undefined;
    }, 4000);

    return fromCues(cues);
  } catch {
    // Fall through.
  }

  for (const track of handle.media.textTracks ?? []) {
    if (track.kind !== 'chapters') continue;
    if (track.mode === 'disabled') track.mode = 'hidden';

    try {
      const cues = await until(() => (track.cues?.length ? track.cues : undefined), 3000);

      return fromCues([...cues] as unknown as VTTCue[]);
    } catch {
      // Fall through.
    }
  }

  try {
    const response = await fetch('./media/chapters.vtt');

    const text = response.ok ? await response.text() : '';

    // A dev server may answer a missing file with a page; only a WebVTT file counts.
    if (/^\uFEFF?WEBVTT/.test(text)) return parseVtt(text);
  } catch {
    // Fall through.
  }

  return [];
}

function parseTime(value: string): number {
  const parts = value.trim().split(':').map(Number);

  return parts.reduce((total, part) => total * 60 + part, 0);
}

function parseVtt(text: string): Chapter[] {
  const chapters: Chapter[] = [];
  const blocks = text.replace(/\r/g, '').split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n');
    const timing = lines.findIndex((line) => line.includes('-->'));

    if (timing < 0) continue;

    const [start, end] = lines[timing]!.split('-->').map((part) => parseTime(part.trim().split(/\s+/)[0]!));
    const title = lines
      .slice(timing + 1)
      .join(' ')
      .trim();

    if (title && Number.isFinite(start) && Number.isFinite(end)) chapters.push({ start: start!, end: end!, title });
  }

  return chapters;
}

export type FootageKind = 'bright' | 'dark' | 'busy';

/** The reel's chapters are named for what they test: "Near white", "Near black", "Busy and bright", … */
export function kindOf(title: string): FootageKind | undefined {
  if (/busy/i.test(title)) return 'busy';
  if (/black|dark|night|low light|dim/i.test(title)) return 'dark';
  if (/white|bright|snow|sky|sun|day/i.test(title)) return 'bright';

  return undefined;
}

/** A representative moment in the first chapter of a kind: a third of the way in. */
export function pointFor(chapters: Chapter[], kind: FootageKind): { time: number; chapter: Chapter } | undefined {
  const chapter = chapters.find((item) => kindOf(item.title) === kind);

  if (!chapter) return undefined;

  return { chapter, time: chapter.start + Math.min(4, (chapter.end - chapter.start) / 3) };
}

export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = String(whole % 60).padStart(2, '0');

  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
