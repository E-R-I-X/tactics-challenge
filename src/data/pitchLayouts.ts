import type { Formation, ModeLayouts, PitchLayout, PitchPosition } from '../types'
import { FORMATION_SLOTS } from './formations'

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

/** Push attackers higher / stretch slightly when in possession. */
function inPossessionPos(slot: PitchPosition): PitchPosition {
  return {
    x: clamp01(slot.x),
    y: clamp01(Math.min(0.94, slot.y * 1.06)),
  }
}

/** Compress toward own half when out of possession (mid/high block shape). */
function outOfPossessionPos(slot: PitchPosition): PitchPosition {
  return {
    x: clamp01(0.5 + (slot.x - 0.5) * 0.92),
    y: clamp01(slot.y * 0.7 + 0.05),
  }
}

export function layoutFromFormation(formation: Formation): ModeLayouts {
  const slots = FORMATION_SLOTS[formation]
  const inLayout: PitchLayout = {}
  const outLayout: PitchLayout = {}

  for (const slot of slots) {
    const base = { x: slot.x, y: slot.y }
    inLayout[slot.id] = inPossessionPos(base)
    outLayout[slot.id] = outOfPossessionPos(base)
  }

  return { in: inLayout, out: outLayout }
}

export function slotRole(formation: Formation, id: string): string {
  return FORMATION_SLOTS[formation].find((s) => s.id === id)?.role ?? id.toUpperCase()
}
