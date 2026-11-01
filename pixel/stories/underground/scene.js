'use strict';
// Under the street: a cutaway from the sidewalk down to bedrock, one layer at a time. 320 x 480 pixels.
const W = 320, H = 480;

// Depths, in pixels from the top, where each layer starts.
const Y = { street: 96, cut: 104, soil: 120, sewer: 206, clay: 290, subway: 300, rock: 380 };

const C = {
  ink: '#16121c', soil: '#6b4a34', soilDark: '#4f3524', gravel: '#8a7a66', clay: '#8a5a3c', rock: '#5a5866', rockDark: '#3e3c4a',
  brick: '#9a4a36', brickDark: '#6e3426', mortar: '#c9a78a', concrete: '#9a968c', concreteDark: '#6e6a62',
  steel: '#7f8fa6', water: '#3f7f9a', sewage: '#5f7a5a', yellow: '#e8c04a', orange: '#e0783a', glass: '#ffd890',
};

function sky(P) {
  // night, with a haze of street light low down and a moon behind a bank of cloud
  P.vgrad(0, 0, W, Y.street, [[0, '#04050a'], [0.55, '#0e1018'], [1, '#2c2e38']]);
  P.glow(150, 18, 30, '#c8ccd8', 0.35); P.circle(150, 18, 7, '#e8e8ee'); P.circle(152, 16, 2, '#c8ccd4');
  P.rect(118, 20, 70, 3, '#14161e'); P.rect(130, 24, 48, 2, '#1c1e28'); P.rect(108, 23, 30, 2, '#1c1e28');
}

function buildings(P) {
  // a brownstone on the left, with a basement below the street
  P.rect(0, 14, 100, Y.street - 14, '#7a4434'); P.rect(0, 14, 100, 3, '#5a3024');
  for (const y of [22, 44, 66]) for (const x of [10, 36, 62]) {
    const lit = (x + y) % 3 !== 0;
    P.rect(x, y, 14, 16, '#3a2420'); P.rect(x + 1, y + 1, 12, 14, lit ? '#ffcf7a' : '#2a2440');
    if (lit) P.glow(x + 7, y + 8, 14, '#ffc070', 0.35);
    P.rect(x - 1, y - 2, 16, 2, '#c9a78a');
  }
  P.rect(84, 70, 12, 26, '#3a2420'); P.poly([[80, 96], [100, 96], [100, 92], [84, 92]], '#9a968c');
  // a corner shop on the right
  P.rect(214, 30, 106, Y.street - 30, '#5a6a7a'); P.rect(214, 30, 106, 4, '#3e4a56');
  for (const x of [222, 250, 278, 300]) { P.rect(x, 40, 14, 14, '#ffd890'); P.glow(x + 7, 47, 12, '#ffd890', 0.3); }
  P.rect(220, 66, 92, 30, '#2a2e3a'); P.rect(224, 70, 84, 22, '#ffe3a8'); P.glow(266, 80, 40, '#ffd890', 0.5);
  for (let i = 0; i < 8; i++) P.poly([[216 + i * 12, 58], [228 + i * 12, 58], [226 + i * 12, 66], [218 + i * 12, 66]], i % 2 ? '#e8e2d6' : '#c4503f');
  // a street lamp, a hydrant, a walker
  P.rect(178, 52, 2, 44, '#2a2a34'); P.rect(172, 50, 14, 3, '#2a2a34'); P.rect(173, 53, 6, 3, '#fff1c0'); P.glow(176, 56, 30, '#ffb040', 0.7); P.beam([[176, 55], [146, 96], [206, 96]], '#ff9a1a', 0.55);
  P.rrect(270, 86, 6, 10, 2, '#c4503f'); P.rect(268, 89, 10, 2, '#c4503f');
  P.circle(296, 76, 3, '#2a2030'); P.rrect(293, 79, 7, 11, 2, '#3f6f8a'); P.rect(294, 90, 2, 6, '#2a2030'); P.rect(297, 90, 2, 6, '#2a2030');
}

function street(P) {
  P.rect(0, Y.street, 104, 8, '#a8a49a'); P.rect(258, Y.street, 62, 8, '#a8a49a');
  P.rect(104, Y.street + 1, 154, 7, '#3a3a42');
  for (let x = 112; x < 252; x += 18) P.rect(x, Y.street + 4, 8, 1, '#e8d890');
  P.rect(100, Y.street, 4, 8, '#c9c4b8'); P.rect(258, Y.street, 4, 8, '#c9c4b8');
  // the road crew's work site: the manhole open with its cover leaning aside, cones and a barricade
  P.rect(144, Y.street + 1, 16, 3, '#0e0c12');
  P.ellipse(166, 92, 2, 5, '#4a4a54'); P.ellipse(165.5, 92, 1.2, 4.4, '#6a6a74');
  for (const cx of [108, 242]) { P.poly([[cx - 3, 96], [cx + 3, 96], [cx + 1, 87], [cx - 1, 87]], '#f07a2a'); P.rect(cx - 2, 91, 4, 1.4, '#f4f0e0'); P.rect(cx - 4, 95, 8, 1.6, '#c4501f'); }
  P.rect(173, 84, 20, 4, '#f07a2a'); for (let x = 175; x < 193; x += 6) P.poly([[x, 84], [x + 3, 84], [x + 1, 88], [x - 2, 88]], '#f4f0e0');
  P.line([[175, 88], [173, 96]], '#3a3a42', 1); P.line([[191, 88], [193, 96]], '#3a3a42', 1);
  P.circle(176, 82, 1.2, '#ffcf5a'); P.glow(176, 82, 8, '#ffcf5a', 0.6);
  P.rect(262, Y.street + 6, 10, 2, '#1e1e24');
  // the cut through the road: asphalt, concrete base, gravel bed
  P.rect(0, Y.cut, W, 4, '#2c2c34'); P.rect(0, Y.cut + 4, W, 6, C.concrete); P.fleckRect(0, Y.cut + 4, W, 6, ['#b0aca2', '#7e7a72'], 0.6, 0.8);
  P.rect(0, Y.cut + 10, W, 6, C.gravel); P.fleckRect(0, Y.cut + 10, W, 6, ['#a8987e', '#5e5446', '#c4b8a0'], 1.2, 1);
}

function earth(P) {
  P.vgrad(0, Y.soil, W, Y.clay - Y.soil, [[0, '#7a5638'], [1, '#5a3c28']]);
  P.fleckRect(0, Y.soil, W, Y.clay - Y.soil, ['#7e5a3e', '#56392a', '#8a7a62'], 0.28, 1.2);
  for (let i = 0; i < 40; i++) P.ellipse(P.R() * W, Y.soil + P.R() * (Y.clay - Y.soil), 1 + P.R() * 2, 0.8 + P.R(), '#8a7a66');
  P.rect(0, Y.clay, W, Y.subway - Y.clay, C.clay); P.fleckRect(0, Y.clay, W, 10, ['#9a6a4a', '#6e4a30'], 0.6, 1);
  P.vgrad(0, Y.subway, W, Y.rock - Y.subway, [[0, '#6a4e3a'], [1, '#5a4636']]);
  P.fleckRect(0, Y.subway, W, Y.rock - Y.subway, ['#6e5442', '#4e3a2c', '#7e6e5a'], 0.28, 1.2);
  // bedrock: tilted bands of schist
  P.rect(0, Y.rock, W, H - Y.rock, C.rock);
  P.fleckRect(0, Y.rock, W, H - Y.rock, ['#6a6878', '#4a4856'], 0.25, 1);
  for (let i = 0; i < 20; i++) {
    const y = Y.rock + 6 + i * 6;
    P.poly([[0, y], [W, y - 26], [W, y - 24.4], [0, y + 1.6]], i % 3 ? C.rockDark : '#8a889a');
  }
  P.poly([[0, Y.rock - 2], [80, Y.rock + 3], [170, Y.rock - 3], [260, Y.rock + 2], [W, Y.rock - 1], [W, Y.rock + 2], [0, Y.rock + 2]], '#4a4856');
}

function basement(P) {
  const x0 = 0, x1 = 92, y0 = Y.cut, y1 = 204;
  P.rect(x0, y0, x1, y1 - y0, C.concreteDark); P.rect(x0, y0, x1 - 4, y1 - y0 - 4, '#3a3430');
  P.rect(x1 - 4, y0, 4, y1 - y0, C.concrete); P.rect(x0, y1 - 4, x1, 4, C.concrete); P.rect(x0, y0, x1, 3, C.concrete);
  P.vgrad(0, y0 + 3, x1 - 4, y1 - y0 - 7, [[0, 'rgba(255,190,120,0.08)'], [1, 'rgba(0,0,0,0.25)']]);
  // a boiler with a glowing fire door, pipes, shelves
  P.rrect(14, 150, 30, 46, 6, '#8a3a2a'); P.rrect(16, 152, 12, 42, 5, '#a84a34'); P.rect(22, 176, 14, 10, '#1e1414'); P.rect(24, 178, 10, 6, '#ff9a40');
  P.glow(29, 181, 40, '#ff8a30', 0.8);
  P.rect(26, 120, 4, 30, '#7f8fa6'); P.rect(26, 120, 60, 4, '#7f8fa6');
  P.rect(56, 130, 26, 2, '#6b4a3a'); P.rect(56, 146, 26, 2, '#6b4a3a');
  for (let i = 0; i < 5; i++) P.rect(58 + i * 5, 123 + (i % 2), 4, 7 - (i % 2), ['#c4503f', '#e3a64a', '#5f9e8f', '#7a6fc4', '#d9c26a'][i]);
  P.rect(60, 140, 8, 6, '#a07a5a'); P.rect(70, 141, 10, 5, '#8a6a4a');
  P.rect(52, 106, 3, 14, '#2a2a34'); P.rect(48, 118, 11, 3, '#fff1c0'); P.glow(53, 120, 28, '#ffe8b0', 0.5);
  // foundation piles down to rock
  for (const px of [12, 70]) { P.rect(px, y1, 10, Y.rock - y1 + 8, C.concrete); P.rect(px + 7, y1, 3, Y.rock - y1 + 8, C.concreteDark); P.rect(px - 3, Y.rock + 4, 16, 6, C.concrete); }
}

function utilities(P) {
  const pipe = (cx, cy, r, shell, inside, wall = 1.6) => { P.circle(cx, cy, r + 1, C.ink); P.circle(cx, cy, r, shell); P.circle(cx, cy, r - wall, inside); P.ellipse(cx - r * 0.35, cy - r * 0.4, r * 0.3, r * 0.2, 'rgba(255,255,255,0.35)'); };
  pipe(124, 140, 8, C.steel, C.water, 2); P.rect(92, 138, 24, 4, C.steel); P.rect(92, 139, 24, 1, '#a8b8cc');
  pipe(176, 130, 4.5, C.yellow, '#3a3420', 1.2);
  P.rect(196, 124, 34, 24, C.concrete); P.fleckRect(196, 124, 34, 24, ['#b0aca2', '#7e7a72'], 0.6, 0.8);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) { P.circle(204 + i * 9, 131 + j * 10, 3.4, '#2a2a30'); P.circle(204 + i * 9, 131 + j * 10, 1.8, C.orange); }
  for (let i = 0; i < 3; i++) pipe(246 + i * 7, 134, 2.8, '#3f8a5a', '#1e2a22', 0.8);
  // the sewer lateral from the basement, sloping down to the main
  P.poly([[88, 186], [92, 186], [128, 214], [124, 216]], '#b07a5a');
  // the storm drain from the curb inlet
  P.rect(262, Y.cut, 10, 26, C.concreteDark); P.rect(264, Y.cut, 6, 24, '#1e1e24');
  P.poly([[264, 130], [270, 130], [282, 220], [276, 220]], '#9a968c'); P.poly([[266, 130], [268, 130], [279, 220], [277, 220]], '#2a2a30');
}

function manhole(P) {
  const x0 = 142, x1 = 162, y0 = Y.cut, y1 = 220;
  P.rect(x0 - 4, y0, x1 - x0 + 8, y1 - y0, C.brickDark);
  for (let y = y0; y < y1; y += 4) for (let x = x0 - 4 + ((y / 4) % 2) * 3; x < x1 + 4; x += 6) P.rect(x, y, 5, 3, C.brick);
  P.rect(x0, y0, x1 - x0, y1 - y0, '#1a1418');
  for (let y = y0 + 6; y < y1; y += 7) P.rect(x0 + 4, y, x1 - x0 - 8, 1.4, '#8a8a96');
  P.rect(x0 + 4, y0, 1.4, y1 - y0, '#6a6a76'); P.rect(x1 - 5.4, y0, 1.4, y1 - y0, '#6a6a76');
}

function sewer(P) {
  const top = 212, bottom = 282, x0 = 96;
  // the brick vault, cut lengthwise
  P.rect(x0, top - 8, W - x0, bottom - top + 14, C.brickDark);
  for (let y = top - 8; y < bottom + 6; y += 4) for (let x = x0 + ((y / 4) % 2) * 3; x < W; x += 6) P.rect(x, y, 5, 3, C.brick);
  P.vgrad(x0 + 4, top, W - x0 - 4, bottom - top, [[0, '#2a2026'], [1, '#141016']]);
  P.rect(x0, top - 8, 4, bottom - top + 14, C.mortar);
  // the walkway ledge and the flowing channel
  P.rect(x0 + 4, bottom - 18, W - x0 - 4, 4, '#6e6a62');
  P.vgrad(x0 + 4, bottom - 14, W - x0 - 4, 14, [[0, '#4f6e5a'], [1, '#2a3a30']]);
  for (let i = 0; i < 26; i++) P.rect(x0 + 8 + P.R() * (W - x0 - 16), bottom - 12 + P.R() * 10, 3 + P.R() * 6, 0.6, 'rgba(200,230,210,0.35)');
  P.rect(142, top, 20, 6, '#1a1418');
  // The worker, the rats and the flowing water are drawn live on the page, over this picture.
  P.glow(130, 246, 30, '#9ab8a0', 0.25);
}

function subway(P) {
  const x0 = 108, top = 308, bottom = 372;
  P.rect(x0 - 6, top - 6, W - x0 + 6, bottom - top + 12, C.concrete); P.fleckRect(x0 - 6, top - 6, W - x0 + 6, bottom - top + 12, ['#b0aca2', '#7e7a72'], 0.4, 1);
  P.vgrad(x0, top, W - x0, bottom - top, [[0, '#2a2a3a'], [1, '#1a1a24']]);
  for (const lx of [130, 200, 270]) { P.rect(lx, top + 2, 8, 2, '#fff1c0'); P.glow(lx + 4, top + 4, 26, '#fff1c0', 0.4); }
  P.rect(x0, bottom - 6, W - x0, 2, '#8a8a96'); for (let x = x0; x < W; x += 8) P.rect(x, bottom - 4, 5, 4, '#4a3a30');
  P.rect(x0, bottom - 9, W - x0, 1, '#c9a060');
  // The train is drawn live on the page, so it can pull in and out.
}

function waterTunnel(P) {
  const cx = 236, cy = 444, r = 24;
  P.circle(cx, cy, r + 4, '#2a2830'); P.circle(cx, cy, r + 2, C.concrete); P.circle(cx, cy, r - 2, '#1e2a3a');
  const level = cy + 2, inner = r - 2, half = Math.sqrt(inner * inner - (level - cy) ** 2), water = [[cx - half, level]];
  for (let a = Math.asin((level - cy) / inner); a <= Math.PI - Math.asin((level - cy) / inner); a += 0.1) water.unshift([cx + Math.cos(a) * inner, cy + Math.sin(a) * inner]);
  water.push([cx + half, level]);
  P.poly(water, '#2f6f8a');
  P.ellipse(cx, level, half - 1, 1.2, 'rgba(180,230,255,0.7)');
  P.glow(cx, cy + 8, 30, '#8fd0ff', 0.25);
  P.rect(cx - 2, Y.rock - 2, 4, cy - r - Y.rock, '#7f8fa6');
}

function paint(P) {
  sky(P); buildings(P); earth(P); street(P);
  basement(P); utilities(P); sewer(P); manhole(P); subway(P); waterTunnel(P);
  // a thin line along the cut, so the section reads as a slice
  P.rect(0, Y.cut, W, 0.8, '#0e0c12');
  return {};
}

function details(G) {
  for (const [x, y] of [[176, 56], [29, 181], [214, 232]]) G.twinkle(x, y, '#fffbe6');
  G.set(264, 260, '#ff6a6a');
}

module.exports = { W, H, Y, paint, details };
