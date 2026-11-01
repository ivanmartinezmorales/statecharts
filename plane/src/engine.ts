// The Rust engine, compiled to WASM. It draws into its own memory; this reads the picture, the glow and the bloom
// straight out of it, without copying.

export type Frame = {
  scene: number
  cx: number
  cy: number
  zoom: number
  explode: number
  focus: number
  flows: number
  model: number
  yaw: number
  pitch: number
  anim: number
  fade: number
}

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
}

export type Engine = {
  resize: (w: number, h: number) => void
  draw: (f: Frame, t: number) => void
  size: () => { w: number; h: number; bw: number; bh: number }
  /** The last frame's layers, as views into the engine's memory: valid until the next draw or resize. */
  layers: () => { picture: Uint8ClampedArray; glow: Uint8ClampedArray; bloom: Uint8ClampedArray }
}

const ORDER: (keyof Frame)[] = ['scene', 'cx', 'cy', 'zoom', 'explode', 'focus', 'flows', 'model', 'yaw', 'pitch', 'anim', 'fade']

export async function loadEngine(url = '/engine.wasm'): Promise<Engine> {
  const { instance } = await WebAssembly.instantiateStreaming(fetch(url), {})
  const x = instance.exports as unknown as Exports
  let w = 1, h = 1
  const view = (ptr: number, n: number) => new Uint8ClampedArray(x.memory.buffer, ptr, n * 4)
  return {
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
