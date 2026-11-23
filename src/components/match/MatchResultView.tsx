import { useChallengeStore } from '../../store/challengeStore'
import { useMatchStore } from '../../store/matchStore'
import { EventFeed } from './EventFeed'

export function MatchResultView() {
  const challenge = useChallengeStore((s) => s.challenge)
  const setPhase = useChallengeStore((s) => s.setPhase)
  const backToLobby = useChallengeStore((s) => s.backToLobby)
  const result = useMatchStore((s) => s.result)

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

  const beatDraw = result.homeScore > result.awayScore

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="text-center">
        <p className="text-sm uppercase tracking-[0.15em] text-[var(--accent)]">
          Full Time
        </p>
        <h1 className="mt-2 text-5xl text-[var(--chalk)] md:text-6xl">
          {result.homeScore} – {result.awayScore}
        </h1>
        <p className="mt-2 text-[var(--muted)]">{challenge.fixture}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          xG {result.homeXG} – {result.awayXG}
        </p>
        <p
          className={`mt-4 text-lg ${beatDraw ? 'text-[var(--accent)]' : 'text-[var(--warn)]'}`}
        >
          {beatDraw
            ? 'You beat the real manager’s draw.'
            : `Benchmark: ${challenge.realManagerResult}`}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Beat the real manager — comparison detail coming soon.
        </p>
      </header>

      <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]/90 p-4">
        <h2 className="mb-3 text-xl text-[var(--accent)]">Match Timeline</h2>
        <EventFeed events={result.events} highlightMinute={90} />
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => setPhase('tactics')}
          className="rounded border border-[var(--panel-border)] px-5 py-2.5 text-sm text-[var(--chalk)] hover:border-[var(--accent)]/40"
        >
          Tweak Tactics
        </button>
        <button
          type="button"
          onClick={backToLobby}
          className="rounded bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)]"
        >
          Back to Lobby
        </button>
      </div>
    </div>
  )
}
