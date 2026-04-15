import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import mapImg from '../../assets/map.webp'
import { useDeck } from '../../components/deckContext'
import AerialEditorPanel from './editor/AerialEditorPanel'
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
  POTENTIAL_OFFSETS_MEZH,
  POTENTIAL_OFFSETS_SCHEME,
} from '../../data/parcelPaths'

import { RoutesModal, type RouteTab } from './slideAerial/components/RoutesModal'
import { TopToggleButton } from './slideAerial/components/TopToggleButton'
import { InfoPanels } from './slideAerial/components/InfoPanels'
import { PremiumMarker } from './slideAerial/components/markers/PremiumMarker'
import { MarkerCard } from './slideAerial/components/markers/MarkerCard'
import { MarkerCardHtml } from './slideAerial/components/markers/MarkerCardHtml'
import { dissolveMaskStyle, MAP_LIFT_PX, UI_TOP_DOCK_OFFSET, UI_TOP_MIN } from './slideAerial/ui'
import { isWebkitSafariLike } from './slideAerial/utils'
import { OWNER_BY_ID, OWNER_ZONE_MAP, type OwnerId } from './slideAerial/ownersData'

type FitBox = { left: number; top: number; width: number; height: number }
type OverlayMode = 'scheme' | 'mezh' | 'none'
type EditLayer = 'mezh' | 'potential' | 'markerPin' | 'markerCard'
type PotentialTarget = 'scheme' | 'mezh'

const LOCATION = 'Тверская область, р-н. Калининский, с/п. Каблуковское, д. Заборовье'

export default function SlideAerial() {
  const deck = useDeck()
  const POTENTIAL_MARKER_ID = 'view' as const

  const stageRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const markersSvgRef = useRef<SVGSVGElement | null>(null)

  // ✅ ключевой фикс: подавляем следующий svg.onClick после клика по маркеру (Safari)
  const suppressSvgClickRef = useRef(false)

  const [fit, setFit] = useState<FitBox | null>(null)
  const [mode, setMode] = useState<OverlayMode>('mezh')

  const [activeMarker, setActiveMarker] = useState<string | null>(null)
  const [activeZone, setActiveZone] = useState<string | null>(null)

  const [showPotential, setShowPotential] = useState(true)
  const canShowPotentialNow = showPotential

  // ✅ редактор UI
  const [editorOpen, setEditorOpen] = useState(false)
  const editorAllowed = useMemo(() => {
    if (import.meta.env.DEV) return true
    if (typeof window === 'undefined') return false
    try {
      const sp = new URLSearchParams(window.location.search)
      if (sp.get('editor') === '1') return true
      if (window.localStorage?.getItem('volga_editor') === '1') return true
    } catch {
      // ignore
    }
    return false
  }, [])

  useEffect(() => {
    if (!editorAllowed) return
    const onKeyDown = (e: KeyboardEvent) => {
      const key = String((e as any).key || '')
      const isToggle = (e.ctrlKey || (e as any).metaKey) && (e as any).shiftKey && (key === 'E' || key === 'e')
      if (isToggle) {
        e.preventDefault()
        setEditorOpen((v) => !v)
      }
      if (key === 'Escape') setEditorOpen(false)
    }
    window.addEventListener('keydown', onKeyDown, { passive: false } as any)
    return () => window.removeEventListener('keydown', onKeyDown as any)
  }, [editorAllowed])

  const [editMode, setEditMode] = useState(false)
  const [editLayer, setEditLayer] = useState<EditLayer>('mezh')
  const [moveAll, setMoveAll] = useState(false)
  const [step, setStep] = useState(5)

  // ✅ цель редактирования потенциалов
  const [potentialTarget, setPotentialTarget] = useState<PotentialTarget>('scheme')

  const [selectedZoneId, setSelectedZoneId] = useState<string>(MEZH_ZONES[0]?.id ?? 'A')
  const [selectedPotentialId, setSelectedPotentialId] = useState<string>(POTENTIAL_AREAS[0]?.id ?? 'P1')
  const [selectedMarkerId, setSelectedMarkerId] = useState<string>(MAP_MARKERS[0]?.id ?? 'beach')

  // ✅ нижние карточки
  const [infoOpen, setInfoOpen] = useState(true)

  // ✅ маршруты
  const [routesOpen, setRoutesOpen] = useState(false)
  const [routeTab, setRouteTab] = useState<RouteTab>('moscow')

  // ✅ выбранный собственник (для подсветки зон)
  const [activeOwner, setActiveOwner] = useState<OwnerId | null>(null)

  // ✅ Safari/WebKit
  const useHtmlMarkerCards = useMemo(() => isWebkitSafariLike(), [])

  const vb = useMemo(() => {
    const parts = String(IMAGE_VIEWBOX).trim().split(/\s+/).map(Number)
    const minX = Number.isFinite(parts[0]) ? parts[0] : 0
    const minY = Number.isFinite(parts[1]) ? parts[1] : 0
    const w = Number.isFinite(parts[2]) ? parts[2] : 1000
    const h = Number.isFinite(parts[3]) ? parts[3] : 600
    return { minX, minY, w, h, maxX: minX + w, maxY: minY + h }
  }, [])

  /** Геометрия "xMidYMid meet" */
  const svgGeom = useMemo(() => {
    if (!fit) return null
    const scale = Math.min(fit.width / vb.w, fit.height / vb.h)
    const contentW = vb.w * scale
    const contentH = vb.h * scale
    const padX = (fit.width - contentW) / 2
    const padY = (fit.height - contentH) / 2
    return { scale, padX, padY }
  }, [fit, vb.w, vb.h])

  const svgToPx = useCallback(
    (sx: number, sy: number) => {
      if (!svgGeom) return { x: 0, y: 0, scale: 1 }
      return {
        x: svgGeom.padX + (sx - vb.minX) * svgGeom.scale,
        y: svgGeom.padY + (sy - vb.minY) * svgGeom.scale,
        scale: svgGeom.scale,
      }
    },
    [svgGeom, vb.minX, vb.minY],
  )

  const activeOwnerSet = useMemo(() => {
    if (!activeOwner) return null
    return new Set(OWNER_ZONE_MAP[activeOwner] ?? [])
  }, [activeOwner])

  // ✅ номер участка по зоне (для выбранного собственника)
  const ownerPlotNoByZone = useMemo(() => {
    if (!activeOwner) return null
    const card = OWNER_BY_ID[activeOwner]
    if (!card) return null

    const out: Record<string, string> = {}
    for (const a of card.areas || []) {
      const m = String(a.label || '').match(/Участок\s*(\d+)/i)
      if (!m) continue
      const no = m[1]
      for (const z of a.zones || []) out[z] = no
    }
    return out
  }, [activeOwner])

  const mezhZoneColorMap = useMemo(() => {
    const out: Record<string, string> = {}
    for (const z of MEZH_ZONES) out[z.id] = z.fill ?? z.stroke ?? 'rgba(255,255,255,0.55)'
    return out
  }, [])

  const ownerToneColors = useMemo(() => {
    const zoneById = new Map(MEZH_ZONES.map((z) => [z.id, z] as const))
    const pick = (ids: string[]) => {
      const colors: string[] = []
      for (const id of ids) {
        const z = zoneById.get(id)
        if (!z) continue
        if (z.fill) colors.push(z.fill)
        if (z.stroke) colors.push(z.stroke)
      }
      const uniqC = Array.from(new Set(colors)).filter(Boolean)
      if (uniqC.length >= 2) return uniqC.slice(0, 3)
      return ['rgba(165,241,91,1)', 'rgba(91,232,241,1)', 'rgba(241, 91, 91, 1)']
    }

    return {
      owner1: pick(OWNER_ZONE_MAP.owner1),
      owner2: pick(OWNER_ZONE_MAP.owner2),
      owner3: pick(OWNER_ZONE_MAP.owner3),
      owner4: pick(OWNER_ZONE_MAP.owner4),
      owner5: pick(OWNER_ZONE_MAP.owner5),
    } satisfies Record<OwnerId, string[]>
  }, [])

  const potentialToneColors = useMemo(() => {
    const colors: string[] = []
    for (const p of POTENTIAL_AREAS) {
      if (p.fill) colors.push(p.fill)
      if (p.stroke) colors.push(p.stroke)
    }
    const uniqC = Array.from(new Set(colors)).filter(Boolean)
    if (uniqC.length >= 2) return uniqC.slice(0, 3)
    return ['rgba(165,241,91,1)', 'rgba(91,232,241,1)', 'rgba(241, 91, 91, 1)']
  }, [])

  // ---- offsets: MEZH ----
  const buildMezhOffsetsFromFile = useCallback(() => {
    const obj: Record<string, { x: number; y: number; scale?: number }> = {}
    for (const z of MEZH_ZONES) {
      const fromMap = MEZH_ZONE_OFFSETS?.[z.id]
      obj[z.id] = { x: fromMap?.x ?? z.transform?.x ?? 0, y: fromMap?.y ?? z.transform?.y ?? 0, scale: z.transform?.scale }
    }
    return obj
  }, [])
  const [zoneOffsets, setZoneOffsets] = useState<Record<string, { x: number; y: number; scale?: number }>>(() =>
    buildMezhOffsetsFromFile(),
  )

  // ---- offsets: POTENTIAL ----
  const buildPotentialOffsetsFromFile = useCallback((target: PotentialTarget) => {
    const obj: Record<string, { x: number; y: number; scale?: number }> = {}
    const map =
      target === 'mezh'
        ? (POTENTIAL_OFFSETS_MEZH as Record<string, { x: number; y: number; scale?: number }>)
        : (POTENTIAL_OFFSETS_SCHEME as Record<string, { x: number; y: number; scale?: number }>)

    for (const p of POTENTIAL_AREAS) {
      const fromMap = map?.[p.id]
      obj[p.id] = { x: fromMap?.x ?? 0, y: fromMap?.y ?? 0, scale: fromMap?.scale ?? p.transform?.scale }
    }
    return obj
  }, [])
  const [potentialOffsetsScheme, setPotentialOffsetsScheme] = useState<Record<string, { x: number; y: number; scale?: number }>>(() =>
    buildPotentialOffsetsFromFile('scheme'),
  )
  const [potentialOffsetsMezh, setPotentialOffsetsMezh] = useState<Record<string, { x: number; y: number; scale?: number }>>(() =>
    buildPotentialOffsetsFromFile('mezh'),
  )

  const activePotentialOffsets = useMemo(() => (mode === 'mezh' ? potentialOffsetsMezh : potentialOffsetsScheme), [
    mode,
    potentialOffsetsMezh,
    potentialOffsetsScheme,
  ])

  // ---- offsets: MARKERS ----
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

  const exportJson = useMemo(
    () => JSON.stringify({ zoneOffsets, potentialOffsetsScheme, potentialOffsetsMezh, markerOffsets, markerCardOffsets }, null, 2),
    [zoneOffsets, potentialOffsetsScheme, potentialOffsetsMezh, markerOffsets, markerCardOffsets],
  )

  const applyImportJson = useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(String(raw || ''))
      if (!parsed || typeof parsed !== 'object') return { ok: false, error: 'not an object' }
      const getObj = (v: any) => (v && typeof v === 'object' ? v : null)

      const zo = getObj((parsed as any).zoneOffsets)
      const pos = getObj((parsed as any).potentialOffsetsScheme)
      const pom = getObj((parsed as any).potentialOffsetsMezh)
      const mo = getObj((parsed as any).markerOffsets)
      const mco = getObj((parsed as any).markerCardOffsets)

      if (zo) setZoneOffsets(zo as any)
      if (pos) setPotentialOffsetsScheme(pos as any)
      if (pom) setPotentialOffsetsMezh(pom as any)
      if (mo) setMarkerOffsets(mo as any)
      if (mco) setMarkerCardOffsets(mco as any)
      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: String(e?.message || e) }
    }
  }, [])

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

    const topRaw = (ch - height) / 2 - MAP_LIFT_PX
    const top = Math.max(-height * 0.15, topRaw)

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

  const isMezh = mode === 'mezh'
  const topControlsTop = useMemo(() => (fit ? Math.max(UI_TOP_MIN, fit.top - UI_TOP_DOCK_OFFSET) : 24), [fit])

  const activeMarkerData = useMemo(() => MAP_MARKERS.find((m) => m.id === activeMarker) ?? null, [activeMarker])
  const activeZoneCard = useMemo(() => (activeZone ? MEZH_ZONE_CARDS[activeZone] ?? null : null), [activeZone])

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

  const openZone = useCallback((zoneId: string) => {
    suppressSvgClickRef.current = true
    setActiveMarker(null)
    setSelectedZoneId(zoneId)
    setActiveZone((prev) => (prev === zoneId ? null : zoneId))
  }, [])

  const visibleMarkers = useMemo(
    () => MAP_MARKERS.filter((m) => (m.id === POTENTIAL_MARKER_ID ? canShowPotentialNow : mode === 'scheme')),
    [mode, canShowPotentialNow],
  )
  const isMarkerVisible = useCallback((id: string) => visibleMarkers.some((m) => m.id === id), [visibleMarkers])

  // ---- editor layer check ----
  const canEditLayer = useMemo(() => {
    if (!editorOpen) return false
    if (editLayer === 'mezh') return mode === 'mezh'
    if (editLayer === 'potential') {
      if (!canShowPotentialNow) return false
      return (potentialTarget === 'scheme' && (mode === 'scheme' || mode === 'none')) || (potentialTarget === 'mezh' && mode === 'mezh')
    }
    if (editLayer === 'markerPin' || editLayer === 'markerCard') return mode === 'scheme'
    return false
  }, [editorOpen, editLayer, mode, canShowPotentialNow, potentialTarget])

  const markersLayerPassThrough = useMemo(() => {
    if (!editorOpen || !editMode) return false
    if (!canEditLayer) return false
    return editLayer === 'mezh' || editLayer === 'potential'
  }, [editorOpen, editMode, canEditLayer, editLayer])

  // ---- state sync ----
  useEffect(() => {
    if (!editorOpen) {
      setEditMode(false)
      return
    }
    if (mode === 'mezh') setEditLayer('mezh')
    if (mode === 'scheme') setEditLayer('markerPin')
    if (mode === 'none') setEditLayer(showPotential ? 'potential' : 'markerPin')
  }, [editorOpen, mode, showPotential])

  useEffect(() => {
    if (mode !== 'mezh') {
      setActiveOwner(null)
      setActiveZone(null)
    }

    if (mode === 'mezh') {
      if (activeMarker && activeMarker !== POTENTIAL_MARKER_ID) setActiveMarker(null)
      if (activeMarker === POTENTIAL_MARKER_ID && !canShowPotentialNow) setActiveMarker(null)
    }
  }, [mode, activeMarker, canShowPotentialNow])

  const modeLabel =
    mode === 'scheme' ? 'Общая схема' : mode === 'mezh' ? 'Карта межевания' : showPotential ? 'Потенциалы' : 'Общая информация'
  const hasAnyOverlay = mode !== 'none' || canShowPotentialNow

  return (
    <div className="relative h-full w-full overflow-hidden bg-eco-gradient noise">
      <div
  ref={stageRef}
  className="absolute inset-0 touch-none"
>
        <img
          src={mapImg}
          alt=""
          decoding="async"
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-35"
          aria-hidden="true"
          draggable={false}
        />
        <div className="absolute inset-0 bg-volga-night/55" />
        <img ref={imgRef} src={mapImg} alt="" decoding="async" className="absolute opacity-0" aria-hidden="true" onLoad={recalc} />

        {/* ✅ КНОПКА "Маршруты" */}
        <div className="pointer-events-auto absolute left-5 top-5 z-[90]">
          
        </div>

        <RoutesModal open={routesOpen} tab={routeTab} onTab={setRouteTab} destination={LOCATION} onClose={() => setRoutesOpen(false)} />

        <AerialEditorPanel
          open={editorAllowed && editorOpen}
          mode={mode}
          canShowPotentialNow={canShowPotentialNow}
          editMode={editMode}
          setEditMode={setEditMode}
          editLayer={editLayer}
          setEditLayer={setEditLayer}
          moveAll={moveAll}
          setMoveAll={setMoveAll}
          step={step}
          setStep={setStep}
          potentialTarget={potentialTarget}
          setPotentialTarget={setPotentialTarget}
          zoneIds={MEZH_ZONES.map((z) => z.id)}
          selectedZoneId={selectedZoneId}
          setSelectedZoneId={setSelectedZoneId}
          potentialIds={POTENTIAL_AREAS.map((a) => a.id)}
          selectedPotentialId={selectedPotentialId}
          setSelectedPotentialId={setSelectedPotentialId}
          markerIds={MAP_MARKERS.map((m) => m.id)}
          selectedMarkerId={selectedMarkerId}
          setSelectedMarkerId={setSelectedMarkerId}
          exportJson={exportJson}
          applyImportJson={applyImportJson}
        />

        {/* режимы + чекбокс */}
<div
  className="pointer-events-auto absolute left-1/2 z-50 -translate-x-1/2"
  style={{ top: topControlsTop, transition: 'top 200ms ease' }}
>
  {/* полностью прозрачный контейнер */}
  <div
    className="px-3 py-2"
    style={{
      background: 'transparent',
      boxShadow: 'none',
      backdropFilter: 'none',
      border: 'none'
    }}
  >

    <div className="flex flex-wrap items-center gap-2">

      {/* Маршруты */}
      <button
        onClick={() => {
          setRouteTab('moscow')
          setRoutesOpen(true)
        }}
        className="rounded-2xl px-4 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/15 transition hover:bg-white/10"
        style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(10px)'
        }}
        title="Маршруты до участка"
      >
        Маршруты
      </button>

      {/* Карта межевания */}
      {/* <TopToggleButton
        active={isMezh}
        onClick={() => {
          setMode((m) => (m === 'mezh' ? 'none' : 'mezh'))
          setActiveZone(null)
          setEditMode(false)
          setActiveOwner(null)
          setPotentialTarget('mezh')
        }}
      >
        Карта межевания
      </TopToggleButton> */}

      {/* Потенциальные территории */}
      <div className="ml-2 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/15">
        <input
          id="potential"
          type="checkbox"
          className="h-4 w-4 accent-lime-300"
          checked={showPotential}
          onChange={(e) => setShowPotential(e.target.checked)}
        />
        <label
          htmlFor="potential"
          className="select-none text-sm font-semibold text-white/80"
        >
          Потенциальные территории
        </label>
      </div>

    </div>
  </div>
</div>

        {fit && (
          <>
            {/* БАЗОВЫЙ СЛОЙ */}
            <div className="absolute z-10" style={{ left: fit.left, top: fit.top, width: fit.width, height: fit.height, ...dissolveMaskStyle }}>
              <img src={mapImg} alt="Аэроснимок участка" decoding="async" className="absolute inset-0 h-full w-full object-cover" draggable={false} />

              <svg ref={svgRef} viewBox={IMAGE_VIEWBOX} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
                <defs>
                  <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="rgba(165,241,91,0.65)" />
                  </filter>
                </defs>

                <AnimatePresence>
                  {hasAnyOverlay && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {canShowPotentialNow && (
                        <g>
                          {POTENTIAL_AREAS.map((p) => {
                            const off = activePotentialOffsets[p.id] ?? { x: 0, y: 0 }
                            const isSel = editMode && editLayer === 'potential' && selectedPotentialId === p.id
                            const scale = off.scale ?? p.transform?.scale ?? 1
                            const t = scale !== 1 ? `translate(${off.x} ${off.y}) scale(${scale})` : `translate(${off.x} ${off.y})`

                            return (
                              <g key={p.id} transform={t}>
                                <path
                                  d={p.d}
                                  fill={p.fill}
                                  stroke={isSel ? 'rgba(255,255,255,0.95)' : p.stroke}
                                  strokeWidth={(p.strokeWidth ?? 5) + (isSel ? 1 : 0)}
                                  vectorEffect="non-scaling-stroke"
                                  filter="url(#glow)"
                                  opacity={isSel ? 0.98 : 0.92}
                                />
                              </g>
                            )
                          })}
                        </g>
                      )}

                      {mode === 'scheme' && (
                        <path d={PARCEL_PATH_DETAIL} fill={PARCEL_FILL} stroke={PARCEL_STROKE} strokeWidth={4} filter="url(#glow)" vectorEffect="non-scaling-stroke" />
                      )}

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
                              const isSel = editMode && editLayer === 'mezh' && selectedZoneId === z.id
                              const scale = off.scale ?? z.transform?.scale ?? 1
                              const t = scale !== 1 ? `translate(${off.x} ${off.y}) scale(${scale})` : `translate(${off.x} ${off.y})`

                              // ✅ ФОКУС: собственник и/или зона
                              const hasOwnerFocus = !!activeOwnerSet
                              const isOwnerZone = hasOwnerFocus ? activeOwnerSet!.has(z.id) : false

                              const hasZoneFocus = !!activeZone
                              const isActiveZone = hasZoneFocus ? activeZone === z.id : false

                              const isDimmed = (hasOwnerFocus && !isOwnerZone) || (hasZoneFocus && !isActiveZone)

                              const fill = isDimmed ? 'rgba(210,210,210,0.28)' : z.fill
                              const stroke = isDimmed ? 'rgba(255,255,255,0.18)' : z.stroke
                              const baseOpacity = isDimmed ? 0.78 : 0.9

                              return (
                                <g key={z.id} transform={t}>
                                  <path
                                    d={z.d}
                                    fill={fill}
                                    stroke={isSel ? 'rgba(255,255,255,0.95)' : stroke}
                                    strokeWidth={(z.strokeWidth ?? 3) + (isSel ? 1 : 0)}
                                    vectorEffect="non-scaling-stroke"
                                    opacity={isSel ? 0.95 : baseOpacity}
                                  />

                                  {/* ✅ glow для выбранного собственника */}
                                  {hasOwnerFocus && isOwnerZone && !hasZoneFocus && (
                                    <path
                                      d={z.d}
                                      fill="none"
                                      stroke="rgba(255,255,255,0.90)"
                                      strokeWidth={6}
                                      opacity={0.42}
                                      vectorEffect="non-scaling-stroke"
                                      filter="url(#glow)"
                                    />
                                  )}

                                  {/* ✅ glow для выбранной зоны */}
                                  {hasZoneFocus && isActiveZone && (
                                    <path
                                      d={z.d}
                                      fill="none"
                                      stroke="rgba(255,255,255,0.90)"
                                      strokeWidth={7}
                                      opacity={0.45}
                                      vectorEffect="non-scaling-stroke"
                                      filter="url(#glow)"
                                    />
                                  )}

                                  <text
                                    x={z.label.x}
                                    y={z.label.y}
                                    fill={isDimmed ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.86)'}
                                    fontSize={22}
                                    fontFamily="ui-sans-serif"
                                    fontWeight={800}
                                    opacity={isDimmed ? 0.7 : 1}
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
                    </motion.g>
                  )}
                </AnimatePresence>
              </svg>
            </div>

            {/* СЛОЙ МАРКЕРОВ/КАРТОЧКИ */}
            <div className={`${markersLayerPassThrough ? 'pointer-events-none' : 'pointer-events-auto'} absolute z-40`} style={{ left: fit.left, top: fit.top, width: fit.width, height: fit.height, overflow: 'visible' }}>
              <svg
                ref={markersSvgRef}
                viewBox={IMAGE_VIEWBOX}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 h-full w-full"
                style={{ overflow: 'visible' }}
                onClick={() => {
                  if (suppressSvgClickRef.current) {
                    suppressSvgClickRef.current = false
                    return
                  }
                  setActiveMarker(null)
                  setActiveZone(null)
                }}
              >
                <defs>
                  <radialGradient id="pinHead" cx="34%" cy="28%" r="82%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.96)" />
                    <stop offset="42%" stopColor="rgba(206,255,251,0.96)" />
                    <stop offset="100%" stopColor="rgba(108,235,225,0.92)" />
                  </radialGradient>

                  <linearGradient id="pinBody" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(240,255,255,0.96)" />
                    <stop offset="48%" stopColor="rgba(123,255,244,0.74)" />
                    <stop offset="100%" stopColor="rgba(67,113,255,0.68)" />
                  </linearGradient>

                  <filter id="pinShadow" x="-80%" y="-80%" width="260%" height="260%">
                    <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="rgba(0,0,0,0.32)" />
                  </filter>

                  <filter id="pinGlow" x="-90%" y="-90%" width="280%" height="280%">
                    <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="rgba(90,255,245,0.36)" />
                    <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="rgba(140,194,255,0.22)" />
                  </filter>
                </defs>

                {/* ✅ КЛИК ПО ЗОНАМ (работает всегда в mezh, даже когда собственник не выбран) */}
                {mode === 'mezh' && !editMode && (
                  <g>
                    {MEZH_ZONES.map((z) => {
                      const off = zoneOffsets[z.id] ?? { x: 0, y: 0 }
                      const scale = off.scale ?? z.transform?.scale ?? 1
                      const t = scale !== 1 ? `translate(${off.x} ${off.y}) scale(${scale})` : `translate(${off.x} ${off.y})`
                      const usePointerDown = useHtmlMarkerCards

                      return (
                        <g key={`hit-${z.id}`} transform={t}>
                          <path
                            d={z.d}
                            fill="rgba(0,0,0,0.001)" // ✅ важно: не 0
                            stroke="rgba(0,0,0,0)"
                            style={{ cursor: 'pointer', pointerEvents: 'all' }}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (usePointerDown) return
                              openZone(z.id)
                            }}
                            onPointerDown={(e) => {
                              if (!usePointerDown) return
                              e.preventDefault()
                              e.stopPropagation()
                              openZone(z.id)
                            }}
                          />
                        </g>
                      )
                    })}
                  </g>
                )}

                {hasAnyOverlay && (
                  <g>
                    {visibleMarkers.map((m) => {
                      const mo = markerOffsets[m.id] ?? { x: 0, y: 0 }
                      const mx = m.x + mo.x
                      const my = m.y + mo.y

                      const allowDrag = editorOpen && editMode && editLayer === 'markerPin' && mode === 'scheme'

                      const onMarkerClick = () => {
                        suppressSvgClickRef.current = true
                        setActiveZone(null)
                        setSelectedMarkerId(m.id)
                        if (!allowDrag) setActiveMarker((prev) => (prev === m.id ? null : m.id))
                        else setActiveMarker(m.id)
                      }

                      return (
                        <PremiumMarker
                          key={m.id}
                          x={mx}
                          y={my}
                          active={activeMarker === m.id || selectedMarkerId === m.id}
                          editing={allowDrag}
                          usePointerDown={useHtmlMarkerCards}
                          onTrigger={() => (suppressSvgClickRef.current = true)}
                          onClick={onMarkerClick}
                        />
                      )
                    })}
                  </g>
                )}

                {/* ✅ ПИНЫ ЗОН: показываем ТОЛЬКО когда выбран собственник */}
                {mode === 'mezh' && !editMode && activeOwnerSet && (
                  <g>
                    {MEZH_ZONES.filter((z) => activeOwnerSet.has(z.id)).map((z) => {
                      const off = zoneOffsets[z.id] ?? { x: 0, y: 0, scale: 1 }
                      const scale = off.scale ?? z.transform?.scale ?? 1
                      const cx = off.x + (z.label?.x ?? 0) * scale
                      const cy = off.y + (z.label?.y ?? 0) * scale

                      const plotNo = ownerPlotNoByZone?.[z.id]
                      const labelText = plotNo ? `участок №${plotNo}` : undefined

                      return (<></>
                        // <PremiumMarker
                        //   key={`zone-${z.id}`}
                        //   x={cx}
                        //   y={cy}
                        //   active={activeZone === z.id}
                        //   editing={false}
                        //   labelText={labelText}
                        //   usePointerDown={useHtmlMarkerCards}
                        //   onTrigger={() => (suppressSvgClickRef.current = true)}
                        //   onClick={() => openZone(z.id)}
                        // />
                      )
                    })}
                  </g>
                )}

                {/* ✅ НЕ Safari: карточки через foreignObject */}
                {!useHtmlMarkerCards && (
                  <AnimatePresence>
                    {activeMarkerData &&
                      isMarkerVisible(activeMarkerData.id) &&
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
                        if (cy < vb.minY + margin) cy = my + 38 + co.y

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
                        if (cy < vb.minY + margin) cy = my + 38

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
                )}
              </svg>

              {/* ✅ Safari: карточки через HTML overlay */}
              {useHtmlMarkerCards && fit && svgGeom && (
                <div className="absolute inset-0" style={{ pointerEvents: 'none', overflow: 'visible' }}>
                  <AnimatePresence>
                    {activeMarkerData &&
                      isMarkerVisible(activeMarkerData.id) &&
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
                        if (cy < vb.minY + margin) cy = my + 38 + co.y

                        cx = Math.min(vb.maxX - margin - cardW, Math.max(vb.minX + margin, cx))
                        cy = Math.min(vb.maxY - margin - cardH, Math.max(vb.minY + margin, cy))

                        const px = svgToPx(cx, cy)

                        return (
                          <MarkerCardHtml
                            key={`html-${activeMarkerData.id}`}
                            leftPx={px.x}
                            topPx={px.y}
                            scale={px.scale}
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
                        if (cy < vb.minY + margin) cy = my + 38

                        cx = Math.min(vb.maxX - margin - cardW, Math.max(vb.minX + margin, cx))
                        cy = Math.min(vb.maxY - margin - cardH, Math.max(vb.minY + margin, cy))

                        const px = svgToPx(cx, cy)

                        return (
                          <MarkerCardHtml
                            key={`html-zone-${activeZone}`}
                            leftPx={px.x}
                            topPx={px.y}
                            scale={px.scale}
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
                </div>
              )}
            </div>
          </>
        )}

        {/* ✅ Нижняя тонкая панель */}
        <div className="pointer-events-none absolute inset-x-0 bottom-5 z-[80]">
          <div className="pointer-events-auto mx-auto flex w-fit items-center gap-2 rounded-2xl bg-white/8 px-2 py-2 backdrop-blur-xl shadow-soft">
            <button onClick={deck.prev} className="rounded-2xl px-4 py-2 text-sm font-semibold text-white/85 ring-1 ring-white/14 transition hover:bg-white/10">
              ← Назад
            </button>

            <button
              onClick={() => setInfoOpen((v) => !v)}
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/18 transition hover:bg-white/10"
              title="Показать/скрыть нижние карточки"
            >
              {infoOpen ? 'Скрыть карточки' : 'Показать карточки'} • {modeLabel}
            </button>

            <button onClick={deck.next} className="rounded-2xl px-4 py-2 text-sm font-semibold text-white/85 ring-1 ring-white/14 transition hover:bg-white/10">
              Далее →
            </button>
          </div>
        </div>
      </div>

      <InfoPanels
        open={infoOpen}
        mode={mode}
        showPotential={showPotential}
        location={LOCATION}
        activeOwner={activeOwner}
        onOwnerClick={(id) => {
          setActiveOwner((prev) => (prev === id ? null : id))
          setActiveZone(null)
        }}
        ownerToneColors={ownerToneColors}
        mezhZoneColorMap={mezhZoneColorMap}
        potentialToneColors={potentialToneColors}
      />
    </div>
  )
}