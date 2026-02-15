# Премиальный сайт-презентация: земля на Волге (22 га)

Горизонтальная презентация (5 слайдов) на React + TypeScript + Tailwind + Framer Motion.

## Запуск

```bash
npm install
npm run dev
```

Откройте: `http://localhost:5173`

## Сборка

```bash
npm run build
npm run preview
```

## Где менять контуры (чтобы совпадало с фото)

- Изображение: `src/assets/map.png`
- Контур, который ложится поверх фото: `src/data/parcelPaths.ts` → `PARCEL_PATH_DETAIL`
- Важно: `IMAGE_VIEWBOX = '0 0 2047 756'` соответствует размеру изображения, поэтому SVG совпадает.

## Где менять точки на 3D карте

- `src/data/patchData.ts` → `PATCH_POINTS`
- Контур патча: `PATCH_PATH`

## Что подставить под себя

- Тексты, контакты: `src/slides/SlideHero.tsx`, `src/slides/SlideCTA.tsx`
- Реальные границы участков/лотов: замените пути/полигоны в `RiverPlan.tsx` и `patchData.ts`

