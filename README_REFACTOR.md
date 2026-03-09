# Volga Land Presentation — refactor (Aerial + PatchMap)

## Что сделано

### SlidePatchMap
- Перенесён в `src/slides/patchMap/SlidePatchMap.tsx`
- Типы вынесены в `src/slides/patchMap/types.ts`
- Редактор маркеров вынесен в `src/slides/patchMap/editor/PatchMapEditorPanel.tsx`
- Старый путь импорта сохранён: `src/slides/SlidePatchMap.tsx` → re-export

### SlideAerial
- Перенесён в `src/slides/aerial/SlideAerial.tsx`
- Редактор offsets вынесен в `src/slides/aerial/editor/AerialEditorPanel.tsx`
- Старый путь импорта сохранён: `src/slides/SlideAerial.tsx` → re-export

## Как включить редакторы
По умолчанию **в проде** редакторы скрыты, чтобы ничего не менялось для презентации.

Включить можно любым способом:

1) URL параметр
- `/?editor=1`

2) localStorage
```js
localStorage.setItem('volga_editor','1')
location.reload()
```

3) Хоткей
- `Ctrl/Cmd + Shift + E` — открыть/закрыть редактор
- `Esc` — закрыть

## Aerial editor
Только offsets/drag/стрелки + экспорт/импорт JSON.
- Для стрелок нужен включённый `edit-mode` в панели.
- `Shift` со стрелками = ×5.

Экспорт/импорт:
- Экспортирует bundle: `zoneOffsets`, `potentialOffsetsScheme`, `potentialOffsetsMezh`, `markerOffsets`, `markerCardOffsets`.

## Запуск
```bash
npm install
npm run dev
```

Сборка:
```bash
npm run build
```
