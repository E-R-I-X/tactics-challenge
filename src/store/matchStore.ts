import { create } from 'zustand'
import { simulateMatch } from '../engine/simulation'
import type { MatchEvent, MatchResult, Player, TacticalSetup } from '../types'

const MAX_SUBS = 5

interface MatchState {
  result: MatchResult | null
  isSimulating: boolean
  minute: number
  paused: boolean
  subsUsed: number
  onPitchIds: string[]
  benchIds: string[]
  liveEvents: MatchEvent[]
  runSimulation: (
    tactics: TacticalSetup,
    homeSquad: Player[],
    awaySquad: Player[],
    homeBench?: Player[],
  ) => MatchResult
  setMinute: (minute: number) => void
  tick: () => void
  togglePause: () => void
  setPaused: (paused: boolean) => void
  makeSubstitution: (
    outId: string,
    inId: string,
    minute: number,
    label?: string,
  ) => boolean
  clear: () => void
}

function scoreFromEvents(events: MatchEvent[]) {
  let homeScore = 0
  let awayScore = 0
  let homeXG = 0
  let awayXG = 0
  for (const e of events) {
    // Count xG from shots only (set-piece rows are descriptive).
    if (e.type === 'shot' && e.xG) {
      if (e.team === 'home') homeXG += e.xG
      else if (e.team === 'away') awayXG += e.xG
    }
    if (e.type === 'goal') {
      if (e.team === 'home') homeScore += 1
      else if (e.team === 'away') awayScore += 1
    }
  }
  return {
    homeScore,
    awayScore,
    homeXG: Math.round(homeXG * 100) / 100,
    awayXG: Math.round(awayXG * 100) / 100,
  }
}

export function liveSnapshot(result: MatchResult | null, minute: number) {
  if (!result) {
    return {
      homeScore: 0,
      awayScore: 0,
      homeXG: 0,
      awayXG: 0,
      events: [] as MatchEvent[],
      ballX: 0.5,
      ballY: 0.5,
    }
  }
  const events = result.events.filter((e) => e.minute <= minute)
  const scores = scoreFromEvents(events)
  const withBall = [...events].reverse().find((e) => e.ballX !== undefined)
  return {
    ...scores,
    events,
    ballX: withBall?.ballX ?? 0.5,
    ballY: withBall?.ballY ?? 0.5,
  }
}

export const useMatchStore = create<MatchState>((set, get) => ({
  result: null,
  isSimulating: false,
  minute: 0,
  paused: false,
  subsUsed: 0,
  onPitchIds: [],
  benchIds: [],
  liveEvents: [],
  runSimulation: (tactics, homeSquad, awaySquad, homeBench = []) => {
    set({ isSimulating: true })
    const result = simulateMatch({ tactics, homeSquad, awaySquad })
    set({
      result,
      isSimulating: false,
      minute: 0,
      paused: false,
      subsUsed: 0,
      onPitchIds: homeSquad.map((p) => p.id),
      benchIds: homeBench.map((p) => p.id),
      liveEvents: [],
    })
    return result
  },
  setMinute: (minute) => set({ minute }),
  tick: () => {
    const { minute, paused, result } = get()
    if (paused || !result || minute >= 90) return
    set({ minute: Math.min(90, minute + 1) })
  },
  togglePause: () => set((s) => ({ paused: !s.paused })),
  setPaused: (paused) => set({ paused }),
  makeSubstitution: (outId, inId, minute, label) => {
    const state = get()
    if (state.subsUsed >= MAX_SUBS) return false
    if (!state.onPitchIds.includes(outId) || !state.benchIds.includes(inId)) {
      return false
    }
    const event: MatchEvent = {
      minute,
      type: 'substitution',
      team: 'home',
      description: label ?? `Substitution — ${inId} on for ${outId}`,
      ballX: 0.5,
      ballY: 0.5,
    }
    const result = state.result
    if (!result) return false
    const events = [...result.events, event].sort(
      (a, b) => a.minute - b.minute,
    )
    set({
      result: { ...result, events },
      subsUsed: state.subsUsed + 1,
      onPitchIds: state.onPitchIds.map((id) => (id === outId ? inId : id)),
      benchIds: state.benchIds.map((id) => (id === inId ? outId : id)),
    })
    return true
  },
  clear: () =>
    set({
      result: null,
      isSimulating: false,
      minute: 0,
      paused: false,
      subsUsed: 0,
      onPitchIds: [],
      benchIds: [],
      liveEvents: [],
    }),
}))

export { MAX_SUBS }
