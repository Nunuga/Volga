import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import mapImg from '../assets/map.png'
import GlowButton from '../components/GlowButton'
import { useDeck } from '../components/deckContext'
import {
  IMAGE_VIEWBOX,
  MAP_MARKERS,
  MAP_MARKER_OFFSETS,
  MARKER_CARD_OFFSETS,
  MEZH_LINES,
  MEZH_POINTS,
  MEZH_ZONES,
  MEZH_ZONE_CARDS,
  MEZH_ZONE_OFFSETS,
  PARCEL_FILL,
  PARCEL_PATH_DETAIL,
  PARCEL_STROKE,
  POTENTIAL_AREAS,
  POTENTIAL_OFFSETS,
} from '../data/parcelPaths'

type FitBox = { left: number; top: number; width: number; height: number }
type OverlayMode = 'scheme' | 'mezh' | 'none'
type EditLayer = 'mezh' | 'potential'
type MarkerEditTarget = 'pin' | 'card'

const LOCATION = 'Тверская область, р-н. Калининский, с/п. Каблуковское, д. Заборовье'

// ✅ панель сверху: докуем к верхней границе карты
const UI_TOP_MIN = 18
const UI_TOP_DOCK_OFFSET = 72

// ✅ Премиальные карточки: 3 штуки, первая шире
const ROW_CLASS =
  'flex gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] lg:grid lg:grid-cols-12 lg:gap-4 lg:overflow-visible lg:[grid-auto-rows:1fr]'

const CARD_BASE =
  'relative overflow-hidden rounded-[34px] bg-gradient-to-br from-white/10 via-white/5 to-black/35 ' +
  'ring-1 ring-white/14 backdrop-blur-2xl shadow-soft ' +
  'transition will-change-transform hover:-translate-y-[2px] hover:ring-white/22 ' +
  'h-full flex flex-col min-h-[300px] p-5 sm:p-6'

const CARD_MAIN = `min-w-[420px] lg:col-span-6 ${CARD_BASE}`
const CARD_SIDE = `min-w-[320px] lg:col-span-3 ${CARD_BASE}`

const OVERLAY_GRADIENT_H = 'h-[270px]'

const dissolveMaskStyle: React.CSSProperties = {
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 24%, black 16%, transparent 100%)',
  maskImage: 'linear-gradient(to bottom, transparent 0%, black 24%, black 16%, transparent 100%)',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
}

function CardAccent() {
  return (
    <>
      <div className="pointer-events-none absolute left-6 right-6 top-4 h-[2px] rounded-full bg-gradient-to-r from-lime-200/0 via-lime-200/70 to-cyan-200/0 opacity-80" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,241,91,0.16),transparent_62%)] blur-2xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-60 w-60 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(91,232,241,0.12),transparent_60%)] blur-2xl" />
    </>
  )
}

function TopToggleButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-2xl px-4 py-2 text-sm font-semibold transition',
        active
          ? 'bg-white/15 text-white ring-1 ring-white/25 shadow-soft'
          : 'bg-white/5 text-white/80 ring-1 ring-white/15 hover:bg-white/10',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

/**
 * Премиум-маркер: tip ровно в (x,y), пульсирующие rings, glow, активный halo.
 */
function PremiumMarker({
  x,
  y,
  active,
  editing,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  x: number
  y: number
  active: boolean
  editing: boolean
  onClick: () => void
  onPointerDown?: (e: React.PointerEvent<SVGGElement>) => void
  onPointerMove?: (e: React.PointerEvent<SVGGElement>) => void
  onPointerUp?: (e: React.PointerEvent<SVGGElement>) => void
}) {
  const accent = active ? 'rgba(241, 91, 91, 0.95)' : 'rgba(91, 232, 241, 0.75)'
  const accentSoft = active ? 'rgba(241, 91, 91, 0.45)' : 'rgba(91, 232, 241, 0.35)'

  return (
    <g
      transform={`translate(${x} ${y})`}
      style={{ cursor: editing ? 'grab' : 'pointer' }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <circle r="2.8" fill="rgba(255,255,255,0.85)" />
      <circle r="7.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" />

      <motion.circle
        r="16"
        fill="none"
        stroke={accentSoft}
        strokeWidth="2"
        initial={{ opacity: 0.6, scale: 0.85 }}
        animate={{ opacity: [0.55, 0.0], scale: [0.85, 1.75] }}
        transition={{ duration: 1.55, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.circle
        r="12"
        fill="none"
        stroke={accent}
        strokeWidth="1.6"
        initial={{ opacity: 0.35, scale: 0.9 }}
        animate={{ opacity: [0.35, 0.0], scale: [0.9, 1.45] }}
        transition={{ duration: 1.55, repeat: Infinity, ease: 'easeOut', delay: 0.55 }}
      />

      <ellipse cx="0" cy="22" rx="15" ry="6" fill="rgba(0,0,0,0.35)" />

      <g filter="url(#pinGlow)">
        <path
          d="M0 0 C 11 0, 18 -8, 18 -18 C 18 -30, 8 -40, 0 -40 C -8 -40, -18 -30, -18 -18 C -18 -8, -11 0, 0 0 Z"
          fill="url(#pinBody)"
          opacity={0.98}
        />
        <circle cx="0" cy="-23" r="12.5" fill="url(#pinHead)" filter="url(#pinShadow)" />
        <circle cx="-4" cy="-28" r="4.2" fill="rgba(255,255,255,0.55)" />

        <motion.circle
          cx="0"
          cy="-23"
          r="20"
          fill="none"
          stroke={accent}
          strokeWidth="2"
          initial={false}
          animate={{ opacity: active ? 1 : 0.45, scale: active ? 1.06 : 1 }}
          transition={{ duration: 0.25 }}
        />
      </g>
    </g>
  )
}

function MarkerCard({
  x,
  y,
  width,
  height,
  title,
  lines,
  onClose,
  editing,
  pointerSide = 'left',
}: {
  x: number
  y: number
  width: number
  height: number
  title: string
  lines: string[]
  onClose: () => void
  editing: boolean
  pointerSide?: 'left' | 'right'
}) {
  const arrowStyle: React.CSSProperties =
    pointerSide === 'right'
      ? {
          position: 'absolute',
          right: -10,
          top: 46,
          width: 18,
          height: 18,
          transform: 'rotate(45deg)',
          background: 'rgba(10,22,34,0.82)',
          borderRight: '1px solid rgba(255,255,255,0.14)',
          borderTop: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
        }
      : {
          position: 'absolute',
          left: -10,
          top: 46,
          width: 18,
          height: 18,
          transform: 'rotate(45deg)',
          background: 'rgba(10,22,34,0.82)',
          borderLeft: '1px solid rgba(255,255,255,0.14)',
          borderBottom: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
        }

  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <motion.div
        xmlns="http://www.w3.org/1999/xhtml"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 22,
          padding: 18,
          color: 'white',
          background: 'linear-gradient(135deg, rgba(12,28,44,0.82), rgba(6,14,22,0.72))',
          border: '1px solid rgba(255,255,255,0.16)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 28px 95px rgba(0,0,0,0.58), 0 0 0 1px rgba(165,241,91,0.10) inset',
          cursor: editing ? 'grab' : 'default',
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}
      >
        <div style={arrowStyle} />

        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            top: 12,
            height: 3,
            borderRadius: 999,
            background:
              'linear-gradient(90deg, rgba(165,241,91,0.0), rgba(165,241,91,0.75), rgba(91,232,241,0.65), rgba(165,241,91,0.0))',
            filter: 'blur(0.2px)',
            opacity: 0.9,
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10, letterSpacing: 0.2 }}>{title}</div>
            <div style={{ maxHeight: height - 76, overflow: 'auto', paddingRight: 6 }}>
              <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.92, fontSize: 14, lineHeight: 1.55 }}>
                {lines.map((t) => (
                  <li key={t} style={{ marginBottom: 4 }}>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            style={{
              fontSize: 13,
              padding: '8px 12px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.9)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {editing && (
          <div
            style={{
              position: 'absolute',
              right: 14,
              bottom: 14,
              fontSize: 12,
              color: 'rgba(255,255,255,0.65)',
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(0,0,0,0.20)',
              padding: '6px 10px',
              borderRadius: 999,
            }}
          >
            drag: карточка
          </div>
        )}
      </motion.div>
    </foreignObject>
  )
}

export default function SlideAerial() {
  const deck = useDeck()

  const stageRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const markersSvgRef = useRef<SVGSVGElement | null>(null)

  const [fit, setFit] = useState<FitBox | null>(null)
  const [mode, setMode] = useState<OverlayMode>('none')

  const [activeMarker, setActiveMarker] = useState<string | null>(null)
  const [activeZone, setActiveZone] = useState<string | null>(null)

  const [showPotential, setShowPotential] = useState(false)
  const canShowPotentialNow = showPotential && mode !== 'none'

  const [editMode, setEditMode] = useState(false)
  const [editLayer, setEditLayer] = useState<EditLayer>('mezh')
  const [moveAll, setMoveAll] = useState(false)
  const [step, setStep] = useState(5)

  const [selectedZoneId, setSelectedZoneId] = useState<string>(MEZH_ZONES[0]?.id ?? 'A')
  const [selectedPotentialId, setSelectedPotentialId] = useState<string>(POTENTIAL_AREAS[0]?.id ?? 'P1')
  const [selectedMarkerId, setSelectedMarkerId] = useState<string>(MAP_MARKERS[0]?.id ?? 'beach')

  const vb = useMemo(() => {
    const parts = String(IMAGE_VIEWBOX).trim().split(/\s+/).map(Number)
    const minX = Number.isFinite(parts[0]) ? parts[0] : 0
    const minY = Number.isFinite(parts[1]) ? parts[1] : 0
    const w = Number.isFinite(parts[2]) ? parts[2] : 1000
    const h = Number.isFinite(parts[3]) ? parts[3] : 600
    return { minX, minY, w, h, maxX: minX + w, maxY: minY + h }
  }, [])

  // ---- offsets: MEZH ----
  const buildMezhOffsetsFromFile = useCallback(() => {
    const obj: Record<string, { x: number; y: number; scale?: number }> = {}
    for (const z of MEZH_ZONES) {
      const fromMap = MEZH_ZONE_OFFSETS?.[z.id]
      obj[z.id] = {
        x: fromMap?.x ?? z.transform?.x ?? 0,
        y: fromMap?.y ?? z.transform?.y ?? 0,
        scale: z.transform?.scale,
      }
    }
    return obj
  }, [])

  const [zoneOffsets, setZoneOffsets] = useState<Record<string, { x: number; y: number; scale?: number }>>(() =>
    buildMezhOffsetsFromFile(),
  )

  // ---- offsets: POTENTIAL ----
  const buildPotentialOffsetsFromFile = useCallback(() => {
    const obj: Record<string, { x: number; y: number; scale?: number }> = {}
    for (const p of POTENTIAL_AREAS) {
      const fromMap = POTENTIAL_OFFSETS?.[p.id]
      obj[p.id] = {
        x: fromMap?.x ?? p.transform?.x ?? 0,
        y: fromMap?.y ?? p.transform?.y ?? 0,
        scale: p.transform?.scale,
      }
    }
    return obj
  }, [])

  const [potentialOffsets, setPotentialOffsets] = useState<Record<string, { x: number; y: number; scale?: number }>>(() =>
    buildPotentialOffsetsFromFile(),
  )

  // ---- offsets: MARKERS (pin + card) ----
  const buildMarkerOffsetsFromFile = useCallback(() => {
    const obj: Record<string, { x: number; y: number }> = {}
    const mapOffsets = MAP_MARKER_OFFSETS as Record<string, { x: number; y: number }>
    for (const m of MAP_MARKERS) {
      const fromMap = mapOffsets[m.id]
      obj[m.id] = { x: fromMap?.x ?? 0, y: fromMap?.y ?? 0 }
    }
    return obj
  }, [])

  const [markerOffsets, setMarkerOffsets] = useState<Record<string, { x: number; y: number }>>(() => buildMarkerOffsetsFromFile())

  const buildMarkerCardOffsetsFromFile = useCallback(() => {
    const obj: Record<string, { x: number; y: number }> = {}
    const mapOffsets = MARKER_CARD_OFFSETS as Record<string, { x: number; y: number }>
    for (const m of MAP_MARKERS) {
      const fromMap = mapOffsets[m.id]
      obj[m.id] = { x: fromMap?.x ?? 0, y: fromMap?.y ?? 0 }
    }
    return obj
  }, [])

  const [markerCardOffsets, setMarkerCardOffsets] = useState<Record<string, { x: number; y: number }>>(() =>
    buildMarkerCardOffsetsFromFile(),
  )

  // ---- recalc fit ----
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

  const isScheme = mode === 'scheme'
  const isMezh = mode === 'mezh'

  // ✅ панель сверху привязана к top карты
  const topControlsTop = useMemo(() => {
    if (!fit) return 24
    return Math.max(UI_TOP_MIN, fit.top - UI_TOP_DOCK_OFFSET)
  }, [fit])

  const activeMarkerData = useMemo(() => MAP_MARKERS.find((m) => m.id === activeMarker) ?? null, [activeMarker])
  const activeZoneCard = useMemo(() => (activeZone ? MEZH_ZONE_CARDS[activeZone] ?? null : null), [activeZone])

  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return null
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const m = svg.getScreenCTM()
    if (!m) return null
    const p = pt.matrixTransform(m.inverse())
    return { x: p.x, y: p.y }
  }, [])

  // ✅ центр зоны: label.x/y + offsets (+ scale)
  const getZoneCenter = useCallback(
    (z: (typeof MEZH_ZONES)[number]) => {
      const off = zoneOffsets[z.id] ?? { x: 0, y: 0, scale: 1 }
      const scale = off.scale ?? z.transform?.scale ?? 1
      const lx = z.label?.x ?? 0
      const ly = z.label?.y ?? 0
      return { x: off.x + lx * scale, y: off.y + ly * scale }
    },
    [zoneOffsets],
  )

  // ---- apply delta ----
  const applyDelta = useCallback(
    (dx: number, dy: number) => {
      if (editLayer === 'mezh') {
        setZoneOffsets((prev) => {
          const next = { ...prev }
          if (moveAll) {
            for (const k of Object.keys(next)) {
              next[k] = { ...next[k], x: (next[k]?.x ?? 0) + dx, y: (next[k]?.y ?? 0) + dy }
            }
          } else {
            const id = selectedZoneId
            const cur = next[id] ?? { x: 0, y: 0 }
            next[id] = { ...cur, x: cur.x + dx, y: cur.y + dy }
          }
          return next
        })
        return
      }

      setPotentialOffsets((prev) => {
        const next = { ...prev }
        if (moveAll) {
          for (const k of Object.keys(next)) {
            next[k] = { ...next[k], x: (next[k]?.x ?? 0) + dx, y: (next[k]?.y ?? 0) + dy }
          }
        } else {
          const id = selectedPotentialId
          const cur = next[id] ?? { x: 0, y: 0 }
          next[id] = { ...cur, x: cur.x + dx, y: cur.y + dy }
        }
        return next
      })
    },
    [editLayer, moveAll, selectedZoneId, selectedPotentialId],
  )

  // ---- keyboard ----
  useEffect(() => {
    if (!editMode) return
    if (editLayer === 'potential' && !canShowPotentialNow) return
    if (editLayer === 'mezh' && mode !== 'mezh') return
    if (editLayer === 'potential' && mode === 'none') return

    const onKeyDown = (e: KeyboardEvent) => {
      const mult = e.shiftKey ? 5 : 1
      const s = step * mult
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        applyDelta(-s, 0)
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        applyDelta(s, 0)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        applyDelta(0, -s)
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        applyDelta(0, s)
      }
    }

    window.addEventListener('keydown', onKeyDown, { passive: false })
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editMode, editLayer, mode, canShowPotentialNow, step, applyDelta])

  const dragRef = useRef<{
    dragging: boolean
    kind: EditLayer
    startPt: { x: number; y: number }
    startZoneOffsets: Record<string, { x: number; y: number; scale?: number }>
    startPotentialOffsets: Record<string, { x: number; y: number; scale?: number }>
    targetId: string
  } | null>(null)

  const showEditor = mode === 'mezh' || (mode === 'scheme' && showPotential)

  useEffect(() => {
    if (!showPotential && editLayer === 'potential') {
      setEditMode(false)
      setEditLayer('mezh')
    }
  }, [showPotential, editLayer])

  useEffect(() => {
    if (showPotential && mode !== 'none' && editLayer === 'mezh' && mode === 'scheme') {
      setEditLayer('potential')
    }
  }, [showPotential, mode, editLayer])

  useEffect(() => {
    if (mode !== 'scheme') setActiveMarker(null)
  }, [mode])

  useEffect(() => {
    if (mode !== 'mezh') setActiveZone(null)
  }, [mode])

  // ---------------------------
  // ✅ DEFAULT (mode === 'none'): 3 карточки (первая шире)
  // ---------------------------
  const DefaultInfoCards = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50">
      <div className={`absolute inset-x-0 bottom-0 ${OVERLAY_GRADIENT_H} bg-gradient-to-t from-black/75 via-black/28 to-transparent`} />

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-8">
        <div className="pointer-events-auto -mt-12">
          <div className={ROW_CLASS}>
            <div className={CARD_MAIN}>
              <CardAccent />

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-white/60">Локация</div>
                  <div className="mt-1 text-xl font-semibold tracking-tight text-white">Участок в природном окружении</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Адрес: <span className="text-white/90">{LOCATION}</span>
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl bg-white/7 px-3 py-2 ring-1 ring-white/12">
                  <div className="text-[11px] text-white/60">Слайд</div>
                  <div className="text-sm font-semibold text-white/90">2 / 5</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-[11px] text-white/60">Режимы</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">схема / межевание</div>
                </div>
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-[11px] text-white/60">Потенциалы</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">включаются чекбоксом</div>
                </div>
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-[11px] text-white/60">Маркеры</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">на схеме/межевании</div>
                </div>
              </div>

              <div className="mt-auto pt-5 flex flex-wrap items-center justify-between gap-3">
                <GlowButton onClick={deck.prev}>← Назад</GlowButton>
                <button
                  onClick={deck.next}
                  className="rounded-2xl px-5 py-3 text-sm font-semibold text-white/85 ring-1 ring-white/22 transition hover:bg-white/10"
                >
                  Далее →
                </button>
              </div>
            </div>

            <div className={CARD_SIDE}>
              <CardAccent />

              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Природные плюсы</div>
                <div className="rounded-full bg-lime-300/15 px-3 py-1 text-xs font-semibold text-lime-200 ring-1 ring-lime-200/20">
                  природа
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-white/75">
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-lime-300/80" />
                  Зелёное окружение: лесные массивы и поляны
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-cyan-300/80" />
                  Водный ландшафт рядом по карте — прогулки, виды
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-violet-300/80" />
                  Тишина/приватность: “дом у воды / в лесу”
                </li>
              </ul>

              <div className="mt-auto pt-4 rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                <div className="text-[11px] text-white/60">Эмоция места</div>
                <div className="mt-1 text-sm font-semibold text-white/90">Спокойствие, воздух, восстановление</div>
              </div>
            </div>

            <div className={CARD_SIDE}>
              <CardAccent />

              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Ценность и сценарии</div>
                <div className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/12">идея</div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-xs font-semibold text-white/90">Практика</div>
                  <div className="mt-1 text-xs text-white/65">коммуникации и логистику подтверждаем по ТУ/докам</div>
                </div>

                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-xs font-semibold text-white/90">Сценарии</div>
                  <div className="mt-1 text-xs text-white/65">дом, рекреация, инвестиционный формат “поэтапно”</div>
                </div>

                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-xs font-semibold text-white/90">Что сделать первым</div>
                  <div className="mt-1 text-xs text-white/65">ЕГРН + ГПЗУ/ПЗЗ → ограничения → концепт</div>
                </div>
              </div>

              <div className="mt-auto pt-4 text-xs text-white/55">
                * Точные расстояния/электро/дороги — фиксируй документально, чтобы не спорить цифрами.
              </div>
            </div>
          </div>

          <div className="mt-2 text-xs text-white/55 lg:text-right">3 карточки: первая шире, две — компактные.</div>
        </div>
      </div>
    </div>
  )

  // ---------------------------
  // ✅ SCHEME: 3 карточки (первая шире)
  // ---------------------------
  const SchemeInfoCards = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50">
      <div className={`absolute inset-x-0 bottom-0 ${OVERLAY_GRADIENT_H} bg-gradient-to-t from-black/75 via-black/28 to-transparent`} />

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-8">
        <div className="pointer-events-auto -mt-12">
          <div className={ROW_CLASS}>
            <div className={CARD_MAIN}>
              <CardAccent />

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-white/60">Участок • общая схема</div>
                  <div className="mt-1 text-xl font-semibold tracking-tight text-white">Схема участка и маркеры</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Нажми на маркер — откроется карточка точки. Потенциалы можно включить чекбоксом.
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl bg-white/7 px-3 py-2 ring-1 ring-white/12">
                  <div className="text-[11px] text-white/60">Слайд</div>
                  <div className="text-sm font-semibold text-white/90">2 / 5</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-[11px] text-white/60">Площадь</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">≈ 28.5 га</div>
                </div>
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-[11px] text-white/60">Статус</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">ИЖС / ЗНП</div>
                </div>
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-[11px] text-white/60">Потенциалы</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">{showPotential ? 'включены' : 'выключены'}</div>
                </div>
              </div>

              <div className="mt-auto pt-5 flex flex-wrap items-center justify-between gap-3">
                <GlowButton onClick={deck.prev}>← Назад</GlowButton>
                <button
                  onClick={deck.next}
                  className="rounded-2xl px-5 py-3 text-sm font-semibold text-white/85 ring-1 ring-white/22 transition hover:bg-white/10"
                >
                  Далее →
                </button>
              </div>
            </div>

            <div className={CARD_SIDE}>
              <CardAccent />

              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Плюсы и метрики</div>
                <div className="rounded-full bg-lime-300/15 px-3 py-1 text-xs font-semibold text-lime-200 ring-1 ring-lime-200/20">
                  выгода
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-white/75">
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-lime-300/80" />
                  Можно развивать по этапам — меньше риск
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-cyan-300/80" />
                  Рост стоимости после улучшений/инфраструктуры
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-violet-300/80" />
                  Вариативность использования: рекреация/сервис/стройка
                </li>
              </ul>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-[11px] text-white/60">До воды</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">0 м</div>
                </div>
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-[11px] text-white/60">Подъезд</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">есть</div>
                </div>
              </div>

              {/* <div className="mt-auto pt-4 text-xs text-white/55">* цифры можно заменить на точные из ТЗ/документов</div> */}
            </div>

            <div className={CARD_SIDE}>
              <CardAccent />

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Первые шаги</div>
                  <div className="mt-1 text-xs text-white/60">быстро “упаковывают” проект</div>
                </div>
                <div className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/12">план</div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-xs font-semibold text-white/90">1) Документы</div>
                  <div className="mt-1 text-xs text-white/65">ограничения, сервитуты, ГПЗУ</div>
                </div>
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-xs font-semibold text-white/90">2) Границы</div>
                  <div className="mt-1 text-xs text-white/65">вынос точек, уточнение</div>
                </div>
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-xs font-semibold text-white/90">3) Концепт</div>
                  <div className="mt-1 text-xs text-white/65">2–3 сценария использования</div>
                </div>
              </div>

              {/* <div className="mt-auto pt-4 text-xs text-white/55">* дальше — инфраструктура и финмодель</div> */}
            </div>
          </div>

          <div className="mt-2 text-xs text-white/55 lg:text-right">ㅤ</div>
        </div>
      </div>
    </div>
  )

  // ---------------------------
  // ✅ MEZH: 3 карточки (первая шире)
  // ---------------------------
  const MezhInfoCards = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50">
      <div className={`absolute inset-x-0 bottom-0 ${OVERLAY_GRADIENT_H} bg-gradient-to-t from-black/75 via-black/28 to-transparent`} />

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-8">
        <div className="pointer-events-auto -mt-12">
          <div className={ROW_CLASS}>
            <div className={CARD_MAIN}>
              <CardAccent />

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-white/60">Карта • Участки</div>
                  <div className="mt-1 text-xl font-semibold tracking-tight text-white">Карта участков</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Нажимите на метки зон — откроются карточки для каждой территории.
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl bg-white/7 px-3 py-2 ring-1 ring-white/12">
                  <div className="text-[11px] text-white/60">Слайд</div>
                  <div className="text-sm font-semibold text-white/90">2 / 5</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-[11px] text-white/60">Зон</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">{MEZH_ZONES.length}</div>
                </div>
                {/* <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-[11px] text-white/60">Точек</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">{MEZH_POINTS.length}</div>
                </div> */}
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-[11px] text-white/60">Потенциалы</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">{showPotential ? 'включены' : 'выключены'}</div>
                </div>
              </div>

              <div className="mt-auto pt-5 flex flex-wrap items-center justify-between gap-3">
                <GlowButton onClick={deck.prev}>← Назад</GlowButton>
                <button
                  onClick={deck.next}
                  className="rounded-2xl px-5 py-3 text-sm font-semibold text-white/85 ring-1 ring-white/22 transition hover:bg-white/10"
                >
                  Далее →
                </button>
              </div>
            </div>

            <div className={CARD_SIDE}>
              <CardAccent />

              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Юридика и ограничения</div>
                <div className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/12">проверка</div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-white/75">
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-cyan-300/80" />
                  ЕГРН: права, площадь, категория, ВРИ
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-violet-300/80" />
                  Обременения: сервитуты, охранные зоны
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-lime-300/80" />
                  ГПЗУ/ПЗЗ: параметры и отступы
                </li>
              </ul>

              <div className="mt-auto pt-4 rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                <div className="text-[11px] text-white/60">Результат</div>
                <div className="mt-1 text-sm font-semibold text-white/90">Понимаем “что можно” без рисков</div>
              </div>
            </div>

            <div className={CARD_SIDE}>
              <CardAccent />

              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Геометрия и roadmap</div>
                <div className="rounded-full bg-lime-300/15 px-3 py-1 text-xs font-semibold text-lime-200 ring-1 ring-lime-200/20">
                  точность
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-white/75">
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-lime-300/80" />
                  Контуры без разрывов и пересечений
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-cyan-300/80" />
                  Сверка площадей и ключевых точек
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-violet-300/80" />
                  Подготовка к концепту и этапности освоения
                </li>
              </ul>

              <div className="mt-4 rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                <div className="text-xs font-semibold text-white/90">Дальше по шагам</div>
                <div className="mt-1 text-xs text-white/65">верификация → концепт → упаковка (инфра + финмодель)</div>
              </div>

              <div className="mt-auto pt-4 text-xs text-white/55">* сюда можно подставить допуски/точность из геодезии</div>
            </div>
          </div>

          <div className="mt-2 text-xs text-white/55 lg:text-right">Межевание: кликай по меткам зон — открываются карточки.</div>
        </div>
      </div>
    </div>
  )

  const infoCards = mode === 'scheme' ? SchemeInfoCards : mode === 'mezh' ? MezhInfoCards : DefaultInfoCards

  return (
    <div className="relative h-full w-full overflow-hidden bg-eco-gradient noise">
      <div ref={stageRef} className="absolute inset-0">
        <img
          src={mapImg}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-35"
          aria-hidden="true"
          draggable={false}
        />
        <div className="absolute inset-0 bg-volga-night/55" />
        <img ref={imgRef} src={mapImg} alt="" className="absolute opacity-0" aria-hidden="true" onLoad={recalc} />

        {/* режимы + чекбокс */}
        <div
          className="pointer-events-auto absolute left-1/2 z-50 -translate-x-1/2"
          style={{ top: topControlsTop, transition: 'top 200ms ease' }}
        >
          <div className="glass relative rounded-[18px] px-3 py-2 shadow-soft ring-1 ring-white/14">
            <div className="pointer-events-none absolute inset-x-6 top-1 h-[2px] rounded-full bg-gradient-to-r from-lime-200/0 via-lime-200/55 to-cyan-200/0 opacity-70" />
            <div className="flex flex-wrap items-center gap-2">
              <TopToggleButton
                active={isScheme}
                onClick={() => {
                  setMode((m) => (m === 'scheme' ? 'none' : 'scheme'))
                  setEditMode(false)
                  if (showPotential) setEditLayer('potential')
                }}
              >
                Общая схема
              </TopToggleButton>

              <TopToggleButton
                active={isMezh}
                onClick={() => {
                  setMode((m) => (m === 'mezh' ? 'none' : 'mezh'))
                  setEditLayer('mezh')
                  setEditMode(false)
                }}
              >
                Карта межевания
              </TopToggleButton>

              {/* <TopToggleButton
                active={mode === 'none'}
                onClick={() => {
                  setMode('none')
                  setEditMode(false)
                }}
              >
                Скрыть
              </TopToggleButton> */}

              <div className="ml-2 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/15">
                <input
                  id="potential"
                  type="checkbox"
                  className="h-4 w-4 accent-lime-300"
                  checked={showPotential}
                  onChange={(e) => {
                    const v = e.target.checked
                    setShowPotential(v)
                    if (v && mode !== 'none') {
                      setEditLayer('potential')
                      setSelectedPotentialId(POTENTIAL_AREAS[0]?.id ?? 'P1')
                    }
                  }}
                />
                <label htmlFor="potential" className="select-none text-sm font-semibold text-white/80">
                  Потенциальные территории
                </label>
              </div>
            </div>
          </div>
        </div>

        {fit && (
          <>
            {/* БАЗОВЫЙ СЛОЙ (маска) — только карта + схемы/межевание/потенциалы */}
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
              <img src={mapImg} alt="Аэроснимок участка" className="absolute inset-0 h-full w-full object-cover" draggable={false} />

              {/* редактор (у тебя он был закомментирован — оставил как есть) */}
              {/* {showEditor && (...)} */}

              <svg ref={svgRef} viewBox={IMAGE_VIEWBOX} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
                <defs>
                  <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="rgba(165,241,91,0.65)" />
                  </filter>
                </defs>

                <AnimatePresence>
                  {mode !== 'none' && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {/* scheme */}
                      {mode === 'scheme' && (
                        <path
                          d={PARCEL_PATH_DETAIL}
                          fill={PARCEL_FILL}
                          stroke={PARCEL_STROKE}
                          strokeWidth={4}
                          filter="url(#glow)"
                          vectorEffect="non-scaling-stroke"
                        />
                      )}

                      {/* mezh */}
                      {mode === 'mezh' && (
                        <g>
                          <g>
                            {MEZH_LINES.map((ln, i) => (
                              <path
                                key={i}
                                d={ln.d}
                                fill="none"
                                stroke={ln.stroke ?? 'rgba(255,255,255,0.35)'}
                                strokeWidth={ln.strokeWidth ?? 3}
                                strokeDasharray={ln.dash ?? '10 12'}
                                opacity={ln.opacity ?? 1}
                                vectorEffect="non-scaling-stroke"
                              />
                            ))}
                          </g>

                          <g>
                            {MEZH_ZONES.map((z) => {
                              const off = zoneOffsets[z.id] ?? { x: 0, y: 0 }
                              const isSel = selectedZoneId === z.id
                              const scale = off.scale ?? z.transform?.scale ?? 1
                              const t = scale !== 1 ? `translate(${off.x} ${off.y}) scale(${scale})` : `translate(${off.x} ${off.y})`

                              const onPointerDown = (e: React.PointerEvent) => {
                                if (!editMode || editLayer !== 'mezh') return
                                e.preventDefault()
                                e.stopPropagation()
                                setSelectedZoneId(z.id)
                                const pt = clientToSvg(e.clientX, e.clientY)
                                if (!pt) return
                                dragRef.current = {
                                  dragging: true,
                                  kind: 'mezh',
                                  startPt: pt,
                                  startZoneOffsets: JSON.parse(JSON.stringify(zoneOffsets)),
                                  startPotentialOffsets: JSON.parse(JSON.stringify(potentialOffsets)),
                                  targetId: z.id,
                                }
                                ;(e.currentTarget as unknown as Element).setPointerCapture?.(e.pointerId)
                              }

                              const onPointerMove = (e: React.PointerEvent) => {
                                if (!editMode) return
                                const dr = dragRef.current
                                if (!dr?.dragging || dr.kind !== 'mezh') return
                                const pt = clientToSvg(e.clientX, e.clientY)
                                if (!pt) return
                                const dx = pt.x - dr.startPt.x
                                const dy = pt.y - dr.startPt.y

                                setZoneOffsets(() => {
                                  const base = dr.startZoneOffsets
                                  const next = { ...base }
                                  if (moveAll) {
                                    for (const k of Object.keys(next)) next[k] = { ...base[k], x: base[k].x + dx, y: base[k].y + dy }
                                  } else {
                                    const id = dr.targetId
                                    const cur = base[id] ?? { x: 0, y: 0 }
                                    next[id] = { ...cur, x: cur.x + dx, y: cur.y + dy }
                                  }
                                  return next
                                })
                              }

                              const onPointerUp = () => {
                                if (dragRef.current) dragRef.current.dragging = false
                              }

                              return (
                                <g key={z.id} transform={t} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
                                  <path
                                    d={z.d}
                                    fill={z.fill}
                                    stroke={isSel && editMode ? 'rgba(255,255,255,0.95)' : z.stroke}
                                    strokeWidth={(z.strokeWidth ?? 3) + (isSel && editMode ? 1 : 0)}
                                    vectorEffect="non-scaling-stroke"
                                    opacity={isSel && editMode ? 0.95 : 0.9}
                                  />

                                  {isSel && editMode && (
                                    <path
                                      d={z.d}
                                      fill="none"
                                      stroke="rgba(71, 18, 217, 0.75)"
                                      strokeWidth={6}
                                      opacity={0.35}
                                      vectorEffect="non-scaling-stroke"
                                      filter="url(#glow)"
                                    />
                                  )}

                                  <text
                                    x={z.label.x}
                                    y={z.label.y}
                                    fill="rgba(255,255,255,0.86)"
                                    fontSize={22}
                                    fontFamily="ui-sans-serif"
                                    fontWeight={800}
                                  >
                                    {z.label.text}
                                  </text>
                                </g>
                              )
                            })}
                          </g>

                          <g>
                            {MEZH_POINTS.map((p, idx) => (
                              <g key={idx} transform={`translate(${p.x} ${p.y})`}>
                                <circle r="8" fill="rgba(6,20,28,0)" stroke="rgba(255,255,255,0)" strokeWidth="2" />
                                <circle r="3" fill="rgba(241, 91, 91, 0)" />
                              </g>
                            ))}
                          </g>
                        </g>
                      )}

                      {/* potential areas */}
                      {canShowPotentialNow && (
                        <g>
                          {POTENTIAL_AREAS.map((p) => {
                            const off = potentialOffsets[p.id] ?? { x: 0, y: 0 }
                            const isSel = editLayer === 'potential' && selectedPotentialId === p.id
                            const scale = off.scale ?? p.transform?.scale ?? 1
                            const t = scale !== 1 ? `translate(${off.x} ${off.y}) scale(${scale})` : `translate(${off.x} ${off.y})`

                            const onPointerDown = (e: React.PointerEvent) => {
                              if (!editMode || editLayer !== 'potential') return
                              e.preventDefault()
                              e.stopPropagation()
                              setSelectedPotentialId(p.id)
                              const pt = clientToSvg(e.clientX, e.clientY)
                              if (!pt) return
                              dragRef.current = {
                                dragging: true,
                                kind: 'potential',
                                startPt: pt,
                                startZoneOffsets: JSON.parse(JSON.stringify(zoneOffsets)),
                                startPotentialOffsets: JSON.parse(JSON.stringify(potentialOffsets)),
                                targetId: p.id,
                              }
                              ;(e.currentTarget as unknown as Element).setPointerCapture?.(e.pointerId)
                            }

                            const onPointerMove = (e: React.PointerEvent) => {
                              if (!editMode) return
                              const dr = dragRef.current
                              if (!dr?.dragging || dr.kind !== 'potential') return
                              const pt = clientToSvg(e.clientX, e.clientY)
                              if (!pt) return
                              const dx = pt.x - dr.startPt.x
                              const dy = pt.y - dr.startPt.y

                              setPotentialOffsets(() => {
                                const base = dr.startPotentialOffsets
                                const next = { ...base }
                                if (moveAll) {
                                  for (const k of Object.keys(next)) next[k] = { ...base[k], x: base[k].x + dx, y: base[k].y + dy }
                                } else {
                                  const id = dr.targetId
                                  const cur = base[id] ?? { x: 0, y: 0 }
                                  next[id] = { ...cur, x: cur.x + dx, y: cur.y + dy }
                                }
                                return next
                              })
                            }

                            const onPointerUp = () => {
                              if (dragRef.current) dragRef.current.dragging = false
                            }

                            return (
                              <g key={p.id} transform={t} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
                                <path
                                  d={p.d}
                                  fill={p.fill}
                                  stroke={isSel && editMode ? 'rgba(255,255,255,0.95)' : p.stroke}
                                  strokeWidth={(p.strokeWidth ?? 5) + (isSel && editMode ? 1 : 0)}
                                  vectorEffect="non-scaling-stroke"
                                  filter="url(#glow)"
                                  opacity={isSel && editMode ? 0.98 : 0.92}
                                />
                                {isSel && editMode && (
                                  <path
                                    d={p.d}
                                    fill="none"
                                    stroke="rgba(165,241,91,0.75)"
                                    strokeWidth={6}
                                    opacity={0.25}
                                    vectorEffect="non-scaling-stroke"
                                    filter="url(#glow)"
                                  />
                                )}
                              </g>
                            )
                          })}
                        </g>
                      )}
                    </motion.g>
                  )}
                </AnimatePresence>
              </svg>
            </div>

            {/* СЛОЙ МАРКЕРОВ/КАРТОЧКИ (поверх всех фонов, без маски, не режется) */}
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
                ref={markersSvgRef}
                viewBox={IMAGE_VIEWBOX}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 h-full w-full"
                style={{ overflow: 'visible' }}
                onClick={() => {
                  setActiveMarker(null)
                  setActiveZone(null)
                }}
              >
                <defs>
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

                  <filter id="pinShadow" x="-70%" y="-70%" width="240%" height="240%">
                    <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="rgba(0,0,0,0.35)" />
                  </filter>

                  <filter id="pinGlow" x="-80%" y="-80%" width="260%" height="260%">
                    <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="rgba(91,232,241,0.40)" />
                    <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="rgba(165,241,91,0.25)" />
                  </filter>
                </defs>

                {/* ✅ МАРКЕРЫ: ТОЛЬКО В SCHEME */}
                {mode === 'scheme' && (
                  <g>
                    {MAP_MARKERS.map((m) => {
                      const mo = markerOffsets[m.id] ?? { x: 0, y: 0 }
                      const mx = m.x + mo.x
                      const my = m.y + mo.y

                      const onMarkerClick = () => {
                        setActiveZone(null)
                        setSelectedMarkerId(m.id)
                        setActiveMarker((prev) => (prev === m.id ? null : m.id))
                      }

                      return <PremiumMarker key={m.id} x={mx} y={my} active={activeMarker === m.id} editing={false} onClick={onMarkerClick} />
                    })}
                  </g>
                )}

                {/* ✅ МАРКЕРЫ ЗОН: ТОЛЬКО В MEZH (кроме potential) */}
                {mode === 'mezh' && !editMode && (
                  <g>
                    {MEZH_ZONES.map((z) => {
                      const c = getZoneCenter(z)

                      const onZoneClick = () => {
                        setActiveMarker(null)
                        setSelectedZoneId(z.id)
                        setActiveZone((prev) => (prev === z.id ? null : z.id))
                      }

                      return (
                        <PremiumMarker
                          key={`zone-${z.id}`}
                          x={c.x}
                          y={c.y}
                          active={activeZone === z.id}
                          editing={false}
                          onClick={onZoneClick}
                        />
                      )
                    })}
                  </g>
                )}

                <AnimatePresence>
                  {/* ✅ КАРТОЧКА: ТОЛЬКО В SCHEME */}
                  {mode === 'scheme' &&
                    activeMarkerData &&
                    (() => {
                      const mo = markerOffsets[activeMarkerData.id] ?? { x: 0, y: 0 }
                      const mx = activeMarkerData.x + mo.x
                      const my = activeMarkerData.y + mo.y

                      const BASE_CARD = { x: 36, y: -230 }
                      const co = markerCardOffsets[activeMarkerData.id] ?? { x: 0, y: 0 }

                      const margin = 18
                      const cardW = Math.max(280, Math.min(480, vb.w * 0.92))
                      const cardH = Math.max(160, Math.min(220, vb.h * 0.42))

                      let cx = mx + BASE_CARD.x + co.x
                      let cy = my + BASE_CARD.y + co.y
                      let side: 'left' | 'right' = 'left'

                      if (cx + cardW > vb.maxX - margin) {
                        cx = mx - BASE_CARD.x - cardW + co.x
                        side = 'right'
                      }

                      if (cy < vb.minY + margin) {
                        cy = my + 38 + co.y
                      }

                      cx = Math.min(vb.maxX - margin - cardW, Math.max(vb.minX + margin, cx))
                      cy = Math.min(vb.maxY - margin - cardH, Math.max(vb.minY + margin, cy))

                      return (
                        <MarkerCard
                          key={activeMarkerData.id}
                          x={cx}
                          y={cy}
                          width={cardW}
                          height={cardH}
                          title={activeMarkerData.title}
                          lines={activeMarkerData.lines}
                          onClose={() => setActiveMarker(null)}
                          editing={false}
                          pointerSide={side}
                        />
                      )
                    })()}

                  {/* ✅ КАРТОЧКА: ТОЛЬКО В MEZH (7 пунктов) */}
                  {mode === 'mezh' &&
                    !editMode &&
                    activeZone &&
                    activeZoneCard &&
                    (() => {
                      const z = MEZH_ZONES.find((x) => x.id === activeZone)
                      if (!z) return null

                      const { x: mx, y: my } = getZoneCenter(z)

                      const BASE_CARD = { x: 44, y: -260 }
                      const margin = 18

                      const cardW = Math.max(320, Math.min(520, vb.w * 0.78))
                      const cardH = Math.max(210, Math.min(280, vb.h * 0.52))

                      let cx = mx + BASE_CARD.x
                      let cy = my + BASE_CARD.y
                      let side: 'left' | 'right' = 'left'

                      if (cx + cardW > vb.maxX - margin) {
                        cx = mx - BASE_CARD.x - cardW
                        side = 'right'
                      }

                      if (cy < vb.minY + margin) {
                        cy = my + 38
                      }

                      cx = Math.min(vb.maxX - margin - cardW, Math.max(vb.minX + margin, cx))
                      cy = Math.min(vb.maxY - margin - cardH, Math.max(vb.minY + margin, cy))

                      return (
                        <MarkerCard
                          key={`zone-card-${activeZone}`}
                          x={cx}
                          y={cy}
                          width={cardW}
                          height={cardH}
                          title={activeZoneCard.title}
                          lines={activeZoneCard.lines}
                          onClose={() => setActiveZone(null)}
                          editing={false}
                          pointerSide={side}
                        />
                      )
                    })()}
                </AnimatePresence>
              </svg>
            </div>
          </>
        )}
      </div>

      {infoCards}
    </div>
  )
}
