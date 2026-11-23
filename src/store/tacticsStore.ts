import { create } from 'zustand'
import { layoutFromFormation } from '../data/pitchLayouts'
import { DEFAULT_TACTICS } from '../data/presets'
import type {
  Formation,
  ModeLayouts,
  PitchPosition,
  PossessionMode,
  PressIntensity,
  PressingTriggerId,
  RestDefenceStructure,
  SetPieceRoutine,
  TacticalSetup,
  Tempo,
} from '../types'

const FORMATION_SHAPES: Record<
  Formation,
  { inPossession: string; outOfPossession: string }
> = {
  '4-3-3': { inPossession: '2-3-5', outOfPossession: '4-4-2 mid-block' },
  '4-2-3-1': { inPossession: '2-4-4', outOfPossession: '4-4-1-1 mid-block' },
  '3-4-3': { inPossession: '3-2-5', outOfPossession: '5-2-3 mid-block' },
  '4-4-2': { inPossession: '2-4-4', outOfPossession: '4-4-2 mid-block' },
  '3-5-2': { inPossession: '3-2-5', outOfPossession: '5-3-2 mid-block' },
  '5-3-2': { inPossession: '3-4-3', outOfPossession: '5-4-1 low block' },
}

interface TacticsState {
  setup: TacticalSetup
  possessionMode: PossessionMode
  layouts: ModeLayouts
  setPossessionMode: (mode: PossessionMode) => void
  setFormation: (formation: Formation) => void
  setPressIntensity: (pressIntensity: PressIntensity) => void
  setRestDefence: (restDefence: RestDefenceStructure) => void
  setTempo: (tempo: Tempo) => void
  setBuildUpPattern: (buildUpPattern: string) => void
  setCounterPress: (counterPress: boolean) => void
  togglePressingTrigger: (trigger: PressingTriggerId) => void
  updateSetPiece: (index: number, patch: Partial<SetPieceRoutine>) => void
  movePlayer: (id: string, position: PitchPosition, mode?: PossessionMode) => void
  resetLayouts: () => void
  applyPreset: (setup: TacticalSetup) => void
  reset: () => void
}

const initialLayouts = layoutFromFormation(DEFAULT_TACTICS.formation)

export const useTacticsStore = create<TacticsState>((set) => ({
  setup: { ...DEFAULT_TACTICS },
  possessionMode: 'in',
  layouts: initialLayouts,
  setPossessionMode: (possessionMode) => set({ possessionMode }),
  setFormation: (formation) =>
    set((s) => {
      const shapes = FORMATION_SHAPES[formation]
      return {
        setup: {
          ...s.setup,
          formation,
          inPossessionShape: shapes.inPossession,
          outOfPossessionShape: shapes.outOfPossession,
        },
        layouts: layoutFromFormation(formation),
      }
    }),
  setPressIntensity: (pressIntensity) =>
    set((s) => ({ setup: { ...s.setup, pressIntensity } })),
  setRestDefence: (restDefence) =>
    set((s) => ({ setup: { ...s.setup, restDefence } })),
  setTempo: (tempo) => set((s) => ({ setup: { ...s.setup, tempo } })),
  setBuildUpPattern: (buildUpPattern) =>
    set((s) => ({ setup: { ...s.setup, buildUpPattern } })),
  setCounterPress: (counterPress) =>
    set((s) => ({ setup: { ...s.setup, counterPress } })),
  togglePressingTrigger: (trigger) =>
    set((s) => {
      const has = s.setup.pressingTriggers.includes(trigger)
      return {
        setup: {
          ...s.setup,
          pressingTriggers: has
            ? s.setup.pressingTriggers.filter((t) => t !== trigger)
            : [...s.setup.pressingTriggers, trigger],
        },
      }
    }),
  updateSetPiece: (index, patch) =>
    set((s) => ({
      setup: {
        ...s.setup,
        setPieces: s.setup.setPieces.map((r, i) =>
          i === index ? { ...r, ...patch } : r,
        ),
      },
    })),
  movePlayer: (id, position, mode) =>
    set((s) => {
      const active = mode ?? s.possessionMode
      return {
        layouts: {
          ...s.layouts,
          [active]: {
            ...s.layouts[active],
            [id]: {
              x: Math.min(1, Math.max(0, position.x)),
              y: Math.min(1, Math.max(0, position.y)),
            },
          },
        },
      }
    }),
  resetLayouts: () =>
    set((s) => ({ layouts: layoutFromFormation(s.setup.formation) })),
  applyPreset: (setup) =>
    set({
      setup: { ...setup },
      layouts: layoutFromFormation(setup.formation),
    }),
  reset: () =>
    set({
      setup: { ...DEFAULT_TACTICS },
      possessionMode: 'in',
      layouts: layoutFromFormation(DEFAULT_TACTICS.formation),
    }),
}))
