import type { Player } from '../types'

export function averageAttribute(
  players: Player[],
  key: keyof Player['attributes'],
): number {
  if (players.length === 0) return 0
  const sum = players.reduce((acc, p) => acc + p.attributes[key], 0)
  return sum / players.length
}

export function squadAttackRating(players: Player[]): number {
  return (
    (averageAttribute(players, 'finishing') +
      averageAttribute(players, 'dribbling') +
      averageAttribute(players, 'passing')) /
    3
  )
}

export function squadDefenceRating(players: Player[]): number {
  return (
    (averageAttribute(players, 'tackling') +
      averageAttribute(players, 'anticipation') +
      averageAttribute(players, 'composure')) /
    3
  )
}
