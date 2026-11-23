import type {
  MatchEvent,
  MatchResult,
  Player,
  PressingTriggerId,
  TacticalSetup,
} from '../types'
import { OPPOSITION_SITUATIONS } from '../data/pressingTriggers'
import { squadAttackRating, squadDefenceRating } from './attributes'
import {
  BASE_PRESS_SUCCESS,
  getBuildUpProgressSpeed,
  getBuildUpSuccessMultiplier,
  getBuildUpTurnoverRisk,
  getPressIntensityMultiplier,
  getPressTriggerMultiplier,
  getSetPieceXGMultiplier,
  getSideProgressBonus,
  getTransitionRiskMultiplier,
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

  const buildUpMul = getBuildUpSuccessMultiplier(tactics)
  const progressSpeed = getBuildUpProgressSpeed(tactics)
  const turnoverRisk = getBuildUpTurnoverRisk(tactics)
  const transitionMul = getTransitionRiskMultiplier(tactics)
  const pressIntensityMul = getPressIntensityMultiplier(tactics)

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

    const isHomeAttacking = attacking === 'home'
    const situation = pickSituation(ballY, attacking, rng)

    // Opposition-in-possession trigger: only home uses the user's selected triggers
    let trigger: PressingTriggerId | null = null
    let triggerMatched = false
    if (defending === 'home') {
      trigger = pickOppositionTrigger(ballX, ballY, attacking, situation, rng)
      triggerMatched = tactics.pressingTriggers.includes(trigger)
    }

    const pressTriggerMul =
      defending === 'home'
        ? getPressTriggerMultiplier(tactics, trigger)
        : 1
    const pressMod =
      defending === 'home'
        ? BASE_PRESS_SUCCESS * pressIntensityMul * pressTriggerMul -
          BASE_PRESS_SUCCESS +
          (situation === 'build-up' ? 0.04 : situation === 'midfield' ? 0.015 : -0.03) +
          (tactics.counterPress ? 0.04 : 0)
        : 0.04

    // Press attempt — unmatched triggers → much less likely to press
    const pressAttemptChance =
      defending === 'home'
        ? triggerMatched
          ? 0.38 + pressIntensityMul * 0.12
          : 0.12 + pressIntensityMul * 0.04
        : 0.28

    if (rng() < pressAttemptChance) {
      const pressSuccess =
        0.22 +
        pressMod +
        defenceRating * 0.15 -
        attackRating * 0.08 +
        (defending === 'home' ? 0 : -0.02)

      ballX = clamp01(ballX + (rng() - 0.5) * 0.2)
      ballY = nudgeBallToward(ballY, defending, 0.04 + rng() * 0.06)

      const triggerLabel =
        defending === 'home' && trigger
          ? triggerMatched
            ? ` · trigger ${trigger}`
            : ` · no trigger (${trigger})`
          : ''

      events.push({
        minute,
        type: 'press',
        team: defending,
        description: `${label(defending)} press (${situation}${triggerLabel})`,
        ballX,
        ballY,
      })

      if (rng() < clamp01(pressSuccess)) {
        possession = defending
        events.push({
          minute,
          type: 'turnover',
          team: defending,
          description: triggerMatched
            ? `${label(defending)} win the ball on ${trigger}`
            : `${label(defending)} win the ball`,
          ballX,
          ballY,
        })

        // Transition chance for the new attacking side
        // When away breaks on home's press, apply home transition risk multiplier
        const breakChance =
          defending === 'away'
            ? 0.16 * transitionMul
            : 0.18
        if (rng() < clamp01(breakChance)) {
          const shot = attemptShot({
            minute,
            team: defending,
            attackRating: defending === 'home' ? homeAttack : awayAttack,
            defenceRating: defending === 'home' ? awayDefence : homeDefence,
            ballX,
            ballY,
            buildUpBoost: defending === 'home' ? (buildUpMul - 1) * 0.3 : 0,
            transition: true,
            // Away transition shot xG scaled by home rest-defence / press risk
            transitionXGMul: defending === 'away' ? transitionMul : 1,
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
    const sideBonus = isHomeAttacking ? getSideProgressBonus(tactics, ballX) : 0
    const firstLineBonus =
      isHomeAttacking &&
      tactics.buildUpPattern === 'dropping-six' &&
      situation === 'build-up'
        ? 0.14
        : 0

    const progressChance =
      0.32 +
      attackRating * 0.22 -
      defenceRating * 0.14 +
      (isHomeAttacking ? (buildUpMul - 1) * 0.5 + sideBonus + firstLineBonus : 0.02)

    events.push({
      minute,
      type: 'pass',
      team: attacking,
      description: isHomeAttacking
        ? `${label(attacking)} build (${tactics.buildUpPattern})`
        : `${label(attacking)} work possession`,
      ballX,
      ballY,
    })

    if (rng() < clamp01(progressChance)) {
      // Prefer overload side when progressing
      if (isHomeAttacking && tactics.buildUpPattern === 'overload-left') {
        ballX = clamp01(0.15 + rng() * 0.28)
      } else if (isHomeAttacking && tactics.buildUpPattern === 'overload-right') {
        ballX = clamp01(0.57 + rng() * 0.28)
      } else if (isHomeAttacking && tactics.buildUpPattern === 'inverted-fullbacks') {
        ballX = clamp01(0.28 + rng() * 0.44)
      } else {
        ballX = clamp01(0.25 + rng() * 0.5)
      }

      const advance =
        (0.1 + rng() * 0.12) * (isHomeAttacking ? progressSpeed : 1)
      ballY = nudgeBallToward(ballY, attacking, advance)

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
          buildUpBoost: isHomeAttacking ? (buildUpMul - 1) * 0.5 : 0,
          transition: false,
          transitionXGMul: 1,
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
    } else if (
      rng() <
      (isHomeAttacking ? turnoverRisk : 0.35)
    ) {
      possession = defending
      const dangerous =
        isHomeAttacking &&
        tactics.buildUpPattern === 'direct-into-channels' &&
        rng() < 0.45
      events.push({
        minute,
        type: 'turnover',
        team: defending,
        description: dangerous
          ? `${label(defending)} snatch a dangerous turnover`
          : `${label(defending)} recover after loose pass`,
        ballX,
        ballY,
      })

      // Direct turnovers can immediately become transition shots against
      if (dangerous && rng() < 0.35 * transitionMul) {
        const shot = attemptShot({
          minute,
          team: defending,
          attackRating: awayAttack,
          defenceRating: homeDefence,
          ballX,
          ballY,
          buildUpBoost: 0,
          transition: true,
          transitionXGMul: transitionMul,
          rng,
        })
        events.push(...shot.events)
        awayXG += shot.xG
        if (shot.scored) {
          awayScore += 1
          possession = 'home'
        }
        ballX = shot.ballX
        ballY = shot.ballY
      }
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
  transitionXGMul: number
  rng: () => number
}): { events: MatchEvent[]; xG: number; scored: boolean; team: Team; ballX: number; ballY: number } {
  const {
    minute,
    team,
    attackRating,
    defenceRating,
    buildUpBoost,
    transition,
    transitionXGMul,
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
    xG = (xG + 0.05) * transitionXGMul
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
  const blockers = routine?.blockers ? ' + blockers' : ''
  const runners = routine?.screeningRunners ? ' + runners' : ''

  const base =
    type === 'corner' ? 0.1 : type === 'free-kick' ? 0.08 : 0.04
  const spMul = team === 'home' ? getSetPieceXGMultiplier(tactics, type) : 1.05
  let xG =
    (base + attackRating * 0.06 - defenceRating * 0.04) * spMul
  xG = clamp(xG, 0.02, 0.45)
  xG = round2(xG)

  const ballX = clamp01(0.35 + rng() * 0.3)
  const ballY = team === 'home' ? 0.92 : 0.08

  const events: MatchEvent[] = [
    {
      minute,
      type: 'set-piece',
      team,
      description: `${label(team)} ${type} — ${delivery} toward ${zone}${blockers}${runners}`,
      xG,
      ballX,
      ballY,
    },
  ]

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

/** Roll an opposition-on-ball situation weighted by pitch location. */
function pickOppositionTrigger(
  ballX: number,
  ballY: number,
  attacking: Team,
  situation: PressSituation,
  rng: () => number,
): PressingTriggerId {
  const advancing = attacking === 'home' ? ballY : 1 - ballY
  const wide = ballX < 0.22 || ballX > 0.78
  const weights: { id: PressingTriggerId; w: number }[] = [
    { id: 'gk-back-pass', w: advancing < 0.28 ? 3.2 : 0.4 },
    { id: 'cb-back-pass', w: advancing < 0.4 ? 2.4 : 0.6 },
    { id: 'poor-first-touch', w: situation === 'midfield' ? 2.2 : 1.2 },
    { id: 'facing-own-goal', w: situation === 'build-up' ? 1.8 : 1.1 },
    { id: 'wide-areas', w: wide ? 3.5 : 0.7 },
  ]
  const total = weights.reduce((s, x) => s + x.w, 0)
  let roll = rng() * total
  for (const entry of weights) {
    roll -= entry.w
    if (roll <= 0) return entry.id
  }
  return OPPOSITION_SITUATIONS[OPPOSITION_SITUATIONS.length - 1]
}

function pickSituation(
  ballY: number,
  attacking: Team,
  rng: () => number,
): PressSituation {
  const advancing = attacking === 'home' ? ballY : 1 - ballY
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
    tactics.setPieces
      .map(
        (s) =>
          `${s.type}:${s.delivery}:${s.targetZone}:b${s.blockers ? 1 : 0}:r${s.screeningRunners ? 1 : 0}`,
      )
      .join('|'),
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
