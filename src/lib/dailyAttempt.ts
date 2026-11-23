import type { MatchResult, TacticalSetup } from '../types'

const ATTEMPT_KEY = 'tactics-challenge-daily-attempt'
const SAVED_TACTIC_KEY = 'tactics-challenge-saved-tactic'

export interface DailyAttemptRecord {
  date: string
  challengeId: string
  result: MatchResult
  tactics: TacticalSetup
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function loadDailyAttempt(): DailyAttemptRecord | null {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DailyAttemptRecord
    if (!parsed?.date || !parsed?.result) return null
    return parsed
  } catch {
    return null
  }
}

export function saveDailyAttempt(record: DailyAttemptRecord): void {
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(record))
}

export function isOfficialCompletedToday(challengeId: string): boolean {
  const attempt = loadDailyAttempt()
  if (!attempt) return false
  return attempt.date === todayKey() && attempt.challengeId === challengeId
}

export function saveTactic(setup: TacticalSetup): void {
  localStorage.setItem(
    SAVED_TACTIC_KEY,
    JSON.stringify({ savedAt: new Date().toISOString(), setup }),
  )
}

export function loadSavedTactic(): TacticalSetup | null {
  try {
    const raw = localStorage.getItem(SAVED_TACTIC_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { setup?: TacticalSetup }
    return parsed.setup ?? null
  } catch {
    return null
  }
}
