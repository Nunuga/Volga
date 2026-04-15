import type { Pin } from '../types'

// ⚠️ Путь на ассеты: файл лежит глубже, поэтому +1 уровень вверх относительно SlidePatchMap.tsx
import c1_1 from '../../../../assets/c1-1.webp'
import c1_3 from '../../../../assets/c1-3.webp'
import c1_4 from '../../../../assets/c1-4.webp'
import c2_1 from '../../../../assets/c2-1.webp'
import c2_2 from '../../../../assets/c2-2.webp'
import c2_3 from '../../../../assets/c2-3.webp'
import c3_1 from '../../../../assets/c3-1.webp'
import c3_2 from '../../../../assets/c3-2.webp'
import c4_1 from '../../../../assets/c4-1.webp'
import c5_1 from '../../../../assets/c5-1.webp'
import c5_2 from '../../../../assets/c5-2.webp'

export const MY_TERRITORY: Pin = {
  id: 'my-territory',
  x: -95,
  y: -600,
  title: 'Реализуемая территория',
  lines: [''],
  variant: 'mine',
}

export const COMPARE_PINS_FALLBACK: Pin[] = [
  {
    id: 'c1',
    x: 5.19,
    y: -462.06,
    title: 'Коттеджный посёлок «Премиальный курорт Port Emm Zavidovo (Порт Эмм Завидово)»',
    lines: [
      'Застройщик • Самолет',
      'Площади земельного участка • от 8 до 10 соток',
      'Дома • от 193,25 м² до 399,1 м².',
      'Цена • от 49 682 884 до 93 523 108 ₽',
    ],
    variant: 'default',
    href: 'https://samolet.ru/houses/port-emm/?utm_referrer=https://www.google.com/',
    ctaLabel: 'Открыть',
    images: [c2_1, c2_2, c2_3],
  },
  {
    id: 'c2',
    x: 610.14,
    y: -310.05,
    title: 'Коттеджный поселок «Екатериновка»',
    lines: [
      'Площади земельного участка • от 10 до 80 соток',
      'Дома • от 194 м² до 808 м².',
      'Цена • от 18 800 000 до 258 000 000 ₽',
    ],
    variant: 'default',
    href: 'https://ekaterinovka.club/',
    ctaLabel: 'Открыть',
    images: [c1_1, c1_3, c1_4],
  },
  {
    id: 'c3',
    x: 1438.8,
    y: 900.63,
    title: 'Коттеджный посёлок «Волжский Берег»',
    lines: [
      'Площади земельного участка • от 8 до 30 соток',
      'Дома • от 103 м² до 358 м².',
      'Цена • от 15 000 000 до 253 000 000 ₽',
    ],
    variant: 'default',
    href: 'https://v-bereg.info/',
    ctaLabel: 'Открыть',
    images: [c3_1, c3_2],
  },
  {
    id: 'c4',
    x: 1366.73,
    y: 904.31,
    title: 'Коттеджный посёлок «Волжские рассветы»',
    lines: [
      'Отсутствует выход к Волге',
      'Площади земельного участка • от 10 до 22 соток',
      'Дома • по запросу',
      'Цена • от 8 200 000 до 18 800 000 ₽',
    ],
    variant: 'default',
    href: 'https://vrassveti.ru/',
    ctaLabel: 'Открыть',
    images: [c4_1],
  },
  {
    id: 'c5',
    x: 1425.67,
    y: 917.24,
    title: 'Коттеджный посёлок «Волга Вилладж»',
    lines: [
      'Площади земельного участка • от 11 до 22 соток',
      'Дома • от 172 м² до 540 м².',
      'Цена • от 13 000 000 до 75 000 000 ₽',
    ],
    variant: 'default',
    href: 'https://volgavillage.ru/',
    ctaLabel: 'Открыть',
    images: [c5_1, c5_2],
  },
  {
    id: 'c6',
    x: 1627.89,
    y: 1184.31,
    title: 'Речной порт Завидово в Тверской области',
    lines: [
      'Площади земельного участка • от 11 до 22 соток',
      'Дома • от 172 м² до 540 м².',
      'Цена • от 13 000 000 до 75 000 000 ₽',
    ],
    variant: 'port',
    href: 'https://volgavillage.ru/',
    ctaLabel: 'Открыть',
    images: [c5_1, c5_2],
  },
  {
    id: 'c7',
    x: 1563.95,
    y: 1275.18,
    title: 'деревня Вараксино',
    lines: [
      'Площади земельного участка • от 11 до 22 соток',
      'Дома • от 172 м² до 540 м².',
      'Цена • от 13 000 000 до 75 000 000 ₽',
    ],
    variant: 'village',
    href: 'https://volgavillage.ru/',
    ctaLabel: 'Открыть',
    images: [c5_1, c5_2],
  },
  {
    id: 'c8',
    x: 1519.75,
    y: 1377.72,
    title: 'Гостиница Radisson Завидово',
    lines: [
      'Площади земельного участка • от 11 до 22 соток',
      'Дома • от 172 м² до 540 м².',
      'Цена • от 13 000 000 до 75 000 000 ₽',
    ],
    variant: 'hotel',
    href: 'https://volgavillage.ru/',
    ctaLabel: 'Открыть',
    images: [c5_1, c5_2],
  },
  {
    id: 'c9',
    x: 1503.59,
    y: 1294,
    title: 'Завидово Спа Вилладж',
    lines: [
      'Площади земельного участка • от 11 до 22 соток',
      'Дома • от 172 м² до 540 м².',
      'Цена • от 13 000 000 до 75 000 000 ₽',
    ],
    variant: 'spa',
    href: 'https://volgavillage.ru/',
    ctaLabel: 'Открыть',
    images: [c5_1, c5_2],
  },
  {
    id: 'c10',
    x: 1553.24,
    y: 1425.58,
    title: 'Завидово АКВА & СПА',
    lines: [
      'Один из крупнейших крытых аквапарков страны позволит с легкостью перенестись в лето, независимо от погоды за окном. Технологичная крыша аквапарка пропускает УФ-лучи, позволяя греться под солнцем и загорать круглый год. Завидово АКВА & СПА',
    ],
    variant: 'spa',
    href: 'https://zavidovo-aquaspa.com/',
    ctaLabel: 'Открыть',
    images: [c5_1, c5_2],
  },
  {
    id: 'c11',
    x: 1696.55,
    y: 1203.09,
    title: 'Комплекс отдыха «Завидово»',
    lines: ['Комплекс отдыха «Завидово» (филиал ГлавУпДК при МИД России).'],
    variant: 'hotel',
    href: 'https://zavidovo.ru/',
    ctaLabel: 'Открыть',
    images: [c5_1, c5_2],
  },
]