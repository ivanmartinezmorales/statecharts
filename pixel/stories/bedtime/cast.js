'use strict';
// The people and the bear. Each paint function draws in pixel units and returns where the face is, so the
// detail pass can put eyes on the exact pixels.

const LIP = '#a04e55';
const C = {
  hair: '#5a3326', hairHi: '#8c5638', skin: '#f2c6a5', skinShade: '#d69b7f', blush: '#f08f8f', ink: '#2a1626',
  pj: '#b6a2e8', pjShade: '#8f7cc9', pjDot: '#f6e8ff',
  bear: '#b0703f', bearHi: '#d99c5f', bearShade: '#7e4a28', muzzle: '#efc493',
  parentHair: '#2e2230', sweater: '#4f8091', sweaterShade: '#365c6b', page: '#f7ecd2', cover: '#c4503f',
};

// `look` is 'sleepy', 'open', 'closed' or 'happy'
function girlHead(P, cx, cy, { bun = false } = {}) {
  P.circle(cx, cy, 7, C.hair);
  if (bun) P.circle(cx, cy - 7.5, 3.6, C.hair);
  P.fleckEllipse(cx, cy, 7, 7, [C.hairHi, '#6e402d'], 0.5, 0.5);
  P.ellipse(cx + 0.4, cy + 1.4, 5.3, 5.4, C.skin);
  P.ellipse(cx + 2.2, cy + 2.6, 2.6, 2.8, C.skinShade);
  P.ellipse(cx + 0.4, cy + 1.2, 4.6, 4.8, C.skin);
  P.ellipse(cx - 0.6, cy - 3.2, 6.2, 2.6, C.hair, -0.12);
  P.circle(cx - 6.2, cy + 0.5, 2, C.hair);
  return { eyes: [Math.round(cx - 3), Math.round(cx + 1.6)], eyeY: Math.round(cy + 1), mouth: [Math.round(cx - 0.4), Math.round(cy + 3.6)], cheeks: [[Math.round(cx - 4.2), Math.round(cy + 2.6)], [Math.round(cx + 3.6), Math.round(cy + 2.6)]] };
}

function girlFace(G, f, look) {
  const [l, r] = f.eyes, y = f.eyeY;
  for (const ex of [l, r]) {
    if (look === 'open') { G.set(ex, y, C.ink); G.set(ex, y + 1, C.ink); }
    else if (look === 'happy') { G.set(ex, y + 1, C.ink); G.set(ex + 1, y, C.ink); }
    else { G.set(ex, y + 1, C.ink); G.set(ex + 1, y + 1, C.ink); }
  }
  for (const [cx, cy] of f.cheeks) G.set(cx, cy, C.blush);
  const [mx, my] = f.mouth;
  if (!mx) return;
  if (look === 'happy' || look === 'open') { G.set(mx, my, LIP); G.set(mx + 1, my, LIP); }
  else G.set(mx, my, LIP);
}

function pajamas(P, x0, y0, w, h) {
  P.rrect(x0, y0, w, h, 4, C.pj);
  P.rrect(x0 + w * 0.55, y0, w * 0.45, h, 4, C.pjShade);
  P.rrect(x0, y0, w * 0.7, h, 4, C.pj);
  for (let j = 2; j < h - 1; j += 4) for (let i = 2 + (j % 8 ? 2 : 0); i < w - 1; i += 4) P.rect(x0 + i, y0 + j, 1, 1, C.pjDot);
}

function bear(P, cx, cy, s = 1) {
  const e = (dx, dy, rx, ry, c) => P.ellipse(cx + dx * s, cy + dy * s, rx * s, ry * s, c);
  e(0, 0, 6, 6.8, C.bear); e(-1.5, -1, 4, 5, C.bearHi); e(0, 1.5, 3.4, 3.6, C.muzzle);
  e(-5.5, 1, 2.4, 3.6, C.bear); e(5.5, 1, 2.4, 3.6, C.bearShade);
  e(-3.4, 6.4, 2.8, 2.2, C.bear); e(3.4, 6.4, 2.8, 2.2, C.bear);
  e(-4, -12, 2.4, 2.4, C.bear); e(4, -12, 2.4, 2.4, C.bear); e(-4, -12, 1.2, 1.2, C.muzzle); e(4, -12, 1.2, 1.2, C.muzzle);
  e(0, -8.5, 5.2, 4.8, C.bear); e(-1.6, -9.6, 3.2, 2.8, C.bearHi); e(0, -6.6, 2.4, 1.8, C.muzzle);
  return { eyes: [Math.round(cx - 2.8 * s), Math.round(cx + 2.2 * s)], eyeY: Math.round(cy - 9.2 * s), nose: [Math.round(cx - 0.4), Math.round(cy - 7 * s)] };
}

function bearFace(G, f, look = 'open') {
  for (const ex of f.eyes) {
    G.set(ex, f.eyeY + (look === 'sleepy' ? 1 : 0), look === 'sleepy' ? C.bearShade : C.ink);
  }
  G.set(f.nose[0], f.nose[1], C.ink);
}

function parent(P, cx, cy) {
  P.rrect(cx - 12, cy + 6, 24, 34, 8, C.sweater);
  P.rrect(cx + 2, cy + 6, 10, 34, 6, C.sweaterShade);
  P.ellipse(cx + 0.5, cy + 6, 3.4, 2, C.skinShade);
  P.circle(cx, cy - 2, 7.6, C.parentHair);
  P.ellipse(cx - 1.6, cy - 0.6, 5.4, 6, C.skin);
  P.ellipse(cx - 0.4, cy - 6.2, 6.6, 2.8, C.parentHair, 0.15);
  P.ellipse(cx + 5.6, cy, 3.2, 6.6, C.parentHair);
  return { eye: [Math.round(cx - 4.6), Math.round(cy - 1)], mouth: [Math.round(cx - 4.4), Math.round(cy + 2.6)] };
}

function parentFace(G, f) {
  const [ex, ey] = f.eye; G.set(ex, ey + 1, C.ink); G.set(ex + 1, ey, C.ink); G.set(ex + 2, ey + 1, C.ink);
  const [mx, my] = f.mouth; G.set(mx, my, C.ink); G.set(mx + 1, my + 1, C.ink); G.set(mx + 2, my + 1, C.ink);
}

module.exports = { C, girlHead, girlFace, pajamas, bear, bearFace, parent, parentFace };
