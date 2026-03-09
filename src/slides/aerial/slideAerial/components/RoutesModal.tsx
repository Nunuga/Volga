import { AnimatePresence, motion } from 'framer-motion'
import React, { useMemo } from 'react'

export type RouteTab = 'moscow' | 'tver'

function buildYandexWidgetRouteUrl(from: string, to: string) {
  const qs = new URLSearchParams({ rtext: `${from}~${to}`, rtt: 'auto' })
  return `https://yandex.ru/map-widget/v1/?${qs.toString()}`
}

function buildYandexOpenRouteUrl(from: string, to: string) {
  const qs = new URLSearchParams({ rtext: `${from}~${to}`, rtt: 'auto' })
  return `https://yandex.ru/maps/?${qs.toString()}`
}

export function RoutesModal({
  open,
  tab,
  onTab,
  onClose,
  destination,
}: {
  open: boolean
  tab: RouteTab
  onTab: (t: RouteTab) => void
  onClose: () => void
  destination: string
}) {
  const from = tab === 'moscow' ? 'Москва МКАД 78 км' : 'Тверь'
  const iframeUrl = useMemo(() => buildYandexWidgetRouteUrl(from, destination), [from, destination])
  const openUrl = useMemo(() => buildYandexOpenRouteUrl(from, destination), [from, destination])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[120] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ pointerEvents: 'auto' }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(10px)' }} />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.18 }}
            className="relative z-[125] w-[min(1100px,92vw)] overflow-hidden rounded-[28px] ring-1 ring-white/15"
            style={{
              background: 'linear-gradient(135deg, rgba(12,28,44,0.92), rgba(6,14,22,0.84))',
              boxShadow: '0 40px 140px rgba(0,0,0,0.65)',
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-extrabold text-white/90">Маршруты</div>
                <div className="mt-1 text-[12px] text-white/55 truncate">Пункт назначения: {destination}</div>
              </div>

              <button onClick={onClose} className="rounded-2xl px-3 py-2 text-[13px] font-bold text-white/80 ring-1 ring-white/15 hover:bg-white/10">
                Закрыть ✕
              </button>
            </div>

            <div className="px-5 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onTab('moscow')}
                  className={[
                    'rounded-2xl px-4 py-2 text-sm font-semibold transition ring-1',
                    tab === 'moscow'
                      ? 'bg-white/15 text-white ring-white/25 shadow-soft'
                      : 'bg-white/5 text-white/80 ring-white/15 hover:bg-white/10',
                  ].join(' ')}
                >
                  От Москвы
                </button>
                <button
                  onClick={() => onTab('tver')}
                  className={[
                    'rounded-2xl px-4 py-2 text-sm font-semibold transition ring-1',
                    tab === 'tver'
                      ? 'bg-white/15 text-white ring-white/25 shadow-soft'
                      : 'bg-white/5 text-white/80 ring-white/15 hover:bg-white/10',
                  ].join(' ')}
                >
                  От Твери
                </button>

                <a
                  href={openUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white/85 ring-1 ring-white/14 transition hover:bg-white/10"
                  onClick={(e) => e.stopPropagation()}
                  title="Открыть маршрут в Яндекс Картах"
                >
                  Открыть в Яндекс Картах ↗
                </a>
              </div>
            </div>

            <div className="px-5 pb-5">
              <div
                className="overflow-hidden rounded-[22px] ring-1 ring-white/12"
                style={{ background: 'rgba(255,255,255,0.06)', boxShadow: '0 18px 60px rgba(0,0,0,0.35)' }}
              >
                <iframe
                  key={`${tab}-${destination}`}
                  src={iframeUrl}
                  title={`Маршрут ${from} → ${destination}`}
                  className="h-[min(70vh,640px)] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allow="fullscreen"
                />
              </div>

              <div className="mt-3 text-[12px] text-white/55">
                Если iframe не показывает маршрут (иногда блокируется политиками), нажми “Открыть в Яндекс Картах”.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
