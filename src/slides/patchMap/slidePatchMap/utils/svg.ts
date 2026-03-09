export function parseViewBox(vb: string) {
  const parts = vb
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => Number.isFinite(n))
  if (parts.length !== 4) return { minX: 0, minY: 0, vbW: 1, vbH: 1 }
  const [minX, minY, vbW, vbH] = parts
  return { minX, minY, vbW, vbH }
}

export function clientToSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const inv = ctm.inverse()
  const res = pt.matrixTransform(inv)
  return { x: res.x, y: res.y }
}
