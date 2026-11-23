import { create } from 'zustand'
import { randomSalt } from '../engine/rng'
import { simulateMatch } from '../engine/simulation'
import type { MatchEvent, MatchResult, Player, TacticalSetup } from '../types'

const MAX_SUBS = 5
const SPEED_STORAGE_KEY = 'tactics-challenge-match-speed'
/** Base interval at 1x — ~12.5s for a quiet 90' when events are sparse. */
export const BASE_TICK_MS = 140
/** Extra ticks to linger after a goal so the cue reads. */
const GOAL_HOLD_TICKS = 3

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2

export const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.5, 2]

export function tickIntervalMs(speed: PlaybackSpeed): number {
  return Math.round(BASE_TICK_MS / speed)
}

function loadPlaybackSpeed(): PlaybackSpeed {
  try {
    const raw = localStorage.getItem(SPEED_STORAGE_KEY)
    const n = raw == null ? NaN : Number(raw)
    if (n === 0.5 || n === 1 || n === 1.5 || n === 2) return n
  } catch {
    /* ignore */
  }
  return 1
}

function persistPlaybackSpeed(speed: PlaybackSpeed) {
  try {
    localStorage.setItem(SPEED_STORAGE_KEY, String(speed))
  } catch {
    /* ignore */
  }
}

interface MatchState {
  result: MatchResult | null
  isSimulating: boolean
  minute: number
  /** How many events at the current minute have been revealed (sequential). */
  revealCount: number
  /** Ticks to hold after revealing a goal before advancing. */
  goalHold: number
  paused: boolean
  playbackSpeed: PlaybackSpeed
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
  setPlaybackSpeed: (speed: PlaybackSpeed) => void
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

function eventsAtMinute(result: MatchResult, minute: number) {
  return result.events.filter((e) => e.minute === minute)
}

export function liveSnapshot(
  result: MatchResult | null,
  minute: number,
  revealCount = Number.POSITIVE_INFINITY,
) {
  if (!result) {
    return {
      homeScore: 0,
      awayScore: 0,
      homeXG: 0,
      awayXG: 0,
      events: [] as MatchEvent[],
      ballX: 0.5,
      ballY: 0.5,
      currentEvent: null as MatchEvent | null,
      possession: 'home' as 'home' | 'away',
      justScored: false,
    }
  }

  let seenAtMinute = 0
  const events = result.events.filter((e) => {
    if (e.minute < minute) return true
    if (e.minute > minute) return false
    seenAtMinute += 1
    return seenAtMinute <= revealCount
  })

  const scores = scoreFromEvents(events)
  const currentEvent =
    [...events].reverse().find(
      (e) =>
        e.type !== 'half-time' &&
        e.type !== 'full-time' &&
        e.minute === minute,
    ) ??
    [...events].reverse().find(
      (e) => e.type !== 'half-time' && e.type !== 'full-time',
    ) ??
    null
  // Prefer the live event's ball so the carrier highlight and ball stay in sync.
  const withBall =
    currentEvent?.ballX !== undefined
      ? currentEvent
      : [...events].reverse().find((e) => e.ballX !== undefined)

  let possession: 'home' | 'away' = 'home'
  for (const e of events) {
    if (
      e.team &&
      (e.type === 'pass' ||
        e.type === 'shot' ||
        e.type === 'goal' ||
        e.type === 'set-piece' ||
        e.type === 'kickoff')
    ) {
      possession = e.team
    } else if (e.type === 'turnover' && e.team) {
      possession = e.team
    }
  }

  const justScored = currentEvent?.type === 'goal'

  return {
    ...scores,
    events,
    ballX: withBall?.ballX ?? 0.5,
    ballY: withBall?.ballY ?? 0.5,
    currentEvent,
    possession,
    justScored,
  }
}

export const useMatchStore = create<MatchState>((set, get) => ({
  result: null,
  isSimulating: false,
  minute: 0,
  revealCount: 0,
  goalHold: 0,
  paused: false,
  playbackSpeed: loadPlaybackSpeed(),
  subsUsed: 0,
  onPitchIds: [],
  benchIds: [],
  liveEvents: [],
  runSimulation: (tactics, homeSquad, awaySquad, homeBench = []) => {
    set({ isSimulating: true })
    // Fresh salt each run → same tactics yield similar but not identical scores.
    const result = simulateMatch({
      tactics,
      homeSquad,
      awaySquad,
      runSalt: randomSalt(),
    })
    const kickoffCount = eventsAtMinute(result, 0).length
    set({
      result,
      isSimulating: false,
      minute: 0,
      revealCount: Math.max(1, kickoffCount),
      goalHold: 0,
      paused: false,
      subsUsed: 0,
      onPitchIds: homeSquad.map((p) => p.id),
      benchIds: homeBench.map((p) => p.id),
      liveEvents: [],
    })
    return result
  },
  setMinute: (minute) => {
    const { result } = get()
    if (!result) {
      set({ minute, revealCount: 0, goalHold: 0 })
      return
    }
    // Skipping ahead reveals everything up to that minute.
    const at = eventsAtMinute(result, minute).length
    set({ minute, revealCount: at, goalHold: 0 })
  },
  tick: () => {
    const { minute, paused, result, revealCount, goalHold } = get()
    if (paused || !result || minute > 90) return

    if (goalHold > 0) {
      set({ goalHold: goalHold - 1 })
      return
    }

    const atMinute = eventsAtMinute(result, minute)
    if (revealCount < atMinute.length) {
      const nextReveal = revealCount + 1
      const revealed = atMinute[nextReveal - 1]
      set({
        revealCount: nextReveal,
        goalHold: revealed?.type === 'goal' ? GOAL_HOLD_TICKS : 0,
      })
      return
    }

    if (minute >= 90) return
    set({ minute: Math.min(90, minute + 1), revealCount: 0 })
  },
  togglePause: () => set((s) => ({ paused: !s.paused })),
  setPaused: (paused) => set({ paused }),
  setPlaybackSpeed: (speed) => {
    persistPlaybackSpeed(speed)
    set({ playbackSpeed: speed })
  },
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
      revealCount: 0,
      goalHold: 0,
      paused: false,
      subsUsed: 0,
      onPitchIds: [],
      benchIds: [],
      liveEvents: [],
    }),
}))

export { MAX_SUBS }
