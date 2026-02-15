export type PatchPoint = {
  id: string
  title: string
  subtitle: string
  x: number // 0..100
  y: number // 0..100
  bullets: string[]
}

// «Патч» – условный контур (можно заменить на точный SVG).
export const PATCH_VIEWBOX = '0 0 1000 640'
export const PATCH_PATH =
  'M 180 520 C 130 440, 120 330, 210 270 C 310 190, 480 120, 620 160 C 730 190, 820 260, 860 360 C 900 460, 860 540, 760 585 C 650 645, 520 630, 420 600 C 330 572, 240 590, 180 520 Z'

export const PATCH_POINTS: PatchPoint[] = [
  {
    id: 'p1',
    title: '22 гектара',
    subtitle: 'единый массив',
    x: 48,
    y: 46,
    bullets: ['простор для проекта', 'приватность', 'масштабирование (лоты)'],
  },
  {
    id: 'p2',
    title: 'Береговая линия',
    subtitle: 'виды на Волгу',
    x: 32,
    y: 66,
    bullets: ['под причал', 'видовой дом', 'банный комплекс'],
  },
  {
    id: 'p3',
    title: 'Подъезд',
    subtitle: 'логистика',
    x: 70,
    y: 58,
    bullets: ['подъездные пути', 'электричество/связь — по запросу', 'удобное деление'],
  }
]
