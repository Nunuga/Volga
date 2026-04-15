import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import mapImg from '../../assets/map4.webp'
import { IMAGE_VIEWBOX } from '../../data/parcelPaths'
import { useDeck } from '../../components/deckContext'

import type { FitBox, Pin } from './slidePatchMap/types'
import PatchMapEditorPanel from './slidePatchMap/editor/PatchMapEditorPanel'
import { PremiumMarker } from './slidePatchMap/components/PremiumMarker'
import { PhotoModal } from './slidePatchMap/components/PhotoModal'
import { PanelCard } from './slidePatchMap/components/PanelCard'
import { SlogansInfoDock } from './slidePatchMap/components/SlogansInfoDock'
import { dissolveMaskStyle } from './slidePatchMap/ui'
import { QUOTES } from './slidePatchMap/data/quotes'
import { COMPARE_PINS_FALLBACK, MY_TERRITORY } from './slidePatchMap/data/pins'
import type { InfoTabId } from './slidePatchMap/data/infoTabs'
import { clamp, round2 } from './slidePatchMap/utils/math'
import { clientToSvgPoint, parseViewBox } from './slidePatchMap/utils/svg'

export default function SlidePatchMap() {
  const deck = useDeck()
  const [panelsOpen, setPanelsOpen] = useState(true)

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

  // ✅ Quotes
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [quotePaused, setQuotePaused] = useState(false)

  // ✅ Инфо-вкладки (иконки слева в столбец)
  const [infoTab, setInfoTab] = useState<InfoTabId>('infrastructure')

  // ✅ Popup ABSOLUTE (внутри stage) + clamp
  const popupRef = useRef<HTMLDivElement | null>(null)
  const [popupTick, setPopupTick] = useState(0)
  const [popupPos, setPopupPos] = useState<{ left: number; top: number; placement: 'top' | 'bottom' } | null>(null)

  // ✅ contain
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
    if (!selectedPin || editorOpen || !panelsOpen) return
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
  }, [selectedPin?.id, editorOpen, panelsOpen])

  // ✅ clamp popup
  useLayoutEffect(() => {
    if (!fit || !popupPx || !selectedPin || editorOpen || !panelsOpen) return
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
  }, [fit?.cw, fit?.ch, fit?.left, fit?.top, popupPx?.x, popupPx?.y, selectedPin?.id, editorOpen, popupTick, cardIdx[selectedPin?.id ?? ''], panelsOpen])

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
          <img src={mapImg} alt="" draggable={false} className="absolute inset-0 h-full w-full scale-110 object-cover blur-3xl opacity-55" aria-hidden="true" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(1200px 600px at 15% 20%, rgba(165,241,91,0.10), transparent 55%), linear-gradient(180deg, rgba(6,14,22,0.35), rgba(6,14,22,0.62))',
            }}
          />
        </div>

        {/* preload natural sizes */}
        <img ref={imgRef} src={mapImg} alt="" decoding="async" className="absolute pointer-events-none opacity-0" aria-hidden="true" onLoad={recalc} />

        {fit && (
          <>
            {/* ✅ основной слой карты (contain, без обрезки) */}
            <div className="absolute z-10" style={{ left: fit.left, top: fit.top, width: fit.width, height: fit.height, ...dissolveMaskStyle }}>
              <img src={mapImg} alt="Карта" decoding="async" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(165,241,91,0.10),transparent_62%)]" />
            </div>

            {/* markers layer */}
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
                            togglePin(p.id)
                          }}
                        />
                      )
                    })}
                  </motion.g>
                </AnimatePresence>
              </svg>
            </div>

            {/* ✅ POPUP карточка */}
            <AnimatePresence>
              {panelsOpen && !!selectedPin && !editorOpen && (
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

            {/* ✅ СЛОГАНЫ (сверху) + ИНФО-ОКНО (под ними) */}
            {panelsOpen && (
              <SlogansInfoDock
                fit={fit}
                quotes={QUOTES}
                quoteIdx={quoteIdx}
                onPrevQuote={prevQuote}
                onNextQuote={nextQuote}
                onPauseQuotes={() => setQuotePaused(true)}
                onResumeQuotes={() => setQuotePaused(false)}
                activeTab={infoTab}
                onTab={setInfoTab}
                onBack={deck.prev}
              />
            )}

            {/* ✅ EDITOR PANEL */}
            <PatchMapEditorPanel
              open={editorAllowed && editorOpen}
              editingId={editingId}
              setEditingId={setEditingId}
              comparePins={comparePins}
              editingPin={editingPin}
              round2={round2}
              updatePin={updatePin}
              deletePin={deletePin}
              copyCoordsSnippet={copyCoordsSnippet}
              coordsText={coordsText}
            />

            {/* ✅ Photo modal */}
            <PhotoModal open={!!modal} title={modalPin?.title ?? ''} images={modalPin?.images ?? []} startIndex={modal?.startIdx ?? 0} onClose={closeModal} />
          </>
        )}

       
          </div>
        </div>
   
  )
}
