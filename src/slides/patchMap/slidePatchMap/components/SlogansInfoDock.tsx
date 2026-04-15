import React, { useMemo } from "react"
import type { FitBox, Quote } from "../types"
import { MarkerLegend } from './MarkerLegend'
import {
  Home,
  Sparkles,
  TreePine,
  TrendingUp,  ArrowLeft
} from "lucide-react"

export type InfoTab =
  | "infrastructure"
  | "comfort"
  | "nature"
  | "investments"

type Props = {
  fit: FitBox

  quotes: Quote[]
  quoteIdx: number

  onPrevQuote: () => void
  onNextQuote: () => void
  onPauseQuotes: () => void
  onResumeQuotes: () => void

  activeTab: InfoTab
  onTab: (t: InfoTab) => void
  onBack: () => void
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

/* стиль кнопки иконки */
const iconBox: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 18,

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  background:
              "linear-gradient(180deg, rgba(28,44,58,0), rgba(20,32,43,0.86))",

            backdropFilter: "blur(28px) saturate(140%)",

  border: "1px solid rgba(90,150,210,0)",

  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 14px rgba(0,0,0,0.35)",

  transition: "all .25s ease",
}

export function SlogansInfoDock({
  fit,
  quotes,
  quoteIdx,

  onPrevQuote,
  onNextQuote,
  onPauseQuotes,
  onResumeQuotes,

  activeTab,
  onTab,
  onBack,
}: Props) {

  const pad = 20
  const dockW = clamp(Math.round(fit.cw * 0.38), 520, 920)

  /* масштаб только правой панели */
  const scale = Math.min(fit.cw / 1920, 1.2)

  const tabs = useMemo(
    () => [
      { key: "infrastructure" as const, icon: <Home size={26} strokeWidth={2} color="#c2c9cf" /> },
      { key: "comfort" as const, icon: <Sparkles size={26} strokeWidth={2} color="#c2c9cf" /> },
      { key: "nature" as const, icon: <TreePine size={26} strokeWidth={2} color="#c2c9cf" /> },
      { key: "investments" as const, icon: <TrendingUp size={26} strokeWidth={2} color="#c2c9cf" /> },
    ],
    []
  )

  const q = quotes?.[quoteIdx] ?? { text: "" }

  const content =
    activeTab === "infrastructure"
      ? {
          title: "Инфраструктура рядом",
          items: [
            "Тверь — 20 минут",
            "Москва — 1ч 20м",
            "Подъездные дороги",
            "Развитие туризма",
          ],
        }
      : activeTab === "comfort"
      ? {
          title: "Удобства",
          items: [
            "Дом у воды",
            "Прогулки и рыбалка",
            "Приватность",
            "Этапное освоение",
          ],
        }
      : activeTab === "nature"
      ? {
          title: "Природа",
          items: [
            "Лесные массивы",
            "Красивые виды",
            "Чистый воздух",
            "Тишина",
          ],
        }
      : {
          title: "Инвестиции",
          items: [
            "Сильная локация",
            "Рост стоимости",
            "Этапное развитие",
            "Арендный потенциал",
          ],
        }

  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex: 160,
        pointerEvents: "none",
      }}
    >

      {/* LEFT ICON PANEL */}

      <div
        style={{
          position: "absolute",
          left: 24,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "auto",
        }}
      >

        <div className="flex flex-col gap-4">
          

          {tabs.map((t) => {

            const active = activeTab === t.key

            return (
              <button
                key={t.key}
                onClick={() => onTab(t.key)}
                style={{
                  width: 56,
                  height: 56,
                  transform: active ? "scale(1.08)" : "scale(1)",
                  transition: "all .25s ease",
                }}
              >

                <div
                  style={{
                    ...iconBox,

                    border: active
                      ? "1px solid rgba(130,200,255,0.75)"
                      : iconBox.border,

                    boxShadow: active
                      ? "0 0 0 1px rgba(120,200,255,0.6), 0 8px 30px rgba(120,200,255,0.25)"
                      : iconBox.boxShadow,
                  }}
                >
                  {t.icon}
                </div>

              </button>
            )
          })}
            {/* КНОПКА НАЗАД */}
  <button
    onClick={onBack}
    style={{
      width: 56,
      height: 56,
      transition: "all .25s ease",
    }}
  >
    <div style={iconBox}>
      <ArrowLeft size={26} strokeWidth={2} color="#c2c9cf" />
    </div>
  </button>


        </div>

      </div>

      {/* RIGHT PANEL */}

      <div
        style={{
          position: "absolute",
          right: pad,
          top: "%",
          width: dockW,
          pointerEvents: "auto",

          transform: `scale(${scale})`,
          transformOrigin: "top right",
        }}
        onMouseEnter={onPauseQuotes}
        onMouseLeave={onResumeQuotes}
      >

        {/* СЛОГАН */}

        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: "white",
            marginBottom: 40,
            letterSpacing: 0.2,
          }}
        >
          {q.text}
        </div>

        {/* CARD */}

        <div
          style={{
            borderRadius: 28,
            padding: 28,

            background:
              "linear-gradient(180deg, rgba(28,44,58,0), rgba(20,32,43,0.86))",

            backdropFilter: "blur(28px) saturate(140%)",

            border: "1px solid rgba(120,170,230,0)",

            boxShadow:
              "0 30px 120px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >

          {/* INNER CARD */}

          <div
            key={activeTab}
            style={{
              borderRadius: 18,
              padding: 26,

              border: "1px solid rgba(120,160,200,0.25)",

              background:
                "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.05))",

              animation: "panelFade .45s ease",
            }}
          >

            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "#d5dde5",
                marginBottom: 18,
              }}
            >
              {content.title}
            </div>

            <ul
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                color: "#b7c2cc",
                fontSize: 18,
              }}
            >
              {content.items.map((i) => (
                <li key={i}>• {i}</li>
              ))}
            </ul>

          </div>

        </div>
        <div className="mt-4">
  <MarkerLegend />
</div>
      </div>

      {/* ANIMATION */}

      <style>
        {`
        @keyframes panelFade {
          0% {
            opacity:0;
            transform:translateY(14px) scale(.98);
          }
          100% {
            opacity:1;
            transform:translateY(0) scale(1);
          }
        }
        `}
      </style>

    </div>
  )
}