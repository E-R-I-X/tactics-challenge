import { useEffect } from 'react'
import { useChallengeStore } from '../../store/challengeStore'
import {
  liveSnapshot,
  PLAYBACK_SPEEDS,
  tickIntervalMs,
  useMatchStore,
  type PlaybackSpeed,
} from '../../store/matchStore'
import { useTacticsStore } from '../../store/tacticsStore'
import { ModeBadge } from '../ui/ModeBadge'
import { SegmentedControl } from '../ui/SegmentedControl'
import { EventFeed } from './EventFeed'
import { LivePitch } from './LivePitch'
import { LiveScoreboard } from './LiveScoreboard'
import { SubstitutionPanel } from './SubstitutionPanel'

const SPEED_OPTIONS: { value: string; label: string }[] = PLAYBACK_SPEEDS.map(
  (s) => ({ value: String(s), label: `${s}x` }),
)

export function LiveMatch() {
  const challenge = useChallengeStore((s) => s.challenge)
  const mode = useChallengeStore((s) => s.mode)
  const setPhase = useChallengeStore((s) => s.setPhase)
  const completeOfficialAttempt = useChallengeStore((s) => s.completeOfficialAttempt)
  const setup = useTacticsStore((s) => s.setup)
  const layouts = useTacticsStore((s) => s.layouts)
  const result = useMatchStore((s) => s.result)
  const minute = useMatchStore((s) => s.minute)
  const revealCount = useMatchStore((s) => s.revealCount)
  const goalHold = useMatchStore((s) => s.goalHold)
  const paused = useMatchStore((s) => s.paused)
  const playbackSpeed = useMatchStore((s) => s.playbackSpeed)
  const onPitchIds = useMatchStore((s) => s.onPitchIds)
  const tick = useMatchStore((s) => s.tick)
  const togglePause = useMatchStore((s) => s.togglePause)
  const setPaused = useMatchStore((s) => s.setPaused)
  const setMinute = useMatchStore((s) => s.setMinute)
  const setPlaybackSpeed = useMatchStore((s) => s.setPlaybackSpeed)

  useEffect(() => {
    if (!result || paused) return
    const ms = tickIntervalMs(playbackSpeed)
    const id = window.setInterval(() => tick(), ms)
    return () => window.clearInterval(id)
  }, [result, paused, tick, playbackSpeed])

  useEffect(() => {
    if (!result || minute < 90) return
    const atEnd = result.events.filter((e) => e.minute === 90).length
    if (revealCount < atEnd) return
    setPaused(true)
    if (mode === 'official') {
      completeOfficialAttempt(result, setup)
    }
    const t = window.setTimeout(() => setPhase('result'), 800)
    return () => window.clearTimeout(t)
  }, [
    minute,
    revealCount,
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

  const live = liveSnapshot(result, minute, revealCount)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8">
      <header className="text-center">
        <div className="mb-3 flex justify-center">
          <ModeBadge mode={mode} />
        </div>
        <p className="text-sm text-[var(--muted)]">{challenge.fixture}</p>
        <h1 className="display mt-1 text-5xl text-[var(--chalk)] md:text-6xl">
          Live Match
        </h1>
        <LiveScoreboard
          homeScore={live.homeScore}
          awayScore={live.awayScore}
          homeXG={live.homeXG}
          awayXG={live.awayXG}
          minute={minute}
          justScored={live.justScored}
          goalHold={goalHold > 0}
        />
        <div className="mx-auto mt-4 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full bg-[var(--accent)] transition-[width] duration-150"
            style={{ width: `${(minute / 90) * 100}%` }}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={togglePause}
            className="rounded border border-[var(--panel-border)] px-4 py-2 text-sm text-[var(--chalk)] hover:border-[var(--accent)]/40"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <SegmentedControl
            ariaLabel="Match playback speed"
            options={SPEED_OPTIONS}
            value={String(playbackSpeed)}
            onChange={(v) => setPlaybackSpeed(Number(v) as PlaybackSpeed)}
          />
          <button
            type="button"
            onClick={() => {
              setMinute(90)
              setPaused(true)
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

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr_0.85fr]">
        <section className="min-h-[280px] rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]/90 p-3">
          <h2 className="mb-2 text-sm uppercase tracking-wide text-[var(--accent)]">
            Pitch
          </h2>
          <LivePitch
            formation={setup.formation}
            homeSquad={challenge.homeSquad}
            awaySquad={challenge.awaySquad}
            homeBench={challenge.homeBench}
            onPitchIds={onPitchIds}
            ballX={live.ballX}
            ballY={live.ballY}
            possession={live.possession}
            currentEvent={live.currentEvent}
            tactics={setup}
            layouts={layouts}
          />
        </section>

        <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]/90 p-4">
          <h2 className="mb-3 text-xl text-[var(--accent)]">Event Feed</h2>
          <EventFeed
            events={live.events}
            highlightMinute={minute}
            compact
            autoScroll
          />
        </section>

        <SubstitutionPanel />
      </div>
    </div>
  )
}
