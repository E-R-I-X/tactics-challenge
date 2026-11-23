import { DailyChallengeCard } from './components/challenge/DailyChallengeCard'
import { LiveMatch } from './components/match/LiveMatch'
import { MatchResultView } from './components/match/MatchResultView'
import { TacticsBoard } from './components/tactics/TacticsBoard'
import { useChallengeStore } from './store/challengeStore'

export default function App() {
  const phase = useChallengeStore((s) => s.phase)

  switch (phase) {
    case 'tactics':
      return <TacticsBoard />
    case 'match':
      return <LiveMatch />
    case 'result':
      return <MatchResultView />
    case 'lobby':
    default:
      return <DailyChallengeCard />
  }
}
