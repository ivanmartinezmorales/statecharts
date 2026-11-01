// The tour, stop by stop: for each entry of each chapter, what the engine shows. A shot is a box in the scene's
// world (center and size) that the camera fits into the part of the screen the card leaves free.

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

export const Scene = { Exterior: 0, Deck: 1, Planform: 2, Turbofan: 3, Cabin: 4, Model: 5 } as const
export type Scene = (typeof Scene)[keyof typeof Scene]
export const Model = { Engine: 0, Gear: 1, Battery: 2, Wing: 3 } as const
export type Model = (typeof Model)[keyof typeof Model]
export const Flow = { fuel: 1, hydraulic: 2, electric: 4, air: 8, signal: 16, core: 32, bypass: 64 } as const

export type Shot = { x: number; y: number; w: number; h: number }
export type View = {
  scene: Scene
  shot: Shot
  focus?: number
  flows?: number
  model?: Model
  explode?: number
  yaw?: number
  pitch?: number
  anim?: number
}
export type Stop = View & { chapter: Chapter; key: string; entry: Entry }

const box = (x: number, y: number, w: number, h: number): Shot => ({ x, y, w, h })
const MODEL_SHOT = box(0, 0, 1, 1)

// the exterior: the airplane in meters from its nose, as the engine draws it
const ext = (mx: number, my: number, w: number, h: number) => box(760 - mx * 8.4, 434 - my * 8.4, w, h)
// the planform: meters right of the centerline and aft of the nose
const top = (x: number, y: number, w: number, h: number) => box(320 + x * 8.9, 40 + y * 8.9, w, h)

const PLAN = top(0, 31, 600, 600)
const DECK = box(320, 130, 660, 380)
const CABIN = box(200, 200, 390, 390)
const FAN = box(330, 150, 620, 280)

const VIEWS: Record<string, Record<string, View>> = {
  airplane: {
    overview: { scene: Scene.Exterior, shot: ext(31, 1, 640, 230) },
    fuselage: { scene: Scene.Exterior, shot: ext(28, 0, 420, 120), focus: 0 },
    wing: { scene: Scene.Model, shot: MODEL_SHOT, model: Model.Wing, explode: 0.9, yaw: 0.5, pitch: 0.4 },
    nose: { scene: Scene.Exterior, shot: ext(4, 0, 110, 70), focus: 2 },
    tail: { scene: Scene.Exterior, shot: ext(55, 5, 180, 130), focus: 3 },
  },
  deck: {
    deck: { scene: Scene.Deck, shot: DECK },
    pfd: { scene: Scene.Deck, shot: box(82, 196, 150, 110), focus: 0, anim: 0.4 },
    nd: { scene: Scene.Deck, shot: box(208, 196, 150, 110), focus: 1 },
    eicas: { scene: Scene.Deck, shot: box(432, 196, 150, 110), focus: 2, anim: 0.5 },
    hud: { scene: Scene.Deck, shot: box(113, 60, 140, 96), focus: 3 },
    mcp: { scene: Scene.Deck, shot: box(320, 126, 280, 56), focus: 4 },
    cdu: { scene: Scene.Deck, shot: box(320, 330, 150, 80), focus: 5 },
    pedestal: { scene: Scene.Deck, shot: box(320, 280, 150, 110), focus: 6, anim: 0.3 },
    overhead: { scene: Scene.Deck, shot: box(320, -95, 460, 170), focus: 7 },
    yoke: { scene: Scene.Deck, shot: box(90, 300, 130, 120), focus: 8 },
  },
  flying: {
    preflight: { scene: Scene.Deck, shot: box(320, -95, 460, 170) },
    start: { scene: Scene.Deck, shot: box(432, 196, 150, 110), focus: 2, anim: 0.15 },
    taxi: { scene: Scene.Deck, shot: DECK, anim: 0.08 },
    takeoff: { scene: Scene.Deck, shot: box(320, 230, 360, 260), focus: 6, anim: 1 },
    climb: { scene: Scene.Deck, shot: box(82, 196, 150, 110), focus: 0, anim: 0.85 },
    cruise: { scene: Scene.Deck, shot: box(208, 196, 150, 110), focus: 1, anim: 0.6 },
    descent: { scene: Scene.Deck, shot: box(320, 126, 280, 56), focus: 4, anim: 0.3 },
    approach: { scene: Scene.Deck, shot: box(113, 60, 140, 96), focus: 3, anim: 0.3 },
    landing: { scene: Scene.Exterior, shot: ext(20, -2, 520, 200), anim: 0 },
  },
  fbw: {
    path: { scene: Scene.Planform, shot: PLAN, flows: Flow.signal },
    computers: { scene: Scene.Planform, shot: top(0, 10, 140, 110), flows: Flow.signal, focus: 10 },
    laws: { scene: Scene.Deck, shot: box(90, 300, 130, 120), focus: 8 },
    protections: { scene: Scene.Deck, shot: box(82, 196, 150, 110), focus: 0, anim: 0.9 },
    surfaces: { scene: Scene.Planform, shot: top(15, 37, 300, 180), focus: 2, flows: Flow.signal },
    actuators: { scene: Scene.Planform, shot: top(15, 37, 300, 180), focus: 0, flows: Flow.hydraulic },
    gust: { scene: Scene.Planform, shot: PLAN, focus: 1, flows: Flow.signal },
  },
  engines: {
    engine: { scene: Scene.Model, shot: MODEL_SHOT, model: Model.Engine, explode: 0.85, yaw: 0.35, pitch: 0.3 },
    brayton: { scene: Scene.Turbofan, shot: FAN, flows: Flow.core | Flow.bypass },
    fan: { scene: Scene.Turbofan, shot: box(100, 150, 130, 270), focus: 0, flows: Flow.bypass },
    compressor: { scene: Scene.Turbofan, shot: box(225, 150, 240, 140), focus: 2, flows: Flow.core },
    combustor: { scene: Scene.Turbofan, shot: box(307, 150, 120, 120), focus: 3, flows: Flow.core },
    turbine: { scene: Scene.Turbofan, shot: box(400, 150, 170, 160), focus: 5, flows: Flow.core },
    spools: { scene: Scene.Turbofan, shot: box(290, 150, 430, 100), focus: 8, flows: Flow.core },
    fadec: { scene: Scene.Turbofan, shot: box(218, 40, 130, 70), focus: 9, flows: Flow.bypass },
    nozzle: { scene: Scene.Turbofan, shot: box(520, 150, 230, 240), focus: 6, flows: Flow.core | Flow.bypass },
    reverser: { scene: Scene.Turbofan, shot: box(340, 110, 320, 170), focus: 7, flows: Flow.bypass, anim: 1 },
  },
  electric: {
    bleedless: { scene: Scene.Planform, shot: PLAN, flows: Flow.electric | Flow.air },
    generators: { scene: Scene.Planform, shot: top(9.9, 23, 130, 110), flows: Flow.electric, focus: 13 },
    apu: { scene: Scene.Planform, shot: top(0, 60, 170, 110), flows: Flow.electric, focus: 11 },
    distribution: { scene: Scene.Planform, shot: top(0, 38, 220, 170), flows: Flow.electric, focus: 10 },
    batteries: { scene: Scene.Model, shot: MODEL_SHOT, model: Model.Battery, explode: 0.9, yaw: 0.6, pitch: 0.45 },
    rat: { scene: Scene.Planform, shot: top(4, 33, 150, 120), flows: Flow.electric | Flow.hydraulic },
  },
  fuel: {
    tanks: { scene: Scene.Planform, shot: top(0, 33, 580, 260), flows: Flow.fuel, focus: 9 },
    pumps: { scene: Scene.Planform, shot: top(0, 32, 220, 140), flows: Flow.fuel },
    feed: { scene: Scene.Planform, shot: top(9, 29, 190, 150), flows: Flow.fuel, focus: 13 },
    jettison: { scene: Scene.Planform, shot: top(23, 40, 160, 110), flows: Flow.fuel },
    inerting: { scene: Scene.Planform, shot: top(0, 28, 130, 90), flows: Flow.fuel },
  },
  hydraulics: {
    systems: { scene: Scene.Planform, shot: PLAN, flows: Flow.hydraulic },
    pumps: { scene: Scene.Planform, shot: top(0, 27, 320, 160), flows: Flow.hydraulic, focus: 13 },
    gear: { scene: Scene.Model, shot: MODEL_SHOT, model: Model.Gear, explode: 0.8, yaw: 0.7, pitch: 0.25 },
    brakes: { scene: Scene.Model, shot: MODEL_SHOT, model: Model.Gear, explode: 1, yaw: 1.2, pitch: 0.3, focus: 6 },
    steering: { scene: Scene.Planform, shot: top(0, 7, 110, 90), focus: 8, flows: Flow.hydraulic },
  },
  cabin: {
    air: { scene: Scene.Cabin, shot: CABIN, flows: Flow.air, focus: 1 },
    pressurization: { scene: Scene.Cabin, shot: CABIN, flows: Flow.air, focus: 4 },
    humidity: { scene: Scene.Cabin, shot: box(200, 190, 300, 200), flows: Flow.air },
    windows: { scene: Scene.Cabin, shot: box(60, 170, 130, 110), focus: 0, anim: 1 },
    filtration: { scene: Scene.Cabin, shot: box(200, 256, 180, 100), flows: Flow.air, focus: 2 },
  },
  avionics: {
    ccs: { scene: Scene.Planform, shot: top(0, 24, 200, 330), flows: Flow.signal | Flow.electric, focus: 10 },
    afdx: { scene: Scene.Planform, shot: PLAN, flows: Flow.signal },
    adiru: { scene: Scene.Planform, shot: top(0, 9, 130, 100), flows: Flow.signal },
    gps: { scene: Scene.Exterior, shot: ext(20, 2, 360, 160) },
    radar: { scene: Scene.Exterior, shot: ext(4, 0, 110, 70), focus: 2 },
    comms: { scene: Scene.Exterior, shot: ext(31, 1, 640, 230) },
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

/** The cover: the whole airplane at sunset, before the first stop. */
export const COVER: View = { scene: Scene.Exterior, shot: ext(31, 3, 760, 300) }
