'use strict';
// The night folk of "Pip and the Fallen Star": Twinkle, the old owl, the fireflies and the Moon Whale.
// Pip and the girl come from the bedtime cast.
const K = require('../bedtime/cast');
const { C } = K;

const N = {
  star: '#ffe9a0', starDim: '#cdb87a', starHi: '#fffbe6',
  owl: '#8a6a4f', owlHi: '#b08b66', owlBelly: '#e3cfa6', owlEye: '#fff2c0', beak: '#e3a64a',
  fly: '#e9ff9a', jar: 'rgba(210,240,255,0.35)', jarRim: '#c9d8e0',
  whale: '#2f3f8f', whaleHi: '#4a5fb8', belly: '#b8c4f0', spot: '#bfe6ff',
  boat: '#f3eee2', boatShade: '#cfc6b4', cloud: '#c9b8e8', cloudHi: '#e8dcff', cloudShade: '#9a86c4',
};

function starPoints(cx, cy, r, inner = 0.48, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = rot + (i * Math.PI) / 5, rr = i % 2 ? r * inner : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return pts;
}

// Twinkle, the fallen star. `bright` runs from 0 (dim and scared) to 1 (home and shining).
function twinkle(P, cx, cy, r, bright = 0) {
  P.glow(cx, cy, r * (2.5 + bright * 4), bright > 0.5 ? N.starHi : N.star, 0.35 + bright * 0.5);
  P.poly(starPoints(cx, cy, r), bright > 0.3 ? N.star : N.starDim);
  P.poly(starPoints(cx - r * 0.12, cy - r * 0.12, r * 0.55), bright > 0.3 ? N.starHi : N.star);
  return { eyes: [Math.round(cx - r * 0.3), Math.round(cx + r * 0.18)], eyeY: Math.round(cy - r * 0.05), mouth: [Math.round(cx - r * 0.08), Math.round(cy + r * 0.3)] };
}

function twinkleFace(G, f, look = 'happy') {
  for (const ex of f.eyes) G.set(ex, f.eyeY, C.ink);
  const [mx, my] = f.mouth;
  if (look === 'sad') { G.set(mx - 1, my + 1, C.ink); G.set(mx, my, C.ink); G.set(mx + 1, my + 1, C.ink); }
  else { G.set(mx - 1, my, C.ink); G.set(mx, my + 1, C.ink); G.set(mx + 1, my, C.ink); }
}

function owl(P, cx, cy, s = 1) {
  const e = (dx, dy, rx, ry, c, rot = 0) => P.ellipse(cx + dx * s, cy + dy * s, rx * s, ry * s, c, rot);
  e(-8, 2, 5, 11, N.owl, 0.25); e(8, 2, 5, 11, N.owl, -0.25);
  e(0, 0, 10, 13, N.owl); e(0, 3, 7, 9, N.owlBelly);
  for (let j = 0; j < 3; j++) for (let i = -1; i <= 1; i++) e(i * 3.2, -1 + j * 4 + (i ? 1 : 0), 1, 0.6, N.owlHi);
  e(0, -12, 10, 8, N.owl);
  P.poly([[cx - 9 * s, cy - 17 * s], [cx - 5 * s, cy - 24 * s], [cx - 3 * s, cy - 17 * s]], N.owl);
  P.poly([[cx + 9 * s, cy - 17 * s], [cx + 5 * s, cy - 24 * s], [cx + 3 * s, cy - 17 * s]], N.owl);
  e(-4.2, -12, 3.6, 3.6, N.owlEye); e(4.2, -12, 3.6, 3.6, N.owlEye);
  P.poly([[cx - 1.4 * s, cy - 9.5 * s], [cx + 1.4 * s, cy - 9.5 * s], [cx, cy - 6.5 * s]], N.beak);
  e(-3, 13, 2, 1, N.beak); e(3, 13, 2, 1, N.beak);
  return { eyes: [[Math.round(cx - 4.2 * s), Math.round(cy - 12 * s)], [Math.round(cx + 4.2 * s), Math.round(cy - 12 * s)]] };
}

function owlFace(G, f, look = 'kind') {
  for (const [x, y] of f.eyes) {
    if (look === 'kind') { G.set(x - 1, y, C.ink); G.set(x, y - 1, C.ink); G.set(x + 1, y, C.ink); }
    else { G.set(x, y, C.ink); G.set(x + 1, y, C.ink); G.set(x, y + 1, C.ink); G.set(x + 1, y + 1, C.ink); G.set(x, y, '#ffffff'); }
  }
}

function firefly(P, x, y, glow = 9) { P.glow(x, y, glow, '#d8ff7a', 0.55); P.rect(x - 0.5, y - 0.5, 1.2, 1.2, N.fly); }

function jar(P, cx, cy, flies = 5) {
  P.glow(cx, cy, 34, '#d8ff7a', 0.55);
  P.rrect(cx - 6, cy - 8, 12, 16, 3, N.jar);
  P.rect(cx - 6.5, cy - 10, 13, 2.5, N.jarRim);
  P.line([[cx - 4, cy - 10], [cx, cy - 15], [cx + 4, cy - 10]], '#8a7a6a', 0.8);
  for (let i = 0; i < flies; i++) P.rect(cx - 4 + P.R() * 8, cy - 6 + P.R() * 12, 1.2, 1.2, N.fly);
}

function boat(P, cx, cy, s = 1) {
  P.poly([[cx - 22 * s, cy - 4 * s], [cx + 22 * s, cy - 4 * s], [cx + 14 * s, cy + 6 * s], [cx - 14 * s, cy + 6 * s]], N.boat);
  P.poly([[cx, cy - 4 * s], [cx + 22 * s, cy - 4 * s], [cx + 14 * s, cy + 6 * s], [cx, cy + 6 * s]], N.boatShade);
  P.poly([[cx - 1 * s, cy - 30 * s], [cx - 1 * s, cy - 5 * s], [cx - 16 * s, cy - 5 * s]], N.boat);
  P.poly([[cx + 1 * s, cy - 24 * s], [cx + 1 * s, cy - 5 * s], [cx + 12 * s, cy - 5 * s]], N.boatShade);
  P.rect(cx - 0.6 * s, cy - 31 * s, 1.2 * s, 27 * s, '#8a6a52');
}

function cloudBank(P, y, colors, R, count = 16, spread = 240) {
  for (let i = 0; i < count; i++) {
    const x = (i / (count - 1)) * spread + R.range(-8, 8), r = R.range(10, 22);
    P.circle(x, y + R.range(-4, 6), r, colors[0]);
  }
  for (let i = 0; i < count; i++) { const x = (i / (count - 1)) * spread + R.range(-8, 8); P.circle(x, y - 6 + R.range(-3, 3), R.range(5, 10), colors[1]); }
  P.rect(0, y + 8, spread, 160 - y, colors[0]);
}

function whale(P, cx, cy, s = 1) {
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, x = cx - 70 * s + t * 140 * s;
    const top = cy - Math.sin(Math.PI * Math.min(1, t * 1.15)) * 26 * s, bottom = cy + Math.sin(Math.PI * Math.min(1, t * 1.05)) * 18 * s;
    pts.push([x, top, bottom]);
  }
  P.poly([...pts.map(([x, t]) => [x, t]), ...pts.reverse().map(([x, , b]) => [x, b])], N.whale);
  P.ellipse(cx - 10 * s, cy + 8 * s, 52 * s, 9 * s, N.belly);
  for (let i = 0; i < 7; i++) P.rect(cx - 50 * s + i * 13 * s, cy + 6 * s, 7 * s, 1 * s, '#93a1dc');
  P.ellipse(cx - 18 * s, cy - 14 * s, 38 * s, 9 * s, N.whaleHi, -0.08);
  P.poly([[cx + 62 * s, cy - 4 * s], [cx + 86 * s, cy - 22 * s], [cx + 80 * s, cy], [cx + 88 * s, cy + 14 * s]], N.whale);
  P.poly([[cx - 8 * s, cy + 12 * s], [cx + 10 * s, cy + 14 * s], [cx - 2 * s, cy + 28 * s]], N.whaleHi);
  for (const [dx, dy] of [[-30, -16], [-12, -20], [6, -18], [22, -12], [-40, -6], [36, -6]]) { P.glow(cx + dx * s, cy + dy * s, 8 * s, N.spot, 0.6); P.circle(cx + dx * s, cy + dy * s, 1.6 * s, N.spot); }
  return { eye: [Math.round(cx - 52 * s), Math.round(cy - 4 * s)], smile: [Math.round(cx - 60 * s), Math.round(cy + 4 * s)] };
}

function whaleFace(G, f) {
  const [x, y] = f.eye; G.set(x, y + 1, '#0e1440'); G.set(x + 1, y, '#0e1440'); G.set(x + 2, y + 1, '#0e1440');
  const [mx, my] = f.smile; for (let i = 0; i < 8; i++) G.set(mx + i, my + Math.round(Math.sin((i / 7) * Math.PI) * 1.5), '#1a2466');
}

function dandelion(P, cx, cy, r = 6) {
  P.line([[cx, cy], [cx + 1, cy + r * 3]], '#8fb37a', 0.8);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; P.line([[cx, cy], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]], 'rgba(255,255,255,0.75)', 0.4); P.rect(cx + Math.cos(a) * r - 0.5, cy + Math.sin(a) * r - 0.5, 1, 1, '#ffffff'); }
  P.circle(cx, cy, 1.2, '#e8e2c8');
}

function notes(G, x, y, color) {
  G.sprite(x, y, ['..##', '..#.', '..#.', '###.', '##..'], { '#': color });
  G.sprite(x + 8, y - 6, ['.###', '.#.#', '.#.#', '##.#', '#.##'], { '#': color });
}

module.exports = { N, starPoints, twinkle, twinkleFace, owl, owlFace, firefly, jar, boat, cloudBank, whale, whaleFace, dandelion, notes };
