import { motion } from 'framer-motion'
import GlowButton from '../components/GlowButton'
import RiverPlan from '../components/RiverPlan'
import { useDeck } from '../components/deckContext'

export default function SlideRiverPlan() {
  const deck = useDeck()

  return (
    <div className="relative h-full w-full overflow-hidden bg-eco-gradient noise">
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-5 py-20">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="glass inline-flex rounded-2xl px-4 py-3 shadow-soft">
              <div>
                <div className="text-xs text-white/60">Слайд 4 / 5</div>
                <div className="mt-0.5 text-sm font-semibold">План: река + участки</div>
              </div>
            </div>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
              Импровизированная река
              <span className="block text-white/75">многослойный SVG-план</span>
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
              Здесь легко показывать деление на зоны/лоты: кликабельные контуры, маркеры и плашки с описанием.
              Можно заменить геометрию на точные кадастровые границы.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <GlowButton onClick={deck.next}>Финальный слайд →</GlowButton>
              <button
                onClick={deck.prev}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white/80 ring-1 ring-white/20 transition hover:bg-white/10"
              >
                ← Назад
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="glass rounded-2xl p-4 shadow-glow">
                <div className="text-sm font-semibold">A / B / C</div>
                <div className="mt-1 text-xs text-white/65">Кликайте по лотам — плашка появляется прямо на схеме.</div>
              </div>
              <div className="glass rounded-2xl p-4 shadow-glow">
                <div className="text-sm font-semibold">Визуальный premium</div>
                <div className="mt-1 text-xs text-white/65">Тени, стекло, “живые” блики на реке и чистая типографика.</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
          >
            <RiverPlan />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
