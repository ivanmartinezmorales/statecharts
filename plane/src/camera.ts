// Scroll position to engine frame, in isometric: the camera always looks down at the same 2:1 angle, from one of the
// four diagonals. Each stop holds still for most of its screen, then the last stretch moves to the next: around the
// same diorama it pans and zooms; to another diorama it zooms out over the row of plinths, pans across and zooms in.

import type { Frame, V3 } from './engine'
import type { View } from './tour'

/** The part of the frame the card leaves free, in framebuffer pixels. */
export type Region = { x: number; y: number; w: number; h: number }

export function freeRegion(w: number, h: number): Region {
  // a phone held upright: the card sits at the bottom, the picture above it
  if (w < h) return { x: 0, y: h * 0.04, w, h: h * 0.56 }
  // wider screens: the card on the left, the picture to its right
  return { x: w * 0.36, y: h * 0.06, w: w * 0.62, h: h * 0.9 }
}

// how many world units fill the frame's height at a given distance, as the engine sizes it
const FOCAL = 1.561
/** 2:1 isometric: the pitch at which a square's diagonal steps two pixels across for one down. */
export const ISO_PITCH = Math.atan(0.5)
const QUARTER = Math.PI / 2
/** The nearest of the four isometric diagonals to a yaw. */
export const isoYaw = (yaw: number) => Math.PI / 4 + Math.round((yaw - Math.PI / 4) / QUARTER) * QUARTER

type Pose = { t: V3; yaw: number; pitch: number; dist: number }

const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const ease = (u: number) => u * u * (3 - 2 * u)

/** A stop's pose in the world, before fitting it to the free region. */
function pose(v: View, origins: V3[]): Pose {
  const o = origins[v.set]
  return { t: [o[0] + v.look.x, o[1] + v.look.y, o[2] + v.look.z], yaw: isoYaw(v.look.yaw), pitch: ISO_PITCH, dist: v.look.dist }
}

/** Moves the camera so the target sits in the middle of the free region, and back enough that the view fits it. */
function fit(p: Pose, fw: number, fh: number, r: Region): Pose {
  const aspect = r.w / r.h
  const dist = Math.min(p.dist * (fh / r.h) * Math.max(1, 1.5 / aspect), p.dist * 3.2)
  // the screen offset of the region's center, turned into a sideways and vertical shift of the target
  const f = fh * FOCAL
  const dx = (r.x + r.w / 2 - fw / 2) * dist / f
  const dy = (r.y + r.h / 2 - fh / 2) * dist / f
  const [sy, cy] = [Math.sin(p.yaw), Math.cos(p.yaw)]
  const [sp, cp] = [Math.sin(p.pitch), Math.cos(p.pitch)]
  const right: V3 = [cy, 0, -sy]
  const up: V3 = [-sp * sy, cp, -sp * cy]
  const t: V3 = [0, 1, 2].map((k) => p.t[k] - right[k] * dx + up[k] * dy) as V3
  return { ...p, t, dist }
}

function frameOf(v: View, p: Pose, set: number): Frame {
  return {
    scene: set,
    tx: p.t[0],
    ty: p.t[1],
    tz: p.t[2],
    yaw: p.yaw,
    pitch: p.pitch,
    dist: p.dist,
    explode: v.explode ?? 0,
    focus: v.focus ?? -1,
    flows: v.flows ?? 0,
    anim: v.anim ?? 0,
    fade: 0,
  }
}

/** Blends two views at s (0 to 1). Orbit offsets (drag) are added on top by the caller. */
export function between(a: View, b: View, s: number, origins: V3[], fw: number, fh: number, still: boolean): Frame {
  const r = freeRegion(fw, fh)
  const pa = fit(pose(a, origins), fw, fh, r)
  const pb = fit(pose(b, origins), fw, fh, r)
  if (s <= 0 || a === b) return frameOf(a, pa, a.set)
  if (s >= 1) return frameOf(b, pb, b.set)
  const travel = Math.hypot(pb.t[0] - pa.t[0], pb.t[1] - pa.t[1], pb.t[2] - pa.t[2])
  const arc = Math.sin(Math.PI * s)
  // the shorter way round
  let dyaw = pb.yaw - pa.yaw
  dyaw -= Math.round(dyaw / (2 * Math.PI)) * 2 * Math.PI
  const base = Math.exp(lerp(Math.log(pa.dist), Math.log(pb.dist), s))
  // over a long hop, zoom out far enough to see both tables; on a short one, ease out a little and back in
  const lift = still ? 0 : Math.max(base * 0.25, travel * 0.8 - base) * arc
  const p: Pose = {
    t: [0, 1, 2].map((k) => lerp(pa.t[k], pb.t[k], s)) as V3,
    yaw: pa.yaw + dyaw * s,
    pitch: ISO_PITCH,
    dist: base + lift,
  }
  const near = s < 0.5 ? a : b
  const f = frameOf(near, p, near.set)
  if (a.set === b.set) {
    f.explode = lerp(a.explode ?? 0, b.explode ?? 0, s)
    f.anim = lerp(a.anim ?? 0, b.anim ?? 0, s)
  } else if (near.explode !== undefined) {
    // a model assembles as you leave it and comes apart as you arrive
    f.explode = (near.explode ?? 0) * Math.abs(2 * s - 1)
  }
  return f
}

/** The frame at scroll position `p` (in screens, 0 at the first view). */
export function frameAt(views: View[], p: number, origins: V3[], fw: number, fh: number, still: boolean): Frame {
  const i = Math.max(0, Math.min(views.length - 1, Math.floor(p)))
  const a = views[i], b = views[Math.min(views.length - 1, i + 1)]
  // hold, then move over the last half of the screen
  const s = ease(Math.max(0, Math.min(1, (p - i - 0.5) / 0.5)))
  return between(a, b, s, origins, fw, fh, still)
}
