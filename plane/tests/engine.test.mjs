import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const { cases } = JSON.parse(await readFile(new URL('./frames.json', import.meta.url)))
const wasm = await readFile(new URL('../public/engine.wasm', import.meta.url))
const { instance: { exports: engine } } = await WebAssembly.instantiate(wasm, {})
const order = ['scene', 'tx', 'ty', 'tz', 'yaw', 'pitch', 'dist', 'explode', 'focus', 'flows', 'anim', 'fade']
const hash = (ptr, size) => createHash('sha256').update(new Uint8Array(engine.memory.buffer, ptr, size)).digest('hex')
const hashes = (w, h) => [hash(engine.picture(), w * h * 4), hash(engine.glow(), w * h * 4), hash(engine.bloom(), engine.bloom_width() * engine.bloom_height() * 4)]

for (const { name, w, h, frame, snapshots } of cases) {
  test(`CPU output matches original: ${name}`, () => {
    engine.resize(w, h)
    new Float32Array(engine.memory.buffer, engine.params(), 16).set(order.map(k => frame[k]))
    for (const snapshot of snapshots) {
      engine.frame(snapshot.t)
      assert.deepEqual(hashes(w, h), snapshot.hashes, `t=${snapshot.t}`)
    }
  })
}

test('GPU bloom mode preserves the picture and core glow; CPU mode can resume', () => {
  const { w, h, frame } = cases[0]
  engine.resize(w, h)
  new Float32Array(engine.memory.buffer, engine.params(), 16).set(order.map(k => frame[k]))
  engine.frame(2.3)
  const cpu = hashes(w, h)
  engine.gpu_bloom(1)
  engine.frame(2.3)
  assert.deepEqual(hashes(w, h).slice(0, 2), cpu.slice(0, 2))
  const light = new Float32Array(engine.memory.buffer, engine.bloom_source(), engine.bloom_width() * engine.bloom_height() * 3)
  assert.ok(light.some(v => v > 0))
  assert.ok(light.every(Number.isFinite))
  engine.gpu_bloom(0)
  engine.frame(2.3)
  assert.deepEqual(hashes(w, h), cpu)
})
