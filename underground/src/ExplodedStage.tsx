import { useMemo } from 'react'
import { Stage } from './kit/stage'
import { Connector } from './kit/motion'
import type { Act } from './kit/act'
import type { Rect } from './kit/measure'
import { LAYERS, type Layer } from './layers'
import { Workers } from './Workers'

// The whole cutaway, pulled apart into its layers once it scrolls into view. Click a layer and it slides out of
// the stack at nearly twice the size, like a drawer, while the others step back; its labels then draw in one at a
// time. Click it again (or another) to put it back.
//
// The opening is the stage's script. Which layer is out, and how many of its labels show, comes from the page
// (`focus`, `shown`), because the reader drives it.
// Wide: names on tags to the right, on leaders. Compact (a phone): names sit on the slices, and an open layer's
// labels become numbered markers with a list under it, so no word gets small.

type S = { open: boolean; tags: boolean }
type Look = { width: number; pad: number; gap: number; x: number; k: number; kOut: number; kBack: number }

const WIDE: Look = { width: 640, pad: 24, gap: 18, x: 24, k: 1.25, kOut: 1.875, kBack: 1 }
const COMPACT: Look = { width: 352, pad: 16, gap: 12, x: 16, k: 1, kOut: 1.0, kBack: 0.6 }
const LEGEND_ROW = 24

const sliceH = (l: Layer) => l.slice[1] - l.slice[0]

function heightOf(c: Look, legend: boolean) {
  const closed = 480 * c.k + (LAYERS.length - 1) * c.gap
  const open = Math.max(...LAYERS.map((f) => sliceH(f) * c.kOut + (480 - sliceH(f)) * c.kBack + (legend ? f.labels.length * LEGEND_ROW + 10 : 0))) + (LAYERS.length - 1) * c.gap
  return Math.round(Math.max(closed, open) + c.pad * 2)
}

// Where a leader leaves its label: the edge that faces the thing it points at.
function leader(note: Rect, at: { x: number; y: number }) {
  if (at.y > note.y + note.height) return { from: { x: note.x + note.width / 2, y: note.y + note.height }, route: 'v' as const }
  if (at.y < note.y) return { from: { x: note.x + note.width / 2, y: note.y }, route: 'v' as const }
  return { from: { x: at.x > note.x ? note.x + note.width : note.x, y: note.y + note.height / 2 }, route: 'h' as const }
}

export function ExplodedStage({ focus, shown, settled, onOpen }: { focus: string | null; shown: number; settled: boolean; onOpen: (id: string) => void }) {
  const script = useMemo(() => async (a: Act<S>) => {
    await a.wait(700)
    await a.set({ open: true })
    await a.wait(900)
    a.put({ tags: true })
  }, [])

  return (
    <Stage<S>
      width={WIDE.width}
      height={heightOf(WIDE, false)}
      compact={{ below: 560, width: COMPACT.width, height: heightOf(COMPACT, true) }}
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
        // Lay the slices out top to bottom. Closed, they sit together, centered in the space the open stack takes.
        const total = heightOf(c, compact) - c.pad * 2
        let y = c.pad + (s.open ? 0 : ((LAYERS.length - 1) * c.gap) / 2) + (focus ? 0 : (total - (480 * c.k + (LAYERS.length - 1) * c.gap)) / 2)
        const placed = LAYERS.map((l) => {
          const k = !focus ? c.k : l.id === focus ? c.kOut : c.kBack
          const box = { x: !focus || l.id === focus ? c.x : c.x, y, width: 320 * k, height: sliceH(l) * k, k }
          y += box.height + (s.open ? c.gap : 0) + (compact && l.id === focus ? l.labels.length * LEGEND_ROW + 10 : 0)
          return { l, box }
        })
        return (
          <>
            {placed.map(({ l, box }) => {
              const out = l.id === focus
              const tag = rect(`tag-${l.id}`)
              return (
                <div key={l.id}>
                  <button
                    type="button"
                    className="ug-slice"
                    data-target={`slice-${l.id}`}
                    data-cursor="pointer"
                    data-out={out || undefined}
                    data-back={(focus && !out) || undefined}
                    aria-expanded={out}
                    aria-label={`${out ? 'Close' : 'Open'}: ${l.name}`}
                    onClick={() => onOpen(l.id)}
                    style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
                  >
                    <img src="cutaway.png" alt="" style={{ width: 320 * box.k, height: 480 * box.k, top: -l.slice[0] * box.k }} />
                    {l.id === 'street' && <Workers k={box.k} top={l.slice[0]} />}
                  </button>

                  {/* The name: on a tag beside the slice when wide, on the slice itself on a phone or when it is out */}
                  {compact || out ? (
                    <span className="ug-tag ug-tag--on-slice" data-on={s.tags || undefined} style={{ left: box.x + 8, top: box.y + 8 }}>{l.name}</span>
                  ) : (
                    <>
                      <button type="button" className="ug-tag" data-target={`tag-${l.id}`} data-cursor="pointer" data-on={s.tags || undefined} onClick={() => onOpen(l.id)} style={{ left: box.x + box.width + 44, top: box.y + box.height / 2 - 17 }}>
                        <span>{l.name}</span><small>{l.depth}</small>
                      </button>
                      <Connector className="ug-leader" from={{ x: tag.x, y: tag.y + tag.height / 2 }} to={{ x: box.x + box.width - 10, y: box.y + box.height / 2 }} route="straight" show={s.tags && settled && tag.width > 0} />
                    </>
                  )}

                  {/* An open layer's labels */}
                  {out && l.labels.map((lb, i) => {
                    const at = { x: box.x + lb.at[0] * box.k, y: box.y + (lb.at[1] - l.slice[0]) * box.k }
                    const on = shown > i
                    if (compact) return <span key={i} className="ug-marker" data-on={on || undefined} style={{ left: at.x, top: at.y }}>{i + 1}</span>
                    const note = rect(`note-${l.id}-${i}`)
                    const left = Math.min(box.x + lb.note[0] * box.k, box.x + box.width - (note.width || 0) - 8)
                    const top = Math.max(box.y + 34, box.y + (lb.note[1] - l.slice[0]) * box.k)
                    const line = leader(note, at)
                    return (
                      <div key={i}>
                        <div className="ug-note" data-target={`note-${l.id}-${i}`} data-on={on || undefined} style={{ left, top }}>{lb.text}</div>
                        <Connector className="ug-leader" from={line.from} to={at} route={line.route} radius={6} show={on && note.width > 0} />
                      </div>
                    )
                  })}
                  {out && compact && (
                    <ol className="ug-legend" style={{ left: box.x, top: box.y + box.height + 8 }}>
                      {l.labels.map((lb, i) => <li key={i} data-on={shown > i || undefined}><span>{i + 1}</span>{lb.text}</li>)}
                    </ol>
                  )}
                </div>
              )
            })}
          </>
        )
      }}
    </Stage>
  )
}
