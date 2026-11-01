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

  return (
    <main>
      <header className="ug-hero">
        <h1>Under the Street</h1>
        <p>A pixel cutaway of one city block, from the sidewalk down to solid rock, pulled apart into its layers. Click a layer to go inside it.</p>
      </header>

      <section className="ug-explode" aria-label="The cutaway, pulled apart into its layers" {...(inside ? { inert: '' } : {})}>
        <ExplodedStage onOpen={(index, from) => setInside({ index, from })} />
      </section>

      {inside && <Immersive index={inside.index} from={inside.from} sliceRect={sliceRect} onIndex={onIndex} onClosed={onClosed} />}
    </main>
  )
}
