import React from 'react'

import { ColorCardAccent } from './Accents'

export function PotentialInfoCard({ className, colors }: { className: string; colors: string[] }) {
  return (
    <div className={className}>
      <ColorCardAccent colors={colors} />

      <div className="relative flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">Площадь территорий</div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/16">потенциал</div>
      </div>

      <div className="relative mt-3">
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
          {/* <li className="flex gap-2">
            <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-orange-300/80" />
            Участок 4: 38 770 кв.м.
          </li> */}
        </ul>
      </div>
    </div>
  )
}