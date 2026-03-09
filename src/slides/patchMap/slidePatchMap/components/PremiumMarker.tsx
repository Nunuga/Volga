import { motion } from 'framer-motion'
import React from 'react'
import type { PinVariant } from '../types'

/**
 * ✅ Маркер (с фиксом stopPropagation на pointerdown, чтобы фон не закрывал карточку до onClick)
 */
export function PremiumMarker({
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

  const accent = isMine ? 'rgba(255, 214, 70, 0.98)' : emphasized ? 'rgba(255, 70, 90, 0.98)' : 'rgba(90, 255, 245, 0.92)'

  const accentSoft = isMine ? 'rgba(255, 214, 70, 0.42)' : emphasized ? 'rgba(255, 70, 90, 0.55)' : 'rgba(90, 255, 245, 0.34)'

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

          <circle cx="-6" cy="-52" r="5.6" fill="rgba(255,255,255,0.62)" />

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
