import type {
  PressingTriggerId,
  SetPieceRoutine,
  TacticalSetup,
} from '../types'

export type PressSituation = 'build-up' | 'midfield' | 'final-third'

/** Baseline press success rate before intensity / trigger multipliers. */
export const BASE_PRESS_SUCCESS = 0.22

/**
 * Multiplier on ball-win success from press intensity.
 * Very high ≈ 1.6–1.8× so high-press tactics diverge sharply from low block.
 */
export function getPressIntensityMultiplier(setup: TacticalSetup): number {
  switch (setup.pressIntensity) {
    case 'very-high':
      return 1.7
    case 'high':
      return 1.35
    case 'medium':
      return 1.05
    case 'low':
      return 0.75
  }
}

/**
 * Trigger match → strong press bonus; no match → dampened / no press.
 * Returns a multiplier applied on top of intensity (≈0.55–1.55).
 */
export function getPressTriggerMultiplier(
  setup: TacticalSetup,
  situation: PressingTriggerId | null,
): number {
  if (!situation) return 0.7
  const armed = setup.pressingTriggers.includes(situation)
  if (armed) {
    // Selected trigger fires — strong bonus; more triggers slightly help recognition
    const breadth = 1 + Math.min(0.08, setup.pressingTriggers.length * 0.015)
    return 1.45 * breadth
  }
  // Situation does not match selected triggers — weak / no press
  return 0.55
}

/**
 * Combined additive-style nudge kept for call sites that still want a delta.
 * Prefer the multipliers above for new logic.
 */
export function getPressSuccessModifier(
  setup: TacticalSetup,
  situation: PressSituation,
  trigger: PressingTriggerId | null = null,
): number {
  const intensityMul = getPressIntensityMultiplier(setup)
  const triggerMul = getPressTriggerMultiplier(setup, trigger)
  const situationNudge =
    situation === 'build-up' ? 0.04 : situation === 'midfield' ? 0.015 : -0.03
  const counterPress = setup.counterPress ? 0.04 : 0

  // Convert multipliers into an additive delta around the baseline
  const scaled = BASE_PRESS_SUCCESS * intensityMul * triggerMul
  return scaled - BASE_PRESS_SUCCESS + situationNudge + counterPress
}

/**
 * Multiplier on transition xG conceded when the opposition breaks.
 * Rest defence 3-2 / 2-3 → ~0.55–0.65×. Very high press raises the base risk.
 */
export function getTransitionRiskMultiplier(setup: TacticalSetup): number {
  const pressRisk =
    setup.pressIntensity === 'very-high'
      ? 1.65
      : setup.pressIntensity === 'high'
        ? 1.35
        : setup.pressIntensity === 'medium'
          ? 1.1
          : 0.9

  const riskProfile =
    setup.risk === 'aggressive' ? 1.12 : setup.risk === 'safe' ? 0.9 : 1

  const restShield =
    setup.restDefence === '3-2' || setup.restDefence === '2-3'
      ? 0.58
      : setup.restDefence === '3-1'
        ? 0.82
        : 1.05

  return pressRisk * riskProfile * restShield
}

/**
 * Higher = more dangerous transitions against (used as additive risk chance).
 * Derived from the multiplier so existing sim maths keep working.
 */
export function getTransitionRiskModifier(setup: TacticalSetup): number {
  const mul = getTransitionRiskMultiplier(setup)
  // Map ~0.5–1.9× onto a roughly -0.08…0.28 additive band around a 0.12 baseline
  return (mul - 1) * 0.18
}

/**
 * Progression success multiplier from build-up pattern.
 * Overloads / dropping midfielder ≈ 1.25–1.4×.
 */
export function getBuildUpSuccessMultiplier(setup: TacticalSetup): number {
  const pattern = setup.buildUpPattern
  let patternMul = 1
  if (pattern === 'dropping-six') patternMul = 1.35
  else if (pattern === 'overload-left' || pattern === 'overload-right')
    patternMul = 1.3
  else if (pattern === 'inverted-fullbacks') patternMul = 1.28
  else if (
    pattern === 'short-from-back' ||
    pattern === 'patient-circulation'
  )
    patternMul = 1.08
  else if (pattern === 'direct-into-channels') patternMul = 1.15

  const tempoMul =
    setup.tempo === 'high' ? 1.06 : setup.tempo === 'slow' ? 0.94 : 1
  const riskMul =
    setup.risk === 'aggressive' ? 1.05 : setup.risk === 'safe' ? 0.96 : 1

  return patternMul * tempoMul * riskMul
}

/**
 * Additive build-up nudge (legacy-compatible).
 */
export function getBuildUpSuccessModifier(setup: TacticalSetup): number {
  return (getBuildUpSuccessMultiplier(setup) - 1) * 0.55
}

/**
 * Extra progress distance for direct / high-tempo patterns.
 */
export function getBuildUpProgressSpeed(setup: TacticalSetup): number {
  if (setup.buildUpPattern === 'direct-into-channels') return 1.45
  if (setup.tempo === 'high') return 1.2
  if (setup.tempo === 'slow') return 0.85
  return 1
}

/**
 * Dangerous turnover risk while progressing — direct is faster but riskier.
 * Returns a probability nudge (0–~0.35).
 */
export function getBuildUpTurnoverRisk(setup: TacticalSetup): number {
  if (setup.buildUpPattern === 'direct-into-channels') {
    return 0.28 + (setup.risk === 'aggressive' ? 0.06 : 0)
  }
  if (setup.buildUpPattern === 'dropping-six') return 0.08
  if (
    setup.buildUpPattern === 'overload-left' ||
    setup.buildUpPattern === 'overload-right' ||
    setup.buildUpPattern === 'inverted-fullbacks'
  ) {
    return 0.12
  }
  if (setup.buildUpPattern === 'patient-circulation') return 0.1
  return 0.14
}

/**
 * Side bias for overload / inverted FB patterns. -1 left, +1 right, 0 centre.
 */
export function getBuildUpSideBias(setup: TacticalSetup): number {
  if (
    setup.buildUpPattern === 'overload-left' ||
    setup.buildUpPattern === 'inverted-fullbacks'
  )
    return -1
  if (setup.buildUpPattern === 'overload-right') return 1
  return 0
}

/**
 * Bonus when the ball is on the preferred overload side (0–0.12).
 */
export function getSideProgressBonus(
  setup: TacticalSetup,
  ballX: number,
): number {
  const bias = getBuildUpSideBias(setup)
  if (bias === 0) return 0
  if (bias < 0 && ballX < 0.42) return 0.12
  if (bias > 0 && ballX > 0.58) return 0.12
  if (bias < 0 && ballX > 0.58) return -0.04
  if (bias > 0 && ballX < 0.42) return -0.04
  return 0.02
}

/**
 * Multiplier on set-piece xG. In-swing + six-yard + blockers ≈ 1.4–1.6×.
 */
export function getSetPieceXGMultiplier(
  setup: TacticalSetup,
  type: SetPieceRoutine['type'],
): number {
  const routines = setup.setPieces.filter((r) => r.type === type)
  const routine = routines[0] ?? setup.setPieces[0]
  if (!routine) return 1

  let mul = 1

  if (routine.delivery === 'in-swing') mul *= 1.18
  else if (routine.delivery === 'out-swing') mul *= 1.06
  else if (routine.delivery === 'short') mul *= 0.88

  const zone = routine.targetZone.toLowerCase()
  const sixYard =
    zone.includes('six') ||
    zone.includes('6-yard') ||
    zone.includes('six-yard') ||
    zone === 'near-post'
  if (sixYard) mul *= 1.16
  else if (zone.includes('far') || zone.includes('edge') || zone.includes('penalty'))
    mul *= 1.05

  if (routine.blockers) mul *= 1.12
  if (routine.screeningRunners) mul *= 1.06

  if (type === 'corner') mul *= 1.04
  if (type === 'free-kick') mul *= 1.05

  // Cap the stacked combo in the 1.4–1.6 band for the headline routine
  if (
    routine.delivery === 'in-swing' &&
    sixYard &&
    routine.blockers
  ) {
    mul = Math.max(mul, 1.45)
    mul = Math.min(mul, 1.6)
  }

  return mul
}

/**
 * Additive set-piece xG nudge derived from the multiplier.
 */
export function getSetPieceXGModifier(
  setup: TacticalSetup,
  type: SetPieceRoutine['type'],
): number {
  const mul = getSetPieceXGMultiplier(setup, type)
  // Map 0.85–1.6× onto roughly -0.03…0.18 around a 0.12 base corner
  return (mul - 1) * 0.28
}
