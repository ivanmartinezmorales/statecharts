import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import init, { Diagram, pixels } from '../origami/pkg/origami_engine.js';

const { memory } = await init({ module_or_path: await readFile(new URL('../origami/pkg/origami_engine_bg.wasm', import.meta.url)) });
const { fixtures } = JSON.parse(await readFile(new URL('./origami-frames.json', import.meta.url)));
const hash = data => createHash('sha256').update(data).digest('hex');
for (const { name, data, finished, snapshots } of fixtures) {
  test(`Origami output matches original: ${name}, finished=${finished}`, () => {
    const diagram = new Diagram(JSON.stringify(data), finished);
    try {
      for (const { args, hash: expected } of snapshots) {
        const ptr = diagram.render(...args);
        assert.equal(hash(new Uint8Array(memory.buffer, ptr, pixels() ** 2 * 4)), expected);
      }
    } finally { diagram.free(); }
  });
}

test('released diagrams reuse WASM memory across repeated mounts', () => {
  const { data, snapshots } = fixtures.at(-1);
  const cycle = () => {
    const diagram = new Diagram(JSON.stringify(data), false);
    diagram.render(...snapshots.at(-1).args);
    diagram.free();
  };
  for (let i = 0; i < 10; i++) cycle();
  const bytes = memory.buffer.byteLength;
  for (let i = 0; i < 100; i++) cycle();
  assert.equal(memory.buffer.byteLength, bytes);
});
