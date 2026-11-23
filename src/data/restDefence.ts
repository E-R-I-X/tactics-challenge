import type { Formation, RestDefenceStructure } from '../types'
import { FORMATION_SLOTS } from './formations'

/**
 * Pick the deepest outfield players to form the rest-defence structure
 * (back row + screening midfielders), excluding the GK.
 */
export function restDefenceSlotIds(
  formation: Formation,
  structure: RestDefenceStructure,
): string[] {
  const [back, mid] = structure.split('-').map(Number) as [number, number]
  const count = back + mid
  const outfield = FORMATION_SLOTS[formation]
    .filter((s) => s.id !== 'gk')
    .slice()
    .sort((a, b) => a.y - b.y || a.x - b.x)
  return outfield.slice(0, count).map((s) => s.id)
}

export function restDefenceRows(
  formation: Formation,
  structure: RestDefenceStructure,
): { back: string[]; mid: string[] } {
  const [backCount, midCount] = structure.split('-').map(Number) as [
    number,
    number,
  ]
  const ids = restDefenceSlotIds(formation, structure)
  return {
    back: ids.slice(0, backCount),
    mid: ids.slice(backCount, backCount + midCount),
  }
}
