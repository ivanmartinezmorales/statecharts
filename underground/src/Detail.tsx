import { lazy, Suspense } from 'react'
import { COMPONENTS, type Journey } from './components'

// One component, opened: what it is, how it works step by step, its parts in 3D, the facts, and the questions people
// ask. In a layer it can also start that system's journey; inside a journey it cannot (you are already on it).

// three.js is big: load it the first time a component is opened, not with the page
const Model3D = lazy(() => import('./Model3D').then((m) => ({ default: m.Model3D })))

const JOURNEY_BUTTON: Record<Journey, string> = {
  water: 'Follow the water, from the hills to the tap',
  wastewater: 'Follow the wastewater, from the sink to the river',
  power: 'Follow the electricity, from the power plant to the outlet',
  internet: 'Follow the internet, from your house around the world',
}

export function Detail({ id, onClose, onJourney }: { id: string; onClose: () => void; onJourney?: (j: Journey) => void }) {
  const info = COMPONENTS[id]
  return (
    <aside className="ug-detail" aria-label={info.title}>
      <button type="button" className="ug-detail__close" onClick={onClose} aria-label="Close" autoFocus>✕</button>
      <h2>{info.title}</h2>
      <p className="ug-detail__blurb">{info.blurb}</p>
      {info.model && <Suspense fallback={<div className="ug-3d__view" />}><Model3D key={id} model={info.model} /></Suspense>}
      {info.steps && (
        <section className="ug-detail__how">
          <h3>How it works</h3>
          <ol className="ug-detail__steps">{info.steps.map((st) => <li key={st}>{st}</li>)}</ol>
        </section>
      )}
      <dl className="ug-detail__facts">
        {info.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      {info.questions && (
        <section className="ug-detail__questions">
          <h3>Questions people ask</h3>
          {info.questions.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </section>
      )}
      {info.journey && onJourney && (
        <button type="button" className="ug-detail__journey" onClick={() => onJourney(info.journey!)}>{JOURNEY_BUTTON[info.journey]} →</button>
      )}
    </aside>
  )
}
