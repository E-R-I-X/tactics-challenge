import type { SetPieceRoutine, TacticalSetup } from '../types'

export type PressSituation = 'build-up' | 'midfield' | 'final-third'

/**
 * Higher press intensity → more ball wins.
 * Situation nudges: pressing in build-up is easier; final-third press is harder.
 */
export function getPressSuccessModifier(
  setup: TacticalSetup,
  situation: PressSituation,
): number {
  const intensity =
    setup.pressIntensity === 'very-high'
      ? 0.22
      : setup.pressIntensity === 'high'
        ? 0.14
        : setup.pressIntensity === 'medium'
          ? 0.06
          : -0.04

  const situationNudge =
    situation === 'build-up' ? 0.05 : situation === 'midfield' ? 0.02 : -0.03

  const counterPress = setup.counterPress ? 0.04 : 0
  const triggers = Math.min(0.06, setup.pressingTriggers.length * 0.015)

  return intensity + situationNudge + counterPress + triggers
}

/**
 * High press + aggressive risk increases transition danger after turnovers.
 * Strong rest defence (3-2 / 2-3) reduces transition xG conceded.
 */
export function getTransitionRiskModifier(setup: TacticalSetup): number {
  const pressRisk =
    setup.pressIntensity === 'very-high'
      ? 0.18
      : setup.pressIntensity === 'high'
        ? 0.12
        : setup.pressIntensity === 'medium'
          ? 0.05
          : 0

  const riskProfile =
    setup.risk === 'aggressive' ? 0.06 : setup.risk === 'safe' ? -0.04 : 0

  const restDefenceShield =
    setup.restDefence === '3-2' || setup.restDefence === '2-3'
      ? -0.1
      : setup.restDefence === '3-1'
        ? -0.04
        : 0.02

  return pressRisk + riskProfile + restDefenceShield
}

/**
 * Overload / dropping patterns improve progression; direct is slightly worse.
 */
export function getBuildUpSuccessModifier(setup: TacticalSetup): number {
  const pattern = setup.buildUpPattern
  let patternMod = 0
  if (
    pattern === 'overload-left' ||
    pattern === 'overload-right' ||
    pattern === 'dropping-six'
  ) {
    patternMod = 0.1
  } else if (
    pattern === 'short-from-back' ||
    pattern === 'patient-circulation'
  ) {
    patternMod = 0.05
  } else if (pattern === 'direct-into-channels') {
    patternMod = -0.03
  }

  const tempoMod =
    setup.tempo === 'high' ? 0.03 : setup.tempo === 'slow' ? -0.02 : 0

  const riskMod =
    setup.risk === 'aggressive' ? 0.04 : setup.risk === 'safe' ? -0.02 : 0

  return patternMod + tempoMod + riskMod
}

/**
 * In-swing deliveries into the six-yard box boost set-piece xG.
 */
export function getSetPieceXGModifier(
  setup: TacticalSetup,
  type: SetPieceRoutine['type'],
): number {
  const routines = setup.setPieces.filter((r) => r.type === type)
  const routine = routines[0] ?? setup.setPieces[0]
  if (!routine) return 0

  let mod = 0
  if (routine.delivery === 'in-swing') mod += 0.08
  else if (routine.delivery === 'out-swing') mod += 0.03
  else if (routine.delivery === 'short') mod -= 0.02

  const zone = routine.targetZone.toLowerCase()
  if (
    zone.includes('six') ||
    zone.includes('6-yard') ||
    zone.includes('six-yard') ||
    zone === 'near-post'
  ) {
    mod += 0.06
  } else if (zone.includes('far') || zone.includes('edge')) {
    mod += 0.02
  }

  if (type === 'corner') mod += 0.02
  if (type === 'free-kick') mod += 0.03

  return mod
}
