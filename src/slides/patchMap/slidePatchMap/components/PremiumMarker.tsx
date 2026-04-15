import { motion } from 'framer-motion'
import React from 'react'
import type { PinVariant } from '../types'

type MarkerShape = 'pin' | 'circle' | 'square' | 'diamond' | 'hex'

const MARKER_CONFIG: Record<
  NonNullable<PinVariant>,
  {
    shape: MarkerShape
    accent: string
    accentSoft: string
    fill: string
    innerFill: string
  }
> = {
  default: {
    shape: 'pin',
    accent: 'rgba(90, 255, 245, 0.92)',
    accentSoft: 'rgba(90, 255, 245, 0.34)',
    fill: 'rgba(34, 202, 196, 0.92)',
    innerFill: 'rgba(210, 255, 252, 0.95)',
  },
  mine: {
    shape: 'pin',
    accent: 'rgba(255, 214, 70, 0.98)',
    accentSoft: 'rgba(255, 214, 70, 0.42)',
    fill: 'rgba(255, 196, 44, 0.96)',
    innerFill: 'rgba(255, 243, 176, 0.96)',
  },
  port: {
    shape: 'diamond',
    accent: 'rgba(74, 170, 255, 0.98)',
    accentSoft: 'rgba(74, 170, 255, 0.42)',
    fill: 'rgba(54, 130, 255, 0.92)',
    innerFill: 'rgba(219, 240, 255, 0.96)',
  },
  hotel: {
    shape: 'circle',
    accent: 'rgba(255, 120, 210, 0.98)',
    accentSoft: 'rgba(255, 120, 210, 0.42)',
    fill: 'rgba(255, 93, 180, 0.92)',
    innerFill: 'rgba(255, 227, 245, 0.96)',
  },
  village: {
    shape: 'square',
    accent: 'rgba(110, 255, 145, 0.98)',
    accentSoft: 'rgba(110, 255, 145, 0.38)',
    fill: 'rgba(54, 196, 92, 0.92)',
    innerFill: 'rgba(225, 255, 231, 0.96)',
  },
  spa: {
    shape: 'hex',
    accent: 'rgba(182, 127, 255, 0.98)',
    accentSoft: 'rgba(182, 127, 255, 0.38)',
    fill: 'rgba(136, 88, 255, 0.92)',
    innerFill: 'rgba(237, 229, 255, 0.96)',
  },
}

function renderMarkerShape(shape: MarkerShape, props: { fill?: string; stroke?: string; strokeWidth?: number }) {
  const { fill = 'none', stroke = 'none', strokeWidth = 0 } = props

  switch (shape) {
    case 'circle':
      return (
        <>
          <circle cx="0" cy="-40" r="25" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M -8 -18 L 0 0 L 8 -18 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </>
      )

    case 'square':
      return (
        <>
          <rect x="-24" y="-64" width="48" height="48" rx="12" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M -8 -16 L 0 0 L 8 -16 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </>
      )

    case 'diamond':
      return (
        <>
          <path
            d="M 0 -68 L 26 -42 L 0 -16 L -26 -42 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <path d="M -8 -16 L 0 0 L 8 -16 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </>
      )

    case 'hex':
      return (
        <>
          <path
            d="M -18 -64 L 18 -64 L 30 -40 L 18 -16 L -18 -16 L -30 -40 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <path d="M -8 -16 L 0 0 L 8 -16 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </>
      )

    case 'pin':
    default:
      return (
        <path
          d="
            M 0 0
            C 18 0, 32 -14, 32 -32
            C 32 -54, 18 -72, 0 -72
            C -18 -72, -32 -54, -32 -32
            C -32 -14, -18 0, 0 0
            Z
          "
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )
  }
}

/**
 * ✅ Маркер с разными вариантами точек
 * Внешний вид всех точек меняется именно в этом файле.
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
  const cfg = MARKER_CONFIG[variant ?? 'default'] ?? MARKER_CONFIG.default
  const isMine = variant === 'mine'
  const emphasized = isMine || active || selected

  const accent = cfg.accent
  const accentSoft = cfg.accentSoft
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
        // ✅ важно: чтобы клик по маркеру не вызывал onPointerDown фона
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
          {renderMarkerShape(cfg.shape, {
            fill: cfg.fill,
          })}

          {cfg.shape === 'pin' ? (
            <circle cx="-6" cy="-52" r="5.6" fill="rgba(255,255,255,0.62)" />
          ) : (
            <circle cx="-6" cy="-50" r="5.4" fill="rgba(255,255,255,0.62)" />
          )}

          <motion.circle
            cx="0"
            cy={cfg.shape === 'pin' ? '-44' : '-40'}
            r="9.2"
            fill={cfg.innerFill}
            stroke={accent}
            strokeWidth="2.2"
            initial={false}
            animate={{
              opacity: emphasized ? haloOpacity : 0.72,
              scale: selected ? [1.0, 1.12, 1.0] : active ? [1.0, 1.08, 1.0] : 1.0,
            }}
            transition={selected ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.22 }}
            style={{ mixBlendMode: 'screen' as any }}
          />

          <motion.g
            initial={false}
            animate={{ opacity: emphasized ? 0.92 : 0.55 }}
            transition={{ duration: 0.2 }}
            style={{ mixBlendMode: 'screen' as any }}
          >
            {renderMarkerShape(cfg.shape, {
              fill: 'none',
              stroke: accent,
              strokeWidth: 2.6,
            })}
          </motion.g>
        </g>

        {isMine && (
          <g transform="translate(0 -92)">
            <rect
              x={48}
              y={35}
              width={310}
              height={38}
              rx={14}
              fill="rgba(12,28,44,0.74)"
              stroke="rgba(255,255,255,0.18)"
            />
            <text
              x={200}
              y={60}
              textAnchor="middle"
              fill="rgba(255,255,255,0.94)"
              fontSize={25}
              fontWeight={900}
              fontFamily="ui-sans-serif"
            >
              Реализуемая территория
            </text>
          </g>
        )}
      </motion.g>
    </g>
  )
}