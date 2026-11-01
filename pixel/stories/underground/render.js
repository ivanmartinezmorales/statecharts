'use strict';
// Draws the underground cutaway into out/underground/.
const path = require('path');
const { render } = require('../../lib/pixel');
const scene = require('./scene');

(async () => {
  const outDir = path.join(__dirname, '..', '..', 'out', 'underground');
  const r = await render({ id: 'underground', outDir, w: scene.W, h: scene.H, colors: 56, dither: 6, upscale: 4, seed: 'underground', paint: scene.paint, details: scene.details });
  console.log(r.file);
})().catch((e) => { console.error(e); process.exit(1); });
