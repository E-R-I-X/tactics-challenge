import type { PressingTriggerId } from '../types'

export interface PressingTriggerDef {
  id: PressingTriggerId
  label: string
  /** Short pitch overlay caption. */
  zoneLabel: string
}

export const PRESSING_TRIGGERS: PressingTriggerDef[] = [
  {
    id: 'gk-back-pass',
    label: 'Goalkeeper back-pass',
    zoneLabel: 'GK back-pass',
  },
  {
    id: 'poor-first-touch',
    label: 'Poor first touch',
    zoneLabel: 'Loose touch',
  },
  {
    id: 'facing-own-goal',
    label: 'Receiving facing own goal',
    zoneLabel: 'Facing own goal',
  },
  {
    id: 'cb-back-pass',
    label: 'Back-pass to centre-back',
    zoneLabel: 'CB back-pass',
  },
  {
    id: 'wide-areas',
    label: 'Ball played into wide areas',
    zoneLabel: 'Wide trap',
  },
]

/** Situations the sim can roll when the opposition has the ball. */
export const OPPOSITION_SITUATIONS: PressingTriggerId[] = PRESSING_TRIGGERS.map(
  (t) => t.id,
)

export function isPressingTriggerId(value: string): value is PressingTriggerId {
  return PRESSING_TRIGGERS.some((t) => t.id === value)
}
