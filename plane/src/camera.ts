// Scroll position to engine frame. Each stop holds still for most of its screen, then the last stretch moves to the
// next: within a scene the camera does a balloon zoom (eases out, travels, eases back in); between scenes it pushes
// in and fades through the dark.

import type { Frame } from './engine'
import { Scene, type View } from './tour'

/** The part of the frame the card leaves free, in framebuffer pixels. */
export type Region = { x: number; y: number; w: number; h: number }

export function freeRegion(w: number, h: number): Region {
  // a phone held upright: the card sits at the bottom, the picture above it
  if (w < h) return { x: 0, y: h * 0.06, w, h: h * 0.52 }
  // wider screens: the card on the left, the picture to its right
  return { x: w * 0.36, y: h * 0.08, w: w * 0.62, h: h * 0.86 }
}

type Cam = { cx: number; cy: number; zoom: number }

function cam(v: View, fw: number, fh: number, r: Region): Cam {
  const rcx = r.x + r.w / 2, rcy = r.y + r.h / 2
  if (v.scene === Scene.Model) return { cx: rcx - fw / 2, cy: rcy - fh / 2, zoom: Math.min(r.w, r.h) / Math.min(fw, fh) }
  const s = v.shot
  const zoom = Math.min(r.w / (s.w * 1.06), r.h / (s.h * 1.06))
  return { cx: s.x - (rcx - fw / 2) / zoom, cy: s.y - (rcy - fh / 2) / zoom, zoom }
}

const ease = (u: number) => u * u * (3 - 2 * u)
const lerp = (a: number, b: number, u: number) => a + (b - a) * u

function frameOf(v: View, c: Cam): Frame {
  return {
    scene: v.scene,
    cx: c.cx,
    cy: c.cy,
    zoom: c.zoom,
    explode: v.explode ?? 0,
    focus: v.focus ?? -1,
    flows: v.flows ?? 0,
    model: v.model ?? 0,
    yaw: v.yaw ?? 0.5,
    pitch: v.pitch ?? 0.3,
    anim: v.anim ?? 0,
    fade: 0,
  }
}

/** The frame at scroll position `p` (in screens, 0 at the first view), for a framebuffer `fw` x `fh`. */
export function frameAt(views: View[], p: number, fw: number, fh: number, still: boolean): Frame {
  const r = freeRegion(fw, fh)
  const i = Math.max(0, Math.min(views.length - 1, Math.floor(p)))
  const a = views[i], b = views[Math.min(views.length - 1, i + 1)]
  // hold, then move over the last 45% of the screen
  const s = ease(Math.max(0, Math.min(1, (p - i - 0.55) / 0.45)))
  const ca = cam(a, fw, fh, r), cb = cam(b, fw, fh, r)
  if (s === 0 || a === b) return frameOf(a, ca)
  const sameScene = a.scene === b.scene && (a.scene !== Scene.Model || a.model === b.model)
  if (sameScene) {
    const dip = still ? 1 : 1 - 0.38 * Math.sin(Math.PI * s)
    const f = frameOf(s < 0.5 ? a : b, {
      cx: lerp(ca.cx, cb.cx, s),
      cy: lerp(ca.cy, cb.cy, s),
      zoom: Math.exp(lerp(Math.log(ca.zoom), Math.log(cb.zoom), s)) * dip,
    })
    f.explode = lerp(a.explode ?? 0, b.explode ?? 0, s)
    f.yaw = lerp(a.yaw ?? 0.5, b.yaw ?? 0.5, s)
    f.pitch = lerp(a.pitch ?? 0.3, b.pitch ?? 0.3, s)
    f.anim = lerp(a.anim ?? 0, b.anim ?? 0, s)
    return f
  }
  // a cut through the dark: push into the old scene, then settle into the new one
  const out = s < 0.5
  const c = out ? ca : cb
  const push = still ? 1 : out ? 1 + 0.5 * s : 1 + 0.5 * (1 - s)
  const f = frameOf(out ? a : b, a.scene === Scene.Model && out ? c : { ...c, zoom: c.zoom * push })
  if (f.scene === Scene.Model) f.explode = (out ? a.explode ?? 0 : b.explode ?? 0) * (out ? 1 - s : s)
  f.fade = 1 - Math.abs(2 * s - 1)
  return f
}
