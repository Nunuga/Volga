import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import mapImg from '../assets/map4.png'
import { IMAGE_VIEWBOX } from '../data/parcelPaths'
import c1_1 from '../assets/c1-1.png'
import c1_2 from '../assets/c1-2.png'
import c1_3 from '../assets/c1-3.png'
import c1_4 from '../assets/c1-4.png'
import c3_1 from '../assets/c3-1.png'
import c3_2 from '../assets/c3-2.png'
import c2_1 from '../assets/c2-1.jpeg'
import c2_2 from '../assets/c2-2.jpeg'
import c2_3 from '../assets/c2-3.jpeg'
import c4_1 from '../assets/c4-1.png'
import c5_1 from '../assets/c5-1.png'
import c5_2 from '../assets/c5-2.png'

type FitBox = { left: number; top: number; width: number; height: number; cw: number; ch: number }
type PinVariant = 'default' | 'mine'

type Pin = {
  id: string
  x: number
  y: number
  title: string
  lines: string[]
  href?: string
  ctaLabel?: string
  variant?: PinVariant
  images?: string[]
}

type Quote = { text: string; author?: string; sub?: string }

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

// ✅ РАСТУШЁВКА ТОЛЬКО СПРАВА
const dissolveMaskStyle: React.CSSProperties = {
  WebkitMaskImage: 'linear-gradient(to right, black 0%, black 78%, transparent 100%)',
  maskImage: 'linear-gradient(to right, black 0%, black 78%, transparent 100%)',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
}

// ✅ ЦИТАТЫ
const QUOTES: Quote[] = [
  { text: 'Жизнь на большой воде', author: '', sub: '' },
  { text: 'Статусная инфраструктура', author: '', sub: '' },
  { text: 'Жизнь которую вы заслужили', author: '', sub: '' },
]

function parseViewBox(vb: string) {
  const parts = vb
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => Number.isFinite(n))
  if (parts.length !== 4) return { minX: 0, minY: 0, vbW: 1, vbH: 1 }
  const [minX, minY, vbW, vbH] = parts
  return { minX, minY, vbW, vbH }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function clientToSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const inv = ctm.inverse()
  const res = pt.matrixTransform(inv)
  return { x: res.x, y: res.y }
}

/**
 * ✅ Маркер (с фиксом stopPropagation на pointerdown, чтобы фон не закрывал карточку до onClick)
 */
function PremiumMarker({
  x,
  y,
  active,
  selected,
  variant = 'default',
  onClick,
  onHover,
  editMode,
  onDragStart,
}: {
  x: number
  y: number
  active: boolean
  selected: boolean
  variant?: PinVariant
  onClick?: () => void
  onHover?: (v: boolean) => void
  editMode?: boolean
  onDragStart?: (e: React.PointerEvent<SVGGElement>) => void
}) {
  const isMine = variant === 'mine'
  const emphasized = isMine || active || selected

  const accent = isMine
    ? 'rgba(255, 214, 70, 0.98)'
    : emphasized
      ? 'rgba(255, 70, 90, 0.98)'
      : 'rgba(90, 255, 245, 0.92)'

  const accentSoft = isMine
    ? 'rgba(255, 214, 70, 0.42)'
    : emphasized
      ? 'rgba(255, 70, 90, 0.55)'
      : 'rgba(90, 255, 245, 0.34)'

  const scale = isMine ? 1.22 : selected ? 1.38 : active ? 1.24 : 1.14
  const pulseFast = selected ? 0.95 : 1.25
  const haloOpacity = selected ? 0.95 : active ? 0.8 : 0.55

  return (
    <g
      transform={`translate(${x} ${y})`}
      style={{ cursor: editMode ? 'grab' : onClick ? 'pointer' : 'default' }}
      onClick={(e) => {
        if (!onClick || editMode) return
        e.stopPropagation()
        onClick()
      }}
      onPointerDown={(e) => {
        // ✅ важно: чтобы клик по маркеру не вызывал onPointerDown фона (который закрывает карточку)
        e.stopPropagation()

        if (!editMode || !onDragStart) return
        onDragStart(e)
      }}
      onPointerEnter={() => onHover?.(true)}
      onPointerLeave={() => onHover?.(false)}
    >
      <motion.g
        transform={`scale(${scale})`}
        initial={false}
        animate={selected ? { y: [0, -1.2, 0] } : { y: 0 }}
        transition={selected ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        <circle r="3.1" fill="rgba(255,255,255,0.92)" />
        <circle r="9.5" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2.4" />

        {emphasized && (
          <>
            <motion.circle
              r={selected ? 30 : 26}
              fill="none"
              stroke={accentSoft}
              strokeWidth="2.6"
              initial={{ opacity: 0.85, scale: 0.55 }}
              animate={{ opacity: [0.85, 0.0], scale: [0.55, 2.25] }}
              transition={{ duration: pulseFast, repeat: Infinity, ease: 'easeOut' }}
              style={{ mixBlendMode: 'screen' as any }}
            />
            <motion.circle
              r={selected ? 24 : 21}
              fill="none"
              stroke={accent}
              strokeWidth="2.2"
              initial={{ opacity: 0.65, scale: 0.62 }}
              animate={{ opacity: [0.65, 0.0], scale: [0.62, 1.95] }}
              transition={{ duration: pulseFast, repeat: Infinity, ease: 'easeOut', delay: pulseFast * 0.28 }}
              style={{ mixBlendMode: 'screen' as any }}
            />
            <motion.circle
              r={selected ? 18 : 16}
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="1.6"
              initial={{ opacity: 0.35, scale: 0.78 }}
              animate={{ opacity: [0.35, 0.0], scale: [0.78, 1.55] }}
              transition={{ duration: pulseFast, repeat: Infinity, ease: 'easeOut', delay: pulseFast * 0.52 }}
              style={{ mixBlendMode: 'screen' as any }}
            />
          </>
        )}

        {/* <ellipse cx="0" cy="34" rx="22" ry="9" fill="rgba(0,0,0,0.40)" /> */}

        <g filter={isMine ? 'url(#pinGlowMine)' : 'url(#pinGlow)'} opacity={0.995}>
          <path
            d="
              M 0 0
              C 18 0, 32 -14, 32 -32
              C 32 -54, 18 -72, 0 -72
              C -18 -72, -32 -54, -32 -32
              C -32 -14, -18 0, 0 0
              Z
            "
            fill={isMine ? 'url(#pinBodyMine)' : 'url(#pinBody)'}
          />

          {/* <circle cx="0" cy="-44" r="18" fill={isMine ? 'url(#pinHeadMine)' : 'url(#pinHead)'} filter="url(#pinShadow)" /> */}
          <circle cx="-6" cy="-52" r="5.6" fill="rgba(255,255,255,0.62)" />
          {/* <circle cx="0" cy="-44" r="7.2" fill="rgba(10,18,28,0.55)" /> */}

          <motion.circle
            cx="0"
            cy="-44"
            r="9.2"
            fill="none"
            stroke={accent}
            strokeWidth="2.2"
            initial={false}
            animate={{
              opacity: emphasized ? haloOpacity : 0.45,
              scale: selected ? [1.0, 1.12, 1.0] : active ? [1.0, 1.08, 1.0] : 1.0,
            }}
            transition={selected ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.22 }}
            style={{ mixBlendMode: 'screen' as any }}
          />

          <motion.path
            d="
              M 0 0
              C 18 0, 32 -14, 32 -32
              C 32 -54, 18 -72, 0 -72
              C -18 -72, -32 -54, -32 -32
              C -32 -14, -18 0, 0 0
              Z
            "
            fill="none"
            stroke={accent}
            strokeWidth="2.6"
            initial={false}
            animate={{ opacity: emphasized ? 0.92 : 0.55 }}
            transition={{ duration: 0.2 }}
            style={{ mixBlendMode: 'screen' as any }}
          />
        </g>

        {isMine && (
          <g transform="translate(0 -92)">
            <rect x={48} y={35} width={310} height={38} rx={14} fill="rgba(12,28,44,0.74)" stroke="rgba(255,255,255,0.18)" />
            <text x={200} y={60} textAnchor="middle" fill="rgba(255,255,255,0.94)" fontSize={25} fontWeight={900} fontFamily="ui-sans-serif">
              Реализуемая территория 
            </text>
          </g>
        )}
      </motion.g>
    </g>
  )
}

/**
 * ✅ Лайтбокс
 */
function PhotoModal({
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
                {hasImages ? <img src={images[safeIdx]} alt="" draggable={false} className="h-full w-full select-none object-contain" /> : null}
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
                      <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
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

/**
 * ✅ Карточка — убраны “серые полосы” (ring/внутренние полосы). Оставлен нормальный border.
 */
function PanelCard({
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

  const borderColor = selected ? 'rgba(165,241,91,0.30)' : active ? 'rgba(165,241,91,0.18)' : 'rgba(255,255,255,0.12)'

  return (
    <motion.div
      className="relative overflow-hidden rounded-[28px] p-5"
      style={{
        background: bg,
        // border: `1px solid ${borderColor}`,
        boxShadow: selected
          ? '0 40px 110px rgba(0,0,0,0.72)'
          : active
            ? '0 30px 90px rgba(0,0,0,0.62)'
            : '0 18px 55px rgba(0,0,0,0.48)',
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
                style={{boxShadow: '0 1px 12px rgba(12, 106, 113, 0.55)' }}
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
              <img src={images[safeIdx]} alt="" draggable={false} className="h-full w-full object-cover" />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.0) 55%), radial-gradient(700px 260px at 20% 0%, rgba(165,241,91,0.14), transparent 60%)',
                }}
              />
              <div className="absolute bottom-3 left-3 rounded-2xl bg-black/35 px-3 py-1 text-[12px] font-extrabold text-white/90 ring-1 ring-white/10">
                открыть
              </div>
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
                    <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
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

/**
 * ДАННЫЕ
 */
const MY_TERRITORY: Pin = {
  id: 'my-territory',
  x: -95,
  y: -600,
  title: 'Реализуемая территория',
  lines: [''],
  variant: 'mine',
}

const COMPARE_PINS_FALLBACK: Pin[] = [
  {
    id: 'c1',
    x: 5.19,
    y: -462.06,
    title: 'Коттеджный посёлок «Премиальный курорт Port Emm Zavidovo (Порт Эмм Завидово)»',
    lines: ['Застройщик • Самолет','Площади земельного участка • от 8 до 10 соток','Дома • от 193,25 м² до 399,1 м².', 'Цена • от 49 682 884 до 93 523 108 ₽'],
    href: 'https://samolet.ru/houses/port-emm/?utm_referrer=https://www.google.com/',
    ctaLabel: 'Открыть',
    images: [c2_1, c2_2, c2_3],
  },
  {
    id: 'c2',
    x: 610.14,
    y: -310.05,
    title: 'Коттеджный поселок «Екатериновка»',
    lines: ['Площади земельного участка • от 10 до 80 соток','Дома • от 194 м² до 808 м².','Цена • от 18 800 000 до 258 000 000 ₽'],
    href: 'https://ekaterinovka.club/',
    ctaLabel: 'Открыть',
    images: [c1_1,  c1_3, c1_4],
  },
  {
    id: 'c3',
    x: 1438.8,
    y: 900.63,
    title: 'Коттеджный посёлок «Волжский Берег»',
    lines: ['Площади земельного участка • от 8 до 30 соток','Дома • от 103 м² до 358 м².','Цена • от 15 000 000 до 253 000 000 ₽'],
    href: 'https://v-bereg.info/',
    ctaLabel: 'Открыть',
    images: [c3_1, c3_2],
  },
  {
    id: 'c4',
    x: 1366.73,
    y: 904.31,
    title: 'Коттеджный посёлок «Волжские рассветы»',
    lines: ['Отсутствует выход к Волге','Площади земельного участка • от 10 до 22 соток','Дома • по запросу','Цена • от 8 200 000 до 18 800 000 ₽'],
    href: 'https://vrassveti.ru/',
    ctaLabel: 'Открыть',
    images: [c4_1,],
  },
  {
    id: 'c5',
    x: 1425.67,
    y: 917.24,
    title: 'Коттеджный посёлок «Волга Вилладж»',
    lines: ['Площади земельного участка • от 11 до 22 соток','Дома • от 172 м² до 540 м².','Цена • от 13 000 000 до 75 000 000 ₽'],
    href: 'https://volgavillage.ru/',
    ctaLabel: 'Открыть',
    images: [c5_1, c5_2],
  },
]

export default function SlidePatchMap() {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const [fit, setFit] = useState<FitBox | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ✅ Редактор маркеров
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [lockRemotePins, setLockRemotePins] = useState(false)
  const draggingIdRef = useRef<string | null>(null)

  // ✅ Quotes
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [quotePaused, setQuotePaused] = useState(false)

  // ✅ Popup ABSOLUTE (внутри stage) + clamp (не переносится при скролле страниц)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const [popupTick, setPopupTick] = useState(0)
  const [popupPos, setPopupPos] = useState<{ left: number; top: number; placement: 'top' | 'bottom' } | null>(null)

  // ✅ contain: не растягиваем и не обрезаем
  const recalc = useCallback(() => {
    const stage = stageRef.current
    const img = imgRef.current
    if (!stage || !img) return

    const cw = stage.clientWidth
    const ch = stage.clientHeight
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    if (!nw || !nh) return

    const scale = Math.min(cw / nw, ch / nh)
    const width = nw * scale
    const height = nh * scale

    const left = 0
    const top = (ch - height) / 2

    setFit({ left, top, width, height, cw, ch })
  }, [])

  useLayoutEffect(() => {
    recalc()
    const stage = stageRef.current
    if (!stage) return
    const ro = new ResizeObserver(() => recalc())
    ro.observe(stage)
    return () => ro.disconnect()
  }, [recalc])

  const [comparePins, setComparePins] = useState<Pin[]>(COMPARE_PINS_FALLBACK)

  // API -> merge с fallback (чтобы c3 не потерялся)
  useEffect(() => {
    if (lockRemotePins) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/cians/compare', { method: 'GET' })
        if (!res.ok) return
        const json = (await res.json()) as { items?: Pin[] }
        if (cancelled) return

        if (Array.isArray(json.items) && json.items.length) {
          const map = new Map<string, Pin>()
          json.items.forEach((p) => map.set(p.id, p))
          COMPARE_PINS_FALLBACK.forEach((p) => {
            if (!map.has(p.id)) map.set(p.id, p)
          })
          setComparePins(Array.from(map.values()))
        }
      } catch {
        // fallback
      }
    })()
    return () => {
      cancelled = true
    }
  }, [lockRemotePins])

  const cards: Pin[] = useMemo(() => comparePins.filter((p) => p.id !== MY_TERRITORY.id), [comparePins])
  const pins: Pin[] = useMemo(() => [MY_TERRITORY, ...cards], [cards])

  // per-card photo index
  const [cardIdx, setCardIdx] = useState<Record<string, number>>({})
  const setIdxFor = useCallback((id: string, idx: number) => setCardIdx((m) => ({ ...m, [id]: idx })), [])

  // Modal
  const [modal, setModal] = useState<{ pinId: string; startIdx: number } | null>(null)
  const openModal = useCallback((pinId: string, startIdx: number) => setModal({ pinId, startIdx }), [])
  const closeModal = useCallback(() => setModal(null), [])

  const modalPin = useMemo(() => {
    if (!modal) return null
    return cards.find((p) => p.id === modal.pinId) ?? null
  }, [modal, cards])

  const selectedPin = useMemo(() => {
    if (!selectedId) return null
    return cards.find((p) => p.id === selectedId) ?? null
  }, [selectedId, cards])

  // ✅ позиция якоря popup (SVG -> px внутри fit)
  const popupPx = useMemo(() => {
    if (!fit || !selectedPin) return null
    const { minX, minY, vbW, vbH } = parseViewBox(IMAGE_VIEWBOX)
    const scale = Math.min(fit.width / vbW, fit.height / vbH)
    const dx = (fit.width - vbW * scale) / 2
    const dy = (fit.height - vbH * scale) / 2
    const px = (selectedPin.x - minX) * scale + dx
    const py = (selectedPin.y - minY) * scale + dy
    return { x: px, y: py }
  }, [fit, selectedPin])

  useEffect(() => {
    // при смене выбранного — сброс, чтобы без “прыжка”
    setPopupPos(null)
  }, [selectedPin?.id, cardIdx[selectedPin?.id ?? '']])

  // ✅ Автопрокрутка цитат
  useEffect(() => {
    if (quotePaused) return
    if (QUOTES.length <= 1) return
    const t = window.setInterval(() => setQuoteIdx((i) => (i + 1) % QUOTES.length), 6500)
    return () => window.clearInterval(t)
  }, [quotePaused])

  const prevQuote = useCallback(() => setQuoteIdx((i) => (i - 1 + QUOTES.length) % QUOTES.length), [])
  const nextQuote = useCallback(() => setQuoteIdx((i) => (i + 1) % QUOTES.length), [])

  // ✅ helper: обновить пин
  const updatePin = useCallback((id: string, patch: Partial<Pin>) => {
    setLockRemotePins(true)
    setComparePins((arr) => arr.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const deletePin = useCallback((id: string) => {
    setLockRemotePins(true)
    setComparePins((arr) => arr.filter((p) => p.id !== id))
    setEditingId((cur) => (cur === id ? null : cur))
    setSelectedId((cur) => (cur === id ? null : cur))
    setHoverId((cur) => (cur === id ? null : cur))
  }, [])

  const makeNewPin = useCallback(
    (x: number, y: number) => {
      setLockRemotePins(true)
      const base = `m${Math.random().toString(36).slice(2, 6)}`
      const id = comparePins.some((p) => p.id === base) ? `${base}-${Date.now()}` : base
      const pin: Pin = {
        id,
        x: round2(x),
        y: round2(y),
        title: 'Новый объект',
        lines: ['Описание 1', 'Описание 2'],
        href: '',
        ctaLabel: 'Открыть',
        images: [],
      }
      setComparePins((arr) => [...arr, pin])
      setEditingId(id)
      setSelectedId(id)
      setHoverId(id)
    },
    [comparePins],
  )

  const copyCoordsSnippet = useCallback(async () => {
    const coords = comparePins.map((p) => ({ id: p.id, x: round2(p.x), y: round2(p.y) }))
    const text = `// coords export\nconst PINS_COORDS = ${JSON.stringify(coords, null, 2)} as const\n`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // ignore
    }
    return text
  }, [comparePins])

  // ✅ SVG editor interactions
  const onSvgPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!editorOpen) return
      const svg = svgRef.current
      if (!svg) return
      if (e.button !== 0) return

      const pt = clientToSvgPoint(svg, e.clientX, e.clientY)
      if (!pt) return

      if (e.shiftKey || !editingId) {
        makeNewPin(pt.x, pt.y)
        return
      }

      updatePin(editingId, { x: round2(pt.x), y: round2(pt.y) })
    },
    [editorOpen, editingId, makeNewPin, updatePin],
  )

  const onSvgPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!editorOpen) return
      const id = draggingIdRef.current
      if (!id) return
      const svg = svgRef.current
      if (!svg) return
      const pt = clientToSvgPoint(svg, e.clientX, e.clientY)
      if (!pt) return
      updatePin(id, { x: round2(pt.x), y: round2(pt.y) })
    },
    [editorOpen, updatePin],
  )

  const onSvgPointerUp = useCallback(() => {
    if (!editorOpen) return
    draggingIdRef.current = null
  }, [editorOpen])

  const startDrag = useCallback(
    (id: string, e: React.PointerEvent<SVGGElement>) => {
      if (!editorOpen) return
      draggingIdRef.current = id
      setEditingId(id)
      setSelectedId(id)
      setHoverId(id)
      try {
        ;(e.currentTarget as any).setPointerCapture?.(e.pointerId)
      } catch {
        // ignore
      }
    },
    [editorOpen],
  )

  // ✅ текущий редактируемый пин
  const editingPin = useMemo(() => {
    if (!editingId) return null
    return comparePins.find((p) => p.id === editingId) ?? null
  }, [editingId, comparePins])

  // ✅ текст для ручного копирования
  const coordsText = useMemo(() => {
    const coords = comparePins.map((p) => ({ id: p.id, x: round2(p.x), y: round2(p.y) }))
    return `// coords export\nconst PINS_COORDS = ${JSON.stringify(coords, null, 2)} as const\n`
  }, [comparePins])

  // ✅ re-measure popup when size changes
  useEffect(() => {
    if (!selectedPin || editorOpen) return
    const bump = () => setPopupTick((t) => t + 1)
    window.addEventListener('resize', bump)

    const el = popupRef.current
    if (!el) return () => window.removeEventListener('resize', bump)

    const ro = new ResizeObserver(() => bump())
    ro.observe(el)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', bump)
    }
  }, [selectedPin?.id, editorOpen])

  // ✅ clamp popup (ABSOLUTE внутри stage, + ограничиваем справа до начала растушевки)
  useLayoutEffect(() => {
    if (!fit || !popupPx || !selectedPin || editorOpen) return
    const el = popupRef.current
    if (!el) return

    const pad = 14
    const gap = 16

    // граница начала растушёвки (78% ширины) — не заходим правее
    const fadeStartX = Math.round(fit.cw * 0.78)
    const rightLimit = Math.max(pad + 320, fadeStartX - pad)

    const w = el.offsetWidth
    const h = el.offsetHeight

    // anchor в координатах stage (не viewport!)
    const anchorX = fit.left + popupPx.x
    const anchorY = fit.top + popupPx.y

    const spaceAbove = anchorY - pad
    const spaceBelow = fit.ch - anchorY - pad

    let placement: 'top' | 'bottom' = 'top'
    if (spaceAbove >= h + gap) placement = 'top'
    else if (spaceBelow >= h + gap) placement = 'bottom'
    else placement = spaceBelow > spaceAbove ? 'bottom' : 'top'

    let top = placement === 'top' ? anchorY - gap - h : anchorY + gap
    let left = anchorX - w / 2

    // clamp X (в пределах stage + до rightLimit)
    const minLeft = pad
    const maxLeft = Math.max(pad, rightLimit - w)
    left = clamp(left, minLeft, maxLeft)

    // clamp Y (в пределах stage)
    const minTop = pad
    const maxTop = Math.max(pad, fit.ch - pad - h)
    top = clamp(top, minTop, maxTop)

    setPopupPos({ left, top, placement })
  }, [fit?.cw, fit?.ch, fit?.left, fit?.top, popupPx?.x, popupPx?.y, selectedPin?.id, editorOpen, popupTick, cardIdx[selectedPin?.id ?? '']])

  const togglePin = useCallback((id: string) => {
    setSelectedId((cur) => {
      const next = cur === id ? null : id
      setHoverId(next ? id : null)
      return next
    })
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-eco-gradient noise">
      <div ref={stageRef} className="absolute inset-0 overflow-hidden">
        {/* ✅ Подложка */}
        <div className="absolute inset-0 pointer-events-none" style={dissolveMaskStyle}>
          <img
            src={mapImg}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-3xl opacity-55"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(1200px 600px at 15% 20%, rgba(165,241,91,0.10), transparent 55%), linear-gradient(180deg, rgba(6,14,22,0.35), rgba(6,14,22,0.62))',
            }}
          />
        </div>

        {/* preload natural sizes */}
        <img ref={imgRef} src={mapImg} alt="" className="absolute pointer-events-none opacity-0" aria-hidden="true" onLoad={recalc} />

        {fit && (
          <>
            {/* ✅ основной слой карты (contain, без обрезки) */}
            <div
              className="absolute z-10"
              style={{
                left: fit.left,
                top: fit.top,
                width: fit.width,
                height: fit.height,
                ...dissolveMaskStyle,
              }}
            >
              <img src={mapImg} alt="Карта" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(165,241,91,0.10),transparent_62%)]" />
            </div>

            {/* markers layer — поверх всех слоев (кроме карточек/модалки) */}
            <div
              className="pointer-events-auto absolute z-[80]"
              style={{ left: fit.left, top: fit.top, width: fit.width, height: fit.height, overflow: 'visible' }}
              onPointerDown={() => {
                if (editorOpen) return
                setSelectedId(null)
                setHoverId(null)
                setPopupPos(null)
              }}
            >
              <svg
                ref={svgRef}
                viewBox={IMAGE_VIEWBOX}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 h-full w-full"
                style={{ overflow: 'visible' }}
                onPointerLeave={() => setHoverId(null)}
                onPointerDown={onSvgPointerDown}
                onPointerMove={onSvgPointerMove}
                onPointerUp={onSvgPointerUp}
                onPointerCancel={onSvgPointerUp}
              >
                <defs>
                  <radialGradient id="pinHead" cx="30%" cy="22%" r="85%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
                    <stop offset="40%" stopColor="rgba(90,255,245,0.98)" />
                    <stop offset="100%" stopColor="rgba(40,190,255,0.95)" />
                  </radialGradient>
                  <linearGradient id="pinBody" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(235,255,255,0.95)" />
                    <stop offset="55%" stopColor="rgba(90,255,245,0.62)" />
                    <stop offset="100%" stopColor="rgba(40,90,255,0.60)" />
                  </linearGradient>

                  <radialGradient id="pinHeadMine" cx="30%" cy="22%" r="85%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
                    <stop offset="45%" stopColor="rgba(255,214,70,0.99)" />
                    <stop offset="100%" stopColor="rgba(255,110,70,0.92)" />
                  </radialGradient>
                  <linearGradient id="pinBodyMine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,250,220,0.96)" />
                    <stop offset="55%" stopColor="rgba(255,214,70,0.66)" />
                    <stop offset="100%" stopColor="rgba(255,80,110,0.60)" />
                  </linearGradient>

                  <filter id="pinShadow" x="-90%" y="-90%" width="300%" height="300%">
                    <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="rgba(0,0,0,0.38)" />
                  </filter>

                  <filter id="pinGlow" x="-120%" y="-120%" width="340%" height="340%">
                    <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="rgba(90,255,245,0.55)" />
                    <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="rgba(40,190,255,0.28)" />
                    <feDropShadow dx="0" dy="0" stdDeviation="18" floodColor="rgba(255,70,90,0.18)" />
                  </filter>

                  <filter id="pinGlowMine" x="-120%" y="-120%" width="340%" height="340%">
                    <feDropShadow dx="0" dy="0" stdDeviation="9" floodColor="rgba(255,214,70,0.55)" />
                    <feDropShadow dx="0" dy="0" stdDeviation="15" floodColor="rgba(255,120,70,0.26)" />
                    <feDropShadow dx="0" dy="0" stdDeviation="18" floodColor="rgba(255,70,90,0.16)" />
                  </filter>
                </defs>

                <AnimatePresence>
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
                    {pins.map((p) => {
                      const isHovered = hoverId === p.id
                      const isSelected = selectedId === p.id
                      const canEdit = editorOpen && p.id !== MY_TERRITORY.id

                      return (
                        <PremiumMarker
                          key={`pin-${p.id}`}
                          x={p.x}
                          y={p.y}
                          variant={p.variant ?? 'default'}
                          active={isHovered}
                          selected={isSelected}
                          editMode={canEdit}
                          onHover={(v) => setHoverId(v ? p.id : null)}
                          onDragStart={(e) => startDrag(p.id, e)}
                          onClick={() => {
                            if (editorOpen) {
                              setEditingId(p.id)
                              setSelectedId(p.id)
                              setHoverId(p.id)
                              return
                            }
                            // ✅ toggle open/close
                            togglePin(p.id)
                          }}
                        />
                      )
                    })}
                  </motion.g>
                </AnimatePresence>
              </svg>
            </div>

            {/* ✅ POPUP карточка — ABSOLUTE, не переносится при скролле страниц */}
            <AnimatePresence>
              {!!selectedPin && !editorOpen && (
                <motion.div
                  ref={popupRef}
                  className="pointer-events-auto absolute"
                  style={{
                    left: popupPos?.left ?? 0,
                    top: popupPos?.top ?? 0,
                    zIndex: 95,
                    width: 'min(820px, calc(100% - 28px))',
                    maxHeight: 'calc(100% - 28px)',
                    overflowY: 'visible',
                    overscrollBehavior: 'none',
                    visibility: popupPos ? 'visible' : 'hidden',
                  }}
                  initial={{ opacity: 0, y: 10, scale: 0.992 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.992 }}
                  transition={{ duration: 0.16 }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <PanelCard
                    pin={selectedPin}
                    active
                    selected
                    activeIdx={cardIdx[selectedPin.id] ?? 0}
                    onSelect={() => {
                      setSelectedId(selectedPin.id)
                      setHoverId(selectedPin.id)
                    }}
                    onSetActiveIdx={(i) => setIdxFor(selectedPin.id, i)}
                    onOpenModal={(startIdx) => openModal(selectedPin.id, startIdx)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ✅ RIGHT AREA: цитаты — адаптивный текст + смещение влево до растушевки */}
            {(() => {
              const pad = -352

              // зона без растушевки: до 78% ширины
              const safeRight = Math.round(fit.cw * 0.78) - pad

              // ширина панели цитат + clamp
              const wBase = Math.round(fit.cw * 0.14)
              const w = clamp(wBase, 420, 760)
              const left = Math.max(pad, safeRight - w)

              const top = Math.max(pad, fit.top + pad)
              const height = Math.max(220, Math.min(fit.ch - pad * 2, fit.height - pad * 2))

              return (
                <div
                  className="absolute z-[70] pointer-events-auto"
                  style={{ left, top, width: w, height }}
                  onMouseEnter={() => setQuotePaused(true)}
                  onMouseLeave={() => setQuotePaused(false)}
                >
                  <div className="relative h-full p-3">
                    <div className="relative flex h-[calc(100%-56px)] items-center justify-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`quote-${quoteIdx}`}
                          className="w-full px-2 py-2"
                          initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
                          transition={{ duration: 0.22 }}
                        >
                          <div
                            className="font-extrabold leading-[1.25] text-white/92"
                            style={{
                              fontSize: 'clamp(12px, 1.1vw + 0.8rem, 24px)',
                              textShadow: '0 18px 70px rgba(0,0,0,0.88)',
                              wordBreak: 'break-word',
                            }}
                          >
                            “{QUOTES[quoteIdx]?.text ?? ''}”
                          </div>

                          {(QUOTES[quoteIdx]?.author || QUOTES[quoteIdx]?.sub) && (
                            <div
                              className="mt-4 font-semibold text-white/75"
                              style={{
                                fontSize: 'clamp(12px, 0.55vw + 0.45rem, 16px)',
                                textShadow: '0 14px 46px rgba(0,0,0,0.86)',
                              }}
                            >
                              {QUOTES[quoteIdx]?.author ? <span className="font-extrabold text-white/85">{QUOTES[quoteIdx]?.author}</span> : null}
                              {QUOTES[quoteIdx]?.author && QUOTES[quoteIdx]?.sub ? <span className="mx-2 text-white/45">•</span> : null}
                              {QUOTES[quoteIdx]?.sub ? <span className="text-white/70">{QUOTES[quoteIdx]?.sub}</span> : null}
                            </div>
                          )}

                          {/* <div
                            className="mt-6 font-semibold text-white/60"
                            style={{ fontSize: 'clamp(12px, 0.35vw + 0.5rem, 14px)', textShadow: '0 12px 40px rgba(0,0,0,0.86)' }}
                          >
                            {quoteIdx + 1}/{Math.max(1, QUOTES.length)}
                          </div> */}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* arrows bottom */}
                    <div className="absolute bottom-3 left-0 right-0 z-10 flex items-center justify-center gap-3">
                      <button
                        onClick={prevQuote}
                        className="rounded-2xl px-4 py-2 text-[14px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                        title="Предыдущая"
                        style={{ background: 'transparent' }}
                      >
                        ←
                      </button>
                      <button
                        onClick={nextQuote}
                        className="rounded-2xl px-4 py-2 text-[14px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                        title="Следующая"
                        style={{ background: 'transparent' }}
                      >
                        →
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ✅ TOOLBAR */}
            {/* <div className="absolute left-4 top-4 z-[85] pointer-events-auto flex gap-2">
              <button
                onClick={() => {
                  setEditorOpen((v) => !v)
                  setHoverId(null)
                  setSelectedId(null)
                  setPopupPos(null)
                }}
                className="rounded-2xl px-4 py-3 text-[13px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                style={{ background: 'rgba(10,20,30,0.35)', backdropFilter: 'blur(10px)' }}
                title="Редактор маркеров"
              >
                {editorOpen ? 'Редактор: ВЫКЛ' : 'Редактор маркеров'}
              </button>

              {editorOpen && (
                <button
                  onClick={() => {
                    const vb = parseViewBox(IMAGE_VIEWBOX)
                    makeNewPin(vb.minX + vb.vbW * 0.5, vb.minY + vb.vbH * 0.5)
                  }}
                  className="rounded-2xl px-4 py-3 text-[13px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                  style={{ background: 'rgba(10,20,30,0.35)', backdropFilter: 'blur(10px)' }}
                >
                  + Маркер
                </button>
              )}
            </div> */}

            {/* ✅ EDITOR PANEL */}
            <AnimatePresence>
              {editorOpen && (
                <motion.div
                  className="absolute left-4 top-[76px] z-[86] pointer-events-auto w-[min(420px,92vw)] overflow-hidden rounded-[28px] ring-1 ring-white/14"
                  style={{
                    background: 'linear-gradient(135deg, rgba(12,28,44,0.92), rgba(6,14,22,0.80))',
                    boxShadow: '0 30px 110px rgba(0,0,0,0.60)',
                    backdropFilter: 'blur(16px)',
                  }}
                  initial={{ opacity: 0, y: 14, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 14, scale: 0.99 }}
                  transition={{ duration: 0.18 }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="p-4">
                    <div className="text-[14px] font-extrabold text-white/90">Редактор маркеров</div>
                    <div className="mt-1 text-[12px] text-white/55">
                      <span className="font-bold text-white/75">Shift+клик</span> по карте — добавить •{' '}
                      <span className="font-bold text-white/75">drag</span> маркер — переместить • клик по карте — поставить выбранный
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="mb-1 block text-[12px] font-bold text-white/70">Маркер</label>
                        <select
                          className="w-full rounded-2xl bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                          value={editingId ?? ''}
                          onChange={(e) => setEditingId(e.target.value || null)}
                        >
                          <option value="" disabled>
                            выбери маркер…
                          </option>
                          {comparePins.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.id} — {p.title?.slice(0, 34) || 'без названия'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <div className="mt-2 rounded-2xl bg-white/5 px-3 py-2 text-[12px] font-semibold text-white/70 ring-1 ring-white/10">
                          Координаты:{' '}
                          <span className="text-white/90">{editingPin ? `${round2(editingPin.x)} , ${round2(editingPin.y)}` : '—'}</span>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="mb-1 block text-[12px] font-bold text-white/70">Название</label>
                        <input
                          value={editingPin?.title ?? ''}
                          onChange={(e) => editingPin && updatePin(editingPin.id, { title: e.target.value })}
                          className="w-full rounded-2xl bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                          placeholder="Заголовок"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="mb-1 block text-[12px] font-bold text-white/70">Пункты (каждая строка — новый пункт)</label>
                        <textarea
                          value={(editingPin?.lines ?? []).join('\n')}
                          onChange={(e) => {
                            if (!editingPin) return
                            const lines = e.target.value
                              .split('\n')
                              .map((s) => s.trim())
                              .filter(Boolean)
                            updatePin(editingPin.id, { lines: lines.length ? lines : [''] })
                          }}
                          className="h-[92px] w-full resize-none rounded-2xl bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                          placeholder="Строка 1\nСтрока 2"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="mb-1 block text-[12px] font-bold text-white/70">Ссылка</label>
                        <input
                          value={editingPin?.href ?? ''}
                          onChange={(e) => editingPin && updatePin(editingPin.id, { href: e.target.value })}
                          className="w-full rounded-2xl bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="mb-1 block text-[12px] font-bold text-white/70">Текст кнопки</label>
                        <input
                          value={editingPin?.ctaLabel ?? ''}
                          onChange={(e) => editingPin && updatePin(editingPin.id, { ctaLabel: e.target.value })}
                          className="w-full rounded-2xl bg-white/10 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                          placeholder="Открыть"
                        />
                      </div>

                      <div className="col-span-2 mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={async () => {
                            await copyCoordsSnippet()
                          }}
                          className="rounded-2xl px-4 py-2 text-[13px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                          title="Скопировать координаты всех маркеров"
                        >
                          Скопировать координаты
                        </button>

                        {editingPin && (
                          <button
                            onClick={() => deletePin(editingPin.id)}
                            className="rounded-2xl px-4 py-2 text-[13px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                            title="Удалить маркер"
                          >
                            Удалить
                          </button>
                        )}
                      </div>

                      <div className="col-span-2 mt-2">
                        <label className="mb-1 block text-[12px] font-bold text-white/70">Экспорт (если clipboard недоступен — копируй отсюда)</label>
                        <textarea
                          readOnly
                          value={coordsText}
                          className="h-[120px] w-full resize-none rounded-2xl bg-black/30 px-3 py-2 text-[12px] font-semibold text-white/75 ring-1 ring-white/10 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4 text-[12px] text-white/45">Совет: после расстановки — вставь экспорт в код и мержни координаты с твоими объектами.</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ✅ Photo modal */}
            <PhotoModal open={!!modal} title={modalPin?.title ?? ''} images={modalPin?.images ?? []} startIndex={modal?.startIdx ?? 0} onClose={closeModal} />
          </>
        )}
      </div>
    </div>
  )
}
