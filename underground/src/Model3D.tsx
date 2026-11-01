import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from './kit/reduced-motion'
import type { Model } from './components'

// A component, built in 3D and pulled apart into its parts. It arrives whole, then explodes: a pipe or cable is
// stripped back layer by layer like a wire, a stack lifts apart slab by slab. Drag to turn it. It is drawn at a third
// of the size and scaled up without smoothing, so it stays pixelated like the rest of the page. Hovering a part in
// the list lights it up.

const PIX = 3
const LEN = 4.4

type Built = { group: THREE.Group; parts: { meshes: THREE.Mesh[]; place: (t: number) => void }[] }

const mat = (color: string) => new THREE.MeshLambertMaterial({ color, flatShading: true })

// A hollow tube along X from r0 to r1, length 1 (scaled to its length later), centered on the origin
function tube(r0: number, r1: number, color: string) {
  const pts = r0 > 0 ? [new THREE.Vector2(r0, -0.5), new THREE.Vector2(r1, -0.5), new THREE.Vector2(r1, 0.5), new THREE.Vector2(r0, 0.5), new THREE.Vector2(r0, -0.5)]
    : [new THREE.Vector2(0, -0.5), new THREE.Vector2(r1, -0.5), new THREE.Vector2(r1, 0.5), new THREE.Vector2(0, 0.5)]
  const g = new THREE.LatheGeometry(pts, 18)
  g.rotateZ(-Math.PI / 2)
  return new THREE.Mesh(g, mat(color))
}

function build(model: Model): Built {
  const group = new THREE.Group()
  const parts: Built['parts'] = []
  if (model.kind === 'tube') {
    // Assembled: every layer the full length. Exploded: each layer outward is shorter, so the inner ones show, and
    // they slide apart a little along the pipe.
    model.parts.forEach((p, i) => {
      const inner = i ? model.parts[i - 1].r : 0
      const m = tube(inner, p.r, p.color)
      group.add(m)
      const short = LEN - i * 0.6
      parts.push({ meshes: [m], place: (t) => { const len = LEN + (short - LEN) * t; m.scale.x = len; m.position.x = LEN / 2 - len / 2 + i * 0.28 * t } })
    })
    const outer = model.parts[model.parts.length - 1].r
    model.extras?.forEach((e, j) => {
      const m = e.shape === 'wire'
        ? new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, LEN, 6).rotateZ(Math.PI / 2), mat(e.color))
        : new THREE.Mesh(new THREE.BoxGeometry(LEN, 0.03, 0.7), mat(e.color))
      group.add(m)
      parts.push({ meshes: [m], place: (t) => { m.position.set(0, e.y + t * (0.5 + j * 0.4), e.shape === 'wire' ? outer * 0.4 : 0) } })
    })
  } else {
    // Bottom up: each part sits on the one below (or at its own height), and the stack lifts apart
    let y = 0
    model.parts.forEach((p, i) => {
      let meshes: THREE.Mesh[] = []
      if (p.shape === 'box') meshes.push(new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, p.d), mat(p.color)))
      else if (p.shape === 'disc') meshes.push(new THREE.Mesh(new THREE.CylinderGeometry(p.w / 2, p.w / 2, p.h, 20), mat(p.color)))
      else if (p.shape === 'ring') {
        const r0 = (p.hole ?? 0) / 2, r1 = p.w / 2
        meshes.push(new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(r0, -p.h / 2), new THREE.Vector2(r1, -p.h / 2), new THREE.Vector2(r1, p.h / 2), new THREE.Vector2(r0, p.h / 2), new THREE.Vector2(r0, -p.h / 2)], 20), mat(p.color)))
      } else if (p.shape === 'rails') {
        for (const z of [-p.d / 2, p.d / 2]) { const m = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, 0.14), mat(p.color)); m.position.z = z; meshes.push(m) }
      } else {
        for (let k = 0; k < 7; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.32, p.h, p.d), mat(p.color)); m.position.x = -p.w / 2 + 0.3 + k * ((p.w - 0.6) / 6); meshes.push(m) }
      }
      // copies upward (sheds, blade rows) and sideways (a row of bushings)
      const copies = (src: THREE.Mesh[], n: number, step: THREE.Vector3) => src.flatMap((m) => Array.from({ length: n }, (_, k) => { const c = k ? m.clone() : m; c.position.add(step.clone().multiplyScalar(k)); return c }))
      if (p.repeat) meshes = copies(meshes, p.repeat, new THREE.Vector3(0, p.pitch ?? p.h * 1.5, 0))
      if (p.cols) { meshes = copies(meshes, p.cols, new THREE.Vector3(p.gap ?? p.w * 1.6, 0, 0)); meshes.forEach((m) => { m.position.x -= ((p.cols! - 1) * (p.gap ?? p.w * 1.6)) / 2 }) }
      const holder = new THREE.Group()
      meshes.forEach((m) => holder.add(m))
      group.add(holder)
      const tall = p.repeat ? (p.repeat - 1) * (p.pitch ?? p.h * 1.5) + p.h : p.h
      const rest = (p.y ?? y) + p.h / 2
      holder.position.set(p.x ?? 0, rest, p.z ?? 0)
      if (p.y === undefined) y += tall
      else y = Math.max(y, p.y + tall)
      parts.push({ meshes, place: (t) => { holder.position.y = rest + i * 0.5 * t } })
    })
    if (model.axis === 'x') { group.rotation.z = -Math.PI / 2; group.position.x = -y / 2 - 0.6 }
    else group.position.y = -y / 2 - 0.6
  }
  return { group, parts }
}

export function Model3D({ model }: { model: Model }) {
  const host = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const hoverRef = useRef<number | null>(null)
  hoverRef.current = hover
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = host.current
    if (!el) return
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    renderer.setPixelRatio(1)
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(4.6, 3, 5.4)
    camera.lookAt(0, 0, 0)
    scene.add(new THREE.HemisphereLight(0xfff2e0, 0x2a2030, 1.3))
    const sun = new THREE.DirectionalLight(0xffffff, 1.8)
    sun.position.set(4, 7, 5)
    scene.add(sun)
    const { group, parts } = build(model)
    const spin = new THREE.Group()
    spin.add(group)
    scene.add(spin)

    const size = () => {
      const w = el.clientWidth, h = el.clientHeight
      renderer.setSize(Math.max(1, Math.round(w / PIX)), Math.max(1, Math.round(h / PIX)), false)
      camera.aspect = w / Math.max(1, h)
      camera.updateProjectionMatrix()
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(el)

    let drag: { x: number; y: number; ry: number; rx: number } | null = null
    const down = (e: PointerEvent) => { drag = { x: e.clientX, y: e.clientY, ry: spin.rotation.y, rx: spin.rotation.x }; el.setPointerCapture(e.pointerId) }
    const move = (e: PointerEvent) => { if (!drag) return; spin.rotation.y = drag.ry + (e.clientX - drag.x) * 0.01; spin.rotation.x = Math.max(-0.6, Math.min(0.6, drag.rx + (e.clientY - drag.y) * 0.01)) }
    const up = () => { drag = null }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)

    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const u = reduced ? 1 : Math.min(1, Math.max(0, (now - t0 - 500) / 1400))
      const t = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2
      parts.forEach((p, i) => {
        p.place(t)
        p.meshes.forEach((m) => (m.material as THREE.MeshLambertMaterial).emissive.setHex(hoverRef.current === i ? 0x5a3a10 : 0x000000))
      })
      if (!drag && !reduced) spin.rotation.y += 0.004
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up)
      scene.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose() } })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [model, reduced])

  const names = model.kind === 'tube' ? [...model.parts.map((p) => [p.name, p.color]), ...(model.extras ?? []).map((e) => [e.name, e.color])] : model.parts.map((p) => [p.name, p.color])
  return (
    <figure className="ug-3d">
      <div className="ug-3d__view" ref={host} aria-label="A 3D model you can turn by dragging" role="img" />
      <ol className="ug-3d__parts">
        {names.map(([name, color], i) => (
          <li key={i} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} data-on={hover === i || undefined}>
            <span style={{ background: color }} />{name}
          </li>
        ))}
      </ol>
      <figcaption>Drag to turn it</figcaption>
    </figure>
  )
}
