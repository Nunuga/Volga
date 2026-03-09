import { motion } from 'framer-motion'
import React from 'react'

/**
 * ✅ PremiumMarker
 * - Safari-safe: может срабатывать на pointerdown/mousedown/touchstart
 * - Увеличенный hit-area, чтобы клики в Safari не промахивались
 * - labelText рисуется рядом и НЕ перехватывает клики
 */
export function PremiumMarker({
  x,
  y,
  active,
  editing,
  labelText,
  usePointerDown,
  onTrigger,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  x: number
  y: number
  active: boolean
  editing: boolean
  labelText?: string
  usePointerDown?: boolean
  /** вызывается ДО onClick: удобно поставить флаг suppressSvgClickRef */
  onTrigger?: () => void
  onClick: () => void
  onPointerDown?: (e: React.PointerEvent<SVGGElement>) => void
  onPointerMove?: (e: React.PointerEvent<SVGGElement>) => void
  onPointerUp?: (e: React.PointerEvent<SVGGElement>) => void
}) {
  const accent = active ? 'rgba(241, 91, 91, 0.95)' : 'rgba(91, 232, 241, 0.75)'
  const accentSoft = active ? 'rgba(241, 91, 91, 0.45)' : 'rgba(91, 232, 241, 0.35)'

  // ✅ бейдж рядом
  const labelW = 168
  const labelH = 38
  const labelX = 26
  const labelY = -60

  const fire = () => {
    onTrigger?.()
    onClick()
  }

  const stop = (e: any) => {
    e?.stopPropagation?.()
  }

  const stopAll = (e: any) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
  }

  return (
    <g
      transform={`translate(${x} ${y})`}
      // SVG pointer-events иногда капризные в Safari — явно говорим, что кликабельно
      pointerEvents="all"
      style={{
        cursor: editing ? 'grab' : 'pointer',
        touchAction: 'manipulation' as any,
      }}
      onClick={(e) => {
        // В Safari мы открываем по pointerdown/mousedown/touchstart
        stop(e)
        if (usePointerDown) return
        fire()
      }}
      onPointerDown={(e) => {
        if (usePointerDown) {
          stopAll(e)
          fire()
        } else {
          stop(e)
        }
        onPointerDown?.(e)
      }}
      onPointerMove={(e) => {
        stop(e)
        onPointerMove?.(e)
      }}
      onPointerUp={(e) => {
        stop(e)
        onPointerUp?.(e)
      }}
      // дополнительная страховка для Safari/старых событий
      onMouseDown={(e: any) => {
        if (!usePointerDown) return
        stopAll(e)
        fire()
      }}
      onTouchStart={(e: any) => {
        if (!usePointerDown) return
        stopAll(e)
        fire()
      }}
    >
      {/* ✅ расширенная зона клика */}
      <circle cx={0} cy={-18} r={34} fill="rgba(0,0,0,0.001)" pointerEvents="all" />

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

      {/* ✅ Плашка рядом — не блокирует клики по пину */}
      {labelText ? (
        <g transform={`translate(${labelX} ${labelY})`} pointerEvents="none">
          <rect x={4} y={5} width={labelW} height={labelH} rx={labelH / 2} ry={labelH / 2} fill="rgba(0,0,0,0.40)" />
          <rect
            x={0}
            y={0}
            width={labelW}
            height={labelH}
            rx={labelH / 2}
            ry={labelH / 2}
            fill="rgba(8,18,28,0.82)"
            stroke="rgba(255,255,255,0.24)"
            strokeWidth={1.6}
          />
          <text
            x={14}
            y={26}
            fontSize={18}
            fontWeight={900}
            fontFamily="ui-sans-serif"
            fill="rgba(0,0,0,0.65)"
            stroke="rgba(0,0,0,0.65)"
            strokeWidth={4}
            paintOrder="stroke"
          >
            {labelText}
          </text>
          <text x={14} y={26} fontSize={18} fontWeight={900} fontFamily="ui-sans-serif" fill="rgba(255,255,255,0.96)">
            {labelText}
          </text>
        </g>
      ) : null}
    </g>
  )
}
