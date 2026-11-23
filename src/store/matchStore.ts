import { create } from 'zustand'
import { simulateMatch } from '../engine/simulation'
import type { MatchResult, Player, TacticalSetup } from '../types'

interface MatchState {
  result: MatchResult | null
  isSimulating: boolean
  runSimulation: (
    tactics: TacticalSetup,
    homeSquad: Player[],
    awaySquad: Player[],
  ) => MatchResult
  clear: () => void
}

export const useMatchStore = create<MatchState>((set) => ({
  result: null,
  isSimulating: false,
  runSimulation: (tactics, homeSquad, awaySquad) => {
    set({ isSimulating: true })
    const result = simulateMatch({ tactics, homeSquad, awaySquad })
    set({ result, isSimulating: false })
    return result
  },
  clear: () => set({ result: null, isSimulating: false }),
}))
