import { useEffect, useRef, useState } from 'react'

interface LiveScoreboardProps {
  homeScore: number
  awayScore: number
  homeXG: number
  awayXG: number
  minute: number
  justScored: boolean
  goalHold: boolean
}

function useAnimatedNumber(target: number, durationMs: number) {
  const [value, setValue] = useState(target)
  const valueRef = useRef(target)
  const frameRef = useRef(0)

  useEffect(() => {
    const from = valueRef.current
    if (Math.abs(from - target) < 0.001) {
      valueRef.current = target
      setValue(target)
      return
    }
    const start = performance.now()
    cancelAnimationFrame(frameRef.current)

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - (1 - t) * (1 - t)
      const next = from + (target - from) * eased
      valueRef.current = next
      setValue(next)
      if (t < 1) frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, durationMs])

  return value
}

export function LiveScoreboard({
  homeScore,
  awayScore,
  homeXG,
  awayXG,
  minute,
  justScored,
  goalHold,
}: LiveScoreboardProps) {
  const [displayedScore, setDisplayedScore] = useState({
    home: homeScore,
    away: awayScore,
  })
  const [scoreFlash, setScoreFlash] = useState(false)
  const prevScore = useRef({ home: homeScore, away: awayScore })

  useEffect(() => {
    const changed =
      homeScore !== prevScore.current.home ||
      awayScore !== prevScore.current.away
    if (!changed) return

    // Delay the digit change slightly so the goal cue lands first
    setScoreFlash(true)
    const delay = justScored || goalHold ? 320 : 80
    const show = window.setTimeout(() => {
      setDisplayedScore({ home: homeScore, away: awayScore })
      prevScore.current = { home: homeScore, away: awayScore }
    }, delay)
    const clearFlash = window.setTimeout(() => setScoreFlash(false), delay + 520)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(clearFlash)
    }
  }, [homeScore, awayScore, justScored, goalHold])

  const animHomeXG = useAnimatedNumber(homeXG, 520)
  const animAwayXG = useAnimatedNumber(awayXG, 520)

  const celebrate = justScored || goalHold || scoreFlash

  return (
    <div className="relative">
      {celebrate && (
        <p
          className="pointer-events-none absolute inset-x-0 -top-7 animate-[goalPulse_0.7s_ease-out] text-center text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)]"
          aria-live="polite"
        >
          Goal
        </p>
      )}
      <p
        className={`mt-3 text-5xl font-semibold tabular-nums tracking-tight transition duration-300 md:text-6xl ${
          celebrate
            ? 'scale-105 text-[var(--accent)]'
            : 'scale-100 text-[var(--accent)]'
        }`}
      >
        <span
          className={`inline-block transition duration-300 ${
            scoreFlash ? 'opacity-100' : ''
          }`}
        >
          {displayedScore.home}
        </span>
        <span className="mx-2 text-3xl text-[var(--muted)]">–</span>
        <span className="inline-block transition duration-300">
          {displayedScore.away}
        </span>
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        <span className="tabular-nums text-[var(--chalk)]">{minute}'</span>
        {' · '}
        xG{' '}
        <span className="tabular-nums text-[var(--chalk)] transition-colors duration-300">
          {animHomeXG.toFixed(2)}
        </span>
        {' – '}
        <span className="tabular-nums text-[var(--chalk)] transition-colors duration-300">
          {animAwayXG.toFixed(2)}
        </span>
      </p>
    </div>
  )
}
