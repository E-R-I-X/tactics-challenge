import type { MatchEvent, SetPieceRoutine, TacticalSetup } from '../types'

export function setPieceEvents(setup: TacticalSetup): MatchEvent[] {
  return setup.setPieces.slice(0, 2).map((routine, index) => {
    const minute = 18 + index * 37
    return describeRoutine(routine, minute)
  })
}

function describeRoutine(routine: SetPieceRoutine, minute: number): MatchEvent {
  const xG =
    routine.delivery === 'in-swing' ? 0.18 : routine.delivery === 'short' ? 0.08 : 0.14

  return {
    minute,
    type: routine.type,
    description: `${routine.type} — ${routine.delivery} toward ${routine.targetZone}`,
    xG,
  }
}
