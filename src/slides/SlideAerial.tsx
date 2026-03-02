import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import mapImg from '../assets/map.webp'
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
  POTENTIAL_OFFSETS_MEZH,
  POTENTIAL_OFFSETS_SCHEME,
} from '../data/parcelPaths'

type FitBox = { left: number; top: number; width: number; height: number }
type OverlayMode = 'scheme' | 'mezh' | 'none'
type EditLayer = 'mezh' | 'potential' | 'markerPin' | 'markerCard'
type PotentialTarget = 'scheme' | 'mezh'
const BOTTOM_BAR_SPACE_PX = 56
const BOTTOM_BAR_SAFE = `calc(${BOTTOM_BAR_SPACE_PX}px + env(safe-area-inset-bottom))`
const LOCATION = 'Тверская область, р-н. Калининский, с/п. Каблуковское, д. Заборовье'

// ✅ панель сверху: докуем к верхней границе карты
const UI_TOP_MIN = 18
const UI_TOP_DOCK_OFFSET = 72

// ✅ ВАЖНО: поднимаем картинку и все слои, завязанные на fit.top
const MAP_LIFT_PX = 120

// ✅ Сетка карточек
const ROW_CLASS_DEFAULT = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.55fr_repeat(2,1fr)] gap-3 lg:gap-4'
const ROW_CLASS_SCHEME_POT = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.55fr_repeat(3,1fr)] gap-3 lg:gap-4'

// ✅ Межевание: без горизонтального скролла — 1 ряд на md+ (main + 4 owners)
const MEZH_ROW_CLASS = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.55fr_repeat(4,1fr)] gap-3 lg:gap-4'

// ✅ База карточек (общая)
const CARD_BASE =
  'relative overflow-hidden rounded-[34px] bg-gradient-to-br from-white/10 via-white/5 to-black/35 ' +
  'ring-1 ring-white/14 backdrop-blur-2xl shadow-soft ' +
  'transition will-change-transform hover:-translate-y-[2px] hover:ring-white/22 ' +
  'h-full flex flex-col min-h-[240px] p-5 sm:p-6'

// ✅ Компактная база карточек для MEZH (чтобы влезало в экран)
const CARD_BASE_MEZH =
  'relative overflow-hidden rounded-[30px] bg-gradient-to-br from-white/10 via-white/5 to-black/35 ' +
  'ring-1 ring-white/14 backdrop-blur-2xl shadow-soft ' +
  'transition will-change-transform hover:-translate-y-[2px] hover:ring-white/22 ' +
  'h-full flex flex-col min-w-0 min-h-[190px] p-4 sm:p-5'

// ✅ Main для MEZH: без min-w, чтобы не распирало (и без скролла)
const CARD_MAIN_MEZH = `sm:col-span-2 md:col-span-1 ${CARD_BASE_MEZH}`

// ✅ Side для MEZH: без min-w
const CARD_SIDE_MEZH = `${CARD_BASE_MEZH}`

const OVERLAY_GRADIENT_H = 'h-[270px]'

// ✅ маска карты
const dissolveMaskStyle: React.CSSProperties = {
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 26%, black 44%, transparent 100%)',
  maskImage: 'linear-gradient(to bottom, transparent 0%, black 26%, black 44%, transparent 100%)',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
}

// ✅ для SVG <foreignObject> иногда нужен XHTML namespace.
// React/TS типы не знают про атрибут xmlns на div, поэтому пробрасываем его через any.
const XHTML_NS = { xmlns: 'http://www.w3.org/1999/xhtml' }

/** WebKit/Safari детект (чтобы уйти от foreignObject, который в Safari часто не масштабируется внутри SVG) */
function isWebkitSafariLike() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isWebKit = /AppleWebKit/i.test(ua)
  const isChromium = /Chrome|Chromium|Edg|OPR|YaBrowser/i.test(ua)
  return isWebKit && !isChromium
}

/** Пытаемся привести rgb/rgba к нужной альфе (если не получается — возвращаем как есть) */
function setRgbaAlpha(color: string, alpha: number) {
  const c = String(color || '').trim()

  const m1 = c.match(/rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*([0-9.]+))?\s*\)/i)
  if (m1) {
    const r = Number(m1[1])
    const g = Number(m1[2])
    const b = Number(m1[3])
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const m2 = c.match(/^#([0-9a-f]{6})$/i)
  if (m2) {
    const hex = m2[1]
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return c
}

/**
 * Цветной акцент для карточек (потенциалы / собственники)
 */
function ColorCardAccent({ colors }: { colors: string[] }) {
  const a = colors[0] ?? 'rgba(165,241,91,1)'
  const b = colors[1] ?? 'rgba(91,232,241,1)'
  const c = colors[2]

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-75"
        style={{
          background: `linear-gradient(135deg, ${setRgbaAlpha(a, 0.18)}, ${setRgbaAlpha(b, 0.10)}, rgba(0,0,0,0.20))`,
        }}
      />

      <div
        className="pointer-events-none absolute left-6 right-6 top-12 h-[2px] rounded-full opacity-80"
        style={{
          background: `linear-gradient(to right, rgba(0,0,0,0), ${setRgbaAlpha(a, 0.8)}, ${setRgbaAlpha(b, 0.75)}, rgba(0,0,0,0))`,
        }}
      />

      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[520px] -translate-x-1/2 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(ellipse at center, ${setRgbaAlpha(a, 0.16)}, transparent 62%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/3 h-60 w-60 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(ellipse at center, ${setRgbaAlpha(b, 0.12)}, transparent 60%)`,
        }}
      />
      {c && (
        <div
          className="pointer-events-none absolute -left-24 bottom-10 h-56 w-56 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(ellipse at center, ${setRgbaAlpha(c, 0.10)}, transparent 60%)`,
          }}
        />
      )}
    </>
  )
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

function SmallPillButton({
  active,
  children,
  onClick,
  title,
}: {
  active?: boolean
  children: React.ReactNode
  onClick: () => void
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        'rounded-2xl px-3 py-2 text-[12px] font-semibold transition ring-1',
        active ? 'bg-white/15 text-white ring-white/25' : 'bg-white/5 text-white/80 ring-white/14 hover:bg-white/10',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

/**
 * Премиум-маркер: tip ровно в (x,y)
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
  onPointerDown,
  onPointerMove,
  onPointerUp,
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
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void
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
        {...(XHTML_NS as any)}
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onPointerDown?.(e)
        }}
        onPointerMove={(e) => {
          e.stopPropagation()
          onPointerMove?.(e)
        }}
        onPointerUp={(e) => {
          e.stopPropagation()
          onPointerUp?.(e)
        }}
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
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 28px 95px rgba(0,0,0,0.58), 0 0 0 1px rgba(165,241,91,0.10) inset',
          cursor: editing ? 'grab' : 'default',
          pointerEvents: 'auto',
          overflow: 'hidden',
          userSelect: editing ? 'none' : 'auto',
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
              <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.92, fontSize: 18, lineHeight: 1.55 }}>
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

/**
 * ✅ HTML-оверлей карточки (для Safari/WebKit)
 * width/height/x/y — в “SVG-юнитах”, а scale — коэффициент масштаба SVG.
 */
function MarkerCardHtml({
  leftPx,
  topPx,
  scale,
  width,
  height,
  title,
  lines,
  onClose,
  editing,
  pointerSide = 'left',
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  leftPx: number
  topPx: number
  scale: number
  width: number
  height: number
  title: string
  lines: string[]
  onClose: () => void
  editing: boolean
  pointerSide?: 'left' | 'right'
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void
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

  // ✅ ВАЖНО:
  // Масштаб карты (scale) — на внешней обёртке.
  // Анимация (scale:0.98->1 и y) — на внутреннем motion.div.
  return (
    <div
      style={{
        position: 'absolute',
        left: leftPx,
        top: topPx,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        pointerEvents: 'none', // клики пропускаем внутрь
        overflow: 'visible',
        willChange: 'transform',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onPointerDown?.(e)
        }}
        onPointerMove={(e) => {
          e.stopPropagation()
          onPointerMove?.(e)
        }}
        onPointerUp={(e) => {
          e.stopPropagation()
          onPointerUp?.(e)
        }}
        style={{
          position: 'relative',
          width, // это "в SVG-юнитах", но тут работает как базовый размер до scale()
          height,
          borderRadius: 22,
          padding: 18,
          color: 'white',
          background: 'linear-gradient(135deg, rgba(12,28,44,0.82), rgba(6,14,22,0.72))',
          border: '1px solid rgba(255,255,255,0.16)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 28px 95px rgba(0,0,0,0.58), 0 0 0 1px rgba(165,241,91,0.10) inset',
          cursor: editing ? 'grab' : 'default',
          pointerEvents: 'auto', // ✅ кликабельно
          overflow: 'hidden',
          userSelect: editing ? 'none' : 'auto',
          willChange: 'transform',
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
              <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.92, fontSize: 18, lineHeight: 1.55 }}>
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
    </div>
  )
}

// ------------------------------
// ✅ OWNERS (Карта межевания) — подсветка зон
// ------------------------------
type OwnerId = 'owner1' | 'owner2' | 'owner3' | 'owner4'

// 1) Тип для строки в карточке (то самое “Общая территория / Участок 1 ...”)
type OwnerArea = {
  label: string
  zones: string[] // ✅ только для подсветки на карте
  value?: string // ✅ сюда вручную вписываешь площадь/стоимость/любой текст
  color?: string // (опционально) цвет точки/чипа в карточке
}

type OwnerCardConfig = {
  id: OwnerId
  title: string
  subtitle: string
  areas: OwnerArea[]
}

// 2) OWNER_CARDS — тут ты вручную заполняешь территории по каждому собственнику
export const OWNER_CARDS: OwnerCardConfig[] = [
  {
    id: 'owner1',
    title: 'Собственник 1',
    subtitle: '',
    areas: [
      { label: 'Общая', zones: ['A'], value: '130 100 кв.м.' },
      { label: 'Участок 1', zones: ['A'], value: '27 600 кв.м.' },
      { label: 'Участок 2', zones: ['B'], value: '34 600 кв.м.' },
      { label: 'Участок 3', zones: ['D'], value: '32 500 кв.м.' },
      { label: 'Участок 4', zones: ['E'], value: '35 400 кв.м.' },
    ],
  },
  {
    id: 'owner2',
    title: 'Собственник 2',
    subtitle: '',
    areas: [
      { label: 'Общая', zones: ['C'], value: '36 727 кв.м.' },
      { label: 'Участок 1', zones: ['C'], value: '36 727 кв.м.' },
    ],
  },
  {
    id: 'owner3',
    title: 'Собственник 3',
    subtitle: '',
    areas: [
      { label: 'Общая', zones: ['F'], value: '66 581 кв.м.' },
      { label: 'Участок 1', zones: ['F'], value: '66 581 кв.м.' },
    ],
  },
  {
    id: 'owner4',
    title: 'Собственник 4',
    subtitle: '',
    areas: [
      { label: 'Общая', zones: ['J'], value: '66 980 кв.м.' },
      { label: 'Участок 1', zones: ['J'], value: '28 210 кв.м.' },
      // { label: 'Участок 2', zones: ['K'], value: '30 900 кв.м.' },
      { label: 'Участок 3', zones: ['H'], value: '38 770 кв.м.' },
    ],
  },
]

// ✅ 3) Автосбор зон для подсветки (из areas)
const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)))

export const OWNER_ZONE_MAP: Record<OwnerId, string[]> = OWNER_CARDS.reduce((acc, c) => {
  acc[c.id] = uniq(c.areas.flatMap((a) => a.zones))
  return acc
}, {} as Record<OwnerId, string[]>)

// ✅ 4) (опционально) Быстрый доступ: id -> config
export const OWNER_BY_ID: Record<OwnerId, OwnerCardConfig> = OWNER_CARDS.reduce((acc, c) => {
  acc[c.id] = c
  return acc
}, {} as Record<OwnerId, OwnerCardConfig>)

function OwnerCard({
  active,
  title,
  subtitle,
  zones, // <-- это уже OWNER_ZONE_MAP[ownerId]
  areas, // <-- новые “Общая территория / Участок 1 ...”
  onClick,
  className,
  toneColors,
  zoneColorMap,
}: {
  active: boolean
  title: string
  subtitle: string
  zones: string[]
  areas: OwnerArea[]
  onClick: () => void
  className?: string
  toneColors?: string[]
  zoneColorMap?: Record<string, string>
}) {
  const colors = toneColors?.length
    ? toneColors
    : ['rgba(165,241,91,1)', 'rgba(91,232,241,1)', 'rgba(241, 91, 91, 1)']

  const getDotColor = (a: OwnerArea) => {
    if (a.color) return a.color
    const firstZone = a.zones?.[0]
    return (firstZone && zoneColorMap?.[firstZone]) || 'rgba(255,255,255,0.55)'
  }

  return (
    <button
      onClick={onClick}
      className={[
        className ?? CARD_SIDE_MEZH,
        'text-left',
        'cursor-pointer',
        'focus:outline-none',
        active ? 'ring-white/28 bg-white/12' : '',
      ].join(' ')}
      style={{ pointerEvents: 'auto' }}
    >
      <ColorCardAccent colors={colors} />
      <div className="relative flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">{title}</div>
          {!!subtitle && <div className="mt-1 text-xs text-white/60 truncate">{subtitle}</div>}
        </div>

        <div
          className={[
            'shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1',
            active ? 'bg-white/15 text-white ring-white/25' : 'bg-white/8 text-white/75 ring-white/14',
          ].join(' ')}
        >
          {active ? 'выбран' : 'выбрать'}
        </div>
      </div>

      {/* список территорий “Общая территория / Участок 1 ...” */}
      <div className="relative mt-3 rounded-2xl bg-white/6 p-0  min-w-0">
        <ul className="space-y-2 text-sm text-white/75">
          {(areas?.length ? areas : [{ label: '—', zones: [], value: '' }]).map((a, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full" style={{ background: getDotColor(a) }} />
              <div className="min-w-0">
                <span className="text-white/85">{a.label}</span>
                {a.value ? <span className="text-white/85">: {a.value}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </button>
  )
}

function PotentialInfoCard({
  className,
  areas,
  colors,
}: {
  className: string
  areas: Array<{ id: string; fill?: string; stroke?: string }>
  colors: string[]
}) {
  const chips = areas.slice(0, 5)
  const rest = Math.max(0, areas.length - chips.length)

  return (
    <div className={className}>
      <ColorCardAccent colors={colors} />

      <div className="relative flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">Площадь территорий</div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/16">
          потенциал
        </div>
      </div>

      <div className="relative mt-3">
        <div className="mt-2 flex flex-wrap gap-1.5">
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li className="flex gap-2">
              <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-orange-500/80" />
              Общая территория:
            </li>
            <li className="flex gap-2">
              <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-orange-300/80" />
              Участок 1:
            </li>
            <li className="flex gap-2">
              <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-orange-300/80" />
              Участок 2:
            </li>
            <li className="flex gap-2">
              <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-orange-300/80" />
              Участок 3:
            </li>
            <li className="flex gap-2">
              <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-orange-300/80" />
              Участок 4: 38 770 кв.м.
            </li>
          </ul>

          {rest > 0 && (
            <span className="inline-flex items-center rounded-full bg-white/8 px-2.5 py-1 text-[12px] font-semibold text-white/70 ring-1 ring-white/10">
              +{rest}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function MainInfoCard({ className, compact = false }: { className: string; compact?: boolean }) {
  const deck = useDeck()

  return (
    <div className={className}>
      <CardAccent />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={['mt-1 font-semibold tracking-tight text-white', compact ? 'text-lg' : 'text-xl'].join(' ')}>
            Участок в природном окружении
          </div>
          <p className={['mt-2 leading-relaxed text-white/70', compact ? 'text-xs' : 'text-sm'].join(' ')}>
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
          <div className="text-[11px] text-white/60">Общая площадь</div>
          <div className="mt-1 text-sm font-semibold text-white/90">~ 30 ГА</div>
        </div>
        <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
          <div className="text-[11px] text-white/60">Время от Москвы</div>
          <div className="mt-1 text-sm font-semibold text-white/90">1 час 20 минут</div>
        </div>
        <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
          <div className="text-[11px] text-white/60">Время от центра Твери</div>
          <div className="mt-1 text-sm font-semibold text-white/90">20 минут</div>
        </div>
      </div>
    </div>
  )
}

export default function SlideAerial() {
  const deck = useDeck()
  const POTENTIAL_MARKER_ID = 'view' as const

  const stageRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const markersSvgRef = useRef<SVGSVGElement | null>(null)

  const [fit, setFit] = useState<FitBox | null>(null)
  // ✅ по умолчанию показываем как в Chrome-скрине: «Карта межевания» + «Потенциальные территории» + карточки
  const [mode, setMode] = useState<OverlayMode>('mezh')

  const [activeMarker, setActiveMarker] = useState<string | null>(null)
  const [activeZone, setActiveZone] = useState<string | null>(null)

  const [showPotential, setShowPotential] = useState(true)
  const canShowPotentialNow = showPotential

  // ✅ редактор UI
  const [editorOpen, setEditorOpen] = useState(false)
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

  // ✅ выбранный собственник (для подсветки зон)
  const [activeOwner, setActiveOwner] = useState<OwnerId | null>(null)

  // ✅ Safari/WebKit: используем HTML overlay вместо foreignObject
  const useHtmlMarkerCards = useMemo(() => isWebkitSafariLike(), [])

  const vb = useMemo(() => {
    const parts = String(IMAGE_VIEWBOX).trim().split(/\s+/).map(Number)
    const minX = Number.isFinite(parts[0]) ? parts[0] : 0
    const minY = Number.isFinite(parts[1]) ? parts[1] : 0
    const w = Number.isFinite(parts[2]) ? parts[2] : 1000
    const h = Number.isFinite(parts[3]) ? parts[3] : 600
    return { minX, minY, w, h, maxX: minX + w, maxY: minY + h }
  }, [])

  /** Геометрия "xMidYMid meet" для перевода SVG координат -> px внутри контейнера fit */
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
      const uniq = Array.from(new Set(colors)).filter(Boolean)
      if (uniq.length >= 2) return uniq.slice(0, 3)
      return ['rgba(165,241,91,1)', 'rgba(91,232,241,1)', 'rgba(241, 91, 91, 1)']
    }

    return {
      owner1: pick(OWNER_ZONE_MAP.owner1),
      owner2: pick(OWNER_ZONE_MAP.owner2),
      owner3: pick(OWNER_ZONE_MAP.owner3),
      owner4: pick(OWNER_ZONE_MAP.owner4),
    } satisfies Record<OwnerId, string[]>
  }, [])

  const potentialToneColors = useMemo(() => {
    const colors: string[] = []
    for (const p of POTENTIAL_AREAS) {
      if (p.fill) colors.push(p.fill)
      if (p.stroke) colors.push(p.stroke)
    }
    const uniq = Array.from(new Set(colors)).filter(Boolean)
    if (uniq.length >= 2) return uniq.slice(0, 3)
    return ['rgba(165,241,91,1)', 'rgba(91,232,241,1)', 'rgba(241, 91, 91, 1)']
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

  // ---- offsets: POTENTIAL (scheme vs mezh) ----
  const buildPotentialOffsetsFromFile = useCallback((target: PotentialTarget) => {
    const obj: Record<string, { x: number; y: number; scale?: number }> = {}
    const map =
      target === 'mezh'
        ? (POTENTIAL_OFFSETS_MEZH as Record<string, { x: number; y: number; scale?: number }>)
        : (POTENTIAL_OFFSETS_SCHEME as Record<string, { x: number; y: number; scale?: number }>)

    for (const p of POTENTIAL_AREAS) {
      const fromMap = map?.[p.id]
      obj[p.id] = {
        x: fromMap?.x ?? 0,
        y: fromMap?.y ?? 0,
        scale: fromMap?.scale ?? p.transform?.scale,
      }
    }
    return obj
  }, [])

  const [potentialOffsetsScheme, setPotentialOffsetsScheme] = useState<Record<string, { x: number; y: number; scale?: number }>>(() =>
    buildPotentialOffsetsFromFile('scheme'),
  )

  const [potentialOffsetsMezh, setPotentialOffsetsMezh] = useState<Record<string, { x: number; y: number; scale?: number }>>(() =>
    buildPotentialOffsetsFromFile('mezh'),
  )

  const activePotentialOffsets = useMemo(() => {
    return mode === 'mezh' ? potentialOffsetsMezh : potentialOffsetsScheme
  }, [mode, potentialOffsetsMezh, potentialOffsetsScheme])

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

  const [markerCardOffsets, setMarkerCardOffsets] = useState<Record<string, { x: number; y: number }>>(() => buildMarkerCardOffsetsFromFile())

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

  const isScheme = mode === 'scheme'
  const isMezh = mode === 'mezh'

  const topControlsTop = useMemo(() => {
    if (!fit) return 24
    return Math.max(UI_TOP_MIN, fit.top - UI_TOP_DOCK_OFFSET)
  }, [fit])

  const activeMarkerData = useMemo(() => MAP_MARKERS.find((m) => m.id === activeMarker) ?? null, [activeMarker])
  const activeZoneCard = useMemo(() => (activeZone ? MEZH_ZONE_CARDS[activeZone] ?? null : null), [activeZone])

  const clientToSvgFrom = useCallback((svg: SVGSVGElement | null, clientX: number, clientY: number) => {
    if (!svg) return null
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const m = svg.getScreenCTM()
    if (!m) return null
    const p = pt.matrixTransform(m.inverse())
    return { x: p.x, y: p.y }
  }, [])

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

  const visibleMarkers = useMemo(() => {
    return MAP_MARKERS.filter((m) => {
      if (m.id === POTENTIAL_MARKER_ID) return canShowPotentialNow
      return mode === 'scheme'
    })
  }, [mode, canShowPotentialNow])

  const isMarkerVisible = useCallback((id: string) => visibleMarkers.some((m) => m.id === id), [visibleMarkers])

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

      if (editLayer === 'potential') {
        const setOffsets = mode === 'mezh' ? setPotentialOffsetsMezh : setPotentialOffsetsScheme
        setOffsets((prev) => {
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
        return
      }

      if (editLayer === 'markerPin') {
        setMarkerOffsets((prev) => {
          const next = { ...prev }
          if (moveAll) {
            for (const k of Object.keys(next)) next[k] = { x: (next[k]?.x ?? 0) + dx, y: (next[k]?.y ?? 0) + dy }
          } else {
            const id = selectedMarkerId
            const cur = next[id] ?? { x: 0, y: 0 }
            next[id] = { x: cur.x + dx, y: cur.y + dy }
          }
          return next
        })
        return
      }

      setMarkerCardOffsets((prev) => {
        const next = { ...prev }
        if (moveAll) {
          for (const k of Object.keys(next)) next[k] = { x: (next[k]?.x ?? 0) + dx, y: (next[k]?.y ?? 0) + dy }
        } else {
          const id = selectedMarkerId
          const cur = next[id] ?? { x: 0, y: 0 }
          next[id] = { x: cur.x + dx, y: cur.y + dy }
        }
        return next
      })
    },
    [editLayer, moveAll, selectedZoneId, selectedPotentialId, selectedMarkerId, mode, setPotentialOffsetsMezh, setPotentialOffsetsScheme],
  )

  // ---- keyboard ----
  useEffect(() => {
    if (!editMode) return

    if (editLayer === 'mezh' && mode !== 'mezh') return

    if (editLayer === 'potential') {
      if (!canShowPotentialNow) return
      if (potentialTarget === 'scheme' && !(mode === 'scheme' || mode === 'none')) return
      if (potentialTarget === 'mezh' && mode !== 'mezh') return
    }

    if ((editLayer === 'markerPin' || editLayer === 'markerCard') && mode !== 'scheme') return

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
  }, [editMode, editLayer, mode, canShowPotentialNow, step, applyDelta, potentialTarget])

  // ---- drag state for editor ----
  const dragRef = useRef<{
    dragging: boolean
    kind: EditLayer
    startPt: { x: number; y: number }
    startZoneOffsets: Record<string, { x: number; y: number; scale?: number }>
    startPotentialOffsetsScheme: Record<string, { x: number; y: number; scale?: number }>
    startPotentialOffsetsMezh: Record<string, { x: number; y: number; scale?: number }>
    startMarkerOffsets: Record<string, { x: number; y: number }>
    startMarkerCardOffsets: Record<string, { x: number; y: number }>
    targetId: string
    potentialTarget: PotentialTarget
  } | null>(null)

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
    if (!showPotential && editLayer === 'potential') {
      setEditMode(false)
      setEditLayer(mode === 'scheme' ? 'markerPin' : 'mezh')
    }
  }, [showPotential, editLayer, mode])

  useEffect(() => {
    if (!canShowPotentialNow && activeMarker === POTENTIAL_MARKER_ID) {
      setActiveMarker(null)
    }
  }, [canShowPotentialNow, activeMarker])

  useEffect(() => {
    if (mode === 'none') {
      setActiveZone(null)
      setActiveOwner(null)

      if (!canShowPotentialNow) {
        setActiveMarker(null)
        return
      }

      if (activeMarker && activeMarker !== POTENTIAL_MARKER_ID) setActiveMarker(null)
      return
    }

    if (mode === 'mezh') {
      if (activeMarker && activeMarker !== POTENTIAL_MARKER_ID) setActiveMarker(null)
      if (activeMarker === POTENTIAL_MARKER_ID && !canShowPotentialNow) setActiveMarker(null)
    }

    if (mode !== 'mezh') {
      setActiveOwner(null)
      setActiveZone(null)
    }
  }, [mode, activeMarker, canShowPotentialNow])

  useEffect(() => {
    if (!infoOpen) setActiveOwner(null)
  }, [infoOpen])

  useEffect(() => {
    if (mode === 'mezh') setPotentialTarget('mezh')
    else setPotentialTarget('scheme')
  }, [mode])

  const modeLabel = mode === 'scheme' ? 'Общая схема' : mode === 'mezh' ? 'Карта межевания' : showPotential ? 'Потенциалы' : 'Общая информация'

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

  // ---- JSON export ----
  const offsetsDump = useMemo(() => {
    return JSON.stringify(
      {
        MEZH_ZONE_OFFSETS: zoneOffsets,
        POTENTIAL_OFFSETS_SCHEME: potentialOffsetsScheme,
        POTENTIAL_OFFSETS_MEZH: potentialOffsetsMezh,
        MAP_MARKER_OFFSETS: markerOffsets,
        MARKER_CARD_OFFSETS: markerCardOffsets,
      },
      null,
      2,
    )
  }, [zoneOffsets, potentialOffsetsScheme, potentialOffsetsMezh, markerOffsets, markerCardOffsets])

  const copyDump = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(offsetsDump)
    } catch {
      // ignore
    }
  }, [offsetsDump])

  // ---- drag helpers ----
  const beginDrag = useCallback(
    (kind: EditLayer, targetId: string, pt: { x: number; y: number }) => {
      dragRef.current = {
        dragging: true,
        kind,
        startPt: pt,
        startZoneOffsets: JSON.parse(JSON.stringify(zoneOffsets)),
        startPotentialOffsetsScheme: JSON.parse(JSON.stringify(potentialOffsetsScheme)),
        startPotentialOffsetsMezh: JSON.parse(JSON.stringify(potentialOffsetsMezh)),
        startMarkerOffsets: JSON.parse(JSON.stringify(markerOffsets)),
        startMarkerCardOffsets: JSON.parse(JSON.stringify(markerCardOffsets)),
        targetId,
        potentialTarget: mode === 'mezh' ? 'mezh' : 'scheme',
      }
    },
    [zoneOffsets, potentialOffsetsScheme, potentialOffsetsMezh, markerOffsets, markerCardOffsets, mode],
  )

  const moveDrag = useCallback(
    (pt: { x: number; y: number }) => {
      const dr = dragRef.current
      if (!dr?.dragging) return
      const dx = pt.x - dr.startPt.x
      const dy = pt.y - dr.startPt.y

      if (dr.kind === 'mezh') {
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
        return
      }

      if (dr.kind === 'potential') {
        const tgt = dr.potentialTarget
        const base = tgt === 'mezh' ? dr.startPotentialOffsetsMezh : dr.startPotentialOffsetsScheme
        const setOffsets = tgt === 'mezh' ? setPotentialOffsetsMezh : setPotentialOffsetsScheme

        setOffsets(() => {
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
        return
      }

      if (dr.kind === 'markerPin') {
        setMarkerOffsets(() => {
          const base = dr.startMarkerOffsets
          const next = { ...base }
          if (moveAll) {
            for (const k of Object.keys(next)) next[k] = { x: base[k].x + dx, y: base[k].y + dy }
          } else {
            const id = dr.targetId
            const cur = base[id] ?? { x: 0, y: 0 }
            next[id] = { x: cur.x + dx, y: cur.y + dy }
          }
          return next
        })
        return
      }

      setMarkerCardOffsets(() => {
        const base = dr.startMarkerCardOffsets
        const next = { ...base }
        if (moveAll) {
          for (const k of Object.keys(next)) next[k] = { x: base[k].x + dx, y: base[k].y + dy }
        } else {
          const id = dr.targetId
          const cur = base[id] ?? { x: 0, y: 0 }
          next[id] = { x: cur.x + dx, y: cur.y + dy }
        }
        return next
      })
    },
    [moveAll, setPotentialOffsetsMezh, setPotentialOffsetsScheme],
  )

  const endDrag = useCallback(() => {
    if (dragRef.current) dragRef.current.dragging = false
  }, [])

  // ---------------------------
  // INFO CARDS
  // ---------------------------
  const DefaultInfoCards = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50">
      <div className={`absolute inset-x-0 bottom-0 ${OVERLAY_GRADIENT_H} bg-gradient-to-t from-black/75 via-black/28 to-transparent`} />
      <div className="relative mx-auto w-full max-w-[1600px] px-5 pb-8" style={{ paddingBottom: `calc(2rem + ${BOTTOM_BAR_SAFE})` }}>
        <div className="pointer-events-auto -mt-12">
          <div className={ROW_CLASS_DEFAULT}>
            <MainInfoCard className={`sm:col-span-2 md:col-span-1 ${CARD_BASE}`} />
            <div className={CARD_BASE}>
              <CardAccent />
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Паспорт участка</div>
                <div className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/12">база</div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-[11px] text-white/60">Категория / ВРИ</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">уточнить по ЕГРН / ПЗЗ</div>
                </div>
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-[11px] text-white/60">Границы / площадь</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">сверить с КПТ/межеванием</div>
                </div>
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-[11px] text-white/60">Ограничения</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">ЗОУИТ / водоохранные / сервитуты</div>
                </div>
              </div>
            </div>

            <div className={CARD_BASE}>
              <CardAccent />
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Проверка перед решением</div>
                <div className="rounded-full bg-lime-300/12 px-3 py-1 text-xs font-semibold text-lime-200 ring-1 ring-lime-200/20">
                  чек-лист
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-white/75">
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-cyan-300/80" />
                  ЕГРН: право, обременения, площадь, контур
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-lime-300/80" />
                  ПЗЗ/ГПЗУ: что можно строить и в каких параметрах
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-violet-300/80" />
                  Подъезд/дороги: статус, проезд, сезонность
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-rose-300/80" />
                  Коммуникации: ТУ, точки подключения, мощности
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const SchemeInfoCards = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50">
      <div className={`absolute inset-x-0 bottom-0 ${OVERLAY_GRADIENT_H} bg-gradient-to-t from-black/75 via-black/28 to-transparent`} />
      <div className="relative mx-auto w-full max-w-[1600px] px-5 pb-8" style={{ paddingBottom: `calc(2rem + ${BOTTOM_BAR_SAFE})` }}>
        <div className="pointer-events-auto -mt-12">
          <div className={showPotential ? ROW_CLASS_SCHEME_POT : ROW_CLASS_DEFAULT}>
            <MainInfoCard className={`sm:col-span-2 md:col-span-1 ${CARD_BASE}`} compact={showPotential} />

            <div className={CARD_BASE}>
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

            <div className={CARD_BASE}>
              <CardAccent />
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Ценность и сценарии</div>
                <div className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/12">
                  идея
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-xs font-semibold text-white/90">Сценарии</div>
                  <div className="mt-1 text-xs text-white/65">дом, рекреация, инвестиционный формат “поэтапно”</div>
                </div>

                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-xs font-semibold text-white/90">Что сделать первым</div>
                  <div className="mt-1 text-xs text-white/65">ЕГРН + ГПЗУ/ПЗЗ → ограничения → концепт</div>
                </div>
              </div>
            </div>

            {showPotential && <PotentialInfoCard className={CARD_BASE} areas={POTENTIAL_AREAS as any} colors={potentialToneColors} />}
          </div>
        </div>
      </div>
    </div>
  )

  const PotentialOnlyInfoCards = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50">
      <div className={`absolute inset-x-0 bottom-0 ${OVERLAY_GRADIENT_H} bg-gradient-to-t from-black/75 via-black/28 to-transparent`} />
      <div className="relative mx-auto w-full max-w-[1600px] px-5 pb-8" style={{ paddingBottom: `calc(2rem + ${BOTTOM_BAR_SAFE})` }}>
        <div className="pointer-events-auto -mt-12">
          <div className={ROW_CLASS_DEFAULT}>
            <div className={CARD_BASE}>
              <ColorCardAccent colors={potentialToneColors} />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mt-0 text-xl font-semibold tracking-tight text-white">Потенциальные територии </div>
                  <p className="mt-4 text-sm leading-relaxed text-white/70">
                    Адрес: <span className="text-white/90">{LOCATION}</span>
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/16">
                  <div className="text-[11px] text-white/60">Слайд</div>
                  <div className="text-sm font-semibold text-white/90">2 / 5</div>
                </div>
              </div>

              <div className="relative mt-4 rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                <div className="mt-1 text-sm font-semibold text-white/90">
                  Территории которые могут быть включены для обеспечения и расширения общей инфраструктуры
                </div>
              </div>
            </div>

            <PotentialInfoCard className={CARD_BASE} areas={POTENTIAL_AREAS as any} colors={potentialToneColors} />
          </div>
        </div>
      </div>
    </div>
  )

  const MezhInfoCards = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50">
      <div className={`absolute inset-x-0 bottom-0 ${OVERLAY_GRADIENT_H} bg-gradient-to-t from-black/75 via-black/28 to-transparent`} />
      <div className="relative mx-auto w-full max-w-[1600px] px-5 pb-8" style={{ paddingBottom: `calc(2rem + ${BOTTOM_BAR_SAFE})` }}>
        <div className="pointer-events-auto -mt-12">
          <div className={MEZH_ROW_CLASS}>
            <MainInfoCard className={CARD_MAIN_MEZH} compact />

            {OWNER_CARDS.map((c) => (
              <OwnerCard
                key={c.id}
                className={CARD_SIDE_MEZH}
                active={activeOwner === c.id}
                title={c.title}
                subtitle={c.subtitle}
                areas={c.areas}
                zones={OWNER_ZONE_MAP[c.id]}
                toneColors={ownerToneColors[c.id]}
                zoneColorMap={mezhZoneColorMap}
                onClick={() => {
                  setActiveOwner((prev) => (prev === c.id ? null : c.id))
                  setActiveZone(null)
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const infoCards = mode === 'mezh' ? MezhInfoCards : mode === 'scheme' ? SchemeInfoCards : showPotential ? PotentialOnlyInfoCards : DefaultInfoCards

  const hasAnyOverlay = mode !== 'none' || canShowPotentialNow

  return (
    <div className="relative h-full w-full overflow-hidden bg-eco-gradient noise">
      <div ref={stageRef} className="absolute inset-0">
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

        {/* режимы + чекбокс */}
        <div className="pointer-events-auto absolute left-1/2 z-50 -translate-x-1/2" style={{ top: topControlsTop, transition: 'top 200ms ease' }}>
          <div className="rounded-[0px] px-3 py-2 shadow-soft ">
            <div className="pointer-events-none absolute inset-x-6 top-0 h-[2px] rounded-full bg-gradient-to-r from-lime-200/0 via-lime-200/55 to-cyan-200/0 opacity-70" />
            <div className="flex flex-wrap items-center gap-2">
              <TopToggleButton
                active={isScheme}
                onClick={() => {
                  setMode((m) => (m === 'scheme' ? 'none' : 'scheme'))
                  setActiveZone(null)
                  setEditMode(false)
                  setActiveOwner(null)
                  setPotentialTarget('scheme')
                  if (editorOpen) setEditLayer('markerPin')
                }}
              >
                Общая схема
              </TopToggleButton>

              <TopToggleButton
                active={isMezh}
                onClick={() => {
                  setMode((m) => (m === 'mezh' ? 'none' : 'mezh'))
                  setActiveZone(null)
                  setEditMode(false)
                  setActiveOwner(null)
                  setPotentialTarget('mezh')
                  if (editorOpen) setEditLayer('mezh')
                }}
              >
                Карта межевания
              </TopToggleButton>

              <div className="ml-2 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/15">
                <input
                  id="potential"
                  type="checkbox"
                  className="h-4 w-4 accent-lime-300"
                  checked={showPotential}
                  onChange={(e) => {
                    const v = e.target.checked
                    setShowPotential(v)

                    if (v) {
                      setSelectedPotentialId(POTENTIAL_AREAS[0]?.id ?? 'P1')
                      setPotentialTarget(mode === 'mezh' ? 'mezh' : 'scheme')
                      if (editorOpen) setEditLayer('potential')
                    } else {
                      if (activeMarker === POTENTIAL_MARKER_ID) setActiveMarker(null)
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
            {/* БАЗОВЫЙ СЛОЙ — карта + схемы/межевание/потенциалы */}
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
                      {/* potential areas */}
                      {canShowPotentialNow && (
                        <g>
                          {POTENTIAL_AREAS.map((p) => {
                            const off = activePotentialOffsets[p.id] ?? { x: 0, y: 0 }
                            const isSel = editLayer === 'potential' && selectedPotentialId === p.id
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
                        <path
                          d={PARCEL_PATH_DETAIL}
                          fill={PARCEL_FILL}
                          stroke={PARCEL_STROKE}
                          strokeWidth={4}
                          filter="url(#glow)"
                          vectorEffect="non-scaling-stroke"
                        />
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
                              const isSel = selectedZoneId === z.id
                              const scale = off.scale ?? z.transform?.scale ?? 1
                              const t = scale !== 1 ? `translate(${off.x} ${off.y}) scale(${scale})` : `translate(${off.x} ${off.y})`

                              const hasOwnerFocus = !!activeOwnerSet
                              const isOwnerZone = hasOwnerFocus ? activeOwnerSet!.has(z.id) : false
                              const isDimmed = hasOwnerFocus && !isOwnerZone

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

                                  {hasOwnerFocus && isOwnerZone && (
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
            <div
              className={`${markersLayerPassThrough ? 'pointer-events-none' : 'pointer-events-auto'} absolute z-40`}
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

                {/* ✅ МАРКЕРЫ (scheme + view) */}
                {hasAnyOverlay && (
                  <g>
                    {visibleMarkers.map((m) => {
                      const mo = markerOffsets[m.id] ?? { x: 0, y: 0 }
                      const mx = m.x + mo.x
                      const my = m.y + mo.y

                      const allowDrag = editorOpen && editMode && editLayer === 'markerPin' && mode === 'scheme'

                      const onMarkerClick = () => {
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
                          onClick={onMarkerClick}
                        />
                      )
                    })}
                  </g>
                )}

                {/* ✅ МАРКЕРЫ ЗОН: ТОЛЬКО В MEZH */}
                {mode === 'mezh' && !editMode && (
                  <g>
                    {(activeOwnerSet ? MEZH_ZONES.filter((z) => activeOwnerSet.has(z.id)) : MEZH_ZONES).map((z) => {
                      const c = getZoneCenter(z)
                      const onZoneClick = () => {
                        setActiveMarker(null)
                        setSelectedZoneId(z.id)
                        setActiveZone((prev) => (prev === z.id ? null : z.id))
                      }

                      return <PremiumMarker key={`zone-${z.id}`} x={c.x} y={c.y} active={activeZone === z.id} editing={false} onClick={onZoneClick} />
                    })}
                  </g>
                )}

                {/* ✅ карточки: SVG-версия ТОЛЬКО НЕ-Safari */}
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

                        if (cy < vb.minY + margin) {
                          cy = my + 38 + co.y
                        }

                        cx = Math.min(vb.maxX - margin - cardW, Math.max(vb.minX + margin, cx))
                        cy = Math.min(vb.maxY - margin - cardH, Math.max(vb.minY + margin, cy))

                        const allowDragCard = editorOpen && editMode && editLayer === 'markerCard' && mode === 'scheme'

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
                            editing={allowDragCard}
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
                )}
              </svg>

              {/* ✅ карточки: HTML-оверлей ТОЛЬКО Safari/WebKit */}
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

                        if (cy < vb.minY + margin) {
                          cy = my + 38 + co.y
                        }

                        cx = Math.min(vb.maxX - margin - cardW, Math.max(vb.minX + margin, cx))
                        cy = Math.min(vb.maxY - margin - cardH, Math.max(vb.minY + margin, cy))

                        const allowDragCard = editorOpen && editMode && editLayer === 'markerCard' && mode === 'scheme'
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
                            editing={allowDragCard}
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

                        if (cy < vb.minY + margin) {
                          cy = my + 38
                        }

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
          <div className="pointer-events-auto mx-auto flex w-fit items-center gap-2 rounded-2xl bg-white/8 px-2 py-2 ring-1 ring-white/14 backdrop-blur-xl shadow-soft">
            <button
              onClick={deck.prev}
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-white/85 ring-1 ring-white/14 transition hover:bg-white/10"
            >
              ← Назад
            </button>

            <button
              onClick={() => setInfoOpen((v) => !v)}
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/18 transition hover:bg-white/10"
              title="Показать/скрыть нижние карточки"
            >
              {infoOpen ? 'Скрыть карточки' : 'Показать карточки'} • {modeLabel}
            </button>

            <button
              onClick={deck.next}
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-white/85 ring-1 ring-white/14 transition hover:bg-white/10"
            >
              Далее →
            </button>
          </div>
        </div>
      </div>

      {infoOpen ? infoCards : null}
    </div>
  )
}