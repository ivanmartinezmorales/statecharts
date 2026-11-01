import { useEffect, useRef } from 'react'
import { useReducedMotion } from './kit/reduced-motion'

// The road crew, drawn live over the street: a jackhammer beside the open manhole, a worker carrying a cone back
// and forth past the barricade, and a flagger turning the STOP / SLOW sign. They draw on a canvas at the picture's
// own pixels (rows 0 to 104), scaled up crisply like the picture under it, at 12 frames a second so they move the
// way pixel sprites do. With reduced motion they hold one pose.

const ROWS = 104
const FPS = 12
const C = { hat: '#f2c230', skin: '#d9a07a', vest: '#f07a2a', stripe: '#f4f0e0', pants: '#2e3a5a', boot: '#2a2018', steel: '#6a6e78', dark: '#2a2a30', dust: '#c9b8a0', stop: '#d8382a', slow: '#f0a020' }

type G = CanvasRenderingContext2D
const px = (g: G, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h) }

// One worker, feet on row `feet`, facing right (dir 1) or left (-1). Coordinates below are for facing right.
function worker(g: G, x: number, feet: number, dir: 1 | -1, step: number, draw: (g: G) => void) {
  g.save(); g.translate(x, feet); g.scale(dir, 1)
  const s = step % 2 ? 1 : 0
  px(g, -2 + s, -4, 2, 3, C.pants); px(g, 1 - s, -4, 2, 3, C.pants)
  px(g, -2 + s, -1, 2, 1, C.boot); px(g, 1 - s, -1, 3, 1, C.boot)
  px(g, -2, -6, 5, 2, C.pants)
  px(g, -2, -10, 5, 4, C.vest); px(g, -2, -8, 5, 1, C.stripe)
  px(g, -1, -12, 3, 2, C.skin)
  px(g, -2, -13, 5, 1, C.hat); px(g, -1, -14, 3, 1, C.hat); px(g, 3, -13, 1, 1, C.hat)
  draw(g)
  g.restore()
}

function cone(g: G, x: number, y: number) { px(g, x, y, 1, 1, C.vest); px(g, x - 1, y + 1, 3, 1, C.stripe); px(g, x - 1, y + 2, 3, 2, C.vest); px(g, x - 2, y + 4, 5, 1, '#c4501f') }

export function frame(g: G, f: number) {
  g.clearRect(0, 0, 320, ROWS)
  // the jackhammer: the tool shakes a pixel each frame, dust kicks up
  const shake = f % 2
  worker(g, 126, 96, 1, 0, (h) => {
    px(h, 3, -9 + shake, 2, 1, C.skin)
    px(h, 4, -10 + shake, 4, 1, C.dark)
    px(h, 5, -9 + shake, 2, 6, C.steel)
    px(h, 6, -3 + shake, 1, 3, C.dark)
  })
  if (shake) for (let i = 0; i < 3; i++) px(g, 129 + ((f * 7 + i * 5) % 7), 94 - ((f + i * 3) % 4), 1, 1, C.dust)
  // the cone carrier walks 196 to 234 and back, two steps a frame pair
  const span = 38, t = (f * 0.9) % (span * 2), out = t < span, x = 196 + (out ? t : span * 2 - t)
  worker(g, Math.round(x), 96, out ? 1 : -1, Math.floor(f / 2), (h) => { px(h, 3, -9, 2, 1, C.skin); cone(h, 5, -11) })
  // the flagger turns the sign every two seconds and waves the other arm
  const slow = Math.floor(f / (FPS * 2)) % 2 === 1, wave = Math.floor(f / 4) % 2
  worker(g, 250, 96, -1, 0, (h) => {
    px(h, 3, -9, 1, 1, C.skin); px(h, 4, -17, 1, 9, C.dark)
    px(h, 2, -21, 5, 4, slow ? C.slow : C.stop); px(h, 3, -20, 3, 2, slow ? '#ffe0a0' : '#ffd0c8')
    px(h, -3, wave ? -12 : -9, 1, wave ? 3 : 3, C.skin)
  })
}

export function Workers({ k, top = 0, className }: { k: number; top?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    const g = ref.current?.getContext('2d')
    if (!g) return
    if (reduced) { frame(g, 6); return }
    let raf = 0, last = -1
    const tick = (now: number) => {
      const f = Math.floor(now / (1000 / FPS))
      if (f !== last) { last = f; frame(g, f) }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])
  return <canvas ref={ref} className={`ug-workers ${className ?? ''}`} width={320} height={ROWS} aria-hidden style={{ width: 320 * k, height: ROWS * k, top: -top * k }} />
}
