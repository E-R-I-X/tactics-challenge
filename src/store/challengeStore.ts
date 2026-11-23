import { create } from 'zustand'
import { TODAYS_CHALLENGE, type DailyChallenge } from '../data/sampleSquads'
import type { AppPhase } from '../types'

interface ChallengeState {
  challenge: DailyChallenge
  phase: AppPhase
  setPhase: (phase: AppPhase) => void
  acceptChallenge: () => void
  backToLobby: () => void
}

export const useChallengeStore = create<ChallengeState>((set) => ({
  challenge: TODAYS_CHALLENGE,
  phase: 'lobby',
  setPhase: (phase) => set({ phase }),
  acceptChallenge: () => set({ phase: 'tactics' }),
  backToLobby: () => set({ phase: 'lobby' }),
}))
