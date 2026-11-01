'use strict';
// Draws the cutaway at its true 320 x 480 pixels into public/, for the page to scale up crisply, in the site's noir grade.
const path = require('path');
const { render } = require('../../pixel/lib/pixel');
const scene = require('../../pixel/stories/underground/scene');

import('../src/noir.js').then(({ noir }) => render({ id: 'cutaway', outDir: path.join(__dirname, '..', 'public'), w: scene.W, h: scene.H, colors: 56, dither: 6, upscale: 1, seed: 'underground', paint: scene.paint, details: scene.details, grade: noir }))
  .then((r) => console.log(`Wrote ${r.file}`))
  .catch((e) => { console.error(e); process.exit(1); });
