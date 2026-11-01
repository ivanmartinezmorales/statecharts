import { useCallback, useEffect, useRef, useState } from 'react'
import { LAYERS } from './layers'
import { LayerStage } from './LayerStage'
import { ExplodedStage } from './ExplodedStage'

// How long the slices take to slide, and the beat between one label and the next once a layer is out
const SLIDE = 650
const BEAT = 450

export function App() {
  const [focus, setFocus] = useState<string | null>(null)
  const [shown, setShown] = useState(0)
  const [settled, setSettled] = useState(true)
  const timers = useRef<number[]>([])

  const open = useCallback((id: string | null) => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setFocus((was) => {
      const next = was === id ? null : id
      setShown(0)
      setSettled(false)
      const n = LAYERS.find((l) => l.id === next)?.labels.length ?? 0
      timers.current.push(window.setTimeout(() => setSettled(true), SLIDE))
      for (let i = 1; i <= n; i++) timers.current.push(window.setTimeout(() => setShown(i), SLIDE + (i - 1) * BEAT))
      return next
    })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') open(null) }
    addEventListener('keydown', onKey)
    return () => { removeEventListener('keydown', onKey); timers.current.forEach(clearTimeout) }
  }, [open])

  const layer = LAYERS.find((l) => l.id === focus)

  return (
    <main>
      <header className="ug-hero">
        <h1>Under the Street</h1>
        <p>A pixel cutaway of one city block, from the sidewalk down to solid rock, pulled apart into its layers. Click a layer to look inside it.</p>
      </header>

      <section className="ug-explode" aria-label="The cutaway, pulled apart into its layers">
        <ExplodedStage focus={focus} shown={shown} settled={settled} onOpen={open} />
        <div className="ug-caption" aria-live="polite">
          {layer ? (
            <>
              <p className="ug-layer__step">{layer.depth}</p>
              <h2>{layer.name}</h2>
              <p>{layer.text}</p>
              <p className="ug-caption__actions">
                <button type="button" onClick={() => open(null)}>Put it back</button>
                <a href={`#${layer.id}`}>Read about it below</a>
              </p>
            </>
          ) : (
            <p className="ug-caption__hint">Not to scale: the real layers are much farther apart.</p>
          )}
        </div>
      </section>

      {LAYERS.map((l, i) => (
        <section key={l.id} id={l.id} className="ug-layer">
          <div className="ug-layer__copy">
            <p className="ug-layer__step">{i + 1} of {LAYERS.length} · {l.depth}</p>
            <h2>{l.name}</h2>
            <p>{l.text}</p>
          </div>
          <LayerStage layer={l} />
        </section>
      ))}

      <footer>
        <a href="#top" onClick={(e) => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }) }}>Back to the street</a>
      </footer>
    </main>
  )
}
