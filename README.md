# Usher

**A Video.js v10 skin where the playhead tells the time.**

Live demo: https://sebastuxi.github.io/usher/
Entry for the Video.js Skins Design Challenge (Contra × Mux, November 2026).

One marker is the whole player. A solid block in the accent colour sits on the timeline and holds the current time: it is
the clock and the handle, it lifts and names the chapters while you scrub, it turns into a field when you want to type a
time, and before and after playback it is the start and the replay button. Because every time is shown at its place on
the line, the button row never holds a number, so an hour-long video or a host font without tabular figures can never
push or wrap the controls.

Everything else stays quiet: white print straight on the picture over a soft, texture-preserving scrim (white print
measures 5.7:1 over pure white footage), solid sheets for anything you choose from, one icon family drawn for this skin,
and a two-tone focus ring that reads on white and on black.

## What is in it

- **The marker**: current time on the playhead, placed with `left: p; translate: -p` so it never leaves the line,
  whatever its width. Hover shows a hollow marker with the pointer time and a thumbnail card with the chapter title.
- **Scrub lift**: while you drag, the button row steps back, the marker grows and lifts with a stem to the line, and
  every chapter is named under its own stretch. CSS only.
- **Type a time**: press `G`, or Enter on the timeline, or double-click the marker, and type `2500` or `25:00`.
- **Chapter list**: the chapter button opens every chapter with its start time; the current one is marked.
- **States**: before start, playing, paused, buffering (the spinner sits in the marker and stays visible while idle),
  ended, and an error dialog in the same visual language. Hotkey feedback appears as hollow markers.
- **Every size**: one row that never wraps from 160 to 1360 px, portrait and square layouts, 48 px targets on touch, and a
  volume page in the settings menu for touch screens.
- **Preferences**: reduced motion, more contrast, reduced transparency, forced colours, right-to-left languages, and the
  public `--media-*` custom properties of the packaged skins.

## Use it in your site

The skin is plain HTML and CSS on top of `@videojs/html` 10.4.

1. Copy `src/` into your project and install `@videojs/html` (and `@videojs/mux-video` if you stream from Mux).
2. Import the player and the skin once:

   ```js
   import '@videojs/html/video/player';
   import './usher/video/skin'; // registers the parts, the icons and the styles
   ```

3. Paste `src/video/skin.html` inside `<video-player>` and put your media element where the comment says:

   ```html
   <video-player>
     <media-container class="media-skin media-container media-video" data-theme="usher" data-preset="video">
       <video src="movie.mp4" playsinline crossorigin></video>
       <!-- the rest of skin.html -->
     </media-container>
   </video-player>
   ```

Give the provider elements `display: contents` (`video-player, media-i18n { display: contents }`) and the container an
aspect ratio, and make the `id` / `commandfor` / `trigger` pairs unique if several players share a page.

## Customize

| Property | Effect |
| --- | --- |
| `--media-accent-color` | Fills the marker, the start and replay markers, the current chapter and the dialog button. Text on it picks black or white by contrast. |
| `--media-accent-text-color` | Overrides that text colour. |
| `--media-border-radius` | Frame radius; the marker and the sheets follow concentric formulas from 0 to full. |
| `--media-font-family` | Any stack, or `inherit`; the marker floats on the line, so wider digits never move the row. |
| `--media-object-fit`, `--media-object-position` | How the video fills the frame. |

## Keyboard

| Keys | Action |
| --- | --- |
| Space, K | Play or pause |
| M | Mute or unmute |
| ← → and J L | Back or forward 10 seconds |
| ↑ ↓ | Volume |
| 0–9, Home, End | Go to 0–90 %, the start, the end |
| < > | Slower, faster |
| F | Full screen |
| C | Captions |
| I | Picture in picture |
| G | Type a time |

Touch: a tap shows or hides the controls (it never pauses by accident), a double tap on the left or right seeks 10
seconds, and a double tap in the centre goes full screen.

## Develop

```sh
npm install
npm run dev          # showcase at /, workbench at /workbench.html, bare player at /preview.html
npm run typecheck
npm run build        # static site in dist/
```

The bare player reads its state from the URL hash, for example
`/preview.html#width=384&ratio=9:16&media=reel-9x16&dir=rtl&locale=ar`. `media` can be `usher` (the reel streamed from
Mux), `reel`, `reel-9x16` (local copies) or `mux` (the Video.js demo asset). `scripts/publish.sh [MUX_PLAYBACK_ID]`
publishes the source and the site to GitHub Pages.

Browser notes: the styles use `@scope`, `:has()`, container queries and `light-dark()`; anchor positioning is used as an
enhancement. The production build keeps `:dir()` and `light-dark()` as authored (see `vite.config.ts`).

## Credits

- Built with [Video.js](https://videojs.org) v10, starting from its Scaffold skin.
- Icons: 25 icons drawn for Usher on an 18 px grid (`src/video/icons.ts`).
- Demo footage: excerpts of WING IT! (2023), Charge (2022) and Coffee Run (2020) © Blender Foundation |
  studio.blender.org, CC BY 4.0, re-cut, cropped and re-encoded. See `apps/preview/public/media/ATTRIBUTION.md`.

## Licence

Licensed under the [Apache License, Version 2.0](LICENSE).
