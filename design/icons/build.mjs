#!/usr/bin/env node
// Usher icon set: drawing source.
//
// Every icon is constructed here from exact geometry on the 18x18 grid (no traced paths), then emitted as
// literal SVG strings into src/video/icons.ts (with --ts) and into the review sheet design/icons/sheet.html.
//
//   node design/icons/build.mjs          -> sheet.html only
//   node design/icons/build.mjs --ts     -> sheet.html + src/video/icons.ts
//
// Grid rules (design/spec.md §12): live area 2..16, circles and triangles overshoot to ~15, every bar and every
// knock-out 2px on whole pixels, outer corners r=1, containers r=2, clearance cuts concentric (r + 2).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

// ---------------------------------------------------------------- geometry
const P = (x, y) => ({ x, y });
const add = (a, b) => P(a.x + b.x, a.y + b.y);
const sub = (a, b) => P(a.x - b.x, a.y - b.y);
const mul = (a, k) => P(a.x * k, a.y * k);
const len = (a) => Math.hypot(a.x, a.y);
const norm = (a) => mul(a, 1 / len(a));
const dot = (a, b) => a.x * b.x + a.y * b.y;
const cross = (a, b) => a.x * b.y - a.y * b.x;
const rad = (deg) => (deg * Math.PI) / 180;
const polar = (c, r, deg) => P(c.x + r * Math.cos(rad(deg)), c.y + r * Math.sin(rad(deg)));

function n(v) {
  const r = Math.round(v * 1000) / 1000;
  return Object.is(r, -0) || r === 0 ? '0' : String(r);
}
const pt = (p) => `${n(p.x)} ${n(p.y)}`;
const same = (a, b) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;

/** Closed polygon with a radius per vertex ({x, y, r}). Convex corners round, concave corners fillet. */
function roundedPoly(vs) {
  const N = vs.length;
  const corners = vs.map((v, i) => {
    const prev = vs[(i - 1 + N) % N];
    const next = vs[(i + 1) % N];
    const r = v.r || 0;
    if (!r) return { pin: v, pout: v, r: 0 };
    const d1 = norm(sub(prev, v));
    const d2 = norm(sub(next, v));
    const ang = Math.acos(Math.max(-1, Math.min(1, dot(d1, d2))));
    const t = r / Math.tan(ang / 2);
    const turn = cross(sub(v, prev), sub(next, v));
    return { pin: add(v, mul(d1, t)), pout: add(v, mul(d2, t)), r, sweep: turn > 0 ? 1 : 0, t };
  });
  // guard: the two roundings on an edge must not overlap (that would draw a backwards sliver)
  vs.forEach((v, i) => {
    const w = vs[(i + 1) % N];
    const used = (corners[i].t || 0) + (corners[(i + 1) % N].t || 0);
    if (used > len(sub(w, v)) + 1e-6) throw new Error(`rounding overlaps on edge ${pt(v)} -> ${pt(w)}`);
  });
  let cur = corners[0].pout;
  let d = `M${pt(cur)}`;
  for (let k = 1; k <= N; k++) {
    const c = corners[k % N];
    if (!same(cur, c.pin)) d += `L${pt(c.pin)}`;
    cur = c.pin;
    if (c.r) {
      d += `A${n(c.r)} ${n(c.r)} 0 0 ${c.sweep} ${pt(c.pout)}`;
      cur = c.pout;
    }
  }
  return d + 'Z';
}

const rect = (x, y, w, h, r = 0) =>
  roundedPoly([
    { x, y, r },
    { x: x + w, y, r },
    { x: x + w, y: y + h, r },
    { x, y: y + h, r },
  ]);

function circle(c, r) {
  return `M${pt(P(c.x - r, c.y))}A${n(r)} ${n(r)} 0 1 1 ${pt(P(c.x + r, c.y))}A${n(r)} ${n(r)} 0 1 1 ${pt(P(c.x - r, c.y))}Z`;
}

/** Annular band from angle a0 to a1 (degrees, clockwise on screen, a1 > a0), round or flat ends. */
function arcBand(c, rIn, rOut, a0, a1, cap0 = 'round', cap1 = 'round') {
  const large = a1 - a0 > 180 ? 1 : 0;
  const w = (rOut - rIn) / 2;
  const o0 = polar(c, rOut, a0);
  const o1 = polar(c, rOut, a1);
  const i1 = polar(c, rIn, a1);
  const i0 = polar(c, rIn, a0);
  let d = `M${pt(o0)}A${n(rOut)} ${n(rOut)} 0 ${large} 1 ${pt(o1)}`;
  d += cap1 === 'round' ? `A${n(w)} ${n(w)} 0 0 1 ${pt(i1)}` : `L${pt(i1)}`;
  d += `A${n(rIn)} ${n(rIn)} 0 ${large} 0 ${pt(i0)}`;
  if (cap0 === 'round') d += `A${n(w)} ${n(w)} 0 0 1 ${pt(o0)}`;
  return d + 'Z';
}

/** A 2px (2w) bar along a polyline: round caps, round outer joins, mitred inner joins. */
function strokePolyline(pts, w = 1) {
  // Walk the left side forward, cap, walk the left side of the reversed polyline (= right side), cap.
  const side = (ps) => {
    const segs = [];
    for (let i = 0; i < ps.length - 1; i++) {
      const d = norm(sub(ps[i + 1], ps[i]));
      segs.push({ d, nl: P(d.y, -d.x) });
    }
    let s = '';
    for (let i = 1; i < ps.length - 1; i++) {
      const v = ps[i];
      const na = segs[i - 1].nl;
      const nb = segs[i].nl;
      if (cross(segs[i - 1].d, segs[i].d) > 0) {
        // right turn: the left side is the outer side, round join
        s += `L${pt(add(v, mul(na, w)))}A${n(w)} ${n(w)} 0 0 1 ${pt(add(v, mul(nb, w)))}`;
      } else {
        s += `L${pt(add(v, mul(add(na, nb), w / (1 + dot(na, nb)))))}`;
      }
    }
    const last = segs[segs.length - 1];
    s += `L${pt(add(ps[ps.length - 1], mul(last.nl, w)))}`;
    return { s, start: add(ps[0], mul(segs[0].nl, w)) };
  };
  const fwd = side(pts);
  const back = side([...pts].reverse());
  return `M${pt(fwd.start)}${fwd.s}A${n(w)} ${n(w)} 0 0 1 ${pt(back.start)}${back.s}A${n(w)} ${n(w)} 0 0 1 ${pt(fwd.start)}Z`;
}

function capsule(a, b, w = 1) {
  return strokePolyline([a, b], w);
}

/** Keep the part of polygon vs where f(p) >= 0 (Sutherland-Hodgman, one plane). New vertices are sharp. */
function clipHalf(vs, f) {
  const out = [];
  for (let i = 0; i < vs.length; i++) {
    const A = vs[i];
    const B = vs[(i + 1) % vs.length];
    const fa = f(A);
    const fb = f(B);
    if (fa >= 0) out.push(A);
    if (fa >= 0 !== fb >= 0) {
      const t = fa / (fa - fb);
      out.push({ x: A.x + t * (B.x - A.x), y: A.y + t * (B.y - A.y), r: 0 });
    }
  }
  return out;
}

/** Signed distance helper for the line through a with direction d (left normal positive). */
const lineDist = (a, d) => {
  const u = norm(d);
  const nl = P(u.y, -u.x);
  return (p) => dot(sub(p, a), nl);
};

/** Centre of the arc that rounds polygon corner v (between prev and next) with radius r. */
function cornerCentre(prev, v, next, r) {
  const d1 = norm(sub(prev, v));
  const d2 = norm(sub(next, v));
  const ang = Math.acos(dot(d1, d2));
  const bis = norm(add(d1, d2));
  return add(v, mul(bis, r / Math.sin(ang / 2)));
}

/** Intersection of line (a, direction d) with horizontal y = Y. */
const atY = (a, d, Y) => P(a.x + ((Y - a.y) / d.y) * d.x, Y);

// ---------------------------------------------------------------- the set
const C = P(9, 9);
const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">${body}</svg>`;
const path1 = (d, evenodd = false) => `<path${evenodd ? ' fill-rule="evenodd"' : ''} d="${d}"/>`;

// play: rounded triangle, vertical edge on a whole pixel, box shifted right for the optical centre
function playPath() {
  const xL = 4;
  const top = 1.5;
  const bot = 16.5;
  const tip = 16.5;
  return roundedPoly([
    { x: xL, y: top, r: 1 },
    { x: tip, y: (top + bot) / 2, r: 1 },
    { x: xL, y: bot, r: 1 },
  ]);
}

// speaker shared by the three volume icons: 2px body, 3px cone at 45°, 12 tall like the pause bars
const SPK = [
  { x: 2, y: 6, r: 1 },
  { x: 4, y: 6, r: 0 },
  { x: 7, y: 3, r: 1 },
  { x: 7, y: 15, r: 1 },
  { x: 4, y: 12, r: 0 },
  { x: 2, y: 12, r: 1 },
];
const WAVE_C = P(3, 9);
const wave1 = () => {
  const a = (Math.acos(7 / 8) * 180) / Math.PI; // end caps sit at x = 10: 2px clear of the cone
  return arcBand(WAVE_C, 7, 9, -a, a);
};
const wave2 = () => arcBand(WAVE_C, 11, 13, -30, 30);

function volumeOff({ s1 = P(6, 3), s2 = P(15, 12) } = {}) {
  // a 2px slash from s1 to s2, with a clearance band of 1 (half the bar) + 2 cut out of the speaker
  const dist = lineDist(s1, sub(s2, s1)); // negative on the lower-left side (the speaker's side)
  const kept = clipHalf(SPK, (p) => -dist(p) - 3);
  return path1(roundedPoly(kept)) + path1(capsule(s1, s2));
}

// captions: two text rows (8 and 5 long, ragged left so they read as text, not as a drawer handle);
// 1px clear of the frame in the hollow state, the most a 12px box allows with 2px rows and a 2px row gap
const CAP_BOX = [2, 3, 14, 12, 2];
const capRows = () => [rect(5, 6, 8, 2, 1), rect(5, 10, 5, 2, 1)];

// pip: screen 14x12, window 7x6 in the bottom-right corner
const SCREEN = [2, 3, 14, 12, 2];
function pipEnter() {
  const hole = roundedPoly([
    { x: 4, y: 5 },
    { x: 14, y: 5 },
    { x: 14, y: 9 },
    { x: 9, y: 9, r: 1 },
    { x: 9, y: 13 },
    { x: 4, y: 13 },
  ]);
  return path1(rect(...SCREEN) + hole, true);
}
function pipExit() {
  const slot = roundedPoly([
    { x: 7, y: 7, r: 3 },
    { x: 14, y: 7 },
    { x: 14, y: 9 },
    { x: 9, y: 9, r: 1 },
    { x: 9, y: 13 },
    { x: 7, y: 13 },
  ]);
  return path1(rect(...SCREEN) + slot, true);
}

// cast: waves from the screen's outer bottom-left corner, bite of r = 8 (wave 6 + 2 clearance)
const CAST_O = P(2, 15);
const castWaves = () =>
  path1(`M2 13A2 2 0 0 1 4 15L2 15Z`) + path1(`M2 9A6 6 0 0 1 8 15L6 15A4 4 0 0 0 2 11Z`);
function castScreenOutline() {
  const R = 8;
  const yb = CAST_O.y - Math.sqrt(R * R - 4); // inner left edge x = 4
  const xb = CAST_O.x + Math.sqrt(R * R - 4); // inner bottom edge y = 13
  return `M2 7L2 5A2 2 0 0 1 4 3L14 3A2 2 0 0 1 16 5L16 13A2 2 0 0 1 14 15L10 15A8 8 0 0 0 ${n(xb)} 13L14 13L14 5L4 5L4 ${n(yb)}A8 8 0 0 0 2 7Z`;
}
const castScreenSolid = () => `M2 7L2 5A2 2 0 0 1 4 3L14 3A2 2 0 0 1 16 5L16 13A2 2 0 0 1 14 15L10 15A8 8 0 0 0 2 7Z`;

// airplay: screen 14x11 on top, rounded triangle rising from the bottom, 2px clearance (concentric r = 3)
const AP = { y0: 2, y1: 13, apex: P(9, 8.5), baseY: 16, hb: 4.25 };
function airplayParts() {
  const A = AP.apex;
  const BR = P(9 + AP.hb, AP.baseY);
  const BL = P(9 - AP.hb, AP.baseY);
  const tri = roundedPoly([
    { ...A, r: 1 },
    { ...BR, r: 1 },
    { ...BL, r: 1 },
  ]);
  // offset edges (2px out) of the rounded triangle: same corner centres, radius 3
  const cA = cornerCentre(BL, A, BR, 1);
  const cR = cornerCentre(A, BR, BL, 1);
  const cL = cornerCentre(BR, BL, A, 1);
  const R = 3;
  const outN = (p, q) => {
    const d = norm(sub(q, p));
    return P(d.y, -d.x); // left normal; with A -> BR -> BL clockwise this points outward
  };
  const nAR = outN(cA, cR); // edge apex -> base right
  const nLA = outN(cL, cA); // edge base left -> apex
  const tA_R = add(cA, mul(nAR, R));
  const tR = add(cR, mul(nAR, R));
  const tL = add(cL, mul(nLA, R));
  const tA_L = add(cA, mul(nLA, R));
  const dR = norm(sub(tR, tA_R));
  const dL = norm(sub(tA_L, tL));
  return { tri, tA_R, tA_L, tR, tL, dR, dL, R, cA };
}
function airplayScreen(solid) {
  const { tA_R, tA_L, tL, dR, dL, R } = airplayParts();
  const { y0, y1 } = AP;
  const r = 2;
  const pL13 = atY(tL, dL, y1);
  const pR13 = atY(tA_R, dR, y1);
  let d = `M${pt(pR13)}L${16 - r} ${y1}A2 2 0 0 0 16 ${y1 - r}L16 ${y0 + r}A2 2 0 0 0 ${16 - r} ${y0}L${2 + r} ${y0}A2 2 0 0 0 2 ${y0 + r}L2 ${y1 - r}A2 2 0 0 0 ${2 + r} ${y1}L${pt(pL13)}`;
  if (solid) {
    d += `L${pt(tA_L)}A${R} ${R} 0 0 1 ${pt(tA_R)}Z`;
  } else {
    const yi = y1 - 2;
    const pL11 = atY(tL, dL, yi);
    const pR11 = atY(tA_R, dR, yi);
    d += `L${pt(pL11)}L4 ${yi}L4 ${y0 + 2}L14 ${y0 + 2}L14 ${yi}L${pt(pR11)}Z`;
  }
  return d;
}

// fullscreen: four L brackets, corner r=2 (screen corner), arm ends round, arms 5
function bracket(cx, cy, sx, sy) {
  return roundedPoly([
    { x: cx, y: cy, r: 2 },
    { x: cx + 5 * sx, y: cy, r: 1 },
    { x: cx + 5 * sx, y: cy + 2 * sy, r: 1 },
    { x: cx + 2 * sx, y: cy + 2 * sy, r: 0 },
    { x: cx + 2 * sx, y: cy + 5 * sy, r: 1 },
    { x: cx, y: cy + 5 * sy, r: 1 },
  ]);
}

// gear: six tapered teeth, hole, centred on (9, 9) so a 60° turn is identical
function gear({ R1 = 7, R0 = 5.25, wt = 1.5, wr = 1.85, rt = 0.5, hole = 2, phase = -90 } = {}) {
  let d = '';
  const teeth = [];
  for (let k = 0; k < 6; k++) {
    const phi = phase + 60 * k;
    const u = P(Math.cos(rad(phi)), Math.sin(rad(phi)));
    const v = P(-u.y, u.x);
    const rootLen = Math.sqrt(R0 * R0 - wr * wr);
    const rootA = add(C, add(mul(u, rootLen), mul(v, -wr)));
    const tipA = add(C, add(mul(u, R1), mul(v, -wt)));
    const tipB = add(C, add(mul(u, R1), mul(v, wt)));
    const rootB = add(C, add(mul(u, rootLen), mul(v, wr)));
    teeth.push({ rootA, tipA, tipB, rootB });
  }
  const corner = (prev, v, next, r) => {
    const d1 = norm(sub(prev, v));
    const d2 = norm(sub(next, v));
    const ang = Math.acos(dot(d1, d2));
    const t = r / Math.tan(ang / 2);
    return [add(v, mul(d1, t)), add(v, mul(d2, t))];
  };
  teeth.forEach((t, k) => {
    const [a1, a2] = corner(t.rootA, t.tipA, t.tipB, rt);
    const [b1, b2] = corner(t.tipA, t.tipB, t.rootB, rt);
    d += k === 0 ? `M${pt(t.rootA)}` : '';
    d += `L${pt(a1)}A${rt} ${rt} 0 0 1 ${pt(a2)}L${pt(b1)}A${rt} ${rt} 0 0 1 ${pt(b2)}L${pt(t.rootB)}`;
    const next = teeth[(k + 1) % 6];
    d += `A${n(R0)} ${n(R0)} 0 0 1 ${pt(next.rootA)}`;
  });
  d += 'Z' + circle(C, hole);
  return path1(d, true);
}

// seek and restart: 2px arc (r 5..7) with a rounded arrowhead
function arrowArc({ head, tail, dir, rm = 6, hb = 3, L = 4, rTip = 0.5, rBarb = 0.5 }) {
  const ext = 6; // arc runs 6° into the head so the two shapes overlap (no seam)
  const band =
    dir > 0
      ? arcBand(C, rm - 1, rm + 1, tail, head + ext, 'round', 'flat')
      : arcBand(C, rm - 1, rm + 1, head - ext, tail, 'flat', 'round');
  // the tip sits on the circle a chord L ahead, so the head follows the curve
  const B = polar(C, rm, head);
  const delta = (2 * Math.asin(L / (2 * rm)) * 180) / Math.PI;
  const tip = polar(C, rm, head + dir * delta);
  const t = norm(sub(tip, B));
  const u = P(t.y, -t.x);
  const head3 = roundedPoly([
    { ...add(B, mul(u, hb)), r: rBarb },
    { ...tip, r: rTip },
    { ...add(B, mul(u, -hb)), r: rBarb },
  ]);
  return path1(band) + path1(head3);
}

// speed: open gauge ring, needle on a hub
function speed({ hub = 1.75, len: L = 2.5, cy = 10 } = {}) {
  const c = P(9, cy);
  const ring = arcBand(c, 5.5, 7.5, 135, 405);
  const needle = capsule(c, polar(c, L, 315));
  return path1(ring) + path1(needle) + (hub ? path1(circle(c, hub)) : '');
}

// speech bubble
function speechOutline(y0 = 2, y1 = 13, r = 3) {
  return [
    { x: 2, y: y0, r },
    { x: 16, y: y0, r },
    { x: 16, y: y1, r },
    { x: 10, y: y1, r: 0 },
    { x: 5, y: 16, r: 1 },
    { x: 6, y: y1, r: 0 },
    { x: 2, y: y1, r },
  ];
}
function speech({ y0 = 2, y1 = 13, r = 3, hollow = false } = {}) {
  const outer = roundedPoly(speechOutline(y0, y1, r));
  if (!hollow) return path1(outer);
  const inner = rect(4, y0 + 2, 10, y1 - y0 - 4, Math.max(0, r - 2));
  return path1(outer + inner, true);
}

// quality: rising bars (a bitrate ladder)
const quality = () =>
  path1(rect(2, 11, 2, 5, 1)) + path1(rect(6, 8, 2, 8, 1)) + path1(rect(10, 5, 2, 11, 1)) + path1(rect(14, 2, 2, 14, 1));

// switches: two toggles, each a 6px knob and a 2px track with 2px clearance; one on (right), one off (left)
function switches() {
  return (
    path1(circle(P(13, 5), 3)) +
    path1(capsule(P(3, 5), P(7, 5))) +
    path1(circle(P(5, 13), 3)) +
    path1(capsule(P(11, 13), P(15, 13)))
  );
}

export const icons = {
  play: svg(path1(playPath())),
  pause: svg(path1(rect(3, 3, 4, 12, 1)) + path1(rect(11, 3, 4, 12, 1))),
  restart: svg(arrowArc({ head: 225, tail: 225 + 290, dir: -1 })),
  seek: svg(arrowArc({ head: 315, tail: 110, dir: 1 })),
  'volume-high': svg(path1(roundedPoly(SPK)) + path1(wave1()) + path1(wave2())),
  'volume-low': svg(path1(roundedPoly(SPK)) + path1(wave1())),
  'volume-off': svg(volumeOff()),
  'captions-off': svg(path1(rect(...CAP_BOX) + rect(4, 5, 10, 8, 0), true) + capRows().map((r) => path1(r)).join('')),
  'captions-on': svg(path1(rect(...CAP_BOX) + capRows().join(''), true)),
  'pip-enter': svg(pipEnter()),
  'pip-exit': svg(pipExit()),
  'cast-enter': svg(path1(castScreenOutline()) + castWaves()),
  'cast-exit': svg(path1(castScreenSolid()) + castWaves()),
  'airplay-enter': svg(path1(airplayScreen(false)) + path1(airplayParts().tri)),
  'airplay-exit': svg(path1(airplayScreen(true)) + path1(airplayParts().tri)),
  'fullscreen-enter': svg(
    [bracket(2, 2, 1, 1), bracket(16, 2, -1, 1), bracket(2, 16, 1, -1), bracket(16, 16, -1, -1)].map((d) => path1(d)).join(''),
  ),
  'fullscreen-exit': svg(
    [bracket(7, 7, -1, -1), bracket(11, 7, 1, -1), bracket(7, 11, -1, 1), bracket(11, 11, 1, 1)].map((d) => path1(d)).join(''),
  ),
  gear: svg(gear()),
  switches: svg(switches()),
  quality: svg(quality()),
  speech: svg(speech({ hollow: true })),
  speed: svg(speed()),
  check: svg(path1(strokePolyline([P(3, 9), P(7, 13), P(15, 5)]))),
  chevron: svg(path1(strokePolyline([P(7, 5), P(11, 9), P(7, 13)]))),
  spinner: svg(path1(arcBand(C, 5.5, 7.5, 0, 270))),
};

// alternatives under review (shown in section (v) of the sheet, never exported)
export const variants = {};

// ---------------------------------------------------------------- outputs
const order = [
  ['play', 'pause'],
  ['restart', 'seek'],
  ['volume-high', 'volume-low', 'volume-off'],
  ['captions-off', 'captions-on'],
  ['pip-enter', 'pip-exit'],
  ['cast-enter', 'cast-exit'],
  ['airplay-enter', 'airplay-exit'],
  ['fullscreen-enter', 'fullscreen-exit'],
  ['gear', 'switches', 'quality'],
  ['speech', 'speed'],
  ['check', 'chevron', 'spinner'],
];

const names = Object.keys(icons).sort();
if (names.length !== 25) throw new Error(`expected 25 icons, got ${names.length}`);

const sheetTemplate = fs.readFileSync(path.join(here, 'sheet.template.html'), 'utf8');
const sheet = sheetTemplate.replace(
  '/*ICONS*/',
  `const ICONS = ${JSON.stringify(icons, null, 1)};\nconst ORDER = ${JSON.stringify(order)};\nconst VARIANTS = ${JSON.stringify(variants, null, 1)};`,
);
fs.writeFileSync(path.join(here, 'sheet.html'), sheet);

if (process.argv.includes('--ts')) {
  const ident = (k) => (/^[a-z]+$/.test(k) ? k : `'${k}'`);
  const body = names.map((k) => `  ${ident(k)}:\n    '${icons[k]}',`).join('\n');
  const ts = `/**
 * Usher icon family: 25 icons drawn for this skin on an 18x18 grid (design/spec.md §12).
 *
 * Filled shapes, \`fill="currentColor"\`, rendered at 18px. Live area 2..16; circles and triangles overshoot
 * to ~15. Every bar and every knock-out is 2px on whole pixels; outer corners r=1, containers r=2, clearance
 * cuts concentric (r + 2). Solid means now or on, hollow means elsewhere or off (captions, pip, cast, airplay).
 *
 * Generated from design/icons/build.mjs (the drawing source); review sheet: design/icons/sheet.html.
 * Only this file registers icons; skin.html refers to them as <media-icon family="usher" name="…">.
 */
import { registerIcons } from '@videojs/html/icons';

export const usherIcons = {
${body}
} as const satisfies Record<string, string>;

export type UsherIconName = keyof typeof usherIcons;

registerIcons('usher', usherIcons);
`;
  fs.writeFileSync(path.join(root, 'src/video/icons.ts'), ts);
}

console.log(`ok: ${names.length} icons`);
