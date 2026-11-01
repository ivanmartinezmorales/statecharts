'use strict';
// Draws every bedtime scene into out/bedtime/, plus a strip of all of them. `node render.js story asleep` draws some.
const path = require('path');
const fs = require('fs');
const { createCanvas } = require('@napi-rs/canvas');
const { render } = require('../../lib/pixel');
const { scenes } = require('./scenes');

const OUT = path.join(__dirname, '..', '..', 'out', 'bedtime');

(async () => {
  const want = process.argv.slice(2), ids = want.length ? want : Object.keys(scenes), done = [];
  for (const id of ids) {
    const s = scenes[id];
    if (!s) throw new Error(`no scene ${id}; scenes are ${Object.keys(scenes).join(', ')}`);
    let faces;
    const r = await render({ id, outDir: OUT, seed: `bedtime:${id}`, paint: (P) => { faces = s.paint(P); }, details: (G, R) => s.details(G, faces, R) });
    console.log(`${s.title}: ${r.file}`);
    done.push(r);
  }
  if (done.length > 1) {
    const { width: w, height: h } = done[0].canvas, gap = 24, cols = 2, rows = Math.ceil(done.length / cols);
    const sheet = createCanvas(cols * w + (cols + 1) * gap, rows * h + (rows + 1) * gap), x = sheet.getContext('2d');
    x.fillStyle = '#120a1c'; x.fillRect(0, 0, sheet.width, sheet.height);
    done.forEach((r, i) => x.drawImage(r.canvas, gap + (i % cols) * (w + gap), gap + Math.floor(i / cols) * (h + gap)));
    const file = path.join(OUT, 'all.png');
    fs.writeFileSync(file, await sheet.encode('png'));
    console.log(`All: ${file}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
