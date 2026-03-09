import React from "react";
import { CardAccent, ColorCardAccent } from "./Accents";
import { OwnerCard } from "./OwnerCard";
import { PotentialInfoCard } from "./PotentialInfoCard";
import { OWNER_CARDS, type OwnerId } from "../ownersData";

type OverlayMode = "scheme" | "mezh" | "none";

const BOTTOM_BAR_SPACE_PX = 56;
const BOTTOM_BAR_SAFE = `calc(${BOTTOM_BAR_SPACE_PX}px + env(safe-area-inset-bottom))`;

const ROW_CLASS_DEFAULT =
  "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.55fr_repeat(2,1fr)] gap-3 lg:gap-4";
const ROW_CLASS_SCHEME_POT =
  "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.55fr_repeat(3,1fr)] gap-3 lg:gap-4";

// ✅ MEZH: собственники должны быть в ОДИН ряд и влезать в экран.
// Кол-во колонок берём по факту из OWNER_CARDS.
const MEZH_OWNERS_GRID_BASE = "grid gap-3 lg:gap-4";

const CARD_BASE =
  "relative overflow-hidden rounded-[34px] bg-gradient-to-br from-white/10 via-white/5 to-black/35 " +
  "ring-1 ring-white/14 backdrop-blur-2xl shadow-soft " +
  "transition will-change-transform hover:-translate-y-[2px] hover:ring-white/22 " +
  "h-full flex flex-col min-h-[240px] p-5 sm:p-6";

const CARD_BASE_MEZH =
  "relative overflow-hidden rounded-[30px] bg-gradient-to-br from-white/10 via-white/5 to-black/35 " +
  " ring-white/14 backdrop-blur-2xl shadow-soft " +
  "transition will-change-transform hover:-translate-y-[2px] hover:ring-white/22 " +
  // чуть компактнее, чтобы 5 карточек уверенно влезали в 1 ряд
  "h-full flex flex-col min-w-0 min-h-[180px] p-3 sm:p-4";

// Узкая верхняя карточка-"строка" (ограничиваем ширину и центрируем в разметке)
const CARD_STRIP_MEZH =
  "relative overflow-hidden rounded-[30px] bg-gradient-to-br from-white/10 via-white/5 to-black/35 " +
  " ring-white/14 backdrop-blur-2xl shadow-soft " +
  "transition will-change-transform hover:-translate-y-[2px] hover:ring-white/22 " +
  "w-full flex flex-col p-4 sm:p-5";

const CARD_SIDE_MEZH = `${CARD_BASE_MEZH}`;

const OVERLAY_GRADIENT_H = "h-[270px]";

function MainInfoCard({
  className,
  compact,
  location,
}: {
  className: string;
  compact?: boolean;
  location: string;
}) {
  return (
    <div className={className}>
      {/* <CardAccent /> */}

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
          <div className="text-[11px] text-white/60">Общая площадь</div>
          <div className="mt-1 text-sm font-semibold text-white/90">
            ~ 34 ГА
          </div>
        </div>
        <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
          <div className="text-[11px] text-white/60">Время от Москвы</div>
          <div className="mt-1 text-sm font-semibold text-white/90">
            1 час 20 минут
          </div>
        </div>
        <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
          <div className="text-[11px] text-white/60">Время от центра Твери</div>
          <div className="mt-1 text-sm font-semibold text-white/90">
            20 минут
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={[
              "mt-2 leading-relaxed text-white/70",
              compact ? "text-xs" : "text-sm",
            ].join(" ")}
          >
            Адрес: <span className="text-white/90">{location}</span>
          </p>
        </div>

        <div className="shrink-0 rounded-2xl bg-white/7 px-3 py-2 mt-1 ring-1 ring-white/12">
          <div className="text-[11px] text-white/60">Слайд</div>
          <div className="text-sm font-semibold text-white/90">2 / 3</div>
        </div>
      </div>
    </div>
  );
}

function MezhTopStrip({
  className,
  location,
}: {
  className: string;
  location: string;
}) {
  return (
    <div className={className}>
      {/* <CardAccent /> */}

      {/* ✅ Один ряд: метрики → адрес → слайд */}
      <div className="flex items-stretch gap-3 lg:gap-4 flex-nowrap">
        {/* метрики (3 блока) */}
        <div className="flex min-w-0 flex-[1.25] items-stretch gap-3 lg:gap-4">
          <div className="min-w-0 flex-1 rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
            <div className="text-[11px] text-white/60">Общая площадь</div>
            <div className="mt-1 text-sm font-semibold text-white/90">
              ~ 34 ГА
            </div>
          </div>

          <div className="min-w-0 flex-1 rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
            <div className="text-[11px] text-white/60">Время от Москвы</div>
            <div className="mt-1 text-sm font-semibold text-white/90">
              1 час 20 минут
            </div>
          </div>

          <div className="min-w-0 flex-1 rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
            <div className="text-[11px] text-white/60">
              Время от центра Твери
            </div>
            <div className="mt-1 text-sm font-semibold text-white/90">
              20 минут
            </div>
          </div>
        </div>

        {/* адрес */}
        <div className="min-w-0 flex-[1] rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
          <div className="text-[11px] text-white/60">Адрес</div>
          <div className="mt-1 truncate text-sm font-semibold text-white/90">
            {location}
          </div>
        </div>

        {/* слайд */}
        <div className="shrink-0 rounded-2xl bg-white/7 px-3 py-2 ring-1 ring-white/12 flex flex-col justify-center">
          <div className="text-[11px] text-white/60">Слайд</div>
          <div className="text-sm font-semibold text-white/90">2 / 3</div>
        </div>
      </div>
    </div>
  );
}

export function InfoPanels({
  open,
  mode,
  showPotential,
  location,
  activeOwner,
  onOwnerClick,
  ownerToneColors,
  mezhZoneColorMap,
  potentialToneColors,
}: {
  open: boolean;
  mode: OverlayMode;
  showPotential: boolean;
  location: string;
  activeOwner: OwnerId | null;
  onOwnerClick: (id: OwnerId) => void;
  ownerToneColors: Record<OwnerId, string[]>;
  mezhZoneColorMap: Record<string, string>;
  potentialToneColors: string[];
}) {
  if (!open) return null;

  const SchemeInfoCards = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50">
      <div
        className={`absolute inset-x-0 bottom-0 ${OVERLAY_GRADIENT_H} bg-gradient-to-t from-black/75 via-black/28 to-transparent`}
      />
      <div
        className="relative mx-auto w-full max-w-[1840px] px-5 pb-8"
        style={{ paddingBottom: `calc(2rem + ${BOTTOM_BAR_SAFE})` }}
      >
        <div className="pointer-events-auto -mt-12">
          <div
            className={showPotential ? ROW_CLASS_SCHEME_POT : ROW_CLASS_DEFAULT}
          >
            <MainInfoCard
              className={`sm:col-span-2 md:col-span-1 ${CARD_BASE}`}
              compact={showPotential}
              location={location}
            />

            <div className={CARD_BASE}>
              <CardAccent />
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">
                  Природные плюсы
                </div>
                <div className="rounded-full bg-lime-300/15 px-3 py-1 text-xs font-semibold text-lime-200 ring-1 ring-lime-200/20">
                  природа
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-white/75">
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-lime-300/80" />
                  Зелёное окружение: лесные массивы и поляны
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-cyan-300/80" />
                  Водный ландшафт рядом по карте — прогулки, виды
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-violet-300/80" />
                  Тишина/приватность: “дом у воды / в лесу”
                </li>
              </ul>

              <div className="mt-auto pt-4 rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                <div className="text-[11px] text-white/60">Эмоция места</div>
                <div className="mt-1 text-sm font-semibold text-white/90">
                  Спокойствие, воздух, восстановление
                </div>
              </div>
            </div>

            <div className={CARD_BASE}>
              <CardAccent />
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">
                  Ценность и сценарии
                </div>
                <div className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/12">
                  идея
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-xs font-semibold text-white/90">
                    Сценарии
                  </div>
                  <div className="mt-1 text-xs text-white/65">
                    дом, рекреация, инвестиционный формат “поэтапно”
                  </div>
                </div>

                <div className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
                  <div className="text-xs font-semibold text-white/90">
                    Что сделать первым
                  </div>
                  <div className="mt-1 text-xs text-white/65">
                    ЕГРН + ГПЗУ/ПЗЗ → ограничения → концепт
                  </div>
                </div>
              </div>
            </div>

            {showPotential && (
              <PotentialInfoCard
                className={CARD_BASE}
                colors={potentialToneColors}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const MezhInfoCards = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50">
      <div
        className={`absolute inset-x-0 bottom-0 ${OVERLAY_GRADIENT_H} bg-gradient-to-t from-black/75 via-black/28 to-transparent`}
      />
      <div
        className="relative mx-auto w-full max-w-[1840px] px-5 pb-8"
        style={{ paddingBottom: `calc(2rem + ${BOTTOM_BAR_SAFE})` }}
      >
        <div className="pointer-events-auto -mt-12">
          <div className="flex flex-col gap-3 lg:gap-4">
            {/* ✅ Верхняя строка: метрики → адрес → слайд (не слишком широкая) */}
            <div className="w-full">
              <MezhTopStrip className={CARD_STRIP_MEZH} location={location} />
            </div>

            {/* ✅ Собственники: один ряд, без переноса */}
            <div
              className={MEZH_OWNERS_GRID_BASE}
              style={{
                gridTemplateColumns: `repeat(${OWNER_CARDS.length}, minmax(0, 1fr))`,
              }}
            >
              {OWNER_CARDS.map((c) => (
                <OwnerCard
                  key={c.id}
                  className={`${CARD_SIDE_MEZH} w-full min-w-0`}
                  active={activeOwner === c.id}
                  title={c.title}
                  subtitle={c.subtitle}
                  areas={c.areas}
                  toneColors={ownerToneColors[c.id]}
                  zoneColorMap={mezhZoneColorMap}
                  onClick={() => onOwnerClick(c.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Поведение как в твоей последней версии: mezh -> MezhInfoCards, всё остальное -> Scheme
  return mode === "mezh" ? MezhInfoCards : SchemeInfoCards;
}
