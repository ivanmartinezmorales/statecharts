import { useEffect, useMemo, useRef, useState } from 'react'
import { frameAt } from './camera'
import { createCompositor } from './compositor'
import { loadEngine } from './engine'
import { CHAPTERS, COVER, STOPS, type Stop } from './tour'

// The page: one fixed canvas the engine draws on, and a column of cards that scrolls over it. Where you are in the
// scroll picks the frame; a card's "Go deeper" opens the full explanation beside the picture.

const VIEWS = [COVER, ...STOPS]

/** Framebuffer pixels per screen pixel: chunky enough to read as pixel art, fine enough for the detail. */
function pixelScale() {
  return innerWidth < 700 ? 3 : innerHeight > 1100 ? 4 : 3
}

export function App() {
  const gpu = useRef<HTMLCanvasElement>(null)
  const pic = useRef<HTMLCanvasElement>(null)
  const glow = useRef<HTMLCanvasElement>(null)
  const bloom = useRef<HTMLCanvasElement>(null)
  const [at, setAt] = useState(0)
  const [deep, setDeep] = useState<Stop | null>(null)
  const [mode, setMode] = useState('')

  useEffect(() => {
    let raf = 0, last = 0, alive = true
    let unlisten = () => {}
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    ;(async () => {
      const engine = await loadEngine()
      const size = () => engine.resize(Math.ceil(innerWidth / pixelScale()), Math.ceil(innerHeight / pixelScale()))
      size()
      const comp = await createCompositor(gpu.current!, [pic.current!, glow.current!, bloom.current!], engine)
      if (!alive) return
      setMode(comp.kind === 'webgpu' ? (comp.hdr ? 'HDR' : 'WebGPU') : 'Canvas')
      const onResize = () => { size(); comp.resize() }
      addEventListener('resize', onResize)
      unlisten = () => removeEventListener('resize', onResize)
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick)
        // a hidden or zero-height window has nothing to draw
        if (now - last < 32 || !innerHeight) return
        last = now
        const p = scrollY / innerHeight
        const { w, h } = engine.size()
        engine.draw(frameAt(VIEWS, p, w, h, still), still ? 2 : now / 1000)
        comp.present()
        setAt((was) => { const i = Math.round(p - 0.2); return was === i ? was : i })
      }
      raf = requestAnimationFrame(tick)
    })()
    return () => { alive = false; cancelAnimationFrame(raf); unlisten() }
  }, [])

  useEffect(() => {
    if (!deep) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDeep(null)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [deep])

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
                <button type="button" data-on={at > 0 && current.chapter === c ? '' : undefined} onClick={() => goTo(first)}>{c.title}</button>
              </li>
            )
          })}
        </ol>
        <div className="rail__bar"><div style={{ transform: `scaleX(${Math.max(0, at) / STOPS.length})` }} /></div>
      </nav>

      <main>
        <section className="stop stop--cover">
          <header className="cover">
            <p className="kicker">How things work</p>
            <h1>The 787 Dreamliner</h1>
            <p className="lede">A scrolling tour of a long-range jet, from the flight deck to the fuel tanks: how it flies, how its engines burn, how every system moves power around the airplane. Scroll down to board.</p>
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
              <button type="button" className="card__deeper" onClick={() => setDeep(s)}>Go deeper</button>
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
        <aside className="deep" aria-label={deep.entry.title}>
          <button type="button" className="deep__close" onClick={() => setDeep(null)} aria-label="Close" autoFocus>✕</button>
          <p className="kicker">{deep.chapter.title}</p>
          <h2>{deep.entry.title}</h2>
          {deep.entry.body.map((para) => <p key={para}>{para}</p>)}
          {deep.entry.steps && (
            <section>
              <h4>Step by step</h4>
              <ol className="deep__steps">{deep.entry.steps.map((st) => <li key={st}>{st}</li>)}</ol>
            </section>
          )}
          <section>
            <h4>By the numbers</h4>
            <dl className="deep__facts">
              {deep.entry.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          </section>
        </aside>
      )}
    </>
  )
}
