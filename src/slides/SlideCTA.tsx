import { motion } from 'framer-motion'
import GlowButton from '../components/GlowButton'
import { useDeck } from '../components/deckContext'

export default function SlideCTA() {
  const deck = useDeck()

  return (
    <div className="relative h-full w-full overflow-hidden bg-eco-gradient noise">
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-5 py-20">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="glass inline-flex rounded-2xl px-4 py-3 shadow-soft">
              <div>
                <div className="text-xs text-white/60">Слайд 5 / 5</div>
                <div className="mt-0.5 text-sm font-semibold">Контакты и запрос</div>
              </div>
            </div>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-5xl">
              Хотите цену и документы?
              <span className="block text-white/75">Отправлю пакет по запросу</span>
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
              Можно подключить CRM/форму/мессенджеры, добавить PDF-презентацию и видео. Этот лендинг уже сделан так,
              чтобы “дорого” выглядел и на десктопе, и на телефоне.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <GlowButton onClick={() => alert('Здесь подключается отправка формы (Email/Telegram/CRM).')}>
                Запросить презентацию →
              </GlowButton>
              <button
                onClick={deck.prev}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white/80 ring-1 ring-white/20 transition hover:bg-white/10"
              >
                ← Назад
              </button>
              <button
                onClick={() => deck.go(0)}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white/70 ring-1 ring-white/15 transition hover:bg-white/10"
              >
                В начало ↺
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { k: 'Телефон', v: '+7 (___) ___-__-__' },
                { k: 'Telegram', v: '@ваш_ник' },
                { k: 'Email', v: 'name@example.com' },
              ].map((it) => (
                <div key={it.k} className="glass rounded-2xl p-4 shadow-glow">
                  <div className="text-xs text-white/60">{it.k}</div>
                  <div className="mt-1 text-sm font-semibold text-white">{it.v}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="glass rounded-[36px] p-6 shadow-soft"
          >
            <div className="text-sm font-semibold">Быстрый запрос</div>
            <form
              className="mt-4 grid gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                alert('Форма готова: подключите отправку на ваш backend/CRM.')
              }}
            >
              <input
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-volga-lime/60"
                placeholder="Имя"
              />
              <input
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-volga-lime/60"
                placeholder="Телефон / Telegram"
              />
              <textarea
                className="min-h-[120px] w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-volga-lime/60"
                placeholder="Что важно? (дом, причал, деление на лоты, инфраструктура и т.д.)"
              />
              <button
                type="submit"
                className="mt-1 rounded-2xl bg-gradient-to-br from-volga-teal/90 to-volga-lime/70 px-5 py-3 text-sm font-semibold text-volga-night shadow-soft transition hover:-translate-y-0.5"
              >
                Отправить запрос
              </button>
            </form>

            <div className="mt-5 text-xs text-white/55">
              Подключение отправки: EmailJS / backend-endpoint / Telegram bot / amoCRM — в любом варианте UI уже готов.
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
