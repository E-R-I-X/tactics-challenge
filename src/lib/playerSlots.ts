import { FORMATION_SLOTS } from '../data/formations'
import type { Formation, Player, PossessionMode } from '../types'

export interface SlotPlayer {
  slotId: string
  role: string
  player: Player
  /** Normalized pitch coords for this team / phase. */
  x: number
  y: number
}

/** Prefer surname; truncate for pitch labels. */
export function abbreviateName(name: string, maxLen = 9): string {
  const cleaned = name.replace(/\./g, '').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const last = parts[parts.length - 1]!
  if (last.length <= maxLen) return last
  return `${last.slice(0, maxLen - 1)}…`
}

/** Map XI order → formation slots (squads are authored in slot order). */
export function assignSquadToSlots(
  formation: Formation,
  squad: Player[],
): { slotId: string; role: string; player: Player }[] {
  const slots = FORMATION_SLOTS[formation]
  return slots.map((slot, i) => ({
    slotId: slot.id,
    role: slot.role,
    player: squad[i] ?? {
      id: `missing-${slot.id}`,
      name: slot.role,
      position: slot.role,
      attributes: {
        pace: 50,
        acceleration: 50,
        stamina: 50,
        passing: 50,
        dribbling: 50,
        finishing: 50,
        decisions: 50,
        anticipation: 50,
        composure: 50,
        tackling: 50,
      },
    },
  }))
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

/** Home team positions for a possession phase. */
export function homePhasePosition(
  formation: Formation,
  slotId: string,
  phase: PossessionMode | 'transition',
): { x: number; y: number } {
  const slot = FORMATION_SLOTS[formation].find((s) => s.id === slotId)
  const base = slot ? { x: slot.x, y: slot.y } : { x: 0.5, y: 0.5 }

  if (phase === 'in') {
    return { x: clamp01(base.x), y: clamp01(Math.min(0.94, base.y * 1.06)) }
  }
  if (phase === 'out') {
    return {
      x: clamp01(0.5 + (base.x - 0.5) * 0.92),
      y: clamp01(base.y * 0.7 + 0.05),
    }
  }
  // Transition — halfway between in and out, nudged toward midfield
  const inn = homePhasePosition(formation, slotId, 'in')
  const out = homePhasePosition(formation, slotId, 'out')
  return {
    x: clamp01((inn.x + out.x) / 2),
    y: clamp01((inn.y + out.y) / 2 * 0.92 + 0.04),
  }
}

/** Away team: mirror along the length axis (attack the other way). */
export function awayPhasePosition(
  formation: Formation,
  slotId: string,
  phase: PossessionMode | 'transition',
): { x: number; y: number } {
  // Away "in possession" = pushing toward home goal → high y for home coords flipped
  const mirroredPhase: PossessionMode | 'transition' =
    phase === 'in' ? 'in' : phase === 'out' ? 'out' : 'transition'
  const home = homePhasePosition(formation, slotId, mirroredPhase)
  return { x: clamp01(1 - home.x), y: clamp01(1 - home.y) }
}

export function teamPhase(
  team: 'home' | 'away',
  possession: 'home' | 'away' | null,
  eventType?: string,
): PossessionMode | 'transition' {
  if (
    eventType === 'turnover' ||
    eventType === 'press' ||
    eventType === 'kickoff'
  ) {
    return 'transition'
  }
  if (!possession) return 'out'
  return team === possession ? 'in' : 'out'
}

/** Pick a squad player near the ball for event flavour / highlight. */
export function pickPlayerNearBall(
  formation: Formation,
  squad: Player[],
  team: 'home' | 'away',
  ballX: number,
  ballY: number,
  phase: PossessionMode | 'transition',
  rng: () => number,
): Player {
  const assigned = assignSquadToSlots(formation, squad)
  let best = assigned[0]!
  let bestDist = Infinity
  for (const row of assigned) {
    const pos =
      team === 'home'
        ? homePhasePosition(formation, row.slotId, phase)
        : awayPhasePosition(formation, row.slotId, phase)
    const d = (pos.x - ballX) ** 2 + (pos.y - ballY) ** 2
    // Soft randomness so the same spot doesn't always pick the same name
    const jitter = rng() * 0.04
    if (d + jitter < bestDist) {
      bestDist = d + jitter
      best = row
    }
  }
  return best.player
}
