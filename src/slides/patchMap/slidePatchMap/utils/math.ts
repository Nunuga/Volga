export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

export function round2(n: number) {
  return Math.round(n * 100) / 100
}
