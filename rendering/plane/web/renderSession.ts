import { createCompositor, type Surface, type Viewport } from '../../browser/compositor'
import { loadEngine, type Frame } from './engine'

export type RenderSize = Viewport & { w: number; h: number }

export async function createRenderSession(canvases: Surface[], initial: RenderSize, force2d = false, signal?: AbortSignal) {
  const engine = await loadEngine('/engine.wasm', signal)
  engine.resize(initial.w, initial.h)
  const comp = await createCompositor(canvases[0], canvases.slice(1), engine, initial, force2d)
  if (signal?.aborted) {
    comp.destroy()
    signal.throwIfAborted()
  }
  let size = initial
  let previous: { frame: Frame; t: number } | undefined
  return {
    origins: engine.origins,
    kind: comp.kind,
    hdr: comp.hdr,
    async draw(frame: Frame, t: number, next: RenderSize) {
      const unchanged = next.w === size.w && next.h === size.h && next.width === size.width && next.height === size.height && next.dpr === size.dpr
      if (unchanged && previous?.t === t && (Object.keys(frame) as (keyof Frame)[]).every(key => frame[key] === previous!.frame[key])) return 0
      if (next.w !== size.w || next.h !== size.h) engine.resize(next.w, next.h)
      if (next.w !== size.w || next.h !== size.h || next.width !== size.width || next.height !== size.height || next.dpr !== size.dpr) comp.resize(next)
      size = next
      const start = performance.now()
      engine.draw(frame, t)
      await comp.present()
      previous = { frame: { ...frame }, t }
      return performance.now() - start
    },
    destroy: () => comp.destroy(),
  }
}
