import { create } from 'zustand'
import { TODAYS_CHALLENGE, type DailyChallenge } from '../data/sampleSquads'
import {
  isOfficialCompletedToday,
  loadDailyAttempt,
  saveDailyAttempt,
  todayKey,
  type DailyAttemptRecord,
} from '../lib/dailyAttempt'
import type { AppPhase, ChallengeMode, MatchResult, TacticalSetup } from '../types'

interface ChallengeState {
  challenge: DailyChallenge
  phase: AppPhase
  mode: ChallengeMode
  todaysAttempt: DailyAttemptRecord | null
  officialLocked: boolean
  setPhase: (phase: AppPhase) => void
  acceptChallenge: () => void
  startPractice: () => void
  backToLobby: () => void
  completeOfficialAttempt: (result: MatchResult, tactics: TacticalSetup) => void
  refreshAttemptLock: () => void
}

function readLockState(challengeId: string) {
  const todaysAttempt = loadDailyAttempt()
  const officialLocked = isOfficialCompletedToday(challengeId)
  return {
    todaysAttempt:
      todaysAttempt && todaysAttempt.date === todayKey() ? todaysAttempt : null,
    officialLocked,
  }
}

const initialLock = readLockState(TODAYS_CHALLENGE.id)

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  challenge: TODAYS_CHALLENGE,
  phase: 'lobby',
  mode: 'official',
  todaysAttempt: initialLock.todaysAttempt,
  officialLocked: initialLock.officialLocked,
  setPhase: (phase) => set({ phase }),
  acceptChallenge: () => {
    if (get().officialLocked) return
    set({ phase: 'tactics', mode: 'official' })
  },
  startPractice: () => set({ phase: 'tactics', mode: 'practice' }),
  backToLobby: () => {
    get().refreshAttemptLock()
    set({ phase: 'lobby' })
  },
  completeOfficialAttempt: (result, tactics) => {
    if (get().mode !== 'official') return
    const record: DailyAttemptRecord = {
      date: todayKey(),
      challengeId: get().challenge.id,
      result,
      tactics,
    }
    saveDailyAttempt(record)
    set({ todaysAttempt: record, officialLocked: true })
  },
  refreshAttemptLock: () => {
    set(readLockState(get().challenge.id))
  },
}))
