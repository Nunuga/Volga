import { AnimatePresence, motion } from 'framer-motion'
import React from 'react'

import type { Pin } from '../types'

type Props = {
  open: boolean
  editingId: string | null
  setEditingId: (id: string | null) => void
  comparePins: Pin[]
  editingPin: Pin | null
  round2: (n: number) => number
  updatePin: (id: string, patch: Partial<Pin>) => void
  deletePin: (id: string) => void
  copyCoordsSnippet: () => Promise<string>
  coordsText: string
}

export default function PatchMapEditorPanel({
  open,
  editingId,
  setEditingId,
  comparePins,
  editingPin,
  round2,
  updatePin,
  deletePin,
  copyCoordsSnippet,
  coordsText,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute left-4 top-[76px] z-[86] pointer-events-auto w-[min(420px,92vw)] overflow-hidden rounded-[28px] ring-1 ring-white/14"
          style={{
            background: 'linear-gradient(135deg, rgba(12,28,44,0.92), rgba(6,14,22,0.80))',
            boxShadow: '0 30px 110px rgba(0,0,0,0.60)',
            backdropFilter: 'blur(16px)',
          }}
          initial={{ opacity: 0, y: 14, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.99 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="p-4">
            <div className="text-[14px] font-extrabold text-white/90">Редактор маркеров</div>
            <div className="mt-1 text-[12px] text-white/55">
              <span className="font-bold text-white/75">Shift+клик</span> по карте — добавить •{' '}
              <span className="font-bold text-white/75">drag</span> маркер — переместить • клик по карте — поставить выбранный
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className="mb-1 block text-[12px] font-bold text-white/70">Маркер</label>
                <select
                  className="w-full rounded-2xl bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                  value={editingId ?? ''}
                  onChange={(e) => setEditingId(e.target.value || null)}
                >
                  <option value="" disabled>
                    выбери маркер…
                  </option>
                  {comparePins.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} — {p.title?.slice(0, 34) || 'без названия'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <div className="mt-2 rounded-2xl bg-white/5 px-3 py-2 text-[12px] font-semibold text-white/70 ring-1 ring-white/10">
                  Координаты:{' '}
                  <span className="text-white/90">{editingPin ? `${round2(editingPin.x)} , ${round2(editingPin.y)}` : '—'}</span>
                </div>
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-[12px] font-bold text-white/70">Название</label>
                <input
                  value={editingPin?.title ?? ''}
                  onChange={(e) => editingPin && updatePin(editingPin.id, { title: e.target.value })}
                  className="w-full rounded-2xl bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                  placeholder="Заголовок"
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-[12px] font-bold text-white/70">Пункты (каждая строка — новый пункт)</label>
                <textarea
                  value={(editingPin?.lines ?? []).join('\n')}
                  onChange={(e) => {
                    if (!editingPin) return
                    const lines = e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean)
                    updatePin(editingPin.id, { lines: lines.length ? lines : [''] })
                  }}
                  className="h-[92px] w-full resize-none rounded-2xl bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                  placeholder="Строка 1\nСтрока 2"
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-[12px] font-bold text-white/70">Ссылка</label>
                <input
                  value={editingPin?.href ?? ''}
                  onChange={(e) => editingPin && updatePin(editingPin.id, { href: e.target.value })}
                  className="w-full rounded-2xl bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                  placeholder="https://..."
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-[12px] font-bold text-white/70">Текст кнопки</label>
                <input
                  value={editingPin?.ctaLabel ?? ''}
                  onChange={(e) => editingPin && updatePin(editingPin.id, { ctaLabel: e.target.value })}
                  className="w-full rounded-2xl bg-white/10 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                  placeholder="Открыть"
                />
              </div>

              <div className="col-span-2 mt-2 flex flex-wrap gap-2">
                <button
                  onClick={async () => {
                    await copyCoordsSnippet()
                  }}
                  className="rounded-2xl px-4 py-2 text-[13px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                  title="Скопировать координаты всех маркеров"
                >
                  Скопировать координаты
                </button>

                {editingPin && (
                  <button
                    onClick={() => deletePin(editingPin.id)}
                    className="rounded-2xl px-4 py-2 text-[13px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                    title="Удалить маркер"
                  >
                    Удалить
                  </button>
                )}
              </div>

              <div className="col-span-2 mt-2">
                <label className="mb-1 block text-[12px] font-bold text-white/70">Экспорт (если clipboard недоступен — копируй отсюда)</label>
                <textarea
                  readOnly
                  value={coordsText}
                  className="h-[120px] w-full resize-none rounded-2xl bg-black/30 px-3 py-2 text-[12px] font-semibold text-white/75 ring-1 ring-white/10 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 text-[12px] text-white/45">Совет: после расстановки — вставь экспорт в код и мержни координаты с твоими объектами.</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
