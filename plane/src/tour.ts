// The tour, stop by stop: for each entry of each chapter, which diorama the camera visits and how it looks at it.
// A look is a target point in the diorama's own coordinates, and the camera's yaw (around), pitch (above) and
// distance. `tour` lists the parts a "Go deeper" visit steps through, when there are several worth pointing at.

import { airplane } from './content/airplane'
import { avionics } from './content/avionics'
import { cabin } from './content/cabin'
import { deck } from './content/deck'
import { electric } from './content/electric'
import { engines } from './content/engines'
import { fbw } from './content/fbw'
import { flying } from './content/flying'
import { fuel } from './content/fuel'
import { hydraulics } from './content/hydraulics'
import type { Chapter, Entry } from './content/types'

/** The dioramas, in the engine's order. */
export const Set = { Runway: 0, Xray: 1, Deck: 2, Turbofan: 3, Cabin: 4, Engine: 5, Gear: 6, Battery: 7, Wing: 8 } as const
export type Set = (typeof Set)[keyof typeof Set]
export const Flow = { fuel: 1, hydraulic: 2, electric: 4, air: 8, signal: 16, core: 32, bypass: 64 } as const

export type Look = { x: number; y: number; z: number; yaw: number; pitch: number; dist: number }
export type View = {
  set: Set
  look: Look
  focus?: number
  flows?: number
  explode?: number
  anim?: number
  tour?: number[]
}
export type Stop = View & { chapter: Chapter; key: string; entry: Entry }

const look = (x: number, y: number, z: number, yaw: number, pitch: number, dist: number): Look => ({ x, y, z, yaw, pitch, dist })

// the airplane, on the runway and on the blueprint, in meters from its center: nose toward +x, right wing +z
const PLANE = look(0, 4, 0, 0.75, 0.42, 190)
const XRAY = look(0, 6, 0, 0.6, 0.85, 125)
const DECK = look(0, 10, -4, 0.7, 0.55, 95)
const FAN = look(-4, 20, 0, 0.75, 0.4, 110)
const CABIN = look(0, 32, 0, 0.85, 0.4, 125)

const PFD = look(-12.5, 11.5, -14.5, 0.25, 0.2, 24)
const ND = look(-5.6, 11.5, -14.5, 0.15, 0.2, 24)
const EICAS = look(5.6, 11.5, -14.5, -0.1, 0.2, 24)
const HUD = look(-8, 17.5, -12, 0.35, 0.15, 20)
const MCP = look(0, 15.6, -14, 0.1, 0.25, 32)
const KEYS = look(0, 8.5, -7, 0.5, 0.9, 22)
const PEDESTAL = look(0, 8.5, -9, 0.8, 0.55, 28)
const OVERHEAD = look(0, 22, -9, 0.3, -0.3, 30)
const YOKE = look(-8, 9, -7, 0.9, 0.4, 24)
const DECK_TOUR = [0, 1, 2, 3, 4, 5, 6, 7, 8]

const VIEWS: Record<string, Record<string, View>> = {
  airplane: {
    overview: { set: Set.Runway, look: PLANE, tour: [0, 1, 2, 3, 4, 5] },
    fuselage: { set: Set.Runway, look: look(0, 6, 0, 1.3, 0.15, 110), focus: 0 },
    wing: { set: Set.Wing, look: look(0, 14, 0, 0.7, 0.45, 80), explode: 0.9, tour: [0, 1, 2, 3, 4, 5, 6, 7] },
    nose: { set: Set.Runway, look: look(28, 6, 0, 1.0, 0.12, 36), focus: 2 },
    tail: { set: Set.Runway, look: look(-26, 10, 0, 2.2, 0.2, 52), focus: 3 },
  },
  deck: {
    deck: { set: Set.Deck, look: DECK, tour: DECK_TOUR },
    pfd: { set: Set.Deck, look: PFD, focus: 0, anim: 0.4 },
    nd: { set: Set.Deck, look: ND, focus: 1 },
    eicas: { set: Set.Deck, look: EICAS, focus: 2, anim: 0.5 },
    hud: { set: Set.Deck, look: HUD, focus: 3 },
    mcp: { set: Set.Deck, look: MCP, focus: 4 },
    cdu: { set: Set.Deck, look: KEYS, focus: 5 },
    pedestal: { set: Set.Deck, look: PEDESTAL, focus: 6, anim: 0.3 },
    overhead: { set: Set.Deck, look: OVERHEAD, focus: 7 },
    yoke: { set: Set.Deck, look: YOKE, focus: 8 },
  },
  flying: {
    preflight: { set: Set.Deck, look: OVERHEAD, focus: 7 },
    start: { set: Set.Deck, look: EICAS, focus: 2, anim: 0.15 },
    taxi: { set: Set.Deck, look: look(0, 12, -6, 0.2, 0.35, 60), anim: 0.08 },
    takeoff: { set: Set.Deck, look: look(0, 13, -10, 0.2, 0.2, 42), focus: 6, anim: 1 },
    climb: { set: Set.Deck, look: PFD, focus: 0, anim: 0.85 },
    cruise: { set: Set.Deck, look: ND, focus: 1, anim: 0.6 },
    descent: { set: Set.Deck, look: MCP, focus: 4, anim: 0.3 },
    approach: { set: Set.Deck, look: HUD, focus: 3, anim: 0.3 },
    landing: { set: Set.Runway, look: look(10, 5, 0, 2.6, 0.1, 120) },
  },
  fbw: {
    path: { set: Set.Xray, look: XRAY, flows: Flow.signal, tour: [15, 0, 1, 2, 3, 4] },
    computers: { set: Set.Xray, look: look(21.4, 5, 0, 0.9, 0.6, 30), flows: Flow.signal, focus: 15 },
    laws: { set: Set.Deck, look: YOKE, focus: 8 },
    protections: { set: Set.Deck, look: PFD, focus: 0, anim: 0.9 },
    surfaces: { set: Set.Xray, look: look(-5.6, 5, 15, 0.4, 0.8, 62), focus: 2, flows: Flow.signal, tour: [0, 1, 2, 5, 6, 3, 4] },
    actuators: { set: Set.Xray, look: look(-5.6, 5, 15, 0.4, 0.8, 62), focus: 0, flows: Flow.hydraulic },
    gust: { set: Set.Xray, look: look(0, 6, 0, -0.5, 0.7, 120), focus: 1, flows: Flow.signal },
  },
  engines: {
    engine: { set: Set.Engine, look: look(0, 22, 0, 0.6, 0.35, 125), explode: 0.85, tour: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
    brayton: { set: Set.Turbofan, look: FAN, flows: Flow.core | Flow.bypass, tour: [0, 1, 2, 3, 4, 5, 6] },
    fan: { set: Set.Turbofan, look: look(19, 22, 0, 1.2, 0.25, 48), focus: 0, flows: Flow.bypass },
    compressor: { set: Set.Turbofan, look: look(4, 22, 0, 0.6, 0.45, 32), focus: 2, flows: Flow.core, tour: [1, 2] },
    combustor: { set: Set.Turbofan, look: look(-8, 22, 0, 0.6, 0.5, 24), focus: 3, flows: Flow.core },
    turbine: { set: Set.Turbofan, look: look(-16, 22, 0, 0.5, 0.45, 32), focus: 5, flows: Flow.core, tour: [4, 5] },
    spools: { set: Set.Turbofan, look: look(-4, 22, 0, 0.2, 0.6, 64), focus: 8, flows: Flow.core },
    fadec: { set: Set.Turbofan, look: look(14, 5, 4, 1.0, 0.3, 20), focus: 9, flows: Flow.bypass },
    nozzle: { set: Set.Turbofan, look: look(-28, 22, 0, 0.2, 0.3, 48), focus: 6, flows: Flow.core | Flow.bypass },
    reverser: { set: Set.Turbofan, look: look(0, 26, 0, 0.9, 0.35, 72), focus: 7, flows: Flow.bypass, anim: 1 },
  },
  electric: {
    bleedless: { set: Set.Xray, look: XRAY, flows: Flow.electric | Flow.air, tour: [13, 10, 12, 11] },
    generators: { set: Set.Xray, look: look(8.4, 3, 9.9, 0.8, 0.5, 32), flows: Flow.electric, focus: 13 },
    apu: { set: Set.Xray, look: look(-29, 7, 0, 2.4, 0.5, 36), flows: Flow.electric, focus: 11 },
    distribution: { set: Set.Xray, look: look(-7.8, 5, 0, 0.9, 0.7, 52), flows: Flow.electric, focus: 10 },
    batteries: { set: Set.Battery, look: look(0, 14, 0, 0.7, 0.45, 80), explode: 0.9, tour: [0, 1, 2, 3, 4, 5] },
    rat: { set: Set.Xray, look: look(-1, 4, 4, 0.5, 0.3, 42), flows: Flow.electric | Flow.hydraulic },
  },
  fuel: {
    tanks: { set: Set.Xray, look: look(0, 6, 0, 0.5, 1.0, 112), flows: Flow.fuel, focus: 9 },
    pumps: { set: Set.Xray, look: look(2.4, 4, 0, 0.7, 0.6, 46), flows: Flow.fuel, focus: 14 },
    feed: { set: Set.Xray, look: look(4.4, 4, 9, 0.9, 0.5, 42), flows: Flow.fuel, focus: 13 },
    jettison: { set: Set.Xray, look: look(-9.6, 5, 25, 0.5, 0.5, 36), flows: Flow.fuel },
    inerting: { set: Set.Xray, look: look(3.4, 4, 0, 1.1, 0.5, 26), flows: Flow.fuel },
  },
  hydraulics: {
    systems: { set: Set.Xray, look: XRAY, flows: Flow.hydraulic, tour: [14, 13, 0, 3, 4, 8] },
    pumps: { set: Set.Xray, look: look(4, 4, 0, 0.6, 0.6, 52), flows: Flow.hydraulic, focus: 14 },
    gear: { set: Set.Gear, look: look(0, 16, 0, 0.8, 0.3, 82), explode: 0.8, tour: [0, 1, 2, 3, 4, 5, 6, 7] },
    brakes: { set: Set.Gear, look: look(0, 12, 0, 1.3, 0.3, 62), explode: 1, focus: 6 },
    steering: { set: Set.Xray, look: look(23.8, 2, 0, 1.2, 0.3, 26), focus: 8, flows: Flow.hydraulic },
  },
  cabin: {
    air: { set: Set.Cabin, look: CABIN, flows: Flow.air, focus: 1, tour: [1, 5, 2, 3] },
    pressurization: { set: Set.Cabin, look: look(0, 30, 0, 0.5, 0.25, 135), flows: Flow.air, focus: 4 },
    humidity: { set: Set.Cabin, look: look(0, 36, -4, 0.9, 0.3, 72), flows: Flow.air },
    windows: { set: Set.Cabin, look: look(-5, 36, -24, 0.6, 0.15, 32), focus: 0, anim: 1 },
    filtration: { set: Set.Cabin, look: look(0, 21, -16, 0.8, 0.2, 42), flows: Flow.air, focus: 2 },
  },
  avionics: {
    ccs: { set: Set.Xray, look: look(-4, 5, 0, 0.8, 0.7, 70), flows: Flow.signal | Flow.electric, focus: 10 },
    afdx: { set: Set.Xray, look: XRAY, flows: Flow.signal },
    adiru: { set: Set.Xray, look: look(21.4, 5, 0, 1.2, 0.55, 30), flows: Flow.signal, focus: 15 },
    gps: { set: Set.Runway, look: look(0, 8, 0, -0.6, 0.5, 150) },
    radar: { set: Set.Runway, look: look(28, 6, 0, 0.4, 0.15, 36), focus: 2 },
    comms: { set: Set.Runway, look: look(0, 4, 0, 3.6, 0.5, 190) },
  },
}

export const CHAPTERS: Chapter[] = [airplane, deck, flying, fbw, engines, electric, fuel, hydraulics, cabin, avionics]

export const STOPS: Stop[] = CHAPTERS.flatMap((chapter) =>
  Object.entries(chapter.entries).map(([key, entry]) => {
    const view = VIEWS[chapter.id]?.[key]
    if (!view) throw new Error(`No view for ${chapter.id}.${key}`)
    return { ...view, chapter, key, entry }
  }),
)

/** The cover: the runway diorama from a little way off, before the first stop. */
export const COVER: View = { set: Set.Runway, look: look(0, 4, 0, 0.75, 0.38, 185) }

/** Where to look at each focusable part of a diorama, so a deep visit can fly from part to part. */
const PART_LOOKS: Partial<Record<Set, Record<number, Look>>> = {
  [Set.Runway]: {
    0: look(0, 6, 0, 1.3, 0.15, 110),
    1: look(-4, 4, 16, 0.3, 0.55, 70),
    2: look(28, 6, 0, 1.0, 0.12, 36),
    3: look(-26, 10, 0, 2.2, 0.2, 52),
    4: look(8, 2, 9.9, 0.9, 0.15, 30),
    5: look(-1, 1.5, 4.8, 0.7, 0.1, 26),
  },
  [Set.Deck]: { 0: PFD, 1: ND, 2: EICAS, 3: HUD, 4: MCP, 5: KEYS, 6: PEDESTAL, 7: OVERHEAD, 8: YOKE },
  [Set.Turbofan]: {
    0: look(19, 22, 0, 1.0, 0.3, 48),
    1: look(10, 22, 0, 0.7, 0.45, 28),
    2: look(2, 22, 0, 0.6, 0.45, 30),
    3: look(-8, 22, 0, 0.6, 0.5, 24),
    4: look(-12, 22, 0, 0.55, 0.45, 22),
    5: look(-18, 22, 0, 0.5, 0.45, 30),
    6: look(-28, 22, 0, 0.2, 0.3, 46),
    8: look(-4, 22, 0, 0.2, 0.6, 64),
  },
  [Set.Xray]: {
    0: look(-9, 5, 23, 0.4, 0.8, 34),
    1: look(-4, 5, 11, 0.4, 0.8, 30),
    2: look(-3, 5, 10, 0.5, 0.8, 44),
    3: look(-28, 7, 5, 0.6, 0.7, 30),
    4: look(-28, 9, 0, 1.2, 0.3, 30),
    5: look(-5, 5, 10, 0.4, 0.8, 40),
    6: look(-5, 5, 20, 0.2, 0.7, 40),
    8: look(-1, 2, 4.8, 0.6, 0.2, 30),
    10: look(-4, 5, 0, 0.8, 0.7, 60),
    11: look(-29, 7, 0, 2.4, 0.5, 36),
    12: look(4, 4, 1.5, 0.8, 0.5, 26),
    13: look(8.4, 3, 9.9, 0.8, 0.5, 32),
    14: look(2.4, 4, 0, 0.7, 0.6, 46),
    15: look(21.4, 5, 0, 0.9, 0.6, 30),
  },
  [Set.Cabin]: {
    1: CABIN,
    2: look(0, 21, -16, 0.8, 0.2, 42),
    3: look(0, 14, 4, 0.8, 0.1, 60),
    5: look(0, 30, 4, 0.6, 0.5, 70),
  },
}

// cutaways only make sense from their open side, so a visit swings less around them
const SWING: Partial<Record<Set, number>> = { [Set.Turbofan]: 0.45, [Set.Cabin]: 0.5, [Set.Deck]: 0.5 }

/** A "Go deeper" visit: one step for each step of the entry (or each paragraph). The camera flies to each part on
 *  the stop's list, or circles the stop when it has none; models come apart as the visit goes on. */
export type DeepStep = { text: string; view: View }

export function deepTour(s: Stop): DeepStep[] {
  const texts = s.entry.steps?.length ? s.entry.steps : s.entry.body
  const n = texts.length
  const swing = SWING[s.set] ?? 1.3
  return texts.map((text, i) => {
    const u = n > 1 ? i / (n - 1) : 0
    const focus = s.tour ? s.tour[i % s.tour.length] : s.focus
    const part = focus !== undefined ? PART_LOOKS[s.set]?.[focus] : undefined
    const l = part && s.tour ? part : s.look
    const yaw = l.yaw + (part && s.tour ? (i % 2 ? 0.12 : -0.12) : (u - 0.5) * swing)
    return {
      text,
      view: {
        ...s,
        look: { ...l, yaw, pitch: l.pitch + (i % 2 ? 0.08 : -0.03), dist: l.dist * (part && s.tour ? 1 : i % 2 ? 0.74 : 0.92) },
        focus,
        explode: s.explode !== undefined ? Math.max(0.15, u) : undefined,
      },
    }
  })
}
