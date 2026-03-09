import React from 'react'
import { setRgbaAlpha } from '../utils'

export function ColorCardAccent({ colors }: { colors: string[] }) {
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

export function CardAccent() {
  return (
    <>
      <div className="pointer-events-none absolute left-6 right-6 top-4 h-[2px] rounded-full bg-gradient-to-r from-lime-200/0 via-lime-200/70 to-cyan-200/0 opacity-80" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,241,91,0.16),transparent_62%)] blur-2xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-60 w-60 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(91,232,241,0.12),transparent_60%)] blur-2xl" />
    </>
  )
}
