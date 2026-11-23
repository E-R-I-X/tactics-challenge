# Tactics Challenge

Web-first football tactics simulation game. Prove you are a better manager than the real one using the same squad and fixture.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Zustand
- React Konva

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3847](http://localhost:3847).

## Flow

1. **Lobby** — accept the daily challenge and review squads
2. **Tactics** — set formation, pressing, rest defence, build-up
3. **Match** — stub simulation with a live event feed
4. **Result** — final score, xG, and timeline

See `PROJECT_STRUCTURE.md` for the full folder layout.

## Scripts

| Command           | Description             |
| ----------------- | ----------------------- |
| `npm run dev`     | Dev server on port 3847 |
| `npm run build`   | Production build        |
| `npm run preview` | Preview production      |
| `npm run lint`    | Oxlint                  |
