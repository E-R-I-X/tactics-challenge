import type { TacticalSetup } from '../types'

export const DEFAULT_TACTICS: TacticalSetup = {
  formation: '4-3-3',
  inPossessionShape: '2-3-5',
  outOfPossessionShape: '4-4-2 mid-block',
  pressingTriggers: ['back-pass', 'loose-touch'],
  pressIntensity: 'medium',
  counterPress: true,
  restDefence: '2-3',
  buildUpPattern: 'short-from-back',
  tempo: 'balanced',
  risk: 'balanced',
  setPieces: [
    {
      type: 'corner',
      delivery: 'in-swing',
      targetZone: 'six-yard',
    },
  ],
}

export const TACTIC_PRESETS: { id: string; name: string; setup: TacticalSetup }[] = [
  {
    id: 'high-press',
    name: 'High Press',
    setup: {
      ...DEFAULT_TACTICS,
      pressIntensity: 'very-high',
      counterPress: true,
      pressingTriggers: ['goal-kick', 'back-pass', 'wide-trap'],
      tempo: 'high',
      risk: 'aggressive',
      outOfPossessionShape: '4-3-3 high block',
    },
  },
  {
    id: 'control',
    name: 'Control',
    setup: {
      ...DEFAULT_TACTICS,
      formation: '4-2-3-1',
      pressIntensity: 'medium',
      tempo: 'balanced',
      restDefence: '3-2',
      buildUpPattern: 'patient-circulation',
    },
  },
  {
    id: 'low-block',
    name: 'Low Block',
    setup: {
      ...DEFAULT_TACTICS,
      formation: '5-3-2',
      pressIntensity: 'low',
      counterPress: false,
      tempo: 'slow',
      risk: 'safe',
      outOfPossessionShape: '5-4-1 low block',
      restDefence: '3-1',
    },
  },
]
