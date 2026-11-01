// Run release WASM builds sequentially. Keep other builds and animations idle during measurement.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const [before, after] = process.argv.slice(2);
if (!before || !after) throw new Error('Usage: node rendering/bench/plane.mjs before.wasm after.wasm');
const load = async path => (await WebAssembly.instantiate(await readFile(path), {})).instance.exports;
const engines = [await load(before), await load(after)];
const { cases } = JSON.parse(await readFile(new URL('../../plane/tests/frames.json', import.meta.url)));
const order = ['scene', 'tx', 'ty', 'tz', 'yaw', 'pitch', 'dist', 'explode', 'focus', 'flows', 'anim', 'fade'];
const hash = (engine, w, h) => {
  const digest = createHash('sha256');
  for (const [ptr, size] of [[engine.picture(), w * h * 4], [engine.glow(), w * h * 4], [engine.bloom(), engine.bloom_width() * engine.bloom_height() * 4]]) {
    digest.update(new Uint8Array(engine.memory.buffer, ptr, size));
  }
  return digest.digest('hex');
};
for (const [w, h] of [[640, 360], [1280, 720]]) {
  for (const { name, frame } of cases.filter(f => ['airplane.overview', 'deck.pfd', 'cabin.air'].includes(f.name))) {
    for (const engine of engines) {
      engine.resize(w, h);
      new Float32Array(engine.memory.buffer, engine.params(), 16).set(order.map(k => frame[k]));
      for (let i = 0; i < 30; i++) engine.frame(2 + i / 30);
    }
    const samples = [[], []];
    for (let round = 0; round < 5; round++) {
      for (const [index, engine] of engines.entries()) {
        const start = performance.now();
        for (let i = 0; i < 30; i++) engine.frame(2 + i / 30);
        samples[index].push((performance.now() - start) / 30);
      }
      assert.equal(hash(engines[0], w, h), hash(engines[1], w, h), name);
    }
    console.log(JSON.stringify({ runtime: process.version, name, w, h, framesPerBatch: 30, before: samples[0], after: samples[1] }));
  }
}
