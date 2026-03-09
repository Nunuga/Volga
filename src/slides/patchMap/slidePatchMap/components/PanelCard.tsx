import { motion } from 'framer-motion'
import React from 'react'
import type { Pin } from '../types'

/**
 * ✅ Карточка
 */
export function PanelCard({
  pin,
  active,
  selected,
  activeIdx,
  onSelect,
  onSetActiveIdx,
  onOpenModal,
}: {
  pin: Pin
  active: boolean
  selected: boolean
  activeIdx: number
  onSelect: () => void
  onSetActiveIdx: (idx: number) => void
  onOpenModal: (startIdx: number) => void
}) {
  const images = Array.isArray(pin.images) ? pin.images : []
  const hasImages = images.length > 0
  const safeIdx = hasImages ? Math.max(0, Math.min(activeIdx, images.length - 1)) : 0

  const bg = selected
    ? 'linear-gradient(135deg, rgba(12,28,44,0.96), rgba(6,14,22,0.88))'
    : active
      ? 'linear-gradient(135deg, rgba(12,28,44,0.92), rgba(6,14,22,0.84))'
      : 'linear-gradient(135deg, rgba(12,28,44,0.80), rgba(6,14,22,0.72))'

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const borderColor = selected ? 'rgba(165,241,91,0.30)' : active ? 'rgba(165,241,91,0.18)' : 'rgba(255,255,255,0.12)'

  return (
    <motion.div
      className="relative overflow-hidden rounded-[28px] p-5"
      style={{
        background: bg,
        // border: `1px solid ${borderColor}`,
        boxShadow: selected ? '0 40px 110px rgba(0,0,0,0.72)' : active ? '0 30px 90px rgba(0,0,0,0.62)' : '0 18px 55px rgba(0,0,0,0.48)',
        backdropFilter: 'blur(18px)',
      }}
      animate={{ scale: selected ? 1.01 : 1 }}
      transition={{ duration: 0.16 }}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onSelect()}
    >
      <div className="relative mt-1 flex gap-4">
        <div className="min-w-0 flex-1">
          <div
            className="font-black text-white/95"
            style={{
              fontSize: 'clamp(18px, 1.15vw, 22px)',
              lineHeight: 1.12,
              textShadow: '0 10px 28px rgba(0,0,0,0.40)',
              wordBreak: 'break-word',
            }}
            title={pin.title}
          >
            {pin.title}
          </div>

          <div className="mt-2 text-[13px] text-white/65"></div>

          <ul className="mt-4 space-y-2 pl-5 text-[15px] font-semibold leading-[1.55] text-white/90">
            {pin.lines.map((t) => (
              <li key={t} style={{ wordBreak: 'break-word' }}>
                {t}
              </li>
            ))}
          </ul>

          {pin.href ? (
            <div className="mt-4 flex">
              <a
                href={pin.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2  rounded-2xl px-4 py-3 text-[14px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                style={{ boxShadow: '0 1px 12px rgba(12, 106, 113, 0.55)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {pin.ctaLabel ?? 'Открыть'} ↗
              </a>
            </div>
          ) : null}
        </div>

        {hasImages && (
          <div className="w-[300px] flex-none">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelect()
                onOpenModal(safeIdx)
              }}
              className="relative h-[210px] w-full overflow-hidden rounded-[22px] border"
              style={{
                borderColor: 'rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.06)',
                boxShadow: '0 18px 55px rgba(0,0,0,0.35)',
              }}
              title="Открыть фото"
            >
              <img src={images[safeIdx]} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.0) 55%), radial-gradient(700px 260px at 20% 0%, rgba(165,241,91,0.14), transparent 60%)',
                }}
              />
              <div className="absolute bottom-3 left-3 rounded-2xl bg-black/35 px-3 py-1 text-[12px] font-extrabold text-white/90 ring-1 ring-white/10">открыть</div>
            </button>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.slice(0, 6).map((src, i) => {
                const isActive = i === safeIdx
                return (
                  <button
                    key={src + i}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect()
                      onSetActiveIdx(i)
                      onOpenModal(i)
                    }}
                    className="h-[66px] overflow-hidden rounded-2xl border"
                    style={{
                      borderColor: isActive ? 'rgba(165,241,91,0.55)' : 'rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.06)',
                    }}
                    title="Открыть фото"
                  >
                    <img src={src} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" />
                  </button>
                )
              })}
            </div>

            <div className="mt-2 text-[12px] text-white/55">
              фото: {safeIdx + 1}/{images.length}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(800px 280px at 20% 110%, rgba(165,241,91,0.10), transparent 55%)',
          }}
        />
      )}
    </motion.div>
  )
}
