import { useMemo } from 'react'
import type { Formation, MatchEvent, ModeLayouts, Player } from '../../types'
import type { PitchTactics } from '../../lib/playerSlots'
import {
  abbreviateName,
  assignSquadToSlots,
  awayPhasePosition,
  crowdingScale,
  homePhasePosition,
  nameInitials,
  pickLabeledPlayerIds,
  separateTokens,
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
  /** User tactics — reshape phase positions (FB width, press line, etc.). */
  tactics?: PitchTactics
  /** Optional In/Out layouts from the tactics board. */
  layouts?: ModeLayouts
  className?: string
}

interface PitchToken {
  id: string
  label: string
  initial: string
  team: 'home' | 'away'
  x: number
  y: number
  active: boolean
  named: boolean
  slotId: string
}

const TWEEN_MS = 420

/**
 * Live match pitch: both XIs as named tokens, shaped by phase + tactics,
 * with smooth tweens, spacing, and decluttered labels.
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
  tactics,
  layouts,
  className = '',
}: LivePitchProps) {
  const eventType = currentEvent?.type
  const highlightId = currentEvent?.playerId

  const homePhase = teamPhase('home', possession, eventType)
  const awayPhase = teamPhase('away', possession, eventType)

  const rawHome = useMemo(() => {
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
      const override =
        homePhase === 'transition'
          ? undefined
          : layouts?.[homePhase]?.[row.slotId]
      const pos = homePhasePosition(
        formation,
        row.slotId,
        homePhase,
        tactics,
        override,
      )
      const label = abbreviateName(row.player.name)
      return {
        id: row.player.id,
        label,
        initial: nameInitials(row.player.name),
        team: 'home' as const,
        x: pos.x,
        y: pos.y,
        active: highlightId === row.player.id,
        named: false,
        slotId: row.slotId,
      }
    })
  }, [
    formation,
    homeSquad,
    homeBench,
    onPitchIds,
    homePhase,
    highlightId,
    tactics,
    layouts,
  ])

  const rawAway = useMemo(() => {
    const rows = assignSquadToSlots(formation, awaySquad)
    return rows.map((row) => {
      // Away has no custom board layout — phase + shared tactics only.
      const pos = awayPhasePosition(formation, row.slotId, awayPhase, tactics)
      const label = abbreviateName(row.player.name)
      return {
        id: row.player.id,
        label,
        initial: nameInitials(row.player.name),
        team: 'away' as const,
        x: pos.x,
        y: pos.y,
        active: highlightId === row.player.id,
        named: false,
        slotId: row.slotId,
      }
    })
  }, [formation, awaySquad, awayPhase, highlightId, tactics])

  const tokens: PitchToken[] = useMemo(() => {
    const merged = separateTokens([...rawAway, ...rawHome], 0.082, 14)
    // Quantize ball for label picks so names don't flicker every tick
    const qx = Math.round(ballX * 8) / 8
    const qy = Math.round(ballY * 8) / 8
    const labeled = pickLabeledPlayerIds(
      merged,
      qx,
      qy,
      possession,
      highlightId,
      3,
    )
    return merged.map((t) => ({
      ...t,
      named: labeled.has(t.id),
    }))
  }, [rawAway, rawHome, ballX, ballY, possession, highlightId])

  const scale = crowdingScale(tokens, 0.09)

  // Park the ball on the event player so carrier + ball read as one unit.
  // Fall back to sim ball coords when nobody is highlighted.
  const displayBall = useMemo(() => {
    if (!highlightId) return { x: ballX, y: ballY }
    const carrier = tokens.find((t) => t.id === highlightId)
    if (!carrier) return { x: ballX, y: ballY }
    // Offset sideways so the surname plate under the token stays readable
    return {
      x: Math.min(0.94, Math.max(0.06, carrier.x + 0.034)),
      y: Math.min(0.94, Math.max(0.06, carrier.y)),
    }
  }, [ballX, ballY, highlightId, tokens])

  const bx = toSvgX(displayBall.x)
  const by = toSvgY(displayBall.y)

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
            'linear-gradient(180deg, #071a14 0%, #0a241c 40%, #081f18 100%)',
        }}
      >
        <defs>
          <linearGradient id="live-pitch-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#148056" />
            <stop offset="50%" stopColor="#116b48" />
            <stop offset="100%" stopColor="#0e5a3c" />
          </linearGradient>
          <pattern
            id="live-pitch-noise"
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.35" fill="#0a2e24" opacity="0.2" />
            <circle cx="3" cy="2.5" r="0.28" fill="#1a8a5c" opacity="0.12" />
          </pattern>
          <filter id="token-shadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow
              dx="0"
              dy="0.55"
              stdDeviation="0.55"
              floodColor="#000"
              floodOpacity="0.55"
            />
          </filter>
          <filter id="token-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="ball-shadow" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow
              dx="0.2"
              dy="0.6"
              stdDeviation="0.45"
              floodColor="#000"
              floodOpacity="0.65"
            />
          </filter>
          <radialGradient id="ball-grad" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fffef8" />
            <stop offset="55%" stopColor="#f0ebe0" />
            <stop offset="100%" stopColor="#c8c0b0" />
          </radialGradient>
        </defs>

        {/* Touchline padding */}
        <rect x="0" y="0" width="100" height="140" fill="#061510" />
        <rect x="4" y="4" width="92" height="132" fill="url(#live-pitch-grad)" />
        <rect x="4" y="4" width="92" height="132" fill="url(#live-pitch-noise)" />

        {/* Mowing stripes — subtle, less visual noise */}
        {Array.from({ length: 10 }, (_, i) => (
          <rect
            key={`stripe-${i}`}
            x="4"
            y={4 + (132 / 10) * i}
            width="92"
            height={132 / 10}
            fill={i % 2 === 0 ? '#135c40' : '#116b48'}
            opacity="0.4"
          />
        ))}

        {/* Markings — higher contrast, cleaner stroke */}
        <g
          fill="none"
          stroke="#f2f7f3"
          strokeWidth="0.5"
          opacity="0.92"
          strokeLinejoin="round"
        >
          <rect x="4" y="4" width="92" height="132" />
          <line x1="4" y1="70" x2="96" y2="70" />
          <circle cx="50" cy="70" r="11" />
          <circle cx="50" cy="70" r="0.85" fill="#f2f7f3" stroke="none" />

          {/* Top (away) box */}
          <rect x="24" y="4" width="52" height="22" />
          <rect x="36" y="4" width="28" height="8" />
          <circle cx="50" cy="18" r="0.7" fill="#f2f7f3" stroke="none" />
          <path d="M 39 26 A 11 11 0 0 0 61 26" />

          {/* Bottom (home) box */}
          <rect x="24" y="114" width="52" height="22" />
          <rect x="36" y="128" width="28" height="8" />
          <circle cx="50" cy="122" r="0.7" fill="#f2f7f3" stroke="none" />
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
          opacity="0.05"
          style={{
            transition: `y ${TWEEN_MS}ms ease-out, fill ${TWEEN_MS}ms ease-out`,
          }}
        />

        {/* Players — away first so home draws on top near overlaps */}
        {tokens.map((t) => {
          const cx = toSvgX(t.x)
          const cy = toSvgY(t.y)
          const isHome = t.team === 'home'
          const baseR = t.active ? 3.35 : t.named ? 2.75 : 2.45
          const r = baseR * scale
          const plateW = Math.max(10, t.label.length * 2.05)
          // Flip name plate above when near the bottom touchline
          const plateBelow = cy < 128
          const plateY = plateBelow ? r + 0.7 : -(r + 3.7)
          return (
            <g
              key={t.id}
              style={{
                transform: `translate(${cx}px, ${cy}px)`,
                transition: `transform ${TWEEN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                willChange: 'transform',
              }}
              filter={
                t.active
                  ? 'url(#token-glow)'
                  : 'url(#token-shadow)'
              }
            >
              {t.active && (
                <circle
                  r={r + 2.0}
                  fill="none"
                  stroke="#c8f542"
                  strokeWidth="0.75"
                  opacity="0.9"
                >
                  <animate
                    attributeName="opacity"
                    values="0.9;0.35;0.9"
                    dur="1.15s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                r={r}
                fill={isHome ? '#f5f8f3' : '#1e3a5c'}
                stroke={
                  t.active
                    ? '#c8f542'
                    : isHome
                      ? '#b8d94a'
                      : '#8ec4f0'
                }
                strokeWidth={t.active ? 0.95 : 0.65}
              />
              {/* Inner highlight for depth */}
              <circle
                cx={-r * 0.22}
                cy={-r * 0.28}
                r={r * 0.32}
                fill="#fff"
                opacity={isHome ? 0.32 : 0.22}
                style={{ pointerEvents: 'none' }}
              />
              <text
                y="0.85"
                textAnchor="middle"
                fontSize={t.active ? 2.15 : 1.9}
                fontWeight="700"
                fontFamily="DM Sans, sans-serif"
                fill={isHome ? '#0a1612' : '#f0f6fb'}
                style={{ pointerEvents: 'none' }}
              >
                {t.initial.slice(0, t.named || t.active ? 2 : 1)}
              </text>
              {/* Surname only for ball carrier / nearby / event player */}
              {(t.active || t.named) && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={-plateW / 2}
                    y={plateY}
                    width={plateW}
                    height="3.0"
                    rx="0.55"
                    fill="#0a1612"
                    opacity={t.active ? 0.9 : 0.72}
                  />
                  <text
                    y={plateY + 2.15}
                    textAnchor="middle"
                    fontSize="1.9"
                    fontWeight="700"
                    fontFamily="DM Sans, sans-serif"
                    fill={t.active ? '#c8f542' : '#c8d0ca'}
                  >
                    {t.label}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* Ball — follows events with the same tween feel */}
        <g
          filter="url(#ball-shadow)"
          style={{
            transform: `translate(${bx}px, ${by}px)`,
            transition: `transform ${TWEEN_MS + 80}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            willChange: 'transform',
          }}
        >
          <circle r="2.55" fill="url(#ball-grad)" stroke="#111" strokeWidth="0.45" />
          <circle cx="-0.5" cy="-0.55" r="0.55" fill="#fff" opacity="0.6" />
          <path
            d="M -1 0.15 Q 0 -0.35 1 0.1"
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="0.28"
            opacity="0.5"
          />
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
