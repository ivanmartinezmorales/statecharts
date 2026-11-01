import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from './kit/reduced-motion'
import { LAYERS } from './layers'
import { COMPONENTS, type Journey as JourneyKind } from './components'
import { anchors } from './living'
import { Life } from './Life'
import { Journey } from './Journey'
import { InternetJourney } from './InternetJourney'
import { Detail } from './Detail'


// Inside a layer. The slice that was clicked grows from where it sat until it fills the screen, and you are in it.
// Scrolling plays the layer's shots (see layers.ts): the camera pushes in on one thing, eases out and glides in on
// the next, pulls back; keep scrolling past the last shot and you sink into the next layer (or rise,
// scrolling back). The layers above and below stay dimly in view. Labels come in as their thing comes into frame and
// follow the things that move. Click one to learn about it: how it works, its facts, its parts in 3D, and for the big
// systems, the whole journey. Close shrinks it all back into its slice.
//
// The camera is one transform on the whole picture (look at cx, cy; zoom k), driven by a requestAnimationFrame
// loop that also places the labels with the same maths, so labels and picture never drift apart.

type Cam = { cx: number; cy: number; k: number }
type Props = { index: number; from: DOMRect; sliceRect: (index: number) => DOMRect | null; onIndex: (i: number) => void; onClosed: () => void }

const MOVE = 900
const OVERSCROLL = 260
const PER_SHOT = 650
const ANCHOR = 0.46
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const mix = (a: Cam, b: Cam, t: number): Cam => ({ cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, k: a.k * (b.k / a.k) ** t })

// The camera at progress p through layer i's shots, moving like a demo reel: between two shots it eases back out
// (a balloon zoom), then glides in on the next subject. Zoom 1 fills the screen with the layer; the look-at point is
// kept far enough from the picture's edges that the frame never runs off it. The camera never rolls.
function frameFor(i: number, p: number, w: number, h: number, t = 0): Cam {
  const { slice, shots } = LAYERS[i]
  const base = Math.max(w / 320, (h * 0.62) / (slice[1] - slice[0]))
  const f = Math.max(0, Math.min(1, p)) * (shots.length - 1), n = Math.min(shots.length - 2, Math.floor(f))
  const u = ease(f - n), a = shots[n], b = shots[n + 1]
  const balloon = Math.sin(Math.PI * u) * 0.45
  const k = Math.max(base, base * Math.exp(Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * u - balloon))
  // the slightest drift on a held shot, so it never looks frozen
  let cx = a.at[0] + (b.at[0] - a.at[0]) * u + Math.sin(t * 0.25) * (1.2 / a.zoom)
  let cy = a.at[1] + (b.at[1] - a.at[1]) * u
  const halfW = w / 2 / k
  cx = 320 * k > w ? Math.max(halfW, Math.min(320 - halfW, cx)) : 160
  cy = Math.max((h * ANCHOR) / k, Math.min(480 - (h * (1 - ANCHOR)) / k, cy))
  return { cx, cy, k }
}

// The camera that puts the picture exactly over a slice on the page
function camOver(r: DOMRect, i: number, w: number, h: number): Cam {
  const k = r.width / 320
  return { k, cx: -(r.left - w / 2) / k, cy: LAYERS[i].slice[0] - (r.top - h * ANCHOR) / k }
}

// Where a picture point lands on screen under camera c
function toScreen(c: Cam, x: number, y: number, w: number, h: number) {
  return { x: w / 2 + (x - c.cx) * c.k, y: h * ANCHOR + (y - c.cy) * c.k }
}

export function Immersive({ index, from, sliceRect, onIndex, onClosed }: Props) {
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const notes = useRef<(HTMLElement | null)[]>([])
  const lines = useRef<(SVGLineElement | null)[]>([])
  const dots = useRef<(HTMLSpanElement | null)[]>([])
  const shade = useRef<{ top: HTMLDivElement | null; bottom: HTMLDivElement | null }>({ top: null, bottom: null })
  const bar = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<'opening' | 'in' | 'moving' | 'closing'>('opening')
  const [pick, setPick] = useState<string | null>(null)
  const [journey, setJourney] = useState<JourneyKind | null>(null)
  const cam = useRef<Cam>(camOver(from, index, innerWidth, innerHeight))
  const tween = useRef<{ from: Cam; to: Cam; t0: number; done: () => void } | null>(null)
  // How far through the layer's shots the camera is (eased toward the target), and how far past either end the reader has pushed
  const pan = useRef({ target: 0, now: 0, over: 0 })
  const busy = pick !== null || journey !== null
  const layer = LAYERS[index]

  const moveTo = useCallback((to: Cam, done: () => void) => {
    if (reduced) { cam.current = to; done(); return }
    tween.current = { from: { ...cam.current }, to, t0: performance.now(), done }
  }, [reduced])

  // Open: grow from the slice
  useLayoutEffect(() => {
    moveTo(frameFor(index, 0, innerWidth, innerHeight), () => setPhase('in'))
    requestAnimationFrame(() => root.current?.setAttribute('data-shown', ''))
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const go = useCallback((i: number, at: number) => {
    if (i < 0 || i >= LAYERS.length || phase !== 'in') return
    pan.current = { target: at, now: at, over: 0 }
    setPhase('moving'); onIndex(i)
    moveTo(frameFor(i, at, innerWidth, innerHeight, performance.now() / 1000), () => setPhase('in'))
  }, [phase, moveTo, onIndex])

  const close = useCallback(() => {
    if (phase === 'closing') return
    setPhase('closing')
    root.current?.removeAttribute('data-shown')
    const r = sliceRect(index)
    if (!r) { onClosed(); return }
    moveTo(camOver(r, index, innerWidth, innerHeight), onClosed)
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
      const p = pan.current, next = p.target + d / (PER_SHOT * (LAYERS[index].shots.length - 1))
      if (next > 1) { p.target = 1; p.over = Math.max(0, p.over) + d; if (p.over > OVERSCROLL) go(index + 1, 0) }
      else if (next < 0) { p.target = 0; p.over = Math.min(0, p.over) + d; if (p.over < -OVERSCROLL) go(index - 1, 1) }
      else { p.target = next; p.over = 0 }
    }
    // When the scrolling stops, settle on the nearest shot so every framing lands clean
    let settle = 0
    const snap = () => { const p = pan.current, n = LAYERS[index].shots.length - 1; p.target = Math.round(p.target * n) / n }
    const onWheel = (e: WheelEvent) => { e.preventDefault(); push(e.deltaY + e.deltaX); clearTimeout(settle); settle = window.setTimeout(snap, 220) }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); go(index + 1, 0) }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go(index - 1, 1) }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const p = pan.current, n = LAYERS[index].shots.length - 1, step = e.key === 'ArrowRight' ? 1 : -1
        const next = Math.round(p.target * n) + step
        if (next > n) go(index + 1, 0); else if (next < 0) go(index - 1, 1); else p.target = next / n
      }
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
    const te = () => { last = null; snap() }
    addEventListener('wheel', onWheel, { passive: false })
    addEventListener('keydown', onKey)
    addEventListener('touchstart', ts, { passive: true })
    addEventListener('touchmove', tm, { passive: false })
    addEventListener('touchend', te)
    return () => { clearTimeout(settle); removeEventListener('wheel', onWheel); removeEventListener('keydown', onKey); removeEventListener('touchstart', ts); removeEventListener('touchmove', tm); removeEventListener('touchend', te) }
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
        p.now += (p.target - p.now) * (reduced ? 1 : 0.07)
        cam.current = frameFor(index, p.now, w, h, reduced ? 0 : now / 1000)
      }
      const c = cam.current
      if (world.current) world.current.style.transform = `translate(${w / 2}px, ${h * ANCHOR}px) scale(${c.k}) translate(${-c.cx}px, ${-c.cy}px)`
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
        const at = src ? toScreen(c, src.x, src.y, w, h) : null
        const visible = phase === 'in' && !!at && at.x > w * 0.05 && at.x < w * 0.95 && at.y > h * 0.06 && at.y < h * 0.8
        for (const el of [n, ln, dot]) el?.toggleAttribute('data-on', visible)
        if (!at) return
        const dx = lb.note[0] - lb.at[0], dy = lb.note[1] - lb.at[1], len = Math.hypot(dx, dy) || 1
        const reach = Math.min(120, Math.max(60, len * c.k * 0.3))
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
            {COMPONENTS[lb.id] ? (
              <button type="button" className="ug-imm__note" ref={(el) => { notes.current[i] = el }} onClick={() => setPick(lb.id)} aria-label={`About the ${lb.text.toLowerCase()}`}>
                {lb.text}<span aria-hidden>+</span>
              </button>
            ) : (
              <span className="ug-imm__note ug-imm__note--plain" ref={(el) => { notes.current[i] = el }}>{lb.text}</span>
            )}
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

      {pick && <Detail id={pick} onClose={() => setPick(null)} onJourney={setJourney} />}
      {journey === 'internet' ? <InternetJourney onClose={() => setJourney(null)} /> : journey && <Journey kind={journey} onClose={() => setJourney(null)} />}
    </div>
  )
}
