import { useChallengeStore } from '../../store/challengeStore'
import { useMatchStore } from '../../store/matchStore'
import { useTacticsStore } from '../../store/tacticsStore'
import { SquadOverview } from './SquadOverview'

export function DailyChallengeCard() {
  const challenge = useChallengeStore((s) => s.challenge)
  const acceptChallenge = useChallengeStore((s) => s.acceptChallenge)
  const resetTactics = useTacticsStore((s) => s.reset)
  const clearMatch = useMatchStore((s) => s.clear)

  const start = () => {
    resetTactics()
    clearMatch()
    acceptChallenge()
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="relative overflow-hidden rounded-xl border border-[var(--panel-border)] bg-[var(--panel)]/80">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(135deg, transparent 40%, #145a40 40%, #145a40 42%, transparent 42%), linear-gradient(180deg, #0c3b2e 0%, transparent 70%)',
            backgroundSize: '24px 24px, 100% 100%',
          }}
        />
        <div className="relative px-6 py-10 md:px-10 md:py-14">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[var(--accent)]">
            Daily Challenge
          </p>
          <h1 className="max-w-xl text-5xl leading-none text-[var(--chalk)] md:text-7xl">
            Tactics Challenge
          </h1>
          <p className="mt-4 max-w-lg text-base text-[var(--muted)] md:text-lg">
            {challenge.brief}
          </p>
          <div className="mt-8 flex flex-wrap items-end gap-6">
            <div>
              <p className="display text-3xl text-[var(--chalk)] md:text-4xl">
                {challenge.title}
              </p>
              <p className="mt-1 text-[var(--muted)]">
                {challenge.fixture} · {challenge.venue} · {challenge.kickoff}
              </p>
              <p className="mt-1 text-sm text-[var(--warn)]">
                {challenge.realManagerResult}
              </p>
            </div>
            <button
              type="button"
              onClick={start}
              className="rounded bg-[var(--accent)] px-6 py-3 text-base font-semibold text-[var(--ink)] transition hover:brightness-110"
            >
              Accept Challenge
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <SquadOverview title="Your Squad" players={challenge.homeSquad} />
        <SquadOverview title="Opposition" players={challenge.awaySquad} />
      </div>
    </div>
  )
}
