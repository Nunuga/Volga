import React from 'react'
import type { PinVariant } from '../types'

const LEGEND_ITEMS: Array<{ variant: PinVariant; label: string }> = [
  { variant: 'mine', label: 'Реализуемая территория' },
  { variant: 'port', label: 'Порт / речной объект' },
  { variant: 'hotel', label: 'Отель / комплекс отдыха' },
  { variant: 'village', label: 'Посёлок / населённый пункт' },
  { variant: 'spa', label: 'SPA / аквакомплекс' },
  { variant: 'default', label: 'Прочий объект' },
]

function getVariantStyle(variant: PinVariant) {
  switch (variant) {
    case 'mine':
      return {
        fill: 'rgba(255, 196, 44, 0.96)',
        stroke: 'rgba(255, 214, 70, 0.98)',
        shape: 'territory',
      } as const
    case 'port':
      return {
        fill: 'rgba(54, 130, 255, 0.92)',
        stroke: 'rgba(74, 170, 255, 0.98)',
        shape: 'diamond',
      } as const
    case 'hotel':
      return {
        fill: 'rgba(255, 93, 180, 0.92)',
        stroke: 'rgba(255, 120, 210, 0.98)',
        shape: 'circle',
      } as const
    case 'village':
      return {
        fill: 'rgba(54, 196, 92, 0.92)',
        stroke: 'rgba(110, 255, 145, 0.98)',
        shape: 'square',
      } as const
    case 'spa':
      return {
        fill: 'rgba(136, 88, 255, 0.92)',
        stroke: 'rgba(182, 127, 255, 0.98)',
        shape: 'hex',
      } as const
    case 'default':
    default:
      return {
        fill: 'rgba(34, 202, 196, 0.92)',
        stroke: 'rgba(90, 255, 245, 0.92)',
        shape: 'pin',
      } as const
  }
}

function Shape({
  shape,
  fill,
  stroke,
}: {
  shape: 'pin' | 'circle' | 'square' | 'diamond' | 'hex' | 'territory'
  fill: string
  stroke: string
}) {
  switch (shape) {
    case 'circle':
      return (
        <>
          <circle cx="0" cy="-18" r="11" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M -4 -7 L 0 0 L 4 -7 Z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <circle cx="0" cy="-18" r="4.2" fill="rgba(255,255,255,0.96)" />
        </>
      )

    case 'square':
      return (
        <>
          <rect x="-10" y="-28" width="20" height="20" rx="5.5" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M -4 -8 L 0 0 L 4 -8 Z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <circle cx="0" cy="-18" r="4.2" fill="rgba(255,255,255,0.96)" />
        </>
      )

    case 'diamond':
      return (
        <>
          <path d="M 0 -31 L 12 -18 L 0 -6 L -12 -18 Z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M -4 -6 L 0 0 L 4 -6 Z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <circle cx="0" cy="-18" r="4.2" fill="rgba(255,255,255,0.96)" />
        </>
      )

    case 'hex':
      return (
        <>
          <path d="M -9 -30 L 9 -30 L 15 -18 L 9 -6 L -9 -6 L -15 -18 Z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M -4 -6 L 0 0 L 4 -6 Z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <circle cx="0" cy="-18" r="4.2" fill="rgba(255,255,255,0.96)" />
        </>
      )

    case 'territory':
      return (
        <>
          <path
            d="
              M 0 2
              L 8 -6
              C 18 -16, 23 -25, 23 -37
              C 23 -50, 13 -60, 0 -60
              C -13 -60, -23 -50, -23 -37
              C -23 -25, -18 -16, -8 -6
              Z
            "
            fill={fill}
            stroke={stroke}
            strokeWidth="1.8"
          />
          <circle cx="0" cy="-36" r="4.8" fill="rgba(255,255,255,0.96)" />
        </>
      )

    case 'pin':
    default:
      return (
        <>
          <path
            d="
              M 0 0
              C 10 0, 18 -8, 18 -18
              C 18 -31, 10 -40, 0 -40
              C -10 -40, -18 -31, -18 -18
              C -18 -8, -10 0, 0 0
              Z
            "
            fill={fill}
            stroke={stroke}
            strokeWidth="1.8"
          />
          <circle cx="0" cy="-24" r="4.2" fill="rgba(255,255,255,0.96)" />
        </>
      )
  }
}

function LegendIcon({ variant }: { variant: PinVariant }) {
  const cfg = getVariantStyle(variant)

  return (
    <svg
      width="28"
      height="34"
      viewBox="-24 -64 48 70"
      aria-hidden="true"
      style={{
        display: 'block',
        overflow: 'visible',
        filter: `drop-shadow(0 0 8px ${cfg.stroke.replace('0.98', '0.22').replace('0.92', '0.22')})`,
        flexShrink: 0,
      }}
    >
      <Shape shape={cfg.shape} fill={cfg.fill} stroke={cfg.stroke} />
    </svg>
  )
}

export function MarkerLegend() {
  return (
    <div
      style={{
        borderRadius: 28,
        padding: 28,
        background:
          'linear-gradient(180deg, rgba(28,44,58,0), rgba(20,32,43,0.86))',
        backdropFilter: 'blur(28px) saturate(140%)',
        border: '1px solid rgba(120,170,230,0)',
        boxShadow:
          '0 30px 120px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div
        style={{
          borderRadius: 18,
          padding: 26,
          border: '1px solid rgba(120,160,200,0.25)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.05))',
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: '#d5dde5',
            marginBottom: 18,
          }}
        >
          Легенда карты
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {LEGEND_ITEMS.map((item) => (
            <div
              key={item.variant}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                minHeight: 58,
                padding: '12px 16px',
                borderRadius: 16,
                border: '1px solid rgba(120,160,200,0.18)',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.04))',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <LegendIcon variant={item.variant} />

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: '#d5dde5',
                  lineHeight: 1.25,
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}