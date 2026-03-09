import { AnimatePresence, motion } from 'framer-motion'
import React, { useMemo, useState } from 'react'

type EditLayer = 'mezh' | 'potential' | 'markerPin' | 'markerCard'
type OverlayMode = 'scheme' | 'mezh' | 'none'
type PotentialTarget = 'scheme' | 'mezh'

type Props = {
  open: boolean
  mode: OverlayMode
  canShowPotentialNow: boolean

  editMode: boolean
  setEditMode: (v: boolean) => void
  editLayer: EditLayer
  setEditLayer: (v: EditLayer) => void

  moveAll: boolean
  setMoveAll: (v: boolean) => void

  step: number
  setStep: (v: number) => void

  potentialTarget: PotentialTarget
  setPotentialTarget: (v: PotentialTarget) => void

  zoneIds: string[]
  selectedZoneId: string
  setSelectedZoneId: (v: string) => void

  potentialIds: string[]
  selectedPotentialId: string
  setSelectedPotentialId: (v: string) => void

  markerIds: string[]
  selectedMarkerId: string
  setSelectedMarkerId: (v: string) => void

  exportJson: string
  applyImportJson: (text: string) => { ok: boolean; error?: string }
}

export default function AerialEditorPanel({
  open,
  mode,
  canShowPotentialNow,
  editMode,
  setEditMode,
  editLayer,
  setEditLayer,
  moveAll,
  setMoveAll,
  step,
  setStep,
  potentialTarget,
  setPotentialTarget,
  zoneIds,
  selectedZoneId,
  setSelectedZoneId,
  potentialIds,
  selectedPotentialId,
  setSelectedPotentialId,
  markerIds,
  selectedMarkerId,
  setSelectedMarkerId,
  exportJson,
  applyImportJson,
}: Props) {
  const [text, setText] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const layerHint = useMemo(() => {
    if (editLayer === 'mezh') return 'Сдвиг зон межевания'
    if (editLayer === 'potential') return 'Сдвиг потенциалов'
    if (editLayer === 'markerPin') return 'Сдвиг пинов маркеров'
    return 'Сдвиг карточек маркеров'
  }, [editLayer])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute left-4 top-[76px] z-[95] pointer-events-auto w-[min(420px,92vw)] overflow-hidden rounded-[28px] ring-1 ring-white/14"
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
            <div className="text-[14px] font-extrabold text-white/90">Редактор offsets</div>
            <div className="mt-1 text-[12px] text-white/55">
              Drag по объектам + стрелки. <span className="font-bold text-white/75">Shift</span> = ×5. {layerHint}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className="mb-1 block text-[12px] font-bold text-white/70">Режим редактирования</label>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="w-full rounded-2xl bg-white/8 px-3 py-2 text-[13px] font-extrabold text-white/90 ring-1 ring-white/14 hover:bg-white/10"
                >
                  {editMode ? 'Выключить' : 'Включить'} edit-mode
                </button>
                <div className="mt-1 text-[11px] text-white/45">
                  Активный слой редактируется только в подходящем режиме карты (scheme/mezh/none).
                </div>
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-[12px] font-bold text-white/70">Слой</label>
                <select
                  className="w-full rounded-2xl bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                  value={editLayer}
                  onChange={(e) => setEditLayer(e.target.value as EditLayer)}
                >
                  <option value="mezh">mezh</option>
                  <option value="potential">potential</option>
                  <option value="markerPin">markerPin</option>
                  <option value="markerCard">markerCard</option>
                </select>
              </div>

              {editLayer === 'potential' && (
                <div className="col-span-2">
                  <label className="mb-1 block text-[12px] font-bold text-white/70">Target для потенциалов</label>
                  <select
                    className="w-full rounded-2xl bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                    value={potentialTarget}
                    onChange={(e) => setPotentialTarget(e.target.value as PotentialTarget)}
                  >
                    <option value="scheme">scheme</option>
                    <option value="mezh">mezh</option>
                  </select>
                  {!canShowPotentialNow && <div className="mt-1 text-[11px] text-amber-200/80">Потенциалы сейчас скрыты — включи показ.</div>}
                </div>
              )}

              {editLayer === 'mezh' && (
                <div className="col-span-2">
                  <label className="mb-1 block text-[12px] font-bold text-white/70">Зона</label>
                  <select
                    className="w-full rounded-2xl bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                  >
                    {zoneIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editLayer === 'potential' && (
                <div className="col-span-2">
                  <label className="mb-1 block text-[12px] font-bold text-white/70">Potential id</label>
                  <select
                    className="w-full rounded-2xl bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                    value={selectedPotentialId}
                    onChange={(e) => setSelectedPotentialId(e.target.value)}
                  >
                    {potentialIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(editLayer === 'markerPin' || editLayer === 'markerCard') && (
                <div className="col-span-2">
                  <label className="mb-1 block text-[12px] font-bold text-white/70">Marker id</label>
                  <select
                    className="w-full rounded-2xl bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                    value={selectedMarkerId}
                    onChange={(e) => setSelectedMarkerId(e.target.value)}
                  >
                    {markerIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-span-1">
                <label className="mb-1 block text-[12px] font-bold text-white/70">Шаг</label>
                <input
                  type="number"
                  value={step}
                  min={1}
                  max={50}
                  onChange={(e) => setStep(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                  className="w-full rounded-2xl bg-white/5 px-3 py-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 outline-none"
                />
              </div>

              <div className="col-span-1">
                <label className="mb-1 block text-[12px] font-bold text-white/70">Move all</label>
                <button
                  onClick={() => setMoveAll(!moveAll)}
                  className="w-full rounded-2xl bg-white/8 px-3 py-2 text-[13px] font-extrabold text-white/90 ring-1 ring-white/14 hover:bg-white/10"
                >
                  {moveAll ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="col-span-2 mt-2 flex flex-wrap gap-2">
                <button
                  onClick={async () => {
                    setMsg(null)
                    setText(exportJson)
                    try {
                      await navigator.clipboard.writeText(exportJson)
                      setMsg('Экспорт скопирован в буфер обмена')
                    } catch {
                      setMsg('Скопировать не удалось — скопируй из поля ниже')
                    }
                  }}
                  className="rounded-2xl px-4 py-2 text-[13px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                >
                  Экспорт JSON
                </button>

                <button
                  onClick={() => {
                    setMsg(null)
                    const res = applyImportJson(text)
                    setMsg(res.ok ? 'Импорт применён' : `Ошибка импорта: ${res.error || 'invalid json'}`)
                  }}
                  className="rounded-2xl px-4 py-2 text-[13px] font-extrabold text-white/90 ring-1 ring-white/15 hover:bg-white/10"
                >
                  Импорт JSON
                </button>

                <div className="w-full text-[11px] text-white/45">Текущий mode: <span className="text-white/80 font-semibold">{mode}</span></div>
                {msg && <div className="w-full text-[11px] text-white/70">{msg}</div>}
              </div>

              <div className="col-span-2 mt-2">
                <label className="mb-1 block text-[12px] font-bold text-white/70">JSON</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="h-[180px] w-full resize-none rounded-2xl bg-black/30 px-3 py-2 text-[12px] font-semibold text-white/75 ring-1 ring-white/10 outline-none"
                  placeholder="Вставь JSON сюда для импорта или нажми Экспорт"
                />
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 text-[12px] text-white/45">Ctrl/Cmd+Shift+E — открыть/закрыть • Esc — закрыть • Стрелки двигают при включённом edit-mode.</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
