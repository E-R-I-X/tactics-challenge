import { useEffect, useState } from 'react'
import { useChallengeStore } from '../../store/challengeStore'
import { useMatchStore } from '../../store/matchStore'
import { EventFeed } from './EventFeed'
import { SubstitutionPanel } from './SubstitutionPanel'

export function LiveMatch() {
  const challenge = useChallengeStore((s) => s.challenge)
  const setPhase = useChallengeStore((s) => s.setPhase)
  const result = useMatchStore((s) => s.result)
  const [minute, setMinute] = useState(0)

  useEffect(() => {
    if (!result) return
    setMinute(0)
    const id = window.setInterval(() => {
      setMinute((m) => {
        if (m >= 90) {
          window.clearInterval(id)
          return 90
        }
        return m + 3
      })
    }, 280)
    return () => window.clearInterval(id)
  }, [result])

  useEffect(() => {
    if (minute >= 90 && result) {
      const t = window.setTimeout(() => setPhase('result'), 700)
      return () => window.clearTimeout(t)
    }
  }, [minute, result, setPhase])

  if (!result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-[var(--muted)]">No match loaded.</p>
        <button
          type="button"
          onClick={() => setPhase('tactics')}
          className="mt-4 text-[var(--accent)] underline"
        >
          Return to tactics
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <p className="text-sm text-[var(--muted)]">{challenge.fixture}</p>
        <h1 className="display text-5xl text-[var(--chalk)] md:text-6xl">
          Live Match
        </h1>
        <p className="mt-2 text-4xl font-semibold tabular-nums text-[var(--accent)]">
          {result.homeScore} – {result.awayScore}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {Math.min(minute, 90)}' · xG {result.homeXG} – {result.awayXG}
        </p>
        <div className="mx-auto mt-4 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full bg-[var(--accent)] transition-[width] duration-200"
            style={{ width: `${(Math.min(minute, 90) / 90) * 100}%` }}
          />
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]/90 p-4">
          <h2 className="mb-3 text-xl text-[var(--accent)]">Event Feed</h2>
          <EventFeed events={result.events} highlightMinute={minute} />
        </section>
        <SubstitutionPanel />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setPhase('result')}
          className="rounded border border-[var(--panel-border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--chalk)]"
        >
          Skip to result
        </button>
      </div>
    </div>
  )
}
