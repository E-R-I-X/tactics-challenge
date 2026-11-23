import type { MatchEvent, MatchResult, Player, TacticalSetup } from '../types'
import { squadAttackRating, squadDefenceRating } from './attributes'
import {
  getBuildUpSuccessModifier,
  getPressSuccessModifier,
  getSetPieceXGModifier,
  getTransitionRiskModifier,
  type PressSituation,
} from './modifiers'

export interface SimulationInput {
  tactics: TacticalSetup
  homeSquad: Player[]
  awaySquad: Player[]
  /** Optional seed override for tests. */
  seed?: number
}

type Team = 'home' | 'away'

/**
 * Event-driven condensed match (~90'). Same inputs → same outcome (seeded RNG).
 * Tactical modifiers shift press wins, build-up progression, transition risk, and set-piece xG.
 */
export function simulateMatch(input: SimulationInput): MatchResult {
  const { tactics, homeSquad, awaySquad } = input
  const rng = createRng(input.seed ?? seedFromInputs(tactics, homeSquad, awaySquad))

  const homeAttack = squadAttackRating(homeSquad) / 100
  const awayAttack = squadAttackRating(awaySquad) / 100
  const homeDefence = squadDefenceRating(homeSquad) / 100
  const awayDefence = squadDefenceRating(awaySquad) / 100

  const buildUp = getBuildUpSuccessModifier(tactics)
  const transitionRisk = getTransitionRiskModifier(tactics)

  const events: MatchEvent[] = []
  let possession: Team = 'home'
  let homeScore = 0
  let awayScore = 0
  let homeXG = 0
  let awayXG = 0
  let ballX = 0.5
  let ballY = 0.15

  events.push({
    minute: 0,
    type: 'kickoff',
    team: 'home',
    description: `Kick-off — ${tactics.formation}, ${tactics.pressIntensity} press, ${tactics.buildUpPattern}`,
    ballX: 0.5,
    ballY: 0.5,
  })

  for (let minute = 1; minute <= 90; minute++) {
    if (minute === 45) {
      events.push({
        minute: 45,
        type: 'half-time',
        description: `Half time ${homeScore}–${awayScore}`,
        ballX: 0.5,
        ballY: 0.5,
      })
      possession = 'away'
      ballX = 0.5
      ballY = 0.85
      continue
    }

    // ~1 meaningful action every 2–3 minutes on average
    if (rng() > 0.42) continue

    const attacking: Team = possession
    const defending: Team = attacking === 'home' ? 'away' : 'home'
    const attackRating = attacking === 'home' ? homeAttack : awayAttack
    const defenceRating = defending === 'home' ? homeDefence : awayDefence

    // Home team uses user tactics; away uses a flat mid-block baseline
    const isHomeAttacking = attacking === 'home'
    const situation = pickSituation(ballY, attacking, rng)
    const pressMod =
      defending === 'home'
        ? getPressSuccessModifier(tactics, situation)
        : 0.04

    // Press attempt by defending side
    if (rng() < 0.28 + Math.abs(pressMod) * 0.5) {
      const pressSuccess =
        0.22 +
        pressMod +
        defenceRating * 0.15 -
        attackRating * 0.08 +
        (defending === 'home' ? 0 : -0.02)

      ballX = clamp01(ballX + (rng() - 0.5) * 0.2)
      ballY = nudgeBallToward(ballY, defending, 0.04 + rng() * 0.06)

      events.push({
        minute,
        type: 'press',
        team: defending,
        description: `${label(defending)} press (${situation})`,
        ballX,
        ballY,
      })

      if (rng() < clamp01(pressSuccess)) {
        possession = defending
        events.push({
          minute,
          type: 'turnover',
          team: defending,
          description: `${label(defending)} win the ball`,
          ballX,
          ballY,
        })

        // Transition chance for the new attacking side
        const risk =
          defending === 'away'
            ? Math.max(0, transitionRisk)
            : 0.04
        if (rng() < 0.18 + risk) {
          const shot = attemptShot({
            minute,
            team: defending,
            attackRating: defending === 'home' ? homeAttack : awayAttack,
            defenceRating: defending === 'home' ? awayDefence : homeDefence,
            ballX,
            ballY,
            buildUpBoost: defending === 'home' ? buildUp * 0.5 : 0,
            transition: true,
            transitionRisk: defending === 'away' ? transitionRisk : 0,
            rng,
          })
          events.push(...shot.events)
          if (shot.team === 'home') {
            homeXG += shot.xG
            if (shot.scored) homeScore += 1
          } else {
            awayXG += shot.xG
            if (shot.scored) awayScore += 1
          }
          ballX = shot.ballX
          ballY = shot.ballY
          if (shot.scored) possession = shot.team === 'home' ? 'away' : 'home'
        }
        continue
      }
    }

    // Build-up / progression while in possession
    const progressChance =
      0.35 +
      attackRating * 0.25 -
      defenceRating * 0.15 +
      (isHomeAttacking ? buildUp : 0.02)

    events.push({
      minute,
      type: 'pass',
      team: attacking,
      description: `${label(attacking)} work possession`,
      ballX,
      ballY,
    })

    if (rng() < clamp01(progressChance)) {
      ballX = clamp01(0.25 + rng() * 0.5)
      ballY = nudgeBallToward(ballY, attacking, 0.12 + rng() * 0.14)

      // Chance of a shot when advanced
      const inFinalThird =
        (attacking === 'home' && ballY > 0.68) ||
        (attacking === 'away' && ballY < 0.32)

      if (inFinalThird && rng() < 0.45 + attackRating * 0.2) {
        const shot = attemptShot({
          minute,
          team: attacking,
          attackRating,
          defenceRating,
          ballX,
          ballY,
          buildUpBoost: isHomeAttacking ? buildUp : 0,
          transition: false,
          transitionRisk: 0,
          rng,
        })
        events.push(...shot.events)
        if (shot.team === 'home') {
          homeXG += shot.xG
          if (shot.scored) homeScore += 1
        } else {
          awayXG += shot.xG
          if (shot.scored) awayScore += 1
        }
        ballX = shot.ballX
        ballY = shot.ballY
        if (shot.scored) {
          possession = attacking === 'home' ? 'away' : 'home'
        } else if (rng() < 0.4) {
          possession = defending
        }
      }
    } else if (rng() < 0.35) {
      possession = defending
      events.push({
        minute,
        type: 'turnover',
        team: defending,
        description: `${label(defending)} recover after loose pass`,
        ballX,
        ballY,
      })
    }

    // Occasional set piece for the attacking side
    if (rng() < 0.04 + (isHomeAttacking ? 0.02 : 0)) {
      const sp = resolveSetPiece({
        minute,
        team: attacking,
        tactics,
        attackRating,
        defenceRating,
        rng,
      })
      events.push(...sp.events)
      if (sp.team === 'home') {
        homeXG += sp.xG
        if (sp.scored) homeScore += 1
      } else {
        awayXG += sp.xG
        if (sp.scored) awayScore += 1
      }
      ballX = sp.ballX
      ballY = sp.ballY
      if (sp.scored) possession = attacking === 'home' ? 'away' : 'home'
      else possession = defending
    }
  }

  events.push({
    minute: 90,
    type: 'full-time',
    description: `Full time ${homeScore}–${awayScore}`,
    ballX: 0.5,
    ballY: 0.5,
  })

  events.sort((a, b) => a.minute - b.minute || eventOrder(a.type) - eventOrder(b.type))

  return {
    homeScore,
    awayScore,
    homeXG: round2(homeXG),
    awayXG: round2(awayXG),
    events,
  }
}

function attemptShot(args: {
  minute: number
  team: Team
  attackRating: number
  defenceRating: number
  ballX: number
  ballY: number
  buildUpBoost: number
  transition: boolean
  transitionRisk: number
  rng: () => number
}): { events: MatchEvent[]; xG: number; scored: boolean; team: Team; ballX: number; ballY: number } {
  const {
    minute,
    team,
    attackRating,
    defenceRating,
    buildUpBoost,
    transition,
    transitionRisk,
    rng,
  } = args

  let ballX = args.ballX
  let ballY = args.ballY

  const proximity =
    team === 'home' ? clamp01((ballY - 0.55) / 0.45) : clamp01((0.45 - ballY) / 0.45)

  let xG =
    0.06 +
    attackRating * 0.12 +
    proximity * 0.18 +
    buildUpBoost * 0.08 -
    defenceRating * 0.08

  if (transition) {
    xG += 0.04 + Math.max(0, transitionRisk) * 0.25
  }

  xG = clamp(xG, 0.03, 0.55)
  xG = round2(xG)

  const events: MatchEvent[] = [
    {
      minute,
      type: 'shot',
      team,
      description: transition
        ? `${label(team)} shot on the break`
        : `${label(team)} shot`,
      xG,
      ballX,
      ballY,
    },
  ]

  const scored = rng() < xG
  if (scored) {
    events.push({
      minute,
      type: 'goal',
      team,
      description: `GOAL — ${label(team)}`,
      xG,
      ballX,
      ballY,
    })
    ballX = 0.5
    ballY = team === 'home' ? 0.85 : 0.15
  }

  return { events, xG, scored, team, ballX, ballY }
}

function resolveSetPiece(args: {
  minute: number
  team: Team
  tactics: TacticalSetup
  attackRating: number
  defenceRating: number
  rng: () => number
}): { events: MatchEvent[]; xG: number; scored: boolean; team: Team; ballX: number; ballY: number } {
  const { minute, team, tactics, attackRating, defenceRating, rng } = args
  const typeRoll = rng()
  const type: 'corner' | 'free-kick' | 'throw-in' =
    typeRoll < 0.55 ? 'corner' : typeRoll < 0.85 ? 'free-kick' : 'throw-in'

  const routine = tactics.setPieces.find((r) => r.type === type) ?? tactics.setPieces[0]
  const delivery = routine?.delivery ?? 'out-swing'
  const zone = routine?.targetZone ?? 'penalty spot'

  const base =
    type === 'corner' ? 0.1 : type === 'free-kick' ? 0.08 : 0.04
  const spMod = team === 'home' ? getSetPieceXGModifier(tactics, type) : 0.02
  let xG =
    base +
    spMod +
    attackRating * 0.06 -
    defenceRating * 0.04
  xG = clamp(xG, 0.02, 0.4)
  xG = round2(xG)

  const ballX = clamp01(0.35 + rng() * 0.3)
  const ballY = team === 'home' ? 0.92 : 0.08

  const events: MatchEvent[] = [
    {
      minute,
      type: 'set-piece',
      team,
      description: `${label(team)} ${type} — ${delivery} toward ${zone}`,
      xG,
      ballX,
      ballY,
    },
  ]

  // Only corners/FKs become shots/goals often
  if (type === 'throw-in' || rng() > 0.7) {
    return { events, xG: 0, scored: false, team, ballX, ballY }
  }

  events.push({
    minute,
    type: 'shot',
    team,
    description: `${label(team)} header/shot from ${type}`,
    xG,
    ballX,
    ballY,
  })

  const scored = rng() < xG
  if (scored) {
    events.push({
      minute,
      type: 'goal',
      team,
      description: `GOAL — ${label(team)} from ${type}`,
      xG,
      ballX,
      ballY,
    })
  }

  return {
    events,
    xG,
    scored,
    team,
    ballX: scored ? 0.5 : ballX,
    ballY: scored ? (team === 'home' ? 0.85 : 0.15) : ballY,
  }
}

function pickSituation(
  ballY: number,
  attacking: Team,
  rng: () => number,
): PressSituation {
  const advancing =
    attacking === 'home' ? ballY : 1 - ballY
  if (advancing < 0.35) return 'build-up'
  if (advancing < 0.65) return rng() < 0.7 ? 'midfield' : 'build-up'
  return 'final-third'
}

function nudgeBallToward(ballY: number, team: Team, amount: number): number {
  return clamp01(team === 'home' ? ballY + amount : ballY - amount)
}

function label(team: Team): string {
  return team === 'home' ? 'Home' : 'Away'
}

function eventOrder(type: string): number {
  const order: Record<string, number> = {
    kickoff: 0,
    press: 1,
    pass: 2,
    turnover: 3,
    'set-piece': 4,
    shot: 5,
    goal: 6,
    substitution: 7,
    'half-time': 8,
    'full-time': 9,
  }
  return order[type] ?? 5
}

function seedFromInputs(
  tactics: TacticalSetup,
  home: Player[],
  away: Player[],
): number {
  const key = [
    tactics.formation,
    tactics.pressIntensity,
    tactics.restDefence,
    tactics.buildUpPattern,
    tactics.tempo,
    tactics.risk,
    tactics.counterPress ? '1' : '0',
    tactics.pressingTriggers.join(','),
    tactics.setPieces.map((s) => `${s.type}:${s.delivery}:${s.targetZone}`).join('|'),
    home.map((p) => p.id).join(','),
    away.map((p) => p.id).join(','),
  ].join('::')
  return seedFrom(key)
}

function seedFrom(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Mulberry32 — deterministic [0,1) stream. */
function createRng(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function clamp01(n: number) {
  return clamp(n, 0, 1)
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
