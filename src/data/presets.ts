import type { PressingTriggerId, TacticalSetup } from '../types'

const DEFAULT_TRIGGERS: PressingTriggerId[] = ['cb-back-pass', 'poor-first-touch']

export const DEFAULT_TACTICS: TacticalSetup = {
  formation: '4-3-3',
  inPossessionShape: '2-3-5',
  outOfPossessionShape: '4-4-2 mid-block',
  pressingTriggers: DEFAULT_TRIGGERS,
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
      blockers: true,
      screeningRunners: true,
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
      pressingTriggers: [
        'gk-back-pass',
        'cb-back-pass',
        'poor-first-touch',
        'wide-areas',
      ],
      tempo: 'high',
      risk: 'aggressive',
      outOfPossessionShape: '4-3-3 high block',
      buildUpPattern: 'direct-into-channels',
      restDefence: '2-2',
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
      buildUpPattern: 'dropping-six',
      pressingTriggers: ['facing-own-goal', 'cb-back-pass'],
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
      pressingTriggers: ['wide-areas'],
      buildUpPattern: 'patient-circulation',
      setPieces: [
        {
          type: 'corner',
          delivery: 'out-swing',
          targetZone: 'edge-of-box',
          blockers: false,
          screeningRunners: false,
        },
      ],
    },
  },
]
