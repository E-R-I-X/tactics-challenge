import { comparisonHeadline, compareToRealManager } from '../../lib/compareResult'
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
            Same squad · same fixture
          </p>
          <h1 className="max-w-xl text-5xl leading-none text-[var(--chalk)] md:text-7xl">
            Tactics Challenge
          </h1>
          <p className="mt-4 max-w-lg text-base text-[var(--muted)] md:text-lg">
            {challenge.brief}
          </p>
          <div className="mt-8">
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
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {/* Daily — official, one attempt */}
        <div className="relative flex flex-col overflow-hidden rounded-xl border border-[var(--accent)]/35 bg-gradient-to-b from-[var(--accent)]/12 to-[var(--panel)]/90 p-6">
          <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-sm bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink)]" aria-hidden />
            Daily Challenge
          </span>
          <h2 className="display text-3xl text-[var(--chalk)]">One official attempt</h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
            Locked squad vs the real result. Your scoreboard for the day — no
            resets once you finish.
          </p>
          <ul className="mt-4 space-y-1.5 text-xs text-[var(--muted)]">
            <li>· Single attempt per day</li>
            <li>· Fixed fixture &amp; squad</li>
            <li>· Compared to real manager {challenge.realManagerScore.home}–
              {challenge.realManagerScore.away}
            </li>
          </ul>
          <button
            type="button"
            onClick={startOfficial}
            disabled={officialLocked}
            className="mt-6 w-full rounded bg-[var(--accent)] px-6 py-3 text-base font-semibold text-[var(--ink)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {officialLocked ? 'Challenge completed' : 'Accept Challenge'}
          </button>

          {todaysAttempt && officialLocked && (
            <div className="mt-4 rounded-lg border border-[var(--panel-border)] bg-black/30 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                Today&apos;s official result
              </p>
              <p className="mt-1 text-2xl tabular-nums text-[var(--chalk)]">
                {todaysAttempt.result.homeScore} –{' '}
                {todaysAttempt.result.awayScore}
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                xG {todaysAttempt.result.homeXG.toFixed(2)} –{' '}
                {todaysAttempt.result.awayXG.toFixed(2)}
              </p>
              {attemptOutcome && (
                <p className="mt-2 text-sm text-[var(--accent)]">
                  {comparisonHeadline(attemptOutcome)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Practice — unlimited */}
        <div className="relative flex flex-col overflow-hidden rounded-xl border border-[var(--panel-border)] bg-[var(--panel)]/90 p-6">
          <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-sm border border-[var(--panel-border)] bg-black/35 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--chalk)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--warn)]" aria-hidden />
            Practice Mode
          </span>
          <h2 className="display text-3xl text-[var(--chalk)]">Unlimited runs</h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
            Experiment freely — change tactics, re-sim, and learn what beats a
            low block without burning today&apos;s official attempt.
          </p>
          <ul className="mt-4 space-y-1.5 text-xs text-[var(--muted)]">
            <li>· Unlimited matches</li>
            <li>· Reset &amp; retune anytime</li>
            <li>· Same squad, no daily lock</li>
          </ul>
          <button
            type="button"
            onClick={startPracticeMode}
            className="mt-6 w-full rounded border border-[var(--panel-border)] px-6 py-3 text-base text-[var(--chalk)] transition hover:border-[var(--accent)]/50 hover:bg-black/20"
          >
            Enter Practice
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <SquadOverview title="Your Squad" players={challenge.homeSquad} />
        <SquadOverview title="Opposition" players={challenge.awaySquad} />
      </div>
    </div>
  )
}
