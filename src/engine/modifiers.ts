import type { TacticalSetup } from '../types'

/**
 * Rough probability nudges from tactical choices (stub).
 * High press intensity slightly raises both attack and concession chance —
 * you win the ball higher, but leave more space behind.
 */
export function tacticalModifiers(setup: TacticalSetup) {
  const pressBoost =
    setup.pressIntensity === 'very-high'
      ? 0.12
      : setup.pressIntensity === 'high'
        ? 0.08
        : setup.pressIntensity === 'medium'
          ? 0.04
          : 0

  const tempoBoost =
    setup.tempo === 'high' ? 0.06 : setup.tempo === 'slow' ? -0.03 : 0

  const riskBoost =
    setup.risk === 'aggressive' ? 0.08 : setup.risk === 'safe' ? -0.04 : 0

  const counterPressBoost = setup.counterPress ? 0.03 : 0

  const triggerBoost = Math.min(0.05, setup.pressingTriggers.length * 0.015)

  const directBuildUp =
    setup.buildUpPattern === 'direct-into-channels' ? 0.04 : 0

  return {
    homeChanceBoost:
      pressBoost + tempoBoost + riskBoost + counterPressBoost + triggerBoost + directBuildUp,
    /** High press also increases xG against (space in behind). */
    awayChanceBoost: 0.02 + pressBoost * 0.65 + (setup.risk === 'aggressive' ? 0.03 : 0),
    eventVolatility: 0.5 + riskBoost + Math.abs(tempoBoost) + pressBoost * 0.5,
  }
}
