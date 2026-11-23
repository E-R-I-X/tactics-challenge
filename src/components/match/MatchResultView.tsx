import { useState } from 'react'
import {
  comparisonDetail,
  comparisonHeadline,
  compareToRealManager,
} from '../../lib/compareResult'
import { saveTactic } from '../../lib/dailyAttempt'
import { useChallengeStore } from '../../store/challengeStore'
import { useMatchStore } from '../../store/matchStore'
import { useTacticsStore } from '../../store/tacticsStore'
import { ModeBadge } from '../ui/ModeBadge'
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
  const headline = comparisonHeadline(outcome)
  const detail = comparisonDetail(outcome)
  const tone =
    outcome === 'beat'
      ? {
          border: 'border-[var(--accent)]/50',
          bg: 'bg-[var(--accent)]/10',
          title: 'text-[var(--accent)]',
        }
      : outcome === 'worse'
        ? {
            border: 'border-[var(--warn)]/45',
            bg: 'bg-[var(--warn)]/10',
            title: 'text-[var(--warn)]',
          }
        : {
            border: 'border-[var(--panel-border)]',
            bg: 'bg-black/25',
            title: 'text-[var(--chalk)]',
          }

  const onSave = () => {
    saveTactic(setup)
    setSaved(true)
  }

  const goals = result.events.filter((e) => e.type === 'goal')

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="text-center">
        <div className="mb-3 flex justify-center">
          <ModeBadge mode={mode} />
        </div>
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
          Full Time
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">{challenge.fixture}</p>

        <p className="display mt-4 text-7xl leading-none tracking-tight text-[var(--chalk)] md:text-8xl">
          <span className="text-[var(--accent)]">{result.homeScore}</span>
          <span className="mx-3 text-4xl text-[var(--muted)] md:text-5xl">–</span>
          <span>{result.awayScore}</span>
        </p>

        <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3">
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]/90 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
              Your xG
            </p>
            <p className="mt-1 text-2xl tabular-nums text-[var(--chalk)]">
              {result.homeXG.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]/90 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
              Opp xG
            </p>
            <p className="mt-1 text-2xl tabular-nums text-[var(--chalk)]">
              {result.awayXG.toFixed(2)}
            </p>
          </div>
        </div>

        <div
          className={`mx-auto mt-6 max-w-md rounded-lg border px-5 py-5 ${tone.border} ${tone.bg}`}
        >
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
            vs real manager · {challenge.realManagerScore.home}–
            {challenge.realManagerScore.away}
          </p>
          <p className={`display mt-2 text-3xl leading-none md:text-4xl ${tone.title}`}>
            {headline}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            {detail}
          </p>
        </div>
      </header>

      {goals.length > 0 && (
        <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]/90 px-4 py-4">
          <h2 className="mb-3 text-sm uppercase tracking-wide text-[var(--accent)]">
            Goals
          </h2>
          <ul className="space-y-2">
            {goals.map((g, i) => (
              <li
                key={`goal-${g.minute}-${i}`}
                className="flex items-baseline gap-3 text-sm"
              >
                <span className="w-8 tabular-nums font-semibold text-[var(--accent)]">
                  {g.minute}'
                </span>
                <span className="text-[var(--chalk)]">
                  {g.playerName ?? g.description.replace(/^GOAL — /, '')}
                </span>
                <span className="text-xs uppercase text-[var(--muted)]">
                  {g.team}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]/90 p-4">
        <h2 className="mb-3 text-xl text-[var(--accent)]">Match Timeline</h2>
        <EventFeed
          events={result.events}
          highlightMinute={90}
          keyMomentsOnly
          unbounded
        />
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
