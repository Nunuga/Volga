import { AnimatePresence, motion } from 'framer-motion'
import React, { useMemo } from 'react'
import { createPortal } from 'react-dom'

import type { Pin } from '../types'

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
}: {
  open: boolean
  editingId: string | null
  setEditingId: (id: string | null) => void
  comparePins: Pin[]
  editingPin: Pin | null
  round2: (n: number) => number
  updatePin: (id: string, patch: Partial<Pin>) => void
  deletePin: (id: string) => void
  copyCoordsSnippet: () => Promise<string> | string
  coordsText: string
}) {
  const list = useMemo(() => comparePins.filter((p) => p.variant !== 'mine'), [comparePins])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.aside
          className="fixed right-4 top-4 z-[999999] w-[min(420px,92vw)] max-h-[calc(100vh-32px)] overflow-y-auto"
          initial={{ opacity: 0, x: 18, y: -6 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 18, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{ pointerEvents: 'auto' }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            className="overflow-hidden rounded-[24px] ring-1 ring-white/15"
            style={{
              background: 'linear-gradient(135deg, rgba(12,28,44,0.92), rgba(6,14,22,0.84))',
              boxShadow: '0 30px 90px rgba(0,0,0,0.62)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-extrabold text-white/90">Редактор маркеров</div>
                <div className="mt-1 text-[12px] text-white/55">Shift+клик — создать новый. Клик — поставить координаты.</div>
              </div>
              <button onClick={() => setEditingId(null)} className="rounded-2xl px-3 py-2 text-[13px] font-bold text-white/80 ring-1 ring-white/15 hover:bg-white/10">
                Сброс
              </button>
            </div>

            <div className="px-5 pb-5">
              <label className="text-[12px] font-semibold text-white/70">Выбрать пин</label>
              <select
                value={editingId ?? ''}
                onChange={(e) => setEditingId(e.target.value || null)}
                className="mt-2 w-full rounded-2xl bg-white/5 px-4 py-3 text-[14px] font-semibold text-white/90 ring-1 ring-white/12"
              >
                <option value="">— не выбран —</option>
                {list.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.title}
                  </option>
                ))}
              </select>

              {editingPin ? (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[12px] font-semibold text-white/70">X</div>
                      <input
                        value={String(editingPin.x)}
                        onChange={(e) => updatePin(editingPin.id, { x: round2(Number(e.target.value)) })}
                        className="mt-1 w-full rounded-2xl bg-white/5 px-4 py-3 text-[14px] font-semibold text-white/90 ring-1 ring-white/12"
                      />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-white/70">Y</div>
                      <input
                        value={String(editingPin.y)}
                        onChange={(e) => updatePin(editingPin.id, { y: round2(Number(e.target.value)) })}
                        className="mt-1 w-full rounded-2xl bg-white/5 px-4 py-3 text-[14px] font-semibold text-white/90 ring-1 ring-white/12"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-[12px] font-semibold text-white/70">Заголовок</div>
                    <input
                      value={editingPin.title}
                      onChange={(e) => updatePin(editingPin.id, { title: e.target.value })}
                      className="mt-1 w-full rounded-2xl bg-white/5 px-4 py-3 text-[14px] font-semibold text-white/90 ring-1 ring-white/12"
                    />
                  </div>

                  <div>
                    <div className="text-[12px] font-semibold text-white/70">Пункты (по строкам)</div>
                    <textarea
                      value={(editingPin.lines || []).join('\n')}
                      onChange={(e) => updatePin(editingPin.id, { lines: String(e.target.value).split(/\r?\n/).filter((s) => s.trim().length) })}
                      rows={5}
                      className="mt-1 w-full rounded-2xl bg-white/5 px-4 py-3 text-[13px] font-semibold text-white/90 ring-1 ring-white/12"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[12px] font-semibold text-white/70">Ссылка</div>
                      <input
                        value={editingPin.href ?? ''}
                        onChange={(e) => updatePin(editingPin.id, { href: e.target.value })}
                        className="mt-1 w-full rounded-2xl bg-white/5 px-4 py-3 text-[13px] font-semibold text-white/90 ring-1 ring-white/12"
                      />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-white/70">CTA</div>
                      <input
                        value={editingPin.ctaLabel ?? ''}
                        onChange={(e) => updatePin(editingPin.id, { ctaLabel: e.target.value })}
                        className="mt-1 w-full rounded-2xl bg-white/5 px-4 py-3 text-[13px] font-semibold text-white/90 ring-1 ring-white/12"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => deletePin(editingPin.id)}
                      className="rounded-2xl px-4 py-2 text-[13px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                    >
                      Удалить
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await copyCoordsSnippet()
                        } catch {
                          // ignore
                        }
                      }}
                      className="ml-auto rounded-2xl px-4 py-2 text-[13px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                      title="Копировать экспорт координат"
                    >
                      Копировать coords
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-[12px] text-white/55">Выбери пин — и можно править title/lines/coords.</div>
              )}

              <div className="mt-5">
                <div className="text-[12px] font-semibold text-white/70">Экспорт координат</div>
                <textarea
                  readOnly
                  value={coordsText}
                  rows={6}
                  className="mt-2 w-full rounded-2xl bg-white/5 px-4 py-3 text-[12px] font-semibold text-white/85 ring-1 ring-white/12"
                />
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>,
    document.body,
  )
}
