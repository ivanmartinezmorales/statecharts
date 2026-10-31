'use strict';
// Four states of bedtime. Each scene paints in pixel units on a 240 x 160 picture, then places faces and glints.
const { W, H } = require('../../lib/pixel');
const K = require('./cast');
const { C } = K;

function tiles(P, x0, y0, w, h, base, grout, size = 8) {
  P.rect(x0, y0, w, h, base);
  P.fleckRect(x0, y0, w, h, ['#5fb3ad', '#4c9a96', '#6cc2b9'], 0.35, 0.8);
  for (let x = x0; x <= x0 + w; x += size) P.rect(x, y0, 0.5, h, grout);
  for (let y = y0; y <= y0 + h; y += size) P.rect(x0, y, w, 0.5, grout);
}

function floorboards(P, y0, a, b) {
  P.vgrad(0, y0, W, H - y0, [[0, a], [1, b]]);
  for (let y = y0 + 4; y < H; y += 6) P.rect(0, y, W, 0.6, 'rgba(20,10,30,0.35)');
  for (let y = y0; y < H; y += 6) for (let x = (y * 7) % 37; x < W; x += 37) P.rect(x, y, 0.6, 6, 'rgba(20,10,30,0.3)');
  P.fleckRect(0, y0, W, H - y0, ['rgba(255,220,180,0.08)', 'rgba(20,10,30,0.1)'], 0.15, 1.5);
}

function bedroomWall(P, top, bottom) {
  P.vgrad(0, 0, W, 118, [[0, top], [1, bottom]]);
  P.fleckRect(0, 0, W, 118, ['rgba(255,255,255,0.05)', 'rgba(0,0,30,0.1)'], 0.5, 1);
  for (let y = 8; y < 112; y += 18) for (let x = (y % 36 ? 14 : 4); x < W; x += 22) {
    P.poly([[x, y - 2], [x + 0.7, y - 0.6], [x + 2.2, y - 0.5], [x + 1, y + 0.5], [x + 1.4, y + 2], [x, y + 1.1], [x - 1.4, y + 2], [x - 1, y + 0.5], [x - 2.2, y - 0.5], [x - 0.7, y - 0.6]], 'rgba(255,236,190,0.16)');
  }
  P.rect(0, 116, W, 3, 'rgba(255,255,255,0.08)');
}

function bedroomWindow(P, sky, curtains) {
  const wx = 22, wy = 16, ww = 62, wh = 56;
  P.vgrad(wx, wy, ww, wh, sky);
  P.R && [...Array(26)].forEach(() => P.rect(wx + P.R() * ww, wy + P.R() * wh * 0.75, 0.8, 0.8, 'rgba(255,248,220,0.9)'));
  P.rect(wx - 3, wy - 3, ww + 6, 3, '#e8dccb'); P.rect(wx - 3, wy + wh, ww + 6, 4, '#e8dccb');
  P.rect(wx - 3, wy, 3, wh, '#e8dccb'); P.rect(wx + ww, wy, 3, wh, '#e8dccb'); P.rect(wx + ww / 2 - 1, wy, 2, wh, '#e8dccb'); P.rect(wx, wy + wh / 2 - 1, ww, 2, '#e8dccb');
  P.rect(wx - 10, wy - 8, ww + 20, 2.5, '#6b4a3a');
  P.poly([[wx - 9, wy - 6], [wx + 6, wy - 6], [wx + 2, wy + 30], [wx + 5, wy + wh + 10], [wx - 9, wy + wh + 10]], curtains[0]);
  P.poly([[wx + ww + 9, wy - 6], [wx + ww - 6, wy - 6], [wx + ww - 2, wy + 30], [wx + ww - 5, wy + wh + 10], [wx + ww + 9, wy + wh + 10]], curtains[0]);
  for (let i = 0; i < 3; i++) { P.rect(wx - 7 + i * 4, wy - 5, 1, wh + 14, curtains[1]); P.rect(wx + ww + 1 + i * 4, wy - 5, 1, wh + 14, curtains[1]); }
  return { wx, wy, ww, wh };
}

function bookshelf(P, x0, y0) {
  P.rect(x0, y0, 34, 44, '#5a3a2e'); P.rect(x0 + 2, y0 + 2, 30, 40, '#3a2420');
  const books = ['#c4503f', '#e3a64a', '#5f9e8f', '#7a6fc4', '#e48aa8', '#4f8091', '#d9c26a'];
  for (const sy of [y0 + 2, y0 + 16, y0 + 30]) {
    let x = x0 + 3;
    while (x < x0 + 30) { const w = 2 + Math.floor(P.R() * 3), h = 9 + Math.floor(P.R() * 3); P.rect(x, sy + 12 - h, w, h, P.R.pick(books)); x += w + 0.4; }
    P.rect(x0 + 2, sy + 12, 30, 2, '#5a3a2e');
  }
}

function bed(P, x0, y0, w, quilt) {
  P.shade(x0 + w / 2, y0 + 34, w * 0.6, 6, 0.55);
  P.rect(x0 + w - 8, y0 - 26, 8, 60, '#7a4e36'); P.rect(x0 + w - 7, y0 - 25, 3, 58, '#94634a');
  P.rect(x0, y0 + 12, w, 14, '#7a4e36'); P.rect(x0, y0 + 24, 5, 10, '#6b432e'); P.rect(x0 + w - 13, y0 + 24, 5, 10, '#6b432e');
  P.rrect(x0 + 2, y0 + 4, w - 10, 12, 2, '#efe6f2');
  P.rrect(x0 + 1, y0 + 2, w - 9, 14, 5, quilt[0]);
  for (let i = 0; i < w - 12; i += 8) for (let j = 0; j < 12; j += 6) if (((i + j) / 2) % 2 === 0) P.rect(x0 + 3 + i, y0 + 4 + j, 6, 5, quilt[1]);
  P.rect(x0 + 1, y0 + 14, w - 9, 2, quilt[2]);
}

function nightstand(P, x0, y0) {
  P.rect(x0, y0, 20, 26, '#6b4a3a'); P.rect(x0 + 2, y0 + 3, 16, 9, '#7d5847'); P.rect(x0 + 9, y0 + 7, 2, 1, '#e8c87a');
}

function lamp(P, x0, y0, on) {
  P.rect(x0 + 5, y0 + 10, 2, 8, '#cfa968'); P.rect(x0 + 2, y0 + 17, 8, 2, '#cfa968');
  P.poly([[x0, y0 + 10], [x0 + 12, y0 + 10], [x0 + 9.5, y0], [x0 + 2.5, y0]], on ? '#ffe2a8' : '#8f7f9e');
}

const scenes = {
  bath: {
    title: 'Bath time',
    paint(P) {
      tiles(P, 0, 0, W, 112, '#58a9a3', 'rgba(230,250,245,0.45)');
      P.rect(0, 108, W, 4, '#e8f1ec');
      P.vgrad(0, 112, W, 48, [[0, '#d7c3a8'], [1, '#a68a72']]);
      P.fleckRect(0, 112, W, 48, ['#c9b294', '#e2d0b6'], 0.4, 1);
      P.rrect(150, 132, 56, 16, 4, '#e48aa8'); P.fleckRect(152, 134, 52, 12, ['#f3a8bf', '#d77699'], 0.6, 0.8);
      P.glow(120, -10, 150, '#ffd9a0', 0.55);
      P.rect(170, 18, 40, 34, '#244a66'); P.rect(168, 16, 44, 2, '#f3efe6'); P.rect(168, 52, 44, 3, '#f3efe6'); P.rect(168, 16, 2, 38, '#f3efe6'); P.rect(210, 16, 2, 38, '#f3efe6');
      P.circle(198, 28, 5, '#fff2c4'); P.glow(198, 28, 18, '#fff2c4', 0.5);
      P.shade(92, 140, 70, 7, 0.5);
      P.rrect(30, 86, 124, 46, 16, '#f6f3ef'); P.rrect(30, 86, 124, 8, 4, '#ffffff');
      P.rrect(30, 104, 124, 28, 14, '#e6e0dc'); P.rect(42, 128, 6, 10, '#d9b46a'); P.rect(136, 128, 6, 10, '#d9b46a');
      P.rect(28, 66, 3, 22, '#c9c9cf'); P.rect(28, 64, 12, 3, '#c9c9cf');
      const girl = K.girlHead(P, 70, 74, { bun: true });
      P.ellipse(70, 88, 9, 5, C.skin);
      for (let i = 0; i < 46; i++) {
        const bx = 38 + P.R() * 110, by = 86 + P.R() * 8 - Math.max(0, 14 - Math.abs(bx - 70) * 0.5) * 0.3, r = 2 + P.R() * 4;
        P.circle(bx, by, r, P.R() < 0.6 ? '#ffffff' : '#e3dcf6');
      }
      P.circle(68, 65, 3, '#ffffff'); P.circle(72, 64, 2.4, '#f1edff');
      P.ellipse(124, 82, 6, 4.5, '#f5c84a'); P.circle(128, 76.5, 3.6, '#f5c84a'); P.poly([[131, 76], [135, 77], [131, 78.5]], '#ef8a3a');
      P.rect(170, 104, 26, 4, '#8a6a52'); P.rect(172, 108, 3, 24, '#8a6a52'); P.rect(191, 108, 3, 24, '#8a6a52');
      P.rrect(166, 98, 34, 8, 2, '#f4bcc6');
      const bear = K.bear(P, 183, 88, 0.85);
      for (let i = 0; i < 4; i++) P.beam([[60 + i * 18, 80], [66 + i * 18, 80], [80 + i * 18, 20], [70 + i * 18, 20]], '#ffffff', 0.05);
      P.vignette(0.45);
      return { girl, bear };
    },
    details(G, f) {
      K.girlFace(G, f.girl, 'happy'); K.bearFace(G, f.bear);
      G.set(127, 76, C.ink);
      for (const [x, y] of [[176, 24], [185, 37], [204, 43]]) G.twinkle(x, y, '#fff6d8');
      for (const [x, y] of [[90, 72], [104, 66], [58, 64], [116, 70]]) { G.set(x, y, '#ffffff'); G.set(x + 1, y - 1, '#d9f3ff'); }
    },
  },

  teeth: {
    title: 'Brushing teeth',
    paint(P) {
      tiles(P, 0, 0, W, 116, '#4f9792', 'rgba(220,245,240,0.35)');
      P.vgrad(0, 116, W, 44, [[0, '#cbb497'], [1, '#93785f']]);
      P.rrect(64, 12, 112, 60, 8, '#d6c7a8'); P.rrect(68, 16, 104, 52, 6, '#9fc6cf');
      P.vgrad(68, 16, 104, 52, [[0, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
      P.beam([[80, 16], [96, 16], [74, 68], [68, 68]], '#ffffff', 0.12);
      P.glow(120, 6, 60, '#ffe6b0', 0.7);
      for (let i = 0; i < 4; i++) P.circle(96 + i * 16, 8, 3, '#fff1c8');
      K.pajamas(P, 107, 70, 28, 30);
      const girl = K.girlHead(P, 121, 58);
      P.ellipse(111, 80, 3.4, 7, C.pj, 0.5); P.circle(114, 72, 2.6, C.skin);
      P.poly([[113, 71], [115, 70], [119.5, 63.4], [118.6, 62.6]], '#e48aa8'); P.rect(118, 62, 3, 1.6, '#ffffff');
      P.ellipse(121, 63, 2.2, 1.4, '#ffffff');
      P.shade(120, 98, 70, 4, 0.35);
      P.rect(40, 92, 160, 8, '#efe9e2'); P.rect(40, 100, 160, 30, '#d8cfc7'); P.rect(46, 104, 72, 22, '#cbc1b8'); P.rect(122, 104, 72, 22, '#cbc1b8');
      P.rect(80, 116, 3, 2, '#a99'); P.rect(158, 116, 3, 2, '#a99');
      P.rect(132, 84, 3, 9, '#c9c9cf'); P.rect(130, 82, 10, 3, '#c9c9cf');
      P.rrect(66, 82, 8, 11, 2, '#f4bcc6'); P.rect(68, 74, 1.5, 9, '#5fb3ad'); P.rect(71, 76, 1.5, 7, '#e3a64a');
      P.shade(120, 140, 50, 6, 0.5);
      const bear = K.bear(P, 166, 80, 0.8);
      P.glow(30, 110, 40, '#ffcf8a', 0.35);
      P.vignette(0.5);
      return { girl, bear };
    },
    details(G, f) {
      K.girlFace(G, { ...f.girl, mouth: [0, 0] }, 'open'); K.bearFace(G, f.bear);
      for (const [x, y] of [[123, 61], [124, 60], [119, 65]]) G.set(x, y, '#ffffff');
      for (const [x, y] of [[84, 22], [150, 30], [88, 58]]) G.twinkle(x, y, '#ffffff');
    },
  },

  story: {
    title: 'Story time',
    paint(P) {
      bedroomWall(P, '#3b2b63', '#5a3f74');
      bedroomWindow(P, [[0, '#1d2a66'], [1, '#6a4f9a']], ['#8d5e8c', '#734a73']);
      P.circle(70, 30, 5, '#fff3cf'); P.glow(70, 30, 20, '#fff3cf', 0.45);
      bookshelf(P, 196, 60);
      floorboards(P, 118, '#5e3f4c', '#2f2032');
      P.ellipse(120, 146, 70, 10, '#c9707a'); P.ellipse(120, 146, 60, 7.5, '#e09a8a'); P.ellipse(120, 146, 48, 5, '#c9707a');
      nightstand(P, 172, 98); lamp(P, 176, 80, true);
      bed(P, 60, 86, 112, ['#e48aa8', '#f4bcc6', '#b45f9a']);
      K.pajamas(P, 132, 78, 22, 20);
      const girl = K.girlHead(P, 143, 70);
      const bear = K.bear(P, 140, 88, 0.75);
      P.ellipse(134, 88, 3, 5, C.pj, 0.6); P.ellipse(150, 88, 3, 5, C.pjShade, -0.6);
      const parent = K.parent(P, 104, 70);
      P.poly([[86, 90], [100, 88], [101, 99], [87, 101]], C.page); P.poly([[100, 88], [113, 91], [111, 101], [101, 99]], '#efe1c2');
      P.rect(100, 88, 1, 11, C.cover);
      for (let i = 0; i < 4; i++) { P.rect(89, 91 + i * 2, 9, 0.5, '#b8a88c'); P.rect(103, 92 + i * 2, 7, 0.5, '#b8a88c'); }
      P.circle(88, 99, 2.4, C.skin); P.circle(110, 99, 2.4, C.skin);
      P.glow(182, 85, 120, '#ffb867', 0.85);
      P.glow(100, 94, 28, '#ffe9b8', 0.35);
      P.vignette(0.55);
      return { girl, bear, parent };
    },
    details(G, f) {
      K.girlFace(G, f.girl, 'open'); K.bearFace(G, f.bear); K.parentFace(G, f.parent);
      for (const [x, y] of [[34, 22], [48, 40], [78, 50], [40, 58]]) G.twinkle(x, y, '#fff6d8');
    },
  },

  asleep: {
    title: 'Asleep',
    paint(P) {
      bedroomWall(P, '#141a3f', '#262a5c');
      const w = bedroomWindow(P, [[0, '#0b1340'], [1, '#2c3d86']], ['#4a3a6e', '#3a2d5a']);
      P.circle(70, 30, 6, '#fff6d6'); P.circle(73, 28, 5, '#1a2560'); P.glow(68, 31, 30, '#d8e2ff', 0.6);
      bookshelf(P, 196, 60);
      P.rect(196, 60, 34, 44, 'rgba(10,10,40,0.45)');
      floorboards(P, 118, '#2c2850', '#151431');
      P.ellipse(120, 146, 70, 10, '#5b4a7a'); P.ellipse(120, 146, 60, 7.5, '#6e5a8c'); P.ellipse(120, 146, 48, 5, '#5b4a7a');
      nightstand(P, 172, 98); lamp(P, 176, 80, false);
      P.rect(172, 98, 20, 26, 'rgba(10,10,40,0.35)');
      P.rrect(180, 92, 8, 6, 3, '#ffd88a'); P.glow(184, 95, 40, '#ffbe6e', 0.5);
      bed(P, 60, 86, 112, ['#a86aa8', '#c48ec8', '#7a4f8a']);
      const girl = K.girlHead(P, 146, 84);
      const bear = K.bear(P, 126, 84, 0.7);
      P.rrect(61, 88, 102, 14, 5, '#a86aa8');
      for (let i = 0; i < 90; i += 8) for (let j = 0; j < 12; j += 6) if (((i + j) / 2) % 2 === 0) P.rect(63 + i, 90 + j, 6, 5, '#c48ec8');
      P.beam([[w.wx + 10, w.wy + w.wh], [w.wx + w.ww, w.wy + 6], [190, 150], [70, 160]], '#8f9cff', 0.22);
      P.glow(120, 10, 70, '#ffe6a8', 0.12);
      P.vignette(0.6);
      return { girl, bear };
    },
    details(G, f) {
      K.girlFace(G, f.girl, 'sleepy'); K.bearFace(G, f.bear, 'sleepy');
      for (const [x, y] of [[100, 8], [130, 14], [160, 6], [112, 26], [150, 30], [176, 18], [196, 10], [140, 46]]) G.twinkle(x, y, '#ffe6a8');
      const z = ['###', '..#', '.#.', '#..', '###'];
      G.sprite(156, 70, z.map((r) => r), { '#': '#cfc8ff' });
      G.sprite(161, 62, ['####', '...#', '..#.', '.#..', '####'], { '#': '#e9e3ff' });
    },
  },
};

module.exports = { scenes, room: { bedroomWall, bedroomWindow, bookshelf, bed, nightstand, lamp, floorboards } };
