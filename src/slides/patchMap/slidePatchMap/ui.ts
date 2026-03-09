import type React from 'react'

// ✅ РАСТУШЁВКА ТОЛЬКО СПРАВА
export const dissolveMaskStyle: React.CSSProperties = {
  WebkitMaskImage: 'linear-gradient(to right, black 0%, black 78%, transparent 100%)',
  maskImage: 'linear-gradient(to right, black 0%, black 78%, transparent 100%)',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
}
