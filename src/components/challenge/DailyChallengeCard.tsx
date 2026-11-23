import { comparisonMessage, compareToRealManager } from '../../lib/compareResult'
import { useChallengeStore } from '../../store/challengeStore'
import { useMatchStore } from '../../store/matchStore'
import { useTacticsStore } from '../../store/tacticsStore'
import { SquadOverview } from './SquadOverview'

export function DailyChallengeCard() {
  const challenge = useChallengeStore((s) => s.challenge)
  const acceptChallenge = useChallengeStore((s) => s.acceptChallenge)
  const startPractice = useChallengeStore((s) => s.startPractice)
  const officialLocked = useChallengeStore((s) => s.officialLocked)
  const todaysAttempt = useChallengeStore((s) => s.todaysAttempt)
  const resetTactics = useTacticsStore((s) => s.reset)
  const clearMatch = useMatchStore((s) => s.clear)

  const startOfficial = () => {
    if (officialLocked) return
    resetTactics()
    clearMatch()
    acceptChallenge()
  }

  const startPracticeMode = () => {
    resetTactics()
    clearMatch()
    startPractice()
  }

  const attemptOutcome =
    todaysAttempt && officialLocked
      ? compareToRealManager(todaysAttempt.result, challenge.realManagerScore)
      : null

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
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startOfficial}
                disabled={officialLocked}
                className="rounded bg-[var(--accent)] px-6 py-3 text-base font-semibold text-[var(--ink)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {officialLocked ? 'Challenge completed' : 'Accept Challenge'}
              </button>
              <button
                type="button"
                onClick={startPracticeMode}
                className="rounded border border-[var(--panel-border)] px-6 py-3 text-base text-[var(--chalk)] hover:border-[var(--accent)]/40"
              >
                Practice mode
              </button>
            </div>
          </div>

          {todaysAttempt && officialLocked && (
            <div className="mt-8 max-w-md rounded-lg border border-[var(--panel-border)] bg-black/30 px-4 py-4">
              <p className="text-sm uppercase tracking-wide text-[var(--muted)]">
                Today&apos;s official result
              </p>
              <p className="mt-1 text-3xl tabular-nums text-[var(--chalk)]">
                {todaysAttempt.result.homeScore} –{' '}
                {todaysAttempt.result.awayScore}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                xG {todaysAttempt.result.homeXG.toFixed(2)} –{' '}
                {todaysAttempt.result.awayXG.toFixed(2)}
              </p>
              {attemptOutcome && (
                <p className="mt-2 text-[var(--accent)]">
                  {comparisonMessage(attemptOutcome)}
                </p>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <SquadOverview title="Your Squad" players={challenge.homeSquad} />
        <SquadOverview title="Opposition" players={challenge.awaySquad} />
      </div>
    </div>
  )
}
