import { motion } from 'framer-motion'
import React from 'react'

export function MarkerCardHtml({
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
    <div
      style={{
        position: 'absolute',
        left: leftPx,
        top: topPx,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        pointerEvents: 'none',
        overflow: 'visible',
        willChange: 'transform',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'relative',
          width,
          height,
          borderRadius: 22,
          padding: 18,
          color: 'white',
          background: 'linear-gradient(135deg, rgba(12,28,44,0.82), rgba(6,14,22,0.72))',
          border: '1px solid rgba(255,255,255,0)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 28px 95px rgba(0,0,0,0.58), 0 0 0 1px rgba(165,241,91,0.10) inset',
          cursor: editing ? 'grab' : 'default',
          pointerEvents: 'auto',
          overflow: 'hidden',
          userSelect: editing ? 'none' : 'auto',
          willChange: 'transform',
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
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
              border: '1px solid rgba(255,255,255,0)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.9)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      </motion.div>
    </div>
  )
}
