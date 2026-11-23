import type { MatchEvent, TacticalSetup } from '../types'
import { getSetPieceXGMultiplier } from './modifiers'

/** Lightweight set-piece preview events (simulation handles in-match set pieces). */
export function setPieceEvents(setup: TacticalSetup): MatchEvent[] {
  return setup.setPieces.slice(0, 2).map((routine, index) => {
    const minute = 18 + index * 37
    const mul = getSetPieceXGMultiplier(setup, routine.type)
    const base =
      routine.delivery === 'in-swing' ? 0.14 : routine.delivery === 'short' ? 0.06 : 0.1
    const extras = [
      routine.blockers ? 'blockers' : null,
      routine.screeningRunners ? 'runners' : null,
    ]
      .filter(Boolean)
      .join(', ')
    return {
      minute,
      type: 'set-piece' as const,
      team: 'home' as const,
      description: `${routine.type} — ${routine.delivery} toward ${routine.targetZone}${extras ? ` (${extras})` : ''}`,
      xG: Math.round(base * mul * 100) / 100,
      ballX: 0.5,
      ballY: 0.9,
    }
  })
}
