import { Children, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { DeckContext } from './deckContext'

export default function HorizontalDeck({
  children,
  hideDotsOn = [],     // ✅ индексы слайдов, где НЕ показывать dots
  hideDots = false,    // ✅ полностью выключить dots
}: {
  children: ReactNode
  hideDotsOn?: number[]
  hideDots?: boolean
}) {
  const count = Children.count(children)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(0)

  const slides = useMemo(() => Children.toArray(children), [children])

  // ✅ Виртуализация: монтируем только активный слайд.
  // Это резко снижает нагрузку на стартовую загрузку (карты/изображения не тянут сеть и CPU заранее).
  const shouldRenderSlide = (i: number) => i === active
  const SlidePlaceholder = () => <div className="h-full w-full bg-eco-gradient noise" aria-hidden="true" />

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      e.preventDefault()
      el.scrollBy({ left: e.deltaY * 1.2, behavior: 'smooth' })
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => {
      const width = el.clientWidth
      // ✅ чуть раньше переключаем active, чтобы следующий слайд успевал смонтироваться
      // (иначе при виртуализации можно увидеть «пустой» участок во время скролла)
      const idx = Math.floor((el.scrollLeft + width * 0.9) / width)
      setActive(Math.max(0, Math.min(count - 1, idx)))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [count])

  const go = (idx: number) => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
  }

  const next = () => go(Math.min(active + 1, count - 1))
  const prev = () => go(Math.max(active - 1, 0))

  const hideNavDots = hideDots || hideDotsOn.includes(active) // ✅

  return (
    <DeckContext.Provider value={{ active, count, go, next, prev }}>
      <div className="relative h-full w-full">
        <div
          ref={containerRef}
          className="h-full w-full overflow-x-auto overflow-y-hidden scroll-smooth"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          <div className="flex h-full w-full" style={{ width: `${count * 100}vw` }}>
            {slides.map((s, i) => (
              <section
                key={i}
                className="relative h-full w-screen flex-shrink-0"
                style={{ scrollSnapAlign: 'start' }}
              >
                {shouldRenderSlide(i) ? s : <SlidePlaceholder />}
              </section>
            ))}
          </div>
        </div>

        {/* nav dots */}
        {!hideNavDots && (
          <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 -translate-x-1/2">
            <div className="pointer-events-auto glass flex items-center gap-2 rounded-full px-3 py-2 shadow-soft">
              {Array.from({ length: count }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className="group relative h-3 w-3 rounded-full ring-1 ring-white/20"
                  aria-label={`Перейти к слайду ${i + 1}`}
                >
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    animate={{ opacity: active === i ? 1 : 0.3, scale: active === i ? 1.0 : 0.85 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background:
                        'radial-gradient(circle at 30% 30%, rgba(241, 189, 91, 0.95), rgba(30,201,168,0.55))',
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DeckContext.Provider>
  )
}
