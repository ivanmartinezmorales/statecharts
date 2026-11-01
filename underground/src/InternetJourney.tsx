import { lazy, Suspense, useState } from 'react'
import { Journey } from './Journey'

// The internet journey in two acts: from your laptop to the shore as a pixel panorama, then around the world on the
// globe. Scrolling on past the shore crosses into the globe; scrolling back past its start returns to the shore.
const Globe = lazy(() => import('./Globe').then((m) => ({ default: m.Globe })))

export function InternetJourney({ onClose }: { onClose: () => void }) {
  const [act, setAct] = useState<'shore' | 'globe'>('shore')
  const [back, setBack] = useState(false)
  if (act === 'shore') return <Journey key={back ? 'back' : 'start'} kind="internet" start={back ? 1 : 0} onClose={onClose} onEnd={() => setAct('globe')} />
  return (
    <Suspense fallback={<div className="ug-journey" />}>
      <Globe onClose={onClose} onBack={() => { setBack(true); setAct('shore') }} />
    </Suspense>
  )
}
