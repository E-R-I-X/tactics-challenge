export type Formation = '4-3-3' | '4-2-3-1' | '3-4-3' | '4-4-2' | '3-5-2' | '5-3-2'

export type PressIntensity = 'low' | 'medium' | 'high' | 'very-high'
export type Tempo = 'slow' | 'balanced' | 'high'
export type RestDefenceStructure = '3-2' | '2-3' | '3-1' | '2-2'

/** Canonical pressing trigger ids stored on TacticalSetup. */
export type PressingTriggerId =
  | 'gk-back-pass'
  | 'poor-first-touch'
  | 'facing-own-goal'
  | 'cb-back-pass'
  | 'wide-areas'

export interface Player {
  id: string
  name: string
  position: string
  attributes: {
    pace: number
    acceleration: number
    stamina: number
    passing: number
    dribbling: number
    finishing: number
    decisions: number
    anticipation: number
    composure: number
    tackling: number
  }
}

export interface SetPieceRoutine {
  type: 'corner' | 'free-kick' | 'throw-in'
  delivery: 'in-swing' | 'out-swing' | 'short'
  targetZone: string
  /** Screeners on the keeper / near-post blockers. */
  blockers: boolean
  /** Attackers making runs across the face / far post. */
  screeningRunners: boolean
}

export interface TacticalSetup {
  formation: Formation
  inPossessionShape: string
  outOfPossessionShape: string
  pressingTriggers: PressingTriggerId[]
  pressIntensity: PressIntensity
  counterPress: boolean
  restDefence: RestDefenceStructure
  buildUpPattern: string
  tempo: Tempo
  risk: 'safe' | 'balanced' | 'aggressive'
  setPieces: SetPieceRoutine[]
}

export type MatchEventType =
  | 'kickoff'
  | 'pass'
  | 'press'
  | 'turnover'
  | 'shot'
  | 'goal'
  | 'set-piece'
  | 'substitution'
  | 'half-time'
  | 'full-time'

export interface MatchEvent {
  minute: number
  type: MatchEventType | string
  description: string
  xG?: number
  team?: 'home' | 'away'
  /** Pitch coords: x 0–1 width, y 0–1 home goal → away goal. */
  ballX?: number
  ballY?: number
  /** Primary player involved (for live pitch highlight). */
  playerId?: string
  playerName?: string
}

export interface MatchResult {
  homeScore: number
  awayScore: number
  homeXG: number
  awayXG: number
  events: MatchEvent[]
  /** Seed used for this run — same seed → identical outcome. */
  seed: number
}

export interface Scoreline {
  home: number
  away: number
}

export type ChallengeMode = 'official' | 'practice'

export type AppPhase = 'lobby' | 'tactics' | 'match' | 'result'

export type PossessionMode = 'in' | 'out'

/** Normalized pitch coordinates: x 0–1 (left→right), y 0–1 (own goal→opp goal). */
export interface PitchPosition {
  x: number
  y: number
}

export type PitchLayout = Record<string, PitchPosition>

export interface ModeLayouts {
  in: PitchLayout
  out: PitchLayout
}

export type TacticsTabId =
  | 'presets'
  | 'formation'
  | 'pressing'
  | 'rest'
  | 'buildup'
  | 'roles'
  | 'setpieces'
