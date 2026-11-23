import type { MatchEvent } from '../../types'

interface EventFeedProps {
  events: MatchEvent[]
  highlightMinute?: number
  /** Tighter rows for the live panel. */
  compact?: boolean
  /** Post-match: goals, shots, set pieces, HT/FT — skip routine passes. */
  keyMomentsOnly?: boolean
}

const KEY_TYPES = new Set([
  'kickoff',
  'goal',
  'shot',
  'set-piece',
  'turnover',
  'substitution',
  'half-time',
  'full-time',
])

export function EventFeed({
  events,
  highlightMinute,
  compact = false,
  keyMomentsOnly = false,
}: EventFeedProps) {
  const rows = keyMomentsOnly
    ? events.filter((e) => KEY_TYPES.has(String(e.type)))
    : events

  return (
    <ol
      className={`overflow-y-auto pr-1 ${compact ? 'max-h-[28rem] space-y-1.5' : 'max-h-80 space-y-2'}`}
    >
      {rows.map((event, i) => {
        const active =
          highlightMinute !== undefined && event.minute <= highlightMinute
        const isCurrent =
          highlightMinute !== undefined &&
          event.minute === highlightMinute &&
          event.type !== 'half-time' &&
          event.type !== 'full-time'
        const isGoal = event.type === 'goal'
        const isShot = event.type === 'shot'

        return (
          <li
            key={`${event.minute}-${event.type}-${i}`}
            className={`rounded border px-3 transition ${
              compact ? 'py-1.5 text-xs' : 'py-2 text-sm'
            } ${
              isCurrent
                ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--chalk)]'
                : active
                  ? isGoal
                    ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--chalk)]'
                    : 'border-[var(--panel-border)] bg-black/20 text-[var(--chalk)]'
                  : 'border-transparent text-[var(--muted)] opacity-45'
            }`}
          >
            <span className="mr-2 font-semibold tabular-nums text-[var(--accent)]">
              {event.minute}'
            </span>
            {isGoal && (
              <span className="mr-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
                Goal
              </span>
            )}
            {isShot && !isGoal && (
              <span className="mr-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--warn)]">
                Shot
              </span>
            )}
            {event.description}
            {event.xG !== undefined && event.type !== 'goal' && (
              <span className="ml-2 text-[10px] tabular-nums text-[var(--muted)]">
                xG {event.xG.toFixed(2)}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
