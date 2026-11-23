import type {
  MatchEvent,
  MatchResult,
  Player,
  PressingTriggerId,
  TacticalSetup,
} from '../types'
import { OPPOSITION_SITUATIONS } from '../data/pressingTriggers'
import {
  pickPlayerNearBall,
  teamPhase,
} from '../lib/playerSlots'
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
import {
  combineSeed,
  createRng,
  randomSalt,
  seedFrom,
  varianceMul,
} from './rng'

export interface SimulationInput {
  tactics: TacticalSetup
  homeSquad: Player[]
  awaySquad: Player[]
  /** Optional seed override for tests / replays. */
  seed?: number
  /** XOR'd with tactics fingerprint when `seed` is omitted. */
  runSalt?: number
}

type Team = 'home' | 'away'

/**
 * Event-driven condensed match (~90').
 * Fixed seed → identical outcome; fresh runSalt → similar but not identical scores.
 * Per-action ±8–12% variance keeps strong tactics ahead of weak ones on average.
 */
export function simulateMatch(input: SimulationInput): MatchResult {
  const { tactics, homeSquad, awaySquad } = input
  const fingerprint = seedFromInputs(tactics, homeSquad, awaySquad)
  const seed =
    input.seed ??
    combineSeed(fingerprint, input.runSalt ?? randomSalt())
  const rng = createRng(seed)

  const homeAttack = squadAttackRating(homeSquad) / 100
  const awayAttack = squadAttackRating(awaySquad) / 100
  const homeDefence = squadDefenceRating(homeSquad) / 100
  const awayDefence = squadDefenceRating(awaySquad) / 100

  const buildUpMul = getBuildUpSuccessMultiplier(tactics)
  const progressSpeed = getBuildUpProgressSpeed(tactics)
  const turnoverRisk = getBuildUpTurnoverRisk(tactics)
  const transitionMul = getTransitionRiskMultiplier(tactics)
  const pressIntensityMul = getPressIntensityMultiplier(tactics)
  const formation = tactics.formation

  const events: MatchEvent[] = []
  let possession: Team = 'home'
  let homeScore = 0
  let awayScore = 0
  let homeXG = 0
  let awayXG = 0
  let ballX = 0.5
  let ballY = 0.15
  /** Soft cooldown after goals — transitional play only. */
  let majorCooldownUntil = 0
  /** Minutes since last soft beat — force filler if quiet too long. */
  let quietStreak = 0
  /** Build-up depth this possession (0 = just won it). */
  let phaseDepth = 1

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
      phaseDepth = 1
      quietStreak = 0
      continue
    }

    const inCooldown = minute < majorCooldownUntil
    // Soft beats more often; major chances gated by cooldown + build-up depth
    const softChance = inCooldown ? 0.62 : 0.55
    const forceSoft = quietStreak >= 3
    if (!forceSoft && rng() > softChance) {
      quietStreak += 1
      continue
    }
    quietStreak = 0

    const attacking: Team = possession
    const defending: Team = attacking === 'home' ? 'away' : 'home'
    const attackRating = attacking === 'home' ? homeAttack : awayAttack
    const defenceRating = defending === 'home' ? homeDefence : awayDefence
    const attackSquad = attacking === 'home' ? homeSquad : awaySquad
    const defenceSquad = defending === 'home' ? homeSquad : awaySquad

    const isHomeAttacking = attacking === 'home'
    const situation = pickSituation(ballY, attacking, rng)
    /** Shots/set pieces allowed outside post-goal cooldown. */
    const allowMajor = !inCooldown

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

    const pressAttemptChance =
      defending === 'home'
        ? triggerMatched
          ? 0.42 + pressIntensityMul * 0.12
          : 0.16 + pressIntensityMul * 0.05
        : 0.32

    if (rng() < pressAttemptChance * varianceMul(rng, 0.05, 0.1)) {
      const pressSuccess =
        (0.22 +
          pressMod +
          defenceRating * 0.15 -
          attackRating * 0.08 +
          (defending === 'home' ? 0 : -0.02)) *
        varianceMul(rng)

      ballX = clamp01(ballX + (rng() - 0.5) * 0.2)
      ballY = nudgeBallToward(ballY, defending, 0.04 + rng() * 0.06)

      const pressPhase = teamPhase(defending, possession, 'press')
      const presser = pickPlayerNearBall(
        formation,
        defenceSquad,
        defending,
        ballX,
        ballY,
        pressPhase,
        rng,
      )

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
        description: `${presser.name} presses (${situation}${triggerLabel})`,
        ballX,
        ballY,
        playerId: presser.id,
        playerName: presser.name,
      })

      if (rng() < clamp01(pressSuccess)) {
        possession = defending
        phaseDepth = 0
        events.push({
          minute,
          type: 'turnover',
          team: defending,
          description: triggerMatched
            ? `${presser.name} wins it on ${trigger}`
            : `${presser.name} recovers possession`,
          ballX,
          ballY,
          playerId: presser.id,
          playerName: presser.name,
        })

        // Occasional counters — always preceded by an outlet pass
        const breakChance = allowMajor
          ? defending === 'away'
            ? 0.11 * transitionMul
            : 0.12
          : 0
        if (rng() < clamp01(breakChance * varianceMul(rng))) {
          // Quick outlet pass before the shot so the feed isn't press→goal
          const outlet = pickPlayerNearBall(
            formation,
            defending === 'home' ? homeSquad : awaySquad,
            defending,
            ballX,
            ballY,
            'transition',
            rng,
          )
          ballY = nudgeBallToward(ballY, defending, 0.08 + rng() * 0.1)
          ballX = clamp01(ballX + (rng() - 0.5) * 0.18)
          events.push({
            minute,
            type: 'pass',
            team: defending,
            description: `${outlet.name} drives the break forward`,
            ballX,
            ballY,
            playerId: outlet.id,
            playerName: outlet.name,
          })
          const shot = attemptShot({
            minute,
            team: defending,
            attackRating: defending === 'home' ? homeAttack : awayAttack,
            defenceRating: defending === 'home' ? awayDefence : homeDefence,
            ballX,
            ballY,
            buildUpBoost: defending === 'home' ? (buildUpMul - 1) * 0.3 : 0,
            transition: true,
            transitionXGMul: defending === 'away' ? transitionMul : 1,
            formation,
            squad: defending === 'home' ? homeSquad : awaySquad,
            rng,
          })
          events.push(...shot.events)
          if (shot.team === 'home') {
            homeXG += shot.xG
            if (shot.scored) {
              homeScore += 1
              majorCooldownUntil = minute + 4 + Math.floor(rng() * 3)
            }
          } else {
            awayXG += shot.xG
            if (shot.scored) {
              awayScore += 1
              majorCooldownUntil = minute + 4 + Math.floor(rng() * 3)
            }
          }
          ballX = shot.ballX
          ballY = shot.ballY
          if (shot.scored) {
            possession = shot.team === 'home' ? 'away' : 'home'
            phaseDepth = 1
          } else {
            phaseDepth = 1
          }
        }
        continue
      }
    }

    const sideBonus = isHomeAttacking ? getSideProgressBonus(tactics, ballX) : 0
    const firstLineBonus =
      isHomeAttacking &&
      tactics.buildUpPattern === 'dropping-six' &&
      situation === 'build-up'
        ? 0.14
        : 0

    const progressChance =
      (0.32 +
        attackRating * 0.22 -
        defenceRating * 0.14 +
        (isHomeAttacking ? (buildUpMul - 1) * 0.5 + sideBonus + firstLineBonus : 0.02)) *
      varianceMul(rng)

    const passer = pickPlayerNearBall(
      formation,
      attackSquad,
      attacking,
      ballX,
      ballY,
      'in',
      rng,
    )

    const passLabel = passDescription(
      passer.name,
      isHomeAttacking,
      tactics.buildUpPattern,
      situation,
      phaseDepth,
      rng,
    )
    events.push({
      minute,
      type: 'pass',
      team: attacking,
      description: passLabel,
      ballX,
      ballY,
      playerId: passer.id,
      playerName: passer.name,
    })
    phaseDepth += 1
    /** After this minute's pass, need at least one prior beat of possession. */
    const allowBuildUpShot = allowMajor && phaseDepth >= 2

    if (rng() < clamp01(progressChance)) {
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

      // Need build-up depth before a shot; often insert a final pass first
      if (
        allowBuildUpShot &&
        inFinalThird &&
        rng() < (0.44 + attackRating * 0.2) * varianceMul(rng, 0.06, 0.1)
      ) {
        if (rng() < 0.7) {
          const supplier = pickPlayerNearBall(
            formation,
            attackSquad,
            attacking,
            ballX,
            ballY,
            'in',
            rng,
          )
          events.push({
            minute,
            type: 'pass',
            team: attacking,
            description: `${supplier.name} finds the runner in the box`,
            ballX,
            ballY,
            playerId: supplier.id,
            playerName: supplier.name,
          })
        }
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
          formation,
          squad: attackSquad,
          rng,
        })
        events.push(...shot.events)
        if (shot.team === 'home') {
          homeXG += shot.xG
          if (shot.scored) {
            homeScore += 1
            majorCooldownUntil = minute + 4 + Math.floor(rng() * 3)
          }
        } else {
          awayXG += shot.xG
          if (shot.scored) {
            awayScore += 1
            majorCooldownUntil = minute + 4 + Math.floor(rng() * 3)
          }
        }
        ballX = shot.ballX
        ballY = shot.ballY
        if (shot.scored) {
          possession = attacking === 'home' ? 'away' : 'home'
          phaseDepth = 1
        } else if (rng() < 0.4) {
          possession = defending
          phaseDepth = 0
        }
      }
    } else if (
      rng() <
      (isHomeAttacking ? turnoverRisk : 0.35) * varianceMul(rng)
    ) {
      possession = defending
      phaseDepth = 0
      const interceptor = pickPlayerNearBall(
        formation,
        defenceSquad,
        defending,
        ballX,
        ballY,
        'transition',
        rng,
      )
      const dangerous =
        isHomeAttacking &&
        tactics.buildUpPattern === 'direct-into-channels' &&
        rng() < 0.45
      events.push({
        minute,
        type: 'turnover',
        team: defending,
        description: dangerous
          ? `${interceptor.name} snatches a dangerous turnover`
          : `${interceptor.name} recovers after loose pass`,
        ballX,
        ballY,
        playerId: interceptor.id,
        playerName: interceptor.name,
      })

      if (
        allowMajor &&
        dangerous &&
        rng() < 0.28 * transitionMul * varianceMul(rng)
      ) {
        const outlet = pickPlayerNearBall(
          formation,
          awaySquad,
          'away',
          ballX,
          ballY,
          'transition',
          rng,
        )
        ballY = nudgeBallToward(ballY, 'away', 0.06 + rng() * 0.08)
        events.push({
          minute,
          type: 'pass',
          team: 'away',
          description: `${outlet.name} releases the counter`,
          ballX,
          ballY,
          playerId: outlet.id,
          playerName: outlet.name,
        })
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
          formation,
          squad: awaySquad,
          rng,
        })
        events.push(...shot.events)
        awayXG += shot.xG
        if (shot.scored) {
          awayScore += 1
          possession = 'home'
          phaseDepth = 1
          majorCooldownUntil = minute + 4 + Math.floor(rng() * 3)
        }
        ballX = shot.ballX
        ballY = shot.ballY
      }
    }

    if (
      allowMajor &&
      rng() < (0.035 + (isHomeAttacking ? 0.02 : 0)) * varianceMul(rng, 0.05, 0.1)
    ) {
      const sp = resolveSetPiece({
        minute,
        team: attacking,
        tactics,
        attackRating,
        defenceRating,
        formation,
        squad: attackSquad,
        rng,
      })
      events.push(...sp.events)
      if (sp.team === 'home') {
        homeXG += sp.xG
        if (sp.scored) {
          homeScore += 1
          majorCooldownUntil = minute + 4 + Math.floor(rng() * 3)
        }
      } else {
        awayXG += sp.xG
        if (sp.scored) {
          awayScore += 1
          majorCooldownUntil = minute + 4 + Math.floor(rng() * 3)
        }
      }
      ballX = sp.ballX
      ballY = sp.ballY
      if (sp.scored) {
        possession = attacking === 'home' ? 'away' : 'home'
        phaseDepth = 1
      } else {
        possession = defending
        phaseDepth = 0
      }
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
    seed,
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
  formation: TacticalSetup['formation']
  squad: Player[]
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
    formation,
    squad,
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

  // Variance on quality of chance (recorded xG)
  xG = clamp(xG * varianceMul(rng), 0.03, 0.55)
  xG = round2(xG)

  // Separate conversion variance — over/under-perform vs xG
  const convertChance = clamp(xG * varianceMul(rng), 0.02, 0.62)

  const shooter = pickPlayerNearBall(
    formation,
    squad,
    team,
    ballX,
    ballY,
    'in',
    rng,
  )

  const events: MatchEvent[] = [
    {
      minute,
      type: 'shot',
      team,
      description: transition
        ? `${shooter.name} shoots on the break`
        : `${shooter.name} shoots`,
      xG,
      ballX,
      ballY,
      playerId: shooter.id,
      playerName: shooter.name,
    },
  ]

  const scored = rng() < convertChance
  if (scored) {
    events.push({
      minute,
      type: 'goal',
      team,
      description: `GOAL — ${shooter.name}`,
      xG,
      ballX,
      ballY,
      playerId: shooter.id,
      playerName: shooter.name,
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
  formation: TacticalSetup['formation']
  squad: Player[]
  rng: () => number
}): { events: MatchEvent[]; xG: number; scored: boolean; team: Team; ballX: number; ballY: number } {
  const { minute, team, tactics, attackRating, defenceRating, formation, squad, rng } =
    args
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
  xG = clamp(xG * varianceMul(rng), 0.02, 0.45)
  xG = round2(xG)
  const convertChance = clamp(xG * varianceMul(rng), 0.015, 0.5)

  const ballX = clamp01(0.35 + rng() * 0.3)
  const ballY = team === 'home' ? 0.92 : 0.08

  const taker = pickPlayerNearBall(
    formation,
    squad,
    team,
    ballX,
    ballY,
    'in',
    rng,
  )

  const events: MatchEvent[] = [
    {
      minute,
      type: 'set-piece',
      team,
      description: `${taker.name} ${type} — ${delivery} toward ${zone}${blockers}${runners}`,
      xG,
      ballX,
      ballY,
      playerId: taker.id,
      playerName: taker.name,
    },
  ]

  if (type === 'throw-in' || rng() > 0.7) {
    return { events, xG: 0, scored: false, team, ballX, ballY }
  }

  events.push({
    minute,
    type: 'shot',
    team,
    description: `${taker.name} header/shot from ${type}`,
    xG,
    ballX,
    ballY,
    playerId: taker.id,
    playerName: taker.name,
  })

  const scored = rng() < convertChance
  if (scored) {
    events.push({
      minute,
      type: 'goal',
      team,
      description: `GOAL — ${taker.name} from ${type}`,
      xG,
      ballX,
      ballY,
      playerId: taker.id,
      playerName: taker.name,
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
  return OPPOSITION_SITUATIONS[OPPOSITION_SITUATIONS.length - 1]!
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

function passDescription(
  name: string,
  isHome: boolean,
  buildUpPattern: string,
  situation: PressSituation,
  depth: number,
  rng: () => number,
): string {
  if (!isHome) {
    const away = [
      `${name} recycles possession`,
      `${name} works it sideways`,
      `${name} probes for space`,
    ]
    return away[Math.floor(rng() * away.length)]!
  }
  if (situation === 'build-up' || depth <= 1) {
    return `${name} builds (${buildUpPattern})`
  }
  if (situation === 'midfield') {
    const mid = [
      `${name} progresses through midfield`,
      `${name} switches the point of attack`,
      `${name} keeps the move alive (${buildUpPattern})`,
    ]
    return mid[Math.floor(rng() * mid.length)]!
  }
  const finalThird = [
    `${name} combines on the edge`,
    `${name} slips a ball into the channel`,
    `${name} shapes a cross-field pass`,
  ]
  return finalThird[Math.floor(rng() * finalThird.length)]!
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

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function clamp01(n: number) {
  return clamp(n, 0, 1)
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
