export type FitBox = { left: number; top: number; width: number; height: number; cw: number; ch: number }
export type PinVariant = 'default' | 'mine'

export type Pin = {
  id: string
  x: number
  y: number
  title: string
  lines: string[]
  href?: string
  ctaLabel?: string
  variant?: PinVariant
  images?: string[]
}

export type Quote = { text: string; author?: string; sub?: string }
