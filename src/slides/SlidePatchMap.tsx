import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import mapImg from '../assets/map3.png'
import { IMAGE_VIEWBOX } from '../data/parcelPaths'
import c1_1 from '../assets/c1-1.png'
import c1_2 from '../assets/c1-2.png'
import c1_3 from '../assets/c1-3.png'
import c3_1 from '../assets/c3-1.png'
import c3_2 from '../assets/c3-2.png'
import c2_1 from '../assets/c2-1.jpeg'
import c2_2 from '../assets/c2-2.jpeg'
import c2_3 from '../assets/c2-3.jpeg'


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

/**
 * ✅ Новый, более заметный маркер:
 * - крупнее
 * - ярче
 * - другая форма
 * - мощная пульсация/гало
 */
function PremiumMarker({
  x,
  y,
  active,
  selected,
  variant = 'default',
  onClick,
  onHover,
}: {
  x: number
  y: number
  active: boolean
  selected: boolean
  variant?: PinVariant
  onClick?: () => void
  onHover?: (v: boolean) => void
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

  // ✅ крупнее + “дыхание”
  const scale = isMine ? 1.22 : selected ? 1.38 : active ? 1.24 : 1.14

  const pulseFast = selected ? 0.95 : 1.25
  const haloOpacity = selected ? 0.95 : active ? 0.8 : 0.55

  return (
    <g
      transform={`translate(${x} ${y})`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={(e) => {
        if (!onClick) return
        e.stopPropagation()
        onClick()
      }}
      onPointerEnter={() => onHover?.(true)}
      onPointerLeave={() => onHover?.(false)}
    >
      {/* отдельная группа: чтобы translate не масштабировался */}
      <motion.g
        transform={`scale(${scale})`}
        initial={false}
        animate={selected ? { y: [0, -1.2, 0] } : { y: 0 }}
        transition={selected ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        {/* точка якоря */}
        <circle r="3.1" fill="rgba(255,255,255,0.92)" />
        <circle r="9.5" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2.4" />

        {/* ✅ ПУЛЬС — три кольца, очень заметные */}
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

        {/* тень */}
        <ellipse cx="0" cy="34" rx="22" ry="9" fill="rgba(0,0,0,0.40)" />

        {/* ✅ тело пина (новая форма) */}
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

          {/* “голова” */}
          <circle cx="0" cy="-44" r="18" fill={isMine ? 'url(#pinHeadMine)' : 'url(#pinHead)'} filter="url(#pinShadow)" />

          {/* бликовая линза */}
          <circle cx="-6" cy="-52" r="5.6" fill="rgba(255,255,255,0.62)" />

          {/* внутреннее ядро */}
          <circle cx="0" cy="-44" r="7.2" fill="rgba(10,18,28,0.55)" />
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

          {/* внешний контур — “неоновая кромка” */}
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
            <rect x={-78} y={-22} width={156} height={28} rx={14} fill="rgba(12,28,44,0.74)" stroke="rgba(255,255,255,0.18)" />
            <text x={0} y={-3} textAnchor="middle" fill="rgba(255,255,255,0.94)" fontSize={13} fontWeight={900} fontFamily="ui-sans-serif">
              МОЯ ТЕРРИТОРИЯ
            </text>
          </g>
        )}
      </motion.g>
    </g>
  )
}

/**
 * ✅ Лайтбокс: увеличенное фото + листание
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
          className="absolute inset-0 z-[90] flex items-center justify-center"
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
            className="relative z-[95] w-[min(1100px,92vw)] overflow-hidden rounded-[28px] ring-1 ring-white/15"
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

              <button
                onClick={onClose}
                className="rounded-2xl px-3 py-2 text-[13px] font-bold text-white/80 ring-1 ring-white/15 hover:bg-white/10"
              >
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
                      className="h-[64px] w-[92px] flex-none overflow-hidden rounded-2xl ring-1"
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
 * ✅ Карточка в правой панели
 * ✅ Заголовок теперь без обрезки (полностью переносится)
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

  const borderColor = selected ? 'rgba(165,241,91,0.36)' : active ? 'rgba(165,241,91,0.22)' : 'rgba(255,255,255,0.14)'

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-[28px] p-5 ring-1"
      style={{
        background: bg,
        borderColor,
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
      <div
        className="pointer-events-none absolute left-5 right-5 top-3 h-[4px] rounded-full opacity-90"
        style={{
          background:
            'linear-gradient(90deg, rgba(165,241,91,0.0), rgba(165,241,91,0.82), rgba(90,255,245,0.72), rgba(165,241,91,0.0))',
        }}
      />

      <div className="relative mt-2 flex gap-4">
        {/* TEXT */}
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

          <div className="mt-2 text-[13px] text-white/65">Информация по точке</div>

          <div className="my-4 h-px w-full bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.16),rgba(255,255,255,0))]" />

          <ul className="space-y-2 pl-5 text-[15px] font-semibold leading-[1.55] text-white/90">
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
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[14px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                style={{ boxShadow: '0 14px 40px rgba(0,0,0,0.28)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {pin.ctaLabel ?? 'Открыть'} ↗
              </a>
            </div>
          ) : null}
        </div>

        {/* IMAGES */}
        {hasImages && (
          <div className="w-[300px] flex-none">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelect()
                onOpenModal(safeIdx)
              }}
              className="relative h-[210px] w-full overflow-hidden rounded-[22px] ring-1 ring-white/12"
              style={{
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
                    className="h-[66px] overflow-hidden rounded-2xl ring-1"
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
  x: 10,
  y: -940,
  title: 'Реализуемая территория',
  lines: [''],
  variant: 'mine',
}

const COMPARE_PINS_FALLBACK: Pin[] = [
  
   {
    id: 'c1',
    x: 180,
    y: -700,
    title: 'Коттеджный посёлок «Премиальный курорт Port Emm Zavidovo (Порт Эмм Завидово)»',
    lines: ['Дома • от 193,25 м² до 399,1 м².', 'Цена: от 49 682 884 до 93 523 108 ₽'],
    href: 'https://tver.cian.ru/kottedzhnyj-poselok-premialnyj-kurort-port-emm-zavidovo-port-ehmm-zavidovo-133126/?mlSearchSessionGuid=abcfb2126d70ea3c2500eec568e8cca8',
    ctaLabel: 'Открыть',
    images: [c2_1, c2_2,c2_3,],
  },
  {
    id: 'c2',
    x: 1320,
    y: -320,
    title: 'Коттеджный поселок «Екатериновка»',
    lines: ['Участок • по запросу', 'Цена: по запросу'],
    href: 'https://ekaterinovka.club/',
    ctaLabel: 'Открыть',
    images: [c1_1, c1_2,c1_3],
  },
 
  {
    id: 'c3',
    x: 2160,
    y: 1460,
    title: 'Коттеджный посёлок «Волжский Берег»',
    lines: ['Дома • 102 м²', 'Цена: от 26 210 000 ₽'],
    href: 'https://v-bereg.info/',
    ctaLabel: 'Открыть',
    images: [c3_1, c3_2],
  },
]

export default function SlidePatchMap() {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const [fit, setFit] = useState<FitBox | null>(null)

  const [hoverId, setHoverId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
  }, [])

  const cards: Pin[] = useMemo(() => comparePins.filter((p) => p.id !== MY_TERRITORY.id), [comparePins])
  const pins: Pin[] = useMemo(() => [MY_TERRITORY, ...cards], [cards])

  const [cardIdx, setCardIdx] = useState<Record<string, number>>({})
  const setIdxFor = useCallback((id: string, idx: number) => setCardIdx((m) => ({ ...m, [id]: idx })), [])

  const [modal, setModal] = useState<{ pinId: string; startIdx: number } | null>(null)
  const openModal = useCallback((pinId: string, startIdx: number) => setModal({ pinId, startIdx }), [])
  const closeModal = useCallback(() => setModal(null), [])

  const modalPin = useMemo(() => {
    if (!modal) return null
    return cards.find((p) => p.id === modal.pinId) ?? null
  }, [modal, cards])

  // ✅ панель шире (чуть-чуть), чтобы текст смотрелся лучше
  const panelBox = useMemo(() => {
    if (!fit) return null
    const pad = 18
    const w = Math.max(580, Math.min(880, Math.round(fit.cw * 0.42)))
    const left = Math.max(pad, fit.cw - w - pad)
    const top = Math.max(pad, fit.top + pad)
    const height = Math.max(240, Math.min(fit.ch - pad * 2, fit.height - pad * 2))
    return { left, top, width: w, height }
  }, [fit])

  // ✅ panel scroll ONLY (do not touch map / page)
  const panelScrollRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const scrollCardIntoPanelView = useCallback((id: string) => {
    const container = panelScrollRef.current
    const el = cardRefs.current[id]
    if (!container || !el) return

    const pad = 14
    const cRect = container.getBoundingClientRect()
    const eRect = el.getBoundingClientRect()

    const topOk = eRect.top >= cRect.top + pad
    const bottomOk = eRect.bottom <= cRect.bottom - pad
    if (topOk && bottomOk) return

    const deltaTop = eRect.top - (cRect.top + pad)
    const deltaBottom = eRect.bottom - (cRect.bottom - pad)
    const delta = deltaTop < 0 ? deltaTop : deltaBottom

    container.scrollTo({
      top: container.scrollTop + delta,
      behavior: 'smooth',
    })
  }, [])

  const selectById = useCallback(
    (id: string) => {
      setSelectedId(id)
      setHoverId(id)
      requestAnimationFrame(() => scrollCardIntoPanelView(id))
    },
    [scrollCardIntoPanelView],
  )

  const isCardActive = useCallback((id: string) => hoverId === id || selectedId === id, [hoverId, selectedId])

  return (
    <div className="relative h-full w-full overflow-hidden bg-eco-gradient noise">
      <div ref={stageRef} className="absolute inset-0 overflow-hidden">
        {/* ✅ Подложка на пустые зоны сверху/снизу (карту НЕ растягиваем!) */}
        <div className="absolute inset-0" style={dissolveMaskStyle}>
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

            {/* markers layer */}
            <div
              className="pointer-events-auto absolute z-40"
              style={{ left: fit.left, top: fit.top, width: fit.width, height: fit.height, overflow: 'visible' }}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) setHoverId(null)
              }}
            >
              <svg
                viewBox={IMAGE_VIEWBOX}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 h-full w-full"
                style={{ overflow: 'visible' }}
                onPointerLeave={() => setHoverId(null)}
              >
                <defs>
                  {/* ✅ Сделал градиенты поярче */}
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

                  {/* ✅ усиленный glow */}
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
                      return (
                        <PremiumMarker
                          key={`pin-${p.id}`}
                          x={p.x}
                          y={p.y}
                          variant={p.variant ?? 'default'}
                          active={isHovered}
                          selected={isSelected}
                          onHover={(v) => setHoverId(v ? p.id : null)}
                          onClick={() => {
                            setSelectedId(p.id)
                            setHoverId(p.id)
                            if (p.id !== MY_TERRITORY.id) selectById(p.id)
                          }}
                        />
                      )
                    })}
                  </motion.g>
                </AnimatePresence>
              </svg>
            </div>

            {/* ✅ RIGHT PANEL */}
            {panelBox && (
              <div
                className="absolute z-[70] pointer-events-auto"
                style={{
                  left: panelBox.left,
                  top: panelBox.top,
                  width: panelBox.width,
                  height: panelBox.height,
                }}
              >
                <div
                  ref={panelScrollRef}
                  className="h-full overflow-auto overscroll-contain rounded-[28px] p-3 ring-1 ring-white/12"
                  style={{
                    background: 'rgba(7,16,25,0.35)',
                    backdropFilter: 'blur(14px)',
                    boxShadow: '0 25px 90px rgba(0,0,0,0.45)',
                  }}
                >
                  <div className="px-2 pb-3 pt-2">
                    <div className="text-[13px] font-extrabold text-white/80">Сравнение объектов</div>
                    <div className="mt-1 text-[12px] text-white/50">
                      клик по карточке — выберет маркер • клик по фото — откроет галерею
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 p-2">
                    {cards.map((p) => {
                      const active = isCardActive(p.id)
                      const selected = selectedId === p.id
                      return (
                        <div
                          key={`panel-${p.id}`}
                          ref={(el) => {
                            cardRefs.current[p.id] = el
                          }}
                          onMouseEnter={() => setHoverId(p.id)}
                          onMouseLeave={() => setHoverId((cur) => (cur === p.id ? null : cur))}
                        >
                          <PanelCard
                            pin={p}
                            active={active}
                            selected={selected}
                            activeIdx={cardIdx[p.id] ?? 0}
                            onSelect={() => {
                              setSelectedId(p.id)
                              setHoverId(p.id)
                            }}
                            onSetActiveIdx={(i) => setIdxFor(p.id, i)}
                            onOpenModal={(startIdx) => openModal(p.id, startIdx)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ✅ Photo modal */}
            <PhotoModal
              open={!!modal}
              title={modalPin?.title ?? ''}
              images={modalPin?.images ?? []}
              startIndex={modal?.startIdx ?? 0}
              onClose={closeModal}
            />
          </>
        )}
      </div>
    </div>
  )
}
