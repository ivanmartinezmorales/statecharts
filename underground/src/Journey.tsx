import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './kit/reduced-motion'
import type { Journey as Kind } from './components'
import { COMPONENTS } from './components'
import { Detail } from './Detail'
import { gradeCanvas, rain } from './noir.js'

// A system's whole world as one long pixel panorama (640 x 200), and one drop that travels through it as you scroll.
// The camera follows the drop; at each stop, the caption says what happens there. Everything else keeps flowing.
// Water: reservoir, deep tunnel, cleaning, shaft, water main, building, tap.
// Wastewater: sink, house drain, street sewer, interceptor, pumps, treatment plant, river.

// TOP rows of extra sky above each panorama let the camera keep the drop in the middle of the screen
const SW = 640, SH = 200, TOP = 70
type Pt = [number, number]
type Stop = { at: number; title: string; text: string }
type Scene = { title: string; path: Pt[]; stops: Stop[]; paint: (g: CanvasRenderingContext2D, t: number) => void; drop: (p: number) => [string, string] }

const px = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h) }

// ---- shared scenery
// night, a little lighter near the ground where the street lights are
function sky(g: CanvasRenderingContext2D, ground: number) {
  const s = g.createLinearGradient(0, 0, 0, ground); s.addColorStop(0, '#0a0b12'); s.addColorStop(1, '#2a2c36')
  g.fillStyle = s; g.fillRect(0, 0, SW, ground)
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
    { at: fractionAt(WATER_PATH, [420, 99]), title: 'The water main', text: 'Under every street the mains form a grid of loops, held at about 40 to 80 psi. The city is split into pressure zones by height, so hills get enough and low streets do not get too much.' },
    { at: fractionAt(WATER_PATH, [470, 99]), title: 'Hydrants and valves', text: 'Hydrants tap the main every hundred meters or so for firefighters. Valves every block let crews shut one stretch for repairs while water flows around the loop.' },
    { at: fractionAt(WATER_PATH, [556, 90]), title: 'Shutoff and meter', text: 'The building\'s service line passes a shutoff valve under the sidewalk and a meter in the basement, with a check valve so water never flows back into the main.' },
    { at: fractionAt(WATER_PATH, [556, 50]), title: 'Up the building', text: 'City pressure reaches about five or six floors. Taller buildings pump water to a rooftop tank, and it falls back down to the taps.' },
    { at: 1, title: 'Out of the tap', text: 'Turn the handle and it pours out, a few days after it fell as rain in the hills.' },
  ],
  drop: () => ['#7fc4ff', '#e8f6ff'],
  paint(g, t) {
    const ground = 74
    sky(g, ground)
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
    pipe(g, [[470, 99], [470, 72]], 1, '#5a6a7e', '#1e3a5a'); px(g, 466, 62, 9, 12, '#c4503f'); px(g, 464, 66, 13, 3, '#c4503f'); px(g, 467, 60, 7, 2, '#e3a64a')
    for (const vx of [420, 510]) { px(g, vx - 2, 94, 5, 10, '#2a2a30'); px(g, vx - 3, 92, 7, 2, '#4a4a54') }
    px(g, 551, 86, 11, 8, '#2a3a5a'); px(g, 553, 88, 7, 4, '#bfe6ff')
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
    { at: fractionAt(WASTE_PATH, [300, 162]), title: 'The interceptor', text: 'Street sewers drop into a big interceptor tunnel that gathers a whole neighborhood\'s wastewater and carries it to the plant.' },
    { at: fractionAt(WASTE_PATH, [380, 162]), title: 'When it storms', text: 'Older cities send rain from the storm drains into the same sewers. In a big storm, more arrives than the plant can treat, and regulators let the overflow spill into the river so it does not back up into basements. Many cities are building huge storage tunnels to hold it.' },
    { at: fractionAt(WASTE_PATH, [440, 110]), title: 'Pumped up', text: 'At the plant, big pumps lift it back up to the surface so it can flow through the treatment tanks.' },
    { at: fractionAt(WASTE_PATH, [470, 64]), title: 'Screens and settling', text: 'Bars and screens catch rags and grit. In still tanks, heavy solids sink to the bottom as sludge.' },
    { at: fractionAt(WASTE_PATH, [536, 64]), title: 'Bacteria do the work', text: 'Air is bubbled through the water, and helpful bacteria eat what is left of the waste.' },
    { at: fractionAt(WASTE_PATH, [556, 64]), title: 'Sludge becomes energy', text: 'The solids that settled out are cooked in egg-shaped digesters, where other bacteria turn them into biogas to power the plant, and what is left into fertilizer.' },
    { at: fractionAt(WASTE_PATH, [580, 64]), title: 'Disinfected', text: 'The cleaned water settles once more and is disinfected with ultraviolet light or chlorine.' },
    { at: 1, title: 'Back to the river', text: 'Clean enough for fish, it flows out into a river or the sea, and the water cycle carries on.' },
  ],
  // murky until the treatment plant, then clear
  drop: (p) => (p < 0.78 ? ['#8a7a4a', '#c9b88a'] : ['#7fc4ff', '#e8f6ff']),
  paint(g, t) {
    const ground = 74
    sky(g, ground)
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
    for (const dx of [478, 500]) { g.fillStyle = '#9a968c'; g.beginPath(); g.ellipse(dx, 38, 8, 13, 0, 0, Math.PI * 2); g.fill(); px(g, dx - 1, 24, 2, 3, '#6a6e78') }
    px(g, 380, 150, 12, 10, '#5a5a66'); pipe(g, [[392, 155], [420, 120], [420, 98]], 2, '#6a6e78', '#2a2a20')
    px(g, 566, 56, 20, 14, '#3f6f8a'); g.globalAlpha = 0.4 + 0.3 * Math.sin(t * 4); px(g, 568, 58, 16, 10, '#b48cff'); g.globalAlpha = 1
    px(g, 596, 74, 44, 20, '#2f6f9a'); for (let i = 0; i < 6; i++) px(g, 598 + cyc(t * 10 + i * 9, 40), 78 + (i % 3) * 4, 3, 1, 'rgba(220,240,255,0.6)')
    pipe(g, [[586, 64], [612, 82]], 2, '#6a6e78', '#2f6f9a')
    flow(g, WASTE_PATH, t, (p) => (p < 0.78 ? 'rgba(170,150,100,0.85)' : 'rgba(150,210,255,0.85)'))
  },
}

// ---- electricity: from the power plant to the outlet
const POWER_PATH: Pt[] = [[64, 44], [104, 44], [130, 22], [210, 26], [290, 22], [340, 40], [366, 52], [392, 52], [392, 100], [520, 100], [532, 92], [566, 92], [566, 42], [598, 42]]
const power: Scene = {
  title: 'Follow the electricity',
  path: POWER_PATH,
  stops: [
    { at: 0, title: 'The power plant', text: 'Steam, falling water or wind spins a turbine, and the turbine spins a generator: magnets turning inside coils of copper. It makes electricity at about 10,000 to 25,000 volts.' },
    { at: fractionAt(POWER_PATH, [104, 44]), title: 'Stepped up', text: 'A transformer raises it to 115,000 volts or more. The higher the voltage, the less current is needed, and the less is lost as heat on the long trip.' },
    { at: fractionAt(POWER_PATH, [210, 26]), title: 'Transmission lines', text: 'Steel towers carry it across the country, sometimes hundreds of kilometers, losing only a few percent on the way. It is alternating current, flipping 60 times a second (50 in Europe).' },
    { at: fractionAt(POWER_PATH, [350, 44]), title: 'The substation', text: 'Near the city, transformers bring it down to about 13,000 volts, and breakers can cut off a faulty line in a fraction of a second.' },
    { at: fractionAt(POWER_PATH, [450, 100]), title: 'Under the street', text: 'Feeder cables run under the streets in concrete duct banks. In dense cities several feeders supply every block, so if one fails the lights stay on.' },
    { at: fractionAt(POWER_PATH, [526, 96]), title: 'The vault transformer', text: 'In a vault under the sidewalk, a transformer drops it to 120/208 volts, the voltage your building uses.' },
    { at: fractionAt(POWER_PATH, [566, 80]), title: 'The meter and the panel', text: 'A meter counts every kilowatt-hour. The panel splits it into circuits, each with a breaker that trips if too much current flows.' },
    { at: 1, title: 'The light comes on', text: 'Flip the switch and the circuit closes. The energy left the power plant a fraction of a second ago.' },
  ],
  drop: () => ['#ffe066', '#ffffff'],
  paint(g, t) {
    const ground = 74
    sky(g, ground)
    earth(g, ground)
    px(g, 14, 30, 60, 44, '#5a6a7a'); px(g, 20, 40, 48, 6, '#3e4a56'); for (let x = 22; x < 66; x += 8) px(g, x, 52, 4, 10, '#ffd890')
    for (const sx of [24, 52]) { px(g, sx, 6, 8, 24, '#7a7a86'); for (let i = 0; i < 4; i++) { const r = 3 + i * 2; g.fillStyle = `rgba(220,220,230,${0.35 - i * 0.07})`; g.beginPath(); g.arc(sx + 4 + i * 3, 4 - cyc(t * 6 + i * 4, 16), r, 0, Math.PI * 2); g.fill() } }
    px(g, 92, 50, 18, 24, '#4a4a54'); for (let x = 94; x < 108; x += 4) px(g, x, 44, 2, 6, '#c9c4b8')
    for (const tx of [130, 210, 290]) { g.strokeStyle = '#8a8a96'; g.lineWidth = 1; g.beginPath(); g.moveTo(tx - 8, ground); g.lineTo(tx, 18); g.lineTo(tx + 8, ground); g.moveTo(tx - 6, 24); g.lineTo(tx + 6, 24); g.moveTo(tx - 5, 40); g.lineTo(tx + 5, 52); g.moveTo(tx + 5, 40); g.lineTo(tx - 5, 52); g.stroke() }
    px(g, 330, 40, 50, 34, 'rgba(120,120,140,0.25)'); for (let x = 330; x <= 380; x += 4) px(g, x, 60, 1, 14, '#8a8a96')
    for (const x of [338, 356]) { px(g, x, 46, 12, 14, '#5a6a5a'); px(g, x + 2, 40, 2, 6, '#c9c4b8'); px(g, x + 8, 40, 2, 6, '#c9c4b8') }
    city(g, 400, 540, ground)
    px(g, 540, 6, 76, ground - 6, '#4a3f62')
    for (let y = 12; y < ground - 4; y += 10) for (let x = 546; x < 612; x += 10) px(g, x, y, 6, 6, y === 32 && x === 586 ? '#2a2440' : '#ffd890')
    px(g, 390, ground, 150, 8, '#3a3a42'); for (let x = 396; x < 540; x += 14) px(g, x, ground + 3, 6, 1, '#e8d890')
    px(g, 384, 94, 140, 14, '#9a968c'); for (let x = 390; x < 520; x += 10) px(g, x, 98, 6, 6, '#2a2a30')
    px(g, 522, 84, 22, 20, '#3a3a42'); px(g, 526, 88, 14, 12, '#5a6a5a')
    px(g, 560, 86, 12, 8, '#2a2a30'); px(g, 562, 88, 8, 4, '#bfe066')
    g.strokeStyle = 'rgba(255,224,102,0.5)'; g.lineWidth = 1; g.beginPath(); POWER_PATH.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke()
    flow(g, POWER_PATH, t * 2.5, () => 'rgba(255,230,120,0.9)', 12)
  },
}

// ---- the internet, close to home: the laptop, the street, the exchange, the data center, the coast. The globe
// picks it up from the shore (see Globe.tsx).
const NET_PATH: Pt[] = [[38, 50], [58, 56], [70, 56], [70, 98], [250, 104], [282, 104], [282, 56], [300, 56], [300, 104], [410, 108], [410, 60], [440, 60], [440, 110], [560, 112], [566, 92], [584, 96], [606, 126], [640, 150]]
const internet: Scene = {
  title: 'Follow the internet',
  path: NET_PATH,
  stops: [
    { at: 0, title: 'Your laptop', text: 'You open a video. Your laptop sends the request as radio waves to the Wi-Fi router, a few meters away.' },
    { at: fractionAt(NET_PATH, [70, 70]), title: 'The router', text: 'The router turns it into flashes of light and sends them down a glass fiber, through the wall and under the sidewalk.' },
    { at: fractionAt(NET_PATH, [160, 102]), title: 'Fiber under the street', text: 'The fiber runs in orange plastic ducts beside the power and water. Light in glass travels about 200,000 km a second.' },
    { at: fractionAt(NET_PATH, [282, 80]), title: 'The exchange', text: 'A building full of equipment gathers the fibers of thousands of homes. Splitters let one fiber from here serve a whole street.' },
    { at: fractionAt(NET_PATH, [425, 60]), title: 'The data center', text: 'Rows of servers store websites and videos. At an internet exchange inside, hundreds of networks hand traffic to each other.' },
    { at: fractionAt(NET_PATH, [500, 111]), title: 'To the coast', text: 'If what you asked for lives on another continent, long-distance fiber carries the request to the shore.' },
    { at: fractionAt(NET_PATH, [575, 94]), title: 'The landing station', text: 'A small, guarded building where an undersea cable comes ashore. It also sends power out along the cable to boost the light on its way.' },
    { at: 1, title: 'Into the sea', text: 'The cable slips under the beach and down to the seafloor. Keep scrolling to follow it around the world.' },
  ],
  drop: () => ['#7fe0ff', '#ffffff'],
  paint(g, t) {
    const ground = 74
    sky(g, ground)
    earth(g, ground)
    px(g, 8, 26, 70, 48, '#7a4434'); g.fillStyle = '#5a3024'; g.beginPath(); g.moveTo(4, 26); g.lineTo(43, 8); g.lineTo(82, 26); g.fill()
    px(g, 20, 40, 44, 30, '#ffe0a0'); px(g, 30, 50, 14, 8, '#3a3a50'); px(g, 32, 51, 10, 6, '#7fe0ff'); px(g, 28, 58, 18, 2, '#5a5a66')
    px(g, 54, 54, 8, 4, '#2a2a30'); px(g, 56, 52, 1, 2, '#2a2a30'); px(g, 60, 52, 1, 2, '#2a2a30'); px(g, 58, 55, 1, 1, Math.floor(t * 4) % 2 ? '#7fe0a0' : '#2a5a3a')
    for (let i = 0; i < 3; i++) { const r = 3 + cyc(t * 10 + i * 4, 12); g.strokeStyle = `rgba(127,224,255,${0.5 - r / 30})`; g.beginPath(); g.arc(46, 52, r, -0.6, 0.6); g.stroke() }
    px(g, 82, ground, 470, 8, '#3a3a42'); for (let x = 88; x < 550; x += 14) px(g, x, ground + 3, 6, 1, '#e8d890')
    city(g, 330, 400, ground)
    px(g, 262, 30, 44, 44, '#5a6a7a'); for (let y = 36; y < 70; y += 8) for (let x = 266; x < 302; x += 6) px(g, x, y, 4, 5, (x + y + Math.floor(t * 3)) % 4 ? '#3a4a56' : '#7fe0a0')
    px(g, 392, 34, 64, 40, '#3e4a56'); for (let y = 40; y < 70; y += 6) for (let x = 396; x < 452; x += 5) px(g, x, y, 3, 4, (x * 3 + y + Math.floor(t * 5)) % 5 ? '#2a3440' : '#7fe0ff')
    for (const fx of [398, 414, 430, 446]) { px(g, fx, 28, 8, 6, '#6a6e78'); px(g, fx + 3, 30, 2, 2, Math.floor(t * 8 + fx) % 2 ? '#9aa' : '#567') }
    px(g, 560, 76, 30, 0, '#000'); g.fillStyle = '#d9c28a'; g.beginPath(); g.moveTo(552, ground); g.lineTo(600, ground); g.lineTo(640, 100); g.lineTo(640, 200); g.lineTo(552, 200); g.fill()
    px(g, 566, 60, 22, 14, '#9a968c'); px(g, 570, 64, 6, 6, '#3a3a50'); px(g, 580, 54, 2, 6, '#8a8a96')
    g.fillStyle = '#1f4f7a'; g.beginPath(); g.moveTo(604, ground); g.lineTo(640, ground); g.lineTo(640, 200); g.lineTo(600, 200); g.lineTo(612, 120); g.fill()
    for (let i = 0; i < 5; i++) px(g, 608 + cyc(t * 8 + i * 7, 30), ground + 1 + (i % 2) * 2, 4, 1, 'rgba(220,240,255,0.6)')
    g.strokeStyle = '#e07a2a'; g.lineWidth = 3; g.beginPath(); NET_PATH.slice(2).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke()
    g.strokeStyle = '#2a2a30'; g.lineWidth = 1; g.stroke()
    flow(g, NET_PATH, t * 3, () => 'rgba(127,224,255,0.95)', 10)
  },
}

const SCENES: Record<Kind, Scene> = { water, wastewater, power, internet }
const SKY = '#05060a'

// What you can look inside at each stop, by the stop's title
const LOOK_INSIDE: Record<string, string[]> = {
  'Deep under the city': ['water-tunnel'], 'The water main': ['water-main'], 'Hydrants and valves': ['hydrant'], 'Shutoff and meter': ['water-service'],
  'The house drain': ['house-drain'], 'The street sewer': ['brick-sewer', 'manhole'], 'When it storms': ['storm-drain'],
  'The power plant': ['steam-turbine', 'generator'], 'Stepped up': ['step-up-transformer', 'bushing'], 'Transmission lines': ['transmission-tower', 'insulator'],
  'The substation': ['substation', 'circuit-breaker'], 'Under the street': ['power'], 'The vault transformer': ['vault-transformer'], 'The meter and the panel': ['meter', 'breaker-panel'],
  'The router': ['router'], 'Fiber under the street': ['telecom'], 'The exchange': ['exchange', 'pon-splitter'], 'The data center': ['server-rack', 'ixp'],
  'The landing station': ['landing-station'], 'Into the sea': ['undersea-cable'],
}

export function LookInside({ ids, onPick }: { ids?: string[]; onPick: (id: string) => void }) {
  if (!ids?.length) return null
  return (
    <p className="ug-look">
      <span>Look inside</span>
      {ids.map((id) => <button key={id} type="button" onClick={() => onPick(id)}>{COMPONENTS[id].title} +</button>)}
    </p>
  )
}

// `onEnd` is called when the reader scrolls on past the last stop, for a journey that carries on somewhere else;
// `start` begins partway, for coming back to it.
export function Journey({ kind, onClose, onEnd, start = 0 }: { kind: Kind; onClose: () => void; onEnd?: () => void; start?: number }) {
  const scene = SCENES[kind]
  const reduced = useReducedMotion()
  const canvas = useRef<HTMLCanvasElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const progress = useRef({ target: start, now: start, over: 0 })
  const [stop, setStop] = useState(0)
  const [pick, setPick] = useState<string | null>(null)

  // Scroll, drag and keys all move the drop along (while a part is open, Escape closes it)
  useEffect(() => {
    if (pick) {
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPick(null) }
      addEventListener('keydown', onKey)
      return () => removeEventListener('keydown', onKey)
    }
    const nudge = (d: number) => {
      const p = progress.current
      if (onEnd && p.target >= 1 && d > 0) { p.over += d; if (p.over > 0.08) onEnd(); return }
      p.over = 0
      p.target = Math.max(0, Math.min(1, p.target + d))
    }
    // When the scrolling stops, glide to the nearest stop
    let settle = 0
    const snap = () => { const p = progress.current, near = scene.stops.reduce((a, s) => (Math.abs(s.at - p.target) < Math.abs(a - p.target) ? s.at : a), 0); p.target = near }
    const onWheel = (e: WheelEvent) => { e.preventDefault(); nudge((e.deltaY + e.deltaX) / 4000); clearTimeout(settle); settle = window.setTimeout(snap, 260) }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (['ArrowDown', 'ArrowRight', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); jump(1) }
      else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); jump(-1) }
    }
    const jump = (dir: number) => {
      const p = progress.current, at = scene.stops.map((s) => s.at)
      const next = dir > 0 ? at.find((a) => a > p.target + 0.001) : [...at].reverse().find((a) => a < p.target - 0.001)
      if (next !== undefined) p.target = next
      else if (dir > 0 && onEnd) onEnd()
    }
    let touch: number | null = null
    const ts = (e: TouchEvent) => { touch = e.touches[0].clientY + e.touches[0].clientX }
    const tm = (e: TouchEvent) => { if (touch === null) return; const v = e.touches[0].clientY + e.touches[0].clientX; nudge((touch - v) / 1600); touch = v; e.preventDefault() }
    addEventListener('wheel', onWheel, { passive: false })
    addEventListener('keydown', onKey)
    addEventListener('touchstart', ts, { passive: true })
    addEventListener('touchmove', tm, { passive: false })
    const te = () => snap()
    addEventListener('touchend', te)
    return () => { clearTimeout(settle); removeEventListener('wheel', onWheel); removeEventListener('keydown', onKey); removeEventListener('touchstart', ts); removeEventListener('touchmove', tm); removeEventListener('touchend', te) }
  }, [scene, onClose, onEnd, pick])

  // Draw the world 12 times a second; ease the drop and the camera every frame
  useEffect(() => {
    const g = canvas.current?.getContext('2d', { willReadFrequently: true })
    if (!g) return
    let raf = 0, lastF = -1
    const tick = (now: number) => {
      const t = now / 1000, p = progress.current
      p.now += (p.target - p.now) * (reduced ? 1 : 0.08)
      const f = Math.floor(t * 12)
      const [dx, dy] = along(scene.path, p.now)
      if (f !== lastF || reduced) {
        lastF = f
        g.fillStyle = SKY; g.fillRect(0, 0, SW, TOP + SH)
        g.save(); g.translate(0, TOP)
        scene.paint(g, reduced ? 2 : t)
        if (scene === power && p.now > 0.97) { px(g, 586, 32, 6, 6, '#fff6c0'); const lit = g.createRadialGradient(589, 35, 0, 589, 35, 14); lit.addColorStop(0, 'rgba(255,240,170,0.6)'); lit.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = lit; g.fillRect(575, 21, 28, 28) }
        const [body, shine] = scene.drop(p.now)
        const halo = g.createRadialGradient(dx, dy, 0, dx, dy, 10); halo.addColorStop(0, 'rgba(255,255,255,0.45)'); halo.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = halo; g.fillRect(dx - 10, dy - 10, 20, 20)
        px(g, dx - 1, dy - 3, 2, 1, body); px(g, dx - 2, dy - 2, 4, 4, body); px(g, dx - 1, dy - 1, 1, 1, shine)
        g.restore()
        rain(g, t, SW, TOP + 72)
        gradeCanvas(g, SW, TOP + SH)
      }
      // The camera follows the drop like a demo reel: it glides in close at each stop and eases back out between
      // them (a balloon zoom), rising and sinking with it. It never rolls.
      const w = innerWidth, h = innerHeight
      const near = Math.max(0, 1 - Math.min(...scene.stops.map((st) => Math.abs(st.at - p.now))) / 0.07)
      const k = Math.max(w / SW, h / (SH + TOP)) * (1.12 + 0.6 * near * near)
      const cx = Math.max(w / 2 / k, Math.min(SW - w / 2 / k, dx)), cy = Math.max(h / 2 / k, Math.min(SH + TOP - h / 2 / k, TOP + dy + 8))
      if (world.current) world.current.style.transform = `translate(${w / 2}px, ${h / 2}px) scale(${k}) translate(${-cx}px, ${-cy}px)`
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
      <div className="ug-journey__world" ref={world}><canvas ref={canvas} width={SW} height={SH + TOP} aria-hidden /></div>
      <div className="ug-journey__bar"><div ref={bar} /></div>
      <header className="ug-journey__title"><p>{scene.title}</p></header>
      <section className="ug-journey__caption" key={stop}>
        <p className="ug-imm__depth">Stop {stop + 1} of {scene.stops.length}</p>
        <h2>{st.title}</h2>
        <p>{st.text}</p>
        <LookInside ids={LOOK_INSIDE[st.title]} onPick={setPick} />
      </section>
      <p className="ug-imm__hint" data-on>Scroll to follow the drop</p>
      {pick && <Detail id={pick} onClose={() => setPick(null)} />}
      <button type="button" className="ug-imm__close" onClick={onClose} aria-label="Back to the layer" autoFocus>✕</button>
    </div>
  )
}
