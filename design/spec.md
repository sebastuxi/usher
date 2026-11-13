# Usher — design spec

> The playhead tells the time.

One marker is the whole player: a solid block in the accent colour that holds the current time. It sits on
the timeline as the clock and the handle, lifts while you scrub, takes a typed time, and before and after
playback it is the start and replay button. Every time is shown at its place on the line, so the button row
never holds a number.

Status: agreed 2026-11-13. Contest entry for the Video.js Skins Design Challenge (deadline Mon 16 Nov,
23:59 PST). Sources for every decision below: `scratchpad/research/*.md` and `scratchpad/concepts/usher.md`.

## 1. Why this design

- The field (150+ entries) is costumes (phones, tape decks, film props, paper) and dark glass with one neon
  accent. Usher has no prop: a full-bleed picture, familiar controls, one object to remember.
- The judges' own rules: familiar controls, visible seek track, tabular numerals, concentric radii, menus that
  grow from their trigger, interruptible transitions, readable over any footage, small players that do not
  wrap. Usher is built around exactly those.
- A system rule, not decoration: no number lives in the button row, so a `1:00:00` duration or a host font
  without tabular figures can never push or wrap the row.

## 2. Materials

There are two, and each has one job.

1. **Print**: white glyphs and lines set straight on the picture. No bar, no pill, no glass.
   Protected by one **shade band** behind the line and the row (see §6).
2. **Solid**: opaque fills for anything that states a value or offers a choice: the marker, menus, tooltips,
   dialogs.

Grammar used everywhere: **solid means now or on; hollow means elsewhere or off.**
The marker is solid; the hover time, seek, volume and speed feedback are hollow markers.

## 3. Tokens

| Token | Value | Use |
| --- | --- | --- |
| Print | `#FFFFFF` | Icons, played line, text on the picture |
| Muted print | `rgb(255 255 255 / 0.72)` | Duration, secondary text on the picture |
| Unplayed line | `rgb(255 255 255 / 0.5)` | Line after the playhead |
| Buffered line | `rgb(255 255 255 / 0.72)` | Buffered stretch |
| Accent (signal) | `var(--media-accent-color, #FFD23F)` | Marker fill, start and replay marker, current chapter, dialog button. **Only ever a fill behind text**, never a line, never text, never the focus ring. |
| Accent ink | `var(--media-accent-text-color)`, else `contrast-color(accent)` inside `@supports`, else `#000` | Numerals and glyphs on the accent |
| Sheet | `#1C1C1E` (menus, tooltips, dialogs); text `#FFFFFF`, secondary `rgb(255 255 255 / 0.64)`; edge `0 0 0 1px rgb(255 255 255 / 0.1)`, shadow `0 8px 24px rgb(0 0 0 / 0.35)` | Solid surfaces. Video controls stay dark in both colour schemes. |
| Ring | white 2px band with a dark 1px edge on both sides | Focus, everywhere, identical (see §8) |

Contrast targets, measured over bright, dark and busy frames: text 4.5:1, icons, line, thumb and ring 3:1.

## 4. Shape and size

- Frame radius `r = var(--media-border-radius, 12px)`. Marker radius `R = min(r * 2 / 3, 16px)` (8px at default).
  Sheet radius `min(1.5R, R + 4px)` with 4px padding and item radius `R`: concentric by formula, and every
  radius reaches 0 together when `--media-border-radius: 0`.
- **Marker**: 32px high, 8px inline padding, numerals 16px/600, width from content (about 60px for `12:48`,
  84px for `1:02:48`). Edge: `0 0 0 1px color-mix(in oklab, <accent ink> 24%, transparent)`, plus
  `0 1px 2px rgb(0 0 0 / .3), 0 4px 12px rgb(0 0 0 / .2)`, so a dark accent gets a light edge and a light accent
  a dark one.
- **Marker placement without knowing its width**: `left: var(--media-slider-fill); translate: calc(var(--media-slider-fill) * -1) 0;`
  (the percentage in `translate` is the marker's own width, so its edges meet the line's ends exactly).
  Use `--media-slider-pointer` while `[data-dragging]`.
- **Line**: 4px, round 2px caps, 2px gaps between chapters. Played is solid print, unplayed 50% print,
  buffered 72%. State differs by brightness and by the marker, never colour alone.
- **Hollow marker** (hover time and feedback): 24px high, 1px print outline, print 12px/600 numerals, sheet fill at 72%.
- **Buttons**: 40×40 on fine pointers, 48×48 on coarse pointers; icon 18px; hover fill `rgb(255 255 255 / .16)` at radius `R`,
  behind `(hover: hover)`. Line hit area 32px fine, 48px coarse.
- Insets 16px (8px at narrow and tiny). Spacing on an 8px scale; 4px only inside the marker and the line.

## 5. Typography

- `var(--media-font-family, system-ui, -apple-system, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", sans-serif)`.
  No downloaded font.
- Every number: `font-variant-numeric: tabular-nums lining-nums`.
- Marker 16/600. Start and replay marker 20/600. Title 15/600. Chapter button and duration 13/500.
  Menus 14/500. Tooltips 12/500. Scrub marker 32/600. Sentence case, no tracking, no capitals, no monospace.

## 6. The shade band

Behind the line and the row, full width, height = controls zone + a feather above it: a **smoothstep scrim**
(many stops, eased, no banding) that darkens the picture but keeps its texture, identical in every engine.
Peak opacity is set by measurement so white print reaches 4.5:1 and the line 3:1 over pure white at the glyph
centre (about `rgb(0 0 0 / 0.6)` at the row). A small matching scrim sits behind the title only while it shows.
Fade it with its own `opacity`. `prefers-contrast: more` and `prefers-reduced-transparency: reduce` give a stronger,
near-solid band; `forced-colors: active` uses system colours.

Decided after milestone 1 (2026-11-13): a "clamp" band (`mix-blend-mode: darken`, each pixel becomes
`min(picture, grey)`) was built and measured. It leaves dark footage untouched, but over bright and mid-tone footage it
flattens the band into a uniform grey slab that erases the picture, which looks worse than a scrim; and WebKit cannot
blend CSS over playing video at all (it composites video in its own layer), so it needed a separate scrim path anyway.
Rejected in favour of one texture-preserving scrim everywhere. This also frees the controls from blend stacking-context
constraints.

## 7. Layout

One grammar at every size: the line first, then the row. **DOM order equals visual order**:
title, line (marker, duration), play, mute, volume, chapter, captions, settings, pip, cast/airplay, fullscreen.

```
WIDE (672 and up), 896x504
+----------------------------------------------------------------------------------------+
| Title                                                                                  |
|                                  (picture, full-bleed)                                 |
|  ========================[12:48]----------------------|--------|-----------    34:10   |  line row
|  [>] [vol] ==o--  Building the nest v                        [cc] [gear] [pip] [fs]    |  button row 40
+----------------------------------------------------------------------------------------+

NARROW (384 and under), 360x203
+------------------------------------------+
|  =========[12:48]--------------    34:10  |
|  [>] [vol]               [cc] [gear] [fs]|
+------------------------------------------+

TINY (240), 240x135: marker becomes a 12px bead; numerals appear on point, drag or focus.
Row: play, mute, fullscreen. Below 200: play, mute and the line only.

PORTRAIT 9:16 and SQUARE: same two levels at the bottom; on coarse pointers a centre transport
(back 10, play, forward 10) as print on shade discs; 24px bottom inset plus safe-area inset.
```

- Medium (385 to 671): volume line only from 512; chapter name capped at 30% with ellipsis; pip from 448.
- Narrow: title, chapter button, volume line, pip and cast drop. Chapters and volume move into the settings menu,
  so touch users still get a volume control. Keep the duration as long as the line keeps at least ~160px.
- All breakpoints are container queries on the player. Portrait and square need a size container on an
  absolutely positioned inset wrapper (not on `media-container`, whose height can be intrinsic).
- Times of `0:00`, `10:00` and `1:00:00` change only the marker's own width, never the row.
- Play and mute never drop. No row ever wraps or overflows, 160 to 1360px.

## 8. Focus and keyboard

- One ring everywhere (buttons, the slider thumb under the marker, menu items, dialog buttons, the time field):
  readable on white and on black, from `outline` plus `box-shadow`. Keep a transparent outline for forced colours,
  where the ring is `Highlight`.
- Controls never hide while anything inside has `:focus-visible` (also for the caption lift and the idle cursor).
- Escape closes menus and the time field and returns focus to the trigger or the thumb. Focus never leaves the player.
- Keep every stock hotkey and gesture, the status announcer and the error dialog.

## 9. Signature interactions

1. **The marker is the clock.** `media-slider-value type="current"` (or an equivalent sibling) inside the time slider,
   positioned with the formula in §4. The real slider thumb is an invisible box of the same size and place that
   carries the focus ring and the slider semantics. Pointer handling stays the native v10 slider: do not
   reimplement dragging.
2. **Scrub lift** (CSS only, `:has(media-time-slider[data-dragging])`): the button row fades, the marker lifts
   about 56px, grows to 32px numerals, follows `--media-slider-pointer`, with a 2px print stem to the line;
   the thumbnail sits above it; chapter names appear under the line, each under its own stretch.
   Keyboard focus on the thumb shows the hover preview but hides nothing.
3. **Type a time.** Enter on the focused thumb, the `g` key, or a double-click / double-tap on the marker turns the
   marker into a field (`inputmode="numeric"`, 16px so iOS does not zoom). Accepts `25:00`, `1:02:03`, or digits
   that fill from the right (`2500` → 25:00). Enter seeks through the store, Escape or blur cancels, a bad entry
   sets `aria-invalid`. A double-click must not leave the playhead moved by its first click: restore the time
   from before the first press. Label from an existing translated phrase; no new English.
4. **One object for the session.** Before start: one centred start marker (56px high, play icon and the duration,
   20/600). Ended: a centred replay marker (restart icon and duration). Optional, last: the start marker travels
   to the line origin on first play (cut to a crossfade if time runs short).

## 10. States

- Before start: poster full-bleed, title top left, centred start marker. No bars until playback starts.
- Playing idle: nothing on screen, cursor hidden, captions back to their rest position.
- Paused or active: line, marker and row. No centre overlay with a mouse.
- Hover on the line: thumbnail (160×90 at wide), a hollow marker with the pointer time, chapter title.
- Menu open: solid sheet growing from its trigger; checked items show the check icon and 600 weight; the gear turns 60°.
- Volume: inline 64px line with a bead at wide (the bead shows the level while pointed, dragged or focused);
  popover or settings page at narrow; hidden where volume cannot be set (iOS), mute stays.
- Speed other than 1×: the marker shows the rate after the time behind a 1px divider.
- Buffering: after the stock delay, the spinner appears inside the marker before the numerals; no spinner over the picture
  once playback has started (before start, inside the start marker).
- Ended: replay marker centred; the play button shows restart.
- Error: centred sheet, max 360px, title 17/600, description 14/400, close button as an accent marker. Text from the
  translated defaults.
- Hotkey and gesture feedback: seek shows a hollow marker with the accumulated seconds on its side; volume and speed a hollow
  marker top centre; play, pause, captions, fullscreen a 36px print icon on a 72px shade disc.
- Captions: lifted above the controls zone while controls show. Firefox does not lift native cues: our own VTT uses `line:` settings.

## 11. Motion

All durations through the stock tokens (`--media-duration-*`), which the preferences layer collapses under reduced motion.
Enter easing `cubic-bezier(.2, 0, 0, 1)`; exits shorter. Transition `opacity`, `transform`, `translate`, `scale` only, each named.
No keyframes except the spinner. Nothing animates on load. Play, mute and seek: press feedback only (scale .96, 100ms).
Controls in 100ms, out 300ms (150ms on touch). Menus grow from the trigger (`transform-origin` from `data-side`/`data-align`),
in 150ms, out 50ms, submenus resize with `interpolate-size` over 250ms. Icon pairs crossfade in place. Scrub lift 150ms up, 100ms down.
Reduced motion: every movement becomes an immediate state change or an opacity change.

## 12. Icons

One family of 25 (`airplay-enter`, `airplay-exit`, `captions-off`, `captions-on`, `cast-enter`, `cast-exit`, `check`, `chevron`,
`fullscreen-enter`, `fullscreen-exit`, `gear`, `pause`, `pip-enter`, `pip-exit`, `play`, `quality`, `restart`, `seek`, `speech`,
`speed`, `spinner`, `switches`, `volume-high`, `volume-low`, `volume-off`), registered as family `usher` in `src/video/icons.ts`,
drawn by us on an 18×18 grid, `fill="currentColor"`.
Live area 14×14, circles and triangles overshoot to 15. Every stroke and knock-out 2px on whole pixels. Outer corners 1px,
container shapes 2px. Pause: two 4×12 bars (the same 4px as the line). Play optically centred. Solid/hollow pairs: captions,
pip, cast, airplay. Volume-off: the speaker with a 2px slash and a 2px clearance. Gear: six teeth.

## 13. Customization (public properties keep working)

- `--media-accent-color`: fills the marker, start and replay markers, current chapter and dialog button. Any colour passes
  because the accent is only a fill behind text whose colour is chosen by contrast.
- `--media-border-radius`: marker and sheets follow the formulas in §4 from 0 to full.
- `--media-font-family`: `inherit` puts the host's numerals in the marker; the row cannot shift.
- The other stock `--media-*` properties keep working.

## 14. Priorities

- **P0 (gate and polish)**: every essential control working, the marker and line, the shade band with its WebKit gate, all
  layouts (240 to 1360px, 16:9, 9:16, 1:1, 21:9), icons, settings menu (quality, audio, speed, captions), tooltips, volume
  (including touch), focus ring and focus hold, keyboard, before-start, buffering, ended, error, hover preview with thumbnail,
  caption lift, reduced motion, forced colours, more contrast, RTL, light and dark, no console errors, no row ever wraps.
- **P1**: scrub lift with chapter names, typed time, chapter list (a menu opened by the chapter button; v10 has none),
  hotkey feedback styling, speed in the marker.
- **P2**: start travel animation, a `?` shortcut sheet.
