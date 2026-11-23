import { useEffect } from 'react'
import { useChallengeStore } from '../../store/challengeStore'
import { liveSnapshot, useMatchStore } from '../../store/matchStore'
import { useTacticsStore } from '../../store/tacticsStore'
import { EventFeed } from './EventFeed'
import { MiniPitch } from './MiniPitch'
import { SubstitutionPanel } from './SubstitutionPanel'

export function LiveMatch() {
  const challenge = useChallengeStore((s) => s.challenge)
  const mode = useChallengeStore((s) => s.mode)
  const setPhase = useChallengeStore((s) => s.setPhase)
  const completeOfficialAttempt = useChallengeStore((s) => s.completeOfficialAttempt)
  const setup = useTacticsStore((s) => s.setup)
  const result = useMatchStore((s) => s.result)
  const minute = useMatchStore((s) => s.minute)
  const paused = useMatchStore((s) => s.paused)
  const tick = useMatchStore((s) => s.tick)
  const togglePause = useMatchStore((s) => s.togglePause)
  const setPaused = useMatchStore((s) => s.setPaused)

  useEffect(() => {
    if (!result || paused) return
    const id = window.setInterval(() => tick(), 120)
    return () => window.clearInterval(id)
  }, [result, paused, tick])

  useEffect(() => {
    if (!result || minute < 90) return
    setPaused(true)
    if (mode === 'official') {
      completeOfficialAttempt(result, setup)
    }
    const t = window.setTimeout(() => setPhase('result'), 800)
    return () => window.clearTimeout(t)
  }, [
    minute,
    result,
    mode,
    setup,
    completeOfficialAttempt,
    setPhase,
    setPaused,
  ])

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

  const live = liveSnapshot(result, minute)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-8">
      <header className="text-center">
        <p className="text-sm text-[var(--muted)]">
          {challenge.fixture}
          {mode === 'practice' ? ' · Practice' : ' · Official'}
        </p>
        <h1 className="display text-5xl text-[var(--chalk)] md:text-6xl">
          Live Match
        </h1>
        <p className="mt-2 text-4xl font-semibold tabular-nums text-[var(--accent)]">
          {live.homeScore} – {live.awayScore}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {minute}' · xG {live.homeXG.toFixed(2)} – {live.awayXG.toFixed(2)}
        </p>
        <div className="mx-auto mt-4 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full bg-[var(--accent)] transition-[width] duration-150"
            style={{ width: `${(minute / 90) * 100}%` }}
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={togglePause}
            className="rounded border border-[var(--panel-border)] px-4 py-2 text-sm text-[var(--chalk)] hover:border-[var(--accent)]/40"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (mode === 'official' && result) {
                completeOfficialAttempt(result, setup)
              }
              setPhase('result')
            }}
            className="rounded border border-[var(--panel-border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--chalk)]"
          >
            Skip to result
          </button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr_0.85fr]">
        <section className="min-h-[240px] rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]/90 p-3">
          <h2 className="mb-2 text-sm uppercase tracking-wide text-[var(--accent)]">
            Pitch
          </h2>
          <div className="aspect-square w-full max-w-sm mx-auto">
            <MiniPitch ballX={live.ballX} ballY={live.ballY} />
          </div>
        </section>

        <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]/90 p-4">
          <h2 className="mb-3 text-xl text-[var(--accent)]">Event Feed</h2>
          <EventFeed events={result.events} highlightMinute={minute} />
        </section>

        <SubstitutionPanel />
      </div>
    </div>
  )
}
