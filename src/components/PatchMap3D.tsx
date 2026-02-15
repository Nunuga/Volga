import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import TiltCard from './TiltCard'
import { PATCH_PATH, PATCH_POINTS, PATCH_VIEWBOX, PatchPoint } from '../data/patchData'

export default function PatchMap3D() {
  const [active, setActive] = useState<string | null>('p1')
  const points = useMemo(() => PATCH_POINTS, [])
  const current = points.find((p) => p.id === active)

  return (
    <div className="relative">
      <div className="absolute -inset-10 rounded-[44px] bg-white/5 blur-2xl" />

      <TiltCard className="relative">
        <div
          className="relative mx-auto w-full max-w-[960px]"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'perspective(1200px) rotateX(55deg) rotateZ(-2deg)',
          }}
        >
          <div className="relative overflow-hidden rounded-[40px] ring-1 ring-white/15 shadow-soft">
            <svg viewBox={PATCH_VIEWBOX} className="h-auto w-full">
              <defs>
                <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="rgba(165,241,91,0.16)" />
                  <stop offset="0.4" stopColor="rgba(30,201,168,0.14)" />
                  <stop offset="1" stopColor="rgba(245,240,215,0.09)" />
                </linearGradient>
                <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
                  <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="rgba(0,0,0,0.55)" />
                </filter>
              </defs>

              {/* water background */}
              <rect x="0" y="0" width="1000" height="640" fill="rgba(7,28,44,1)" />
              <path
                d="M-40 520 C 160 420, 380 590, 560 520 C 740 450, 860 520, 1040 440 L 1040 760 L -40 760 Z"
                fill="rgba(11,42,74,0.85)"
              />
              <motion.path
                d="M-40 530 C 170 430, 390 610, 570 530 C 750 455, 870 530, 1040 450"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0.55, opacity: 0.12 }}
                animate={{ pathLength: [0.55, 0.8, 0.55], opacity: [0.10, 0.24, 0.10] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* patch */}
              <g filter="url(#shadow)">
                <path d={PATCH_PATH} fill="url(#land)" stroke="rgba(255,255,255,0.24)" strokeWidth="2" />
                <path d={PATCH_PATH} fill="none" stroke="rgba(165,241,91,0.50)" strokeWidth="4" opacity="0.55" />
              </g>

              {/* points */}
              {points.map((p) => {
                const isActive = p.id === active
                const cx = (p.x / 100) * 1000
                const cy = (p.y / 100) * 640
                return (
                  <g
                    key={p.id}
                    onClick={() => setActive((v) => (v === p.id ? null : p.id))}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle cx={cx} cy={cy} r={isActive ? 12 : 10} fill="rgba(165,241,91,0.70)" />
                    <circle cx={cx} cy={cy} r={isActive ? 5 : 4} fill="rgba(255,255,255,0.95)" />
                    <circle cx={cx} cy={cy} r={isActive ? 18 : 16} fill="none" stroke="rgba(30,201,168,0.35)" strokeWidth="2" />
                  </g>
                )
              })}
            </svg>

            {/* floating info card */}
            <AnimatePresence>
              {current && <InfoCard point={current} onClose={() => setActive(null)} />}
            </AnimatePresence>
          </div>
        </div>
      </TiltCard>
    </div>
  )
}

function InfoCard({ point, onClose }: { point: PatchPoint; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.22 }}
      className="absolute left-6 top-6 max-w-[360px] glass rounded-2xl p-4 shadow-glow"
      style={{ transform: 'translateZ(60px)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{point.title}</div>
          <div className="mt-0.5 text-xs text-white/60">{point.subtitle}</div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-[10px] font-semibold text-white/70 ring-1 ring-white/15 hover:bg-white/10"
        >
          закрыть
        </button>
      </div>
      <ul className="mt-3 space-y-1 text-xs text-white/70">
        {point.bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-volga-lime/70" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 text-[10px] text-white/50">Нажмите на точки — информация меняется</div>
    </motion.div>
  )
}
