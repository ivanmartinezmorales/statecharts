import { useMemo } from 'react'
import { Stage } from './kit/stage'
import { Connector } from './kit/motion'
import type { Act } from './kit/act'
import type { Rect } from './kit/measure'
import type { Layer } from './layers'
import { Workers } from './Workers'

// One layer of the cutaway on its own stage. It plays once as it scrolls into view: the strip of the picture is
// there from the start, then each label arrives with its leader, in reading order, and stays.
// Wide: labels sit on the picture at 2x. Compact (a phone): numbered markers on the picture and the labels in a
// list under it, so the words keep their size.

type S = { shown: number }

const WIDE = 2
const COMPACT = 1.1
const LEGEND_ROW = 26

// Where a leader leaves its label: the edge that faces the thing it points at.
function leader(note: Rect, at: { x: number; y: number }) {
  if (at.y > note.y + note.height) return { from: { x: note.x + note.width / 2, y: note.y + note.height }, route: 'v' as const }
  if (at.y < note.y) return { from: { x: note.x + note.width / 2, y: note.y }, route: 'v' as const }
  return { from: { x: at.x > note.x ? note.x + note.width : note.x, y: note.y + note.height / 2 }, route: 'h' as const }
}

export function LayerStage({ layer }: { layer: Layer }) {
  const n = layer.labels.length
  const strip = layer.bottom - layer.top
  const script = useMemo(() => async (a: Act<S>) => {
    await a.wait(450)
    // put, not set: nothing here is measured between labels, so the pace stays the same on a slow device
    for (let i = 1; i <= n; i++) { a.put({ shown: i }); await a.wait(900) }
  }, [n])

  return (
    <Stage<S>
      width={320 * WIDE}
      height={strip * WIDE}
      compact={{ below: 560, width: Math.round(320 * COMPACT), height: Math.round(strip * COMPACT) + n * LEGEND_ROW + 18 }}
      initial={{ shown: 0 }}
      poster={{ shown: n }}
      script={script}
      play="once"
      accent="#ffcf8a"
      theme="dark"
      className="ug-stage"
    >
      {(s, rect, layout) => {
        const k = layout === 'compact' ? COMPACT : WIDE
        const px = ([x, y]: [number, number]) => ({ x: x * k, y: (y - layer.top) * k })
        return (
          <>
            <div className="ug-strip" style={{ height: strip * k }}>
              <img src="cutaway.png" alt="" style={{ width: 320 * k, height: 480 * k, top: -layer.top * k }} />
              {layer.top < 104 && <Workers k={k} top={layer.top} />}
            </div>
            {layer.labels.map((l, i) => {
              const at = px(l.at), on = s.shown > i
              if (layout === 'compact') {
                return <span key={i} className="ug-marker" data-on={on || undefined} style={{ left: at.x, top: at.y }}>{i + 1}</span>
              }
              const note = rect(`note-${i}`)
              const line = leader(note, at)
              // Kept inside the picture with a gutter, by its measured width
              const left = Math.min(l.note[0] * k, 320 * k - (note.width || 0) - 8)
              return (
                <div key={i}>
                  <div className="ug-note" data-target={`note-${i}`} data-on={on || undefined} style={{ left, top: (l.note[1] - layer.top) * k }}>{l.text}</div>
                  <Connector className="ug-leader" from={line.from} to={at} route={line.route} radius={6} show={on && note.width > 0} />
                </div>
              )
            })}
            {layout === 'compact' && (
              <ol className="ug-legend" style={{ top: strip * k + 10 }}>
                {layer.labels.map((l, i) => <li key={i} data-on={s.shown > i || undefined}><span>{i + 1}</span>{l.text}</li>)}
              </ol>
            )}
          </>
        )
      }}
    </Stage>
  )
}
