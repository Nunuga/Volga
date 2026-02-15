import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import mapImg from '../assets/map1.png'
import GlowButton from '../components/GlowButton'
import { useDeck } from '../components/deckContext'
import { IMAGE_VIEWBOX } from '../data/parcelPaths'

type FitBox = { left: number; top: number; width: number; height: number }

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
  cardOffset?: { x: number; y: number }
}

type Layout = {
  pin: Pin
  cardX: number
  cardY: number
  cardW: number
  cardH: number
  side: 'left' | 'right'
  attachX: number
  attachY: number
}

const UI_TOP_MIN = 18
const UI_TOP_DOCK_OFFSET = 72

// ✅ маска как в SlideAerial
const dissolveMaskStyle: React.CSSProperties = {
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)',
  maskImage: 'linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
}

function safeParseViewBox(vb: string) {
  const parts = String(vb).trim().split(/\s+/).map(Number)
  const minX = Number.isFinite(parts[0]) ? parts[0] : 0
  const minY = Number.isFinite(parts[1]) ? parts[1] : 0
  const w = Number.isFinite(parts[2]) ? parts[2] : 1000
  const h = Number.isFinite(parts[3]) ? parts[3] : 600
  return { minX, minY, w, h, maxX: minX + w, maxY: minY + h }
}

/**
 * Премиум-маркер (с вариацией для "моей территории")
 */
function PremiumMarker({
  x,
  y,
  active,
  variant = 'default',
  onClick,
  onHover,
}: {
  x: number
  y: number
  active: boolean
  variant?: PinVariant
  onClick?: () => void
  onHover?: (v: boolean) => void
}) {
  const isMine = variant === 'mine'

  const accent = isMine
    ? 'rgba(255, 214, 91, 0.95)'
    : active
      ? 'rgba(241, 91, 91, 0.95)'
      : 'rgba(91, 232, 241, 0.75)'

  const accentSoft = isMine
    ? 'rgba(255, 214, 91, 0.38)'
    : active
      ? 'rgba(241, 91, 91, 0.45)'
      : 'rgba(91, 232, 241, 0.35)'

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
      <circle r="2.8" fill="rgba(255,255,255,0.85)" />
      <circle r="7.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" />

      <motion.circle
        r={isMine ? 18 : 16}
        fill="none"
        stroke={accentSoft}
        strokeWidth="2"
        initial={{ opacity: 0.6, scale: 0.85 }}
        animate={{ opacity: [0.55, 0.0], scale: [0.85, 1.75] }}
        transition={{ duration: 1.55, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.circle
        r={isMine ? 14 : 12}
        fill="none"
        stroke={accent}
        strokeWidth="1.6"
        initial={{ opacity: 0.35, scale: 0.9 }}
        animate={{ opacity: [0.35, 0.0], scale: [0.9, 1.45] }}
        transition={{ duration: 1.55, repeat: Infinity, ease: 'easeOut', delay: 0.55 }}
      />

      <ellipse cx="0" cy="22" rx="15" ry="6" fill="rgba(0,0,0,0.35)" />

      <g filter={isMine ? 'url(#pinGlowMine)' : 'url(#pinGlow)'} opacity={0.99}>
        <path
          d="M0 0 C 11 0, 18 -8, 18 -18 C 18 -30, 8 -40, 0 -40 C -8 -40, -18 -30, -18 -18 C -18 -8, -11 0, 0 0 Z"
          fill={isMine ? 'url(#pinBodyMine)' : 'url(#pinBody)'}
        />
        <circle cx="0" cy="-23" r="12.5" fill={isMine ? 'url(#pinHeadMine)' : 'url(#pinHead)'} filter="url(#pinShadow)" />
        <circle cx="-4" cy="-28" r="4.2" fill="rgba(255,255,255,0.55)" />

        <motion.circle
          cx="0"
          cy="-23"
          r={isMine ? 22 : 20}
          fill="none"
          stroke={accent}
          strokeWidth="2"
          initial={false}
          animate={{ opacity: active ? 1 : 0.55, scale: active ? 1.08 : 1 }}
          transition={{ duration: 0.25 }}
        />
      </g>

      {isMine && (
        <g transform="translate(0 -56)">
          <rect x={-58} y={-20} width={116} height={24} rx={12} fill="rgba(12,28,44,0.72)" stroke="rgba(255,255,255,0.16)" />
          <text x={0} y={-4} textAnchor="middle" fill="rgba(255,255,255,0.92)" fontSize={12} fontWeight={900} fontFamily="ui-sans-serif">
            МОЯ ТЕРРИТОРИЯ
          </text>
        </g>
      )}
    </g>
  )
}

/**
 * Ножка (линия от точки к карточке)
 */
function CalloutLeg({
  fromX,
  fromY,
  toX,
  toY,
  variant = 'default',
  active,
}: {
  fromX: number
  fromY: number
  toX: number
  toY: number
  variant?: PinVariant
  active: boolean
}) {
  const isMine = variant === 'mine'
  const stroke = isMine
    ? 'rgba(255, 214, 91, 0.90)'
    : active
      ? 'rgba(241, 91, 91, 0.85)'
      : 'rgba(91, 232, 241, 0.75)'
  const strokeSoft = isMine
    ? 'rgba(255, 214, 91, 0.25)'
    : active
      ? 'rgba(241, 91, 91, 0.22)'
      : 'rgba(91, 232, 241, 0.20)'

  const dx = toX - fromX
  const c1x = fromX + Math.max(-120, Math.min(120, dx * 0.35))
  const c1y = fromY - 18
  const c2x = toX - Math.max(-120, Math.min(120, dx * 0.25))
  const c2y = toY

  const d = `M ${fromX} ${fromY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${toX} ${toY}`

  return (
    <g pointerEvents="none">
      <path d={d} fill="none" stroke={strokeSoft} strokeWidth={8} strokeLinecap="round" opacity={0.9} />
      <path d={d} fill="none" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" opacity={0.95} />
      <circle cx={toX} cy={toY} r={4.2} fill="rgba(10,22,34,0.82)" stroke={stroke} strokeWidth={2} />
    </g>
  )
}

/**
 * Крупная открытая карточка (премиальнее + больше текст)
 */
function OpenMarkerCard({
  x,
  y,
  width,
  height,
  title,
  lines,
  href,
  ctaLabel = 'Открыть',
}: {
  x: number
  y: number
  width: number
  height: number
  title: string
  lines: string[]
  href?: string
  ctaLabel?: string
}) {
  const topAccent =
    'linear-gradient(90deg, rgba(165,241,91,0.0), rgba(165,241,91,0.82), rgba(91,232,241,0.72), rgba(165,241,91,0.0))'

  const bg = 'linear-gradient(135deg, rgba(12,28,44,0.84), rgba(6,14,22,0.74))'
  const ring = 'rgba(165,241,91,0.14)'

  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <motion.div
        xmlns="http://www.w3.org/1999/xhtml"
        initial={{ opacity: 0, y: 12, scale: 0.988 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.988 }}
        transition={{ duration: 0.22 }}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 28,
          padding: 24,
          color: 'white',
          background: bg,
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(18px)',
          boxShadow: `0 30px 110px rgba(0,0,0,0.62), 0 0 0 1px ${ring} inset`,
          pointerEvents: 'auto',
          overflow: 'hidden',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 18,
            right: 18,
            top: 12,
            height: 4,
            borderRadius: 999,
            background: topAccent,
            opacity: 0.95,
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(1200px 500px at 20% 10%, rgba(255,255,255,0.06), transparent 55%), radial-gradient(900px 400px at 80% 35%, rgba(165,241,91,0.06), transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12, position: 'relative' }}>
          <div>
            <div
              style={{
                fontWeight: 950,
                fontSize: 24,
                letterSpacing: 0.2,
                lineHeight: 1.12,
                textShadow: '0 8px 30px rgba(0,0,0,0.45)',
              }}
            >
              {title}
            </div>
            <div style={{ marginTop: 8, fontSize: 14.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.35 }}>
              Информация по точке
            </div>
          </div>

          <div
            style={{
              height: 1,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.16), rgba(255,255,255,0.0))',
              opacity: 0.9,
              marginTop: 2,
            }}
          />

          <div style={{ flex: 1, overflow: 'auto', paddingRight: 8 }}>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                opacity: 0.93,
                fontSize: 16.5,
                lineHeight: 1.72,
                fontWeight: 650,
                letterSpacing: 0.1,
              }}
            >
              {lines.map((t) => (
                <li key={t} style={{ marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {href ? (
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10 }}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  borderRadius: 18,
                  padding: '12px 16px',
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.94)',
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: 0.2,
                  textDecoration: 'none',
                  boxShadow: '0 14px 40px rgba(0,0,0,0.28)',
                }}
              >
                {ctaLabel} ↗
              </a>
            </div>
          ) : null}
        </div>
      </motion.div>
    </foreignObject>
  )
}

/**
 * ДАННЫЕ
 * ✅ "Моя территория" — ТОЛЬКО МАРКЕР (без карточки)
 */
const MY_TERRITORY: Pin = {
  id: 'my-territory',
  x: 180,
  y: 80,
  title: 'Реализуемая территория',
  lines: [''],
  variant: 'mine',
}

const COMPARE_PINS_FALLBACK: Pin[] = [
  {
    id: 'c1',
    x: 1720,
    y: 280,
    title: 'Эксклюзив, Сосны, 1 линия р.Волга',
    lines: ['Участок•870 сот.', 'Цена: 560 000 000 ₽'],
    href: 'https://tver.cian.ru/sale/suburban/321858306/?mlSearchSessionGuid=45f661b051d5a56c0ced460df13e171f',
    ctaLabel: 'Открыть',
    cardOffset: { x: -800, y: 400 },
  },
  {
    id: 'c2',
    x: 2460,
    y: 920,
    title: 'Тверская область, Конаковский муниципальный округ, Отроковичи деревня,',
    lines: ['40,88 сот', 'Цена: 65 000 000 ₽', 'Плюсы: зелёный район'],
    href: 'https://tver.cian.ru/sale/suburban/314262139/?mlSearchSessionGuid=45f661b051d5a56c0ced460df13e171f',
    ctaLabel: 'Открыть',
    cardOffset: { x: 570, y: -20 },
  },
]

export default function SlidePatchMap() {
  const deck = useDeck()

  const stageRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const [fit, setFit] = useState<FitBox | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)

  const vb = useMemo(() => safeParseViewBox(IMAGE_VIEWBOX), [])

  // ✅ contain — картинка целиком, без растяжения
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
    const left = (cw - width) / 2
    const top = (ch - height) / 2

    setFit({ left, top, width, height })
  }, [])

  useLayoutEffect(() => {
    recalc()
    const stage = stageRef.current
    if (!stage) return
    const ro = new ResizeObserver(() => recalc())
    ro.observe(stage)
    return () => ro.disconnect()
  }, [recalc])

  // ✅ док панели к top карты
  const topControlsTop = useMemo(() => {
    if (!fit) return 24
    return Math.max(UI_TOP_MIN, fit.top - UI_TOP_DOCK_OFFSET)
  }, [fit])

  // ✅ данные сравнения: грузим сразу при открытии слайда (маркеры показываем по умолчанию)
  const [comparePins, setComparePins] = useState<Pin[]>(COMPARE_PINS_FALLBACK)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/cians/compare', { method: 'GET' })
        if (!res.ok) return
        const json = (await res.json()) as { items?: Pin[] }
        if (!cancelled && Array.isArray(json.items) && json.items.length) setComparePins(json.items)
      } catch {
        // fallback
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // ✅ Пины показываются ВСЕГДА (по умолчанию)
  const pins: Pin[] = useMemo(() => {
    return [MY_TERRITORY, ...comparePins.filter((p) => p.id !== MY_TERRITORY.id)]
  }, [comparePins])

  const computeLayout = useCallback(
    (pin: Pin): Layout => {
      const margin = 18

      // карточки крупнее
      const cardW = Math.max(460, Math.min(720, vb.w * 0.92))
      const cardH = Math.max(290, Math.min(390, vb.h * 0.60))

      const BASE = { x: 54, y: -320 }
      const co = pin.cardOffset ?? { x: 0, y: 0 }

      let cx = pin.x + BASE.x + co.x
      let cy = pin.y + BASE.y + co.y
      let side: 'left' | 'right' = 'left'

      if (cx + cardW > vb.maxX - margin) {
        cx = pin.x - BASE.x - cardW + co.x
        side = 'right'
      }

      if (cy < vb.minY + margin) {
        cy = pin.y + 44 + co.y
      }

      cx = Math.min(vb.maxX - margin - cardW, Math.max(vb.minX + margin, cx))
      cy = Math.min(vb.maxY - margin - cardH, Math.max(vb.minY + margin, cy))

      const attachY = cy + 74
      const attachX = side === 'left' ? cx : cx + cardW

      return { pin, cardX: cx, cardY: cy, cardW, cardH, side, attachX, attachY }
    },
    [vb],
  )

  const layouts = useMemo(() => pins.map((p) => computeLayout(p)), [pins, computeLayout])

  // ✅ Моя территория — без карточки/ножки
  const cardLayouts = useMemo(() => layouts.filter((l) => l.pin.variant !== 'mine'), [layouts])
  const markerLayouts = layouts

  return (
    <div className="relative h-full w-full overflow-hidden bg-eco-gradient noise">
      <div ref={stageRef} className="absolute inset-0 overflow-hidden">
        {/* ✅ ФОН — 1:1 как в SlideAerial */}
        <img
          src={mapImg}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-35"
          aria-hidden="true"
          draggable={false}
        />
        <div className="absolute inset-0 bg-volga-night/55" />

        {/* preload для naturalWidth/Height */}
        <img ref={imgRef} src={mapImg} alt="" className="absolute pointer-events-none opacity-0" aria-hidden="true" onLoad={recalc} />

        {/* ✅ верхняя панель — КНОПКИ "СРАВНЕНИЕ" НЕТ */}
        <div
          className="pointer-events-auto absolute left-1/2 z-50 -translate-x-1/2"
          style={{ top: topControlsTop, transition: 'top 200ms ease' }}
        >
          {/* <div className="glass relative rounded-[18px] px-3 py-2 shadow-soft ring-1 ring-white/14">
            <div className="pointer-events-none absolute inset-x-6 top-1 h-[2px] rounded-full bg-gradient-to-r from-lime-200/0 via-lime-200/55 to-cyan-200/0 opacity-70" />
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={deck.prev}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-white/80 ring-1 ring-white/15 transition hover:bg-white/10"
              >
                ← Назад
              </button>

              <GlowButton onClick={deck.next}>Далее →</GlowButton>
            </div>
          </div> */}
        </div>

        {fit && (
          <>
            {/* ✅ БАЗОВЫЙ СЛОЙ (маска) — карта целиком, без растяжения */}
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

            {/* ✅ СЛОЙ МАРКЕРОВ/НОЖЕК/КАРТОЧЕК — без маски (ПОКАЗЫВАЕТСЯ СРАЗУ) */}
            <div
              className="pointer-events-auto absolute z-40"
              style={{
                left: fit.left,
                top: fit.top,
                width: fit.width,
                height: fit.height,
                overflow: 'visible',
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
                  {/* дефолтные градиенты пина */}
                  <radialGradient id="pinHead" cx="30%" cy="25%" r="80%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                    <stop offset="35%" stopColor="rgba(165,241,91,0.95)" />
                    <stop offset="100%" stopColor="rgba(35,160,95,0.95)" />
                  </radialGradient>
                  <linearGradient id="pinBody" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(220,255,190,0.95)" />
                    <stop offset="55%" stopColor="rgba(91,232,241,0.70)" />
                    <stop offset="100%" stopColor="rgba(57,26,255,0.70)" />
                  </linearGradient>

                  {/* "моя территория" — другие градиенты */}
                  <radialGradient id="pinHeadMine" cx="30%" cy="25%" r="80%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
                    <stop offset="38%" stopColor="rgba(255,214,91,0.98)" />
                    <stop offset="100%" stopColor="rgba(241,91,91,0.88)" />
                  </radialGradient>
                  <linearGradient id="pinBodyMine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,245,210,0.95)" />
                    <stop offset="55%" stopColor="rgba(255,214,91,0.62)" />
                    <stop offset="100%" stopColor="rgba(241,91,91,0.62)" />
                  </linearGradient>

                  <filter id="pinShadow" x="-70%" y="-70%" width="240%" height="240%">
                    <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="rgba(0,0,0,0.35)" />
                  </filter>

                  <filter id="pinGlow" x="-80%" y="-80%" width="260%" height="260%">
                    <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="rgba(91,232,241,0.40)" />
                    <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="rgba(165,241,91,0.25)" />
                  </filter>

                  <filter id="pinGlowMine" x="-90%" y="-90%" width="280%" height="280%">
                    <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="rgba(255,214,91,0.40)" />
                    <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="rgba(241,91,91,0.22)" />
                  </filter>
                </defs>

                <AnimatePresence>
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
                    {/* 1) ножки (только для НЕ mine) */}
                    {cardLayouts.map((l) => (
                      <CalloutLeg
                        key={`leg-${l.pin.id}`}
                        fromX={l.pin.x}
                        fromY={l.pin.y}
                        toX={l.attachX}
                        toY={l.attachY}
                        variant={l.pin.variant ?? 'default'}
                        active={hoverId === l.pin.id}
                      />
                    ))}

                    {/* 2) маркеры (все, включая mine) */}
                    {markerLayouts.map((l) => (
                      <PremiumMarker
                        key={`pin-${l.pin.id}`}
                        x={l.pin.x}
                        y={l.pin.y}
                        variant={l.pin.variant ?? 'default'}
                        active={hoverId === l.pin.id}
                        onHover={(v) => setHoverId(v ? l.pin.id : null)}
                      />
                    ))}

                    {/* 3) карточки (только для НЕ mine) */}
                    {cardLayouts.map((l) => (
                      <OpenMarkerCard
                        key={`card-${l.pin.id}`}
                        x={l.cardX}
                        y={l.cardY}
                        width={l.cardW}
                        height={l.cardH}
                        title={l.pin.title}
                        lines={l.pin.lines}
                        href={l.pin.href}
                        ctaLabel={l.pin.ctaLabel}
                      />
                    ))}
                  </motion.g>
                </AnimatePresence>
              </svg>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
