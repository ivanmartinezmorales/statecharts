'use strict';
// Paints a scene with light and texture, then cuts it down to real pixels: a small palette, light ordered dither,
// and a hand-placed detail pass (eyes, glints) on top so faces stay crisp.
//
// Scenes are drawn in pixel units: (0,0) is the top-left pixel, the picture is w x h pixels (W x H unless a scene
// asks for another size). The painter draws at
// SS times that size, so a 1-unit fleck becomes texture inside one final pixel.
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');

const W = 240, H = 160, SS = 4;

function rng(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) | 0;
  s = s >>> 0 || 1;
  const R = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  R.range = (a, b) => a + R() * (b - a);
  R.pick = (xs) => xs[Math.floor(R() * xs.length)];
  return R;
}

const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return rgb(A.map((v, i) => v + (B[i] - v) * t)); };

// ---- painting helpers, bound to one context and one random stream
function painter(x, R, w, h) {
  const P = {
    x, R, w, h,
    rect(x0, y0, w, h, fill) { x.fillStyle = fill; x.fillRect(x0, y0, w, h); },
    rrect(x0, y0, w, h, r, fill) {
      x.beginPath(); x.moveTo(x0 + r, y0); x.arcTo(x0 + w, y0, x0 + w, y0 + h, r); x.arcTo(x0 + w, y0 + h, x0, y0 + h, r);
      x.arcTo(x0, y0 + h, x0, y0, r); x.arcTo(x0, y0, x0 + w, y0, r); x.closePath(); x.fillStyle = fill; x.fill();
    },
    ellipse(cx, cy, rx, ry, fill, rot = 0) { x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); x.fillStyle = fill; x.fill(); },
    circle(cx, cy, r, fill) { P.ellipse(cx, cy, r, r, fill); },
    poly(pts, fill) { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) x.lineTo(p[0], p[1]); x.closePath(); x.fillStyle = fill; x.fill(); },
    vgrad(x0, y0, w, h, stops) {
      const g = x.createLinearGradient(0, y0, 0, y0 + h); stops.forEach(([t, c]) => g.addColorStop(t, c)); x.fillStyle = g; x.fillRect(x0, y0, w, h);
    },
    // light that adds: lamps, moonlight, candle glow
    glow(cx, cy, r, color, alpha = 0.8) {
      const [cr, cg, cb] = hex(color);
      x.save(); x.globalCompositeOperation = 'lighter';
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`); g.addColorStop(0.35, `rgba(${cr},${cg},${cb},${alpha * 0.35})`); g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); x.restore();
    },
    // shade that multiplies: soft shadows under things
    shade(cx, cy, rx, ry, alpha = 0.45) {
      x.save(); x.translate(cx, cy); x.scale(1, ry / rx);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, `rgba(10,5,25,${alpha})`); g.addColorStop(1, 'rgba(10,5,25,0)');
      x.fillStyle = g; x.fillRect(-rx, -rx, 2 * rx, 2 * rx); x.restore();
    },
    beam(pts, color, alpha = 0.25) {
      const [cr, cg, cb] = hex(color);
      x.save(); x.globalCompositeOperation = 'lighter';
      const g = x.createLinearGradient(pts[0][0], pts[0][1], pts[2][0], pts[2][1]);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`); g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) x.lineTo(p[0], p[1]); x.closePath(); x.fillStyle = g; x.fill(); x.restore();
    },
    // painterly texture: flecks of nearby colours inside a clip region
    fleck(region, colors, density = 0.6, size = 0.6) {
      x.save(); x.beginPath(); region(x); x.clip();
      const b = P._bounds;
      for (let i = 0; i < density * b.w * b.h; i++) { x.fillStyle = R.pick(colors); x.fillRect(b.x + R() * b.w, b.y + R() * b.h, size, size); }
      x.restore();
    },
    fleckRect(x0, y0, w, h, colors, density, size) { P._bounds = { x: x0, y: y0, w, h }; P.fleck((c) => c.rect(x0, y0, w, h), colors, density, size); },
    fleckEllipse(cx, cy, rx, ry, colors, density, size) { P._bounds = { x: cx - rx, y: cy - ry, w: 2 * rx, h: 2 * ry }; P.fleck((c) => c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2), colors, density, size); },
    vignette(strength = 0.6, color = [8, 4, 20]) {
      const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
      g.addColorStop(0, `rgba(${color},0)`); g.addColorStop(1, `rgba(${color},${strength})`);
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    },
    line(pts, color, width = 1) { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) x.lineTo(p[0], p[1]); x.strokeStyle = color; x.lineWidth = width; x.stroke(); },
  };
  return P;
}

// ---- palette: k-means++ so small bright colours (a pink quilt, a lamp) win a slot of their own
function palette(px, k, R) {
  const n = px.length / 3, d2 = (i, c) => (px[3 * i] - c[0]) ** 2 * 0.9 + (px[3 * i + 1] - c[1]) ** 2 * 1.2 + (px[3 * i + 2] - c[2]) ** 2 * 0.8;
  const cent = [[px[0], px[1], px[2]]], best = new Float32Array(n).fill(1e12);
  while (cent.length < k) {
    let tot = 0; const c = cent[cent.length - 1];
    for (let i = 0; i < n; i++) { best[i] = Math.min(best[i], d2(i, c)); tot += best[i]; }
    let t = R() * tot, i = 0; for (; i < n - 1 && (t -= best[i]) > 0; i++);
    cent.push([px[3 * i], px[3 * i + 1], px[3 * i + 2]]);
  }
  for (let it = 0; it < 10; it++) {
    const sum = cent.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < n; i++) { let bi = 0, bd = 1e12; for (let c = 0; c < k; c++) { const d = d2(i, cent[c]); if (d < bd) { bd = d; bi = c; } } const s = sum[bi]; s[0] += px[3 * i]; s[1] += px[3 * i + 1]; s[2] += px[3 * i + 2]; s[3]++; }
    sum.forEach((s, c) => { if (s[3]) cent[c] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
  }
  return cent;
}

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

// ---- the detail pass works on the final pixels
function grid(pix, W, H) {
  const G = {
    set(px, py, color) { px |= 0; py |= 0; if (px < 0 || py < 0 || px >= W || py >= H) return; const c = typeof color === 'string' ? hex(color) : color; pix.set(c, 3 * (py * W + px)); },
    get(px, py) { const i = 3 * (py * W + px); return [pix[i], pix[i + 1], pix[i + 2]]; },
    row(px, py, n, color) { for (let i = 0; i < n; i++) G.set(px + i, py, color); },
    col(px, py, n, color) { for (let i = 0; i < n; i++) G.set(px, py + i, color); },
    // `art` is rows of characters; `key` maps a character to a colour, others are skipped
    sprite(px, py, art, key) { art.forEach((r, j) => [...r].forEach((ch, i) => { if (key[ch]) G.set(px + i, py + j, key[ch]); })); },
    sleepyEyes(px, py, color) { G.set(px, py, color); G.set(px + 1, py + 1, color); G.set(px + 2, py + 1, color); G.set(px + 3, py, color); },
    openEye(px, py, color, glint = '#ffffff') { G.set(px, py, color); G.set(px + 1, py, color); G.set(px, py + 1, color); G.set(px + 1, py + 1, color); G.set(px + 1, py, glint); },
    twinkle(px, py, color) { G.set(px, py, color); G.set(px - 1, py, color); G.set(px + 1, py, color); G.set(px, py - 1, color); G.set(px, py + 1, color); },
  };
  return G;
}

async function render({ id, outDir, colors = 40, dither = 7, seed, paint, details, upscale = 6, w: W = module.exports.W, h: H = module.exports.H }) {
  const R = rng(seed || id);
  const hi = createCanvas(W * SS, H * SS), x = hi.getContext('2d');
  x.scale(SS, SS);
  paint(painter(x, R, W, H));

  const lo = createCanvas(W, H), lc = lo.getContext('2d');
  lc.imageSmoothingEnabled = true; lc.imageSmoothingQuality = 'high'; lc.drawImage(hi, 0, 0, W, H);
  const d = lc.getImageData(0, 0, W, H).data, px = new Float32Array(W * H * 3);
  for (let i = 0; i < W * H; i++) { px[3 * i] = d[4 * i]; px[3 * i + 1] = d[4 * i + 1]; px[3 * i + 2] = d[4 * i + 2]; }

  const pal = palette(px, colors, R), pix = new Uint8ClampedArray(W * H * 3);
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    const i = y * W + xx, t = (BAYER[y & 3][xx & 3] / 16 - 0.5) * dither;
    const r = px[3 * i] + t, g = px[3 * i + 1] + t, b = px[3 * i + 2] + t;
    let best = pal[0], bd = 1e12;
    for (const p of pal) { const dd = (r - p[0]) ** 2 * 0.9 + (g - p[1]) ** 2 * 1.2 + (b - p[2]) ** 2 * 0.8; if (dd < bd) { bd = dd; best = p; } }
    pix[3 * i] = best[0]; pix[3 * i + 1] = best[1]; pix[3 * i + 2] = best[2];
  }
  if (details) details(grid(pix, W, H), R);

  const out = createCanvas(W * upscale, H * upscale), oc = out.getContext('2d');
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    const i = 3 * (y * W + xx); oc.fillStyle = `rgb(${pix[i]},${pix[i + 1]},${pix[i + 2]})`; oc.fillRect(xx * upscale, y * upscale, upscale, upscale);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${id}.png`);
  fs.writeFileSync(file, await out.encode('png'));
  return { file, canvas: out };
}

module.exports = { W, H, render, mix, hex, rgb };
