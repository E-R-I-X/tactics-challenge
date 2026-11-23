import { useMemo } from 'react'
import type { Formation, MatchEvent, Player } from '../../types'
import {
  abbreviateName,
  assignSquadToSlots,
  awayPhasePosition,
  homePhasePosition,
  teamPhase,
} from '../../lib/playerSlots'

interface LivePitchProps {
  formation: Formation
  homeSquad: Player[]
  awaySquad: Player[]
  /** Include bench so substitutions resolve on the pitch. */
  homeBench?: Player[]
  /** Current on-pitch home ids (after subs). */
  onPitchIds?: string[]
  ballX: number
  ballY: number
  possession: 'home' | 'away'
  currentEvent: MatchEvent | null
  className?: string
}

/**
 * Live match pitch: both XIs as named tokens, shaped by phase,
 * with the event player highlighted when available.
 */
export function LivePitch({
  formation,
  homeSquad,
  awaySquad,
  homeBench = [],
  onPitchIds,
  ballX,
  ballY,
  possession,
  currentEvent,
  className = '',
}: LivePitchProps) {
  const eventType = currentEvent?.type
  const highlightId = currentEvent?.playerId

  const homePhase = teamPhase('home', possession, eventType)
  const awayPhase = teamPhase('away', possession, eventType)

  const homePlayers = useMemo(() => {
    const pool = [...homeSquad, ...homeBench]
    const xi: Player[] =
      onPitchIds && onPitchIds.length > 0
        ? onPitchIds
            .map((id) => pool.find((p) => p.id === id))
            .filter((p): p is Player => Boolean(p))
        : homeSquad.slice(0, 11)

    const rows = assignSquadToSlots(
      formation,
      xi.length === 11 ? xi : homeSquad.slice(0, 11),
    )
    return rows.map((row) => {
      const pos = homePhasePosition(formation, row.slotId, homePhase)
      const label = abbreviateName(row.player.name)
      return {
        id: row.player.id,
        label,
        initial: label.slice(0, 1),
        team: 'home' as const,
        x: pos.x,
        y: pos.y,
        active: highlightId === row.player.id,
      }
    })
  }, [formation, homeSquad, homeBench, onPitchIds, homePhase, highlightId])

  const awayPlayers = useMemo(() => {
    const rows = assignSquadToSlots(formation, awaySquad)
    return rows.map((row) => {
      const pos = awayPhasePosition(formation, row.slotId, awayPhase)
      const label = abbreviateName(row.player.name)
      return {
        id: row.player.id,
        label,
        initial: label.slice(0, 1),
        team: 'away' as const,
        x: pos.x,
        y: pos.y,
        active: highlightId === row.player.id,
      }
    })
  }, [formation, awaySquad, awayPhase, highlightId])

  const tokens = [...awayPlayers, ...homePlayers]
  const bx = toSvgX(ballX)
  const by = toSvgY(ballY)

  const phaseLabel =
    eventType === 'turnover' || eventType === 'press'
      ? 'Transition'
      : possession === 'home'
        ? 'Home in possession'
        : 'Away in possession'

  return (
    <div className={`relative w-full ${className}`}>
      <svg
        viewBox="0 0 100 140"
        className="h-full w-full overflow-hidden rounded-lg border border-[var(--panel-border)]"
        role="img"
        aria-label="Live match pitch with players"
        style={{
          background:
            'linear-gradient(180deg, #0a2e24 0%, #0f3d30 40%, #0c3328 100%)',
        }}
      >
        <defs>
          <linearGradient id="live-pitch-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16724c" />
            <stop offset="50%" stopColor="#126644" />
            <stop offset="100%" stopColor="#0f5a3c" />
          </linearGradient>
          <pattern
            id="live-pitch-noise"
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.4" fill="#0a2e24" opacity="0.25" />
            <circle cx="3" cy="2.5" r="0.3" fill="#1a8a5c" opacity="0.15" />
          </pattern>
          <filter id="token-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Touchline padding */}
        <rect x="0" y="0" width="100" height="140" fill="#081f18" />
        <rect x="4" y="4" width="92" height="132" fill="url(#live-pitch-grad)" />
        <rect x="4" y="4" width="92" height="132" fill="url(#live-pitch-noise)" />

        {/* Mowing stripes */}
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={`stripe-${i}`}
            x="4"
            y={4 + (132 / 12) * i}
            width="92"
            height={132 / 12}
            fill={i % 2 === 0 ? '#145a40' : '#126644'}
            opacity="0.55"
          />
        ))}

        {/* Markings */}
        <g
          fill="none"
          stroke="#e8f0e9"
          strokeWidth="0.55"
          opacity="0.85"
          strokeLinejoin="round"
        >
          <rect x="4" y="4" width="92" height="132" />
          <line x1="4" y1="70" x2="96" y2="70" />
          <circle cx="50" cy="70" r="11" />
          <circle cx="50" cy="70" r="0.9" fill="#e8f0e9" stroke="none" />

          {/* Top (away) box */}
          <rect x="24" y="4" width="52" height="22" />
          <rect x="36" y="4" width="28" height="8" />
          <circle cx="50" cy="18" r="0.8" fill="#e8f0e9" stroke="none" />
          <path d="M 39 26 A 11 11 0 0 0 61 26" />

          {/* Bottom (home) box */}
          <rect x="24" y="114" width="52" height="22" />
          <rect x="36" y="128" width="28" height="8" />
          <circle cx="50" cy="122" r="0.8" fill="#e8f0e9" stroke="none" />
          <path d="M 39 114 A 11 11 0 0 1 61 114" />

          {/* Corners */}
          <path d="M 4 8 A 4 4 0 0 0 8 4" />
          <path d="M 92 4 A 4 4 0 0 0 96 8" />
          <path d="M 4 132 A 4 4 0 0 1 8 136" />
          <path d="M 96 132 A 4 4 0 0 0 92 136" />
        </g>

        {/* Soft possession wash */}
        <rect
          x="4"
          y={possession === 'home' ? 70 : 4}
          width="92"
          height="66"
          fill={possession === 'home' ? '#c8f542' : '#5b9fd4'}
          opacity="0.06"
          className="transition-all duration-500"
        />

        {/* Players — away first so home draws on top near overlaps */}
        {tokens.map((t) => {
          const cx = toSvgX(t.x)
          const cy = toSvgY(t.y)
          const isHome = t.team === 'home'
          const r = t.active ? 4.2 : 3.35
          return (
            <g
              key={t.id}
              transform={`translate(${cx}, ${cy})`}
              filter={t.active ? 'url(#token-glow)' : undefined}
            >
              {t.active && (
                <circle
                  r={r + 2.2}
                  fill="none"
                  stroke="#c8f542"
                  strokeWidth="0.7"
                  opacity="0.95"
                >
                  <animate
                    attributeName="opacity"
                    values="0.95;0.35;0.95"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                r={r}
                fill={isHome ? '#f4f7f2' : '#1a3050'}
                stroke={
                  t.active ? '#c8f542' : isHome ? '#c8f542' : '#7eb6e8'
                }
                strokeWidth={t.active ? 0.9 : 0.55}
              />
              <text
                y="0.85"
                textAnchor="middle"
                fontSize="2.4"
                fontWeight="700"
                fontFamily="DM Sans, sans-serif"
                fill={isHome ? '#0a1612' : '#e8f0e9'}
                style={{ pointerEvents: 'none' }}
              >
                {t.initial}
              </text>
              {/* Full surname only on the active event player to avoid pile-ups */}
              {t.active && (
                <text
                  y={r + 2.4}
                  textAnchor="middle"
                  fontSize="2.2"
                  fontWeight="700"
                  fontFamily="DM Sans, sans-serif"
                  fill="#c8f542"
                  style={{ pointerEvents: 'none' }}
                >
                  {t.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Ball */}
        <g className="transition-all duration-300 ease-out">
          <circle
            cx={bx}
            cy={by}
            r="2.1"
            fill="#f4f0e6"
            stroke="#1a1a1a"
            strokeWidth="0.35"
          />
          <circle cx={bx - 0.4} cy={by - 0.4} r="0.45" fill="#fff" opacity="0.5" />
        </g>
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-wide text-[var(--muted)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#f4f7f2] ring-1 ring-[var(--accent)]" />
          Home
        </span>
        <span className="min-w-0 flex-1 text-center text-[var(--chalk)] normal-case tracking-normal">
          <span className="text-[var(--accent)]">{phaseLabel}</span>
          {currentEvent?.playerName ? (
            <span className="text-[var(--muted)]"> · {currentEvent.playerName}</span>
          ) : null}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#1a3050] ring-1 ring-[#7eb6e8]" />
          Away
        </span>
      </div>
    </div>
  )
}

function toSvgX(nx: number) {
  return 4 + nx * 92
}

function toSvgY(ny: number) {
  // Home attacks upward in data (y→1); SVG y grows down → flip
  return 4 + (1 - ny) * 132
}
