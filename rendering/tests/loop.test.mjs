import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderLoop } from '../browser/loop.mjs';

function browser() {
  const frames = new Map(), listeners = new Map();
  let id = 0, observer;
  globalThis.document = {
    hidden: false,
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name),
  };
  globalThis.requestAnimationFrame = fn => { frames.set(++id, fn); return id; };
  globalThis.cancelAnimationFrame = id => frames.delete(id);
  globalThis.IntersectionObserver = class {
    constructor(fn) { observer = fn; }
    observe() {}
    disconnect() { observer = undefined; }
  };
  return {
    frames,
    paint(now) { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(now)); },
    visible(value) { observer([{ isIntersecting: value }]); },
    hidden(value) { document.hidden = value; listeners.get('visibilitychange')?.(); },
    listeners,
  };
}

test('offscreen and hidden surfaces sleep, then redraw on return', () => {
  const b = browser(); let calls = 0;
  const loop = createRenderLoop(() => { calls++; }, { element: {} });
  assert.equal(b.frames.size, 0);
  b.visible(true); b.paint(20); assert.equal(calls, 1);
  b.hidden(true); assert.equal(b.frames.size, 0);
  b.hidden(false); b.paint(40); assert.equal(calls, 2);
  b.visible(false); assert.equal(b.frames.size, 0);
  loop.destroy(); assert.equal(b.listeners.size, 0);
});

test('async frames never overlap; pending changes run once after completion', async () => {
  const b = browser(); let calls = 0, finish;
  const loop = createRenderLoop(() => { calls++; return new Promise(resolve => { finish = resolve; }); }, { continuous: false });
  b.paint(20); loop.invalidate(); loop.invalidate();
  assert.equal(b.frames.size, 0); assert.equal(calls, 1);
  finish(); await Promise.resolve();
  assert.equal(b.frames.size, 1);
  b.paint(40); assert.equal(calls, 2);
  loop.destroy(); finish(); await Promise.resolve();
  assert.equal(b.frames.size, 0);
});

test('static work stops; invalidation and finite animations can restart it', () => {
  const b = browser(); let calls = 0;
  const loop = createRenderLoop(() => ++calls < 2, { continuous: false });
  b.paint(20); b.paint(40); assert.equal(b.frames.size, 0);
  loop.invalidate(); loop.invalidate(); b.paint(60);
  assert.equal(calls, 3); assert.equal(b.frames.size, 0);
  loop.destroy();
});

test('frame limit caps high-refresh displays; resume has no large time step', () => {
  const b = browser(); const deltas = [];
  const loop = createRenderLoop((_now, dt) => { deltas.push(dt); });
  for (let n = 1; n <= 120; n++) b.paint(n * 1000 / 120);
  assert.equal(deltas.length, 60);
  loop.pause(); assert.equal(b.frames.size, 0);
  loop.resume(); b.paint(100000); assert.equal(deltas.at(-1), 0);
  loop.destroy();
});

test('render errors stop work and reach the error handler', async () => {
  const b = browser(); const errors = [];
  createRenderLoop(() => Promise.reject(new Error('device lost')), { onError: error => errors.push(error.message) });
  b.paint(20); await Promise.resolve();
  assert.deepEqual(errors, ['device lost']); assert.equal(b.frames.size, 0);
  assert.equal(b.listeners.size, 0);
});

test('a new demand-driven animation starts without elapsed idle time', () => {
  const b = browser(); const deltas = [];
  const loop = createRenderLoop((_now, dt) => { deltas.push(dt); }, { continuous: false });
  b.paint(20); loop.invalidate(); b.paint(100000);
  assert.deepEqual(deltas, [0, 0]);
  loop.destroy();
});
