import { motion } from 'framer-motion'
import React from 'react'

/**
 * PremiumMarker
 * Приведен к тому же премиальному стилю, что и в предыдущем модуле:
 * - более статусный высокий pin-shape
 * - мягкие неоновые пульсации
 * - сохранена Safari-safe логика открытия
 * - сохранена плашка labelText рядом
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
  const accent = active ? 'rgba(255, 70, 90, 0.98)' : 'rgba(90, 255, 245, 0.92)'
  const accentSoft = active ? 'rgba(255, 70, 90, 0.55)' : 'rgba(90, 255, 245, 0.34)'
  const scale = active ? 1.24 : 1.14
  const haloOpacity = active ? 0.92 : 0.58

  const labelW = Math.max(168, Math.min(260, (labelText?.length ?? 0) * 9.6 + 34))
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
      pointerEvents="all"
      style={{
        cursor: editing ? 'grab' : 'pointer',
        touchAction: 'manipulation' as any,
      }}
      onClick={(e) => {
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
      <circle cx={0} cy={-28} r={40} fill="rgba(0,0,0,0.001)" pointerEvents="all" />

      <motion.g
        transform={`scale(${scale})`}
        initial={false}
        animate={active ? { y: [0, -1.2, 0] } : { y: 0 }}
        transition={active ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.22 }}
      >
        <circle r="3.1" fill="rgba(255,255,255,0.92)" />
        <circle r="9.5" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2.4" />

        <motion.circle
          r={active ? 28 : 24}
          fill="none"
          stroke={accentSoft}
          strokeWidth="2.5"
          initial={{ opacity: 0.85, scale: 0.55 }}
          animate={{ opacity: [0.85, 0.0], scale: [0.55, 2.15] }}
          transition={{ duration: active ? 0.95 : 1.25, repeat: Infinity, ease: 'easeOut' }}
          style={{ mixBlendMode: 'screen' as any }}
        />
        <motion.circle
          r={active ? 22 : 19}
          fill="none"
          stroke={accent}
          strokeWidth="2.2"
          initial={{ opacity: 0.65, scale: 0.62 }}
          animate={{ opacity: [0.65, 0.0], scale: [0.62, 1.92] }}
          transition={{ duration: active ? 0.95 : 1.25, repeat: Infinity, ease: 'easeOut', delay: 0.34 }}
          style={{ mixBlendMode: 'screen' as any }}
        />
        <motion.circle
          r={active ? 16 : 14}
          fill="none"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="1.6"
          initial={{ opacity: 0.35, scale: 0.78 }}
          animate={{ opacity: [0.35, 0.0], scale: [0.78, 1.52] }}
          transition={{ duration: active ? 0.95 : 1.25, repeat: Infinity, ease: 'easeOut', delay: 0.56 }}
          style={{ mixBlendMode: 'screen' as any }}
        />

        <ellipse cx="0" cy="16" rx="18" ry="6.8" fill="rgba(0,0,0,0.28)" />

        <g filter="url(#pinGlow)" opacity={0.995}>
          <path
            d="
              M 0 0
              C 18 0, 32 -14, 32 -32
              C 32 -54, 18 -72, 0 -72
              C -18 -72, -32 -54, -32 -32
              C -32 -14, -18 0, 0 0
              Z
            "
            fill="url(#pinBody)"
          />

          <circle cx="-6" cy="-52" r="5.6" fill="rgba(255,255,255,0.62)" />

          <motion.circle
            cx="0"
            cy="-44"
            r="9.2"
            fill="url(#pinHead)"
            stroke={accent}
            strokeWidth="2.2"
            initial={false}
            animate={{
              opacity: haloOpacity,
              scale: active ? [1.0, 1.12, 1.0] : 1.0,
            }}
            transition={active ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.22 }}
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
            animate={{ opacity: active ? 0.92 : 0.55 }}
            transition={{ duration: 0.2 }}
            style={{ mixBlendMode: 'screen' as any }}
          />
        </g>

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
              fill="rgba(8,18,28,0.84)"
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
      </motion.g>
    </g>
  )
}
