import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// ✅ для SVG <foreignObject> иногда нужен XHTML namespace.
// React/TS типы не знают про атрибут xmlns на div, поэтому пробрасываем его через any.
const XHTML_NS = { xmlns: 'http://www.w3.org/1999/xhtml' }

type Plot = {
  id: string
  title: string
  area: string
  x: number
  y: number
  points: string
  desc: string
}

export default function RiverPlan() {
  const plots = useMemo<Plot[]>(
    () => [
      {
        id: 'A',
        title: 'Участок A — берег',
        area: '6.8 га',
        x: 360,
        y: 510,
        points: '210,470 360,395 520,445 505,595 315,620 205,560',
        desc: 'Максимально близко к воде. Хорошо под причал, баню и видовой дом.',
      },
      {
        id: 'B',
        title: 'Участок B — поляна',
        area: '9.4 га',
        x: 760,
        y: 420,
        points: '590,390 770,300 950,345 910,505 720,535 610,470',
        desc: 'Ровный рельеф, удобно под основную застройку и сад/парк.',
      },
      {
        id: 'C',
        title: 'Участок C — лес',
        area: '5.8 га',
        x: 940,
        y: 250,
        points: '740,245 900,150 1080,175 1050,300 900,335 765,300',
        desc: 'Тишина и приватность. Естественная защита от ветра и зонирование.',
      },
    ],
    [],
  )

  const [active, setActive] = useState<string | null>('B')
  const activePlot = plots.find((p) => p.id === active)

  return (
    <div className="relative">
      <div className="absolute -inset-10 rounded-[44px] bg-white/5 blur-2xl" />
      <div className="relative overflow-hidden rounded-[36px] ring-1 ring-white/15 shadow-soft">
        <svg viewBox="0 0 1200 700" className="h-full w-full">
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(6,24,38,1)" />
              <stop offset="1" stopColor="rgba(11,42,74,1)" />
            </linearGradient>

            <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(30,201,168,0.10)" />
              <stop offset="0.45" stopColor="rgba(30,201,168,0.40)" />
              <stop offset="1" stopColor="rgba(255,255,255,0.06)" />
            </linearGradient>

            <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(165,241,91,0.10)" />
              <stop offset="0.5" stopColor="rgba(30,201,168,0.12)" />
              <stop offset="1" stopColor="rgba(245,240,215,0.08)" />
            </linearGradient>

            <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="rgba(0,0,0,0.55)" />
            </filter>
          </defs>

          {/* background */}
          <rect x="0" y="0" width="1200" height="700" fill="url(#bg)" />

          {/* distant hills */}
          <path
            d="M0 210 C 240 140, 420 260, 640 200 C 860 140, 980 250, 1200 180 L 1200 0 L 0 0 Z"
            fill="rgba(255,255,255,0.05)"
          />

          {/* land base */}
          <path
            d="M-20 360 C 240 240, 420 420, 660 330 C 900 240, 1040 360, 1220 280 L 1220 760 L -20 760 Z"
            fill="url(#land)"
            opacity="0.95"
          />

          {/* river */}
          <g filter="url(#softShadow)">
            <path
              d="M-60 520 C 200 420, 420 610, 660 520 C 900 430, 1040 520, 1260 430 L 1260 760 L -60 760 Z"
              fill="rgba(11,42,74,0.85)"
            />
            <path
              d="M-60 510 C 200 410, 420 600, 660 510 C 900 420, 1040 510, 1260 420 L 1260 760 L -60 760 Z"
              fill="url(#river)"
              opacity="0.9"
            />
            <motion.path
              d="M-60 545 C 220 450, 430 635, 665 540 C 900 445, 1040 540, 1260 455"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0.6, opacity: 0.25 }}
              animate={{ pathLength: [0.55, 0.75, 0.55], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>

          {/* plots */}
          {plots.map((p) => {
            const isActive = p.id === active
            return (
              <g
                key={p.id}
                onClick={() => setActive((v) => (v === p.id ? null : p.id))}
                style={{ cursor: 'pointer' }}
              >
                <polygon
                  points={p.points}
                  fill={isActive ? 'rgba(30,201,168,0.22)' : 'rgba(255,255,255,0.06)'}
                  stroke={isActive ? 'rgba(165,241,91,0.95)' : 'rgba(255,255,255,0.20)'}
                  strokeWidth={isActive ? 4 : 2}
                />
                <circle cx={p.x} cy={p.y} r={10} fill="rgba(165,241,91,0.65)" />
                <circle cx={p.x} cy={p.y} r={4} fill="rgba(255,255,255,0.92)" />
                <text
                  x={p.x + 14}
                  y={p.y + 6}
                  fill="rgba(255,255,255,0.85)"
                  fontSize="18"
                  fontFamily="ui-sans-serif, system-ui"
                  fontWeight="700"
                >
                  {p.id}
                </text>
              </g>
            )
          })}

          {/* info card inside svg */}
          <AnimatePresence>
            {activePlot && (
              <motion.foreignObject
                x={Math.min(activePlot.x + 22, 860)}
                y={Math.max(activePlot.y - 110, 40)}
                width={320}
                height={170}
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.22 }}
              >
                <div {...(XHTML_NS as any)} className="glass rounded-2xl p-3 shadow-glow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-white">{activePlot.title}</div>
                      <div className="mt-0.5 text-[10px] text-white/60">Площадь: {activePlot.area}</div>
                    </div>
                    <button
                      className="rounded-lg px-2 py-1 text-[10px] font-semibold text-white/70 ring-1 ring-white/15 hover:bg-white/10"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setActive(null)
                      }}
                    >
                      закрыть
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-white/70 leading-snug">{activePlot.desc}</div>
                  <div className="mt-2 text-[10px] text-white/50">Нажмите на A/B/C, чтобы переключаться</div>
                </div>
              </motion.foreignObject>
            )}
          </AnimatePresence>
        </svg>
      </div>
    </div>
  )
}
