// The Rust engine, compiled to WASM: a row of dioramas and a camera. It draws into its own memory; this reads the
// picture, the glow and the bloom straight out of it, without copying.

export type Frame = {
  /** the diorama the tour is on: focus, flows, explode and anim apply to it */
  scene: number
  tx: number
  ty: number
  tz: number
  yaw: number
  pitch: number
  dist: number
  explode: number
  focus: number
  flows: number
  anim: number
  fade: number
}

export type V3 = [number, number, number]

type Exports = {
  memory: WebAssembly.Memory
  params: () => number
  resize: (w: number, h: number) => void
  frame: (t: number) => void
  picture: () => number
  glow: () => number
  bloom: () => number
  bloom_width: () => number
  bloom_height: () => number
  origins: () => number
  origin_count: () => number
}

export type Engine = {
  resize: (w: number, h: number) => void
  draw: (f: Frame, t: number) => void
  size: () => { w: number; h: number; bw: number; bh: number }
  /** Where each diorama stands in the world. */
  origins: V3[]
  /** The last frame's layers, as views into the engine's memory: valid until the next draw or resize. */
  layers: () => { picture: Uint8ClampedArray; glow: Uint8ClampedArray; bloom: Uint8ClampedArray }
}

const ORDER: (keyof Frame)[] = ['scene', 'tx', 'ty', 'tz', 'yaw', 'pitch', 'dist', 'explode', 'focus', 'flows', 'anim', 'fade']

export async function loadEngine(url = '/engine.wasm'): Promise<Engine> {
  const { instance } = await WebAssembly.instantiateStreaming(fetch(url), {})
  const x = instance.exports as unknown as Exports
  let w = 1, h = 1
  const view = (ptr: number, n: number) => new Uint8ClampedArray(x.memory.buffer, ptr, n * 4)
  const table = new Float32Array(x.memory.buffer, x.origins(), x.origin_count() * 3)
  const origins = Array.from({ length: x.origin_count() }, (_, i) => [table[3 * i], table[3 * i + 1], table[3 * i + 2]] as V3)
  return {
    origins,
    resize(nw, nh) {
      w = Math.max(1, nw)
      h = Math.max(1, nh)
      x.resize(w, h)
    },
    draw(f, t) {
      const p = new Float32Array(x.memory.buffer, x.params(), 16)
      ORDER.forEach((k, i) => (p[i] = f[k]))
      x.frame(t)
    },
    size: () => ({ w, h, bw: x.bloom_width(), bh: x.bloom_height() }),
    layers() {
      const bw = x.bloom_width(), bh = x.bloom_height()
      return { picture: view(x.picture(), w * h), glow: view(x.glow(), w * h), bloom: view(x.bloom(), bw * bh) }
    },
  }
}
