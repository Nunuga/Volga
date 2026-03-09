export function isWebkitSafariLike() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isWebKit = /AppleWebKit/i.test(ua)
  const isChromium = /Chrome|Chromium|Edg|OPR|YaBrowser/i.test(ua)
  return isWebKit && !isChromium
}

/** Пытаемся привести rgb/rgba или hex к нужной альфе */
export function setRgbaAlpha(color: string, alpha: number) {
  const c = String(color || '').trim()

  const m1 = c.match(
    /rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*([0-9.]+))?\s*\)/i,
  )
  if (m1) {
    const r = Number(m1[1])
    const g = Number(m1[2])
    const b = Number(m1[3])
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const m2 = c.match(/^#([0-9a-f]{6})$/i)
  if (m2) {
    const hex = m2[1]
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return c
}
