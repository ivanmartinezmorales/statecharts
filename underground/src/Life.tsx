import { useEffect, useRef } from 'react'
import { useReducedMotion } from './kit/reduced-motion'
import { W, watch } from './living'

// A window onto the cutaway's moving things: rows `top` to `top + rows` of the shared life canvas, scaled by `k`
// and laid over the same rows of the picture. With reduced motion it shows one still frame.
export function Life({ k, top = 0, rows }: { k: number; top?: number; rows: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    const g = ref.current?.getContext('2d')
    if (!g) return
    return watch((master) => { g.clearRect(0, 0, W, rows); g.drawImage(master, 0, top, W, rows, 0, 0, W, rows) }, reduced)
  }, [top, rows, reduced])
  return <canvas ref={ref} className="ug-life" width={W} height={rows} aria-hidden style={{ width: W * k, height: rows * k, top: 0 }} />
}
