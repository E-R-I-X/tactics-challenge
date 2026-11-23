import type { MatchResult, Scoreline } from '../types'

export type ManagerComparison = 'beat' | 'equal' | 'worse'

/** Points first (3/1/0), then goal difference, then goals scored. */
export function compareToRealManager(
  result: MatchResult,
  real: Scoreline,
): ManagerComparison {
  const user = rank(result.homeScore, result.awayScore)
  const manager = rank(real.home, real.away)
  if (user > manager) return 'beat'
  if (user < manager) return 'worse'
  return 'equal'
}

function rank(home: number, away: number): number {
  const points = home > away ? 3 : home === away ? 1 : 0
  const gd = home - away
  return points * 1000 + gd * 10 + home
}

export function comparisonMessage(outcome: ManagerComparison): string {
  if (outcome === 'beat') return 'You beat the real manager'
  if (outcome === 'worse') return 'Real manager got a better result'
  return 'You matched the real manager'
}
