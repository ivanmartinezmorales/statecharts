import { useEffect, useMemo, useRef, useState } from 'react'
import { between, frameAt, isoYaw } from './camera'
import { createCompositor } from './compositor'
import { loadEngine, type V3 } from './engine'
import { CHAPTERS, COVER, deepTour, STOPS, type DeepStep, type Stop, type View } from './tour'

// The page: one fixed canvas where the engine draws a row of dioramas, and a column of cards that scrolls over it.
// Where you are in the scroll picks the camera. "Go deeper" opens a full-screen visit of that diorama: step through
// the explanation while the camera moves around the part, drag to turn it a quarter at a time, scroll to come closer.

const VIEWS: View[] = [COVER, ...STOPS]
const STEP_MS = 1100

/** Framebuffer pixels per CSS pixel: small enough for detail, big enough to read as pixel art. Raised if the
 *  device cannot keep up. */
let scale = 1.5

type Deep = { stop: Stop; steps: DeepStep[]; i: number }
type Move = { from: View; to: View; t0: number }

export function App() {
  const gpu = useRef<HTMLCanvasElement>(null)
  const pic = useRef<HTMLCanvasElement>(null)
  const glow = useRef<HTMLCanvasElement>(null)
  const bloom = useRef<HTMLCanvasElement>(null)
  const [at, setAt] = useState(0)
  const [mode, setMode] = useState('')
  const [deep, setDeep] = useState<Deep | null>(null)
  // the render loop reads these without re-rendering
  const deepRef = useRef<Deep | null>(null)
  const move = useRef<Move | null>(null)
  // the turn eases toward `goal`, which settles on a quarter turn when you let go
  const orbit = useRef({ yaw: 0, goal: 0, zoom: 1 })

  useEffect(() => {
    let raf = 0, last = 0, alive = true, slow = 0
    let unlisten = () => {}
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    ;(async () => {
      const engine = await loadEngine()
      const size = () => engine.resize(Math.ceil(innerWidth / scale), Math.ceil(innerHeight / scale))
      size()
      const comp = await createCompositor(gpu.current!, [pic.current!, glow.current!, bloom.current!], engine)
      if (!alive) return
      setMode(comp.kind === 'webgpu' ? (comp.hdr ? 'HDR' : 'WebGPU') : 'Canvas')
      const onResize = () => { size(); comp.resize() }
      addEventListener('resize', onResize)
      unlisten = () => removeEventListener('resize', onResize)
      const origins: V3[] = engine.origins
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick)
        // a hidden or zero-height window has nothing to draw
        if (now - last < 32 || !innerHeight) return
        last = now
        const { w, h } = engine.size()
        const d = deepRef.current
        let f
        if (d) {
          const m = move.current
          const u = m ? Math.min(1, (now - m.t0) / STEP_MS) : 1
          const e = u * u * (3 - 2 * u)
          const here = d.steps[d.i].view
          f = between(m ? m.from : here, m ? m.to : here, m ? e : 0, origins, w, h, still)
          const o = orbit.current
          o.yaw += (o.goal - o.yaw) * (still ? 1 : 0.25)
          f.yaw += o.yaw
          f.dist *= o.zoom
        } else {
          f = frameAt(VIEWS, scrollY / innerHeight, origins, w, h, still)
        }
        const t0 = performance.now()
        engine.draw(f, still ? 2 : now / 1000)
        comp.present()
        // if frames take too long, draw fewer, bigger pixels
        slow = performance.now() - t0 > 26 ? slow + 1 : Math.max(0, slow - 1)
        if (slow > 20 && scale < 3) { scale += 0.75; slow = 0; onResize() }
        if (!d) setAt((was) => { const i = Math.round(scrollY / innerHeight - 0.2); return was === i ? was : i })
      }
      raf = requestAnimationFrame(tick)
    })()
    return () => { alive = false; cancelAnimationFrame(raf); unlisten() }
  }, [])

  const go = (d: Deep, from: View) => {
    move.current = { from, to: d.steps[d.i].view, t0: performance.now() }
    deepRef.current = d
    setDeep(d)
  }
  const open = (s: Stop) => {
    orbit.current = { yaw: 0, goal: 0, zoom: 1 }
    document.documentElement.classList.add('is-deep')
    go({ stop: s, steps: deepTour(s), i: 0 }, s)
  }
  const step = (by: number) => {
    const d = deepRef.current
    if (!d) return
    const i = Math.max(0, Math.min(d.steps.length - 1, d.i + by))
    if (i !== d.i) go({ ...d, i }, d.steps[d.i].view)
  }
  const close = () => {
    deepRef.current = null
    move.current = null
    document.documentElement.classList.remove('is-deep')
    setDeep(null)
  }

  // in a deep visit: arrows step, Escape leaves, dragging turns the diorama, the wheel comes closer
  const open_ = deep !== null
  useEffect(() => {
    if (!open_) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') step(1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') step(-1)
    }
    let drag: { x: number; goal: number } | null = null
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.deep, .rail')) return
      drag = { x: e.clientX, goal: orbit.current.goal }
    }
    const moveP = (e: PointerEvent) => {
      if (!drag) return
      orbit.current.goal = drag.goal - (e.clientX - drag.x) * 0.008
    }
    // let go and it settles on the nearest isometric diagonal
    const up = () => {
      if (!drag) return
      drag = null
      const o = orbit.current
      o.goal = isoYaw(o.goal + Math.PI / 4) - Math.PI / 4
    }
    const wheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('.deep')) return
      e.preventDefault()
      orbit.current.zoom = Math.max(0.35, Math.min(2.5, orbit.current.zoom * Math.exp(e.deltaY * 0.0015)))
    }
    addEventListener('keydown', onKey)
    addEventListener('pointerdown', down)
    addEventListener('pointermove', moveP)
    addEventListener('pointerup', up)
    addEventListener('pointercancel', up)
    addEventListener('wheel', wheel, { passive: false })
    return () => {
      removeEventListener('keydown', onKey)
      removeEventListener('pointerdown', down)
      removeEventListener('pointermove', moveP)
      removeEventListener('pointerup', up)
      removeEventListener('pointercancel', up)
      removeEventListener('wheel', wheel)
    }
  }, [open_])

  const firsts = useMemo(() => new Set(CHAPTERS.map((c) => STOPS.findIndex((s) => s.chapter === c))), [])
  const current = STOPS[Math.max(0, Math.min(STOPS.length - 1, at - 1))]
  const goTo = (i: number) => scrollTo({ top: (i + 1) * innerHeight, behavior: 'smooth' })

  return (
    <>
      <div className="stage" aria-hidden>
        <canvas ref={gpu} className="stage__gpu" />
        <canvas ref={pic} className="stage__pic" />
        <canvas ref={glow} className="stage__glow" />
        <canvas ref={bloom} className="stage__bloom" />
      </div>

      <nav className="rail" aria-label="Chapters">
        <ol>
          {CHAPTERS.map((c) => {
            const first = STOPS.findIndex((s) => s.chapter === c)
            return (
              <li key={c.id}>
                <button type="button" data-on={at > 0 && current.chapter === c ? '' : undefined} onClick={() => { close(); goTo(first) }}>{c.title}</button>
              </li>
            )
          })}
        </ol>
        <div className="rail__bar"><div style={{ transform: `scaleX(${Math.max(0, at) / STOPS.length})` }} /></div>
      </nav>

      <main {...(deep ? { inert: '' } : {})}>
        <section className="stop stop--cover">
          <header className="cover">
            <p className="kicker">How things work</p>
            <h1>The 787 Dreamliner</h1>
            <p className="lede">A tour of a long-range jet as a row of pixel dioramas, from the flight deck to the fuel tanks: how it flies, how its engines burn, how every system moves power around the airplane. Scroll down to board; open any stop to walk around it.</p>
            <p className="cover__meta">{STOPS.length} stops in {CHAPTERS.length} chapters{mode && ` · rendered in WASM, ${mode}`}</p>
          </header>
        </section>
        {STOPS.map((s, i) => (
          <section key={`${s.chapter.id}.${s.key}`} className="stop" id={`${s.chapter.id}-${s.key}`}>
            <article className="card" data-on={at === i + 1 ? '' : undefined}>
              {firsts.has(i) && (
                <div className="card__chapter">
                  <p className="kicker">Chapter {CHAPTERS.indexOf(s.chapter) + 1}</p>
                  <h2 className="card__chapter-title">{s.chapter.title}</h2>
                  <p className="card__intro">{s.chapter.intro}</p>
                </div>
              )}
              <p className="kicker">{s.chapter.title} · {i + 1} of {STOPS.length}</p>
              <h3>{s.entry.title}</h3>
              <p>{s.entry.summary}</p>
              <ul className="card__facts">
                {s.entry.facts.slice(0, 3).map(([k, v]) => <li key={k}><span>{k}</span>{v}</li>)}
              </ul>
              <button type="button" className="card__deeper" onClick={() => open(s)}>Go deeper</button>
            </article>
          </section>
        ))}
        <section className="stop stop--end">
          <div className="card card--end">
            <h3>Wheels down.</h3>
            <p>That is the whole airplane: the shell, the flight deck, the controls, the engines, the power, the fuel, the hydraulics, the cabin and the brains. Every flow you saw glowing is running right now, on hundreds of 787s in the sky.</p>
            <button type="button" className="card__deeper" onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}>Back to the start</button>
          </div>
        </section>
      </main>

      {deep && (
        <aside className="deep" role="dialog" aria-modal="true" aria-label={deep.stop.entry.title}>
          <header className="deep__head">
            <p className="kicker">{deep.stop.chapter.title} · Go deeper</p>
            <h2>{deep.stop.entry.title}</h2>
            <button type="button" className="deep__close" onClick={close} aria-label="Back to the tour" autoFocus>✕</button>
          </header>
          <section className="deep__step" key={deep.i}>
            <p className="deep__count">{deep.stop.entry.steps?.length ? 'Step' : 'Part'} {deep.i + 1} of {deep.steps.length}</p>
            <p className="deep__text">{deep.steps[deep.i].text}</p>
          </section>
          <nav className="deep__nav" aria-label="Steps">
            <button type="button" onClick={() => step(-1)} disabled={deep.i === 0}>← Back</button>
            <ol className="deep__dots">
              {deep.steps.map((_, i) => (
                <li key={i}><button type="button" aria-label={`Step ${i + 1}`} data-on={i === deep.i ? '' : undefined} onClick={() => step(i - deep.i)} /></li>
              ))}
            </ol>
            <button type="button" onClick={() => step(1)} disabled={deep.i === deep.steps.length - 1}>Next →</button>
          </nav>
          <details className="deep__more">
            <summary>By the numbers</summary>
            <dl className="deep__facts">
              {deep.stop.entry.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          </details>
          <p className="deep__hint">Drag to turn the diorama a quarter · scroll over it to zoom · ← → to step</p>
        </aside>
      )}
    </>
  )
}
