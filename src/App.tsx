import { Suspense, lazy, useEffect } from 'react'
import HorizontalDeck from './components/HorizontalDeck'

// ✅ код-сплитинг: тяжёлые слайды/карты подгружаются только когда реально нужны
const SlideHero = lazy(() => import('./slides/SlideHero'))
const SlideAerial = lazy(() => import('./slides/SlideAerial'))
const SlidePatchMap = lazy(() => import('./slides/SlidePatchMap'))
// const SlideRiverPlan = lazy(() => import('./slides/SlideRiverPlan'))
// const SlideCTA = lazy(() => import('./slides/SlideCTA'))

export default function App() {
  // ✅ мягкое «прогревание» следующих чанков после первого рендера
  useEffect(() => {
    const id = window.setTimeout(() => {
      import('./slides/SlideAerial')
      import('./slides/SlidePatchMap')
    }, 700)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div className="h-screen w-screen bg-volga-night text-white">
      <HorizontalDeck hideDotsOn={[1,2]}>
        <Suspense fallback={<div className="h-full w-full bg-eco-gradient noise" />}>
          <SlideHero />
        </Suspense>

        <Suspense fallback={<div className="h-full w-full bg-eco-gradient noise" />}>
          <SlideAerial />
        </Suspense>

        <Suspense fallback={<div className="h-full w-full bg-eco-gradient noise" />}>
          <SlidePatchMap />
        </Suspense>
        {/* <SlideRiverPlan /> */}
        {/* <SlideCTA /> */}
      </HorizontalDeck>
    </div>
  )
}
