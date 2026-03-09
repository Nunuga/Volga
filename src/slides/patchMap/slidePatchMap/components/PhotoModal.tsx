import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useEffect, useState } from 'react'

/**
 * ✅ Лайтбокс
 */
export function PhotoModal({
  open,
  title,
  images,
  startIndex,
  onClose,
}: {
  open: boolean
  title: string
  images: string[]
  startIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)

  useEffect(() => {
    if (!open) return
    setIdx(startIndex)
  }, [open, startIndex])

  const hasImages = Array.isArray(images) && images.length > 0
  const safeIdx = hasImages ? Math.max(0, Math.min(idx, images.length - 1)) : 0

  const prev = useCallback(() => {
    if (!hasImages) return
    setIdx((v) => (v - 1 + images.length) % images.length)
  }, [hasImages, images.length])

  const next = useCallback(() => {
    if (!hasImages) return
    setIdx((v) => (v + 1) % images.length)
  }, [hasImages, images.length])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, prev, next])

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
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-extrabold text-white/90">{title}</div>
                <div className="mt-1 text-[12px] text-white/55">
                  фото: {safeIdx + 1}/{Math.max(1, images.length)}
                </div>
              </div>

              <button onClick={onClose} className="rounded-2xl px-3 py-2 text-[13px] font-bold text-white/80 ring-1 ring-white/15 hover:bg-white/10">
                Закрыть ✕
              </button>
            </div>

            <div className="relative">
              <div className="relative h-[min(70vh,640px)] w-full bg-black/30">
                {hasImages ? <img src={images[safeIdx]} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full select-none object-contain" /> : null}
              </div>

              {hasImages && images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      prev()
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-2xl px-3 py-2 text-[14px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                  >
                    ←
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      next()
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-2xl px-3 py-2 text-[14px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                  >
                    →
                  </button>
                </>
              )}
            </div>

            {hasImages && images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto px-5 py-4">
                {images.slice(0, 12).map((src, i) => {
                  const active = i === safeIdx
                  return (
                    <button
                      key={src + i}
                      onClick={() => setIdx(i)}
                      className="h-[64px] w-[92px] flex-none overflow-hidden rounded-2xl border"
                      style={{ borderColor: active ? 'rgba(165,241,91,0.55)' : 'rgba(255,255,255,0.12)' }}
                      title="Открыть фото"
                    >
                      <img src={src} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" />
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
