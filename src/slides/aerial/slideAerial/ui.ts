import type { CSSProperties } from 'react'

// ✅ панель сверху: докуем к верхней границе карты
export const UI_TOP_MIN = 18
export const UI_TOP_DOCK_OFFSET = 72

// ✅ ВАЖНО: поднимаем картинку и все слои, завязанные на fit.top
export const MAP_LIFT_PX = 120

// ✅ маска карты
export const dissolveMaskStyle: CSSProperties = {
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 26%, black 44%, transparent 100%)',
  maskImage: 'linear-gradient(to bottom, transparent 0%, black 26%, black 44%, transparent 100%)',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
}

// ✅ для SVG <foreignObject> иногда нужен XHTML namespace.
export const XHTML_NS = { xmlns: 'http://www.w3.org/1999/xhtml' }
