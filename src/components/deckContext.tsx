import { createContext, useContext } from 'react'

export type DeckApi = {
  active: number
  count: number
  go: (idx: number) => void
  next: () => void
  prev: () => void
}

export const DeckContext = createContext<DeckApi | null>(null)

export function useDeck() {
  const ctx = useContext(DeckContext)
  if (!ctx) throw new Error('useDeck must be used inside <HorizontalDeck>')
  return ctx
}
