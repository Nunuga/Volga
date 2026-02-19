import { motion } from 'framer-motion'
import GlowButton from '../components/GlowButton'
import { useDeck } from '../components/deckContext'

export default function SlideHero() {
  const deck = useDeck()

  return (
    <div className="relative h-full w-full overflow-hidden bg-eco-gradient noise">
      {/* soft orbs */}
      <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-volga-teal/25 blur-3xl" />
      <div className="absolute -right-56 top-10 h-[580px] w-[580px] rounded-full bg-volga-lime/18 blur-3xl" />

      <div className="relative mx-auto flex h-full max-w-7xl items-center px-5 py-20">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* <div className="glass inline-flex rounded-2xl px-4 py-3 shadow-soft">
              <div>
                <div className="text-xs text-white/60">Премиальная презентация участка</div>
                <div className="mt-0.5 text-sm font-semibold">Волга • 22 гектара</div>
              </div>
            </div> */}

            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
              Земля на Волге
              <span className="block text-white/75">Первая линия</span>
            </h1>

            {/* <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              Горизонтальная презентация: аэроснимок с точной схемой, 3D-карта-патч и интерактивный план с рекой.
              Всё сделано в живых, природных тонах.
            </p> */}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <GlowButton onClick={deck.next}>Смотреть участок →</GlowButton>
              {/* <button
                onClick={() => alert('Здесь можно открыть PDF/документы или видео-тур.')}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white/80 ring-1 ring-white/20 transition hover:bg-white/10"
              >
                Документы / PDF
              </button> */}
            </div>

            {/* <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[{ k: 'Площадь', v: '22 га' }, { k: 'Формат', v: 'единый массив / лоты' }, { k: 'Локация', v: 'Волга' }].map(
                (it) => (
                  <div key={it.k} className="glass rounded-2xl p-4 shadow-glow">
                    <div className="text-xs text-white/60">{it.k}</div>
                    <div className="mt-1 text-sm font-semibold text-white">{it.v}</div>
                  </div>
                ),
              )}
            </div> */}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="relative"
          >
            <div className="glass rounded-[36px] p-6 shadow-soft">
              <div className="text-sm font-semibold">Навигация</div>
              <div className="mt-2 text-sm text-white/70">
                <ul className="space-y-2">
                  <li>• Колёсиком мыши — горизонтальный скролл</li>
                  <li>• Точки внизу — переход по слайдам</li>
                  <li>• На картах — кликайте по маркерам</li>
                </ul>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { t: 'Слайд 2', d: 'Аэроснимок - общая схема -схемы участков' },
                  { t: 'Слайд 3', d: 'Реализуемые участки' },
                  // { t: 'Слайд 4', d: 'Река + лоты' },
                  // { t: 'Слайд 5', d: 'Контакты / запрос' },
                ].map((it, idx) => (
                  <button
                    key={it.t}
                    onClick={() => deck.go(idx + 1)}
                    className="glass rounded-2xl p-4 text-left shadow-glow transition hover:bg-white/10"
                  >
                    <div className="text-sm font-semibold">{it.t}</div>
                    <div className="mt-1 text-xs text-white/65">{it.d}</div>
                  </button>
                ))}
              </div>

              <div className="mt-5 text-xs text-white/50">
                {/* Под замену: тексты, координаты точек, SVG-контуры и контакты. */}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
