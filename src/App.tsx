import HorizontalDeck from './components/HorizontalDeck'

import SlideHero from './slides/SlideHero'
import SlideAerial from './slides/SlideAerial'
import SlidePatchMap from './slides/SlidePatchMap'
import SlideRiverPlan from './slides/SlideRiverPlan'
import SlideCTA from './slides/SlideCTA'

export default function App() {
  return (
    <div className="h-screen w-screen bg-volga-night text-white">
      <HorizontalDeck>
        <SlideHero />
        <SlideAerial />
        <SlidePatchMap />
        {/* <SlideRiverPlan /> */}
        {/* <SlideCTA /> */}
      </HorizontalDeck>
    </div>
  )
}
