import '@videojs/html/video/player';
import '@videojs/html/media/mux-video';
import '@/video/skin';
import skinTemplate from '@/video/skin.html?raw';

/** Public playback ID of the Usher reel on Mux. While it is empty, `#media=usher` plays the local reel instead. */
export const USHER_MUX_ID = 'NRulkurY01WcVY402ztWShxDlHb76IGjRNYXU2cSe02h64';

// The Mux demo the workbench started with: NASA's Cosmic Dawn trailer, with captions, quality levels and a storyboard.
const DEMO_SRC = 'https://stream.mux.com/83EzHOvVzVN01AsrD01BCpiH02Pj3S8mfzBOu101w2nHC5s.m3u8';
const DEMO_POSTER = 'https://image.mux.com/83EzHOvVzVN01AsrD01BCpiH02Pj3S8mfzBOu101w2nHC5s/thumbnail.webp?time=69';
/** Chapters for the demo, served from `apps/preview/public`. */
const DEMO_CHAPTERS = './cosmic-dawn-chapters.vtt';

const MEDIA_PLACEHOLDER = '<!-- Add a compatible media component here. -->';

/** Tracks of the Usher reel, served from `public/media/`: its six chapters and the design notes as subtitles. */
const REEL_TRACKS =
  '<track kind="chapters" label="Chapters" srclang="en" src="./media/chapters.vtt" default>' +
  '<track kind="subtitles" label="Design notes" srclang="en" src="./media/notes.en.vtt">';

const REEL = {
  reel: { src: 'reel.mp4', storyboard: 'storyboard.vtt', poster: 'poster.jpg' },
  'reel-9x16': { src: 'reel-9x16.mp4', storyboard: 'storyboard-9x16.vtt', poster: 'poster-9x16.jpg' },
} as const;

/**
 * Development media switch, read from the frame's hash (`preview.html#media=reel`). The media element is not a
 * control, so it stays out of the Tab order (`tabindex="-1"`).
 * - `mux` (default): the Mux demo with chapters, captions, quality levels and a storyboard.
 * - `reel`, `reel-9x16`: the Usher reel from `public/media/` in a plain `<video>`: bright, dark and busy chapters, the
 *   storyboard as the thumbnails track, and the design notes as subtitles.
 * - `usher`: the same reel streamed from Mux (`USHER_MUX_ID`), with the local chapters and notes.
 * - `<file>.mp4` or `<file>.webm`: any other clip in `public/media/`, in a plain `<video>`.
 */
function mediaMarkup(): { media: string; poster: string | null } {
  let choice = new URLSearchParams(location.hash.slice(1)).get('media') ?? 'mux';

  if (choice === 'usher' && !USHER_MUX_ID) choice = 'reel';

  if (choice === 'usher') {
    return {
      media: `<mux-video src="https://stream.mux.com/${USHER_MUX_ID}.m3u8" playsinline crossorigin tabindex="-1">${REEL_TRACKS}</mux-video>`,
      poster: './media/poster.jpg',
    };
  }

  if (choice === 'reel' || choice === 'reel-9x16') {
    const clip = REEL[choice];

    return {
      media:
        `<video src="./media/${clip.src}" playsinline crossorigin preload="metadata" tabindex="-1">${REEL_TRACKS}` +
        `<track kind="metadata" label="thumbnails" src="./media/${clip.storyboard}" default></video>`,
      poster: `./media/${clip.poster}`,
    };
  }

  if (/^[\w-]+\.(mp4|webm)$/.test(choice))
    return { media: `<video src="./media/${choice}" playsinline crossorigin tabindex="-1"></video>`, poster: null };

  return {
    media: `<mux-video src="${DEMO_SRC}" playsinline crossorigin tabindex="-1"><track kind="chapters" label="English" srclang="en" src="${DEMO_CHAPTERS}" default></mux-video>`,
    poster: DEMO_POSTER,
  };
}

export function createPlayer(): HTMLElement {
  const player = document.createElement('video-player');
  const { media, poster } = mediaMarkup();

  if (poster) player.setAttribute('poster', poster);

  player.innerHTML = skinTemplate.replace(MEDIA_PLACEHOLDER, media);

  return player;
}
