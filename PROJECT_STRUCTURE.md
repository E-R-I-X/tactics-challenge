# Tactics Challenge – Project Structure

Web-first football tactics simulation game.  
Core fantasy: Prove you are a better manager than the real one using the exact same squad and fixture.

## Tech Stack (suggested)
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- State: Zustand
- Pitch rendering: React Konva or HTML Canvas
- Backend (later): Node/Express or Python (FastAPI) for simulation

## Folder Structure

```
src/
├── components/
│   ├── pitch/
│   │   ├── PitchCanvas.tsx
│   │   ├── PlayerToken.tsx
│   │   └── overlays/
│   ├── tactics/
│   │   ├── TacticsBoard.tsx
│   │   ├── PresetsPanel.tsx
│   │   ├── PressingPanel.tsx
│   │   ├── RestDefencePanel.tsx
│   │   ├── BuildUpPanel.tsx
│   │   ├── RolesPanel.tsx
│   │   └── SetPieceDesigner.tsx
│   ├── match/
│   │   ├── LiveMatch.tsx
│   │   ├── EventFeed.tsx
│   │   └── SubstitutionPanel.tsx
│   ├── challenge/
│   │   ├── DailyChallengeCard.tsx
│   │   └── SquadOverview.tsx
│   └── ui/
├── store/
│   ├── tacticsStore.ts
│   ├── matchStore.ts
│   └── challengeStore.ts
├── engine/
│   ├── simulation.ts          # Main event loop (stub first)
│   ├── modifiers.ts           # Tactical probability modifiers
│   ├── attributes.ts
│   └── setPieces.ts
├── data/
│   ├── presets.ts
│   ├── formations.ts
│   └── sampleSquads.ts
├── types/
│   └── index.ts
└── App.tsx
```

## First Milestone (Cursor)

1. Scaffold Vite + React + TS + Tailwind
2. Create the PitchCanvas component (basic 2D pitch)
3. Build TacticsBoard with In-Possession / Out-of-Possession toggle
4. Add basic control panels (Formation, Pressing, Rest Defence)
5. Create a simple simulation stub that accepts a tactic object and returns a fake result
6. Wire Daily Challenge lobby → Tactics → Match stub → Result

## Core Types (start with these)

```ts
export type Formation = '4-3-3' | '4-2-3-1' | '3-4-3' | '4-4-2' | '3-5-2';

export interface TacticalSetup {
  formation: Formation;
  inPossessionShape: string;
  outOfPossessionShape: string;
  pressingTriggers: string[];
  pressIntensity: 'low' | 'medium' | 'high' | 'very-high';
  restDefence: '3-2' | '2-3' | '3-1' | '2-2';
  buildUpPattern: string;
  tempo: 'slow' | 'balanced' | 'high';
  setPieces: SetPieceRoutine[];
}

export interface MatchResult {
  score: [number, number];
  xG: [number, number];
  events: MatchEvent[];
}
```
