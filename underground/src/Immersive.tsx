import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from './kit/reduced-motion'
import { LAYERS } from './layers'
import { COMPONENTS, type Journey as JourneyKind } from './components'
import { anchors } from './living'
import { Life } from './Life'
import { Journey } from './Journey'

// three.js is big: load it the first time a component is opened, not with the page
const Model3D = lazy(() => import('./Model3D').then((m) => ({ default: m.Model3D })))

// Inside a layer. The slice that was clicked grows from where it sat until it fills the screen, and you are in it.
// Scrolling moves the camera along the layer; keep scrolling past its end and you sink into the next one (or rise,
// scrolling back). The layers above and below stay dimly in view. Labels come in as their thing reaches the middle
// of the screen, and follow the things that move. Click one to learn about it: its facts, its parts in 3D, and for
// water and wastewater, the whole journey. Close shrinks it all back into its slice.
//
// The camera is one transform on the whole picture, driven by a requestAnimationFrame loop that also places the
// labels, so labels and picture never drift apart.

type Cam = { x: number; y: number; k: number }
type Props = { index: number; from: DOMRect; sliceRect: (index: number) => DOMRect | null; onIndex: (i: number) => void; onClosed: () => void }

const MOVE = 900
const OVERSCROLL = 260
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const mix = (a: Cam, b: Cam, t: number): Cam => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, k: a.k + (b.k - a.k) * t })

// The camera inside layer i at progress p (0 is its left end, 1 its right end): the layer takes about 60% of the
// height, never less than the screen's width, a little above the middle so the caption has room below.
function frameFor(i: number, p: number, w: number, h: number): Cam {
  const [top, bottom] = LAYERS[i].slice
  const k = Math.max(w / 320, (h * 0.6) / (bottom - top))
  const slack = 320 * k - w
  return { k, x: -slack * p, y: h * 0.42 - ((top + bottom) / 2) * k }
}

// The camera that puts the picture exactly over a slice on the page
function camOver(r: DOMRect, i: number): Cam {
  const k = r.width / 320
  return { k, x: r.left, y: r.top - LAYERS[i].slice[0] * k }
}

export function Immersive({ index, from, sliceRect, onIndex, onClosed }: Props) {
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const notes = useRef<(HTMLButtonElement | null)[]>([])
  const lines = useRef<(SVGLineElement | null)[]>([])
  const dots = useRef<(HTMLSpanElement | null)[]>([])
  const shade = useRef<{ top: HTMLDivElement | null; bottom: HTMLDivElement | null }>({ top: null, bottom: null })
  const bar = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<'opening' | 'in' | 'moving' | 'closing'>('opening')
  const [pick, setPick] = useState<string | null>(null)
  const [journey, setJourney] = useState<JourneyKind | null>(null)
  const cam = useRef<Cam>(camOver(from, index))
  const tween = useRef<{ from: Cam; to: Cam; t0: number; done: () => void } | null>(null)
  // Where along the layer the camera is (eased toward the target), and how far past either end the reader has pushed
  const pan = useRef({ target: 0.5, now: 0.5, over: 0 })
  const busy = pick !== null || journey !== null
  const layer = LAYERS[index]

  const moveTo = useCallback((to: Cam, done: () => void) => {
    if (reduced) { cam.current = to; done(); return }
    tween.current = { from: { ...cam.current }, to, t0: performance.now(), done }
  }, [reduced])

  // Open: grow from the slice
  useLayoutEffect(() => {
    moveTo(frameFor(index, 0.5, innerWidth, innerHeight), () => setPhase('in'))
    requestAnimationFrame(() => root.current?.setAttribute('data-shown', ''))
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const go = useCallback((i: number, at: number) => {
    if (i < 0 || i >= LAYERS.length || phase !== 'in') return
    pan.current = { target: at, now: at, over: 0 }
    setPhase('moving'); onIndex(i)
    moveTo(frameFor(i, at, innerWidth, innerHeight), () => setPhase('in'))
  }, [phase, moveTo, onIndex])

  const close = useCallback(() => {
    if (phase === 'closing') return
    setPhase('closing')
    root.current?.removeAttribute('data-shown')
    const r = sliceRect(index)
    if (!r) { onClosed(); return }
    moveTo(camOver(r, index), onClosed)
  }, [phase, index, sliceRect, moveTo, onClosed])

  // Scroll (and swipe, and keys) move along the layer, then on to the next
  useEffect(() => {
    if (busy) {
      // With a component open, Escape closes it (a journey handles its own keys)
      if (journey) return
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPick(null) }
      addEventListener('keydown', onKey)
      return () => removeEventListener('keydown', onKey)
    }
    const push = (d: number) => {
      if (phase !== 'in') return
      const p = pan.current, slackPx = Math.max(1, 320 * frameFor(index, 0, innerWidth, innerHeight).k - innerWidth)
      const next = p.target + d / (slackPx * 1.6)
      if (next > 1) { p.target = 1; p.over = Math.max(0, p.over) + d; if (p.over > OVERSCROLL) go(index + 1, 0) }
      else if (next < 0) { p.target = 0; p.over = Math.min(0, p.over) + d; if (p.over < -OVERSCROLL) go(index - 1, 1) }
      else { p.target = next; p.over = 0 }
    }
    const onWheel = (e: WheelEvent) => { e.preventDefault(); push(e.deltaY + e.deltaX) }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); go(index + 1, 0) }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go(index - 1, 1) }
      else if (e.key === 'ArrowRight') push(160)
      else if (e.key === 'ArrowLeft') push(-160)
    }
    let last: { x: number; y: number } | null = null
    const ts = (e: TouchEvent) => { last = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
    const tm = (e: TouchEvent) => {
      if (!last) return
      const t = e.touches[0]
      push((last.x - t.clientX) + (last.y - t.clientY) * 1.4)
      last = { x: t.clientX, y: t.clientY }
      e.preventDefault()
    }
    const te = () => { last = null }
    addEventListener('wheel', onWheel, { passive: false })
    addEventListener('keydown', onKey)
    addEventListener('touchstart', ts, { passive: true })
    addEventListener('touchmove', tm, { passive: false })
    addEventListener('touchend', te)
    return () => { removeEventListener('wheel', onWheel); removeEventListener('keydown', onKey); removeEventListener('touchstart', ts); removeEventListener('touchmove', tm); removeEventListener('touchend', te) }
  }, [busy, journey, phase, index, go, close])

  // The camera loop: the tween, or the eased pan; then the picture, the shades, the labels and the progress bar
  useEffect(() => {
    let raf = 0
    const tick = (now: number) => {
      const w = innerWidth, h = innerHeight, tw = tween.current, p = pan.current
      if (tw) {
        const t = Math.min(1, (now - tw.t0) / MOVE)
        cam.current = mix(tw.from, tw.to, ease(t))
        if (t >= 1) { tween.current = null; tw.done() }
      } else if (phase === 'in') {
        p.now += (p.target - p.now) * (reduced ? 1 : 0.1)
        cam.current = frameFor(index, p.now, w, h)
      }
      const c = cam.current
      if (world.current) world.current.style.transform = `translate(${c.x}px, ${c.y}px) scale(${c.k})`
      if (bar.current) bar.current.style.transform = `scaleX(${(index + p.now) / LAYERS.length})`
      const [top, bottom] = LAYERS[index].slice
      if (shade.current.top) shade.current.top.style.height = `${top}px`
      if (shade.current.bottom) { shade.current.bottom.style.top = `${bottom}px`; shade.current.bottom.style.height = `${480 - bottom}px` }
      // Labels: a dot on the thing, a label out along the direction it was drawn in, a line between. A label shows
      // while its thing is near the middle of the screen, and follows it if it moves.
      LAYERS[index].labels.forEach((lb, i) => {
        const tracked = lb.track ? anchors[lb.track] : null
        const src = lb.track ? tracked : { x: lb.at[0], y: lb.at[1] }
        const n = notes.current[i], ln = lines.current[i], dot = dots.current[i]
        const at = src ? { x: c.x + src.x * c.k, y: c.y + src.y * c.k } : null
        const visible = phase === 'in' && !!at && at.x > w * 0.06 && at.x < w * 0.94
        for (const el of [n, ln, dot]) el?.toggleAttribute('data-on', visible)
        if (!at) return
        const dx = lb.note[0] - lb.at[0], dy = lb.note[1] - lb.at[1], len = Math.hypot(dx, dy) || 1
        const reach = Math.min(110, Math.max(56, len * c.k * 0.35))
        const tip = { x: at.x + (dx / len) * reach, y: at.y + (dy / len) * reach }
        if (n) n.style.transform = `translate(${tip.x}px, ${tip.y}px) translate(${dx < 0 ? '-100%' : '0'}, -50%)`
        if (ln) { ln.setAttribute('x1', `${at.x}`); ln.setAttribute('y1', `${at.y}`); ln.setAttribute('x2', `${tip.x}`); ln.setAttribute('y2', `${tip.y}`) }
        if (dot) dot.style.transform = `translate(${at.x}px, ${at.y}px)`
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [index, phase, reduced])

  const info = pick ? COMPONENTS[pick] : null
  return (
    <div className="ug-imm" ref={root} role="dialog" aria-modal="true" aria-label={`Inside the layer: ${layer.name}`} data-phase={phase} data-busy={busy || undefined}>
      <div className="ug-imm__stage">
        <div className="ug-imm__world" ref={world}>
          <img src="cutaway.png" alt="" width={320} height={480} />
          <Life k={1} rows={480} />
          <div className="ug-imm__shade" ref={(el) => { shade.current.top = el }} style={{ top: 0 }} />
          <div className="ug-imm__shade" ref={(el) => { shade.current.bottom = el }} />
        </div>
        <div className="ug-imm__vignette" />
        <svg className="ug-imm__lines" aria-hidden>
          {layer.labels.map((lb, i) => <line key={`${index}-${lb.id}`} ref={(el) => { lines.current[i] = el }} />)}
        </svg>
        {layer.labels.map((lb, i) => (
          <div key={`${index}-${lb.id}`}>
            <span className="ug-imm__dot" ref={(el) => { dots.current[i] = el }} />
            <button type="button" className="ug-imm__note" ref={(el) => { notes.current[i] = el }} onClick={() => setPick(lb.id)} aria-label={`About the ${lb.text.toLowerCase()}`}>
              {lb.text}<span aria-hidden>+</span>
            </button>
          </div>
        ))}
      </div>

      <div className="ug-imm__bar" aria-hidden><div ref={bar} /></div>

      <section className="ug-imm__caption" data-on={(phase === 'in' && !busy) || undefined}>
        <p className="ug-imm__depth">{index + 1} of {LAYERS.length} · {layer.depth}</p>
        <h2>{layer.name}</h2>
        <p>{layer.text}</p>
      </section>

      <button type="button" className="ug-imm__close" onClick={close} aria-label="Back to the whole cutaway" autoFocus>✕</button>
      <nav className="ug-imm__nav" aria-label="Move between layers">
        <button type="button" onClick={() => go(index - 1, 1)} disabled={index === 0} aria-label={index > 0 ? `Up to ${LAYERS[index - 1].name}` : 'Already at the top'}>↑<span>{index > 0 ? LAYERS[index - 1].name : 'The top'}</span></button>
        <button type="button" onClick={() => go(index + 1, 0)} disabled={index === LAYERS.length - 1} aria-label={index < LAYERS.length - 1 ? `Deeper: ${LAYERS[index + 1].name}` : 'Already at the bottom'}>↓<span>{index < LAYERS.length - 1 ? LAYERS[index + 1].name : 'The bottom'}</span></button>
      </nav>
      <p className="ug-imm__hint" data-on={(phase === 'in' && !busy) || undefined}>Scroll to move through the layer · click a label to learn more</p>

      {info && (
        <aside className="ug-detail" aria-label={info.title}>
          <button type="button" className="ug-detail__close" onClick={() => setPick(null)} aria-label="Close" autoFocus>✕</button>
          <h2>{info.title}</h2>
          <p className="ug-detail__blurb">{info.blurb}</p>
          {info.model && <Suspense fallback={<div className="ug-3d__view" />}><Model3D key={pick} model={info.model} /></Suspense>}
          <dl className="ug-detail__facts">
            {info.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          {info.journey && (
            <button type="button" className="ug-detail__journey" onClick={() => setJourney(info.journey!)}>
              {info.journey === 'water' ? 'Follow the water, from the hills to the tap' : 'Follow the wastewater, from the sink to the river'} →
            </button>
          )}
        </aside>
      )}
      {journey && <Journey kind={journey} onClose={() => setJourney(null)} />}
    </div>
  )
}
