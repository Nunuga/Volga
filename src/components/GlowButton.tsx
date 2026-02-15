import { ButtonHTMLAttributes } from 'react'

export default function GlowButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', ...rest } = props
  return (
    <button
      {...rest}
      className={
        `relative overflow-hidden rounded-2xl px-5 py-3 text-sm font-semibold text-volga-night shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 active:shadow-soft ${className}`
      }
    >
      <span
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(180px 60px at 30% 20%, rgba(255,255,255,0.75), transparent 55%), linear-gradient(135deg, rgba(30,201,168,0.92), rgba(165,241,91,0.78))',
        }}
      />
      <span className="relative">{props.children}</span>
    </button>
  )
}
