import { useMemo } from 'react'
import { Stage } from './kit/stage'
import { Connector } from './kit/motion'
import type { Act } from './kit/act'
import { LAYERS, type Layer } from './layers'
import { Life } from './Life'

// The whole cutaway, pulled apart into its layers once it scrolls into view, each named on a tag. Every slice (and
// its tag) is a way in: clicking one hands its on-screen box to the page, which dives into that layer from there.
// Wide: tags to the right on leaders. Compact (a phone): the names sit on the slices, so nothing gets small.

type S = { open: boolean; tags: boolean }
type Look = { width: number; pad: number; gap: number; x: number; k: number }

const WIDE: Look = { width: 640, pad: 24, gap: 18, x: 24, k: 1.25 }
const COMPACT: Look = { width: 352, pad: 16, gap: 12, x: 16, k: 1 }

const sliceH = (l: Layer) => l.slice[1] - l.slice[0]
const heightOf = (c: Look) => Math.round(480 * c.k + (LAYERS.length - 1) * c.gap + c.pad * 2)

export function ExplodedStage({ onOpen }: { onOpen: (index: number, from: DOMRect) => void }) {
  const script = useMemo(() => async (a: Act<S>) => {
    await a.wait(700)
    await a.set({ open: true })
    await a.wait(900)
    a.put({ tags: true })
  }, [])

  const open = (i: number) => {
    const el = document.querySelector<HTMLElement>(`[data-target="slice-${LAYERS[i].id}"]`)
    if (el) onOpen(i, el.getBoundingClientRect())
  }

  return (
    <Stage<S>
      width={WIDE.width}
      height={heightOf(WIDE)}
      compact={{ below: 560, width: COMPACT.width, height: heightOf(COMPACT) }}
      initial={{ open: false, tags: false }}
      poster={{ open: true, tags: true }}
      script={script}
      play="once"
      accent="#ffcf8a"
      theme="dark"
      className="ug-exploded"
    >
      {(s, rect, layout) => {
        const c = layout === 'compact' ? COMPACT : WIDE
        const compact = layout === 'compact'
        // Closed, the slices sit together, centered in the space the open stack takes
        let y = c.pad + (s.open ? 0 : ((LAYERS.length - 1) * c.gap) / 2)
        return LAYERS.map((l, i) => {
          const box = { x: c.x, y, width: 320 * c.k, height: sliceH(l) * c.k }
          y += box.height + (s.open ? c.gap : 0)
          const tag = rect(`tag-${l.id}`)
          return (
            <div key={l.id}>
              <button
                type="button"
                className="ug-slice"
                data-target={`slice-${l.id}`}
                data-cursor="pointer"
                aria-label={`Go inside: ${l.name}`}
                onClick={() => open(i)}
                style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
              >
                <img src="cutaway.png" alt="" style={{ width: 320 * c.k, height: 480 * c.k, top: -l.slice[0] * c.k }} />
                <Life k={c.k} top={l.slice[0]} rows={sliceH(l)} />
              </button>
              {compact ? (
                <span className="ug-tag ug-tag--on-slice" data-on={s.tags || undefined} style={{ left: box.x + 8, top: box.y + 8 }}>{l.name}</span>
              ) : (
                <>
                  <button type="button" className="ug-tag" data-target={`tag-${l.id}`} data-cursor="pointer" data-on={s.tags || undefined} tabIndex={-1} onClick={() => open(i)} style={{ left: box.x + box.width + 44, top: box.y + box.height / 2 - 17 }}>
                    <span>{l.name}</span><small>{l.depth}</small>
                  </button>
                  <Connector className="ug-leader" from={{ x: tag.x, y: tag.y + tag.height / 2 }} to={{ x: box.x + box.width - 10, y: box.y + box.height / 2 }} route="straight" show={s.tags && tag.width > 0} />
                </>
              )}
            </div>
          )
        })
      }}
    </Stage>
  )
}
