// Everything that moves in the cutaway, drawn at the picture's own pixels (320 x 480) over the still picture:
// the road crew, the boiler's fire, a worm, the wastewater, drips, the house drain, the sewer worker and two rats,
// the subway train, the water in the deep tunnel, and the rain over the street; all of it in the noir grade.
//
// One clock and one canvas for the whole page: a single loop draws a frame 12 times a second, and every view that
// shows part of the cutaway copies its part from it. `anchors` says where the moving things are now, for labels
// that follow them.

import { gradeCanvas, rain } from './noir.js'

export const W = 320, H = 480, FPS = 12
type G = CanvasRenderingContext2D
type Pt = { x: number; y: number }

export const anchors: Record<string, Pt | null> = { worker: null, rat: null, train: null }

const C = {
  hat: '#f2c230', skin: '#d9a07a', vest: '#f07a2a', stripe: '#f4f0e0', pants: '#2e3a5a', boot: '#2a2018', steel: '#6a6e78', dark: '#2a2a30',
  dust: '#c9b8a0', stop: '#d8382a', slow: '#f0a020', coat: '#e8c04a', coatShade: '#c49a2a', rat: '#5a5058', ratHi: '#7a6e76', tail: '#8a7480',
  water: 'rgba(205,235,215,0.55)', glint: '#e8fff0', drop: '#bfe0d0', lamp: '#fff2c0', train: '#a8b0bc', trainHi: '#c9d0da', trainBand: '#3f6fb0',
  window: '#ffe0a0', rider: '#3a3040', worm: '#d98a8a',
}

const px = (g: G, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h) }
const cycle = (t: number, period: number) => ((t % period) + period) % period
// A slow there-and-back walk: position along [a, b], the direction, and whether it is paused at this moment
function patrol(t: number, a: number, b: number, speed: number, pause: number): { x: number; dir: 1 | -1; still: boolean } {
  const leg = (b - a) / speed, period = 2 * (leg + pause), u = cycle(t, period)
  if (u < leg) return { x: a + u * speed, dir: 1, still: false }
  if (u < leg + pause) return { x: b, dir: 1, still: true }
  if (u < 2 * leg + pause) return { x: b - (u - leg - pause) * speed, dir: -1, still: false }
  return { x: a, dir: -1, still: true }
}

// ---- the road crew (street, feet on row 96)
function crewMember(g: G, x: number, feet: number, dir: 1 | -1, step: number, draw: (g: G) => void) {
  g.save(); g.translate(Math.round(x), feet); g.scale(dir, 1)
  const s = step % 2
  px(g, -2 + s, -4, 2, 3, C.pants); px(g, 1 - s, -4, 2, 3, C.pants)
  px(g, -2 + s, -1, 2, 1, C.boot); px(g, 1 - s, -1, 3, 1, C.boot)
  px(g, -2, -6, 5, 2, C.pants); px(g, -2, -10, 5, 4, C.vest); px(g, -2, -8, 5, 1, C.stripe)
  px(g, -1, -12, 3, 2, C.skin); px(g, -2, -13, 5, 1, C.hat); px(g, -1, -14, 3, 1, C.hat); px(g, 3, -13, 1, 1, C.hat)
  draw(g)
  g.restore()
}
function cone(g: G, x: number, y: number) { px(g, x, y, 1, 1, C.vest); px(g, x - 1, y + 1, 3, 1, C.stripe); px(g, x - 1, y + 2, 3, 2, C.vest); px(g, x - 2, y + 4, 5, 1, '#c4501f') }

function street(g: G, t: number, f: number) {
  const shake = f % 2
  crewMember(g, 126, 96, 1, 0, (h) => { px(h, 3, -9 + shake, 2, 1, C.skin); px(h, 4, -10 + shake, 4, 1, C.dark); px(h, 5, -9 + shake, 2, 6, C.steel); px(h, 6, -3 + shake, 1, 3, C.dark) })
  if (shake) for (let i = 0; i < 3; i++) px(g, 129 + ((f * 7 + i * 5) % 7), 94 - ((f + i * 3) % 4), 1, 1, C.dust)
  const walk = patrol(t, 196, 234, 11, 0.6)
  crewMember(g, walk.x, 96, walk.dir, walk.still ? 0 : Math.floor(f / 2), (h) => { px(h, 3, -9, 2, 1, C.skin); cone(h, 5, -11) })
  const slow = Math.floor(t / 2) % 2 === 1, wave = Math.floor(f / 4) % 2
  crewMember(g, 250, 96, -1, 0, (h) => {
    px(h, 3, -9, 1, 1, C.skin); px(h, 4, -17, 1, 9, C.dark)
    px(h, 2, -21, 5, 4, slow ? C.slow : C.stop); px(h, 3, -20, 3, 2, slow ? '#ffe0a0' : '#ffd0c8')
    px(h, -3, wave ? -12 : -9, 1, 3, C.skin)
  })
}

// ---- pipes and cables: the boiler's fire, a worm in the soil
function utilities(g: G, t: number, f: number) {
  const flick = [0.55, 0.8, 0.65, 0.95, 0.7][f % 5]
  g.globalAlpha = flick; px(g, 24, 178, 10, 6, '#ff9a40'); px(g, 25 + (f % 3) * 2, 179, 3, 3, '#ffd27a'); g.globalAlpha = 1
  const glow = g.createRadialGradient(29, 181, 0, 29, 181, 22)
  glow.addColorStop(0, `rgba(255,140,50,${0.28 * flick})`); glow.addColorStop(1, 'rgba(255,140,50,0)')
  g.fillStyle = glow; g.fillRect(7, 159, 44, 44)
  const wx = 238 + Math.round(Math.sin(t * 0.6) * 6)
  for (let i = 0; i < 6; i++) px(g, wx + i, 182 + Math.round(Math.sin(t * 4 + i * 0.9)), 1, 1, C.worm)
}

// ---- the sewer: tunnel x 100..320, ledge top at row 264, wastewater from row 268 to 282
function sewer(g: G, t: number, f: number) {
  // the wastewater, flowing right
  for (let i = 0; i < 34; i++) {
    const len = 2 + (i % 4), x = 100 + cycle(i * 53 + t * (18 + (i % 3) * 6), 220), y = 269 + ((i * 7) % 12)
    px(g, x, y, len, 1, i % 5 ? C.water : C.glint)
  }
  for (let x = 100; x < 320; x += 6) px(g, x + ((f + x) % 3), 268, 2, 1, 'rgba(230,255,240,0.35)')
  // drips from the vault, each with a splash
  for (const [x, period, phase] of [[178, 2.6, 0], [252, 3.4, 1.2], [300, 2.9, 2]] as const) {
    const u = cycle(t + phase, period), fall = u * 70
    if (fall < 56) px(g, x, 212 + fall, 1, 2, C.drop)
    else if (u < 1.05) { const r = Math.round((u - 0.8) * 8); px(g, x - r, 267, 1, 1, C.glint); px(g, x + r, 267, 1, 1, C.glint) }
  }
  // the house drain lets go now and then
  const gush = cycle(t, 7)
  if (gush < 1.6) for (let y = 216; y < 268; y += 2) px(g, 126 + ((y + f) % 2), y, 1, 2, 'rgba(190,170,130,0.75)')
  // the worker walks the ledge and stops to look around, the headlamp sweeping
  const w = patrol(t, 150, 286, 7, 2.8)
  const lampX = w.x + w.dir * 3, lampY = 233
  const sweep = w.still ? Math.sin(t * 1.6) * 0.35 : 0.08
  g.save()
  const reach = 92, a0 = sweep - 0.18, a1 = sweep + 0.22
  g.globalAlpha = 0.16
  g.fillStyle = C.lamp
  g.beginPath(); g.moveTo(lampX, lampY)
  g.lineTo(lampX + w.dir * Math.cos(a0) * reach, lampY + Math.sin(a0) * reach)
  g.lineTo(lampX + w.dir * Math.cos(a1) * reach, lampY + Math.sin(a1) * reach)
  g.closePath(); g.fill()
  g.globalAlpha = 0.12
  g.beginPath(); g.moveTo(lampX, lampY)
  g.lineTo(lampX + w.dir * Math.cos(a0 + 0.1) * reach * 0.7, lampY + Math.sin(a0 + 0.1) * reach * 0.7)
  g.lineTo(lampX + w.dir * Math.cos(a1 - 0.1) * reach * 0.7, lampY + Math.sin(a1 - 0.1) * reach * 0.7)
  g.closePath(); g.fill()
  g.restore()
  g.save(); g.translate(Math.round(w.x), 264); g.scale(w.dir, 1)
  const s = w.still ? 0 : Math.floor(f / 2) % 2
  px(g, -3 + s, -6, 3, 6, C.dark); px(g, 1 - s, -6, 3, 6, C.dark)
  px(g, -4, -24, 9, 18, C.coat); px(g, 2, -24, 3, 18, C.coatShade); px(g, -4, -14, 9, 2, '#cfd6dc')
  px(g, -2, -29, 5, 5, C.skin); px(g, -3, -31, 7, 3, C.coat); px(g, 3, -30, 2, 2, '#fff8d8')
  px(g, -6, -22, 1, 22, '#5a4a3a')
  g.restore()
  const halo = g.createRadialGradient(lampX, lampY, 0, lampX, lampY, 9)
  halo.addColorStop(0, 'rgba(255,242,192,0.7)'); halo.addColorStop(1, 'rgba(255,242,192,0)')
  g.fillStyle = halo; g.fillRect(lampX - 9, lampY - 9, 18, 18)
  anchors.worker = { x: w.x, y: 246 }
  // two rats: dash, stop and sniff, dash again
  for (const [i, base, span, speed] of [[0, 104, 100, 34], [1, 230, 86, 28]] as const) {
    const r = patrol(t + i * 2.1, base, base + span, speed, 1.1)
    const bob = r.still ? (Math.floor(t * 6) % 2) : 0
    g.save(); g.translate(Math.round(r.x), 263); g.scale(r.dir, 1)
    px(g, -4, -2, 5, 2, C.rat); px(g, -3, -3, 3, 1, C.ratHi); px(g, 1, -2 - bob, 2, 2, C.rat); px(g, 3, -1 - bob, 1, 1, '#c98a8a')
    px(g, 2, -2 - bob, 1, 1, '#ff6a6a')
    const leg = r.still ? 0 : f % 2
    px(g, -3 + leg, 0, 1, 1, C.rat); px(g, 0 - leg, 0, 1, 1, C.rat)
    px(g, -6, -1, 2, 1, C.tail); px(g, -8, r.still ? -2 : 0, 2, 1, C.tail)
    g.restore()
    if (i === 0) anchors.rat = { x: r.x, y: 261 }
  }
}

// ---- the subway: tunnel x 108..320, rows 308..372. The train pulls in, waits, and pulls out.
function subway(g: G, t: number) {
  const LEN = 200, stopX = 124, inT = 3, wait = 3.5, outT = 3, gone = 2.5, period = inT + wait + outT + gone
  const u = cycle(t, period)
  let x: number
  if (u < inT) x = stopX - (1 - u / inT) ** 2 * (LEN + 40)
  else if (u < inT + wait) x = stopX
  else if (u < inT + wait + outT) { const p = (u - inT - wait) / outT; x = stopX + p * p * 260 }
  else { anchors.train = null; return }
  g.save(); g.beginPath(); g.rect(108, 308, 212, 64); g.clip()
  px(g, x, 320, LEN, 40, C.train); px(g, x, 320, LEN, 3, C.trainHi); px(g, x, 348, LEN, 3, C.trainBand)
  for (let wx = 8; wx < LEN - 10; wx += 22) {
    px(g, x + wx, 327, 15, 13, C.window)
    if ((wx / 22) % 2 < 1) { px(g, x + wx + 5, 331, 3, 3, C.rider); px(g, x + wx + 4, 334, 5, 6, C.rider) }
  }
  px(g, x + LEN - 3, 324, 3, 32, C.coat)
  px(g, x, 360, LEN, 4, '#3a3a44')
  for (const wx of [14, 42, LEN - 42, LEN - 14]) px(g, x + wx - 3, 362, 6, 5, '#2a2a30')
  // a spark off the rail while it moves
  if (u < inT || u > inT + wait) px(g, x + LEN - 20 + ((t * 40) % 6), 366, 2, 1, '#fff0a0')
  g.restore()
  const cx = Math.max(116, Math.min(312, x + LEN / 2))
  anchors.train = x + LEN < 112 || x > 316 ? null : { x: cx, y: 336 }
}

// ---- bedrock: water running through the deep tunnel, seeps in the rock
function bedrock(g: G, t: number) {
  const cx = 236, cy = 444, r = 21
  for (let i = 0; i < 12; i++) {
    const x = cx - r + cycle(i * 17 + t * 14, 2 * r), y = cy + 3 + (i % 4) * 3
    if (Math.hypot(x - cx, y - cy) < r - 2) px(g, x, y, 3, 1, 'rgba(190,235,255,0.6)')
  }
  for (const [x, phase] of [[60, 0], [140, 1.7]] as const) {
    const u = cycle(t + phase, 4)
    if (u < 2) px(g, x, 396 + u * 10, 1, 1, '#9fd0ff')
  }
}

export function draw(g: G, t: number) {
  const f = Math.floor(t * FPS)
  g.clearRect(0, 0, W, H)
  rain(g, t, W, 94); street(g, t, f); utilities(g, t, f); sewer(g, t, f); subway(g, t); bedrock(g, t)
  gradeCanvas(g, W, H)
}

// ---- the shared loop
const master = document.createElement('canvas')
master.width = W
master.height = H
const ctx = master.getContext('2d', { willReadFrequently: true })!
const viewers = new Set<() => void>()
let raf = 0, last = -1

function tick(now: number) {
  const f = Math.floor(now / (1000 / FPS))
  if (f !== last) { last = f; draw(ctx, now / 1000); viewers.forEach((v) => v()) }
  raf = requestAnimationFrame(tick)
}

/** Calls `paint(master)` on every new frame (or once, still, when `still`), until the returned function is called. */
export function watch(paint: (master: HTMLCanvasElement) => void, still: boolean) {
  if (still) { draw(ctx, 4); paint(master); return () => {} }
  const v = () => paint(master)
  viewers.add(v)
  if (viewers.size === 1) raf = requestAnimationFrame(tick)
  else v()
  return () => { viewers.delete(v); if (!viewers.size) cancelAnimationFrame(raf) }
}
