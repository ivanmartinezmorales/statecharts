import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from './kit/reduced-motion'
import { Detail } from './Detail'
import { LookInside } from './Journey'

// The internet beyond the shore: a pixelated globe wrapped in its undersea cables, with light pulsing along every
// one. Scrolling flies the camera: down into the sea off New York, across the Atlantic with one pulse of light to
// Britain, out to see the whole planet turning, and home again. It is drawn at a third of the size and scaled up
// without smoothing, like everything else here.
//
// Coastlines are rough outlines in longitude and latitude, and cables follow their real routes through a handful of
// waypoints: close enough to recognize, not a map to navigate by.

type LonLat = [number, number]
const PIX = 3

const LAND: LonLat[][] = [
  // North America
  [[-168, 66], [-162, 70], [-140, 70], [-125, 72], [-95, 72], [-80, 73], [-65, 60], [-60, 52], [-53, 47], [-66, 44], [-70, 41], [-75, 38], [-76, 35], [-81, 31], [-80, 25], [-82, 27], [-84, 30], [-90, 29], [-97, 26], [-97, 22], [-92, 18], [-87, 21], [-88, 16], [-83, 10], [-79, 9], [-81, 8], [-85, 11], [-92, 15], [-105, 20], [-110, 24], [-112, 30], [-115, 32], [-118, 34], [-121, 36], [-124, 41], [-124, 47], [-127, 50], [-132, 55], [-140, 59], [-150, 60], [-158, 57], [-165, 60]],
  // Greenland, Iceland
  [[-55, 60], [-45, 60], [-40, 65], [-22, 70], [-18, 77], [-30, 83], [-55, 82], [-70, 78], [-58, 75], [-52, 68]],
  [[-24, 64], [-14, 64], [-14, 66], [-22, 66.5]],
  // South America
  [[-79, 9], [-75, 11], [-63, 11], [-52, 5], [-50, 0], [-35, -5], [-39, -15], [-41, -22], [-48, -26], [-53, -34], [-58, -38], [-62, -40], [-65, -47], [-68, -53], [-72, -52], [-74, -45], [-73, -37], [-71, -30], [-70, -18], [-76, -14], [-81, -5], [-80, 0], [-78, 4], [-77, 7]],
  // Europe and Asia
  [[-10, 36], [-9, 43], [-2, 43.5], [-4, 48], [2, 51], [5, 53], [8, 54], [8, 57], [10, 59], [5, 62], [12, 67], [20, 70], [28, 71], [40, 67], [44, 68], [60, 68], [70, 73], [80, 73], [100, 77], [115, 73], [130, 72], [140, 72], [160, 70], [170, 70], [180, 66], [170, 60], [160, 58], [156, 51], [142, 53], [140, 48], [133, 43], [129, 35], [127, 39], [125, 40], [122, 40], [118, 38], [122, 37], [120, 31], [122, 28], [117, 23], [110, 21], [108, 16], [109, 12], [105, 9], [103, 10], [100, 13], [100, 8], [103, 1.5], [100, 4], [98, 9], [98, 16], [94, 18], [92, 22], [88, 22], [86, 20], [80, 15], [80, 10], [77, 8], [73, 16], [72, 21], [67, 24], [62, 25], [57, 26], [56, 24], [59, 22], [55, 17], [52, 16], [45, 13], [43, 13], [39, 21], [35, 28], [34, 31], [35, 33], [36, 36], [30, 36], [27, 37], [26, 40], [29, 41], [40, 41], [41, 42], [37, 45], [30, 46], [29, 45], [24, 38], [21, 37], [19, 40], [13, 45], [12, 44], [16, 41], [18, 40], [16, 38], [15, 40], [11, 42], [9, 44], [3, 43], [3, 42], [0, 39], [-2, 37], [-6, 36]],
  // Africa, Madagascar
  [[-17, 21], [-16, 14], [-17, 13], [-12, 8], [-8, 4.5], [-2, 5], [5, 6], [9, 4], [10, 2], [9, -1], [12, -6], [13, -12], [12, -18], [15, -27], [18, -34], [22, -34], [27, -33], [32, -28], [35, -24], [40, -16], [40, -10], [39, -5], [42, 0], [48, 5], [51, 11], [44, 11], [43, 13], [39, 18], [35, 24], [34, 28], [32, 31], [25, 32], [20, 31], [15, 32], [10, 34], [10, 37], [3, 37], [-2, 35], [-6, 36], [-10, 30], [-13, 27]],
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  // Britain, Ireland
  [[-5, 50], [1.5, 51], [1.7, 53], [-0.5, 54], [-2, 56], [-2, 58], [-5, 58.6], [-6, 56], [-5, 55], [-3, 54], [-4.5, 53], [-4, 51.5]],
  [[-10, 51.5], [-6, 52], [-6, 54], [-8, 55], [-10, 54]],
  // Japan, the Philippines, Indonesia, New Guinea
  [[130, 31], [132, 34], [135, 34], [140, 35], [141, 39], [142, 42], [145, 44], [141, 45], [139, 40], [136, 37], [133, 35]],
  [[120, 18], [122, 18], [126, 7], [122, 7]],
  [[95, 5.5], [98, 4], [104, -2], [106, -6], [102, -4], [96, 2]],
  [[105, -6], [114, -7], [114, -8.5], [105, -7]],
  [[109, 1], [110, -3], [116, -4], [119, 1], [117, 7], [113, 3]],
  [[131, -1], [141, -3], [150, -10], [141, -9], [137, -5]],
  // Australia, New Zealand
  [[114, -22], [114, -34], [118, -35], [123, -34], [129, -32], [135, -35], [138, -35], [141, -38], [147, -39], [150, -37], [153, -31], [153, -25], [146, -19], [145, -15], [142, -11], [141, -17], [136, -12], [131, -11], [126, -14], [122, -18]],
  [[172, -34], [175, -37], [178, -38], [174, -42], [171, -46], [167, -46], [170, -43], [173, -40]],
]

// Longitudes past 180 or below -180 keep a route across the Pacific in one piece
const CABLES: { name: string; route: LonLat[]; color: string }[] = [
  { name: 'New York to Britain', route: [[-73.9, 40.5], [-60, 41.5], [-40, 48], [-20, 51], [-4.6, 50.8]], color: '#7fe0ff' },
  { name: 'New York to France', route: [[-73.9, 40.5], [-50, 42], [-20, 46], [-4.5, 47.8]], color: '#5fb3ff' },
  { name: 'Virginia to Spain', route: [[-76, 36.8], [-50, 40], [-20, 43], [-2.9, 43.4]], color: '#5fb3ff' },
  { name: 'Brazil to Portugal', route: [[-38.5, -3.7], [-30, 10], [-20, 25], [-8.9, 37.9]], color: '#7fe0a0' },
  { name: 'Florida to Brazil', route: [[-80.1, 26.1], [-70, 20], [-55, 8], [-38.5, -3.7]], color: '#7fe0a0' },
  { name: 'Panama to Chile', route: [[-80.1, 26.1], [-80, 15], [-79.5, 9], [-80, -5], [-78, -20], [-71.6, -33]], color: '#7fe0a0' },
  { name: 'California to Japan', route: [[-118.4, 33.9], [-150, 32], [-180, 33], [-210, 34], [-220.2, 35]], color: '#ffcf8a' },
  { name: 'Oregon to Japan', route: [[-123.9, 45.5], [-160, 45], [-200, 40], [-220, 35.5]], color: '#ffcf8a' },
  { name: 'California to Australia', route: [[-118.4, 33.9], [-157.8, 21.3], [-178, -18], [-208.8, -33.9]], color: '#ffcf8a' },
  { name: 'Asia to Europe', route: [[103.8, 1.3], [95, 6], [80, 6], [73, 10], [60, 15], [50, 12.5], [43.4, 12.6], [38, 20], [33, 28], [32.5, 30], [30, 32], [20, 34], [10, 37], [5.4, 43.3]], color: '#ff9ac8' },
  { name: 'Around West Africa', route: [[-9, 38.7], [-17, 28], [-17, 15], [-5, 4], [3.4, 6.4], [9, -1], [12, -6], [13, -20], [18.4, -33.9]], color: '#b48cff' },
  { name: 'Around East Africa', route: [[18.4, -33.9], [32, -30], [40, -15], [42, -5], [39.7, -4], [50, 12], [43.4, 12.6]], color: '#b48cff' },
  { name: 'Singapore to Japan', route: [[103.8, 1.3], [110, 10], [114.2, 22.3], [122, 25], [135, 30], [139.8, 35]], color: '#ff9ac8' },
  { name: 'Singapore to Australia', route: [[103.8, 1.3], [105, -8], [110, -20], [115.8, -32]], color: '#ff9ac8' },
  { name: 'India to Singapore', route: [[72.8, 19], [73, 10], [80, 6], [95, 6], [103.8, 1.3]], color: '#ff9ac8' },
]
const CITIES: LonLat[] = [[-73.9, 40.7], [-0.1, 51.5], [2.3, 48.9], [139.8, 35.7], [-118.2, 34], [103.8, 1.3], [151.2, -33.9], [-46.6, -23.5], [3.4, 6.5], [72.8, 19], [18.4, -33.9], [114.2, 22.3], [-43.2, -22.9], [-87.6, 41.9], [13.4, 52.5]]

// The same mapping as three's sphere UVs, so cables land on the coastlines painted into the texture
function at([lon, lat]: LonLat, r = 1) {
  const phi = ((lon + 180) * Math.PI) / 180, theta = ((90 - lat) * Math.PI) / 180
  return new THREE.Vector3(-Math.cos(phi) * Math.sin(theta) * r, Math.cos(theta) * r, Math.sin(phi) * Math.sin(theta) * r)
}
// A route as points along the sphere, curving between waypoints, lifted a little off the surface
function curve(route: LonLat[], r = 1.006, per = 24) {
  const pts: THREE.Vector3[] = []
  for (let i = 1; i < route.length; i++) {
    const a = at(route[i - 1]), b = at(route[i])
    for (let j = i === 1 ? 0 : 1; j <= per; j++) pts.push(a.clone().lerp(b, j / per).normalize().multiplyScalar(r))
  }
  return pts
}

function landTexture() {
  const W = 360, H = 180, c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')!
  const sea = g.createLinearGradient(0, 0, 0, H); sea.addColorStop(0, '#16305a'); sea.addColorStop(0.5, '#1d4a7a'); sea.addColorStop(1, '#16305a')
  g.fillStyle = sea; g.fillRect(0, 0, W, H)
  const xy = ([lon, lat]: LonLat): [number, number] => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H]
  for (const poly of LAND) {
    g.fillStyle = '#3f7a4a'; g.beginPath(); poly.forEach((p, i) => { const [x, y] = xy(p); if (i) g.lineTo(x, y); else g.moveTo(x, y) }); g.closePath(); g.fill()
    g.strokeStyle = '#c9b88a'; g.lineWidth = 0.8; g.stroke()
  }
  g.fillStyle = '#e8eef4'; g.fillRect(0, 0, W, 6); g.fillRect(0, H - 16, W, 16)
  // a little texture on land and sea
  for (let i = 0; i < 2400; i++) { const x = (i * 97) % W, y = (i * 61) % H; g.fillStyle = i % 3 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)'; g.fillRect(x, y, 1, 1) }
  const t = new THREE.CanvasTexture(c)
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace
  return t
}

export type GlobeStop = { at: number; title: string; text: string; parts?: string[] }
export const GLOBE_STOPS: GlobeStop[] = [
  { at: 0, parts: ['undersea-cable'], title: 'Under the sea', text: 'Off the beach the cable lies on the seafloor, sometimes 8 km down. Out in the deep it is about as thick as a garden hose; near shore it is armored with steel wire and buried against anchors and fishing nets.' },
  { at: 0.17, parts: ['repeater'], title: 'Repeaters', text: 'Light fades in glass, so every 60 to 100 km a repeater on the cable boosts it again, powered by thousands of volts sent from the landing stations.' },
  { at: 0.31, parts: ['cable-ship'], title: 'Laying a cable', text: 'A cable ship pays it out over the stern at walking pace, following a route surveyed around undersea cliffs and volcanoes. Near shore a plow buries it in the seabed.' },
  { at: 0.47, title: 'Across the Atlantic', text: 'Your request crosses about 6,000 km of ocean in roughly 30 thousandths of a second, as pulses of light in a fiber thinner than a hair.' },
  { at: 0.7, title: 'The whole world', text: 'About 600 cables, some 1.4 million km of them, tie the continents together. They carry about 99% of the data between continents; satellites carry the rest. When one breaks, which happens a few times a week somewhere in the world, traffic simply takes another.' },
  { at: 1, title: 'And back again', text: 'The video you asked for streams back the same way, from a data center over the sea, through the landing station, the exchange and your street, to your screen. All in a blink.' },
]

// Where the camera is for a given progress through the globe: [longitude, latitude, distance]
function cameraAt(p: number, pulse: THREE.Vector3): { dir: THREE.Vector3; dist: number } {
  const home = at([-71, 39.5]).normalize(), atlantic = at([-35, 47]).normalize()
  if (p < 0.4) return { dir: home.clone().lerp(atlantic, Math.max(0, (p - 0.15) / 0.25) * 0.3).normalize(), dist: 1.25 + p * 1.2 }
  if (p < 0.62) return { dir: pulse.clone().normalize().lerp(atlantic, 0.25).normalize(), dist: 1.75 + (p - 0.4) * 1.5 }
  if (p < 0.88) return { dir: atlantic, dist: 2.1 + (p - 0.62) * 4 }
  return { dir: atlantic.clone().lerp(home, (p - 0.88) / 0.12).normalize(), dist: 3.1 - (p - 0.88) * 3 }
}

export function Globe({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const host = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const progress = useRef({ target: 0, now: 0, under: 0 })
  const [stop, setStop] = useState(0)
  const [pick, setPick] = useState<string | null>(null)
  const reduced = useReducedMotion()

  // Scroll, swipe and keys fly the camera; scrolling back past the start returns to the coast. While a part is open,
  // Escape closes it.
  useEffect(() => {
    if (pick) {
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPick(null) }
      addEventListener('keydown', onKey)
      return () => removeEventListener('keydown', onKey)
    }
    const nudge = (d: number) => {
      const p = progress.current
      if (p.target <= 0 && d < 0) { p.under += d; if (p.under < -0.08) onBack(); return }
      p.under = 0
      p.target = Math.max(0, Math.min(1, p.target + d))
    }
    const jump = (dir: number) => {
      const p = progress.current, ats = GLOBE_STOPS.map((s) => s.at)
      const next = dir > 0 ? ats.find((a) => a > p.target + 0.001) : [...ats].reverse().find((a) => a < p.target - 0.001)
      if (next !== undefined) p.target = next
      else if (dir < 0) onBack()
    }
    const onWheel = (e: WheelEvent) => { e.preventDefault(); nudge((e.deltaY + e.deltaX) / 3000) }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (['ArrowDown', 'ArrowRight', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); jump(1) }
      else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); jump(-1) }
    }
    let touch: number | null = null
    const ts = (e: TouchEvent) => { touch = e.touches[0].clientY }
    const tm = (e: TouchEvent) => { if (touch === null) return; const v = e.touches[0].clientY; nudge((touch - v) / 1400); touch = v; e.preventDefault() }
    addEventListener('wheel', onWheel, { passive: false })
    addEventListener('keydown', onKey)
    addEventListener('touchstart', ts, { passive: true })
    addEventListener('touchmove', tm, { passive: false })
    return () => { removeEventListener('wheel', onWheel); removeEventListener('keydown', onKey); removeEventListener('touchstart', ts); removeEventListener('touchmove', tm) }
  }, [onBack, onClose, pick])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setPixelRatio(1)
    renderer.setClearColor(0x05040a)
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 50)
    scene.add(new THREE.AmbientLight(0x8890b0, 0.9))
    const sun = new THREE.DirectionalLight(0xfff2e0, 1.6)
    scene.add(sun)

    const tex = landTexture()
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshLambertMaterial({ map: tex, flatShading: true }))
    scene.add(globe)
    const air = new THREE.Mesh(new THREE.SphereGeometry(1.07, 48, 32), new THREE.MeshBasicMaterial({ color: 0x5fa8ff, transparent: true, opacity: 0.12, side: THREE.BackSide, blending: THREE.AdditiveBlending }))
    scene.add(air)

    // stars
    const starPts: number[] = []
    for (let i = 0; i < 900; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(20 + Math.random() * 10); starPts.push(v.x, v.y, v.z) }
    const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPts, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xfff6dd, size: 0.06 })))

    // city lights
    const cityGeo = new THREE.BufferGeometry().setFromPoints(CITIES.map((c) => at(c, 1.004)))
    scene.add(new THREE.Points(cityGeo, new THREE.PointsMaterial({ color: 0xffd890, size: 0.025 })))

    // cables, and pulses of light along them
    const routes = CABLES.map((c) => ({ ...c, pts: curve(c.route) }))
    for (const r of routes) scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(r.pts), new THREE.LineBasicMaterial({ color: r.color, transparent: true, opacity: 0.75 })))
    const PER = 5
    const pulseGeo = new THREE.BufferGeometry()
    pulseGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(routes.length * PER * 3), 3))
    const pulses = new THREE.Points(pulseGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.018 }))
    scene.add(pulses)
    // your request: one bright pulse on the New York to Britain cable
    const mine = routes[0].pts
    const meGeo = new THREE.BufferGeometry(); meGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3))
    const me = new THREE.Points(meGeo, new THREE.PointsMaterial({ color: 0xfff6c0, size: 0.05 }))
    scene.add(me)
    // repeaters along that cable
    const repGeo = new THREE.BufferGeometry().setFromPoints(mine.filter((_, i) => i % 6 === 3).map((v) => v.clone().multiplyScalar(1.002)))
    scene.add(new THREE.Points(repGeo, new THREE.PointsMaterial({ color: 0xffcf8a, size: 0.012 })))

    const pointAlong = (pts: THREE.Vector3[], u: number) => { const f = Math.max(0, Math.min(1, u)) * (pts.length - 1), i = Math.floor(f); return pts[i].clone().lerp(pts[Math.min(pts.length - 1, i + 1)], f - i) }

    const size = () => {
      renderer.setSize(Math.max(1, Math.round(innerWidth / PIX)), Math.max(1, Math.round(innerHeight / PIX)), false)
      camera.aspect = innerWidth / innerHeight
      camera.updateProjectionMatrix()
    }
    size()
    addEventListener('resize', size)

    let raf = 0
    const tick = (now: number) => {
      const t = now / 1000, p = progress.current
      p.now += (p.target - p.now) * (reduced ? 1 : 0.06)
      // the bright pulse rides across between the second and third stops, and stays on the far shore after
      const ride = Math.max(0, Math.min(1, (p.now - 0.2) / 0.38))
      const pulse = pointAlong(mine, ride)
      me.geometry.attributes.position.setXYZ(0, pulse.x * 1.004, pulse.y * 1.004, pulse.z * 1.004)
      me.geometry.attributes.position.needsUpdate = true
      const arr = pulseGeo.attributes.position as THREE.BufferAttribute
      routes.forEach((r, ci) => { for (let k = 0; k < PER; k++) { const v = pointAlong(r.pts, (((reduced ? 0.3 : t) * 0.06 + k / PER + ci * 0.13) % 1)); arr.setXYZ(ci * PER + k, v.x, v.y, v.z) } })
      arr.needsUpdate = true
      // once the whole world is in view, scrolling turns it all the way round, so it comes back to the Atlantic
      const turn = Math.max(0, Math.min(1, (p.now - 0.62) / 0.26))
      scene.rotation.y = (turn * turn * (3 - 2 * turn)) * Math.PI * 2
      const { dir, dist } = cameraAt(p.now, pulse)
      camera.position.copy(dir.clone().multiplyScalar(dist))
      camera.lookAt(dir.clone().multiplyScalar(dist > 1.6 ? 0 : 0.6))
      sun.position.copy(camera.position.clone().add(new THREE.Vector3(2, 3, 1)))
      renderer.render(scene, camera)
      if (bar.current) bar.current.style.transform = `scaleX(${p.now})`
      let s = 0; GLOBE_STOPS.forEach((st, i) => { if (p.now >= st.at - 0.03) s = i })
      setStop((was) => (was === s ? was : s))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', size)
      scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); const mat = m.material as THREE.Material | undefined; mat?.dispose() })
      tex.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [reduced])

  const st = GLOBE_STOPS[stop]
  return (
    <div className="ug-journey ug-globe" role="dialog" aria-modal="true" aria-label="Follow the internet around the world">
      <div className="ug-globe__view" ref={host} aria-hidden />
      <div className="ug-journey__bar"><div ref={bar} /></div>
      <header className="ug-journey__title"><p>Follow the internet</p></header>
      <section className="ug-journey__caption" key={stop}>
        <p className="ug-imm__depth">Around the world · {stop + 1} of {GLOBE_STOPS.length}</p>
        <h2>{st.title}</h2>
        <p>{st.text}</p>
        <LookInside ids={st.parts} onPick={setPick} />
      </section>
      <p className="ug-imm__hint" data-on>Scroll to follow the light</p>
      {pick && <Detail id={pick} onClose={() => setPick(null)} />}
      <button type="button" className="ug-imm__close" onClick={onClose} aria-label="Back to the layer" autoFocus>✕</button>
    </div>
  )
}
