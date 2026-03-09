export type OwnerId = 'owner1' | 'owner2' | 'owner3' | 'owner4'| 'owner5'

export type OwnerArea = {
  label: string
  zones: string[]
  value?: string
  color?: string
}

export type OwnerCardConfig = {
  id: OwnerId
  title: string
  subtitle: string
  areas: OwnerArea[]
}

export const OWNER_CARDS: OwnerCardConfig[] = [
  {
    id: 'owner1',
    title: 'Собственник 1',
    subtitle: '',
    areas: [
      { label: 'Общая', zones: ['A'], value: '13га (1 301 сотка)' },
      { label: 'Участок 1', zones: ['A'], value: '2,8га (276 соток)' },
      { label: 'Участок 2', zones: ['B'], value: '3,5га (346 соток)' },
      { label: 'Участок 3', zones: ['D'], value: '3,2га (325 соток)' },
      { label: 'Участок 4', zones: ['E'], value: '3,5га (354 сотки)' },
    ],
  },
  {
    id: 'owner2',
    title: 'Собственник 2',
    subtitle: '',
    areas: [
      // { label: 'Общая', zones: ['C'], value: '3,7га (367 соток)' },
      { label: 'Участок 1', zones: ['C'], value: '3,7га (367 сотки)' },
    ],
  },
  {
    id: 'owner3',
    title: 'Собственник 3',
    subtitle: '',
    areas: [
      // { label: 'Общая', zones: ['F'], value: '66 581 кв.м.' },
      { label: 'Участок 1', zones: ['F'], value: '6,6га (665 соток)' },
    ],
  },
  {
    id: 'owner4',
    title: 'Собственник 4',
    subtitle: '',
    areas: [
      // { label: 'Общая', zones: ['K'], value: '3,8га (388 соток)' },
      { label: 'Участок 1', zones: ['K'], value: '3,8га (388 соток)' },
      // { label: 'Участок 3', zones: ['H'], value: '3,9га (388 соток)' },
    ],
  },
  {
    id: 'owner5',
    title: 'Собственник 5',
    subtitle: '',
    areas: [
      { label: 'Общая', zones: ['J'], value: '6,7га (670 соток)' },
      { label: 'Участок 1', zones: ['J'], value: '2,8га (282 сотки)' },
      { label: 'Участок 3', zones: ['H'], value: '3,9га (388 соток)' },
    ],
  },
]

const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)))

export const OWNER_ZONE_MAP: Record<OwnerId, string[]> = OWNER_CARDS.reduce((acc, c) => {
  acc[c.id] = uniq(c.areas.flatMap((a) => a.zones))
  return acc
}, {} as Record<OwnerId, string[]>)

export const OWNER_BY_ID: Record<OwnerId, OwnerCardConfig> = OWNER_CARDS.reduce((acc, c) => {
  acc[c.id] = c
  return acc
}, {} as Record<OwnerId, OwnerCardConfig>)
