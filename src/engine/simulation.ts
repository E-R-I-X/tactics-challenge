import type { MatchEvent, MatchResult, Player, TacticalSetup } from '../types'
import { squadAttackRating, squadDefenceRating } from './attributes'
import { tacticalModifiers } from './modifiers'
import { setPieceEvents } from './setPieces'

export interface SimulationInput {
  tactics: TacticalSetup
  homeSquad: Player[]
  awaySquad: Player[]
}

/** Stub simulation: deterministic-ish fake match from tactics + squad quality. */
export function simulateMatch(input: SimulationInput): MatchResult {
  const { tactics, homeSquad, awaySquad } = input
  const mods = tacticalModifiers(tactics)

  const homeAttack = squadAttackRating(homeSquad) / 100
  const awayAttack = squadAttackRating(awaySquad) / 100
  const homeDefence = squadDefenceRating(homeSquad) / 100
  const awayDefence = squadDefenceRating(awaySquad) / 100

  const homeXG = clamp(
    0.7 + homeAttack * 1.4 - awayDefence * 0.9 + mods.homeChanceBoost * 3,
    0.4,
    3.2,
  )
  const awayXG = clamp(
    0.6 + awayAttack * 1.3 - homeDefence * 0.9 + mods.awayChanceBoost * 2.5,
    0.3,
    2.8,
  )

  const homeScore = poissonish(homeXG, seedFrom(`${tactics.formation}-${tactics.tempo}-h`))
  const awayScore = poissonish(awayXG, seedFrom(`${tactics.formation}-${tactics.pressIntensity}-a`))

  const events: MatchEvent[] = [
    {
      minute: 1,
      type: 'kickoff',
      description: `Kick-off — ${tactics.formation}, ${tactics.pressIntensity} press`,
    },
    ...setPieceEvents(tactics),
    ...goalEvents(homeScore, awayScore, homeXG, awayXG),
    {
      minute: 90,
      type: 'full-time',
      description: `Full time ${homeScore}–${awayScore}`,
    },
  ].sort((a, b) => a.minute - b.minute)

  return {
    homeScore,
    awayScore,
    homeXG: round1(homeXG),
    awayXG: round1(awayXG),
    events,
  }
}

function goalEvents(
  homeScore: number,
  awayScore: number,
  homeXG: number,
  awayXG: number,
): MatchEvent[] {
  const events: MatchEvent[] = []
  for (let i = 0; i < homeScore; i++) {
    const minute = 12 + i * 23 + ((homeScore * 7) % 11)
    events.push({
      minute: Math.min(minute, 88),
      type: 'goal',
      description: `GOAL — Home (${i + 1}–${Math.min(i, awayScore)})`,
      xG: round1(homeXG / Math.max(homeScore, 1)),
    })
  }
  for (let i = 0; i < awayScore; i++) {
    const minute = 20 + i * 27 + ((awayScore * 5) % 13)
    events.push({
      minute: Math.min(minute, 89),
      type: 'goal',
      description: `GOAL — Away (${homeScore}–${i + 1})`,
      xG: round1(awayXG / Math.max(awayScore, 1)),
    })
  }
  return events
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

function seedFrom(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h
}

/** Simple seeded count around lambda for stub results. */
function poissonish(lambda: number, seed: number): number {
  const r = ((seed % 1000) / 1000) * modsVolatility(lambda)
  const base = lambda + (r - 0.5) * 1.4
  return Math.max(0, Math.min(5, Math.round(base)))
}

function modsVolatility(lambda: number) {
  return 0.8 + lambda * 0.15
}
