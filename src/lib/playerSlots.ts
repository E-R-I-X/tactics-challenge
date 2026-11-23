import { FORMATION_SLOTS } from '../data/formations'
import { restDefenceSlotIds } from '../data/restDefence'
import type {
  Formation,
  PitchPosition,
  Player,
  PossessionMode,
  PressIntensity,
  RestDefenceStructure,
  TacticalSetup,
  Tempo,
} from '../types'

export interface SlotPlayer {
  slotId: string
  role: string
  player: Player
  /** Normalized pitch coords for this team / phase. */
  x: number
  y: number
}

/** Subset of tactics that reshape live pitch positions. */
export type PitchTactics = Pick<
  TacticalSetup,
  'pressIntensity' | 'buildUpPattern' | 'restDefence' | 'tempo' | 'risk'
>

const NAME_PARTICLES = new Set([
  'van',
  'von',
  'de',
  'di',
  'da',
  'dos',
  'del',
  'della',
  'la',
  'le',
  'el',
])

/** Prefer surname; truncate for pitch labels. */
export function abbreviateName(name: string, maxLen = 8): string {
  const cleaned = name.replace(/\./g, '').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const last = parts[parts.length - 1]!
  const prev = parts.length >= 2 ? parts[parts.length - 2]! : null
  const surname =
    prev && NAME_PARTICLES.has(prev.toLowerCase()) ? `${prev} ${last}` : last
  if (surname.length <= maxLen) return surname
  return `${surname.slice(0, maxLen - 1)}…`
}

/** Initials from a display name (e.g. "Bukayo Saka" → "BS"). */
export function nameInitials(name: string): string {
  const cleaned = name.replace(/\./g, '').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase()
  return (
    parts[0]!.slice(0, 1) + parts[parts.length - 1]!.slice(0, 1)
  ).toUpperCase()
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

function isFullBack(slotId: string, role: string): boolean {
  const id = slotId.toLowerCase()
  const r = role.toUpperCase()
  return (
    id === 'rb' ||
    id === 'lb' ||
    id === 'rwb' ||
    id === 'lwb' ||
    r === 'RB' ||
    r === 'LB' ||
    r === 'RWB' ||
    r === 'LWB'
  )
}

function isAttacker(_slotId: string, role: string, baseY: number): boolean {
  const r = role.toUpperCase()
  if (
    r.includes('ST') ||
    r === 'CF' ||
    r === 'RW' ||
    r === 'LW' ||
    r === 'RAM' ||
    r === 'LAM' ||
    r === 'CAM'
  ) {
    return true
  }
  return baseY >= 0.58
}

function pressLineFactor(intensity: PressIntensity): {
  yScale: number
  yLift: number
  width: number
} {
  switch (intensity) {
    case 'very-high':
      return { yScale: 0.88, yLift: 0.14, width: 0.86 }
    case 'high':
      return { yScale: 0.8, yLift: 0.1, width: 0.88 }
    case 'medium':
      return { yScale: 0.7, yLift: 0.05, width: 0.9 }
    case 'low':
    default:
      return { yScale: 0.55, yLift: 0.03, width: 0.84 }
  }
}

function attackPush(tempo: Tempo, risk: PitchTactics['risk']): number {
  const tempoMul = tempo === 'high' ? 1.12 : tempo === 'slow' ? 1.02 : 1.06
  const riskMul =
    risk === 'aggressive' ? 1.04 : risk === 'safe' ? 0.98 : 1
  return tempoMul * riskMul
}

function applyBuildUpFullBack(
  x: number,
  y: number,
  slotId: string,
  pattern: string,
): { x: number; y: number } {
  const id = slotId.toLowerCase()
  const left = id === 'lb' || id === 'lwb'
  const right = id === 'rb' || id === 'rwb'
  if (!left && !right) return { x, y }

  if (pattern === 'inverted-fullbacks') {
    return {
      x: clamp01(0.5 + (x - 0.5) * 0.42),
      y: clamp01(Math.min(0.62, y + 0.12)),
    }
  }
  if (pattern === 'overload-left') {
    if (left) return { x: clamp01(Math.min(x, 0.1)), y: clamp01(y + 0.1) }
    if (right) return { x: clamp01(0.5 + (x - 0.5) * 0.7), y: clamp01(y + 0.04) }
  }
  if (pattern === 'overload-right') {
    if (right) return { x: clamp01(Math.max(x, 0.9)), y: clamp01(y + 0.1) }
    if (left) return { x: clamp01(0.5 + (x - 0.5) * 0.7), y: clamp01(y + 0.04) }
  }
  // Default / direct / dropping: stretch wide slightly
  if (left) return { x: clamp01(Math.min(x, 0.12)), y }
  if (right) return { x: clamp01(Math.max(x, 0.88)), y }
  return { x, y }
}

/**
 * Home team positions for a possession phase.
 * Optional `tactics` reshape full-backs, attack height, OOP compact block,
 * and rest-defence depth so the live pitch matches the user's setup.
 */
export function homePhasePosition(
  formation: Formation,
  slotId: string,
  phase: PossessionMode | 'transition',
  tactics?: PitchTactics,
  layoutOverride?: PitchPosition,
): { x: number; y: number } {
  const slot = FORMATION_SLOTS[formation].find((s) => s.id === slotId)
  const base = layoutOverride
    ? { x: layoutOverride.x, y: layoutOverride.y }
    : slot
      ? { x: slot.x, y: slot.y }
      : { x: 0.5, y: 0.5 }
  const role = slot?.role ?? slotId
  const press = tactics?.pressIntensity ?? 'medium'
  const pattern = tactics?.buildUpPattern ?? 'balanced'
  const tempo = tactics?.tempo ?? 'balanced'
  const risk = tactics?.risk ?? 'balanced'
  const rest =
    tactics?.restDefence ??
    ('3-2' as RestDefenceStructure)
  const restIds = new Set(restDefenceSlotIds(formation, rest))

  if (phase === 'in') {
    let x = base.x
    let y = base.y
    const push = attackPush(tempo, risk)
    // Board layouts are already In-shaped — only apply tactics deltas on top.
    const fromBoard = Boolean(layoutOverride)

    if (!fromBoard) {
      if (isAttacker(slotId, role, base.y)) {
        y = Math.min(0.94, base.y * push)
      } else if (restIds.has(slotId) && slotId !== 'gk') {
        // Clear rest defence — stay deeper while attackers push
        y = clamp01(base.y * 0.92)
      } else if (slotId !== 'gk') {
        y = clamp01(Math.min(0.88, base.y * (1 + (push - 1) * 0.45)))
      }
    } else if (restIds.has(slotId) && slotId !== 'gk') {
      y = clamp01(base.y * 0.96)
    }

    if (isFullBack(slotId, role)) {
      const fb = applyBuildUpFullBack(x, y, slotId, pattern)
      x = fb.x
      y = fb.y
    }

    if (pattern === 'dropping-six' && /dm|cm|cdm/i.test(role + slotId)) {
      y = clamp01(Math.min(y, base.y * 0.95))
    }

    return { x: clamp01(x), y: clamp01(y) }
  }

  if (phase === 'out') {
    const line = pressLineFactor(press)
    const fromBoard = Boolean(layoutOverride)
    let x: number
    let y: number

    if (fromBoard) {
      // Board layout already compressed — tighten width by press intensity only
      x = clamp01(0.5 + (base.x - 0.5) * (0.92 + (line.width - 0.9)))
      y = base.y
      if (press === 'very-high') y = clamp01(Math.min(0.85, y + 0.04))
      if (press === 'low') y = clamp01(y * 0.92)
    } else {
      x = clamp01(0.5 + (base.x - 0.5) * line.width)
      y = clamp01(base.y * line.yScale + line.yLift)
    }

    // Compact mid-block: pull wide attackers inside slightly
    if (isAttacker(slotId, role, base.y)) {
      x = clamp01(0.5 + (x - 0.5) * 0.78)
      y = clamp01(Math.min(y, 0.72))
    }

    // Rest-defence shape readable when out of possession too
    if (restIds.has(slotId) && slotId !== 'gk' && !fromBoard) {
      y = clamp01(Math.min(y, base.y * line.yScale + line.yLift * 0.85))
    }

    return { x: clamp01(x), y: clamp01(y) }
  }

  // Transition — brief intermediate between in and out
  const inn = homePhasePosition(formation, slotId, 'in', tactics, layoutOverride)
  const out = homePhasePosition(formation, slotId, 'out', tactics, layoutOverride)
  return {
    x: clamp01((inn.x + out.x) / 2),
    y: clamp01(((inn.y + out.y) / 2) * 0.94 + 0.03),
  }
}

/** Away team: mirror along the length axis (attack the other way). */
export function awayPhasePosition(
  formation: Formation,
  slotId: string,
  phase: PossessionMode | 'transition',
  tactics?: PitchTactics,
  layoutOverride?: PitchPosition,
): { x: number; y: number } {
  const mirroredPhase: PossessionMode | 'transition' =
    phase === 'in' ? 'in' : phase === 'out' ? 'out' : 'transition'
  const home = homePhasePosition(
    formation,
    slotId,
    mirroredPhase,
    tactics,
    layoutOverride,
  )
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

/**
 * Iterative repulsion so tokens keep a readable minimum distance.
 * Softens collisions without destroying formation shape.
 */
export function separateTokens<T extends { id: string; x: number; y: number }>(
  tokens: T[],
  minDist = 0.065,
  iterations = 10,
): T[] {
  if (tokens.length === 0) return tokens
  const pts = tokens.map((t) => ({ ...t }))
  const min2 = minDist * minDist

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i]!
        const b = pts[j]!
        let dx = a.x - b.x
        let dy = a.y - b.y
        let d2 = dx * dx + dy * dy
        if (d2 >= min2 || d2 === 0) {
          if (d2 === 0) {
            dx = (i % 2 === 0 ? 1 : -1) * 0.01
            dy = 0.01
            d2 = dx * dx + dy * dy
          } else {
            continue
          }
        }
        const d = Math.sqrt(d2)
        const push = ((minDist - d) / 2) * 0.65
        const ux = dx / d
        const uy = dy / d
        a.x = clamp01(a.x + ux * push)
        a.y = clamp01(a.y + uy * push)
        b.x = clamp01(b.x - ux * push)
        b.y = clamp01(b.y - uy * push)
      }
    }
  }
  return pts
}

/**
 * Who gets a full surname plate: event player + ball carrier + a few nearby.
 * Everyone else stays initials-only (or no plate).
 */
export function pickLabeledPlayerIds(
  tokens: {
    id: string
    x: number
    y: number
    team: 'home' | 'away'
    slotId?: string
  }[],
  ballX: number,
  ballY: number,
  possession: 'home' | 'away',
  highlightId: string | undefined,
  maxNearby = 3,
): Set<string> {
  const labeled = new Set<string>()
  if (highlightId) labeled.add(highlightId)

  const isGk = (t: { slotId?: string }) =>
    (t.slotId ?? '').toLowerCase() === 'gk'

  const posse = tokens.filter((t) => t.team === possession && !isGk(t))
  const byBall = [...posse].sort((a, b) => {
    const da = (a.x - ballX) ** 2 + (a.y - ballY) ** 2
    const db = (b.x - ballX) ** 2 + (b.y - ballY) ** 2
    return da - db
  })

  for (const t of byBall) {
    if (labeled.size >= maxNearby) break
    labeled.add(t.id)
  }

  // Cap total named plates so the pitch stays readable
  if (labeled.size <= 4) return labeled
  const keep = new Set<string>()
  if (highlightId) keep.add(highlightId)
  for (const t of byBall) {
    if (keep.size >= 4) break
    if (labeled.has(t.id)) keep.add(t.id)
  }
  return keep
}

/** Scale factor when the pack is still dense after separation. */
export function crowdingScale(
  tokens: { x: number; y: number }[],
  comfortDist = 0.08,
): number {
  if (tokens.length < 2) return 1
  let minD = Infinity
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      const a = tokens[i]!
      const b = tokens[j]!
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (d < minD) minD = d
    }
  }
  if (!Number.isFinite(minD) || minD >= comfortDist) return 1
  return Math.max(0.78, minD / comfortDist)
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
  tactics?: PitchTactics,
): Player {
  const assigned = assignSquadToSlots(formation, squad)
  let best = assigned[0]!
  let bestDist = Infinity
  for (const row of assigned) {
    const pos =
      team === 'home'
        ? homePhasePosition(formation, row.slotId, phase, tactics)
        : awayPhasePosition(formation, row.slotId, phase, tactics)
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
