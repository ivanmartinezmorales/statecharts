'use strict';
// Pip and the Fallen Star, one picture per state of the chart.
const { W, H } = require('../../lib/pixel');
const K = require('../bedtime/cast');
const { room } = require('../bedtime/scenes');
const S = require('./cast');
const { C } = K;
const { N } = S;

function nightSky(P, top, bottom, stars = 60, h = H) {
  P.vgrad(0, 0, W, h, [[0, top], [1, bottom]]);
  for (let i = 0; i < stars; i++) { const a = 0.3 + P.R() * 0.7; P.rect(P.R() * W, P.R() * h * 0.8, 0.8, 0.8, `rgba(255,248,220,${a})`); }
}

function grass(P, y0, a, b) {
  P.vgrad(0, y0, W, H - y0, [[0, a], [1, b]]);
  for (let i = 0; i < 260; i++) {
    const x = P.R() * W, y = y0 + P.R() * (H - y0), h = 3 + P.R() * 5;
    P.line([[x, y], [x + P.R.range(-1.5, 1.5), y - h]], P.R() < 0.5 ? '#2f6b4f' : '#1f4d3a', 0.7);
  }
}

function bedroomAtNight(P) {
  room.bedroomWall(P, '#141a3f', '#262a5c');
  const w = room.bedroomWindow(P, [[0, '#0b1340'], [1, '#2c3d86']], ['#4a3a6e', '#3a2d5a']);
  room.bookshelf(P, 196, 60);
  P.rect(196, 60, 34, 44, 'rgba(10,10,40,0.45)');
  room.floorboards(P, 118, '#2c2850', '#151431');
  P.ellipse(120, 146, 70, 10, '#5b4a7a'); P.ellipse(120, 146, 60, 7.5, '#6e5a8c'); P.ellipse(120, 146, 48, 5, '#5b4a7a');
  room.nightstand(P, 172, 98); room.lamp(P, 176, 80, false);
  P.rect(172, 98, 20, 26, 'rgba(10,10,40,0.35)');
  P.rrect(180, 92, 8, 6, 3, '#ffd88a'); P.glow(184, 95, 40, '#ffbe6e', 0.45);
  room.bed(P, 60, 86, 112, ['#a86aa8', '#c48ec8', '#7a4f8a']);
  return w;
}

function quilt(P) {
  P.rrect(61, 88, 102, 14, 5, '#a86aa8');
  for (let i = 0; i < 90; i += 8) for (let j = 0; j < 12; j += 6) if (((i + j) / 2) % 2 === 0) P.rect(63 + i, 90 + j, 6, 5, '#c48ec8');
}

const scenes = {
  window: {
    paint(P) {
      const w = bedroomAtNight(P);
      const girl = K.girlHead(P, 146, 84);
      quilt(P);
      P.beam([[w.wx + 10, w.wy + w.wh], [w.wx + w.ww, w.wy + 6], [190, 150], [70, 160]], '#8f9cff', 0.16);
      for (let i = 0; i < 14; i++) { const t = i / 13; P.circle(w.wx + w.ww - 6 - t * 40, w.wy + 6 + t * 26, 0.6 + t * 1.6, `rgba(255,240,180,${0.15 + t * 0.7})`); }
      P.glow(w.wx + w.ww - 46, w.wy + 32, 18, '#fff1b0', 0.9);
      P.rect(w.wx - 3, w.wy + w.wh, w.ww + 6, 4, '#e8dccb');
      const bear = K.bear(P, w.wx + 20, w.wy + w.wh - 9, 0.85);
      P.vignette(0.6);
      return { girl, bear, flash: [w.wx + w.ww - 46, w.wy + 32] };
    },
    details(G, f) {
      K.girlFace(G, f.girl, 'sleepy'); K.bearFace(G, f.bear);
      G.twinkle(f.flash[0], f.flash[1], '#fffbe6');
    },
  },

  garden: {
    paint(P) {
      nightSky(P, '#0a1035', '#2a3a7a');
      P.circle(200, 28, 8, '#fff6d6'); P.circle(204, 25, 7, '#121a4a'); P.glow(198, 30, 30, '#d8e2ff', 0.4);
      P.rect(0, 40, 70, 80, '#3a2f52'); P.poly([[-6, 40], [35, 14], [76, 40]], '#2b2340');
      P.rect(18, 56, 26, 22, '#e8dccb'); P.rect(20, 58, 22, 18, '#1f2a66'); P.rect(30, 58, 2, 18, '#e8dccb'); P.rect(20, 66, 22, 2, '#e8dccb');
      for (let x = 70; x < W; x += 9) { P.rect(x, 86, 6, 26, '#cfc3b0'); P.poly([[x, 86], [x + 3, 82], [x + 6, 86]], '#cfc3b0'); }
      P.rect(70, 92, W, 3, '#b3a690'); P.rect(70, 104, W, 3, '#b3a690');
      P.rect(70, 86, W, 26, 'rgba(15,20,60,0.45)');
      grass(P, 108, '#2a5a44', '#14301f');
      for (let i = 0; i < 40; i++) { const x = P.R() * W, y = 112 + P.R() * 46; P.circle(x, y, 1.4, P.R.pick(['#f4bcc6', '#e9e3ff', '#ffd88a'])); }
      P.ellipse(130, 136, 24, 5, 'rgba(255,230,150,0.25)');
      const star = S.twinkle(P, 130, 128, 7, 0);
      const bear = K.bear(P, 98, 122, 1);
      P.vignette(0.55);
      return { star, bear };
    },
    details(G, f) {
      S.twinkleFace(G, f.star, 'sad'); K.bearFace(G, f.bear);
      for (const [x, y] of [[120, 120], [142, 122], [136, 140]]) G.set(x, y, '#fff1b0');
    },
  },

  owl: {
    paint(P) {
      nightSky(P, '#0c1238', '#30407e');
      P.circle(70, 44, 26, '#fff4cf'); P.glow(70, 44, 70, '#fff0c0', 0.45);
      P.fleckEllipse(70, 44, 26, 26, ['#efe0b0', '#f7ead0'], 0.4, 2);
      P.poly([[150, 160], [160, 0], [214, 0], [222, 160]], '#3a2a24');
      P.poly([[176, 160], [182, 0], [214, 0], [222, 160]], '#2a1e1a');
      for (let y = 6; y < 160; y += 9) P.rect(162 + P.R() * 40, y, 8 + P.R() * 10, 0.8, '#4f3a30');
      P.poly([[60, 74], [162, 64], [162, 72], [60, 78]], '#3a2a24');
      for (const [x, y] of [[66, 70], [80, 66], [96, 70]]) { P.circle(x, y, 7, '#2f5a46'); P.circle(x + 5, y - 3, 5, '#3c7058'); }
      P.ellipse(186, 40, 8, 12, '#120c10');
      const owl = S.owl(P, 128, 50, 1);
      grass(P, 128, '#24503c', '#122a1c');
      const bear = K.bear(P, 74, 138, 0.9);
      const star = S.twinkle(P, 94, 120, 6, 0.15);
      P.vignette(0.5);
      return { owl, bear, star };
    },
    details(G, f) {
      S.owlFace(G, f.owl, 'kind'); K.bearFace(G, f.bear); S.twinkleFace(G, f.star, 'happy');
      S.notes(G, 140, 22, '#fff1c8');
    },
  },

  meadow: {
    paint(P) {
      nightSky(P, '#0d1636', '#1f3a5a', 50);
      P.poly([[0, 96], [60, 78], [130, 92], [200, 74], [240, 86], [240, 120], [0, 120]], '#1d3b3a');
      P.poly([[0, 108], [80, 94], [170, 104], [240, 96], [240, 130], [0, 130]], '#204a3c');
      grass(P, 112, '#1f4d3a', '#0f2a1e');
      for (let i = 0; i < 70; i++) { const x = P.R() * W, y = 104 + P.R() * 56, h = 14 + P.R() * 20; P.line([[x, y], [x + P.R.range(-3, 3), y - h]], '#163a2a', 1.2); }
      for (let i = 0; i < 46; i++) S.firefly(P, P.R() * W, 30 + P.R() * 110, 5 + P.R() * 8);
      const bear = K.bear(P, 112, 128, 1);
      S.jar(P, 128, 118, 7);
      const star = S.twinkle(P, 144, 104, 6.5, 0.35);
      P.vignette(0.55);
      return { bear, star };
    },
    details(G, f) {
      K.bearFace(G, f.bear); S.twinkleFace(G, f.star, 'happy');
      for (let i = 0; i < 14; i++) G.set(10 + ((i * 47) % 220), 26 + ((i * 29) % 110), '#f4ffc0');
    },
  },

  clouds: {
    paint(P) {
      nightSky(P, '#120d3a', '#4a3a8a', 80, 110);
      P.circle(190, 30, 14, '#fff6d6'); P.circle(196, 26, 12, '#1c1650'); P.glow(186, 32, 44, '#e8e0ff', 0.4);
      S.cloudBank(P, 92, [N.cloudShade, '#b6a4dc'], P.R, 14);
      S.cloudBank(P, 112, [N.cloud, N.cloudHi], P.R, 18);
      for (let i = 0; i < 6; i++) P.rrect(18 + i * 9, 150 - i * 7, 14, 4, 2, N.cloudHi);
      S.boat(P, 120, 112, 1.15);
      const bear = K.bear(P, 110, 98, 0.85);
      S.jar(P, 140, 94, 6);
      const star = S.twinkle(P, 126, 64, 6, 0.45);
      S.cloudBank(P, 140, [N.cloudHi, '#f4ecff'], P.R, 18);
      P.vignette(0.5);
      return { bear, star };
    },
    details(G, f) { K.bearFace(G, f.bear); S.twinkleFace(G, f.star, 'happy'); },
  },

  whale: {
    paint(P) {
      nightSky(P, '#0a0a30', '#2c2a70', 90, 120);
      P.circle(196, 34, 22, '#fff6d6'); P.circle(204, 28, 20, '#14123e'); P.glow(190, 36, 60, '#f0e6ff', 0.45);
      const whale = S.whale(P, 116, 76, 1);
      S.cloudBank(P, 136, [N.cloud, N.cloudHi], P.R, 18);
      S.boat(P, 36, 124, 0.7);
      const bear = K.bear(P, 30, 114, 0.6);
      S.jar(P, 48, 112, 4);
      const star = S.twinkle(P, 40, 92, 4.5, 0.6);
      P.vignette(0.5);
      return { whale, bear, star };
    },
    details(G, f) {
      S.whaleFace(G, f.whale); K.bearFace(G, f.bear); S.twinkleFace(G, f.star, 'happy');
      S.notes(G, 60, 104, '#ffe9a0'); S.notes(G, 72, 98, '#e8dcff');
    },
  },

  sky: {
    paint(P) {
      nightSky(P, '#070a2a', '#33307a', 120);
      for (const [x, y] of [[40, 30], [70, 18], [100, 26], [180, 20], [210, 34], [160, 46]]) { P.glow(x, y, 10, '#fff4cf', 0.5); P.circle(x, y, 1.2, '#fffbe6'); }
      P.line([[40, 30], [70, 18], [100, 26]], 'rgba(255,244,207,0.25)', 0.6); P.line([[180, 20], [210, 34], [160, 46], [180, 20]], 'rgba(255,244,207,0.25)', 0.6);
      const star = S.twinkle(P, 130, 40, 11, 1);
      const whale = S.whale(P, 120, 118, 0.62);
      const bear = K.bear(P, 130, 92, 0.6);
      P.glow(130, 40, 120, '#fff0c0', 0.25);
      S.cloudBank(P, 146, [N.cloud, N.cloudHi], P.R, 18);
      P.vignette(0.45);
      return { star, whale, bear };
    },
    details(G, f) {
      S.twinkleFace(G, f.star, 'happy'); S.whaleFace(G, f.whale); K.bearFace(G, f.bear);
      for (const [x, y] of [[112, 26], [150, 30], [120, 58], [146, 54]]) G.twinkle(x, y, '#fffbe6');
    },
  },

  dreams: {
    paint(P) {
      const w = bedroomAtNight(P);
      S.twinkle(P, w.wx + w.ww - 18, w.wy + 16, 5, 1);
      const girl = K.girlHead(P, 146, 84);
      const bear = K.bear(P, 128, 86, 0.7);
      quilt(P);
      P.beam([[w.wx + 10, w.wy + w.wh], [w.wx + w.ww, w.wy + 6], [190, 150], [70, 160]], '#ffe9a0', 0.12);
      S.dandelion(P, 100, 40, 4);
      P.vignette(0.6);
      return { girl, bear, star: [w.wx + w.ww - 18, w.wy + 16] };
    },
    details(G, f) {
      K.girlFace(G, f.girl, 'sleepy'); K.bearFace(G, f.bear, 'sleepy');
      G.twinkle(f.star[0] - 9, f.star[1] + 6, '#fffbe6');
      G.sprite(160, 64, ['####', '...#', '..#.', '.#..', '####'], { '#': '#e9e3ff' });
    },
  },
  pond: {
    paint(P) {
      nightSky(P, '#0b1238', '#2b3a78', 60, 100);
      P.circle(170, 26, 12, '#fff6d6'); P.glow(170, 26, 40, '#e8f0ff', 0.5);
      P.poly([[0, 76], [70, 62], [150, 72], [240, 60], [240, 100], [0, 100]], '#1c3540');
      grass(P, 96, '#22483a', '#132a20');
      P.ellipse(130, 124, 104, 26, '#14284e'); P.ellipse(130, 124, 96, 22, '#1d3a6e');
      P.vgrad(34, 104, 192, 42, [[0, 'rgba(120,150,230,0.25)'], [1, 'rgba(10,20,60,0)']]);
      P.ellipse(170, 116, 10, 4, '#fff1c8'); P.glow(170, 116, 34, '#cfe0ff', 0.5);
      for (let i = 0; i < 6; i++) P.rect(150 + P.R() * 40, 120 + i * 3, 6 + P.R() * 10, 0.6, 'rgba(255,240,200,0.45)');
      for (let i = 0; i < 9; i++) { const x = 30 + i * 4 + P.R() * 3; P.line([[x, 112], [x + 1, 76 + P.R() * 12]], '#2f5a3a', 1.2); P.ellipse(x + 1, 80 + P.R() * 10, 1.2, 3.6, '#6b4a2e'); }
      S.lilyPad(P, 96, 120, 12); S.lilyPad(P, 132, 134, 10, true); S.lilyPad(P, 192, 130, 9, true); S.lilyPad(P, 78, 136, 8, true);
      const frog = S.frog(P, 96, 114, 1);
      const bear = K.bear(P, 214, 106, 0.95);
      S.jar(P, 196, 104, 0, { moonWater: true });
      const star = S.twinkle(P, 206, 80, 6, 0.3);
      P.vignette(0.55);
      return { frog, bear, star };
    },
    details(G, f) {
      S.frogFace(G, f.frog); K.bearFace(G, f.bear); S.twinkleFace(G, f.star, 'happy');
      for (const [x, y] of [[112, 108], [150, 128], [60, 120]]) G.set(x, y, '#e8f0ff');
    },
  },

  sheep: {
    paint(P) {
      nightSky(P, '#0e0a34', '#3c3484', 90, 120);
      const star = S.twinkle(P, 150, 18, 6, 0.8);
      const flock = [[150, 120], [146, 104], [154, 89], [147, 74], [153, 59], [148, 44], [151, 30]];
      for (const [i, [x, y]] of flock.entries()) S.sheep(P, x, y, 1.05, i % 2 === 1);
      S.cloudBank(P, 120, [N.cloud, N.cloudHi], P.R, 16);
      for (const [x, y] of [[196, 112], [214, 118], [32, 116]]) S.sheep(P, x, y, 0.9, x > 100);
      S.boat(P, 70, 116, 0.85);
      const bear = K.bear(P, 62, 104, 0.75);
      S.jar(P, 84, 102, 5);
      S.cloudBank(P, 146, [N.cloudHi, '#f4ecff'], P.R, 18);
      P.vignette(0.45);
      return { star, bear, flock };
    },
    details(G, f) {
      S.twinkleFace(G, f.star, 'happy'); K.bearFace(G, f.bear, 'sleepy');
      G.sprite(50, 82, ['###', '..#', '.#.', '#..', '###'], { '#': '#e9e3ff' });
      G.sprite(44, 74, ['##', '.#', '#.', '##'], { '#': '#cfc8ff' });
      for (const [x, y] of [[132, 30], [166, 40], [128, 64], [170, 80]]) G.twinkle(x, y, '#fffbe6');
    },
  },

  morning: {
    paint(P) {
      room.bedroomWall(P, '#f0b48e', '#e2967c');
      const w = room.bedroomWindow(P, [[0, '#ffd77e'], [0.6, '#ffc39a'], [1, '#ffe6c4']], ['#f4bcc6', '#e48aa8']);
      P.circle(52, 60, 9, '#fff4cf'); P.glow(52, 60, 44, '#ffe2a0', 0.55);
      for (const [cx, cy] of [[70, 34], [40, 26]]) { P.ellipse(cx, cy, 9, 3, 'rgba(255,255,255,0.85)'); P.ellipse(cx + 5, cy - 2, 5, 3, 'rgba(255,255,255,0.9)'); }
      room.bookshelf(P, 196, 60);
      room.floorboards(P, 118, '#c98a6a', '#9a6248');
      P.ellipse(120, 146, 70, 10, '#5f9e8f'); P.ellipse(120, 146, 60, 7.5, '#7cbcae'); P.ellipse(120, 146, 48, 5, '#5f9e8f');
      room.nightstand(P, 172, 98); room.lamp(P, 176, 80, false);
      room.bed(P, 60, 86, 112, ['#a86aa8', '#c48ec8', '#7a4f8a']);
      K.pajamas(P, 134, 76, 22, 22);
      const girl = K.girlHead(P, 145, 68);
      const bear = K.bear(P, 132, 84, 0.7);
      P.ellipse(130, 86, 3, 5, K.C.pj, 0.7); P.ellipse(156, 84, 3, 5, K.C.pjShade, -0.7);
      for (let i = 0; i < 26; i++) P.circle(118 + P.R() * 28, 66 + P.R() * 26, 0.6, '#fff6c8');
      P.glow(132, 78, 26, '#fff0b0', 0.4);
      P.beam([[w.wx, w.wy + 10], [w.wx + w.ww, w.wy], [230, 150], [60, 160]], '#ffd890', 0.28);
      P.vignette(0.3, [80, 30, 20]);
      return { girl, bear };
    },
    details(G, f) {
      K.girlFace(G, f.girl, 'open'); K.bearFace(G, f.bear);
      for (const [x, y] of [[122, 70], [119, 80], [126, 88], [136, 92]]) G.twinkle(x, y, '#fffbe6');
    },
  },
};

module.exports = { scenes };
