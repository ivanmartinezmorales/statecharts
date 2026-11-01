import { useCallback, useState } from 'react'
import { LAYERS } from './layers'
import { ExplodedStage } from './ExplodedStage'
import { Immersive } from './Immersive'

export function App() {
  const [inside, setInside] = useState<{ index: number; from: DOMRect } | null>(null)

  // Where a layer's slice sits on the page right now, for the camera to shrink back into
  const sliceRect = useCallback((i: number) => document.querySelector<HTMLElement>(`[data-target="slice-${LAYERS[i].id}"]`)?.getBoundingClientRect() ?? null, [])
  const onIndex = useCallback((index: number) => setInside((was) => (was ? { ...was, index } : was)), [])
  const onClosed = useCallback(() => {
    const was = inside
    setInside(null)
    // Give focus back to the slice the reader came out of
    if (was) requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-target="slice-${LAYERS[was.index].id}"]`)?.focus())
  }, [inside])

  const enter = (index: number) => { const from = sliceRect(index); if (from) setInside({ index, from }) }

  return (
    <main className="ug-home">
      <header className="ug-hero" {...(inside ? { inert: '' } : {})}>
        <p className="ug-hero__kicker">One city block, top to bottom</p>
        <h1>Under the Street</h1>
        <p className="ug-hero__lede">Below every sidewalk is a hidden city: water under pressure, gas, thousands of volts, a river of wastewater, trains, and the rock it all stands on. Pick a layer and go inside.</p>
        <ol className="ug-hero__index">
          {LAYERS.map((l, i) => (
            <li key={l.id}>
              <button type="button" onClick={() => enter(i)}>
                <span className="ug-hero__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="ug-hero__name">{l.name}</span>
                <span className="ug-hero__depth">{l.depth}</span>
              </button>
            </li>
          ))}
        </ol>
      </header>

      <section className="ug-explode" aria-label="The cutaway, pulled apart into its layers" {...(inside ? { inert: '' } : {})}>
        <ExplodedStage onOpen={(index, from) => setInside({ index, from })} />
      </section>

      {inside && <Immersive index={inside.index} from={inside.from} sliceRect={sliceRect} onIndex={onIndex} onClosed={onClosed} />}
    </main>
  )
}
