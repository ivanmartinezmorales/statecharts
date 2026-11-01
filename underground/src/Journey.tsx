import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './kit/reduced-motion'
import type { Journey as Kind } from './components'

// A system's whole world as one long pixel panorama (640 x 200), and one drop that travels through it as you scroll.
// The camera follows the drop; at each stop, the caption says what happens there. Everything else keeps flowing.
// Water: reservoir, deep tunnel, cleaning, shaft, water main, building, tap.
// Wastewater: sink, house drain, street sewer, interceptor, pumps, treatment plant, river.

const SW = 640, SH = 200
type Pt = [number, number]
type Stop = { at: number; title: string; text: string }
type Scene = { title: string; path: Pt[]; stops: Stop[]; paint: (g: CanvasRenderingContext2D, t: number) => void; drop: (p: number) => [string, string] }

const px = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h) }

// ---- shared scenery
function sky(g: CanvasRenderingContext2D, top: string, bottom: string, ground: number) {
  const s = g.createLinearGradient(0, 0, 0, ground); s.addColorStop(0, top); s.addColorStop(1, bottom)
  g.fillStyle = s; g.fillRect(0, 0, SW, ground)
  for (let i = 0; i < 40; i++) px(g, (i * 97) % SW, (i * 37) % (ground - 20), 1, 1, 'rgba(255,245,220,0.6)')
}
function earth(g: CanvasRenderingContext2D, ground: number) {
  const e = g.createLinearGradient(0, ground, 0, SH); e.addColorStop(0, '#6b4a34'); e.addColorStop(0.45, '#4f3a2c'); e.addColorStop(0.5, '#4a4856'); e.addColorStop(1, '#2e2c38')
  g.fillStyle = e; g.fillRect(0, ground, SW, SH - ground)
  for (let i = 0; i < 260; i++) px(g, (i * 131) % SW, ground + ((i * 53) % (SH - ground)), 1, 1, i % 2 ? 'rgba(255,230,200,0.08)' : 'rgba(0,0,0,0.18)')
}
function city(g: CanvasRenderingContext2D, x0: number, x1: number, ground: number) {
  for (let x = x0, i = 0; x < x1; i++) {
    const w = 14 + (i * 7) % 12, h = 18 + (i * 13) % 34
    px(g, x, ground - h, w, h, i % 2 ? '#3a2f52' : '#2b2340')
    for (let wy = ground - h + 3; wy < ground - 4; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) if ((wx + wy + i) % 3) px(g, wx, wy, 2, 2, '#ffd890')
    x += w + 2
  }
}
function pipe(g: CanvasRenderingContext2D, pts: Pt[], r: number, wall: string, inside: string) {
  g.lineCap = 'square'; g.lineJoin = 'miter'
  g.strokeStyle = wall; g.lineWidth = r * 2 + 3; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke()
  g.strokeStyle = inside; g.lineWidth = r * 2; g.stroke()
}
// Little bits of whatever is flowing, moving along the path
function flow(g: CanvasRenderingContext2D, path: Pt[], t: number, color: (p: number) => string, step = 9) {
  const L = length(path)
  for (let d = cyc(t * 26, step); d < L; d += step) { const [x, y] = along(path, d / L); px(g, x - 1, y, 2, 1, color(d / L)) }
}

// ---- path helpers
const cyc = (v: number, m: number) => ((v % m) + m) % m
function length(path: Pt[]) { let L = 0; for (let i = 1; i < path.length; i++) L += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); return L }
function along(path: Pt[], p: number): Pt {
  let d = Math.max(0, Math.min(1, p)) * length(path)
  for (let i = 1; i < path.length; i++) {
    const [ax, ay] = path[i - 1], [bx, by] = path[i], seg = Math.hypot(bx - ax, by - ay)
    if (d <= seg) return [ax + ((bx - ax) * d) / seg, ay + ((by - ay) * d) / seg]
    d -= seg
  }
  return path[path.length - 1]
}
// Where along the path (0 to 1) the point nearest `pt` is: so stops can be placed by where they are drawn
function fractionAt(path: Pt[], pt: Pt) {
  let best = 0, bestD = Infinity
  for (let i = 0; i <= 400; i++) { const [x, y] = along(path, i / 400), dd = Math.hypot(x - pt[0], y - pt[1]); if (dd < bestD) { bestD = dd; best = i / 400 } }
  return best
}

// ---- water: from the hills to the tap
const WATER_PATH: Pt[] = [[40, 66], [114, 66], [114, 166], [380, 166], [380, 99], [556, 99], [556, 40], [586, 40]]
const water: Scene = {
  title: 'Follow the water',
  path: WATER_PATH,
  stops: [
    { at: 0, title: 'A reservoir in the hills', text: 'Rain and melting snow fill lakes behind dams, often many kilometers from the city.' },
    { at: fractionAt(WATER_PATH, [114, 120]), title: 'Down the intake', text: 'An intake lets the water drop into a tunnel. From here gravity does the work: the reservoir is higher than the city.' },
    { at: fractionAt(WATER_PATH, [236, 166]), title: 'Cleaned on the way', text: 'The water is filtered and disinfected with ultraviolet light and a little chlorine, so nothing harmful survives the trip.' },
    { at: fractionAt(WATER_PATH, [330, 166]), title: 'Deep under the city', text: 'Big water tunnels are bored through bedrock, some 150 to 250 meters down, out of the way of everything above.' },
    { at: fractionAt(WATER_PATH, [380, 130]), title: 'Up a shaft', text: 'Shafts carry the water up from the tunnel to the mains under the streets.' },
    { at: fractionAt(WATER_PATH, [470, 99]), title: 'The water main', text: 'Under the street the water is held at about 40 to 80 psi, enough to reach the upper floors of most buildings.' },
    { at: fractionAt(WATER_PATH, [556, 70]), title: 'Into the building', text: 'A service pipe with a meter branches off the main into each building. Tall buildings pump water up to a rooftop tank.' },
    { at: 1, title: 'Out of the tap', text: 'Turn the handle and it pours out, a few days after it fell as rain in the hills.' },
  ],
  drop: () => ['#7fc4ff', '#e8f6ff'],
  paint(g, t) {
    const ground = 74
    sky(g, '#1d1d4a', '#d9785a', ground)
    earth(g, ground)
    g.fillStyle = '#2f4a3a'; g.beginPath(); g.moveTo(0, ground); g.lineTo(0, 30); g.lineTo(30, 44); g.lineTo(60, 26); g.lineTo(100, 46); g.lineTo(140, 34); g.lineTo(170, ground); g.fill()
    px(g, 18, 60, 94, 12, '#3f7fb0'); px(g, 18, 60, 94, 2, '#7fc4ff'); px(g, 110, 52, 8, 22, '#9a968c')
    for (let i = 0; i < 8; i++) px(g, 24 + cyc(t * 6 + i * 11, 86), 63 + (i % 3) * 3, 3, 1, 'rgba(220,240,255,0.5)')
    city(g, 330, 540, ground)
    px(g, 540, 6, 76, ground - 6, '#4a3f62'); for (let y = 12; y < ground - 4; y += 10) for (let x = 546; x < 612; x += 10) px(g, x, y, 6, 6, '#ffd890')
    px(g, 596, 0, 14, 8, '#6b4a3a'); px(g, 594, 8, 18, 2, '#3a2a24')
    px(g, 330, ground, SW - 330, 8, '#3a3a42'); for (let x = 336; x < SW; x += 14) px(g, x, ground + 3, 6, 1, '#e8d890')
    pipe(g, [[114, 66], [114, 166], [380, 166]], 5, '#9a968c', '#1e3a5a')
    pipe(g, [[380, 166], [380, 99], [556, 99], [556, 40], [586, 40]], 3, '#5a6a7e', '#1e3a5a')
    px(g, 226, 156, 22, 20, '#3a3050'); g.globalAlpha = 0.5 + 0.3 * Math.sin(t * 5); px(g, 229, 159, 16, 14, '#b48cff'); g.globalAlpha = 1
    px(g, 580, 34, 14, 3, '#a8b0bc'); px(g, 584, 37, 3, 6, '#a8b0bc'); px(g, 576, 46, 22, 6, '#e8e2d6')
    flow(g, WATER_PATH, t, () => 'rgba(150,210,255,0.8)')
  },
}

// ---- wastewater: from the sink to the river
const WASTE_PATH: Pt[] = [[50, 40], [50, 92], [110, 120], [250, 126], [250, 162], [440, 162], [440, 64], [586, 64], [612, 82]]
const wastewater: Scene = {
  title: 'Follow the wastewater',
  path: WASTE_PATH,
  stops: [
    { at: 0, title: 'Down the drain', text: 'A sink, a shower, a toilet: everything goes down a pipe in the wall to the basement.' },
    { at: fractionAt(WASTE_PATH, [80, 106]), title: 'The house drain', text: 'A pipe sloping about 2 cm per meter carries it out under the sidewalk. No pumps, only gravity.' },
    { at: fractionAt(WASTE_PATH, [180, 123]), title: 'The street sewer', text: 'It joins the sewer under the street, often an old brick tunnel, still sloping gently downhill.' },
    { at: fractionAt(WASTE_PATH, [340, 162]), title: 'The interceptor', text: 'Street sewers drop into a big interceptor tunnel that gathers a whole neighborhood\'s wastewater.' },
    { at: fractionAt(WASTE_PATH, [440, 110]), title: 'Pumped up', text: 'At the plant, big pumps lift it back up to the surface so it can flow through the treatment tanks.' },
    { at: fractionAt(WASTE_PATH, [470, 64]), title: 'Screens and settling', text: 'Bars and screens catch rags and grit. In still tanks, heavy solids sink to the bottom as sludge.' },
    { at: fractionAt(WASTE_PATH, [536, 64]), title: 'Bacteria do the work', text: 'Air is bubbled through the water, and helpful bacteria eat what is left of the waste.' },
    { at: fractionAt(WASTE_PATH, [580, 64]), title: 'Disinfected', text: 'The cleaned water settles once more and is disinfected with ultraviolet light or chlorine.' },
    { at: 1, title: 'Back to the river', text: 'Clean enough for fish, it flows out into a river or the sea, and the water cycle carries on.' },
  ],
  // murky until the treatment plant, then clear
  drop: (p) => (p < 0.78 ? ['#8a7a4a', '#c9b88a'] : ['#7fc4ff', '#e8f6ff']),
  paint(g, t) {
    const ground = 74
    sky(g, '#141a3f', '#3a3a7a', ground)
    earth(g, ground)
    px(g, 6, 8, 84, ground - 8, '#7a4434'); for (let y = 14; y < ground - 6; y += 12) for (let x = 12; x < 84; x += 14) px(g, x, y, 8, 8, '#ffcf7a')
    px(g, 40, 44, 22, 5, '#e8e2d6'); px(g, 44, 36, 2, 8, '#a8b0bc')
    px(g, 0, ground, 330, 8, '#3a3a42'); for (let x = 96; x < 330; x += 14) px(g, x, ground + 3, 6, 1, '#e8d890')
    city(g, 96, 320, ground)
    pipe(g, [[50, 40], [50, 92], [110, 120]], 2, '#b07a5a', '#3a3020')
    pipe(g, [[110, 120], [250, 126]], 5, '#9a4a36', '#2a2a20')
    pipe(g, [[250, 126], [250, 162], [440, 162]], 7, '#9a968c', '#2a2a20')
    pipe(g, [[440, 162], [440, 64]], 4, '#6a6e78', '#2a2a20')
    // the plant: screens, settling, aeration with bubbles, disinfection, and the river
    px(g, 430, 50, 160, 24, '#5a6a7a')
    px(g, 452, 56, 22, 14, '#6b5a3a'); for (let x = 454; x < 472; x += 3) px(g, x, 56, 1, 14, '#2a2a30')
    px(g, 492, 56, 26, 14, '#5a5a3a'); px(g, 528, 56, 26, 14, '#4f6e5a')
    for (let i = 0; i < 10; i++) px(g, 530 + (i * 5) % 22, 68 - cyc(t * 14 + i * 4, 12), 1, 1, '#e8fff0')
    px(g, 566, 56, 20, 14, '#3f6f8a'); g.globalAlpha = 0.4 + 0.3 * Math.sin(t * 4); px(g, 568, 58, 16, 10, '#b48cff'); g.globalAlpha = 1
    px(g, 596, 74, 44, 20, '#2f6f9a'); for (let i = 0; i < 6; i++) px(g, 598 + cyc(t * 10 + i * 9, 40), 78 + (i % 3) * 4, 3, 1, 'rgba(220,240,255,0.6)')
    pipe(g, [[586, 64], [612, 82]], 2, '#6a6e78', '#2f6f9a')
    flow(g, WASTE_PATH, t, (p) => (p < 0.78 ? 'rgba(170,150,100,0.85)' : 'rgba(150,210,255,0.85)'))
  },
}

const SCENES: Record<Kind, Scene> = { water, wastewater }

export function Journey({ kind, onClose }: { kind: Kind; onClose: () => void }) {
  const scene = SCENES[kind]
  const reduced = useReducedMotion()
  const canvas = useRef<HTMLCanvasElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const progress = useRef({ target: 0, now: 0 })
  const [stop, setStop] = useState(0)

  // Scroll, drag and keys all move the drop along
  useEffect(() => {
    const nudge = (d: number) => { const p = progress.current; p.target = Math.max(0, Math.min(1, p.target + d)) }
    const onWheel = (e: WheelEvent) => { e.preventDefault(); nudge((e.deltaY + e.deltaX) / 4000) }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (['ArrowDown', 'ArrowRight', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); jump(1) }
      else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); jump(-1) }
    }
    const jump = (dir: number) => {
      const p = progress.current, at = scene.stops.map((s) => s.at)
      const next = dir > 0 ? at.find((a) => a > p.target + 0.001) : [...at].reverse().find((a) => a < p.target - 0.001)
      if (next !== undefined) p.target = next
    }
    let touch: number | null = null
    const ts = (e: TouchEvent) => { touch = e.touches[0].clientY + e.touches[0].clientX }
    const tm = (e: TouchEvent) => { if (touch === null) return; const v = e.touches[0].clientY + e.touches[0].clientX; nudge((touch - v) / 1600); touch = v; e.preventDefault() }
    addEventListener('wheel', onWheel, { passive: false })
    addEventListener('keydown', onKey)
    addEventListener('touchstart', ts, { passive: true })
    addEventListener('touchmove', tm, { passive: false })
    return () => { removeEventListener('wheel', onWheel); removeEventListener('keydown', onKey); removeEventListener('touchstart', ts); removeEventListener('touchmove', tm) }
  }, [scene, onClose])

  // Draw the world 12 times a second; ease the drop and the camera every frame
  useEffect(() => {
    const g = canvas.current?.getContext('2d')
    if (!g) return
    let raf = 0, lastF = -1
    const tick = (now: number) => {
      const t = now / 1000, p = progress.current
      p.now += (p.target - p.now) * (reduced ? 1 : 0.08)
      const f = Math.floor(t * 12)
      const [dx, dy] = along(scene.path, p.now)
      if (f !== lastF || reduced) {
        lastF = f
        g.clearRect(0, 0, SW, SH)
        scene.paint(g, reduced ? 2 : t)
        const [body, shine] = scene.drop(p.now)
        const halo = g.createRadialGradient(dx, dy, 0, dx, dy, 10); halo.addColorStop(0, 'rgba(255,255,255,0.45)'); halo.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = halo; g.fillRect(dx - 10, dy - 10, 20, 20)
        px(g, dx - 1, dy - 3, 2, 1, body); px(g, dx - 2, dy - 2, 4, 4, body); px(g, dx - 1, dy - 1, 1, 1, shine)
      }
      // the camera: the picture fills the height and follows the drop across
      const k = innerHeight / SH, w = SW * k
      const x = Math.min(0, Math.max(innerWidth - w, innerWidth * 0.5 - dx * k))
      if (world.current) world.current.style.transform = `translate(${x}px, 0) scale(${k})`
      if (bar.current) bar.current.style.transform = `scaleX(${p.now})`
      let s = 0; scene.stops.forEach((st, i) => { if (p.now >= st.at - 0.02) s = i })
      setStop((was) => (was === s ? was : s))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [scene, reduced])

  const st = scene.stops[stop]
  return (
    <div className="ug-journey" role="dialog" aria-modal="true" aria-label={scene.title}>
      <div className="ug-journey__world" ref={world}><canvas ref={canvas} width={SW} height={SH} aria-hidden /></div>
      <div className="ug-journey__bar"><div ref={bar} /></div>
      <header className="ug-journey__title"><p>{scene.title}</p></header>
      <section className="ug-journey__caption" key={stop}>
        <p className="ug-imm__depth">Stop {stop + 1} of {scene.stops.length}</p>
        <h2>{st.title}</h2>
        <p>{st.text}</p>
      </section>
      <p className="ug-imm__hint" data-on>Scroll to follow the drop</p>
      <button type="button" className="ug-imm__close" onClick={onClose} aria-label="Back to the layer" autoFocus>✕</button>
    </div>
  )
}
