import React from 'react'

export function TopToggleButton({
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
