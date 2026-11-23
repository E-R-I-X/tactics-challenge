import { useState } from 'react'
import { comparisonMessage, compareToRealManager } from '../../lib/compareResult'
import { saveTactic } from '../../lib/dailyAttempt'
import { useChallengeStore } from '../../store/challengeStore'
import { useMatchStore } from '../../store/matchStore'
import { useTacticsStore } from '../../store/tacticsStore'
import { EventFeed } from './EventFeed'

export function MatchResultView() {
  const challenge = useChallengeStore((s) => s.challenge)
  const mode = useChallengeStore((s) => s.mode)
  const setPhase = useChallengeStore((s) => s.setPhase)
  const backToLobby = useChallengeStore((s) => s.backToLobby)
  const result = useMatchStore((s) => s.result)
  const setup = useTacticsStore((s) => s.setup)
  const [saved, setSaved] = useState(false)

  if (!result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-[var(--muted)]">No result yet.</p>
        <button
          type="button"
          onClick={() => setPhase('tactics')}
          className="mt-4 text-[var(--accent)] underline"
        >
          Set tactics
        </button>
      </div>
    )
  }

  const outcome = compareToRealManager(result, challenge.realManagerScore)
  const message = comparisonMessage(outcome)
  const tone =
    outcome === 'beat'
      ? 'text-[var(--accent)]'
      : outcome === 'worse'
        ? 'text-[var(--warn)]'
        : 'text-[var(--chalk)]'

  const onSave = () => {
    saveTactic(setup)
    setSaved(true)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="text-center">
        <p className="text-sm uppercase tracking-[0.15em] text-[var(--accent)]">
          Full Time{mode === 'practice' ? ' · Practice' : ''}
        </p>
        <h1 className="mt-2 text-5xl text-[var(--chalk)] md:text-6xl">
          {result.homeScore} – {result.awayScore}
        </h1>
        <p className="mt-2 text-[var(--muted)]">{challenge.fixture}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          xG {result.homeXG.toFixed(2)} – {result.awayXG.toFixed(2)}
        </p>

        <div className="mx-auto mt-6 max-w-md rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]/90 px-4 py-4">
          <p className="text-sm text-[var(--muted)]">vs real manager</p>
          <p className="mt-1 text-2xl tabular-nums text-[var(--chalk)]">
            {challenge.realManagerScore.home} – {challenge.realManagerScore.away}
          </p>
          <p className={`mt-3 text-lg font-semibold ${tone}`}>{message}</p>
        </div>
      </header>

      <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]/90 p-4">
        <h2 className="mb-3 text-xl text-[var(--accent)]">Match Timeline</h2>
        <EventFeed events={result.events} highlightMinute={90} />
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onSave}
          className="rounded border border-[var(--panel-border)] px-5 py-2.5 text-sm text-[var(--chalk)] hover:border-[var(--accent)]/40"
        >
          {saved ? 'Tactic saved' : 'Save tactic'}
        </button>
        {mode === 'practice' && (
          <button
            type="button"
            onClick={() => setPhase('tactics')}
            className="rounded border border-[var(--panel-border)] px-5 py-2.5 text-sm text-[var(--chalk)] hover:border-[var(--accent)]/40"
          >
            Tweak Tactics
          </button>
        )}
        <button
          type="button"
          onClick={backToLobby}
          className="rounded bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)]"
        >
          Back to home
        </button>
      </div>
    </div>
  )
}
