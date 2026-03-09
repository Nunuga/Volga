import React from 'react'
import type { OwnerArea } from '../ownersData'
import { ColorCardAccent } from './Accents'

export function OwnerCard({
  active,
  title,
  subtitle,
  areas,
  onClick,
  className,
  toneColors,
  zoneColorMap,
}: {
  active: boolean
  title: string
  subtitle: string
  areas: OwnerArea[]
  onClick: () => void
  className?: string
  toneColors?: string[]
  zoneColorMap?: Record<string, string>
}) {
  const colors = toneColors?.length ? toneColors : ['rgba(165,241,91,1)', 'rgba(91,232,241,1)', 'rgba(241, 91, 91, 1)']

  const getDotColor = (a: OwnerArea) => {
    if (a.color) return a.color
    const firstZone = a.zones?.[0]
    return (firstZone && zoneColorMap?.[firstZone]) || 'rgba(255,255,255,0.55)'
  }

  return (
    <button
      onClick={onClick}
      className={[className ?? '', 'text-left', 'cursor-pointer', 'focus:outline-none', active ? 'ring-white/28 bg-white/12' : ''].join(' ')}
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

      <div className="relative mt-3 rounded-2xl bg-white/6 p-0 min-w-0">
        <ul className="space-y-2 text-sm text-white/75">
          {(areas?.length ? areas : [{ label: '—', zones: [], value: '' } as OwnerArea]).map((a, idx) => (
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
